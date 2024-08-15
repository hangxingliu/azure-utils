import { URL } from "node:url";
import * as fs from "node:fs";
import * as path from "node:path";

import { envVarUsage } from "./helper.js";

import { AzureStorageEnv } from "../utils/azure/env.js";
import { createSASForBlob } from "../utils/azure/blob/blob-sas.js";
import { getAzureBlobHost, getAzureBlobURL, getAzureProtocol } from "../utils/azure/types.js";
import { getFileMD5Base64 } from "../utils/azure/crypto.js";

import { loadEnvFiles } from "../utils/env.js";
import { Logger } from "../utils/logger.js";
import { getHumanReadableFileSize } from "../utils/file.js";
import { downlaodToStream } from "../utils/download.js";

const logger = new Logger(`AzDownload`);
main().catch(logger.fatal);

function usage() {
  const bin = 'az-download';
  console.log([
    '',
    `  Usage: ${bin} <remoteFile> [localFile/localDir] [options...]`,
    '',
    '  Options:',
    '',
    '    --env       <envFile>        [multiple] load env variables from files if they are existed',
    '    --exp       <expiration>     expiration minutes or a positive number with the support units: m, h, d, min, hour, day, minutes, hours, days',
    '    --url                        do not download the file but get the url for the resource',
    '    --container <containerName>  provide container name (this argument has a higher priority than environment variable)',
    '    --verbose                    print verbose logs',
    '    --public                     do not sign the url(add SAS) before downloading or printing',
    '',
    ...envVarUsage,
    '  Example:',
    '',
    `    ${bin} file.tar /path/to/local`,
    `    ${bin} file.tar /path/to/local/file2.tar`,
    `    ${bin} file.tar --url`,
    `    ${bin} xxxx.blob.windows.net/file.zip local-file.zip`,
    ''
  ].join('\n'));
  process.exit(0);
}
function version() {
  console.log(global['__version'] ? `v${global['__version']}` : 'unknown');
  process.exit(0);
}

async function main() {
  const allArgv = process.argv.slice(2);

  let local: string;
  let remote: string;
  let exp: string;
  let verbose = false;
  let onlyURL = false;
  let signURL = true;
  let overwriteContainer: string;
  const envFiles: string[] = [];

  let afterDoubleDash = false;
  for (let i = 0; i < allArgv.length; i++) {
    const arg = allArgv[i];
    const getNextArg = () => {
      const nextArg = allArgv[++i];
      if (!nextArg) throw new Error(`Option '${arg}' requires argument`);
      return nextArg;
    }
    const resolvePositionalArgs = () => {
      if (!remote) return remote = arg;
      if (!local) return local = arg;
      throw new Error(`Unknown argument '${arg}'`);
    }

    if (afterDoubleDash) {
      resolvePositionalArgs();
      continue;
    }
    switch (arg) {
      case '--': afterDoubleDash = true; break;
      case '-h':
      case '--help':
        return usage();
      case '-V':
      case '--version':
        return version();
      case '--url':
        onlyURL = true;
        logger.setLogDest('stderr');
        break;
      case '--exp':
        exp = getNextArg();
        break;
      case '--container':
        overwriteContainer = getNextArg();
        break;
      case '--env':
        envFiles.push(getNextArg());
        break;
      case '--verbose':
        verbose = true;
        logger.setVerbose(true);
        break;
      case '--public':
        signURL = false;
        break;
      default: resolvePositionalArgs();
    }
  }
  const isToStdout = local === '-';
  if (isToStdout) logger.setLogDest('stderr');

  if (!remote) return usage();
  if (!local) local = '.';

  let expiryMinutes: number | undefined;
  if (exp) {
    expiryMinutes = parseExpiration(exp);
    if (typeof expiryMinutes !== 'number')
      throw new Error(`The given expiration "${exp}" is invalid`);
  }

  loadEnvFiles(envFiles);

  const connect = new AzureStorageEnv();
  if (overwriteContainer) connect.container = overwriteContainer;
  connect.assertKey();
  connect.assertContainer();

  let blob: string;
  let exactMatchedURL = true
  let remoteURL = safeParseURL(remote);
  const azureHost = getAzureBlobHost(connect);
  if (!remoteURL) {
    exactMatchedURL = false;
    remoteURL = safeParseURL(`${getAzureProtocol(connect)}://${remote}`);
  }
  if (remoteURL) {
    if (remoteURL.hostname === azureHost) {
      const mtx = remoteURL.pathname.match(/^\/([\w-]+)\/(.+)$/);
      if (!mtx)
        throw new Error(`Unsupported URL "${remoteURL.toString()}"`);
      connect.endpointProtocol = remoteURL.protocol.replace(':', '');
      connect.container = mtx[1];
      blob = mtx[2];
      logger.log(`container=${mtx[1]} blob=${mtx[2]}`);
    } else {
      if (exactMatchedURL)
        throw new Error(`The host "${remoteURL.hostname}" is not matched the host "${azureHost}" from Azure connection info`);
    }
  }
  if (!blob) blob = remote.replace(/^\//, '');

  let targetFile: string;

  if (isToStdout) {
    logger.log(`local=<stdout>`);
  } else if (!onlyURL) {
    let localAsDir = false;
    try {
      const stat = fs.statSync(local);
      if (stat.isDirectory())
        localAsDir = true;
    } catch (error) { }

    if (localAsDir) {
      targetFile = path.join(local, path.basename(blob));
    } else {
      targetFile = local;
    }
    logger.log(`local=${targetFile}`);
  }

  let finalURL: string;
  if (signURL) {
    const result = createSASForBlob({ connect, blob, expiryMinutes });
    finalURL = result.url;
  } else {
    finalURL = getAzureBlobURL(connect, blob);
  }

  if (onlyURL)
    return console.log(finalURL);

  const startedAt = Date.now();
  const localFileName = isToStdout ? 'stdout' : `"${path.basename(targetFile)}"`;
  const stream = isToStdout
    ? process.stdout
    : fs.createWriteStream(targetFile);
  const { contentMD5 } = await downlaodToStream({
    url: finalURL,
    stream,
    progressInterval: verbose ? 2000 : 5000,
    logger: {
      log: msg => logger.log(msg),
      error: msg => logger.error(msg),
      progress: (_now, _all, elapsed) => {
        const percent = _all >= 0 ? ((_now / _all * 100).toFixed(2) + '%') : '--';
        const now = getHumanReadableFileSize(_now);
        const all = getHumanReadableFileSize(_all);
        logger.log(`progress=${percent} [${now}/${all}] +${elapsed}s`);
      }
    }
  });
  if (!isToStdout) (stream as fs.WriteStream).close();

  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  logger.log(`downloaded to ${localFileName} +${elapsed}s`);

  if (!isToStdout && contentMD5) {
    const localMD5 = await getFileMD5Base64(targetFile);
    if (contentMD5 !== localMD5)
      throw new Error(`md5sums are different between local and remote, local md5sum is "${localMD5}"`);
  }
}

function safeParseURL(url: string) {
  try {
    return new URL(url);
  } catch (error) {
    return null;
  }
}

/** @returns minutes */
function parseExpiration(exp: string): number | undefined {
  const mtx = (exp || '').match(/^(\d+(?:\.\d+)?)(m|h|d|min|hours?|days?|minutes)?$/);
  if (!mtx) return;

  const num = parseFloat(mtx[1]);
  if (isNaN(num)) return;

  const unit = mtx[2][0];
  if (unit == 'd') return num * 24 * 60;
  if (unit == 'h') return num * 60;
  return num;
}

import { URL } from "node:url";

import { envVarUsage } from "./helper.js";

import { AzureStorageEnv } from "../utils/azure/env.js";
import { azDelBlob } from "../utils/azure/blob/del-blob.js";
import { getAzureBlobHost, getAzureProtocol } from "../utils/azure/types.js";

import { loadEnvFiles } from "../utils/env.js";
import { Logger } from "../utils/logger.js";

const logger = new Logger(`AzDelBlob`);
main().catch(logger.fatal);

function usage() {
  const bin = 'az-del-blob';
  console.log([
    '',
    `  Usage: ${bin} <remoteFiles...>`,
    '',
    '  Options:',
    '',
    '    --env       <envFile>        [multiple] load env variables from files if they are existed',
    '    --container <containerName>  provide container name (this argument has a higher priority than environment variable)',
    '    --verbose                    print verbose logs',
    '',
    ...envVarUsage,
    '  Example:',
    '',
    `    ${bin} file.tar file2.tar`,
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

  let remoteFiles: string[] = [];
  let overwriteContainer: string | undefined;
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
      return remoteFiles.push(arg);
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
      case '--container':
        overwriteContainer = getNextArg();
        break;
      case '--env':
        envFiles.push(getNextArg());
        break;
      case '--verbose':
        logger.setVerbose(true);
        break;
      default: resolvePositionalArgs();
    }
  }
  if (remoteFiles.length === 0) return usage();

  loadEnvFiles(envFiles);

  const connect = new AzureStorageEnv();
  if (overwriteContainer) connect.container = overwriteContainer;
  connect.assertKey();
  connect.assertContainer();

  let blobs: string[] = [];
  for (let i = 0; i < remoteFiles.length; i++) {
    const remote = remoteFiles[i];

    let blob: string | undefined;
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
    blobs.push(blob);
  }

  const startedAt = Date.now();
  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    await azDelBlob({ connect, blob, logger });
    logger.log(`[${i + 1}/${blobs.length}] deleted "${blob}"`);
  }
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const noun = blobs.length > 1 ? `blobs` : `blob`;
  logger.log(`deleted ${blobs.length} ${noun} +${elapsed}s`);
}

function safeParseURL(url: string) {
  try {
    return new URL(url);
  } catch (error) {
    return null;
  }
}

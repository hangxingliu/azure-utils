import * as path from "node:path";

import { envVarUsage, onFatal } from "./helper.js";

import { azPutBlob } from "../utils/azure/blob/put-blob.js";
import { azCopyBlob } from "../utils/azure/blob/copy-blob.js";
import { azPutBlockList } from "../utils/azure/blob/put-block-list.js";
import { azPutBlock } from "../utils/azure/blob/put-block.js";
import { getBlocksFormLocalFile } from "../utils/azure/blob/block-helper.js";
import { AzureStorageEnv } from "../utils/azure/env.js";
import { getFileMD5Base64, uuidv4 } from "../utils/crypto.js";

import { loadEnvFiles } from "../utils/env.js";
import { Logger } from "../utils/logger.js";
import { networkRetry as _networkRetry } from "../utils/network-retry.js";
import { fileStat, getHumanReadableFileSize } from "../utils/file.js";
import { getContentTypeByExt } from "../utils/content-type.js";

const logger = new Logger(`AzUpload`);
main().catch(e => onFatal(logger, e));

function usage() {
  const bin = 'az-upload';
  console.log([
    '',
    `  Usage: ${bin} <localFile> [remoteFile] [options...]`,
    '',
    '  Options:',
    '',
    '    --cp        <remoteFile>     [multiple] copy files on azure blob storage',
    '    --env       <envFile>        [multiple] load env variables from files if they are existed',
    '    --container <containerName>  provide container name (this argument has a higher priority than environment variable)',
    '    --verbose                    print verbose logs',
    '    --dryrun                     print the operations that would be performed without actual requesting and uploading',
    '',
    '  File name variables:',
    '',
    '    $yyyy, $mm, $dd, $HH, $MM, $SS, $uuid',
    '',
    ...envVarUsage,
    '  Example:',
    '',
    `    ${bin} file.tar`,
    `    ${bin} file.tar test-site/file.tar`,
    `    ${bin} dist.tar test-site/head.tar --cp test-site/$yyyy-$mm-$dd/$HH-$MM.tar`,
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

  let localFile: string;
  let remoteFile: string;
  let dryrun = false;
  let overwriteContainer: string;
  const copy: string[] = [];
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
      if (!localFile) return localFile = arg;
      if (!remoteFile) return remoteFile = arg;
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
      case '--cp':
        copy.push(getNextArg());
        break;
      case '--container':
        overwriteContainer = getNextArg();
        break;
      case '--env':
        envFiles.push(getNextArg());
        break;
      case '--verbose':
        logger.setVerbose(true);
        break;
      case '--dryrun':
        dryrun = true;
        break;
      default: resolvePositionalArgs();
    }
  }
  if (!localFile) return usage();

  loadEnvFiles(envFiles);

  const connect = new AzureStorageEnv();
  if (overwriteContainer) connect.container = overwriteContainer;

  connect.assertKey();
  connect.assertContainer();

  const localFileStat = fileStat(localFile);
  const localFileName = path.basename(localFile);
  const localFileSize = localFileStat.size;
  const extName = path.extname(localFileName);
  const contentType = getContentTypeByExt(extName);

  const now = new Date();
  const resolvedBlob: string[] = [];
  if (remoteFile) resolvedBlob.push(resolveFileName(remoteFile, { now }));
  else resolvedBlob.push(remoteFile = localFileName);
  copy.forEach(it => resolvedBlob.push(resolveFileName(it, { now })));

  logger.log(`localFile=${JSON.stringify(localFileName)}`);
  logger.log(`size=${localFileSize} "${getHumanReadableFileSize(localFileSize)}"`);
  logger.log(`content-type=${localFileSize} "${getHumanReadableFileSize(localFileSize)}"`);
  for (let i = 0; i < resolvedBlob.length; i++) {
    const remoteFile = resolvedBlob[i];
    logger.log(`remoteFile[${i}]=${JSON.stringify(`${connect.accountName}/${connect.container}/${remoteFile}`)}`);
  }

  const from = Date.now() / 1000;
  const blocks = getBlocksFormLocalFile(localFile);
  const firstBlob = resolvedBlob[0];

  let networkRetry = _networkRetry;
  if (dryrun) networkRetry = async () => null;

  if (blocks.length <= 1) {
    logger.log(`uploadMode="put 1 blob"`);
    const uploadResult = await networkRetry(() =>
      azPutBlob({ logger, connect, blob: firstBlob, file: localFile, contentType }), 5);

    if (uploadResult?.["content-md5"]) {
      const remoteMD5 = uploadResult["content-md5"]
      logger.log(`md5sum(remoteFile)=${remoteMD5}`);

      const localMD5 = await getFileMD5Base64(localFile);
      if (localMD5 !== remoteMD5)
        throw new Error(`md5sums are different between local and remote, local md5sum is "${localMD5}"`);
    }
  } else {
    logger.log(`uploadMode="put ${blocks.length} blocks and put block list"`);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const now = Date.now() / 1000;
      const elapsed = (now - from).toFixed(0);
      logger.log(`uploading block ${i + 1}/${blocks.length} "${block.uuid}" +${elapsed}s`);
      await networkRetry(() => azPutBlock({ logger, connect, blob: firstBlob, block }), 5);
    }

    const blockUUIDs = blocks.map(it => it.uuid)
    await networkRetry(() =>
      azPutBlockList({ logger, connect, blob: firstBlob, blockUUIDs, contentType }), 3);
  }

  for (let i = 1; i < resolvedBlob.length; i++) {
    const remoteFile = resolvedBlob[i];
    logger.log(`copying the blob to "${remoteFile}"`)
    await networkRetry(() =>
      azCopyBlob({ logger, connect, blob: remoteFile, source: { blob: firstBlob } }), 3);
  }

  const elapsed = (Date.now() / 1000 - from).toFixed(0);
  logger.log(`uploaded done (elapsed ${elapsed}s)`);
}


export function resolveFileName(fileName: string, context: { now: Date }) {
  const date = context.now;
  const pad2 = (num: number) => num < 10 ? `0${num}` : `${num}`;
  return fileName.replace(/\$([a-zA-Z]{2,4})/g, (_, placeholder) => {
    switch (placeholder) {
      case 'yyyy': return date.getFullYear().toString();
      case 'yy': return date.getFullYear().toString().slice(2);
      case 'mm': return pad2(date.getMonth() + 1);
      case 'dd': return pad2(date.getDate());
      case 'HH': return pad2(date.getHours());
      case 'MM': return pad2(date.getMinutes());
      case 'SS': return pad2(date.getSeconds());
      case 'uuid': return uuidv4();
      default: return _;
    }
  });
}

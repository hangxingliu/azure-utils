import { AzureStorageEnv } from "../utils/azure/env";

import { envVarUsage } from "./helper";

import { azListBlobs } from "../utils/azure/blob/list-blob";

import { loadEnvFiles } from "../utils/env";
import { Logger } from "../utils/logger";
import { networkRetry } from '../utils/network-retry'
import { getHumanReadableFileSize } from "../utils/file";

const logger = new Logger(`AzListBlobs`);
main().catch(logger.fatal);

function usage() {
  const bin = 'az-ls-blobs';
  console.log([
    '',
    `  Usage: ${bin} [prefix] [options...]`,
    '',
    '  Options:',
    '',
    '    -n, --limit <maxResults>     maximum number of blobs to return',
    '    -m, --maker <nextValue>      ',
    '    --env       <envFile>        [multiple] load env variables from files if they are existed',
    '    --container <containerName>  provide container name (this argument has a higher priority than environment variable)',
    '    --verbose                    print verbose logs',
    '',
    ...envVarUsage,
    '  Example:',
    '',
    `    ${bin}`,
    `    ${bin} files/`,
    `    ${bin} files/ -n 10 -m '2!76!MD.....oJhn'`,
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
  logger.setLogDest('stderr')

  let prefix: string;
  let maker: string;
  let limit = 1000;
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
      if (!prefix) return prefix = arg;
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
      case '--container':
        overwriteContainer = getNextArg();
        break;
      case '--env':
        envFiles.push(getNextArg());
        break;
      case '--verbose':
        logger.setVerbose(true);
        break;
      case '-m':
      case '--maker':
        maker = getNextArg();
        break;
      case '-n':
      case '--limit': {
        const _limit = getNextArg();
        limit = parseInt(_limit, 10);
        if (limit > 0 === false)
          throw new Error(`Invalid value ${JSON.stringify(_limit)} for "${arg}"`);
        break;
      }
      default: resolvePositionalArgs();
    }
  }
  loadEnvFiles(envFiles);

  const connect = new AzureStorageEnv();
  if (overwriteContainer) connect.container = overwriteContainer;

  connect.assertKey();
  connect.assertContainer();

  if (prefix) logger.log(`prefix=${JSON.stringify(prefix)}`);
  if (maker) logger.log(`maker=${JSON.stringify(maker)}`);
  if (limit) logger.log(`limit=${limit}`);

  const xml = await networkRetry(() =>
    azListBlobs({ prefix, logger, connect, maxresults: limit }), 2, 5);
  const { blobs, next } = resolveListFilesXML(xml);

  const items = [['Name', 'Size', 'Modified Date', 'MD5']].concat(
    blobs.map(blob =>
      [blob.name, getHumanReadableFileSize(blob.size), blob.mtime.toJSON(), blob.md5]));
  const colWidths = new Array(4).fill(0)
    .map((_, i) => Math.max(...items.map(item => item[i].length)) + 1);

  for (let i = 0; i < items.length; i++) {
    const row = items[i].map((text, col) => text.padEnd(colWidths[col], ' ')).join(' | ');
    console.log(row);
  }
  if(next) logger.log(`nextMaker=${next}`);
}

type ParsedBlob = {
  name: string;
  size: number;
  mtime: Date;
  md5: string;
  xml: string;
}
export function resolveListFilesXML(xml: string) {
  let blobs: Array<ParsedBlob> = [];
  let startPos = 0;

  while (startPos >= 0) {
    let result = matchBetween(xml, '<Blob>', '</Blob>', startPos);
    if (!result) break;
    startPos = result.next;

    let blob: ParsedBlob = { name: '', size: 0, mtime: null as Date, md5: '', xml: '' };
    const blobXML = result.matched;
    blob.xml = blobXML;

    result = matchBetween(blobXML, '<Name>', '</Name>', 0);
    if (result) blob.name = result.matched;

    result = matchBetween(blobXML, '<Content-Length>', '</Content-Length>', 0);
    if (result) blob.size = parseInt(result.matched, 10);

    result = matchBetween(blobXML, '<Last-Modified>', '</Last-Modified>', 0);
    if (result) blob.mtime = new Date(result.matched);

    result = matchBetween(blobXML, '<Content-MD5>', '</Content-MD5>', 0);
    if (result) blob.md5 = Buffer.from(result.matched, 'base64').toString('hex');

    blobs.push(blob);
  }

  const result = matchBetween(xml, '<NextMarker>', '</NextMarker>');
  return { blobs, next: result?.matched };
}
function matchBetween(str: string, left: string, right: string, startPos = 0) {
  let i = str.indexOf(left, startPos);
  if (i < 0) return;
  i += left.length;
  const j = str.indexOf(right, i);
  if (j < 0) return;
  return { matched: str.slice(i, j), next: j + right.length };
}

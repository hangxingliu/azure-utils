import { AzureStorageEnv } from "../utils/azure/env.js";

import { envVarUsage, onFatal } from "./helper.js";

import { ListBlobsArgs, azListBlobs } from "../utils/azure/blob/list-blob.js";

import { loadEnvFiles } from "../utils/env.js";
import { Logger } from "../utils/logger.js";
import { networkRetry } from "../utils/network-retry.js";
import { getHumanReadableFileSize } from "../utils/file.js";
import { parseBlockListResult, parseListBlobsResult } from "../utils/azure/result-parser.js";
import { printTable } from "../utils/table.js";
import { azGetBlockList } from "../utils/azure/blob/get-block-list.js";

const logger = new Logger(`AzListBlobs`);
main().catch((e) => onFatal(logger, e));

function usage() {
  const bin = "az-ls-blobs";
  console.log(
    [
      "",
      `  Usage: ${bin} [prefix] [options...]`,
      "",
      "  Options:",
      "",
      "        --blocks                 list blocks of a blob with the same name with the argument `prefix`",
      "",
      "    -n, --limit <maxResults>     maximum number of blobs to return",
      "    -m, --maker <nextValue>      ",
      "        --xml",
      "        --all                    list regular blobs with uncommitted blobs and deleted blobs",
      "        --md5                    show blob md5",
      "        --type                   show blob type",
      "    --env       <envFile>        [multiple] load env variables from files if they are existed",
      "    --container <containerName>  provide container name (this argument has a higher priority than environment variable)",
      "    --verbose                    print verbose logs",
      "",
      ...envVarUsage,
      "  Example:",
      "",
      `    ${bin}`,
      `    ${bin} files/`,
      `    ${bin} files/ -n 10 -m '2!76!MD.....oJhn'`,
      "",
    ].join("\n")
  );
  process.exit(0);
}
function version() {
  console.log(global["__version"] ? `v${global["__version"]}` : "unknown");
  process.exit(0);
}

async function main() {
  const allArgv = process.argv.slice(2);
  logger.setLogDest("stderr");

  let prefix: string | undefined;
  let maker: string | undefined;
  let xmlMode = false;
  let allMode = false;
  let blocksMode = false;
  let showMD5 = false;
  let showBlobType = false;
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
    };
    const resolvePositionalArgs = () => {
      if (!prefix) return (prefix = arg);
      throw new Error(`Unknown argument '${arg}'`);
    };

    if (afterDoubleDash) {
      resolvePositionalArgs();
      continue;
    }
    switch (arg) {
      case "--":
        afterDoubleDash = true;
        break;
      case "-h":
      case "--help":
        return usage();
      case "-V":
      case "--version":
        return version();
      case "--blocks":
        blocksMode = true;
        break;
      case "--xml":
        xmlMode = true;
        break;
      case "--all":
        allMode = true;
        break;
      case "--md5":
        showMD5 = true;
        break;
      case "--type":
        showBlobType = true;
        break;
      case "--container":
        overwriteContainer = getNextArg();
        break;
      case "--env":
        envFiles.push(getNextArg());
        break;
      case "--verbose":
        logger.setVerbose(true);
        break;
      case "-m":
      case "--maker":
        maker = getNextArg();
        break;
      case "-n":
      case "--limit": {
        const _limit = getNextArg();
        limit = parseInt(_limit, 10);
        if (limit > 0 === false)
          throw new Error(`Invalid value ${JSON.stringify(_limit)} for "${arg}"`);
        break;
      }
      default:
        resolvePositionalArgs();
    }
  }
  if (blocksMode && !prefix)
    throw new Error("The argument `prefix` is mandatory for the flag `--blocks`");
  loadEnvFiles(envFiles);

  const connect = new AzureStorageEnv();
  if (overwriteContainer) connect.container = overwriteContainer;

  connect.assertKey();
  connect.assertContainer();

  if (blocksMode) {
    logger.log(`blob=${JSON.stringify(prefix)}`);

    const xml = await networkRetry(() => azGetBlockList({ blob: prefix, logger, connect }), 2, 5);
    if (xmlMode) return console.log(xml);

    const headers = ["Block", "Size", ""];
    const rows: string[][] = [];
    for (const block of parseBlockListResult(xml)) {
      const size = getHumanReadableFileSize(block.size);
      rows.push([block.name, size, block.uncommitted ? 'Uncommitted' : '']);
    }
    printTable(headers, rows);
    return;
  }


  if (prefix) logger.log(`prefix=${JSON.stringify(prefix)}`);
  if (maker) logger.log(`maker=${JSON.stringify(maker)}`);
  if (limit) logger.log(`limit=${limit}`);

  const listArgs: ListBlobsArgs = { prefix, logger, connect, maxresults: limit };
  if (allMode) listArgs.include = ["uncommittedblobs", "deleted"];

  const xml = await networkRetry(() => azListBlobs(listArgs), 2, 5);
  if (xmlMode) return console.log(xml);
  const { blobs, next } = parseListBlobsResult(xml);

  const headers = ["Name", "Size", "Modified Date"];
  if (showBlobType) headers.push("Type");
  if (allMode) headers.push("Specific");
  if (showMD5) headers.push("MD5");
  const rows: string[][] = [];
  for (const blob of blobs) {
    const mtime = blob.mtime ? blob.mtime.toJSON() : "";
    const size = blob.size === 0 && blob.uncommitted ? "" : getHumanReadableFileSize(blob.size);
    const row = [blob.name, size, mtime];
    if (showBlobType) row.push(blob.type || "");
    if (allMode) {
      const spec = [];
      if (blob.uncommitted) spec.push("Uncommitted");
      if (blob.deleted) spec.push("Deleted");
      row.push(spec.join(", "));
    }
    if (showMD5) row.push(blob.md5 || "");
    rows.push(row);
  }
  printTable(headers, rows);
  if (next) logger.log(`nextMaker=${next}`);
}

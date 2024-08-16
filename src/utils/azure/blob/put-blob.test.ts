import { resolve } from "path";
import { loadEnvFiles } from "../../env.js";
import { Logger } from "../../logger.js";
import { AzureStorageEnv } from "../env.js";
import { azPutBlock } from "./put-block.js";
import { getBlocksFormLocalFile } from "./block-helper";

const projectRoot = resolve(__dirname, '../../../../..');
const testFile = resolve(projectRoot, 'test/largefile');
const blobName = 'largefile';

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
async function main() {
  const logger = new Logger(`Test`);

  loadEnvFiles(['.env', 'test.env']);
  const connect = new AzureStorageEnv();
  connect.assertKey();
  connect.assertContainer();

  const blocks = getBlocksFormLocalFile(testFile, { blockSize: 12 * 1024 * 1024 });
  console.log(`${blocks.length} blocks`);
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    await azPutBlock({ logger, connect, blob: blobName, block });
  }
}

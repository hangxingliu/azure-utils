import { loadEnvFiles } from "../../env.js";
import { Logger } from "../../logger.js";
import { AzureStorageEnv } from "../env.js";
import { parseBlockListResult, parseListBlobsResult } from "../result-parser.js";
import { azGetBlockList } from "./get-block-list.js";
import { azListBlobs } from "./list-blob.js";
import { writeFileSync } from "fs";

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
async function main() {
  const logger = new Logger(`Test`);
  logger.setVerbose(true);
  logger.setLogDest("stderr");

  loadEnvFiles([".env", "test.env"]);
  const connect = new AzureStorageEnv();
  connect.assertKey();
  connect.assertContainer();

  {
    const xml = await azListBlobs({ logger, connect, include: ["deleted", "uncommittedblobs"] });
    writeFileSync("list.xml", xml);

    console.log("list.xml");
    console.log(
      parseListBlobsResult(xml).blobs.map((it) => {
        delete it.xml;
        return it;
      })
    );
  }

  // {
  //   const xml = await azGetBlockList({ logger, connect, blob: "largefile" });
  //   writeFileSync("block-list.xml", xml);
  //   console.log("block-list.xml");
  //   console.log(
  //     parseBlockListResult(xml).map((it) => {
  //       delete it.xml;
  //       return it;
  //     })
  //   );
  // }
}

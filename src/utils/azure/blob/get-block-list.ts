import { request } from "node:https";
import type { OutgoingHttpHeaders } from "node:http";

import { createSharedKeyLite } from "../shared-key-lite.js";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types.js";
import { AzureResponseHelper } from "../response-helper.js";
import { getURI } from "../../uri.js";

const x_ms_version = "2024-11-04";

export type GetBlockListArgs = {
  connect: AzureConnectInfo;
  logger: ILogger;
  blob: string;
  type?: 'committed' | 'uncommitted' | 'all';

  snapshot?: string;
  versionid?: string;
  /**
   * The timeout parameter is expressed in seconds
   * @see https://learn.microsoft.com/en-us/rest/api/storageservices/setting-timeouts-for-blob-service-operations
   */
  timeout?: number;
};

/**
 * @see https://learn.microsoft.com/en-us/rest/api/storageservices/get-block-list
 * @returns XML content
 */
export function azGetBlockList(args: GetBlockListArgs): Promise<string> {
  const { connect, logger } = args;
  const { container } = connect;

  const method = "GET";
  const date = new Date();
  const blob = args.blob.replace(/^\//, '');

  const qs = {
    comp: "blocklist",
    blocklisttype: args.type || 'all',
    snapshot: args.snapshot,
    versionid: args.versionid,
    timeout: args.timeout,
    // showonly: args.showonly, // error 400
  };

  const headers: OutgoingHttpHeaders = {
    "content-length": "0",
    "x-ms-version": x_ms_version,
    "x-ms-date": date.toUTCString(),
  };
  headers.authorization = createSharedKeyLite({
    verb: method,
    connect,
    resourceUri: args.blob,
    qs,
    headers,
  });

  const uri = getURI(`/${container}/${encodeURI(blob)}`, qs);

  return new Promise<string>((resolve, reject) => {
    const azureResp = new AzureResponseHelper("get block list", logger, reject);
    let data = "";

    logger.verbose(`request list api uri="${uri}" ...`);
    const req = request(
      {
        host: getAzureBlobHost(connect),
        path: uri,
        method,
        headers,
      },
      (res) => {
        azureResp.onResponse(res);
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));
        res.on("end", () => {
          azureResp.data = data;
          azureResp.validate(200);
          resolve(data);
        });
      }
    );
    req.on("error", azureResp.reject);
    req.end();
  });
}

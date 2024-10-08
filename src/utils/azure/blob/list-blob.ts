import { request } from "node:https";
import type { OutgoingHttpHeaders } from "node:http";

import { createSharedKeyLite } from "../shared-key-lite.js";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types.js";
import { AzureResponseHelper } from "../response-helper.js";
import { getURI } from "../../uri.js";

const x_ms_version = "2021-06-08";

export type ListBlobsInlcudeArg =
  | "snapshots"
  | "metadata"
  | "uncommittedblobs"
  | "copy"
  | "deleted"
  | "tags"
  | "versions"
  | "deletedwithversions"
  | "immutabilitypolicy"
  | "legalhold"
  | "permissions";

export type ListBlobsArgs = {
  connect: AzureConnectInfo;
  logger: ILogger;
  prefix?: string;
  delimiter?: string;
  marker?: string;
  maxresults?: number;
  include?: ListBlobsInlcudeArg[];
  /**
   * The timeout parameter is expressed in seconds
   * @see https://learn.microsoft.com/en-us/rest/api/storageservices/setting-timeouts-for-blob-service-operations
   */
  timeout?: number;
  // showonly?: 'deleted' | 'files' | 'directories';
};

/**
 * @see https://learn.microsoft.com/en-us/rest/api/storageservices/list-blobs
 * @returns XML content
 */
export function azListBlobs(args: ListBlobsArgs): Promise<string> {
  const { connect, logger, include } = args;
  const { container } = connect;

  const method = "GET";
  const date = new Date();

  const qs = {
    restype: "container",
    comp: "list",
    prefix: args.prefix,
    delimiter: args.delimiter,
    marker: args.marker,
    maxresults: args.maxresults,
    include: include && include.length > 0 ? include.join(",") : "",
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
    resourceUri: "",
    qs,
    headers,
  });

  const uri = getURI(`/${container}`, qs);

  return new Promise<string>((resolve, reject) => {
    const azureResp = new AzureResponseHelper("list blobs", logger, reject);
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

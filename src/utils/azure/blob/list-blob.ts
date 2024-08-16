import { request } from "node:https";

import { createSharedKeyLite } from "../shared-key-lite.js";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types.js";
import { AzureResponseHelper } from "../response-helper.js";

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
  const { connect, logger, prefix, delimiter, marker, maxresults, include } = args;
  const { container } = connect;

  let qs = `?restype=container&comp=list`;
  if (prefix) qs = `${qs}&prefix=${encodeURIComponent(prefix)}`;
  if (delimiter) qs = `${qs}&delimiter=${encodeURIComponent(delimiter)}`;
  if (marker) qs = `${qs}&marker=${encodeURIComponent(marker)}`;
  if (maxresults) qs = `${qs}&maxresults=${encodeURIComponent(maxresults)}`;
  if (include && include.length > 0) qs = `${qs}&include=${include.join(",")}`;
  if (typeof args.timeout === "number") qs = `${qs}&timeout=${args.timeout}`;
  // if (args.showonly) qs = `${qs}&showonly=${args.showonly}`; // error: 400

  const method = "GET";
  const date = new Date();
  const canonicalizedHeaders = [
    `x-ms-date:${date.toUTCString()}`,
    `x-ms-version:${x_ms_version}`,
  ].join("\n");
  const authorization = createSharedKeyLite({
    verb: method,
    connect,
    resourceUri: "",
    qs: { comp: "list" },
    canonicalizedHeaders,
  });

  return new Promise<string>((resolve, reject) => {
    const azureResp = new AzureResponseHelper("list blobs", logger, reject);
    let data = "";

    logger.verbose(`request list api uri="/${container}${qs}" ...`);
    const req = request(
      {
        host: getAzureBlobHost(connect),
        path: `/${container}${qs}`,
        method,
        headers: {
          Authorization: authorization,
          "Content-Length": "0",
          "x-ms-version": x_ms_version,
          "x-ms-date": date.toUTCString(),
        },
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

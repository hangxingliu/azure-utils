import { request } from "node:https";

import { createSharedKeyLite } from "../shared-key-lite.js";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types.js";
import { AzureResponseHelper } from "../response-helper.js";

const x_ms_version = "2020-10-02";

export type DelBlobArgs = {
  connect: AzureConnectInfo;
  blob: string;
  logger: ILogger;
  permanent?: boolean;
};
export type DelBlobResult = {
  "x-ms-request-id": string;
  "x-ms-version": string;
  "x-ms-client-request-id": string;
  "x-ms-delete-type-permanent": string;
  date: string;
};

export function azDelBlob(args: DelBlobArgs): Promise<DelBlobResult> {
  const { connect, logger } = args;
  const { container } = connect;
  const method = "DELETE";
  const date = new Date();
  const blob = args.blob.replace(/^\//, "");

  let qs = '';
  if (args.permanent) qs = '?deletetype=permanent';

  const canonicalizedHeaders = [
    `x-ms-date:${date.toUTCString()}`,
    `x-ms-version:${x_ms_version}`,
  ].join("\n");
  const authorization = createSharedKeyLite({
    connect,
    verb: method,
    resourceUri: args.blob,
    canonicalizedHeaders,
  });

  return new Promise((resolve, reject) => {
    const azureResp = new AzureResponseHelper("delete blob", logger, reject);

    const apiPath = `/${container}/${encodeURI(blob)}${qs}`;
    logger.log(`request delete api uri="${apiPath}" ...`);
    const req = request(
      {
        host: getAzureBlobHost(connect),
        path: apiPath,
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
        res.on("data", azureResp.collectData);
        res.on("end", () => {
          azureResp.validate(202);
          resolve(res.headers as any);
        });
      }
    );
    req.on("error", azureResp.reject);
    req.end();
  });
}

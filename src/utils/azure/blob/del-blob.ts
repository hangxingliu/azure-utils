import { request } from "https";

import { createSharedKeyLite } from "../shared-key-lite";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types";

const x_ms_version = '2020-10-02'

export type DelBlobArgs = {
  connect: AzureConnectInfo,
  blob: string;
  logger: ILogger,
}
export type DelBlobResult = {
  'x-ms-request-id': string;
  'x-ms-version': string;
  'x-ms-client-request-id': string;
  'x-ms-delete-type-permanent': string;
  date: string;
}

export function azDelBlob(args: DelBlobArgs): Promise<DelBlobResult> {
  const { connect, logger } = args;
  const { container, accountName } = connect;
  const method = 'DELETE';
  const date = new Date();
  const blob = args.blob.replace(/^\//, '');

  const authorization = createSharedKeyLite({
    connect,
    verb: method,
    resourceUri: args.blob,
    canonicalizedHeaders: [
      `x-ms-date:${date.toUTCString()}`,
      `x-ms-version:${x_ms_version}`,
    ].join('\n'),
  })

  return new Promise((resolve, reject) => {
    let statusCode = -1;
    let contentType = '';
    let data = '';
    logger.log(`request delete api uri="${accountName}/${container}/${blob}" ...`)
    const req = request({
      host: getAzureBlobHost(connect),
      path: `/${container}/${blob}`,
      method,
      headers: {
        Authorization: authorization,
        'Content-Length': '0',
        'x-ms-version': x_ms_version,
        'x-ms-date': date.toUTCString(),
      }
    }, res => {
      statusCode = res.statusCode;
      contentType = res.headers["content-type"];

      res.on('data', (chunk: Buffer) => data += chunk.toString())
      res.on('end', () => {
        if (statusCode !== 202)
          return rejectWithLog(`HTTP status code is not 202 but ${statusCode}`, data);
        logger.verbose(`api response code=${statusCode}`);
        resolve(res.headers as any);
      })
    })
    req.on('error', rejectWithLog);
    req.end();

    function rejectWithLog(error: Error | string, details: any) {
      if (!error) return;
      const message = typeof error === 'string' ? error : error.message;
      logger.error(`delete failed! ${message} ${details ? 'details:' : ''}`);
      if (details) logger.error(details);
      reject(error);
    }
  });
}

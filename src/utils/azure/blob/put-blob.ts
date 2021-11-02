import * as fs from "fs";
import { request } from "https";

import { createSharedKeyLite } from "../shared-key-lite";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types";

const x_ms_version = '2020-10-02';

export type PutBlobArgs = {
  connect: AzureConnectInfo,
  blob: string;
  file: string;
  logger: ILogger,
  contentLength?: number;
}
export type PutBlobResult = {
  'content-md5': string;
  'last-modified': string;
  etag: string;
  server: string;
  'x-ms-request-id': string;
  'x-ms-version': string;
  'x-ms-content-crc64': string;
  'x-ms-request-server-encrypted': string;
  date: string;
  [x: string]: string;
}

export function azPutBlob(args: PutBlobArgs): Promise<PutBlobResult> {
  const { connect, logger } = args;
  const { container } = connect;
  const method = 'PUT';
  const date = new Date();
  const blob = args.blob.replace(/^\//, '');

  const authorization = createSharedKeyLite({
    verb: method,
    connect,
    resourceUri: args.blob,
    canonicalizedHeaders: [
      'x-ms-blob-type:BlockBlob',
      `x-ms-date:${date.toUTCString()}`,
      `x-ms-version:${x_ms_version}`,
    ].join('\n'),
  })

  let size = args.contentLength;
  if (typeof size !== 'number') {
    const stat = fs.statSync(args.file);
    size = stat.size;
  }
  const stream = fs.createReadStream(args.file);

  return new Promise((resolve, reject) => {
    let statusCode = -1;
    let contentType = '';
    let data = '';

    const apiPath = `/${container}/${blob}`;
    logger.log(`request put blob api uri="${apiPath}" size=${size} ...`)
    const req = request({
      host: getAzureBlobHost(connect),
      path: apiPath,
      method,
      headers: {
        Authorization: authorization,
        'Content-Length': size,
        'x-ms-blob-type': 'BlockBlob',
        'x-ms-version': x_ms_version,
        'x-ms-date': date.toUTCString(),
      }
    }, res => {
      statusCode = res.statusCode;
      contentType = res.headers["content-type"];

      res.on('data', (chunk: Buffer) => data += chunk.toString())
      res.on('end', () => {
        if (statusCode !== 201)
          return rejectWithLog(`HTTP status code is ${statusCode} but not 201`, data);
        logger.verbose(`api response code=${statusCode} content-type=${contentType || ''}`);
        resolve(res.headers as any);
      })
    })
    req.on('error', rejectWithLog);
    stream.pipe(req);

    function rejectWithLog(error: Error | string, details: any) {
      if (!error) return;
      const message = typeof error === 'string' ? error : error.message;
      logger.error(`put blob failed! ${message} ${details ? 'details:' : ''}`);
      if (details) logger.error(details);
      reject(error);
    }
  });
}

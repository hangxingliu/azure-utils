
import { request } from "https";

import { createSharedKeyLite } from "../shared-key-lite";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types";

const x_ms_version = '2020-10-02'

export type PutBlobListArgs = {
  connect: AzureConnectInfo;
  blockUUIDs: string[];
  blob: string;
  logger: ILogger,
}
export type PutBlockListResult = {
  'content-length': string;
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

export function azPutBlockList(args: PutBlobListArgs): Promise<PutBlockListResult> {
  const { connect, logger } = args;
  const { container } = connect;
  const method = 'PUT';
  const date = new Date();
  const blob = args.blob.replace(/^\//, '');

  const authorization = createSharedKeyLite({
    verb: method,
    connect,
    resourceUri: args.blob + `?comp=blocklist`,
    canonicalizedHeaders: [
      `x-ms-date:${date.toUTCString()}`,
      `x-ms-version:${x_ms_version}`,
    ].join('\n'),
  })
  const postBody = `<?xml version="1.0" encoding="utf-8"?><BlockList>\n` +
    args.blockUUIDs.map(it => `<Latest>${it}</Latest>`).join('\n') +
    `\n</BlockList>`;

  return new Promise((resolve, reject) => {
    let statusCode = -1;
    let contentType = '';
    let data = '';
    logger.log(`request put block list api uri="/${container}/${blob}?comp=blocklist" ...`)
    const req = request({
      host: getAzureBlobHost(connect),
      path: `/${container}/${blob}?comp=blocklist`,
      method,
      headers: {
        Authorization: authorization,
        'Content-Length': postBody.length,
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
    req.write(postBody);

    function rejectWithLog(error: Error | string, details: any) {
      if (!error) return;
      const message = typeof error === 'string' ? error : error.message;
      logger.error(`put blob list failed! ${message} ${details ? 'details:' : ''}`);
      if (details) logger.error(details);
      reject(error);
    }
  });
}

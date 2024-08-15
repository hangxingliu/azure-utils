import { request } from "https";

import { createSharedKeyLite } from "../shared-key-lite";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types";

const x_ms_version = '2021-06-08'

export type ListBlobsArgs = {
  connect: AzureConnectInfo,
  logger: ILogger,
  prefix?: string;
  delimiter?: string;
  marker?: string;
  maxresults?: number;
}

/** @returns XML content */
export function azListBlobs(args: ListBlobsArgs): Promise<string> {
  const { connect, logger, prefix, delimiter, marker, maxresults } = args;
  const { container } = connect;

  let qs = `?restype=container&comp=list`;
  if (prefix) qs = `${qs}&prefix=${encodeURIComponent(prefix)}`;
  if (delimiter) qs = `${qs}&delimiter=${encodeURIComponent(delimiter)}`;
  if (marker) qs = `${qs}&marker=${encodeURIComponent(marker)}`;
  if (maxresults) qs = `${qs}&maxresults=${encodeURIComponent(maxresults)}`;

  const method = 'GET';
  const date = new Date();
  const authorization = createSharedKeyLite({
    verb: method,
    connect,
    resourceUri: '',
    qs: { comp: 'list' },
    canonicalizedHeaders: [
      `x-ms-date:${date.toUTCString()}`,
      `x-ms-version:${x_ms_version}`,
    ].join('\n'),
  })

  return new Promise((resolve, reject) => {
    let statusCode = -1;
    let contentType = '';
    let data = '';
    logger.verbose(`request list api uri="/${container}${qs}" ...`)
    const req = request({
      host: getAzureBlobHost(connect),
      path: `/${container}${qs}`,
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
        if (statusCode !== 200)
          return rejectWithLog(`HTTP status code is ${statusCode} but not 200`, data);
        logger.verbose(`api response code=${statusCode}`);
        resolve(data as any);
      })
    })
    req.on('error', rejectWithLog);
    req.end();

    function rejectWithLog(error: Error | string, details: any) {
      if (!error) return;
      const message = typeof error === 'string' ? error : error.message;
      logger.error(`list blobs failed! ${message} ${details ? 'details:' : ''}`);
      if (details) logger.error(details);
      reject(error);
    }
  });
}

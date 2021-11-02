import { request } from "https";

import { createSharedKeyLite } from "../shared-key-lite";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types";

const x_ms_version = '2020-10-02'

export type CopyBlobArgs = {
  connect: AzureConnectInfo,
  blob: string;
  logger: ILogger,
  source: {
    account?: string;
    container?: string;
    blob: string;
    sasToken?: string;
  }
}
export type CopyBlobResult = {
  'last-modified': string;
  'x-ms-request-id': string;
  'x-ms-version': string;
  'x-ms-copy-id': string;
  'x-ms-copy-status': 'success' | 'pending';
}

export function azCopyBlob(args: CopyBlobArgs): Promise<CopyBlobResult> {
  const { connect, logger, source } = args;
  const { container, accountName, endpointSuffix } = connect;
  const method = 'PUT';
  const date = new Date();
  const blob = args.blob.replace(/^\//, '');

  const sourceURL = [
    `https://${source.account || accountName}.blob.${endpointSuffix}/`,
    source.container || container, '/',
    source.blob,
    source.sasToken ? `?${source.sasToken}` : '',
  ].join('');

  const sourceName = [
    source.account || accountName, '/',
    source.container || container, '/',
    source.blob,
  ].join('');

  const authorization = createSharedKeyLite({
    connect,
    verb: method,
    resourceUri: args.blob,
    canonicalizedHeaders: [
      `x-ms-copy-source:${sourceURL}`,
      `x-ms-date:${date.toUTCString()}`,
      `x-ms-version:${x_ms_version}`,
    ].join('\n'),
  })

  return new Promise((resolve, reject) => {
    let statusCode = -1;
    let contentType = '';
    let data = '';
    logger.log(`request copy api uri="${accountName}/${container}/${blob}" x-ms-copy-source="${sourceName}" ...`)
    const req = request({
      host: getAzureBlobHost(connect),
      path: `/${container}/${blob}`,
      method,
      headers: {
        Authorization: authorization,
        'Content-Length': '0',
        'x-ms-copy-source': sourceURL,
        'x-ms-version': x_ms_version,
        'x-ms-date': date.toUTCString(),
      }
    }, res => {
      statusCode = res.statusCode;
      contentType = res.headers["content-type"];

      res.on('data', (chunk: Buffer) => data += chunk.toString())
      res.on('end', () => {
        if (statusCode !== 201 && statusCode !== 202)
          return rejectWithLog(`HTTP status code is ${statusCode} but not 201 or 202`, data);
        logger.verbose(`api response code=${statusCode} x-ms-copy-status=${res.headers['x-ms-copy-status'] || ''}`);
        resolve(res.headers as any);
      })
    })
    req.on('error', rejectWithLog);
    req.end();

    function rejectWithLog(error: Error | string, details: any) {
      if (!error) return;
      const message = typeof error === 'string' ? error : error.message;
      logger.error(`copy failed! ${message} ${details ? 'details:' : ''}`);
      if (details) logger.error(details);
      reject(error);
    }
  });
}

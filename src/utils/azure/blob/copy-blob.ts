import { request } from "node:https";

import { createSharedKeyLite } from "../shared-key-lite.js";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types.js";
import { AzureResponseHelper } from "../response-helper.js";

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
    const azureResp = new AzureResponseHelper('put blob', logger, reject);

    const apiPath = `/${container}/${encodeURI(blob)}`;
    logger.log(`request copy api uri="${accountName}/${container}/${blob}" x-ms-copy-source="${sourceName}" ...`)
    const req = request({
      host: getAzureBlobHost(connect),
      path: apiPath,
      method,
      headers: {
        Authorization: authorization,
        'Content-Length': '0',
        'x-ms-copy-source': sourceURL,
        'x-ms-version': x_ms_version,
        'x-ms-date': date.toUTCString(),
      }
    }, res => {
      azureResp.onResponse(res);
      res.on('data', azureResp.collectData);
      res.on('end', () => {
        azureResp.validate(201, 202);
        resolve(res.headers as any);
      })
    })
    req.on('error', azureResp.reject);
    req.end();
  });
}

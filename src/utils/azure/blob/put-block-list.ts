import { request } from "node:https";
import { createSharedKeyLite } from "../shared-key-lite.js";
import { AzureConnectInfo, getAzureBlobHost, ILogger } from "../types.js";
import { AzureResponseHelper } from "../response-helper.js";

const x_ms_version = '2020-10-02'

export type PutBlobListArgs = {
  connect: AzureConnectInfo;
  blockUUIDs: string[];
  blob: string;
  logger: ILogger,
  /**
   * `application/octet-stream` by default.
   * @see https://docs.microsoft.com/en-us/rest/api/storageservices/put-block-list
   */
  contentType?: string;
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

  let contentType = '';
  if (typeof args.contentType === 'string')
    contentType = args.contentType;

  const authorization = createSharedKeyLite({
    verb: method,
    connect,
    resourceUri: args.blob + `?comp=blocklist`,
    canonicalizedHeaders: [
      contentType ? `x-ms-blob-content-type:${contentType}` : '',
      `x-ms-date:${date.toUTCString()}`,
      `x-ms-version:${x_ms_version}`,
    ].filter(it => it).join('\n'),
  })
  const postBody = `<?xml version="1.0" encoding="utf-8"?><BlockList>\n` +
    args.blockUUIDs.map(it => `<Latest>${it}</Latest>`).join('\n') +
    `\n</BlockList>`;

  return new Promise((resolve, reject) => {
    const azureResp = new AzureResponseHelper('put blob', logger, reject);

    const headers: any = {
      Authorization: authorization,
      'Content-Length': postBody.length,
      'x-ms-version': x_ms_version,
      'x-ms-date': date.toUTCString(),
    };
    if (contentType)
      headers['x-ms-blob-content-type'] = contentType;

    const apiPath = `/${container}/${encodeURI(blob)}?comp=blocklist`;
    logger.log(`request put block list api uri="${apiPath}" x-ms-blob-content-type="${contentType}" ...`)
    const req = request({
      host: getAzureBlobHost(connect),
      path: apiPath,
      method,
      headers,
    }, res => {
      azureResp.onResponse(res);
      res.on('data', azureResp.collectData);
      res.on('end', () => {
        azureResp.validate(201);
        resolve(res.headers as any);
      })
    })
    req.on('error', azureResp.reject);
    req.write(postBody);
  });
}

import { hmacSHA256 } from "./crypto";
import { AzureConnectInfo } from "./types";

export type SharedKeyLiteArgs = {
  verb: string;
  connect: AzureConnectInfo;
  resourceUri: string
  qs?: any
  headerDate?: Date
  contenType?: string
  canonicalizedHeaders?: string
}
export function createSharedKeyLite(args: SharedKeyLiteArgs) {
  const { connect, resourceUri } = args;
  const { container, accountName, accountKey } = connect;

  let canonicalizedResource = `/${accountName}`;
  if (container) canonicalizedResource += container.replace(/^\/*/, '/');
  if (resourceUri) canonicalizedResource += encodeURI(resourceUri).replace(/^\/*/, '/');

  if (args.qs) {
    const pickKeys = new Set(['comp']);
    const qs = [];
    Object.keys(args.qs).forEach(it => qs[it.toLowerCase()] = args.qs[it]);
    const keys = Object.keys(qs).sort();
    let isFirst = true
    keys.forEach(it => {
      if (pickKeys.has(it)) {
        canonicalizedResource += `${isFirst ? '?' : '&'}${it}=${encodeURIComponent(qs[it])}`
        isFirst = false
      }
    });
  }

  const stringToSign = [
    args.verb,
    '', // Content-MD5
    args.contenType || '',
    args.headerDate?.toUTCString() || '',
    args.canonicalizedHeaders || '',
    canonicalizedResource,
  ].join('\n');

  return `SharedKeyLite ${accountName}:${hmacSHA256(accountKey, stringToSign)}`;
}

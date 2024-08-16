import { hmacSHA256 } from "../crypto.js";
import { AzureConnectInfo } from "./types.js";

export type SharedKeyLiteArgs = {
  verb: string;
  connect: AzureConnectInfo;
  resourceUri: string;
  qs?: Record<string, string | number | undefined>;
  headerDate?: Date;
  contentType?: string;
  canonicalizedHeaders?: string;
  headers?: Record<string, number | string | string[]>;
};

const qsNames = new Set(["comp"]);
const headerPrefix = "x-ms-";

/**
 * Shared Key Lite: Use the Shared Key Lite authorization scheme to
 * make requests against the Blob, Queue, Table, and File services.
 *
 * By using Shared Key Lite, you will not gain the enhanced security functionality
 * provided by using Shared Key with version 2009-09-19 and later.
 *
 * @see https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key
 */
export function createSharedKeyLite(args: SharedKeyLiteArgs) {
  const { connect, resourceUri } = args;
  const { container, accountName, accountKey } = connect;

  let canonicalizedResource = `/${accountName}`;
  if (container) canonicalizedResource += container.replace(/^\/*/, "/");
  if (resourceUri) canonicalizedResource += encodeURI(resourceUri).replace(/^\/*/, "/");

  let canonicalizedHeaders = args.canonicalizedHeaders || '';
  if (args.headers) {
    const lines: string[] = [];
    const headerEntries = Object.entries(args.headers);
    for (const [key, value] of headerEntries) {
      const keyLC = key.toLowerCase();
      if (!keyLC.startsWith(headerPrefix)) continue;
      lines.push(`${keyLC}:${value}`);
    }
    canonicalizedHeaders = lines.sort().join('\n');
  }

  if (args.qs) {
    const qs: Record<string, string | number | undefined> = {};
    Object.keys(args.qs).forEach((it) => (qs[it.toLowerCase()] = args.qs[it]));
    const keys = Object.keys(qs).sort();
    let isFirst = true;
    keys.forEach((it) => {
      if (!qsNames.has(it)) return;
      canonicalizedResource += `${isFirst ? "?" : "&"}${it}=${encodeURIComponent(qs[it])}`;
      isFirst = false;
    });
  }

  const stringToSign = [
    args.verb,
    "", // Content-MD5
    args.contentType || "",
    args.headerDate?.toUTCString() || "",
    canonicalizedHeaders,
    canonicalizedResource,
  ].join("\n");

  return `SharedKeyLite ${accountName}:${hmacSHA256(accountKey, stringToSign)}`;
}

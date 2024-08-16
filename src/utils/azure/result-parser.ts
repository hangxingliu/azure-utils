import { decodeXml } from "../xml-entities.js";
import { matchXMLTag } from "../xml-tag.js";

export type BlobItemInListResult = {
  xml: string;

  name: string;
  size?: number;
  md5?: string;
  /** BlobType */
  type?: string;
  //
  ctime?: Date;
  mtime?: Date;
  //
  deleted?: boolean;
  uncommitted?: boolean;
};
export type ParsedListResult = {
  blobs: BlobItemInListResult[];
  next?: string;
};

export function parseBlobXML(xml: string): BlobItemInListResult {
  let matched = matchXMLTag(xml, true, "Name", 0);
  const blob: BlobItemInListResult = { name: decodeXml(matched.content), xml };

  matched = matchXMLTag(xml, false, "Deleted", 0);
  if (matched) {
    const isDeleted = decodeXml(matched.content).toLowerCase();
    if (isDeleted === "true") blob.deleted = true;
  }

  matched = matchXMLTag(xml, true, "Properties", 0);
  const propXML = matched.content;
  matched = matchXMLTag(propXML, false, "BlobType", 0);
  if (matched) blob.type = decodeXml(matched.content);

  matched = matchXMLTag(propXML, false, "Content-Length", 0);
  if (matched) blob.size = parseInt(matched.content, 10);

  matched = matchXMLTag(propXML, false, "Creation-Time", 0);
  if (matched) blob.ctime = new Date(matched.content);

  matched = matchXMLTag(propXML, false, "Last-Modified", 0);
  if (matched) blob.mtime = new Date(matched.content);

  matched = matchXMLTag(propXML, false, "Content-MD5", 0);
  if (matched) blob.md5 = Buffer.from(matched.content, "base64").toString("hex");

  if (blob.type === "BlockBlob" && !blob.ctime && !blob.mtime && blob.size === 0)
    blob.uncommitted = true;
  return blob;
}

export function parseListBlobsResult(xml: string): ParsedListResult {
  let blobs: Array<BlobItemInListResult> = [];
  let startPos = 0;

  while (startPos >= 0) {
    let matched = matchXMLTag(xml, false, "Blob", startPos);
    if (!matched) break;
    startPos = matched.next;
    blobs.push(parseBlobXML(matched.content));
  }

  const matched = matchXMLTag(xml, false, "NextMarker");
  const result: ParsedListResult = { blobs };
  if (matched) result.next = decodeXml(matched.content);
  return result;
}


export type BlockListItem = {
  xml: string;

  /** aka blockid */
  name: string;
  size: number;
  uncommitted?: boolean;
}

export function parseBlockListItemXML(xml: string, uncommitted?: boolean): BlockListItem {
  let matched = matchXMLTag(xml, true, "Name", 0);
  const name = decodeXml(matched.content);

  matched = matchXMLTag(xml, true, "Size", 0);
  const sizeStr = decodeXml(matched.content);
  const size = parseInt(sizeStr, 10);
  if (!Number.isSafeInteger(size)) throw new Error(`Invalid size "${sizeStr}" of the block "${name}"`);
  const block: BlockListItem = { name, size, xml };
  if (uncommitted) block.uncommitted = uncommitted;
  return block;
}

export function parseBlockListResult(xml: string): BlockListItem[] {
  const blocks: Array<BlockListItem> = [];

  let subXML = matchXMLTag(xml, false, "CommittedBlocks", 0);
  if (subXML) {
    let startPos = 0;
    while (startPos >= 0) {
      let matched = matchXMLTag(subXML.content, false, "Block", startPos);
      if (!matched) break;
      startPos = matched.next;
      blocks.push(parseBlockListItemXML(matched.content));
    }
  }

  subXML = matchXMLTag(xml, false, "UncommittedBlocks", 0);
  if (subXML) {
    let startPos = 0;
    while (startPos >= 0) {
      let matched = matchXMLTag(subXML.content, false, "Block", startPos);
      if (!matched) break;
      startPos = matched.next;
      blocks.push(parseBlockListItemXML(matched.content, true));
    }
  }
  return blocks;
}

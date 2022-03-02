export type BlobItemInListResult = {
  name: string;
  size: number;
  mtime: Date;
  md5: string;
  xml: string;
};
export type ParsedListResult = {
  blobs: BlobItemInListResult[];
  next: string;
}

export function parseListBlobsResult(xml: string): ParsedListResult {
  let blobs: Array<BlobItemInListResult> = [];
  let startPos = 0;

  while (startPos >= 0) {
    let result = matchBetween(xml, "<Blob>", "</Blob>", startPos);
    if (!result) break;
    startPos = result.next;

    let blob: BlobItemInListResult = { name: "", size: 0, mtime: null as Date, md5: "", xml: "" };
    const blobXML = result.matched;
    blob.xml = blobXML;

    result = matchBetween(blobXML, "<Name>", "</Name>", 0);
    if (result) blob.name = result.matched;

    result = matchBetween(blobXML, "<Content-Length>", "</Content-Length>", 0);
    if (result) blob.size = parseInt(result.matched, 10);

    result = matchBetween(blobXML, "<Last-Modified>", "</Last-Modified>", 0);
    if (result) blob.mtime = new Date(result.matched);

    result = matchBetween(blobXML, "<Content-MD5>", "</Content-MD5>", 0);
    if (result) blob.md5 = Buffer.from(result.matched, "base64").toString("hex");

    blobs.push(blob);
  }

  const result = matchBetween(xml, "<NextMarker>", "</NextMarker>");
  return { blobs, next: result?.matched };
}

function matchBetween(str: string, left: string, right: string, startPos = 0) {
  let i = str.indexOf(left, startPos);
  if (i < 0) return;
  i += left.length;
  const j = str.indexOf(right, i);
  if (j < 0) return;
  return { matched: str.slice(i, j), next: j + right.length };
}

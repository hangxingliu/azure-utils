import * as fs from "node:fs";

import { uuidv4Base64 } from "../../crypto.js";

export const azBlockSize = 1024 * 1024 * 60; // 62MiB
export const azBlockSizeSmall = 1024 * 1024 * 2; // 2MiB

export type LocalFileBlock = {
  uuid: string;

  file: string;
  fileSize: number;

  index: number;
  startPos: number;
  endPos: number;
};

export type GetLocalFileBlockOpts = {
  stat?: fs.Stats;
  blockSize?: number;
}

export function getBlocksFormLocalFile(file: string, opts?: GetLocalFileBlockOpts): LocalFileBlock[] {
  let stat: Readonly<fs.Stats> | undefined;
  let normalBlockSize = azBlockSize;
  let customBlockSize = false;

  if (opts) {
    if (opts.stat) stat = opts.stat;
    if (typeof opts.blockSize === 'number' && opts.blockSize >= 1) {
      normalBlockSize = Math.floor(opts.blockSize);
      customBlockSize = true;
    }
  }
  if (!stat) stat = fs.statSync(file);
  const fileSize = stat.size;

  let startPos = 0;
  let index = 0;
  const result: LocalFileBlock[] = [];
  while (startPos < fileSize) {
    const endPos = Math.min(startPos + normalBlockSize, fileSize);
    const uuid = uuidv4Base64()
    result.push({ uuid, file, fileSize, index, startPos, endPos });
    startPos = endPos;
    index++;
  }
  if (customBlockSize) return result;

  // merge small block
  if (result.length >= 2) {
    const { startPos, endPos } = result[result.length - 1];
    if (endPos - startPos < azBlockSizeSmall) {
      result.pop();
      result[result.length - 1].endPos = endPos;
    }
  }
  return result;
}

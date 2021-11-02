import * as fs from "fs";

import { uuidv4Base64 } from "../crypto";

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

export function getBlocksFormLocalFile(file: string): LocalFileBlock[] {
  const stat = fs.statSync(file);
  const fileSize = stat.size;

  let startPos = 0;
  let index = 0;
  const result: LocalFileBlock[] = [];
  while (startPos < fileSize) {
    const endPos = Math.min(startPos + azBlockSize, fileSize);
    const uuid = uuidv4Base64()
    result.push({ uuid, file, fileSize, index, startPos, endPos });
    startPos = endPos;
    index++;
  }

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

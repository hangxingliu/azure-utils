import { Stats } from "node:fs";

export type LocalFileBlock = {
  id: string;
  index: number;
  startPos: number;
  endPos: number;
  uploaded?: boolean;
};

export type LocalFileBlockForUpload = LocalFileBlock & {
  file: string;
};

export type SerializedLocalFileBlocks = {
  file: string;
  size: number;
  /** date string */
  mtime: string;
  blocks: ReadonlyArray<Readonly<LocalFileBlock>>;
};

export type MinimumFileStats = Pick<Stats, "size" | "mtime">;

export type LocalFileBlocksOptions = {
  stat?: MinimumFileStats;
  blockSize?: number;
};

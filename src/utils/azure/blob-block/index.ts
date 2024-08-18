import { statSync } from "node:fs";
import {
  LocalFileBlock,
  LocalFileBlockForUpload,
  LocalFileBlocksOptions,
  MinimumFileStats,
  SerializedLocalFileBlocks,
} from "./types.js";
import { uuidv4Base64 } from "../../crypto.js";

///
/// Version 2019-12-12 and later
/// Maximum block size (via Put Block): 4000 MiB
/// Maximum blob size (via Put Block List): Approximately 190.7 TiB (4000 MiB X 50,000 blocks)
/// Maximum blob size via single write operation (via Put Blob): 5000 MiB
///
/// https://learn.microsoft.com/en-us/rest/api/storageservices/understanding-block-blobs--append-blobs--and-page-blobs
///

const MiB = 1024 * 1024;
export const defaultBlockSize = 60 * MiB;
export const defaultMinBlockSize = 2 * MiB;

export class LocalFileBlocks {
  /** Ordered blocks */
  readonly blocks: LocalFileBlock[];
  readonly size: number;
  readonly mtime: Date;

  constructor(
    readonly file: string,
    opts?: LocalFileBlocksOptions
  ) {
    let fileStat: Readonly<MinimumFileStats> | undefined;
    let blockSize = defaultBlockSize;
    let useCustomBlockSize = false;

    if (opts) {
      if (opts.stat) fileStat = opts.stat;
      if (typeof opts.blockSize === "number" && opts.blockSize >= 1) {
        blockSize = Math.floor(opts.blockSize);
        useCustomBlockSize = true;
      }
    }

    if (!fileStat) fileStat = statSync(file);
    this.size = fileStat.size;
    this.mtime = fileStat.mtime;
    const fileSize = fileStat.size;

    let startPos = 0;
    let index = 0;
    const blocks: LocalFileBlock[] = [];
    this.blocks = blocks;

    while (startPos < fileSize) {
      const endPos = Math.min(startPos + blockSize, fileSize);
      const id = uuidv4Base64();
      blocks.push({ id, index, startPos, endPos });
      startPos = endPos;
      index++;
    }

    if (useCustomBlockSize) return;

    // merge small block
    if (blocks.length >= 2) {
      const { startPos, endPos } = blocks[blocks.length - 1];
      if (endPos - startPos < defaultMinBlockSize) {
        blocks.pop();
        blocks[blocks.length - 1].endPos = endPos;
      }
    }
  }

  get length() {
    return this.blocks.length;
  }

  get blockIds() {
    return this.blocks.map(it => it.id);
  }

  private at(blockIndex: number) {
    if (!Number.isSafeInteger(blockIndex)) return;
    return this.blocks[blockIndex];
  }

  /**
   * Mark a block as uploaded
   */
  uploaded(blockIndex: number) {
    const block = this.at(blockIndex);
    if (block) block.uploaded = true;
    return block;
  }

  getBlock(blockIndex: number): LocalFileBlockForUpload {
    const block = this.at(blockIndex);
    if (!block) return;
    return { ...block, file: this.file };
  }

  serialize() {
    const serialized: SerializedLocalFileBlocks = {
      file: this.file,
      size: this.size,
      mtime: this.mtime.toJSON(),
      blocks: this.blocks,
    };
    return serialized;
  }

  static deserialize(
    serialized: SerializedLocalFileBlocks,
    currentFileStat?: MinimumFileStats
  ): LocalFileBlocks {
    if (
      !serialized ||
      !serialized.file ||
      !serialized.mtime ||
      !Number.isSafeInteger(serialized.size) ||
      !Array.isArray(serialized.blocks)
    )
      throw new Error(`Invalid serialized file blocks info: required field is missing or invalid`);

    const mtime = new Date(serialized.mtime);
    if (isNaN(mtime.getTime())) throw new Error(`Invalid mtime in serialized file blocks`);

    if (currentFileStat) {
      if (serialized.size !== currentFileStat.size)
        throw new Error(
          `The size of local file is changed to ${currentFileStat.size}. expected size: ${serialized.size}`
        );
      if (mtime.getTime() !== currentFileStat.mtime.getTime())
        throw new Error(
          `The last modified time of local file is ${currentFileStat.mtime}. expected mtime: ${mtime}`
        );
    }

    const blocks = [...serialized.blocks].sort((a, b) => a - b);
    const result: LocalFileBlocks = Object.create(LocalFileBlocks.prototype);
    const fields: Partial<LocalFileBlocks> = {
      file: serialized.file,
      size: serialized.size,
      mtime,
      blocks,
    };
    Object.assign(result, fields);
    return result;
  }
}

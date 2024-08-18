import { LocalFileBlocks } from "./index.js";

const blocks = new LocalFileBlocks(__filename);
console.log(blocks);

const serialized = blocks.serialize();
console.log(serialized);

const blocks2 = LocalFileBlocks.deserialize(serialized);
console.log(blocks2);

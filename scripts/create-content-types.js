#!/usr/bin/env node
//@ts-check

const fs = require("fs");
const path = require("path");
const db = require("mime-db");

const tab = "  ";
const targetFile = path.resolve(__dirname, "../src/utils/azure/content-type.ts");

/** @type {Map<string, string>} */
const existed = new Map();
Object.keys(db).forEach((contentType) => {
  const info = db[contentType];
  const { extensions } = info;
  if (!Array.isArray(extensions)) return;
  for (let i = 0; i < extensions.length; i++) {
    const ext = extensions[i];
    if (existed.has(ext)) {
      const existedType = existed.get(ext);
      if (existedType.startsWith('application/'))
        continue;
    }
    existed.set(ext, contentType);
  }
});

const tuples = Array.from(existed.entries());
const props = tuples.map(([ext, contentType]) => {
  if (/^\d/.test(ext) || !/^\w+$/.test(ext)) ext = JSON.stringify(ext);
  return tab + `${ext}: ${JSON.stringify(contentType)},`;
});

let skip = false;
const code = fs.readFileSync(targetFile, "utf8");
const lines = code.split("\n");
const newLines = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.indexOf("region auto generated") >= 0) {
    newLines.push(line);
    if (skip) {
      skip = false;
      continue;
    }
    skip = true;
    newLines.push(props.join("\n"));
    continue;
  }
  if (skip) continue;
  newLines.push(line);
}

const newCode = newLines.join("\n");
fs.writeFileSync(targetFile, newCode);

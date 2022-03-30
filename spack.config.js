const fs = require("fs");
const { config } = require("@swc/core/spack");

const src = __dirname + `/src/cli`;
const scripts = fs.readdirSync(src).filter((it) => it.endsWith(".ts") && it.indexOf("helper.") < 0);
const entry = {
  // "cjs/index": __dirname + "/src/index.ts",
};
scripts.forEach((it) => {
  const targetName = it.replace(/\.(\w+)$/, "");
  entry[targetName] = `${src}/${it}`;
});

module.exports = config({
  entry,
  output: {
    path: __dirname + "/dist",
  },
  mode: "production",
  options: {
    sourceMaps: false,
    module: {
      type: "commonjs",
      noInterop: true,
    },
    jsc: {
      parser: {
        syntax: "typescript",
        decorators: true,
        privateMethod: true,
      },
      transform: {
        decoratorMetadata: true,
      },
      target: "es2020",
      preserveAllComments: true,
    },
  },
});

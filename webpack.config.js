//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfiguration */
/** @typedef {import('webpack').ModuleOptions} WebpackModuleConfig */
const fs = require("fs");
const path = require("path");

const swcConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, ".swcrc"), "utf8"));
swcConfig.minify = false;

/** @type {Record<string, string>} */
const entry = {};
const entryDir = path.resolve(__dirname, 'src/cli');
for (const file of fs.readdirSync(entryDir)) {
  const name = file.replace(/\.\w+$/, '');
  if (name === 'helper') continue;
  entry[name] = path.join(entryDir, file);
}

/** @returns {WebpackModuleConfig} */
function getWebpackModule() {
  return {
    rules: [
      {
        test: /\.m?[tj]sx?$/i,
        exclude: /node_modules/,
        use: {
          loader: "swc-loader",
          options: swcConfig,
        },
      },
    ],
  };
}

/**
 * @returns {WebpackConfiguration['output']}
 */
function getWebpackOutput() {
  return {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    sourceMapFilename: "[name].js.map",
  };
}

/** @type {WebpackConfiguration} */
const webpackConfig = {
  mode: "development",
  target: "node",

  devtool: false,
  // devtool: 'source-map',

  entry,
  performance: {
    maxAssetSize: 512 * 1024,
    maxEntrypointSize: 512 * 1024,
  },

  module: getWebpackModule(),
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    extensionAlias: {
      ".js": [".js", ".ts"],
    },
  },
  output: getWebpackOutput(),
};
module.exports = webpackConfig;

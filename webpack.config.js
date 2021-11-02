//@ts-check
/// <reference types="node" />

const fs = require("fs")
const path = require("path")
const webpack = require("webpack")
const commonjsModules = [
  "fs",
  "url",
  "path",
  "stream",
  "https",
  "crypto",
]

const version = require("./package.json").version
const banner = new webpack.BannerPlugin({
  raw: true,
  entryOnly: true,
  banner: `#!/usr/bin/env node\n\nglobal.__version='${version}';\n`,
})

const src = `./src/cli`
const scripts = fs
  .readdirSync(src)
  .filter((it) => it.endsWith(".ts") && it.indexOf("helper.") < 0)
const entry = {}
scripts.forEach((it) => {
  const targetName = it.replace(/\.(\w+)$/, "")
  entry[targetName] = `${src}/${it}`
})

const isProduction = /^prod/.test(process.env.NODE_ENV)
module.exports = {
  mode: isProduction ? "production" : "development",
  entry,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  resolve: { extensions: [".ts", ".js"] },
  plugins: [banner],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
          compilerOptions: {
            module: "es2015",
            types: ["node"],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  externals: commonjsModules.reduce(
    (it, name) => Object.assign(it, { [name]: `commonjs ${name}` }),
    {}
  ),
  devtool: false,
  optimization: {
    minimize: false,
  },
}

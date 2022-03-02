import { resolve as resolvePath } from "path"
import typescript from "@rollup/plugin-typescript"

export default {
  input: "src/index.ts",
  output: {
    file: "dist/cjs/index.js",
    format: "cjs",
    sourcemap: false,
  },
  external: ["fs", "crypto"],
  plugins: [typescript({ tsconfig: resolvePath(__dirname, "tsconfig.rollup.json") })],
}

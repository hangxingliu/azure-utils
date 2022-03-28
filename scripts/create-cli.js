#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const version = require("../package.json").version;

const dist = path.resolve(__dirname, "../dist");
const jsFiles = fs.readdirSync(dist).filter((it) => it.endsWith(".js"));

const nodeShebang = "#!/usr/bin/env node";
const wrapper = fs.readFileSync(path.join(__dirname, "node-wrapper.sh"), "utf8");

for (let i = 0; i < jsFiles.length; i++) {
  const jsName = jsFiles[i];
  const jsFile = path.join(dist, jsFiles[i]);
  let code = fs.readFileSync(jsFile, "utf8");
  if (code.indexOf(nodeShebang) < 0) {
    code = `${nodeShebang}\n\nglobal.__version='${version}';\n${code}`;
    fs.writeFileSync(jsFile, code);
  }

  const jsMapFile = jsFile + ".map";
  if (fs.existsSync(jsMapFile)) fs.unlinkSync(jsMapFile);

  const shName = jsName.replace(/\.js$/i, ".sh");
  const shFile = path.join(dist, shName);
  fs.writeFileSync(shFile, wrapper + code);

  try {
    childProcess.execSync(`chmod +x '${jsName}' '${shName}'`, {
      cwd: dist,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    // noop
  }
}

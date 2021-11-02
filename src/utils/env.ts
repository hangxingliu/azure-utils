import * as fs from "fs";

export function loadEnvFiles(files: string[]) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const env = readEnvFile(file);
    const envNames = Object.keys(env);
    for (let j = 0; j < envNames.length; j++) {
      const envName = envNames[j];
      process.env[envName] = env[envName]
    }
  }
}

export function readEnvFile(file: string) {
  let env = '';
  try { env = fs.readFileSync(file, 'utf8'); } catch (error) { }

  const result: any = {};
  env.split('\n')
    .map(it => it.trim())
    .filter(it => it)
    .forEach(it => {
      const index = it.indexOf('=')
      if (index <= 0) return;
      const varName = it.slice(0, index);
      let varValue = it.slice(index + 1);
      if (/^['"].*['"]$/.test(varValue) && varValue[0] === varValue[varValue.length - 1])
        varValue = varValue.slice(1, varValue.length - 1)
      result[varName] = varValue;
    });
  return result;
}


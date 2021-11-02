import * as fs from 'fs'
import * as path from 'path'

export function fileStat(file: string) {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(file);
  } catch (error) {
    throw new Error(`Get stat of "${path.basename(file)}" failed: ${error.message}`);
  }
  if (!stat.isFile())
    throw new Error(`"${path.basename(file)}" is not a file!`);
  return stat;
}


///
/// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/10420404
///
export function getHumanReadableFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
  return bytes.toFixed(dp) + ' ' + units[u];
}

import * as https from "node:https";
import { Writable } from "node:stream";
import { getHumanReadableFileSize } from "./file.js";

export type DownloadResponse = {
  contentLength?: number;
  contentMD5?: string;
  contentType?: string;
  headers: any;
};

export type DownloadArgs = {
  url: string;
  stream: Writable;
  progressInterval?: number;
  logger: {
    log: (msg: string) => any;
    error: (msg: string) => any;
    progress: (downloaded: number, contentLength: number, elapsed: number) => any;
  }
};

export function downlaodToStream(args: DownloadArgs): Promise<DownloadResponse> {
  return new Promise((resolve, reject) => {
    let statusCode = -1;
    let contentType: string | undefined = '';
    let contentMD5 = '';
    let contentLength = -1;
    let promise = Promise.resolve();

    const progressInterval = typeof args.progressInterval === "number" ? args.progressInterval : -1;
    const { stream, logger } = args;

    let lastProgressLog = Date.now();
    let downloaded = 0;
    let responsedAt = 0;

    const maskedURL = args.url.replace(/\?.+$/, '?****');
    logger.log(`downloading file from url "${maskedURL}" ...`);

    const req = https.get(args.url, {}, res => {
      responsedAt = Date.now();
      if (typeof res.statusCode === 'number') statusCode = res.statusCode;
      if (statusCode !== 200) {
        logger.log(`headers: ${JSON.stringify(res.headers)}`);
        return rejectWithLog(`Server response status code is ${statusCode} but not 200`);
      }

      const rawContentLength = res.headers['content-length'];
      if (rawContentLength) {
        contentLength = parseInt(rawContentLength, 10);
        if (isNaN(contentLength) || contentLength < 0)
          return rejectWithLog(`Invalid content-length: "${rawContentLength}"`);
      }
      contentType = res.headers["content-type"];
      contentMD5 = String(res.headers['content-md5']);

      const logResp = []
      if (contentLength >= 0)
        logResp.push(`size=${contentLength} "${getHumanReadableFileSize(contentLength)}"`);
      if (contentType) logResp.push(`type="${contentType}"`);
      if (contentMD5) logResp.push(`md5="${contentMD5}"`);
      logger.log(`server response ${logResp.join(' ')}`);

      res.on('data', write);
      res.on('end', () => {
        promise = promise.then(() => resolve({
          contentLength,
          contentMD5,
          contentType,
          headers: res.headers
        }));
      })
    })
    req.on('error', rejectWithLog);
    req.end();

    function write(data: Buffer) {
      promise = promise.then(() => new Promise((resolve, reject) =>
        stream.write(data, (e) => {
          if (e) return reject(e);
          downloaded += data.length;
          try { printProgress(); } catch (error) { }
          resolve();
        })));
    }
    function printProgress() {
      if (progressInterval >= 0 === false) return;

      const now = Date.now();
      if (progressInterval !== 0) {
        if (now < lastProgressLog + progressInterval) return;
        lastProgressLog = now;
      }
      const elapsed = (now - responsedAt) / 1000;
      logger.progress(downloaded, contentLength, elapsed);
    }
    function rejectWithLog(error: Error | string, details?: any) {
      if (!error) return;
      const message = typeof error === 'string' ? error : error.message;
      logger.error(`download failed! ${message} ${details ? 'details:' : ''}`);
      if (details) logger.error(details);
      reject(error);
    }
  });
}

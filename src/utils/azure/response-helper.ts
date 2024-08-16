import { IncomingHttpHeaders, IncomingMessage } from "node:http";
import { ILogger } from "./types.js";
import { AzureError } from "./error.js";

const ignoredRespHeaders = new Set(["x-ms-request-id", "x-ms-version", "x-ms-error-code"]);

export class AzureResponseHelper {
  status?: number;
  contentType?: string;
  data?: string;
  msErrorCode?: string;
  headers?: IncomingHttpHeaders;

  constructor(
    private readonly action: string,
    private readonly logger: ILogger,
    private readonly rejectFn: (error: unknown) => void
  ) {}

  onResponse(res: IncomingMessage) {
    this.status = res.statusCode;
    this.headers = res.headers;
    this.contentType = res.headers["content-type"];

    const msErrorCode = res.headers["x-ms-error-code"];
    if (msErrorCode) {
      this.msErrorCode = Array.isArray(msErrorCode) ? msErrorCode[0] : msErrorCode;
    }
  }

  readonly collectData = (chunk: string | Buffer) => {
    if (typeof this.data === "undefined") this.data = chunk.toString();
    else this.data += chunk.toString();
  };

  validate(...validStatusCode: number[]) {
    if (typeof this.status !== "number") return this.rejectAzureError(`no HTTP status code`);
    if (!validStatusCode.includes(this.status))
      return this.rejectAzureError(
        `invalid HTTP status code (expected: ${validStatusCode.join(", ")})`
      );

    const logs = [`api response code=${this.status}`];
    if (this.contentType) logs.push(`content-type=${this.contentType}`);
    if (this.headers) {
      const keys = Object.keys(this.headers).filter((key) => !ignoredRespHeaders.has(key));
      for (const key of keys) logs.push(`${key}=${this.headers[key]}`);
    }

    this.logger.verbose(logs.join(" "));
  }

  private rejectAzureError(message: string) {
    const err = new AzureError(message, this.msErrorCode);
    if (this.data) err.azureResp = this.data;
    if (this.status) err.statusCode = this.status;
    return this.reject(err);
  }

  readonly reject = (error: unknown) => {
    if (!error) return this.rejectFn(`Unknown error`);

    const { logger, action } = this;

    const httpLogs: string[] = [];
    if (this.status) httpLogs.push(`http status code: ${this.status}`);
    if (this.contentType) httpLogs.push(`content type: ${this.contentType}`);

    if (AzureError.is(error)) {
      logger.error(`${action} failed: ${error.message}`);
      if (httpLogs.length > 0) logger.error(httpLogs.join(" "));
      if (error.code) logger.error(`azure error code: ${error.code}`);
      if (error.azureResp) logger.error(`azure response: ${error.azureResp.replace(/\n/g, "")}`);
    } else {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`${action} failed: ${errMsg}`);
      if (httpLogs.length > 0) logger.error(httpLogs.join(" "));
    }

    this.rejectFn(error);
  };
}

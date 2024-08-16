export class AzureError extends Error {
  azureMessage?: string;
  azureResp?: string;
  statusCode?: number;

  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
  }

  static is(error: unknown): error is AzureError {
    return error && error instanceof AzureError ? true : false;
  }
}

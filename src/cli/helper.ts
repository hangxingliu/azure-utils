import { AzureError } from "../utils/azure/error.js";
import { Logger } from "../utils/logger.js";

export const envVarUsage = [
  "  Environment variables:",
  "",
  "    Name                            | Example",
  "    AZURE_STORAGE_CONTAINER         | account/container",
  "    AZURE_STORAGE_ACCOUNT           | account",
  "    AZURE_STORAGE_CONNECTION_STRING | DefaultEndpointsProtocol=https;.....",
  "    AZURE_STORAGE_ACCESS_KEY        | jPJyz****dA==",
  "    AZURE_STORAGE_KEY               | jPJyz****dA==",
  "",
];

export function onFatal(logger: Logger, error: unknown) {
  // azure error has printed already
  if (AzureError.is(error)) process.exit(1);
  logger.fatal(error);
}

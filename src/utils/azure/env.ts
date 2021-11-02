import { AzureConnectInfo } from "./types";

/**
 * - AZURE_STORAGE_KEY                 Eg: `jPJyz...dA==`
 * - AZURE_STORAGE_ACCOUNT             Eg: `testaccount`
 * - AZURE_STORAGE_CONNECTION_STRING   Eg: `DefaultEndpointsProtocol=https;.....`
 * - AZURE_STORAGE_CONTAINER           Eg: `testaccount/testcontainer`
 * - AZURE_STORAGE_ACCESS_KEY          Eg: `jPJyz...dA==`
 * @see https://docs.microsoft.com/en-us/cli/azure/storage/container
 */
export class AzureStorageEnv implements AzureConnectInfo {

  container: string;
  accountName: string;
  accountKey: string;
  endpointProtocol: string = 'https';
  endpointSuffix: string = 'core.windows.net';

  constructor(env = process.env) {
    const hasEnv = (envName: string) => typeof env[envName] === 'string' ? env[envName] : '';
    const connStr = hasEnv('AZURE_STORAGE_CONNECTION_STRING')
    if (connStr) {
      const parts = connStr.split(';');
      for (let i = 0; i < parts.length; i++) {
        const connPart = parts[i];
        const index = connPart.indexOf('=');
        if (index <= 0) continue;
        const partName = connPart.slice(0, index);
        const partValue = connPart.slice(index + 1);
        switch (partName) {
          case 'DefaultEndpointsProtocol': this.endpointProtocol = partValue; break;
          case 'EndpointSuffix': this.endpointSuffix = partValue; break;
          case 'AccountName': this.accountName = partValue; break;
          case 'AccountKey': this.accountKey = partValue; break;
        }
      }
    } // end of if(connStr)

    const container = hasEnv('AZURE_STORAGE_CONTAINER');
    if (container) {
      const index = container.indexOf('/');
      if (index < 0) this.container = container;
      else {
        this.accountName = container.slice(0, index);
        this.container = container.slice(index + 1);
      }
    }

    const key = hasEnv('AZURE_STORAGE_KEY') || hasEnv('AZURE_STORAGE_ACCESS_KEY');
    if (key) this.accountKey = key;

    const account = hasEnv('AZURE_STORAGE_ACCOUNT');
    if (account) this.accountName = account;
  }
  assertKey() {
    if (!this.accountKey)
      throw new Error(`Access key for Azure storage is not found in environment variables: "AZURE_STORAGE_KEY", "AZURE_STORAGE_CONNECTION_STRING"`);
  }
  assertContainer() {
    if (!this.accountName)
      throw new Error(`Azure blob storage account is not found in environment variables: "AZURE_STORAGE_ACCOUNT", "AZURE_STORAGE_CONTAINER", "AZURE_STORAGE_CONNECTION_STRING"`);
    if (!this.container)
      throw new Error(`Azure blob container is not found in environment variables: "AZURE_STORAGE_CONTAINER", "AZURE_STORAGE_CONNECTION_STRING"`);
  }
}

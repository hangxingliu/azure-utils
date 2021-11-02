export interface AzureConnectInfo {
  container: string;
  accountName: string;
  accountKey: string;
  endpointProtocol: string;
  endpointSuffix: string;
}

export function getAzureBlobHost(connect: AzureConnectInfo): string {
  return `${connect.accountName}.blob.${connect.endpointSuffix}`;
}
export function getAzureProtocol(connect: AzureConnectInfo): string {
  let protocol = connect.endpointProtocol || 'https';
  const index = protocol.indexOf(':');
  if (index >= 0) protocol = protocol.slice(0, index);
  return protocol;
}

export type ILogger = {
  log: (msg: string) => any;
  error: (msg: string) => any;
  verbose: (msg: string) => any;
}

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
export function getAzureBlobURL(connect: AzureConnectInfo, blob: string) {
  const protocol = getAzureProtocol(connect);
  const host = getAzureBlobHost(connect);
  blob = blob.replace(/^\/+/, '');
  return `${protocol}://${host}/${connect.container}/${blob}`;
}

export type ILogger = {
  log: (msg: string) => any;
  error: (msg: string) => any;
  verbose: (msg: string) => any;
}

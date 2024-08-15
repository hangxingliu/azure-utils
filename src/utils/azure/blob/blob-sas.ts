import { hmacSHA256 } from "../crypto.js";
import { AzureConnectInfo, getAzureBlobHost, getAzureProtocol } from "../types.js";

const signedVersion = "2020-10-02"

export type SASForBlobArgs = {
  connect: AzureConnectInfo;
  blob: string;
  expiryMinutes?: number
  permissions?: string;
}
export type SASForBlobResult = {
  url: string;
  sig: string;
  qs: { [x: string]: string }
}

export function createSASForBlob(options: SASForBlobArgs): SASForBlobResult {
  const { connect, blob, expiryMinutes, permissions } = options;
  const { container, accountKey, accountName } = connect;
  const exp = expiryMinutes || 30;

  /** signedStart */
  const st = date2string(new Date()) // Start time
  /** signedExpiry */
  const se = date2string(Date.now() + exp * 60 * 1000) // Expiry time
  /** signedPermissions */
  const sp = permissions || 'r'; // read only
  const sr = 'b';
  const signedProtocol = getAzureProtocol(connect);

  /** @see https://docs.microsoft.com/en-us/rest/api/storageservices/create-service-sas */
  const stringToSign = [
    sp,
    st,
    se,
    `/blob/${accountName}/${container}/${blob}`,
    "", // signedidentifier
    "", // signedIp
    signedProtocol,
    signedVersion,
    sr,
    "", // signedSnapshotTime
    "", // rscc
    "", // rscd
    "", // rsce
    "", // rscl
    "", //rsct
  ].join('\n');

  const sig = hmacSHA256(accountKey, stringToSign);
  const qs = { sp, st, se, spr: signedProtocol, sv: signedVersion, sr, sig };
  const qsString = Object.keys(qs).map(key => `${key}=${encodeURIComponent(qs[key])}`).join('&');
  const url = `${signedProtocol}://${getAzureBlobHost(connect)}/${container}/${blob}?${qsString}`;
  return { url, qs, sig };
}
function date2string(d: Date | number) {
  return new Date(d).toJSON().replace(/\.\d{0,3}Z$/, 'Z');
}

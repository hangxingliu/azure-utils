import { Logger } from './logger';

const logger = new Logger('NetworkRetry');

/**
 * @see https://github.com/sindresorhus/is-retry-allowed
 */
const errors = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',

  // https://github.com/sindresorhus/is-retry-allowed/blob/main/index.js
  'ENOTFOUND',
  'ENETUNREACH',

  // SSL errors from https://github.com/nodejs/node/blob/fc8e3e2cdc521978351de257030db0076d79e0ab/src/crypto/crypto_common.cc#L301-L328
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_CRL',
  'UNABLE_TO_DECRYPT_CERT_SIGNATURE',
  'UNABLE_TO_DECRYPT_CRL_SIGNATURE',
  'UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY',
  'CERT_SIGNATURE_FAILURE',
  'CRL_SIGNATURE_FAILURE',
  'CERT_NOT_YET_VALID',
  'CERT_HAS_EXPIRED',
  'CRL_NOT_YET_VALID',
  'CRL_HAS_EXPIRED',
  'ERROR_IN_CERT_NOT_BEFORE_FIELD',
  'ERROR_IN_CERT_NOT_AFTER_FIELD',
  'ERROR_IN_CRL_LAST_UPDATE_FIELD',
  'ERROR_IN_CRL_NEXT_UPDATE_FIELD',
  'OUT_OF_MEM',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_CHAIN_TOO_LONG',
  'CERT_REVOKED',
  'INVALID_CA',
  'PATH_LENGTH_EXCEEDED',
  'INVALID_PURPOSE',
  'CERT_UNTRUSTED',
  'CERT_REJECTED',
  'HOSTNAME_MISMATCH'
]);

export async function networkRetry<T>(fn: () => Promise<T>, retries = 3, waitSeconds = 15): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      const sysError = error as any;
      if (errors.has(sysError.errno) || errors.has(sysError.code)) {
        if (i >= retries - 1)
          throw error;

        logger.error(`network error ${sysError.errno}, waiting ${waitSeconds} seconds and retry ...`);
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
      }
    }
  }
}

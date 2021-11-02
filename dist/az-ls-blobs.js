#!/usr/bin/env node

global.__version='1.0.0';

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// UNUSED EXPORTS: resolveListFilesXML

;// CONCATENATED MODULE: ./src/utils/azure/env.ts
/**
 * - AZURE_STORAGE_KEY                 Eg: `jPJyz...dA==`
 * - AZURE_STORAGE_ACCOUNT             Eg: `testaccount`
 * - AZURE_STORAGE_CONNECTION_STRING   Eg: `DefaultEndpointsProtocol=https;.....`
 * - AZURE_STORAGE_CONTAINER           Eg: `testaccount/testcontainer`
 * - AZURE_STORAGE_ACCESS_KEY          Eg: `jPJyz...dA==`
 * @see https://docs.microsoft.com/en-us/cli/azure/storage/container
 */
class AzureStorageEnv {
    constructor(env = process.env) {
        this.endpointProtocol = 'https';
        this.endpointSuffix = 'core.windows.net';
        const hasEnv = (envName) => typeof env[envName] === 'string' ? env[envName] : '';
        const connStr = hasEnv('AZURE_STORAGE_CONNECTION_STRING');
        if (connStr) {
            const parts = connStr.split(';');
            for (let i = 0; i < parts.length; i++) {
                const connPart = parts[i];
                const index = connPart.indexOf('=');
                if (index <= 0)
                    continue;
                const partName = connPart.slice(0, index);
                const partValue = connPart.slice(index + 1);
                switch (partName) {
                    case 'DefaultEndpointsProtocol':
                        this.endpointProtocol = partValue;
                        break;
                    case 'EndpointSuffix':
                        this.endpointSuffix = partValue;
                        break;
                    case 'AccountName':
                        this.accountName = partValue;
                        break;
                    case 'AccountKey':
                        this.accountKey = partValue;
                        break;
                }
            }
        } // end of if(connStr)
        const container = hasEnv('AZURE_STORAGE_CONTAINER');
        if (container) {
            const index = container.indexOf('/');
            if (index < 0)
                this.container = container;
            else {
                this.accountName = container.slice(0, index);
                this.container = container.slice(index + 1);
            }
        }
        const key = hasEnv('AZURE_STORAGE_KEY') || hasEnv('AZURE_STORAGE_ACCESS_KEY');
        if (key)
            this.accountKey = key;
        const account = hasEnv('AZURE_STORAGE_ACCOUNT');
        if (account)
            this.accountName = account;
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

;// CONCATENATED MODULE: ./src/cli/helper.ts
const envVarUsage = [
    '  Environment variables:',
    '',
    '    Name                            | Example',
    '    AZURE_STORAGE_CONTAINER         | account/container',
    '    AZURE_STORAGE_ACCOUNT           | account',
    '    AZURE_STORAGE_CONNECTION_STRING | DefaultEndpointsProtocol=https;.....',
    '    AZURE_STORAGE_ACCESS_KEY        | jPJyz****dA==',
    '    AZURE_STORAGE_KEY               | jPJyz****dA==',
    '',
];

;// CONCATENATED MODULE: external "https"
const external_https_namespaceObject = require("https");
;// CONCATENATED MODULE: external "fs"
const external_fs_namespaceObject = require("fs");
;// CONCATENATED MODULE: external "crypto"
const external_crypto_namespaceObject = require("crypto");
;// CONCATENATED MODULE: ./src/utils/azure/crypto.ts


const rnds8Pool = new Uint8Array(256); // # of random values to pre-allocate
let poolPtr = rnds8Pool.length;
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).substr(1));
}
function stringify(arr, offset = 0) {
    // Note: Be careful editing this code!  It's been tuned for performance
    // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
    const uuid = (byteToHex[arr[offset + 0]] +
        byteToHex[arr[offset + 1]] +
        byteToHex[arr[offset + 2]] +
        byteToHex[arr[offset + 3]] +
        '-' +
        byteToHex[arr[offset + 4]] +
        byteToHex[arr[offset + 5]] +
        '-' +
        byteToHex[arr[offset + 6]] +
        byteToHex[arr[offset + 7]] +
        '-' +
        byteToHex[arr[offset + 8]] +
        byteToHex[arr[offset + 9]] +
        '-' +
        byteToHex[arr[offset + 10]] +
        byteToHex[arr[offset + 11]] +
        byteToHex[arr[offset + 12]] +
        byteToHex[arr[offset + 13]] +
        byteToHex[arr[offset + 14]] +
        byteToHex[arr[offset + 15]]).toLowerCase();
    return uuid;
}
/**
 * @see https://github.com/uuidjs/uuid/blob/main/src/rng.js
 */
function rng() {
    if (poolPtr > rnds8Pool.length - 16) {
        crypto.randomFillSync(rnds8Pool);
        poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, (poolPtr += 16));
}
/**
 * @see https://github.com/uuidjs/uuid/blob/main/src/v4.js
 */
function uuidv4() {
    const rnds = rng();
    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    return stringify(rnds);
}
function hmacSHA256(key, data) {
    const hmac = external_crypto_namespaceObject.createHmac("sha256", Buffer.from(key, "base64"));
    hmac.update(data);
    return hmac.digest("base64");
}
function getFileMD5Base64(file) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const rs = fs.createReadStream(file);
        rs.on('error', reject);
        rs.on('data', chunk => hash.update(chunk));
        rs.on('end', () => resolve(hash.digest('base64')));
    });
}

;// CONCATENATED MODULE: ./src/utils/azure/shared-key-lite.ts

function createSharedKeyLite(args) {
    var _a;
    const { connect, resourceUri } = args;
    const { container, accountName, accountKey } = connect;
    let canonicalizedResource = `/${accountName}`;
    if (container)
        canonicalizedResource += container.replace(/^\/*/, '/');
    if (resourceUri)
        canonicalizedResource += resourceUri.replace(/^\/*/, '/');
    if (args.qs) {
        const pickKeys = new Set(['comp']);
        const qs = [];
        Object.keys(args.qs).forEach(it => qs[it.toLowerCase()] = args.qs[it]);
        const keys = Object.keys(qs).sort();
        let isFirst = true;
        keys.forEach(it => {
            if (pickKeys.has(it)) {
                canonicalizedResource += `${isFirst ? '?' : '&'}${it}=${encodeURIComponent(qs[it])}`;
                isFirst = false;
            }
        });
    }
    const stringToSign = [
        args.verb,
        '',
        args.contenType || '',
        ((_a = args.headerDate) === null || _a === void 0 ? void 0 : _a.toUTCString()) || '',
        args.canonicalizedHeaders || '',
        canonicalizedResource,
    ].join('\n');
    return `SharedKeyLite ${accountName}:${hmacSHA256(accountKey, stringToSign)}`;
}

;// CONCATENATED MODULE: ./src/utils/azure/types.ts
function getAzureBlobHost(connect) {
    return `${connect.accountName}.blob.${connect.endpointSuffix}`;
}
function getAzureProtocol(connect) {
    let protocol = connect.endpointProtocol || 'https';
    const index = protocol.indexOf(':');
    if (index >= 0)
        protocol = protocol.slice(0, index);
    return protocol;
}

;// CONCATENATED MODULE: ./src/utils/azure/blob/list-blob.ts



const x_ms_version = '2020-10-02';
/** @returns XML content */
function azListBlobs(args) {
    const { connect, logger, prefix, delimiter, marker, maxresults } = args;
    const { container } = connect;
    let qs = `?restype=container&comp=list`;
    if (prefix)
        qs = `${qs}&prefix=${encodeURIComponent(prefix)}`;
    if (delimiter)
        qs = `${qs}&delimiter=${encodeURIComponent(delimiter)}`;
    if (marker)
        qs = `${qs}&marker=${encodeURIComponent(marker)}`;
    if (maxresults)
        qs = `${qs}&maxresults=${encodeURIComponent(maxresults)}`;
    const method = 'GET';
    const date = new Date();
    const authorization = createSharedKeyLite({
        verb: method,
        connect,
        resourceUri: '',
        qs: { comp: 'list' },
        canonicalizedHeaders: [
            `x-ms-date:${date.toUTCString()}`,
            `x-ms-version:${x_ms_version}`,
        ].join('\n'),
    });
    return new Promise((resolve, reject) => {
        let statusCode = -1;
        let contentType = '';
        let data = '';
        logger.verbose(`request list api uri="/${container}${qs}" ...`);
        const req = (0,external_https_namespaceObject.request)({
            host: getAzureBlobHost(connect),
            path: `/${container}${qs}`,
            method,
            headers: {
                Authorization: authorization,
                'Content-Length': '0',
                'x-ms-version': x_ms_version,
                'x-ms-date': date.toUTCString(),
            }
        }, res => {
            statusCode = res.statusCode;
            contentType = res.headers["content-type"];
            res.on('data', (chunk) => data += chunk.toString());
            res.on('end', () => {
                if (statusCode !== 200)
                    return rejectWithLog(`HTTP status code is ${statusCode} but not 200`, data);
                logger.verbose(`api response code=${statusCode}`);
                resolve(data);
            });
        });
        req.on('error', rejectWithLog);
        req.end();
        function rejectWithLog(error, details) {
            if (!error)
                return;
            const message = typeof error === 'string' ? error : error.message;
            logger.error(`list blobs failed! ${message} ${details ? 'details:' : ''}`);
            if (details)
                logger.error(details);
            reject(error);
        }
    });
}

;// CONCATENATED MODULE: ./src/utils/env.ts

function loadEnvFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const env = readEnvFile(file);
        const envNames = Object.keys(env);
        for (let j = 0; j < envNames.length; j++) {
            const envName = envNames[j];
            process.env[envName] = env[envName];
        }
    }
}
function readEnvFile(file) {
    let env = '';
    try {
        env = external_fs_namespaceObject.readFileSync(file, 'utf8');
    }
    catch (error) { }
    const result = {};
    env.split('\n')
        .map(it => it.trim())
        .filter(it => it)
        .forEach(it => {
        const index = it.indexOf('=');
        if (index <= 0)
            return;
        const varName = it.slice(0, index);
        let varValue = it.slice(index + 1);
        if (/^['"].*['"]$/.test(varValue) && varValue[0] === varValue[varValue.length - 1])
            varValue = varValue.slice(1, varValue.length - 1);
        result[varName] = varValue;
    });
    return result;
}

;// CONCATENATED MODULE: ./src/utils/logger.ts
const noopFn = () => { };
class Logger {
    constructor(prefix) {
        this.toStdout = (...args) => console.log(this.prefix, ...args);
        this.toStderr = (...args) => console.error(this.prefix, ...args);
        this.log = this.toStdout;
        this.error = (...args) => console.error(this.prefix, ...args);
        this.fatal = (...args) => {
            console.error(this.prefix, ...args);
            process.exit(1);
        };
        this.prefix = `${prefix}:`;
        this.verbose = noopFn;
    }
    setVerbose(verbose) {
        this.verbose = verbose ? this.log : noopFn;
    }
    setLogDest(dest) {
        if (dest === 'stderr')
            this.log = this.toStderr;
        else
            this.log = this.toStdout;
    }
}

;// CONCATENATED MODULE: ./src/utils/network-retry.ts

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
async function networkRetry(fn, retries = 3, waitSeconds = 15) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await fn();
            return result;
        }
        catch (error) {
            const sysError = error;
            if (errors.has(sysError.errno) || errors.has(sysError.code)) {
                if (i >= retries - 1)
                    throw error;
                logger.error(`network error ${sysError.errno}, waiting ${waitSeconds} seconds and retry ...`);
                await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
            }
        }
    }
}

;// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = require("path");
;// CONCATENATED MODULE: ./src/utils/file.ts


function fileStat(file) {
    let stat;
    try {
        stat = fs.statSync(file);
    }
    catch (error) {
        throw new Error(`Get stat of "${path.basename(file)}" failed: ${error.message}`);
    }
    if (!stat.isFile())
        throw new Error(`"${path.basename(file)}" is not a file!`);
    return stat;
}
///
/// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/10420404
///
function getHumanReadableFileSize(bytes, si = false, dp = 1) {
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

;// CONCATENATED MODULE: ./src/cli/az-ls-blobs.ts







const az_ls_blobs_logger = new Logger(`AzListBlobs`);
main().catch(az_ls_blobs_logger.fatal);
function usage() {
    const bin = 'az-ls-blobs';
    console.log([
        '',
        `  Usage: ${bin} [prefix] [options...]`,
        '',
        '  Options:',
        '',
        '    -n, --limit <maxResults>     maximum number of blobs to return',
        '    -m, --maker <nextValue>      ',
        '    --env       <envFile>        [multiple] load env variables from files if they are existed',
        '    --container <containerName>  provide container name (this argument has a higher priority than environment variable)',
        '    --verbose                    print verbose logs',
        '',
        ...envVarUsage,
        '  Example:',
        '',
        `    ${bin}`,
        `    ${bin} files/`,
        `    ${bin} files/ -n 10 -m '2!76!MD.....oJhn'`,
        ''
    ].join('\n'));
    process.exit(0);
}
function version() {
    console.log(__webpack_require__.g['__version'] ? `v${__webpack_require__.g['__version']}` : 'unknown');
    process.exit(0);
}
async function main() {
    const allArgv = process.argv.slice(2);
    az_ls_blobs_logger.setLogDest('stderr');
    let prefix;
    let maker;
    let limit = 1000;
    let overwriteContainer;
    const envFiles = [];
    let afterDoubleDash = false;
    for (let i = 0; i < allArgv.length; i++) {
        const arg = allArgv[i];
        const getNextArg = () => {
            const nextArg = allArgv[++i];
            if (!nextArg)
                throw new Error(`Option '${arg}' requires argument`);
            return nextArg;
        };
        const resolvePositionalArgs = () => {
            if (!prefix)
                return prefix = arg;
            throw new Error(`Unknown argument '${arg}'`);
        };
        if (afterDoubleDash) {
            resolvePositionalArgs();
            continue;
        }
        switch (arg) {
            case '--':
                afterDoubleDash = true;
                break;
            case '-h':
            case '--help':
                return usage();
            case '-V':
            case '--version':
                return version();
            case '--container':
                overwriteContainer = getNextArg();
                break;
            case '--env':
                envFiles.push(getNextArg());
                break;
            case '--verbose':
                az_ls_blobs_logger.setVerbose(true);
                break;
            case '-m':
            case '--maker':
                maker = getNextArg();
                break;
            case '-n':
            case '--limit': {
                const _limit = getNextArg();
                limit = parseInt(_limit, 10);
                if (limit > 0 === false)
                    throw new Error(`Invalid value ${JSON.stringify(_limit)} for "${arg}"`);
                break;
            }
            default: resolvePositionalArgs();
        }
    }
    loadEnvFiles(envFiles);
    const connect = new AzureStorageEnv();
    if (overwriteContainer)
        connect.container = overwriteContainer;
    connect.assertKey();
    connect.assertContainer();
    if (prefix)
        az_ls_blobs_logger.log(`prefix=${JSON.stringify(prefix)}`);
    if (maker)
        az_ls_blobs_logger.log(`maker=${JSON.stringify(maker)}`);
    if (limit)
        az_ls_blobs_logger.log(`limit=${limit}`);
    const xml = await networkRetry(() => azListBlobs({ prefix, logger: az_ls_blobs_logger, connect, maxresults: limit }), 2, 5);
    const { blobs, next } = resolveListFilesXML(xml);
    const items = [['Name', 'Size', 'Modified Date', 'MD5']].concat(blobs.map(blob => [blob.name, getHumanReadableFileSize(blob.size), blob.mtime.toJSON(), blob.md5]));
    const colWidths = new Array(4).fill(0)
        .map((_, i) => Math.max(...items.map(item => item[i].length)) + 1);
    for (let i = 0; i < items.length; i++) {
        const row = items[i].map((text, col) => text.padEnd(colWidths[col], ' ')).join(' | ');
        console.log(row);
    }
    if (next)
        az_ls_blobs_logger.log(`nextMaker=${next}`);
}
function resolveListFilesXML(xml) {
    let blobs = [];
    let startPos = 0;
    while (startPos >= 0) {
        let result = matchBetween(xml, '<Blob>', '</Blob>', startPos);
        if (!result)
            break;
        startPos = result.next;
        let blob = { name: '', size: 0, mtime: null, md5: '', xml: '' };
        const blobXML = result.matched;
        blob.xml = blobXML;
        result = matchBetween(blobXML, '<Name>', '</Name>', 0);
        if (result)
            blob.name = result.matched;
        result = matchBetween(blobXML, '<Content-Length>', '</Content-Length>', 0);
        if (result)
            blob.size = parseInt(result.matched, 10);
        result = matchBetween(blobXML, '<Last-Modified>', '</Last-Modified>', 0);
        if (result)
            blob.mtime = new Date(result.matched);
        result = matchBetween(blobXML, '<Content-MD5>', '</Content-MD5>', 0);
        if (result)
            blob.md5 = Buffer.from(result.matched, 'base64').toString('hex');
        blobs.push(blob);
    }
    const result = matchBetween(xml, '<NextMarker>', '</NextMarker>');
    return { blobs, next: result === null || result === void 0 ? void 0 : result.matched };
}
function matchBetween(str, left, right, startPos = 0) {
    let i = str.indexOf(left, startPos);
    if (i < 0)
        return;
    i += left.length;
    const j = str.indexOf(right, i);
    if (j < 0)
        return;
    return { matched: str.slice(i, j), next: j + right.length };
}

/******/ })()
;
#!/usr/bin/env node

global.__version='1.2.0';
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/cli/helper.ts":
/*!***************************!*\
  !*** ./src/cli/helper.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "envVarUsage", ({
    enumerable: true,
    get: function() {
        return envVarUsage;
    }
}));
const envVarUsage = [
    '  Environment variables:',
    '',
    '    Name                            | Example',
    '    AZURE_STORAGE_CONTAINER         | account/container',
    '    AZURE_STORAGE_ACCOUNT           | account',
    '    AZURE_STORAGE_CONNECTION_STRING | DefaultEndpointsProtocol=https;.....',
    '    AZURE_STORAGE_ACCESS_KEY        | jPJyz****dA==',
    '    AZURE_STORAGE_KEY               | jPJyz****dA==',
    ''
];


/***/ }),

/***/ "./src/utils/azure/blob/list-blob.ts":
/*!*******************************************!*\
  !*** ./src/utils/azure/blob/list-blob.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "azListBlobs", ({
    enumerable: true,
    get: function() {
        return azListBlobs;
    }
}));
const _https = __webpack_require__(/*! https */ "https");
const _sharedkeylite = __webpack_require__(/*! ../shared-key-lite */ "./src/utils/azure/shared-key-lite.ts");
const _types = __webpack_require__(/*! ../types */ "./src/utils/azure/types.ts");
const x_ms_version = '2020-10-02';
function azListBlobs(args) {
    const { connect, logger, prefix, delimiter, marker, maxresults } = args;
    const { container } = connect;
    let qs = `?restype=container&comp=list`;
    if (prefix) qs = `${qs}&prefix=${encodeURIComponent(prefix)}`;
    if (delimiter) qs = `${qs}&delimiter=${encodeURIComponent(delimiter)}`;
    if (marker) qs = `${qs}&marker=${encodeURIComponent(marker)}`;
    if (maxresults) qs = `${qs}&maxresults=${encodeURIComponent(maxresults)}`;
    const method = 'GET';
    const date = new Date();
    const authorization = (0, _sharedkeylite.createSharedKeyLite)({
        verb: method,
        connect,
        resourceUri: '',
        qs: {
            comp: 'list'
        },
        canonicalizedHeaders: [
            `x-ms-date:${date.toUTCString()}`,
            `x-ms-version:${x_ms_version}`
        ].join('\n')
    });
    return new Promise((resolve, reject)=>{
        let statusCode = -1;
        let contentType = '';
        let data = '';
        logger.verbose(`request list api uri="/${container}${qs}" ...`);
        const req = (0, _https.request)({
            host: (0, _types.getAzureBlobHost)(connect),
            path: `/${container}${qs}`,
            method,
            headers: {
                Authorization: authorization,
                'Content-Length': '0',
                'x-ms-version': x_ms_version,
                'x-ms-date': date.toUTCString()
            }
        }, (res)=>{
            statusCode = res.statusCode;
            contentType = res.headers["content-type"];
            res.on('data', (chunk)=>data += chunk.toString());
            res.on('end', ()=>{
                if (statusCode !== 200) return rejectWithLog(`HTTP status code is ${statusCode} but not 200`, data);
                logger.verbose(`api response code=${statusCode}`);
                resolve(data);
            });
        });
        req.on('error', rejectWithLog);
        req.end();
        function rejectWithLog(error, details) {
            if (!error) return;
            const message = typeof error === 'string' ? error : error.message;
            logger.error(`list blobs failed! ${message} ${details ? 'details:' : ''}`);
            if (details) logger.error(details);
            reject(error);
        }
    });
}


/***/ }),

/***/ "./src/utils/azure/crypto.ts":
/*!***********************************!*\
  !*** ./src/utils/azure/crypto.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getFileMD5Base64: function() {
        return getFileMD5Base64;
    },
    hmacSHA256: function() {
        return hmacSHA256;
    },
    rng: function() {
        return rng;
    },
    uuidv4: function() {
        return uuidv4;
    },
    uuidv4Base64: function() {
        return uuidv4Base64;
    }
});
const _fs = __webpack_require__(/*! fs */ "fs");
const _crypto = __webpack_require__(/*! crypto */ "crypto");
const rnds8Pool = new Uint8Array(256); // # of random values to pre-allocate
let poolPtr = rnds8Pool.length;
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */ const byteToHex = [];
for(let i = 0; i < 256; ++i){
    byteToHex.push((i + 0x100).toString(16).substr(1));
}
function stringify(arr, offset = 0) {
    // Note: Be careful editing this code!  It's been tuned for performance
    // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
    const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
    return uuid;
}
function rng() {
    if (poolPtr > rnds8Pool.length - 16) {
        _crypto.randomFillSync(rnds8Pool);
        poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
function uuidv4() {
    const rnds = rng();
    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = rnds[6] & 0x0f | 0x40;
    rnds[8] = rnds[8] & 0x3f | 0x80;
    return stringify(rnds);
}
function uuidv4Base64() {
    const rnds = rng();
    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = rnds[6] & 0x0f | 0x40;
    rnds[8] = rnds[8] & 0x3f | 0x80;
    return Buffer.from(rnds).toString('base64');
}
function hmacSHA256(key, data) {
    const hmac = _crypto.createHmac("sha256", Buffer.from(key, "base64"));
    hmac.update(data);
    return hmac.digest("base64");
}
function getFileMD5Base64(file) {
    return new Promise((resolve, reject)=>{
        const hash = _crypto.createHash('md5');
        const rs = _fs.createReadStream(file);
        rs.on('error', reject);
        rs.on('data', (chunk)=>hash.update(chunk));
        rs.on('end', ()=>resolve(hash.digest('base64')));
    });
}


/***/ }),

/***/ "./src/utils/azure/env.ts":
/*!********************************!*\
  !*** ./src/utils/azure/env.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "AzureStorageEnv", ({
    enumerable: true,
    get: function() {
        return AzureStorageEnv;
    }
}));
class AzureStorageEnv {
    container;
    accountName;
    accountKey;
    endpointProtocol = 'https';
    endpointSuffix = 'core.windows.net';
    constructor(env = process.env){
        const hasEnv = (envName)=>typeof env[envName] === 'string' ? env[envName] : '';
        const connStr = hasEnv('AZURE_STORAGE_CONNECTION_STRING');
        if (connStr) {
            const parts = connStr.split(';');
            for(let i = 0; i < parts.length; i++){
                const connPart = parts[i];
                const index = connPart.indexOf('=');
                if (index <= 0) continue;
                const partName = connPart.slice(0, index);
                const partValue = connPart.slice(index + 1);
                switch(partName){
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
        if (!this.accountKey) throw new Error(`Access key for Azure storage is not found in environment variables: "AZURE_STORAGE_KEY", "AZURE_STORAGE_CONNECTION_STRING"`);
    }
    assertContainer() {
        if (!this.accountName) throw new Error(`Azure blob storage account is not found in environment variables: "AZURE_STORAGE_ACCOUNT", "AZURE_STORAGE_CONTAINER", "AZURE_STORAGE_CONNECTION_STRING"`);
        if (!this.container) throw new Error(`Azure blob container is not found in environment variables: "AZURE_STORAGE_CONTAINER", "AZURE_STORAGE_CONNECTION_STRING"`);
    }
}


/***/ }),

/***/ "./src/utils/azure/result-parser.ts":
/*!******************************************!*\
  !*** ./src/utils/azure/result-parser.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "parseListBlobsResult", ({
    enumerable: true,
    get: function() {
        return parseListBlobsResult;
    }
}));
const _xmlentities = __webpack_require__(/*! ./xml-entities */ "./src/utils/azure/xml-entities.ts");
function parseListBlobsResult(xml) {
    let blobs = [];
    let startPos = 0;
    while(startPos >= 0){
        let result = matchBetween(xml, "<Blob>", "</Blob>", startPos);
        if (!result) break;
        startPos = result.next;
        let blob = {
            name: "",
            size: 0,
            mtime: null,
            md5: "",
            xml: ""
        };
        const blobXML = result.matched;
        blob.xml = blobXML;
        result = matchBetween(blobXML, "<Name>", "</Name>", 0);
        if (result) blob.name = (0, _xmlentities.decodeXml)(result.matched);
        result = matchBetween(blobXML, "<Content-Length>", "</Content-Length>", 0);
        if (result) blob.size = parseInt(result.matched, 10);
        result = matchBetween(blobXML, "<Last-Modified>", "</Last-Modified>", 0);
        if (result) blob.mtime = new Date(result.matched);
        result = matchBetween(blobXML, "<Content-MD5>", "</Content-MD5>", 0);
        if (result) blob.md5 = Buffer.from(result.matched, "base64").toString("hex");
        blobs.push(blob);
    }
    const result = matchBetween(xml, "<NextMarker>", "</NextMarker>");
    return {
        blobs,
        next: result?.matched
    };
}
function matchBetween(str, left, right, startPos = 0) {
    let i = str.indexOf(left, startPos);
    if (i < 0) return;
    i += left.length;
    const j = str.indexOf(right, i);
    if (j < 0) return;
    return {
        matched: str.slice(i, j),
        next: j + right.length
    };
}


/***/ }),

/***/ "./src/utils/azure/shared-key-lite.ts":
/*!********************************************!*\
  !*** ./src/utils/azure/shared-key-lite.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "createSharedKeyLite", ({
    enumerable: true,
    get: function() {
        return createSharedKeyLite;
    }
}));
const _crypto = __webpack_require__(/*! ./crypto */ "./src/utils/azure/crypto.ts");
function createSharedKeyLite(args) {
    const { connect, resourceUri } = args;
    const { container, accountName, accountKey } = connect;
    let canonicalizedResource = `/${accountName}`;
    if (container) canonicalizedResource += container.replace(/^\/*/, '/');
    if (resourceUri) canonicalizedResource += encodeURI(resourceUri).replace(/^\/*/, '/');
    if (args.qs) {
        const pickKeys = new Set([
            'comp'
        ]);
        const qs = [];
        Object.keys(args.qs).forEach((it)=>qs[it.toLowerCase()] = args.qs[it]);
        const keys = Object.keys(qs).sort();
        let isFirst = true;
        keys.forEach((it)=>{
            if (pickKeys.has(it)) {
                canonicalizedResource += `${isFirst ? '?' : '&'}${it}=${encodeURIComponent(qs[it])}`;
                isFirst = false;
            }
        });
    }
    const stringToSign = [
        args.verb,
        '',
        args.contentType || '',
        args.headerDate?.toUTCString() || '',
        args.canonicalizedHeaders || '',
        canonicalizedResource
    ].join('\n');
    return `SharedKeyLite ${accountName}:${(0, _crypto.hmacSHA256)(accountKey, stringToSign)}`;
}


/***/ }),

/***/ "./src/utils/azure/types.ts":
/*!**********************************!*\
  !*** ./src/utils/azure/types.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports) => {


function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getAzureBlobHost: function() {
        return getAzureBlobHost;
    },
    getAzureBlobURL: function() {
        return getAzureBlobURL;
    },
    getAzureProtocol: function() {
        return getAzureProtocol;
    }
});
function getAzureBlobHost(connect) {
    return `${connect.accountName}.blob.${connect.endpointSuffix}`;
}
function getAzureProtocol(connect) {
    let protocol = connect.endpointProtocol || 'https';
    const index = protocol.indexOf(':');
    if (index >= 0) protocol = protocol.slice(0, index);
    return protocol;
}
function getAzureBlobURL(connect, blob) {
    const protocol = getAzureProtocol(connect);
    const host = getAzureBlobHost(connect);
    blob = blob.replace(/^\/+/, '');
    return `${protocol}://${host}/${connect.container}/${blob}`;
}


/***/ }),

/***/ "./src/utils/azure/xml-entities.ts":
/*!*****************************************!*\
  !*** ./src/utils/azure/xml-entities.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {

/**!
 * @see https://github.com/mdevils/html-entities
 * @license MIT
 * @author mdevils "Marat Dulin"
 */ 
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    decodeXml: function() {
        return decodeXml;
    },
    decodeXmlEntity: function() {
        return decodeXmlEntity;
    },
    namedXmlCharacters: function() {
        return namedXmlCharacters;
    },
    namedXmlEntities: function() {
        return namedXmlEntities;
    }
});
const namedXmlCharacters = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
    "&": "&amp;"
};
const namedXmlEntities = {};
Object.keys(namedXmlCharacters).forEach((ch)=>namedXmlEntities[namedXmlCharacters[ch]] = ch);
const fromCharCode = String.fromCharCode;
const fromCodePoint = String.fromCodePoint || function(astralCodePoint) {
    return String.fromCharCode(Math.floor((astralCodePoint - 0x10000) / 0x400) + 0xd800, (astralCodePoint - 0x10000) % 0x400 + 0xdc00);
};
const outOfBoundsChar = fromCharCode(65533);
const numericUnicodeMap = {
    0: 65533,
    128: 8364,
    130: 8218,
    131: 402,
    132: 8222,
    133: 8230,
    134: 8224,
    135: 8225,
    136: 710,
    137: 8240,
    138: 352,
    139: 8249,
    140: 338,
    142: 381,
    145: 8216,
    146: 8217,
    147: 8220,
    148: 8221,
    149: 8226,
    150: 8211,
    151: 8212,
    152: 732,
    153: 8482,
    154: 353,
    155: 8250,
    156: 339,
    158: 382,
    159: 376
};
function decodeXmlEntity(entity) {
    if (!entity) return "";
    let decodeResult = entity;
    const decodeResultByReference = namedXmlEntities[entity];
    if (decodeResultByReference) {
        decodeResult = decodeResultByReference;
    } else if (entity[0] === "&" && entity[1] === "#") {
        const decodeSecondChar = entity[2];
        const decodeCode = decodeSecondChar == "x" || decodeSecondChar == "X" ? parseInt(entity.substr(3), 16) : parseInt(entity.substr(2));
        decodeResult = decodeCode >= 0x10ffff ? outOfBoundsChar : decodeCode > 65535 ? fromCodePoint(decodeCode) : fromCharCode(numericUnicodeMap[decodeCode] || decodeCode);
    }
    return decodeResult;
}
function decodeXml(xml) {
    if (!xml) return "";
    const macroRegExp = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);/g;
    macroRegExp.lastIndex = 0;
    let replaceMatch = macroRegExp.exec(xml);
    let replaceResult;
    if (replaceMatch) {
        replaceResult = "";
        let replaceLastIndex = 0;
        do {
            if (replaceLastIndex !== replaceMatch.index) {
                replaceResult += xml.substring(replaceLastIndex, replaceMatch.index);
            }
            const replaceInput = replaceMatch[0];
            replaceResult += decodeXmlEntity(replaceInput);
            replaceLastIndex = replaceMatch.index + replaceInput.length;
        }while (replaceMatch = macroRegExp.exec(xml))
        if (replaceLastIndex !== xml.length) {
            replaceResult += xml.substring(replaceLastIndex);
        }
    } else {
        replaceResult = xml;
    }
    return replaceResult;
}


/***/ }),

/***/ "./src/utils/env.ts":
/*!**************************!*\
  !*** ./src/utils/env.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    loadEnvFiles: function() {
        return loadEnvFiles;
    },
    readEnvFile: function() {
        return readEnvFile;
    }
});
const _fs = __webpack_require__(/*! fs */ "fs");
function loadEnvFiles(files) {
    for(let i = 0; i < files.length; i++){
        const file = files[i];
        const env = readEnvFile(file);
        const envNames = Object.keys(env);
        for(let j = 0; j < envNames.length; j++){
            const envName = envNames[j];
            process.env[envName] = env[envName];
        }
    }
}
function readEnvFile(file) {
    let env = '';
    try {
        env = _fs.readFileSync(file, 'utf8');
    } catch (error) {}
    const result = {};
    env.split('\n').map((it)=>it.trim()).filter((it)=>it).forEach((it)=>{
        const index = it.indexOf('=');
        if (index <= 0) return;
        const varName = it.slice(0, index);
        let varValue = it.slice(index + 1);
        if (/^['"].*['"]$/.test(varValue) && varValue[0] === varValue[varValue.length - 1]) varValue = varValue.slice(1, varValue.length - 1);
        result[varName] = varValue;
    });
    return result;
}


/***/ }),

/***/ "./src/utils/file.ts":
/*!***************************!*\
  !*** ./src/utils/file.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    fileStat: function() {
        return fileStat;
    },
    getHumanReadableFileSize: function() {
        return getHumanReadableFileSize;
    }
});
const _fs = __webpack_require__(/*! fs */ "fs");
const _path = __webpack_require__(/*! path */ "path");
function fileStat(file) {
    let stat;
    try {
        stat = _fs.statSync(file);
    } catch (error) {
        throw new Error(`Get stat of "${_path.basename(file)}" failed: ${error.message}`);
    }
    if (!stat.isFile()) throw new Error(`"${_path.basename(file)}" is not a file!`);
    return stat;
}
function getHumanReadableFileSize(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    const units = si ? [
        'kB',
        'MB',
        'GB',
        'TB',
        'PB',
        'EB',
        'ZB',
        'YB'
    ] : [
        'KiB',
        'MiB',
        'GiB',
        'TiB',
        'PiB',
        'EiB',
        'ZiB',
        'YiB'
    ];
    let u = -1;
    const r = 10 ** dp;
    do {
        bytes /= thresh;
        ++u;
    }while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)
    return bytes.toFixed(dp) + ' ' + units[u];
}


/***/ }),

/***/ "./src/utils/logger.ts":
/*!*****************************!*\
  !*** ./src/utils/logger.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "Logger", ({
    enumerable: true,
    get: function() {
        return Logger;
    }
}));
const noopFn = ()=>{};
class Logger {
    prefix;
    toStdout = (...args)=>console.log(this.prefix, ...args);
    toStderr = (...args)=>console.error(this.prefix, ...args);
    verbose;
    log = this.toStdout;
    error = (...args)=>console.error(this.prefix, ...args);
    fatal = (...args)=>{
        console.error(this.prefix, ...args);
        process.exit(1);
    };
    constructor(prefix){
        this.prefix = `${prefix}:`;
        this.verbose = noopFn;
    }
    setVerbose(verbose) {
        this.verbose = verbose ? this.log : noopFn;
    }
    setLogDest(dest) {
        if (dest === 'stderr') this.log = this.toStderr;
        else this.log = this.toStdout;
    }
}


/***/ }),

/***/ "./src/utils/network-retry.ts":
/*!************************************!*\
  !*** ./src/utils/network-retry.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "networkRetry", ({
    enumerable: true,
    get: function() {
        return networkRetry;
    }
}));
const _logger = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
const logger = new _logger.Logger('NetworkRetry');
/**
 * @see https://github.com/sindresorhus/is-retry-allowed
 */ const errors = new Set([
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
    for(let i = 0; i < retries; i++){
        try {
            const result = await fn();
            return result;
        } catch (error) {
            const sysError = error;
            if (errors.has(sysError.errno) || errors.has(sysError.code)) {
                if (i >= retries - 1) throw error;
                logger.error(`network error ${sysError.errno}, waiting ${waitSeconds} seconds and retry ...`);
                await new Promise((resolve)=>setTimeout(resolve, waitSeconds * 1000));
            } else {
                throw error;
            }
        }
    }
}


/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!********************************!*\
  !*** ./src/cli/az-ls-blobs.ts ***!
  \********************************/

const _env = __webpack_require__(/*! ../utils/azure/env */ "./src/utils/azure/env.ts");
const _helper = __webpack_require__(/*! ./helper */ "./src/cli/helper.ts");
const _listblob = __webpack_require__(/*! ../utils/azure/blob/list-blob */ "./src/utils/azure/blob/list-blob.ts");
const _env1 = __webpack_require__(/*! ../utils/env */ "./src/utils/env.ts");
const _logger = __webpack_require__(/*! ../utils/logger */ "./src/utils/logger.ts");
const _networkretry = __webpack_require__(/*! ../utils/network-retry */ "./src/utils/network-retry.ts");
const _file = __webpack_require__(/*! ../utils/file */ "./src/utils/file.ts");
const _resultparser = __webpack_require__(/*! ../utils/azure/result-parser */ "./src/utils/azure/result-parser.ts");
const logger = new _logger.Logger(`AzListBlobs`);
main().catch(logger.fatal);
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
        ..._helper.envVarUsage,
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
    console.log(global['__version'] ? `v${global['__version']}` : 'unknown');
    process.exit(0);
}
async function main() {
    const allArgv = process.argv.slice(2);
    logger.setLogDest('stderr');
    let prefix;
    let maker;
    let limit = 1000;
    let overwriteContainer;
    const envFiles = [];
    let afterDoubleDash = false;
    for(let i = 0; i < allArgv.length; i++){
        const arg = allArgv[i];
        const getNextArg = ()=>{
            const nextArg = allArgv[++i];
            if (!nextArg) throw new Error(`Option '${arg}' requires argument`);
            return nextArg;
        };
        const resolvePositionalArgs = ()=>{
            if (!prefix) return prefix = arg;
            throw new Error(`Unknown argument '${arg}'`);
        };
        if (afterDoubleDash) {
            resolvePositionalArgs();
            continue;
        }
        switch(arg){
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
                logger.setVerbose(true);
                break;
            case '-m':
            case '--maker':
                maker = getNextArg();
                break;
            case '-n':
            case '--limit':
                {
                    const _limit = getNextArg();
                    limit = parseInt(_limit, 10);
                    if (limit > 0 === false) throw new Error(`Invalid value ${JSON.stringify(_limit)} for "${arg}"`);
                    break;
                }
            default:
                resolvePositionalArgs();
        }
    }
    (0, _env1.loadEnvFiles)(envFiles);
    const connect = new _env.AzureStorageEnv();
    if (overwriteContainer) connect.container = overwriteContainer;
    connect.assertKey();
    connect.assertContainer();
    if (prefix) logger.log(`prefix=${JSON.stringify(prefix)}`);
    if (maker) logger.log(`maker=${JSON.stringify(maker)}`);
    if (limit) logger.log(`limit=${limit}`);
    const xml = await (0, _networkretry.networkRetry)(()=>(0, _listblob.azListBlobs)({
            prefix,
            logger,
            connect,
            maxresults: limit
        }), 2, 5);
    const { blobs, next } = (0, _resultparser.parseListBlobsResult)(xml);
    const items = [
        [
            'Name',
            'Size',
            'Modified Date',
            'MD5'
        ]
    ].concat(blobs.map((blob)=>[
            blob.name,
            (0, _file.getHumanReadableFileSize)(blob.size),
            blob.mtime.toJSON(),
            blob.md5
        ]));
    const colWidths = new Array(4).fill(0).map((_, i)=>Math.max(...items.map((item)=>item[i].length)) + 1);
    for(let i = 0; i < items.length; i++){
        const row = items[i].map((text, col)=>text.padEnd(colWidths[col], ' ')).join(' | ');
        console.log(row);
    }
    if (next) logger.log(`nextMaker=${next}`);
}

})();

/******/ })()
;
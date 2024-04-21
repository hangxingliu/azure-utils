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

/***/ "./src/utils/azure/blob/del-blob.ts":
/*!******************************************!*\
  !*** ./src/utils/azure/blob/del-blob.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "azDelBlob", ({
    enumerable: true,
    get: function() {
        return azDelBlob;
    }
}));
const _https = __webpack_require__(/*! https */ "https");
const _sharedkeylite = __webpack_require__(/*! ../shared-key-lite */ "./src/utils/azure/shared-key-lite.ts");
const _types = __webpack_require__(/*! ../types */ "./src/utils/azure/types.ts");
const x_ms_version = '2020-10-02';
function azDelBlob(args) {
    const { connect, logger } = args;
    const { container, accountName } = connect;
    const method = 'DELETE';
    const date = new Date();
    const blob = args.blob.replace(/^\//, '');
    const authorization = (0, _sharedkeylite.createSharedKeyLite)({
        connect,
        verb: method,
        resourceUri: args.blob,
        canonicalizedHeaders: [
            `x-ms-date:${date.toUTCString()}`,
            `x-ms-version:${x_ms_version}`
        ].join('\n')
    });
    return new Promise((resolve, reject)=>{
        let statusCode = -1;
        let contentType = '';
        let data = '';
        const apiPath = `/${container}/${encodeURI(blob)}`;
        logger.log(`request delete api uri="${apiPath}" ...`);
        const req = (0, _https.request)({
            host: (0, _types.getAzureBlobHost)(connect),
            path: apiPath,
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
                if (statusCode !== 202) return rejectWithLog(`HTTP status code is not 202 but ${statusCode}`, data);
                logger.verbose(`api response code=${statusCode}`);
                resolve(res.headers);
            });
        });
        req.on('error', rejectWithLog);
        req.end();
        function rejectWithLog(error, details) {
            if (!error) return;
            const message = typeof error === 'string' ? error : error.message;
            logger.error(`delete failed! ${message} ${details ? 'details:' : ''}`);
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

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

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
  !*** ./src/cli/az-del-blob.ts ***!
  \********************************/

const _url = __webpack_require__(/*! url */ "url");
const _helper = __webpack_require__(/*! ./helper */ "./src/cli/helper.ts");
const _env = __webpack_require__(/*! ../utils/azure/env */ "./src/utils/azure/env.ts");
const _delblob = __webpack_require__(/*! ../utils/azure/blob/del-blob */ "./src/utils/azure/blob/del-blob.ts");
const _types = __webpack_require__(/*! ../utils/azure/types */ "./src/utils/azure/types.ts");
const _env1 = __webpack_require__(/*! ../utils/env */ "./src/utils/env.ts");
const _logger = __webpack_require__(/*! ../utils/logger */ "./src/utils/logger.ts");
const logger = new _logger.Logger(`AzDelBlob`);
main().catch(logger.fatal);
function usage() {
    const bin = 'az-del-blob';
    console.log([
        '',
        `  Usage: ${bin} <remoteFiles...>`,
        '',
        '  Options:',
        '',
        '    --env       <envFile>        [multiple] load env variables from files if they are existed',
        '    --container <containerName>  provide container name (this argument has a higher priority than environment variable)',
        '    --verbose                    print verbose logs',
        '',
        ..._helper.envVarUsage,
        '  Example:',
        '',
        `    ${bin} file.tar file2.tar`,
        `    ${bin} xxxx.blob.windows.net/file.zip local-file.zip`,
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
    let remoteFiles = [];
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
            return remoteFiles.push(arg);
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
            default:
                resolvePositionalArgs();
        }
    }
    if (remoteFiles.length === 0) return usage();
    (0, _env1.loadEnvFiles)(envFiles);
    const connect = new _env.AzureStorageEnv();
    if (overwriteContainer) connect.container = overwriteContainer;
    connect.assertKey();
    connect.assertContainer();
    let blobs = [];
    for(let i = 0; i < remoteFiles.length; i++){
        const remote = remoteFiles[i];
        let blob;
        let exactMatchedURL = true;
        let remoteURL = safeParseURL(remote);
        const azureHost = (0, _types.getAzureBlobHost)(connect);
        if (!remoteURL) {
            exactMatchedURL = false;
            remoteURL = safeParseURL(`${(0, _types.getAzureProtocol)(connect)}://${remote}`);
        }
        if (remoteURL) {
            if (remoteURL.hostname === azureHost) {
                const mtx = remoteURL.pathname.match(/^\/([\w-]+)\/(.+)$/);
                if (!mtx) throw new Error(`Unsupported URL "${remoteURL.toString()}"`);
                connect.endpointProtocol = remoteURL.protocol.replace(':', '');
                connect.container = mtx[1];
                blob = mtx[2];
                logger.log(`container=${mtx[1]} blob=${mtx[2]}`);
            } else {
                if (exactMatchedURL) throw new Error(`The host "${remoteURL.hostname}" is not matched the host "${azureHost}" from Azure connection info`);
            }
        }
        if (!blob) blob = remote.replace(/^\//, '');
        blobs.push(blob);
    }
    const startedAt = Date.now();
    for(let i = 0; i < blobs.length; i++){
        const blob = blobs[i];
        await (0, _delblob.azDelBlob)({
            connect,
            blob,
            logger
        });
        logger.log(`[${i + 1}/${blobs.length}] deleted "${blob}"`);
    }
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const noun = blobs.length > 1 ? `blobs` : `blob`;
    logger.log(`deleted ${blobs.length} ${noun} +${elapsed}s`);
}
function safeParseURL(url) {
    try {
        return new _url.URL(url);
    } catch (error) {
        return null;
    }
}

})();

/******/ })()
;
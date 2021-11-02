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

;// CONCATENATED MODULE: external "url"
const external_url_namespaceObject = require("url");
;// CONCATENATED MODULE: external "fs"
const external_fs_namespaceObject = require("fs");
;// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = require("path");
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
        const hash = external_crypto_namespaceObject.createHash('md5');
        const rs = external_fs_namespaceObject.createReadStream(file);
        rs.on('error', reject);
        rs.on('data', chunk => hash.update(chunk));
        rs.on('end', () => resolve(hash.digest('base64')));
    });
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

;// CONCATENATED MODULE: ./src/utils/azure/blob/blob-sas.ts


const signedVersion = "2020-10-02";
function createSASForBlob(options) {
    const { connect, blob, expiryMinutes, permissions } = options;
    const { container, accountKey, accountName } = connect;
    const exp = expiryMinutes || 30;
    /** signedStart */
    const st = date2string(new Date()); // Start time
    /** signedExpiry */
    const se = date2string(Date.now() + exp * 60 * 1000); // Expiry time
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
        "",
        "",
        signedProtocol,
        signedVersion,
        sr,
        "",
        "",
        "",
        "",
        "",
        "", //rsct
    ].join('\n');
    const sig = hmacSHA256(accountKey, stringToSign);
    const qs = { sp, st, se, spr: signedProtocol, sv: signedVersion, sr, sig };
    const qsString = Object.keys(qs).map(key => `${key}=${encodeURIComponent(qs[key])}`).join('&');
    const url = `${signedProtocol}://${getAzureBlobHost(connect)}/${container}/${blob}?${qsString}`;
    return { url, qs, sig };
}
function date2string(d) {
    return new Date(d).toJSON().replace(/\.\d{0,3}Z$/, 'Z');
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

;// CONCATENATED MODULE: external "https"
const external_https_namespaceObject = require("https");
;// CONCATENATED MODULE: ./src/utils/download.ts


function downlaodToStream(args) {
    return new Promise((resolve, reject) => {
        let statusCode = -1;
        let contentType = '';
        let contentMD5 = '';
        let contentLength = -1;
        let promise = Promise.resolve();
        const { stream, progressInterval, logger } = args;
        let lastProgressLog = Date.now();
        let downloaded = 0;
        let responsedAt = 0;
        const maskedURL = args.url.replace(/\?.+$/, '?****');
        logger.log(`downloading file from url "${maskedURL}" ...`);
        const req = external_https_namespaceObject.get(args.url, {}, res => {
            responsedAt = Date.now();
            statusCode = res.statusCode;
            if (statusCode !== 200) {
                logger.log(`headers: ${JSON.stringify(res.headers)}`);
                return rejectWithLog(`Server response status code is ${statusCode} but not 200`);
            }
            const rawContentLength = res.headers['content-length'];
            if (rawContentLength) {
                contentLength = parseInt(rawContentLength, 10);
                if (isNaN(contentLength) || contentLength < 0)
                    return rejectWithLog(`Invalid content-length: "${rawContentLength}"`);
            }
            contentType = res.headers["content-type"];
            contentMD5 = String(res.headers['content-md5']);
            const logResp = [];
            if (contentLength >= 0)
                logResp.push(`size=${contentLength} "${getHumanReadableFileSize(contentLength)}"`);
            if (contentType)
                logResp.push(`type="${contentType}"`);
            if (contentMD5)
                logResp.push(`md5="${contentMD5}"`);
            logger.log(`server response ${logResp.join(' ')}`);
            res.on('data', write);
            res.on('end', () => {
                promise = promise.then(() => resolve({
                    contentLength,
                    contentMD5,
                    contentType,
                    headers: res.headers
                }));
            });
        });
        req.on('error', rejectWithLog);
        req.end();
        function write(data) {
            promise = promise.then(() => new Promise((resolve, reject) => stream.write(data, (e) => {
                if (e)
                    return reject(e);
                downloaded += data.length;
                try {
                    printProgress();
                }
                catch (error) { }
                resolve();
            })));
        }
        function printProgress() {
            if (progressInterval >= 0 === false)
                return;
            const now = Date.now();
            if (progressInterval !== 0) {
                if (now < lastProgressLog + progressInterval)
                    return;
                lastProgressLog = now;
            }
            const elapsed = (now - responsedAt) / 1000;
            logger.progress(downloaded, contentLength, elapsed);
        }
        function rejectWithLog(error, details) {
            if (!error)
                return;
            const message = typeof error === 'string' ? error : error.message;
            logger.error(`download failed! ${message} ${details ? 'details:' : ''}`);
            if (details)
                logger.error(details);
            reject(error);
        }
    });
}

;// CONCATENATED MODULE: ./src/cli/az-download.ts












const logger = new Logger(`AzDownload`);
main().catch(logger.fatal);
function usage() {
    const bin = 'az-download';
    console.log([
        '',
        `  Usage: ${bin} <remoteFile> [localFile/localDir] [options...]`,
        '',
        '  Options:',
        '',
        '    --env       <envFile>        [multiple] load env variables from files if they are existed',
        '    --url                        do not download the file but get the signed url for the resource',
        '    --container <containerName>  provide container name (this argument has a higher priority than environment variable)',
        '    --verbose                    print verbose logs',
        '',
        ...envVarUsage,
        '  Example:',
        '',
        `    ${bin} file.tar /path/to/local`,
        `    ${bin} file.tar /path/to/local/file2.tar`,
        `    ${bin} file.tar --url`,
        `    ${bin} xxxx.blob.windows.net/file.zip local-file.zip`,
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
    let local;
    let remote;
    let verbose = false;
    let onlyURL = false;
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
            if (!remote)
                return remote = arg;
            if (!local)
                return local = arg;
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
            case '--url':
                onlyURL = true;
                logger.setLogDest('stderr');
                break;
            case '--container':
                overwriteContainer = getNextArg();
                break;
            case '--env':
                envFiles.push(getNextArg());
                break;
            case '--verbose':
                verbose = true;
                logger.setVerbose(true);
                break;
            default: resolvePositionalArgs();
        }
    }
    if (!remote)
        return usage();
    if (!local)
        local = '.';
    loadEnvFiles(envFiles);
    const connect = new AzureStorageEnv();
    if (overwriteContainer)
        connect.container = overwriteContainer;
    connect.assertKey();
    connect.assertContainer();
    let blob;
    let exactMatchedURL = true;
    let remoteURL = safeParseURL(remote);
    const azureHost = getAzureBlobHost(connect);
    if (!remoteURL) {
        exactMatchedURL = false;
        remoteURL = safeParseURL(`${getAzureProtocol(connect)}://${remote}`);
    }
    if (remoteURL) {
        if (remoteURL.hostname === azureHost) {
            const mtx = remoteURL.pathname.match(/^\/([\w-]+)\/(.+)$/);
            if (!mtx)
                throw new Error(`Unsupported URL "${remoteURL.toString()}"`);
            connect.endpointProtocol = remoteURL.protocol.replace(':', '');
            connect.container = mtx[1];
            blob = mtx[2];
            logger.log(`container=${mtx[1]} blob=${mtx[2]}`);
        }
        else {
            if (exactMatchedURL)
                throw new Error(`The host "${remoteURL.hostname}" is not matched the host "${azureHost}" from Azure connection info`);
        }
    }
    if (!blob)
        blob = remote.replace(/^\//, '');
    let localAsDir = false;
    try {
        const stat = external_fs_namespaceObject.statSync(local);
        if (stat.isDirectory())
            localAsDir = true;
    }
    catch (error) { }
    let targetFile;
    if (localAsDir) {
        targetFile = external_path_namespaceObject.join(local, external_path_namespaceObject.basename(blob));
    }
    else {
        targetFile = local;
    }
    logger.log(`local=${targetFile}`);
    const result = createSASForBlob({ connect, blob });
    if (onlyURL)
        return console.log(result.url);
    const startedAt = Date.now();
    const localFileName = external_path_namespaceObject.basename(targetFile);
    const stream = external_fs_namespaceObject.createWriteStream(targetFile);
    const { contentMD5 } = await downlaodToStream({
        url: result.url,
        stream,
        progressInterval: verbose ? 2000 : 5000,
        logger: {
            log: msg => logger.log(msg),
            error: msg => logger.error(msg),
            progress: (_now, _all, elapsed) => {
                const percent = _all >= 0 ? ((_now / _all * 100).toFixed(2) + '%') : '--';
                const now = getHumanReadableFileSize(_now);
                const all = getHumanReadableFileSize(_all);
                logger.log(`progress=${percent} [${now}/${all}] +${elapsed}s`);
            }
        }
    });
    stream.close();
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    logger.log(`downloaded to "${localFileName}" +${elapsed}s`);
    if (contentMD5) {
        const localMD5 = await getFileMD5Base64(targetFile);
        if (contentMD5 !== localMD5)
            throw new Error(`md5sums are different between local and remote, local md5sum is "${localMD5}"`);
    }
}
function safeParseURL(url) {
    try {
        return new external_url_namespaceObject.URL(url);
    }
    catch (error) {
        return null;
    }
}

/******/ })()
;
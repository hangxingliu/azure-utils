#!/usr/bin/env node

global.__version='1.1.0';
function __swcpack_require__(mod) {
    function interop(obj) {
        if (obj && obj.__esModule) {
            return obj;
        } else {
            var newObj = {};
            if (obj != null) {
                for(var key in obj){
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                        if (desc.get || desc.set) {
                            Object.defineProperty(newObj, key, desc);
                        } else {
                            newObj[key] = obj[key];
                        }
                    }
                }
            }
            newObj.default = obj;
            return newObj;
        }
    }
    var cache;
    if (cache) {
        return cache;
    }
    var module = {
        exports: {}
    };
    mod(module, module.exports);
    cache = interop(module.exports);
    return cache;
}
var load = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.envVarUsage = void 0;
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
    exports.envVarUsage = envVarUsage;
});
var load1 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.rng = rng;
    exports.uuidv4 = uuidv4;
    exports.uuidv4Base64 = uuidv4Base64;
    exports.hmacSHA256 = hmacSHA256;
    exports.getFileMD5Base64 = getFileMD5Base64;
    var fs = require("fs");
    var crypto = require("crypto");
    const rnds8Pool = new Uint8Array(256);
    let poolPtr = rnds8Pool.length;
    const byteToHex = [];
    for(let i = 0; i < 256; ++i)byteToHex.push((i + 256).toString(16).substr(1));
    function stringify(arr, offset = 0) {
        const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
        return uuid;
    }
    function rng() {
        if (poolPtr > rnds8Pool.length - 16) {
            crypto.randomFillSync(rnds8Pool);
            poolPtr = 0;
        }
        return rnds8Pool.slice(poolPtr, poolPtr += 16);
    }
    function uuidv4() {
        const rnds = rng();
        rnds[6] = rnds[6] & 15 | 64;
        rnds[8] = rnds[8] & 63 | 128;
        return stringify(rnds);
    }
    function uuidv4Base64() {
        const rnds = rng();
        rnds[6] = rnds[6] & 15 | 64;
        rnds[8] = rnds[8] & 63 | 128;
        return Buffer.from(rnds).toString('base64');
    }
    function hmacSHA256(key, data) {
        const hmac = crypto.createHmac("sha256", Buffer.from(key, "base64"));
        hmac.update(data);
        return hmac.digest("base64");
    }
    function getFileMD5Base64(file) {
        return new Promise((resolve, reject)=>{
            const hash = crypto.createHash('md5');
            const rs = fs.createReadStream(file);
            rs.on('error', reject);
            rs.on('data', (chunk)=>hash.update(chunk)
            );
            rs.on('end', ()=>resolve(hash.digest('base64'))
            );
        });
    }
});
var load2 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.createSharedKeyLite = createSharedKeyLite;
    var _crypto1 = load1();
    function createSharedKeyLite(args) {
        const { connect , resourceUri  } = args;
        const { container , accountName , accountKey  } = connect;
        let canonicalizedResource = `/${accountName}`;
        if (container) canonicalizedResource += container.replace(/^\/*/, '/');
        if (resourceUri) canonicalizedResource += encodeURI(resourceUri).replace(/^\/*/, '/');
        if (args.qs) {
            const pickKeys = new Set([
                'comp'
            ]);
            const qs = [];
            Object.keys(args.qs).forEach((it)=>qs[it.toLowerCase()] = args.qs[it]
            );
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
            args.contenType || '',
            args.headerDate?.toUTCString() || '',
            args.canonicalizedHeaders || '',
            canonicalizedResource, 
        ].join('\n');
        return `SharedKeyLite ${accountName}:${(0, _crypto1).hmacSHA256(accountKey, stringToSign)}`;
    }
});
var load3 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.getAzureBlobHost = getAzureBlobHost;
    exports.getAzureProtocol = getAzureProtocol;
    function getAzureBlobHost(connect) {
        return `${connect.accountName}.blob.${connect.endpointSuffix}`;
    }
    function getAzureProtocol(connect) {
        let protocol = connect.endpointProtocol || 'https';
        const index = protocol.indexOf(':');
        if (index >= 0) protocol = protocol.slice(0, index);
        return protocol;
    }
});
var load4 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.azPutBlob = azPutBlob;
    var fs = require("fs");
    var _https = require("https");
    var _sharedKeyLite = load2();
    var _types = load3();
    const x_ms_version = '2020-10-02';
    function azPutBlob(args) {
        const { connect , logger: logger1  } = args;
        const { container  } = connect;
        const method = 'PUT';
        const date = new Date();
        const blob = args.blob.replace(/^\//, '');
        const authorization = (0, _sharedKeyLite).createSharedKeyLite({
            verb: method,
            connect,
            resourceUri: args.blob,
            canonicalizedHeaders: [
                'x-ms-blob-type:BlockBlob',
                `x-ms-date:${date.toUTCString()}`,
                `x-ms-version:${x_ms_version}`, 
            ].join('\n')
        });
        let size = args.contentLength;
        if (typeof size !== 'number') {
            const stat = fs.statSync(args.file);
            size = stat.size;
        }
        const stream = fs.createReadStream(args.file);
        return new Promise((resolve, reject)=>{
            let statusCode = -1;
            let contentType = '';
            let data = '';
            const apiPath = `/${container}/${encodeURI(blob)}`;
            logger1.log(`request put blob api uri="${apiPath}" size=${size} ...`);
            const req = (0, _https).request({
                host: (0, _types).getAzureBlobHost(connect),
                path: apiPath,
                method,
                headers: {
                    Authorization: authorization,
                    'Content-Length': size,
                    'x-ms-blob-type': 'BlockBlob',
                    'x-ms-version': x_ms_version,
                    'x-ms-date': date.toUTCString()
                }
            }, (res)=>{
                statusCode = res.statusCode;
                contentType = res.headers["content-type"];
                res.on('data', (chunk)=>data += chunk.toString()
                );
                res.on('end', ()=>{
                    if (statusCode !== 201) return rejectWithLog(`HTTP status code is ${statusCode} but not 201`, data);
                    logger1.verbose(`api response code=${statusCode} content-type=${contentType || ''}`);
                    resolve(res.headers);
                });
            });
            req.on('error', rejectWithLog);
            stream.pipe(req);
            function rejectWithLog(error, details) {
                if (!error) return;
                const message = typeof error === 'string' ? error : error.message;
                logger1.error(`put blob failed! ${message} ${details ? 'details:' : ''}`);
                if (details) logger1.error(details);
                reject(error);
            }
        });
    }
});
var load5 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.azCopyBlob = azCopyBlob;
    var _https = require("https");
    var _sharedKeyLite = load2();
    var _types = load3();
    const x_ms_version = '2020-10-02';
    function azCopyBlob(args) {
        const { connect , logger: logger2 , source  } = args;
        const { container , accountName , endpointSuffix  } = connect;
        const method = 'PUT';
        const date = new Date();
        const blob = args.blob.replace(/^\//, '');
        const sourceURL = [
            `https://${source.account || accountName}.blob.${endpointSuffix}/`,
            source.container || container,
            '/',
            source.blob,
            source.sasToken ? `?${source.sasToken}` : '', 
        ].join('');
        const sourceName = [
            source.account || accountName,
            '/',
            source.container || container,
            '/',
            source.blob, 
        ].join('');
        const authorization = (0, _sharedKeyLite).createSharedKeyLite({
            connect,
            verb: method,
            resourceUri: args.blob,
            canonicalizedHeaders: [
                `x-ms-copy-source:${sourceURL}`,
                `x-ms-date:${date.toUTCString()}`,
                `x-ms-version:${x_ms_version}`, 
            ].join('\n')
        });
        return new Promise((resolve, reject)=>{
            let statusCode = -1;
            let contentType = '';
            let data = '';
            const apiPath = `/${container}/${encodeURI(blob)}`;
            logger2.log(`request copy api uri="${accountName}/${container}/${blob}" x-ms-copy-source="${sourceName}" ...`);
            const req = (0, _https).request({
                host: (0, _types).getAzureBlobHost(connect),
                path: apiPath,
                method,
                headers: {
                    Authorization: authorization,
                    'Content-Length': '0',
                    'x-ms-copy-source': sourceURL,
                    'x-ms-version': x_ms_version,
                    'x-ms-date': date.toUTCString()
                }
            }, (res)=>{
                statusCode = res.statusCode;
                contentType = res.headers["content-type"];
                res.on('data', (chunk)=>data += chunk.toString()
                );
                res.on('end', ()=>{
                    if (statusCode !== 201 && statusCode !== 202) return rejectWithLog(`HTTP status code is ${statusCode} but not 201 or 202`, data);
                    logger2.verbose(`api response code=${statusCode} x-ms-copy-status=${res.headers['x-ms-copy-status'] || ''}`);
                    resolve(res.headers);
                });
            });
            req.on('error', rejectWithLog);
            req.end();
            function rejectWithLog(error, details) {
                if (!error) return;
                const message = typeof error === 'string' ? error : error.message;
                logger2.error(`copy failed! ${message} ${details ? 'details:' : ''}`);
                if (details) logger2.error(details);
                reject(error);
            }
        });
    }
});
var load6 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.azPutBlockList = azPutBlockList;
    var _https = require("https");
    var _sharedKeyLite = load2();
    var _types = load3();
    const x_ms_version = '2020-10-02';
    function azPutBlockList(args) {
        const { connect , logger: logger3  } = args;
        const { container  } = connect;
        const method = 'PUT';
        const date = new Date();
        const blob = args.blob.replace(/^\//, '');
        const authorization = (0, _sharedKeyLite).createSharedKeyLite({
            verb: method,
            connect,
            resourceUri: args.blob + `?comp=blocklist`,
            canonicalizedHeaders: [
                `x-ms-date:${date.toUTCString()}`,
                `x-ms-version:${x_ms_version}`, 
            ].join('\n')
        });
        const postBody = `<?xml version="1.0" encoding="utf-8"?><BlockList>\n` + args.blockUUIDs.map((it)=>`<Latest>${it}</Latest>`
        ).join('\n') + `\n</BlockList>`;
        return new Promise((resolve, reject)=>{
            let statusCode = -1;
            let contentType = '';
            let data = '';
            const apiPath = `/${container}/${encodeURI(blob)}?comp=blocklist`;
            logger3.log(`request put block list api uri="${apiPath}" ...`);
            const req = (0, _https).request({
                host: (0, _types).getAzureBlobHost(connect),
                path: apiPath,
                method,
                headers: {
                    Authorization: authorization,
                    'Content-Length': postBody.length,
                    'x-ms-version': x_ms_version,
                    'x-ms-date': date.toUTCString()
                }
            }, (res)=>{
                statusCode = res.statusCode;
                contentType = res.headers["content-type"];
                res.on('data', (chunk)=>data += chunk.toString()
                );
                res.on('end', ()=>{
                    if (statusCode !== 201) return rejectWithLog(`HTTP status code is ${statusCode} but not 201`, data);
                    logger3.verbose(`api response code=${statusCode} content-type=${contentType || ''}`);
                    resolve(res.headers);
                });
            });
            req.on('error', rejectWithLog);
            req.write(postBody);
            function rejectWithLog(error, details) {
                if (!error) return;
                const message = typeof error === 'string' ? error : error.message;
                logger3.error(`put blob list failed! ${message} ${details ? 'details:' : ''}`);
                if (details) logger3.error(details);
                reject(error);
            }
        });
    }
});
var load7 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.azPutBlock = azPutBlock;
    var fs = require("fs");
    var _https = require("https");
    var _sharedKeyLite = load2();
    var _types = load3();
    const x_ms_version = '2020-10-02';
    function azPutBlock(args) {
        const { connect , logger: logger4 , block  } = args;
        const { container  } = connect;
        const method = 'PUT';
        const date = new Date();
        const blob = args.blob.replace(/^\//, '');
        const authorization = (0, _sharedKeyLite).createSharedKeyLite({
            verb: method,
            connect,
            resourceUri: args.blob + `?comp=block`,
            canonicalizedHeaders: [
                'x-ms-blob-type:BlockBlob',
                `x-ms-date:${date.toUTCString()}`,
                `x-ms-version:${x_ms_version}`, 
            ].join('\n')
        });
        const stream = fs.createReadStream(block.file, {
            start: block.startPos,
            end: block.endPos - 1
        });
        const size = block.endPos - block.startPos;
        return new Promise((resolve, reject)=>{
            let statusCode = -1;
            let contentType = '';
            let data = '';
            const apiPath = `/${container}/${encodeURI(blob)}?comp=block&blockid=${encodeURIComponent(block.uuid)}`;
            logger4.log(`request put block api uri="${apiPath}" size=${size} ...`);
            const req = (0, _https).request({
                host: (0, _types).getAzureBlobHost(connect),
                path: apiPath,
                method,
                headers: {
                    Authorization: authorization,
                    'Content-Length': size,
                    'x-ms-blob-type': 'BlockBlob',
                    'x-ms-version': x_ms_version,
                    'x-ms-date': date.toUTCString()
                }
            }, (res)=>{
                statusCode = res.statusCode;
                contentType = res.headers["content-type"];
                res.on('data', (chunk)=>data += chunk.toString()
                );
                res.on('end', ()=>{
                    if (statusCode !== 201) return rejectWithLog(`HTTP status code is ${statusCode} but not 201`, data);
                    logger4.verbose(`api response code=${statusCode} content-type=${contentType || ''}`);
                    resolve(res.headers);
                });
            });
            req.on('error', rejectWithLog);
            stream.pipe(req);
            function rejectWithLog(error, details) {
                if (!error) return;
                const message = typeof error === 'string' ? error : error.message;
                logger4.error(`put block failed! ${message} ${details ? 'details:' : ''}`);
                if (details) logger4.error(details);
                reject(error);
            }
        });
    }
});
var load8 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.getBlocksFormLocalFile = getBlocksFormLocalFile;
    exports.azBlockSizeSmall = exports.azBlockSize = void 0;
    var fs = require("fs");
    var _crypto2 = load1();
    const azBlockSize = 62914560;
    exports.azBlockSize = azBlockSize;
    const azBlockSizeSmall = 2097152;
    exports.azBlockSizeSmall = azBlockSizeSmall;
    function getBlocksFormLocalFile(file) {
        const stat = fs.statSync(file);
        const fileSize = stat.size;
        let startPos = 0;
        let index = 0;
        const result = [];
        while(startPos < fileSize){
            const endPos = Math.min(startPos + 62914560, fileSize);
            const uuid = (0, _crypto2).uuidv4Base64();
            result.push({
                uuid,
                file,
                fileSize,
                index,
                startPos,
                endPos
            });
            startPos = endPos;
            index++;
        }
        if (result.length >= 2) {
            const { startPos , endPos  } = result[result.length - 1];
            if (endPos - startPos < 2097152) {
                result.pop();
                result[result.length - 1].endPos = endPos;
            }
        }
        return result;
    }
});
var load9 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    class AzureStorageEnv {
        assertKey() {
            if (!this.accountKey) throw new Error(`Access key for Azure storage is not found in environment variables: "AZURE_STORAGE_KEY", "AZURE_STORAGE_CONNECTION_STRING"`);
        }
        assertContainer() {
            if (!this.accountName) throw new Error(`Azure blob storage account is not found in environment variables: "AZURE_STORAGE_ACCOUNT", "AZURE_STORAGE_CONTAINER", "AZURE_STORAGE_CONNECTION_STRING"`);
            if (!this.container) throw new Error(`Azure blob container is not found in environment variables: "AZURE_STORAGE_CONTAINER", "AZURE_STORAGE_CONNECTION_STRING"`);
        }
        constructor(env = process.env){
            this.endpointProtocol = 'https';
            this.endpointSuffix = 'core.windows.net';
            const hasEnv = (envName)=>typeof env[envName] === 'string' ? env[envName] : ''
            ;
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
            }
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
    }
    exports.AzureStorageEnv = AzureStorageEnv;
});
var load10 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.loadEnvFiles = loadEnvFiles;
    exports.readEnvFile = readEnvFile;
    var fs = require("fs");
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
            env = fs.readFileSync(file, 'utf8');
        } catch (error) {}
        const result = {};
        env.split('\n').map((it)=>it.trim()
        ).filter((it)=>it
        ).forEach((it)=>{
            const index = it.indexOf('=');
            if (index <= 0) return;
            const varName = it.slice(0, index);
            let varValue = it.slice(index + 1);
            if (/^['"].*['"]$/.test(varValue) && varValue[0] === varValue[varValue.length - 1]) varValue = varValue.slice(1, varValue.length - 1);
            result[varName] = varValue;
        });
        return result;
    }
});
var load11 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    const noopFn = ()=>{};
    class Logger {
        setVerbose(verbose) {
            this.verbose = verbose ? this.log : noopFn;
        }
        setLogDest(dest) {
            if (dest === 'stderr') this.log = this.toStderr;
            else this.log = this.toStdout;
        }
        constructor(prefix){
            this.toStdout = (...args)=>console.log(this.prefix, ...args)
            ;
            this.toStderr = (...args)=>console.error(this.prefix, ...args)
            ;
            this.log = this.toStdout;
            this.error = (...args)=>console.error(this.prefix, ...args)
            ;
            this.fatal = (...args)=>{
                console.error(this.prefix, ...args);
                process.exit(1);
            };
            this.prefix = `${prefix}:`;
            this.verbose = noopFn;
        }
    }
    exports.Logger = Logger;
});
var load12 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.networkRetry = networkRetry;
    var _logger1 = load11();
    const logger5 = new _logger1.Logger('NetworkRetry');
    const errors = new Set([
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ENETUNREACH',
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
        for(let i = 0; i < retries; i++)try {
            const result = await fn();
            return result;
        } catch (error) {
            const sysError = error;
            if (errors.has(sysError.errno) || errors.has(sysError.code)) {
                if (i >= retries - 1) throw error;
                logger5.error(`network error ${sysError.errno}, waiting ${waitSeconds} seconds and retry ...`);
                await new Promise((resolve)=>setTimeout(resolve, waitSeconds * 1000)
                );
            } else throw error;
        }
    }
});
var load13 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.fileStat = fileStat;
    exports.getHumanReadableFileSize = getHumanReadableFileSize;
    var fs = require("fs");
    var path1 = require("path");
    function fileStat(file) {
        let stat;
        try {
            stat = fs.statSync(file);
        } catch (error) {
            throw new Error(`Get stat of "${path1.basename(file)}" failed: ${error.message}`);
        }
        if (!stat.isFile()) throw new Error(`"${path1.basename(file)}" is not a file!`);
        return stat;
    }
    function getHumanReadableFileSize(bytes, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) return bytes + ' B';
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
});
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.resolveFileName = resolveFileName;
var path = require("path");
var _helper = load();
var _putBlob = load4();
var _copyBlob = load5();
var _putBlockList = load6();
var _putBlock = load7();
var _blockHelper = load8();
var _env = load9();
var _crypto = load1();
var _env1 = load10();
var _logger = load11();
var _networkRetry = load12();
var _file = load13();
const logger = new _logger.Logger(`AzUpload`);
main().catch(logger.fatal);
function usage() {
    const bin = 'az-upload';
    console.log([
        '',
        `  Usage: ${bin} <localFile> [remoteFile] [options...]`,
        '',
        '  Options:',
        '',
        '    --cp        <remoteFile>     [multiple] copy files on azure blob storage',
        '    --env       <envFile>        [multiple] load env variables from files if they are existed',
        '    --container <containerName>  provide container name (this argument has a higher priority than environment variable)',
        '    --verbose                    print verbose logs',
        '    --dryrun                     print the operations that would be performed without actual requesting and uploading',
        '',
        '  File name variables:',
        '',
        '    $yyyy, $mm, $dd, $HH, $MM, $SS, $uuid',
        '',
        ..._helper.envVarUsage,
        '  Example:',
        '',
        `    ${bin} file.tar`,
        `    ${bin} file.tar test-site/file.tar`,
        `    ${bin} dist.tar test-site/head.tar --cp test-site/$yyyy-$mm-$dd/$HH-$MM.tar`,
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
    let localFile;
    let remoteFile;
    let dryrun = false;
    let overwriteContainer;
    const copy = [];
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
            if (!localFile) return localFile = arg;
            if (!remoteFile) return remoteFile = arg;
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
            case '--cp':
                copy.push(getNextArg());
                break;
            case '--container':
                overwriteContainer = getNextArg();
                break;
            case '--env':
                envFiles.push(getNextArg());
                break;
            case '--verbose':
                logger.setVerbose(true);
                break;
            case '--dryrun':
                dryrun = true;
                break;
            default:
                resolvePositionalArgs();
        }
    }
    if (!localFile) return usage();
    (0, _env1).loadEnvFiles(envFiles);
    const connect = new _env.AzureStorageEnv();
    if (overwriteContainer) connect.container = overwriteContainer;
    connect.assertKey();
    connect.assertContainer();
    const localFileStat = (0, _file).fileStat(localFile);
    const localFileName = path.basename(localFile);
    const localFileSize = localFileStat.size;
    const now = new Date();
    const resolvedBlob = [];
    if (remoteFile) resolvedBlob.push(resolveFileName(remoteFile, {
        now
    }));
    else resolvedBlob.push(remoteFile = localFileName);
    copy.forEach((it)=>resolvedBlob.push(resolveFileName(it, {
            now
        }))
    );
    logger.log(`localFile=${JSON.stringify(localFileName)}`);
    logger.log(`size=${localFileSize} "${(0, _file).getHumanReadableFileSize(localFileSize)}"`);
    for(let i1 = 0; i1 < resolvedBlob.length; i1++){
        const remoteFile = resolvedBlob[i1];
        logger.log(`remoteFile[${i1}]=${JSON.stringify(`${connect.accountName}/${connect.container}/${remoteFile}`)}`);
    }
    const from = Date.now() / 1000;
    const blocks = (0, _blockHelper).getBlocksFormLocalFile(localFile);
    const firstBlob = resolvedBlob[0];
    let networkRetry = _networkRetry.networkRetry;
    if (dryrun) networkRetry = async ()=>null
    ;
    if (blocks.length <= 1) {
        logger.log(`uploadMode="put 1 blob"`);
        const uploadResult = await networkRetry(()=>(0, _putBlob).azPutBlob({
                logger,
                connect,
                blob: firstBlob,
                file: localFile
            })
        , 5);
        if (uploadResult?.["content-md5"]) {
            const remoteMD5 = uploadResult["content-md5"];
            logger.log(`md5sum(remoteFile)=${remoteMD5}`);
            const localMD5 = await (0, _crypto).getFileMD5Base64(localFile);
            if (localMD5 !== remoteMD5) throw new Error(`md5sums are different between local and remote, local md5sum is "${localMD5}"`);
        }
    } else {
        logger.log(`uploadMode="put ${blocks.length} blocks and put block list"`);
        for(let i = 0; i < blocks.length; i++){
            const block = blocks[i];
            const now = Date.now() / 1000;
            const elapsed = (now - from).toFixed(0);
            logger.log(`uploading block ${i + 1}/${blocks.length} "${block.uuid}" +${elapsed}s`);
            await networkRetry(()=>(0, _putBlock).azPutBlock({
                    logger,
                    connect,
                    blob: firstBlob,
                    block
                })
            , 5);
        }
        const blockUUIDs = blocks.map((it)=>it.uuid
        );
        await networkRetry(()=>(0, _putBlockList).azPutBlockList({
                logger,
                connect,
                blob: firstBlob,
                blockUUIDs
            })
        , 3);
    }
    for(let i2 = 1; i2 < resolvedBlob.length; i2++){
        const remoteFile = resolvedBlob[i2];
        logger.log(`copying the blob to "${remoteFile}"`);
        await networkRetry(()=>(0, _copyBlob).azCopyBlob({
                logger,
                connect,
                blob: remoteFile,
                source: {
                    blob: firstBlob
                }
            })
        , 3);
    }
    const elapsed = (Date.now() / 1000 - from).toFixed(0);
    logger.log(`uploaded done (elapsed ${elapsed}s)`);
}
function resolveFileName(fileName, context) {
    const date = context.now;
    const pad2 = (num)=>num < 10 ? `0${num}` : `${num}`
    ;
    return fileName.replace(/\$([a-zA-Z]{2,4})/g, (_, placeholder)=>{
        switch(placeholder){
            case 'yyyy':
                return date.getFullYear().toString();
            case 'yy':
                return date.getFullYear().toString().slice(2);
            case 'mm':
                return pad2(date.getMonth() + 1);
            case 'dd':
                return pad2(date.getDate());
            case 'HH':
                return pad2(date.getHours());
            case 'MM':
                return pad2(date.getMinutes());
            case 'SS':
                return pad2(date.getSeconds());
            case 'uuid':
                return (0, _crypto).uuidv4();
            default:
                return _;
        }
    });
}

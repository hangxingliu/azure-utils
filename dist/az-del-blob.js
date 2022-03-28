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
var load2 = __swcpack_require__.bind(void 0, function(module, exports) {
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
var load3 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.createSharedKeyLite = createSharedKeyLite;
    var _crypto = load2();
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
        return `SharedKeyLite ${accountName}:${(0, _crypto).hmacSHA256(accountKey, stringToSign)}`;
    }
});
var load4 = __swcpack_require__.bind(void 0, function(module, exports) {
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
var load5 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.azDelBlob = azDelBlob;
    var _https = require("https");
    var _sharedKeyLite = load3();
    var _types1 = load4();
    const x_ms_version = '2020-10-02';
    function azDelBlob(args) {
        const { connect , logger: logger1  } = args;
        const { container , accountName  } = connect;
        const method = 'DELETE';
        const date = new Date();
        const blob = args.blob.replace(/^\//, '');
        const authorization = (0, _sharedKeyLite).createSharedKeyLite({
            connect,
            verb: method,
            resourceUri: args.blob,
            canonicalizedHeaders: [
                `x-ms-date:${date.toUTCString()}`,
                `x-ms-version:${x_ms_version}`, 
            ].join('\n')
        });
        return new Promise((resolve, reject)=>{
            let statusCode = -1;
            let contentType = '';
            let data = '';
            const apiPath = `/${container}/${encodeURI(blob)}`;
            logger1.log(`request delete api uri="${apiPath}" ...`);
            const req = (0, _https).request({
                host: (0, _types1).getAzureBlobHost(connect),
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
                res.on('data', (chunk)=>data += chunk.toString()
                );
                res.on('end', ()=>{
                    if (statusCode !== 202) return rejectWithLog(`HTTP status code is not 202 but ${statusCode}`, data);
                    logger1.verbose(`api response code=${statusCode}`);
                    resolve(res.headers);
                });
            });
            req.on('error', rejectWithLog);
            req.end();
            function rejectWithLog(error, details) {
                if (!error) return;
                const message = typeof error === 'string' ? error : error.message;
                logger1.error(`delete failed! ${message} ${details ? 'details:' : ''}`);
                if (details) logger1.error(details);
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
var load7 = __swcpack_require__.bind(void 0, function(module, exports) {
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
"use strict";
var _url = require("url");
var _helper = load();
var _env = load1();
var _delBlob = load5();
var _types = load4();
var _env1 = load6();
var _logger = load7();
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
    (0, _env1).loadEnvFiles(envFiles);
    const connect = new _env.AzureStorageEnv();
    if (overwriteContainer) connect.container = overwriteContainer;
    connect.assertKey();
    connect.assertContainer();
    let blobs = [];
    for(let i1 = 0; i1 < remoteFiles.length; i1++){
        const remote = remoteFiles[i1];
        let blob;
        let exactMatchedURL = true;
        let remoteURL = safeParseURL(remote);
        const azureHost = (0, _types).getAzureBlobHost(connect);
        if (!remoteURL) {
            exactMatchedURL = false;
            remoteURL = safeParseURL(`${(0, _types).getAzureProtocol(connect)}://${remote}`);
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
    for(let i2 = 0; i2 < blobs.length; i2++){
        const blob = blobs[i2];
        await (0, _delBlob).azDelBlob({
            connect,
            blob,
            logger
        });
        logger.log(`[${i2 + 1}/${blobs.length}] deleted "${blob}"`);
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

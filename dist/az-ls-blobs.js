#!/usr/bin/env node

global.__version='1.1.1';
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
var load1 = __swcpack_require__.bind(void 0, function(module, exports) {
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
    exports.getAzureBlobURL = getAzureBlobURL;
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
});
var load5 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.azListBlobs = azListBlobs;
    var _https = require("https");
    var _sharedKeyLite = load3();
    var _types = load4();
    const x_ms_version = '2020-10-02';
    function azListBlobs(args) {
        const { connect , logger: logger1 , prefix , delimiter , marker , maxresults  } = args;
        const { container  } = connect;
        let qs = `?restype=container&comp=list`;
        if (prefix) qs = `${qs}&prefix=${encodeURIComponent(prefix)}`;
        if (delimiter) qs = `${qs}&delimiter=${encodeURIComponent(delimiter)}`;
        if (marker) qs = `${qs}&marker=${encodeURIComponent(marker)}`;
        if (maxresults) qs = `${qs}&maxresults=${encodeURIComponent(maxresults)}`;
        const method = 'GET';
        const date = new Date();
        const authorization = (0, _sharedKeyLite).createSharedKeyLite({
            verb: method,
            connect,
            resourceUri: '',
            qs: {
                comp: 'list'
            },
            canonicalizedHeaders: [
                `x-ms-date:${date.toUTCString()}`,
                `x-ms-version:${x_ms_version}`, 
            ].join('\n')
        });
        return new Promise((resolve, reject)=>{
            let statusCode = -1;
            let contentType = '';
            let data = '';
            logger1.verbose(`request list api uri="/${container}${qs}" ...`);
            const req = (0, _https).request({
                host: (0, _types).getAzureBlobHost(connect),
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
                res.on('data', (chunk)=>data += chunk.toString()
                );
                res.on('end', ()=>{
                    if (statusCode !== 200) return rejectWithLog(`HTTP status code is ${statusCode} but not 200`, data);
                    logger1.verbose(`api response code=${statusCode}`);
                    resolve(data);
                });
            });
            req.on('error', rejectWithLog);
            req.end();
            function rejectWithLog(error, details) {
                if (!error) return;
                const message = typeof error === 'string' ? error : error.message;
                logger1.error(`list blobs failed! ${message} ${details ? 'details:' : ''}`);
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
var load8 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.networkRetry = networkRetry;
    var _logger1 = load7();
    const logger2 = new _logger1.Logger('NetworkRetry');
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
                logger2.error(`network error ${sysError.errno}, waiting ${waitSeconds} seconds and retry ...`);
                await new Promise((resolve)=>setTimeout(resolve, waitSeconds * 1000)
                );
            } else throw error;
        }
    }
});
var load9 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.fileStat = fileStat;
    exports.getHumanReadableFileSize = getHumanReadableFileSize;
    var fs = require("fs");
    var path = require("path");
    function fileStat(file) {
        let stat;
        try {
            stat = fs.statSync(file);
        } catch (error) {
            throw new Error(`Get stat of "${path.basename(file)}" failed: ${error.message}`);
        }
        if (!stat.isFile()) throw new Error(`"${path.basename(file)}" is not a file!`);
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
var load10 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.decodeXmlEntity = decodeXmlEntity;
    exports.decodeXml = decodeXml;
    exports.namedXmlEntities = exports.namedXmlCharacters = void 0;
    const namedXmlCharacters = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
        "&": "&amp;"
    };
    exports.namedXmlCharacters = namedXmlCharacters;
    const namedXmlEntities = {};
    exports.namedXmlEntities = namedXmlEntities;
    Object.keys(namedXmlCharacters).forEach((ch)=>namedXmlEntities[namedXmlCharacters[ch]] = ch
    );
    const fromCharCode = String.fromCharCode;
    const fromCodePoint = String.fromCodePoint || function(astralCodePoint) {
        return String.fromCharCode(Math.floor((astralCodePoint - 65536) / 1024) + 55296, (astralCodePoint - 65536) % 1024 + 56320);
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
        if (decodeResultByReference) decodeResult = decodeResultByReference;
        else if (entity[0] === "&" && entity[1] === "#") {
            const decodeSecondChar = entity[2];
            const decodeCode = decodeSecondChar == "x" || decodeSecondChar == "X" ? parseInt(entity.substr(3), 16) : parseInt(entity.substr(2));
            decodeResult = decodeCode >= 1114111 ? outOfBoundsChar : decodeCode > 65535 ? fromCodePoint(decodeCode) : fromCharCode(numericUnicodeMap[decodeCode] || decodeCode);
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
                if (replaceLastIndex !== replaceMatch.index) replaceResult += xml.substring(replaceLastIndex, replaceMatch.index);
                const replaceInput = replaceMatch[0];
                replaceResult += decodeXmlEntity(replaceInput);
                replaceLastIndex = replaceMatch.index + replaceInput.length;
            }while (replaceMatch = macroRegExp.exec(xml))
            if (replaceLastIndex !== xml.length) replaceResult += xml.substring(replaceLastIndex);
        } else replaceResult = xml;
        return replaceResult;
    }
});
var load11 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseListBlobsResult = parseListBlobsResult;
    var _xmlEntities = load10();
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
            if (result) blob.name = (0, _xmlEntities).decodeXml(result.matched);
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
});
"use strict";
var _env = load();
var _helper = load1();
var _listBlob = load5();
var _env1 = load6();
var _logger = load7();
var _networkRetry = load8();
var _file = load9();
var _resultParser = load11();
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
    for(let i2 = 0; i2 < allArgv.length; i2++){
        const arg = allArgv[i2];
        const getNextArg = ()=>{
            const nextArg = allArgv[++i2];
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
    (0, _env1).loadEnvFiles(envFiles);
    const connect = new _env.AzureStorageEnv();
    if (overwriteContainer) connect.container = overwriteContainer;
    connect.assertKey();
    connect.assertContainer();
    if (prefix) logger.log(`prefix=${JSON.stringify(prefix)}`);
    if (maker) logger.log(`maker=${JSON.stringify(maker)}`);
    if (limit) logger.log(`limit=${limit}`);
    const xml = await (0, _networkRetry).networkRetry(()=>(0, _listBlob).azListBlobs({
            prefix,
            logger,
            connect,
            maxresults: limit
        })
    , 2, 5);
    const { blobs , next  } = (0, _resultParser).parseListBlobsResult(xml);
    const items = [
        [
            'Name',
            'Size',
            'Modified Date',
            'MD5'
        ]
    ].concat(blobs.map((blob)=>[
            blob.name,
            (0, _file).getHumanReadableFileSize(blob.size),
            blob.mtime.toJSON(),
            blob.md5
        ]
    ));
    const colWidths = new Array(4).fill(0).map((_, i)=>Math.max(...items.map((item)=>item[i].length
        )) + 1
    );
    for(let i1 = 0; i1 < items.length; i1++){
        const row = items[i1].map((text, col)=>text.padEnd(colWidths[col], ' ')
        ).join(' | ');
        console.log(row);
    }
    if (next) logger.log(`nextMaker=${next}`);
}

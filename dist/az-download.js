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
    var fs1 = require("fs");
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
            const rs = fs1.createReadStream(file);
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
var load4 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.createSASForBlob = createSASForBlob;
    var _crypto1 = load2();
    var _types1 = load3();
    const signedVersion = "2020-10-02";
    function createSASForBlob(options) {
        const { connect , blob , expiryMinutes , permissions  } = options;
        const { container , accountKey , accountName  } = connect;
        const exp = expiryMinutes || 30;
        const st = date2string(new Date());
        const se = date2string(Date.now() + exp * 60000);
        const sp = permissions || 'r';
        const sr = 'b';
        const signedProtocol = (0, _types1).getAzureProtocol(connect);
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
            ""
        ].join('\n');
        const sig = (0, _crypto1).hmacSHA256(accountKey, stringToSign);
        const qs = {
            sp,
            st,
            se,
            spr: signedProtocol,
            sv: signedVersion,
            sr,
            sig
        };
        const qsString = Object.keys(qs).map((key)=>`${key}=${encodeURIComponent(qs[key])}`
        ).join('&');
        const url = `${signedProtocol}://${(0, _types1).getAzureBlobHost(connect)}/${container}/${blob}?${qsString}`;
        return {
            url,
            qs,
            sig
        };
    }
    function date2string(d) {
        return new Date(d).toJSON().replace(/\.\d{0,3}Z$/, 'Z');
    }
});
var load5 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.loadEnvFiles = loadEnvFiles;
    exports.readEnvFile = readEnvFile;
    var fs2 = require("fs");
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
            env = fs2.readFileSync(file, 'utf8');
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
var load6 = __swcpack_require__.bind(void 0, function(module, exports) {
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
var load7 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.fileStat = fileStat;
    exports.getHumanReadableFileSize = getHumanReadableFileSize;
    var fs3 = require("fs");
    var path1 = require("path");
    function fileStat(file) {
        let stat;
        try {
            stat = fs3.statSync(file);
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
var load8 = __swcpack_require__.bind(void 0, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.downlaodToStream = downlaodToStream;
    var https = require("https");
    var _file1 = load7();
    function downlaodToStream(args) {
        return new Promise((resolve1, reject1)=>{
            let statusCode = -1;
            let contentType = '';
            let contentMD5 = '';
            let contentLength = -1;
            let promise = Promise.resolve();
            const { stream , progressInterval , logger: logger1  } = args;
            let lastProgressLog = Date.now();
            let downloaded = 0;
            let responsedAt = 0;
            const maskedURL = args.url.replace(/\?.+$/, '?****');
            logger1.log(`downloading file from url "${maskedURL}" ...`);
            const req = https.get(args.url, {}, (res)=>{
                responsedAt = Date.now();
                statusCode = res.statusCode;
                if (statusCode !== 200) {
                    logger1.log(`headers: ${JSON.stringify(res.headers)}`);
                    return rejectWithLog(`Server response status code is ${statusCode} but not 200`);
                }
                const rawContentLength = res.headers['content-length'];
                if (rawContentLength) {
                    contentLength = parseInt(rawContentLength, 10);
                    if (isNaN(contentLength) || contentLength < 0) return rejectWithLog(`Invalid content-length: "${rawContentLength}"`);
                }
                contentType = res.headers["content-type"];
                contentMD5 = String(res.headers['content-md5']);
                const logResp = [];
                if (contentLength >= 0) logResp.push(`size=${contentLength} "${(0, _file1).getHumanReadableFileSize(contentLength)}"`);
                if (contentType) logResp.push(`type="${contentType}"`);
                if (contentMD5) logResp.push(`md5="${contentMD5}"`);
                logger1.log(`server response ${logResp.join(' ')}`);
                res.on('data', write);
                res.on('end', ()=>{
                    promise = promise.then(()=>resolve1({
                            contentLength,
                            contentMD5,
                            contentType,
                            headers: res.headers
                        })
                    );
                });
            });
            req.on('error', rejectWithLog);
            req.end();
            function write(data) {
                promise = promise.then(()=>new Promise((resolve, reject)=>stream.write(data, (e)=>{
                            if (e) return reject(e);
                            downloaded += data.length;
                            try {
                                printProgress();
                            } catch (error) {}
                            resolve();
                        })
                    )
                );
            }
            function printProgress() {
                if (progressInterval >= 0 === false) return;
                const now = Date.now();
                if (progressInterval !== 0) {
                    if (now < lastProgressLog + progressInterval) return;
                    lastProgressLog = now;
                }
                const elapsed = (now - responsedAt) / 1000;
                logger1.progress(downloaded, contentLength, elapsed);
            }
            function rejectWithLog(error, details) {
                if (!error) return;
                const message = typeof error === 'string' ? error : error.message;
                logger1.error(`download failed! ${message} ${details ? 'details:' : ''}`);
                if (details) logger1.error(details);
                reject1(error);
            }
        });
    }
});
"use strict";
var _url = require("url");
var fs = require("fs");
var path = require("path");
var _helper = load();
var _env = load1();
var _blobSas = load4();
var _types = load3();
var _crypto = load2();
var _env1 = load5();
var _logger = load6();
var _file = load7();
var _download = load8();
const logger = new _logger.Logger(`AzDownload`);
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
        '    --url                        do not download the file but get the url for the resource',
        '    --container <containerName>  provide container name (this argument has a higher priority than environment variable)',
        '    --verbose                    print verbose logs',
        '    --public                     do not sign the url(add SAS) before downloading or printing',
        '',
        ..._helper.envVarUsage,
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
    console.log(global['__version'] ? `v${global['__version']}` : 'unknown');
    process.exit(0);
}
async function main() {
    const allArgv = process.argv.slice(2);
    let local;
    let remote;
    let verbose = false;
    let onlyURL = false;
    let signURL = true;
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
            if (!remote) return remote = arg;
            if (!local) return local = arg;
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
            case '--public':
                signURL = false;
                break;
            default:
                resolvePositionalArgs();
        }
    }
    const isToStdout = local === '-';
    if (isToStdout) logger.setLogDest('stderr');
    if (!remote) return usage();
    if (!local) local = '.';
    (0, _env1).loadEnvFiles(envFiles);
    const connect = new _env.AzureStorageEnv();
    if (overwriteContainer) connect.container = overwriteContainer;
    connect.assertKey();
    connect.assertContainer();
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
    let targetFile;
    if (isToStdout) logger.log(`local=<stdout>`);
    else if (!onlyURL) {
        let localAsDir = false;
        try {
            const stat = fs.statSync(local);
            if (stat.isDirectory()) localAsDir = true;
        } catch (error) {}
        if (localAsDir) targetFile = path.join(local, path.basename(blob));
        else targetFile = local;
        logger.log(`local=${targetFile}`);
    }
    let finalURL;
    if (signURL) {
        const result = (0, _blobSas).createSASForBlob({
            connect,
            blob
        });
        finalURL = result.url;
    } else finalURL = (0, _types).getAzureBlobURL(connect, blob);
    if (onlyURL) return console.log(finalURL);
    const startedAt = Date.now();
    const localFileName = isToStdout ? 'stdout' : `"${path.basename(targetFile)}"`;
    const stream = isToStdout ? process.stdout : fs.createWriteStream(targetFile);
    const { contentMD5  } = await (0, _download).downlaodToStream({
        url: finalURL,
        stream,
        progressInterval: verbose ? 2000 : 5000,
        logger: {
            log: (msg)=>logger.log(msg)
            ,
            error: (msg)=>logger.error(msg)
            ,
            progress: (_now, _all, elapsed)=>{
                const percent = _all >= 0 ? (_now / _all * 100).toFixed(2) + '%' : '--';
                const now = (0, _file).getHumanReadableFileSize(_now);
                const all = (0, _file).getHumanReadableFileSize(_all);
                logger.log(`progress=${percent} [${now}/${all}] +${elapsed}s`);
            }
        }
    });
    if (!isToStdout) stream.close();
    const elapsed1 = Math.floor((Date.now() - startedAt) / 1000);
    logger.log(`downloaded to ${localFileName} +${elapsed1}s`);
    if (!isToStdout && contentMD5) {
        const localMD5 = await (0, _crypto).getFileMD5Base64(targetFile);
        if (contentMD5 !== localMD5) throw new Error(`md5sums are different between local and remote, local md5sum is "${localMD5}"`);
    }
}
function safeParseURL(url) {
    try {
        return new _url.URL(url);
    } catch (error) {
        return null;
    }
}

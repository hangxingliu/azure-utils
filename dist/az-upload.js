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

/***/ "./src/utils/azure/blob/block-helper.ts":
/*!**********************************************!*\
  !*** ./src/utils/azure/blob/block-helper.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    azBlockSize: function() {
        return azBlockSize;
    },
    azBlockSizeSmall: function() {
        return azBlockSizeSmall;
    },
    getBlocksFormLocalFile: function() {
        return getBlocksFormLocalFile;
    }
});
const _fs = __webpack_require__(/*! fs */ "fs");
const _crypto = __webpack_require__(/*! ../crypto */ "./src/utils/azure/crypto.ts");
const azBlockSize = 1024 * 1024 * 60; // 62MiB
const azBlockSizeSmall = 1024 * 1024 * 2; // 2MiB
function getBlocksFormLocalFile(file, stat) {
    if (!stat) stat = _fs.statSync(file);
    const fileSize = stat.size;
    let startPos = 0;
    let index = 0;
    const result = [];
    while(startPos < fileSize){
        const endPos = Math.min(startPos + azBlockSize, fileSize);
        const uuid = (0, _crypto.uuidv4Base64)();
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
    // merge small block
    if (result.length >= 2) {
        const { startPos, endPos } = result[result.length - 1];
        if (endPos - startPos < azBlockSizeSmall) {
            result.pop();
            result[result.length - 1].endPos = endPos;
        }
    }
    return result;
}


/***/ }),

/***/ "./src/utils/azure/blob/copy-blob.ts":
/*!*******************************************!*\
  !*** ./src/utils/azure/blob/copy-blob.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "azCopyBlob", ({
    enumerable: true,
    get: function() {
        return azCopyBlob;
    }
}));
const _https = __webpack_require__(/*! https */ "https");
const _sharedkeylite = __webpack_require__(/*! ../shared-key-lite */ "./src/utils/azure/shared-key-lite.ts");
const _types = __webpack_require__(/*! ../types */ "./src/utils/azure/types.ts");
const x_ms_version = '2020-10-02';
function azCopyBlob(args) {
    const { connect, logger, source } = args;
    const { container, accountName, endpointSuffix } = connect;
    const method = 'PUT';
    const date = new Date();
    const blob = args.blob.replace(/^\//, '');
    const sourceURL = [
        `https://${source.account || accountName}.blob.${endpointSuffix}/`,
        source.container || container,
        '/',
        source.blob,
        source.sasToken ? `?${source.sasToken}` : ''
    ].join('');
    const sourceName = [
        source.account || accountName,
        '/',
        source.container || container,
        '/',
        source.blob
    ].join('');
    const authorization = (0, _sharedkeylite.createSharedKeyLite)({
        connect,
        verb: method,
        resourceUri: args.blob,
        canonicalizedHeaders: [
            `x-ms-copy-source:${sourceURL}`,
            `x-ms-date:${date.toUTCString()}`,
            `x-ms-version:${x_ms_version}`
        ].join('\n')
    });
    return new Promise((resolve, reject)=>{
        let statusCode = -1;
        let contentType = '';
        let data = '';
        const apiPath = `/${container}/${encodeURI(blob)}`;
        logger.log(`request copy api uri="${accountName}/${container}/${blob}" x-ms-copy-source="${sourceName}" ...`);
        const req = (0, _https.request)({
            host: (0, _types.getAzureBlobHost)(connect),
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
            res.on('data', (chunk)=>data += chunk.toString());
            res.on('end', ()=>{
                if (statusCode !== 201 && statusCode !== 202) return rejectWithLog(`HTTP status code is ${statusCode} but not 201 or 202`, data);
                logger.verbose(`api response code=${statusCode} x-ms-copy-status=${res.headers['x-ms-copy-status'] || ''}`);
                resolve(res.headers);
            });
        });
        req.on('error', rejectWithLog);
        req.end();
        function rejectWithLog(error, details) {
            if (!error) return;
            const message = typeof error === 'string' ? error : error.message;
            logger.error(`copy failed! ${message} ${details ? 'details:' : ''}`);
            if (details) logger.error(details);
            reject(error);
        }
    });
}


/***/ }),

/***/ "./src/utils/azure/blob/put-blob.ts":
/*!******************************************!*\
  !*** ./src/utils/azure/blob/put-blob.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "azPutBlob", ({
    enumerable: true,
    get: function() {
        return azPutBlob;
    }
}));
const _fs = __webpack_require__(/*! fs */ "fs");
const _path = __webpack_require__(/*! path */ "path");
const _https = __webpack_require__(/*! https */ "https");
const _contenttype = __webpack_require__(/*! ../content-type */ "./src/utils/azure/content-type.ts");
const _sharedkeylite = __webpack_require__(/*! ../shared-key-lite */ "./src/utils/azure/shared-key-lite.ts");
const _types = __webpack_require__(/*! ../types */ "./src/utils/azure/types.ts");
const x_ms_version = '2020-10-02';
function azPutBlob(args) {
    const { connect, logger } = args;
    const { container } = connect;
    const method = 'PUT';
    const date = new Date();
    const blob = args.blob.replace(/^\//, '');
    let contentType = '';
    if (typeof args.contentType === 'string') contentType = args.contentType;
    else if (args.contentType === true) contentType = (0, _contenttype.getContentTypeByExt)(_path.extname(args.file));
    const authorization = (0, _sharedkeylite.createSharedKeyLite)({
        verb: method,
        connect,
        resourceUri: args.blob,
        contentType,
        canonicalizedHeaders: [
            'x-ms-blob-type:BlockBlob',
            `x-ms-date:${date.toUTCString()}`,
            `x-ms-version:${x_ms_version}`
        ].join('\n')
    });
    let size = args.contentLength;
    if (typeof size !== 'number') {
        const stat = _fs.statSync(args.file);
        size = stat.size;
    }
    const stream = _fs.createReadStream(args.file);
    return new Promise((resolve, reject)=>{
        let statusCode = -1;
        let resContentType = '';
        let data = '';
        const headers = {
            Authorization: authorization,
            'Content-Length': size,
            'x-ms-blob-type': 'BlockBlob',
            'x-ms-version': x_ms_version,
            'x-ms-date': date.toUTCString()
        };
        if (contentType) headers['Content-Type'] = contentType;
        const apiPath = `/${container}/${encodeURI(blob)}`;
        logger.log(`request put blob api uri="${apiPath}" size=${size} content-type="${contentType}" ...`);
        const req = (0, _https.request)({
            host: (0, _types.getAzureBlobHost)(connect),
            path: apiPath,
            method,
            headers
        }, (res)=>{
            statusCode = res.statusCode;
            resContentType = res.headers["content-type"];
            res.on('data', (chunk)=>data += chunk.toString());
            res.on('end', ()=>{
                if (statusCode !== 201) return rejectWithLog(`HTTP status code is ${statusCode} but not 201`, data);
                logger.verbose(`api response code=${statusCode} content-type=${resContentType || ''}`);
                resolve(res.headers);
            });
        });
        req.on('error', rejectWithLog);
        stream.pipe(req);
        function rejectWithLog(error, details) {
            if (!error) return;
            const message = typeof error === 'string' ? error : error.message;
            logger.error(`put blob failed! ${message} ${details ? 'details:' : ''}`);
            if (details) logger.error(details);
            reject(error);
        }
    });
}


/***/ }),

/***/ "./src/utils/azure/blob/put-block-list.ts":
/*!************************************************!*\
  !*** ./src/utils/azure/blob/put-block-list.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "azPutBlockList", ({
    enumerable: true,
    get: function() {
        return azPutBlockList;
    }
}));
const _https = __webpack_require__(/*! https */ "https");
const _sharedkeylite = __webpack_require__(/*! ../shared-key-lite */ "./src/utils/azure/shared-key-lite.ts");
const _types = __webpack_require__(/*! ../types */ "./src/utils/azure/types.ts");
const x_ms_version = '2020-10-02';
function azPutBlockList(args) {
    const { connect, logger } = args;
    const { container } = connect;
    const method = 'PUT';
    const date = new Date();
    const blob = args.blob.replace(/^\//, '');
    let contentType = '';
    if (typeof args.contentType === 'string') contentType = args.contentType;
    const authorization = (0, _sharedkeylite.createSharedKeyLite)({
        verb: method,
        connect,
        resourceUri: args.blob + `?comp=blocklist`,
        canonicalizedHeaders: [
            contentType ? `x-ms-blob-content-type:${contentType}` : '',
            `x-ms-date:${date.toUTCString()}`,
            `x-ms-version:${x_ms_version}`
        ].filter((it)=>it).join('\n')
    });
    const postBody = `<?xml version="1.0" encoding="utf-8"?><BlockList>\n` + args.blockUUIDs.map((it)=>`<Latest>${it}</Latest>`).join('\n') + `\n</BlockList>`;
    return new Promise((resolve, reject)=>{
        let statusCode = -1;
        let resContentType = '';
        let data = '';
        const headers = {
            Authorization: authorization,
            'Content-Length': postBody.length,
            'x-ms-version': x_ms_version,
            'x-ms-date': date.toUTCString()
        };
        if (contentType) headers['x-ms-blob-content-type'] = contentType;
        const apiPath = `/${container}/${encodeURI(blob)}?comp=blocklist`;
        logger.log(`request put block list api uri="${apiPath}" x-ms-blob-content-type="${contentType}" ...`);
        const req = (0, _https.request)({
            host: (0, _types.getAzureBlobHost)(connect),
            path: apiPath,
            method,
            headers
        }, (res)=>{
            statusCode = res.statusCode;
            resContentType = res.headers["content-type"];
            res.on('data', (chunk)=>data += chunk.toString());
            res.on('end', ()=>{
                if (statusCode !== 201) return rejectWithLog(`HTTP status code is ${statusCode} but not 201`, data);
                logger.verbose(`api response code=${statusCode} content-type=${resContentType || ''}`);
                resolve(res.headers);
            });
        });
        req.on('error', rejectWithLog);
        req.write(postBody);
        function rejectWithLog(error, details) {
            if (!error) return;
            const message = typeof error === 'string' ? error : error.message;
            logger.error(`put blob list failed! ${message} ${details ? 'details:' : ''}`);
            if (details) logger.error(details);
            reject(error);
        }
    });
}


/***/ }),

/***/ "./src/utils/azure/blob/put-block.ts":
/*!*******************************************!*\
  !*** ./src/utils/azure/blob/put-block.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "azPutBlock", ({
    enumerable: true,
    get: function() {
        return azPutBlock;
    }
}));
const _fs = __webpack_require__(/*! fs */ "fs");
const _https = __webpack_require__(/*! https */ "https");
const _sharedkeylite = __webpack_require__(/*! ../shared-key-lite */ "./src/utils/azure/shared-key-lite.ts");
const _types = __webpack_require__(/*! ../types */ "./src/utils/azure/types.ts");
const x_ms_version = '2020-10-02';
function azPutBlock(args) {
    const { connect, logger, block } = args;
    const { container } = connect;
    const method = 'PUT';
    const date = new Date();
    const blob = args.blob.replace(/^\//, '');
    const authorization = (0, _sharedkeylite.createSharedKeyLite)({
        verb: method,
        connect,
        resourceUri: args.blob + `?comp=block`,
        canonicalizedHeaders: [
            'x-ms-blob-type:BlockBlob',
            `x-ms-date:${date.toUTCString()}`,
            `x-ms-version:${x_ms_version}`
        ].join('\n')
    });
    const stream = _fs.createReadStream(block.file, {
        start: block.startPos,
        end: block.endPos - 1
    });
    const size = block.endPos - block.startPos;
    return new Promise((resolve, reject)=>{
        let statusCode = -1;
        let contentType = '';
        let data = '';
        const apiPath = `/${container}/${encodeURI(blob)}?comp=block&blockid=${encodeURIComponent(block.uuid)}`;
        logger.log(`request put block api uri="${apiPath}" size=${size} ...`);
        const req = (0, _https.request)({
            host: (0, _types.getAzureBlobHost)(connect),
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
            res.on('data', (chunk)=>data += chunk.toString());
            res.on('end', ()=>{
                if (statusCode !== 201) return rejectWithLog(`HTTP status code is ${statusCode} but not 201`, data);
                logger.verbose(`api response code=${statusCode} content-type=${contentType || ''}`);
                resolve(res.headers);
            });
        });
        req.on('error', rejectWithLog);
        stream.pipe(req);
        function rejectWithLog(error, details) {
            if (!error) return;
            const message = typeof error === 'string' ? error : error.message;
            logger.error(`put block failed! ${message} ${details ? 'details:' : ''}`);
            if (details) logger.error(details);
            reject(error);
        }
    });
}


/***/ }),

/***/ "./src/utils/azure/content-type.ts":
/*!*****************************************!*\
  !*** ./src/utils/azure/content-type.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "getContentTypeByExt", ({
    enumerable: true,
    get: function() {
        return getContentTypeByExt;
    }
}));
const map = {
    //#region auto generated
    ez: "application/andrew-inset",
    aw: "application/applixware",
    atom: "application/atom+xml",
    atomcat: "application/atomcat+xml",
    atomdeleted: "application/atomdeleted+xml",
    atomsvc: "application/atomsvc+xml",
    dwd: "application/atsc-dwd+xml",
    held: "application/atsc-held+xml",
    rsat: "application/atsc-rsat+xml",
    bdoc: "application/bdoc",
    xcs: "application/calendar+xml",
    ccxml: "application/ccxml+xml",
    cdfx: "application/cdfx+xml",
    cdmia: "application/cdmi-capability",
    cdmic: "application/cdmi-container",
    cdmid: "application/cdmi-domain",
    cdmio: "application/cdmi-object",
    cdmiq: "application/cdmi-queue",
    cpl: "application/cpl+xml",
    cu: "application/cu-seeme",
    mpd: "application/dash+xml",
    mpp: "application/dash-patch+xml",
    davmount: "application/davmount+xml",
    dbk: "application/docbook+xml",
    dssc: "application/dssc+der",
    xdssc: "application/dssc+xml",
    es: "application/ecmascript",
    ecma: "application/ecmascript",
    emma: "application/emma+xml",
    emotionml: "application/emotionml+xml",
    epub: "application/epub+zip",
    exi: "application/exi",
    exp: "application/express",
    fdt: "application/fdt+xml",
    pfr: "application/font-tdpfr",
    geojson: "application/geo+json",
    gml: "application/gml+xml",
    gpx: "application/gpx+xml",
    gxf: "application/gxf",
    gz: "application/gzip",
    hjson: "application/hjson",
    stk: "application/hyperstudio",
    ink: "application/inkml+xml",
    inkml: "application/inkml+xml",
    ipfix: "application/ipfix",
    its: "application/its+xml",
    jar: "application/java-archive",
    war: "application/java-archive",
    ear: "application/java-archive",
    ser: "application/java-serialized-object",
    class: "application/java-vm",
    js: "application/javascript",
    mjs: "application/javascript",
    json: "application/json",
    map: "application/json",
    json5: "application/json5",
    jsonml: "application/jsonml+json",
    jsonld: "application/ld+json",
    lgr: "application/lgr+xml",
    lostxml: "application/lost+xml",
    hqx: "application/mac-binhex40",
    cpt: "application/mac-compactpro",
    mads: "application/mads+xml",
    webmanifest: "application/manifest+json",
    mrc: "application/marc",
    mrcx: "application/marcxml+xml",
    ma: "application/mathematica",
    nb: "application/mathematica",
    mb: "application/mathematica",
    mathml: "application/mathml+xml",
    mbox: "application/mbox",
    mpf: "application/media-policy-dataset+xml",
    mscml: "application/mediaservercontrol+xml",
    metalink: "application/metalink+xml",
    meta4: "application/metalink4+xml",
    mets: "application/mets+xml",
    maei: "application/mmt-aei+xml",
    musd: "application/mmt-usd+xml",
    mods: "application/mods+xml",
    m21: "application/mp21",
    mp21: "application/mp21",
    mp4s: "application/mp4",
    m4p: "application/mp4",
    doc: "application/msword",
    dot: "application/msword",
    mxf: "application/mxf",
    nq: "application/n-quads",
    nt: "application/n-triples",
    cjs: "application/node",
    bin: "application/octet-stream",
    dms: "application/octet-stream",
    lrf: "application/octet-stream",
    mar: "application/octet-stream",
    so: "application/octet-stream",
    dist: "application/octet-stream",
    distz: "application/octet-stream",
    pkg: "application/octet-stream",
    bpk: "application/octet-stream",
    dump: "application/octet-stream",
    elc: "application/octet-stream",
    deploy: "application/octet-stream",
    exe: "application/octet-stream",
    dll: "application/octet-stream",
    deb: "application/octet-stream",
    dmg: "application/octet-stream",
    iso: "application/octet-stream",
    img: "application/octet-stream",
    msi: "application/octet-stream",
    msp: "application/octet-stream",
    msm: "application/octet-stream",
    buffer: "application/octet-stream",
    oda: "application/oda",
    opf: "application/oebps-package+xml",
    ogx: "application/ogg",
    omdoc: "application/omdoc+xml",
    onetoc: "application/onenote",
    onetoc2: "application/onenote",
    onetmp: "application/onenote",
    onepkg: "application/onenote",
    oxps: "application/oxps",
    relo: "application/p2p-overlay+xml",
    xer: "application/patch-ops-error+xml",
    pdf: "application/pdf",
    pgp: "application/pgp-encrypted",
    asc: "application/pgp-keys",
    sig: "application/pgp-signature",
    prf: "application/pics-rules",
    p10: "application/pkcs10",
    p7m: "application/pkcs7-mime",
    p7c: "application/pkcs7-mime",
    p7s: "application/pkcs7-signature",
    p8: "application/pkcs8",
    ac: "application/pkix-attr-cert",
    cer: "application/pkix-cert",
    crl: "application/pkix-crl",
    pkipath: "application/pkix-pkipath",
    pki: "application/pkixcmp",
    pls: "application/pls+xml",
    ai: "application/postscript",
    eps: "application/postscript",
    ps: "application/postscript",
    provx: "application/provenance+xml",
    cww: "application/prs.cww",
    pskcxml: "application/pskc+xml",
    raml: "application/raml+yaml",
    rdf: "application/rdf+xml",
    owl: "application/rdf+xml",
    rif: "application/reginfo+xml",
    rnc: "application/relax-ng-compact-syntax",
    rl: "application/resource-lists+xml",
    rld: "application/resource-lists-diff+xml",
    rs: "application/rls-services+xml",
    rapd: "application/route-apd+xml",
    sls: "application/route-s-tsid+xml",
    rusd: "application/route-usd+xml",
    gbr: "application/rpki-ghostbusters",
    mft: "application/rpki-manifest",
    roa: "application/rpki-roa",
    rsd: "application/rsd+xml",
    rss: "application/rss+xml",
    rtf: "application/rtf",
    sbml: "application/sbml+xml",
    scq: "application/scvp-cv-request",
    scs: "application/scvp-cv-response",
    spq: "application/scvp-vp-request",
    spp: "application/scvp-vp-response",
    sdp: "application/sdp",
    senmlx: "application/senml+xml",
    sensmlx: "application/sensml+xml",
    setpay: "application/set-payment-initiation",
    setreg: "application/set-registration-initiation",
    shf: "application/shf+xml",
    siv: "application/sieve",
    sieve: "application/sieve",
    smi: "application/smil+xml",
    smil: "application/smil+xml",
    rq: "application/sparql-query",
    srx: "application/sparql-results+xml",
    gram: "application/srgs",
    grxml: "application/srgs+xml",
    sru: "application/sru+xml",
    ssdl: "application/ssdl+xml",
    ssml: "application/ssml+xml",
    swidtag: "application/swid+xml",
    tei: "application/tei+xml",
    teicorpus: "application/tei+xml",
    tfi: "application/thraud+xml",
    tsd: "application/timestamped-data",
    toml: "application/toml",
    trig: "application/trig",
    ttml: "application/ttml+xml",
    ubj: "application/ubjson",
    rsheet: "application/urc-ressheet+xml",
    td: "application/urc-targetdesc+xml",
    "1km": "application/vnd.1000minds.decision-model+xml",
    plb: "application/vnd.3gpp.pic-bw-large",
    psb: "application/vnd.3gpp.pic-bw-small",
    pvb: "application/vnd.3gpp.pic-bw-var",
    tcap: "application/vnd.3gpp2.tcap",
    pwn: "application/vnd.3m.post-it-notes",
    aso: "application/vnd.accpac.simply.aso",
    imp: "application/vnd.accpac.simply.imp",
    acu: "application/vnd.acucobol",
    atc: "application/vnd.acucorp",
    acutc: "application/vnd.acucorp",
    air: "application/vnd.adobe.air-application-installer-package+zip",
    fcdt: "application/vnd.adobe.formscentral.fcdt",
    fxp: "application/vnd.adobe.fxp",
    fxpl: "application/vnd.adobe.fxp",
    xdp: "application/vnd.adobe.xdp+xml",
    xfdf: "application/vnd.adobe.xfdf",
    age: "application/vnd.age",
    ahead: "application/vnd.ahead.space",
    azf: "application/vnd.airzip.filesecure.azf",
    azs: "application/vnd.airzip.filesecure.azs",
    azw: "application/vnd.amazon.ebook",
    acc: "application/vnd.americandynamics.acc",
    ami: "application/vnd.amiga.ami",
    apk: "application/vnd.android.package-archive",
    cii: "application/vnd.anser-web-certificate-issue-initiation",
    fti: "application/vnd.anser-web-funds-transfer-initiation",
    atx: "application/vnd.antix.game-component",
    mpkg: "application/vnd.apple.installer+xml",
    key: "application/vnd.apple.keynote",
    m3u8: "application/vnd.apple.mpegurl",
    numbers: "application/vnd.apple.numbers",
    pages: "application/vnd.apple.pages",
    pkpass: "application/vnd.apple.pkpass",
    swi: "application/vnd.aristanetworks.swi",
    iota: "application/vnd.astraea-software.iota",
    aep: "application/vnd.audiograph",
    bmml: "application/vnd.balsamiq.bmml+xml",
    mpm: "application/vnd.blueice.multipass",
    bmi: "application/vnd.bmi",
    rep: "application/vnd.businessobjects",
    cdxml: "application/vnd.chemdraw+xml",
    mmd: "application/vnd.chipnuts.karaoke-mmd",
    cdy: "application/vnd.cinderella",
    csl: "application/vnd.citationstyles.style+xml",
    cla: "application/vnd.claymore",
    rp9: "application/vnd.cloanto.rp9",
    c4g: "application/vnd.clonk.c4group",
    c4d: "application/vnd.clonk.c4group",
    c4f: "application/vnd.clonk.c4group",
    c4p: "application/vnd.clonk.c4group",
    c4u: "application/vnd.clonk.c4group",
    c11amc: "application/vnd.cluetrust.cartomobile-config",
    c11amz: "application/vnd.cluetrust.cartomobile-config-pkg",
    csp: "application/vnd.commonspace",
    cdbcmsg: "application/vnd.contact.cmsg",
    cmc: "application/vnd.cosmocaller",
    clkx: "application/vnd.crick.clicker",
    clkk: "application/vnd.crick.clicker.keyboard",
    clkp: "application/vnd.crick.clicker.palette",
    clkt: "application/vnd.crick.clicker.template",
    clkw: "application/vnd.crick.clicker.wordbank",
    wbs: "application/vnd.criticaltools.wbs+xml",
    pml: "application/vnd.ctc-posml",
    ppd: "application/vnd.cups-ppd",
    car: "application/vnd.curl.car",
    pcurl: "application/vnd.curl.pcurl",
    dart: "application/vnd.dart",
    rdz: "application/vnd.data-vision.rdz",
    dbf: "application/vnd.dbf",
    uvf: "application/vnd.dece.data",
    uvvf: "application/vnd.dece.data",
    uvd: "application/vnd.dece.data",
    uvvd: "application/vnd.dece.data",
    uvt: "application/vnd.dece.ttml+xml",
    uvvt: "application/vnd.dece.ttml+xml",
    uvx: "application/vnd.dece.unspecified",
    uvvx: "application/vnd.dece.unspecified",
    uvz: "application/vnd.dece.zip",
    uvvz: "application/vnd.dece.zip",
    fe_launch: "application/vnd.denovo.fcselayout-link",
    dna: "application/vnd.dna",
    mlp: "application/vnd.dolby.mlp",
    dpg: "application/vnd.dpgraph",
    dfac: "application/vnd.dreamfactory",
    kpxx: "application/vnd.ds-keypoint",
    ait: "application/vnd.dvb.ait",
    svc: "application/vnd.dvb.service",
    geo: "application/vnd.dynageo",
    mag: "application/vnd.ecowin.chart",
    nml: "application/vnd.enliven",
    esf: "application/vnd.epson.esf",
    msf: "application/vnd.epson.msf",
    qam: "application/vnd.epson.quickanime",
    slt: "application/vnd.epson.salt",
    ssf: "application/vnd.epson.ssf",
    es3: "application/vnd.eszigno3+xml",
    et3: "application/vnd.eszigno3+xml",
    ez2: "application/vnd.ezpix-album",
    ez3: "application/vnd.ezpix-package",
    fdf: "application/vnd.fdf",
    mseed: "application/vnd.fdsn.mseed",
    seed: "application/vnd.fdsn.seed",
    dataless: "application/vnd.fdsn.seed",
    gph: "application/vnd.flographit",
    ftc: "application/vnd.fluxtime.clip",
    fm: "application/vnd.framemaker",
    frame: "application/vnd.framemaker",
    maker: "application/vnd.framemaker",
    book: "application/vnd.framemaker",
    fnc: "application/vnd.frogans.fnc",
    ltf: "application/vnd.frogans.ltf",
    fsc: "application/vnd.fsc.weblaunch",
    oas: "application/vnd.fujitsu.oasys",
    oa2: "application/vnd.fujitsu.oasys2",
    oa3: "application/vnd.fujitsu.oasys3",
    fg5: "application/vnd.fujitsu.oasysgp",
    bh2: "application/vnd.fujitsu.oasysprs",
    ddd: "application/vnd.fujixerox.ddd",
    xdw: "application/vnd.fujixerox.docuworks",
    xbd: "application/vnd.fujixerox.docuworks.binder",
    fzs: "application/vnd.fuzzysheet",
    txd: "application/vnd.genomatix.tuxedo",
    ggb: "application/vnd.geogebra.file",
    ggt: "application/vnd.geogebra.tool",
    gex: "application/vnd.geometry-explorer",
    gre: "application/vnd.geometry-explorer",
    gxt: "application/vnd.geonext",
    g2w: "application/vnd.geoplan",
    g3w: "application/vnd.geospace",
    gmx: "application/vnd.gmx",
    gdoc: "application/vnd.google-apps.document",
    gslides: "application/vnd.google-apps.presentation",
    gsheet: "application/vnd.google-apps.spreadsheet",
    kml: "application/vnd.google-earth.kml+xml",
    kmz: "application/vnd.google-earth.kmz",
    gqf: "application/vnd.grafeq",
    gqs: "application/vnd.grafeq",
    gac: "application/vnd.groove-account",
    ghf: "application/vnd.groove-help",
    gim: "application/vnd.groove-identity-message",
    grv: "application/vnd.groove-injector",
    gtm: "application/vnd.groove-tool-message",
    tpl: "application/vnd.groove-tool-template",
    vcg: "application/vnd.groove-vcard",
    hal: "application/vnd.hal+xml",
    zmm: "application/vnd.handheld-entertainment+xml",
    hbci: "application/vnd.hbci",
    les: "application/vnd.hhe.lesson-player",
    hpgl: "application/vnd.hp-hpgl",
    hpid: "application/vnd.hp-hpid",
    hps: "application/vnd.hp-hps",
    jlt: "application/vnd.hp-jlyt",
    pcl: "application/vnd.hp-pcl",
    pclxl: "application/vnd.hp-pclxl",
    "sfd-hdstx": "application/vnd.hydrostatix.sof-data",
    mpy: "application/vnd.ibm.minipay",
    afp: "application/vnd.ibm.modcap",
    listafp: "application/vnd.ibm.modcap",
    list3820: "application/vnd.ibm.modcap",
    irm: "application/vnd.ibm.rights-management",
    sc: "application/vnd.ibm.secure-container",
    icc: "application/vnd.iccprofile",
    icm: "application/vnd.iccprofile",
    igl: "application/vnd.igloader",
    ivp: "application/vnd.immervision-ivp",
    ivu: "application/vnd.immervision-ivu",
    igm: "application/vnd.insors.igm",
    xpw: "application/vnd.intercon.formnet",
    xpx: "application/vnd.intercon.formnet",
    i2g: "application/vnd.intergeo",
    qbo: "application/vnd.intu.qbo",
    qfx: "application/vnd.intu.qfx",
    rcprofile: "application/vnd.ipunplugged.rcprofile",
    irp: "application/vnd.irepository.package+xml",
    xpr: "application/vnd.is-xpr",
    fcs: "application/vnd.isac.fcs",
    jam: "application/vnd.jam",
    rms: "application/vnd.jcp.javame.midlet-rms",
    jisp: "application/vnd.jisp",
    joda: "application/vnd.joost.joda-archive",
    ktz: "application/vnd.kahootz",
    ktr: "application/vnd.kahootz",
    karbon: "application/vnd.kde.karbon",
    chrt: "application/vnd.kde.kchart",
    kfo: "application/vnd.kde.kformula",
    flw: "application/vnd.kde.kivio",
    kon: "application/vnd.kde.kontour",
    kpr: "application/vnd.kde.kpresenter",
    kpt: "application/vnd.kde.kpresenter",
    ksp: "application/vnd.kde.kspread",
    kwd: "application/vnd.kde.kword",
    kwt: "application/vnd.kde.kword",
    htke: "application/vnd.kenameaapp",
    kia: "application/vnd.kidspiration",
    kne: "application/vnd.kinar",
    knp: "application/vnd.kinar",
    skp: "application/vnd.koan",
    skd: "application/vnd.koan",
    skt: "application/vnd.koan",
    skm: "application/vnd.koan",
    sse: "application/vnd.kodak-descriptor",
    lasxml: "application/vnd.las.las+xml",
    lbd: "application/vnd.llamagraphics.life-balance.desktop",
    lbe: "application/vnd.llamagraphics.life-balance.exchange+xml",
    "123": "application/vnd.lotus-1-2-3",
    apr: "application/vnd.lotus-approach",
    pre: "application/vnd.lotus-freelance",
    nsf: "application/vnd.lotus-notes",
    org: "application/vnd.lotus-organizer",
    scm: "application/vnd.lotus-screencam",
    lwp: "application/vnd.lotus-wordpro",
    portpkg: "application/vnd.macports.portpkg",
    mvt: "application/vnd.mapbox-vector-tile",
    mcd: "application/vnd.mcd",
    mc1: "application/vnd.medcalcdata",
    cdkey: "application/vnd.mediastation.cdkey",
    mwf: "application/vnd.mfer",
    mfm: "application/vnd.mfmp",
    flo: "application/vnd.micrografx.flo",
    igx: "application/vnd.micrografx.igx",
    mif: "application/vnd.mif",
    daf: "application/vnd.mobius.daf",
    dis: "application/vnd.mobius.dis",
    mbk: "application/vnd.mobius.mbk",
    mqy: "application/vnd.mobius.mqy",
    msl: "application/vnd.mobius.msl",
    plc: "application/vnd.mobius.plc",
    txf: "application/vnd.mobius.txf",
    mpn: "application/vnd.mophun.application",
    mpc: "application/vnd.mophun.certificate",
    xul: "application/vnd.mozilla.xul+xml",
    cil: "application/vnd.ms-artgalry",
    cab: "application/vnd.ms-cab-compressed",
    xls: "application/vnd.ms-excel",
    xlm: "application/vnd.ms-excel",
    xla: "application/vnd.ms-excel",
    xlc: "application/vnd.ms-excel",
    xlt: "application/vnd.ms-excel",
    xlw: "application/vnd.ms-excel",
    xlam: "application/vnd.ms-excel.addin.macroenabled.12",
    xlsb: "application/vnd.ms-excel.sheet.binary.macroenabled.12",
    xlsm: "application/vnd.ms-excel.sheet.macroenabled.12",
    xltm: "application/vnd.ms-excel.template.macroenabled.12",
    eot: "application/vnd.ms-fontobject",
    chm: "application/vnd.ms-htmlhelp",
    ims: "application/vnd.ms-ims",
    lrm: "application/vnd.ms-lrm",
    thmx: "application/vnd.ms-officetheme",
    msg: "application/vnd.ms-outlook",
    cat: "application/vnd.ms-pki.seccat",
    stl: "application/vnd.ms-pki.stl",
    ppt: "application/vnd.ms-powerpoint",
    pps: "application/vnd.ms-powerpoint",
    pot: "application/vnd.ms-powerpoint",
    ppam: "application/vnd.ms-powerpoint.addin.macroenabled.12",
    pptm: "application/vnd.ms-powerpoint.presentation.macroenabled.12",
    sldm: "application/vnd.ms-powerpoint.slide.macroenabled.12",
    ppsm: "application/vnd.ms-powerpoint.slideshow.macroenabled.12",
    potm: "application/vnd.ms-powerpoint.template.macroenabled.12",
    mpt: "application/vnd.ms-project",
    docm: "application/vnd.ms-word.document.macroenabled.12",
    dotm: "application/vnd.ms-word.template.macroenabled.12",
    wps: "application/vnd.ms-works",
    wks: "application/vnd.ms-works",
    wcm: "application/vnd.ms-works",
    wdb: "application/vnd.ms-works",
    wpl: "application/vnd.ms-wpl",
    xps: "application/vnd.ms-xpsdocument",
    mseq: "application/vnd.mseq",
    mus: "application/vnd.musician",
    msty: "application/vnd.muvee.style",
    taglet: "application/vnd.mynfc",
    nlu: "application/vnd.neurolanguage.nlu",
    ntf: "application/vnd.nitf",
    nitf: "application/vnd.nitf",
    nnd: "application/vnd.noblenet-directory",
    nns: "application/vnd.noblenet-sealer",
    nnw: "application/vnd.noblenet-web",
    ngdat: "application/vnd.nokia.n-gage.data",
    "n-gage": "application/vnd.nokia.n-gage.symbian.install",
    rpst: "application/vnd.nokia.radio-preset",
    rpss: "application/vnd.nokia.radio-presets",
    edm: "application/vnd.novadigm.edm",
    edx: "application/vnd.novadigm.edx",
    ext: "application/vnd.novadigm.ext",
    odc: "application/vnd.oasis.opendocument.chart",
    otc: "application/vnd.oasis.opendocument.chart-template",
    odb: "application/vnd.oasis.opendocument.database",
    odf: "application/vnd.oasis.opendocument.formula",
    odft: "application/vnd.oasis.opendocument.formula-template",
    odg: "application/vnd.oasis.opendocument.graphics",
    otg: "application/vnd.oasis.opendocument.graphics-template",
    odi: "application/vnd.oasis.opendocument.image",
    oti: "application/vnd.oasis.opendocument.image-template",
    odp: "application/vnd.oasis.opendocument.presentation",
    otp: "application/vnd.oasis.opendocument.presentation-template",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    ots: "application/vnd.oasis.opendocument.spreadsheet-template",
    odt: "application/vnd.oasis.opendocument.text",
    odm: "application/vnd.oasis.opendocument.text-master",
    ott: "application/vnd.oasis.opendocument.text-template",
    oth: "application/vnd.oasis.opendocument.text-web",
    xo: "application/vnd.olpc-sugar",
    dd2: "application/vnd.oma.dd2+xml",
    obgx: "application/vnd.openblox.game+xml",
    oxt: "application/vnd.openofficeorg.extension",
    osm: "application/vnd.openstreetmap.data+xml",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    sldx: "application/vnd.openxmlformats-officedocument.presentationml.slide",
    ppsx: "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
    potx: "application/vnd.openxmlformats-officedocument.presentationml.template",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xltx: "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    dotx: "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    mgp: "application/vnd.osgeo.mapguide.package",
    dp: "application/vnd.osgi.dp",
    esa: "application/vnd.osgi.subsystem",
    pdb: "application/vnd.palm",
    pqa: "application/vnd.palm",
    oprc: "application/vnd.palm",
    paw: "application/vnd.pawaafile",
    str: "application/vnd.pg.format",
    ei6: "application/vnd.pg.osasli",
    efif: "application/vnd.picsel",
    wg: "application/vnd.pmi.widget",
    plf: "application/vnd.pocketlearn",
    pbd: "application/vnd.powerbuilder6",
    box: "application/vnd.previewsystems.box",
    mgz: "application/vnd.proteus.magazine",
    qps: "application/vnd.publishare-delta-tree",
    ptid: "application/vnd.pvi.ptid1",
    qxd: "application/vnd.quark.quarkxpress",
    qxt: "application/vnd.quark.quarkxpress",
    qwd: "application/vnd.quark.quarkxpress",
    qwt: "application/vnd.quark.quarkxpress",
    qxl: "application/vnd.quark.quarkxpress",
    qxb: "application/vnd.quark.quarkxpress",
    rar: "application/vnd.rar",
    bed: "application/vnd.realvnc.bed",
    mxl: "application/vnd.recordare.musicxml",
    musicxml: "application/vnd.recordare.musicxml+xml",
    cryptonote: "application/vnd.rig.cryptonote",
    cod: "application/vnd.rim.cod",
    rm: "application/vnd.rn-realmedia",
    rmvb: "application/vnd.rn-realmedia-vbr",
    link66: "application/vnd.route66.link66+xml",
    st: "application/vnd.sailingtracker.track",
    see: "application/vnd.seemail",
    sema: "application/vnd.sema",
    semd: "application/vnd.semd",
    semf: "application/vnd.semf",
    ifm: "application/vnd.shana.informed.formdata",
    itp: "application/vnd.shana.informed.formtemplate",
    iif: "application/vnd.shana.informed.interchange",
    ipk: "application/vnd.shana.informed.package",
    twd: "application/vnd.simtech-mindmapper",
    twds: "application/vnd.simtech-mindmapper",
    mmf: "application/vnd.smaf",
    teacher: "application/vnd.smart.teacher",
    fo: "application/vnd.software602.filler.form+xml",
    sdkm: "application/vnd.solent.sdkm+xml",
    sdkd: "application/vnd.solent.sdkm+xml",
    dxp: "application/vnd.spotfire.dxp",
    sfs: "application/vnd.spotfire.sfs",
    sdc: "application/vnd.stardivision.calc",
    sda: "application/vnd.stardivision.draw",
    sdd: "application/vnd.stardivision.impress",
    smf: "application/vnd.stardivision.math",
    sdw: "application/vnd.stardivision.writer",
    vor: "application/vnd.stardivision.writer",
    sgl: "application/vnd.stardivision.writer-global",
    smzip: "application/vnd.stepmania.package",
    sm: "application/vnd.stepmania.stepchart",
    wadl: "application/vnd.sun.wadl+xml",
    sxc: "application/vnd.sun.xml.calc",
    stc: "application/vnd.sun.xml.calc.template",
    sxd: "application/vnd.sun.xml.draw",
    std: "application/vnd.sun.xml.draw.template",
    sxi: "application/vnd.sun.xml.impress",
    sti: "application/vnd.sun.xml.impress.template",
    sxm: "application/vnd.sun.xml.math",
    sxw: "application/vnd.sun.xml.writer",
    sxg: "application/vnd.sun.xml.writer.global",
    stw: "application/vnd.sun.xml.writer.template",
    sus: "application/vnd.sus-calendar",
    susp: "application/vnd.sus-calendar",
    svd: "application/vnd.svd",
    sis: "application/vnd.symbian.install",
    sisx: "application/vnd.symbian.install",
    xsm: "application/vnd.syncml+xml",
    bdm: "application/vnd.syncml.dm+wbxml",
    xdm: "application/vnd.syncml.dm+xml",
    ddf: "application/vnd.syncml.dmddf+xml",
    tao: "application/vnd.tao.intent-module-archive",
    pcap: "application/vnd.tcpdump.pcap",
    cap: "application/vnd.tcpdump.pcap",
    dmp: "application/vnd.tcpdump.pcap",
    tmo: "application/vnd.tmobile-livetv",
    tpt: "application/vnd.trid.tpt",
    mxs: "application/vnd.triscape.mxs",
    tra: "application/vnd.trueapp",
    ufd: "application/vnd.ufdl",
    ufdl: "application/vnd.ufdl",
    utz: "application/vnd.uiq.theme",
    umj: "application/vnd.umajin",
    unityweb: "application/vnd.unity",
    uoml: "application/vnd.uoml+xml",
    vcx: "application/vnd.vcx",
    vsd: "application/vnd.visio",
    vst: "application/vnd.visio",
    vss: "application/vnd.visio",
    vsw: "application/vnd.visio",
    vis: "application/vnd.visionary",
    vsf: "application/vnd.vsf",
    wbxml: "application/vnd.wap.wbxml",
    wmlc: "application/vnd.wap.wmlc",
    wmlsc: "application/vnd.wap.wmlscriptc",
    wtb: "application/vnd.webturbo",
    nbp: "application/vnd.wolfram.player",
    wpd: "application/vnd.wordperfect",
    wqd: "application/vnd.wqd",
    stf: "application/vnd.wt.stf",
    xar: "application/vnd.xara",
    xfdl: "application/vnd.xfdl",
    hvd: "application/vnd.yamaha.hv-dic",
    hvs: "application/vnd.yamaha.hv-script",
    hvp: "application/vnd.yamaha.hv-voice",
    osf: "application/vnd.yamaha.openscoreformat",
    osfpvg: "application/vnd.yamaha.openscoreformat.osfpvg+xml",
    saf: "application/vnd.yamaha.smaf-audio",
    spf: "application/vnd.yamaha.smaf-phrase",
    cmp: "application/vnd.yellowriver-custom-menu",
    zir: "application/vnd.zul",
    zirz: "application/vnd.zul",
    zaz: "application/vnd.zzazz.deck+xml",
    vxml: "application/voicexml+xml",
    wasm: "application/wasm",
    wif: "application/watcherinfo+xml",
    wgt: "application/widget",
    hlp: "application/winhlp",
    wsdl: "application/wsdl+xml",
    wspolicy: "application/wspolicy+xml",
    "7z": "application/x-7z-compressed",
    abw: "application/x-abiword",
    ace: "application/x-ace-compressed",
    arj: "application/x-arj",
    aab: "application/x-authorware-bin",
    x32: "application/x-authorware-bin",
    u32: "application/x-authorware-bin",
    vox: "application/x-authorware-bin",
    aam: "application/x-authorware-map",
    aas: "application/x-authorware-seg",
    bcpio: "application/x-bcpio",
    torrent: "application/x-bittorrent",
    blb: "application/x-blorb",
    blorb: "application/x-blorb",
    bz: "application/x-bzip",
    bz2: "application/x-bzip2",
    boz: "application/x-bzip2",
    cbr: "application/x-cbr",
    cba: "application/x-cbr",
    cbt: "application/x-cbr",
    cbz: "application/x-cbr",
    cb7: "application/x-cbr",
    vcd: "application/x-cdlink",
    cfs: "application/x-cfs-compressed",
    chat: "application/x-chat",
    pgn: "application/x-chess-pgn",
    crx: "application/x-chrome-extension",
    cco: "application/x-cocoa",
    nsc: "application/x-conference",
    cpio: "application/x-cpio",
    csh: "application/x-csh",
    udeb: "application/x-debian-package",
    dgc: "application/x-dgc-compressed",
    dir: "application/x-director",
    dcr: "application/x-director",
    dxr: "application/x-director",
    cst: "application/x-director",
    cct: "application/x-director",
    cxt: "application/x-director",
    w3d: "application/x-director",
    fgd: "application/x-director",
    swa: "application/x-director",
    wad: "application/x-doom",
    ncx: "application/x-dtbncx+xml",
    dtb: "application/x-dtbook+xml",
    res: "application/x-dtbresource+xml",
    dvi: "application/x-dvi",
    evy: "application/x-envoy",
    eva: "application/x-eva",
    bdf: "application/x-font-bdf",
    gsf: "application/x-font-ghostscript",
    psf: "application/x-font-linux-psf",
    pcf: "application/x-font-pcf",
    snf: "application/x-font-snf",
    pfa: "application/x-font-type1",
    pfb: "application/x-font-type1",
    pfm: "application/x-font-type1",
    afm: "application/x-font-type1",
    arc: "application/x-freearc",
    spl: "application/x-futuresplash",
    gca: "application/x-gca-compressed",
    ulx: "application/x-glulx",
    gnumeric: "application/x-gnumeric",
    gramps: "application/x-gramps-xml",
    gtar: "application/x-gtar",
    hdf: "application/x-hdf",
    php: "application/x-httpd-php",
    install: "application/x-install-instructions",
    jardiff: "application/x-java-archive-diff",
    jnlp: "application/x-java-jnlp-file",
    kdbx: "application/x-keepass2",
    latex: "application/x-latex",
    luac: "application/x-lua-bytecode",
    lzh: "application/x-lzh-compressed",
    lha: "application/x-lzh-compressed",
    run: "application/x-makeself",
    mie: "application/x-mie",
    prc: "application/x-mobipocket-ebook",
    mobi: "application/x-mobipocket-ebook",
    application: "application/x-ms-application",
    lnk: "application/x-ms-shortcut",
    wmd: "application/x-ms-wmd",
    wmz: "application/x-ms-wmz",
    xbap: "application/x-ms-xbap",
    mdb: "application/x-msaccess",
    obd: "application/x-msbinder",
    crd: "application/x-mscardfile",
    clp: "application/x-msclip",
    com: "application/x-msdownload",
    bat: "application/x-msdownload",
    mvb: "application/x-msmediaview",
    m13: "application/x-msmediaview",
    m14: "application/x-msmediaview",
    wmf: "application/x-msmetafile",
    emf: "application/x-msmetafile",
    emz: "application/x-msmetafile",
    mny: "application/x-msmoney",
    pub: "application/x-mspublisher",
    scd: "application/x-msschedule",
    trm: "application/x-msterminal",
    wri: "application/x-mswrite",
    nc: "application/x-netcdf",
    cdf: "application/x-netcdf",
    pac: "application/x-ns-proxy-autoconfig",
    nzb: "application/x-nzb",
    pl: "application/x-perl",
    pm: "application/x-perl",
    p12: "application/x-pkcs12",
    pfx: "application/x-pkcs12",
    p7b: "application/x-pkcs7-certificates",
    spc: "application/x-pkcs7-certificates",
    p7r: "application/x-pkcs7-certreqresp",
    rpm: "application/x-redhat-package-manager",
    ris: "application/x-research-info-systems",
    sea: "application/x-sea",
    sh: "application/x-sh",
    shar: "application/x-shar",
    swf: "application/x-shockwave-flash",
    xap: "application/x-silverlight-app",
    sql: "application/x-sql",
    sit: "application/x-stuffit",
    sitx: "application/x-stuffitx",
    srt: "application/x-subrip",
    sv4cpio: "application/x-sv4cpio",
    sv4crc: "application/x-sv4crc",
    t3: "application/x-t3vm-image",
    gam: "application/x-tads",
    tar: "application/x-tar",
    tcl: "application/x-tcl",
    tk: "application/x-tcl",
    tex: "application/x-tex",
    tfm: "application/x-tex-tfm",
    texinfo: "application/x-texinfo",
    texi: "application/x-texinfo",
    obj: "application/x-tgif",
    ustar: "application/x-ustar",
    hdd: "application/x-virtualbox-hdd",
    ova: "application/x-virtualbox-ova",
    ovf: "application/x-virtualbox-ovf",
    vbox: "application/x-virtualbox-vbox",
    "vbox-extpack": "application/x-virtualbox-vbox-extpack",
    vdi: "application/x-virtualbox-vdi",
    vhd: "application/x-virtualbox-vhd",
    vmdk: "application/x-virtualbox-vmdk",
    src: "application/x-wais-source",
    webapp: "application/x-web-app-manifest+json",
    der: "application/x-x509-ca-cert",
    crt: "application/x-x509-ca-cert",
    pem: "application/x-x509-ca-cert",
    fig: "application/x-xfig",
    xlf: "application/x-xliff+xml",
    xpi: "application/x-xpinstall",
    xz: "application/x-xz",
    z1: "application/x-zmachine",
    z2: "application/x-zmachine",
    z3: "application/x-zmachine",
    z4: "application/x-zmachine",
    z5: "application/x-zmachine",
    z6: "application/x-zmachine",
    z7: "application/x-zmachine",
    z8: "application/x-zmachine",
    xaml: "application/xaml+xml",
    xav: "application/xcap-att+xml",
    xca: "application/xcap-caps+xml",
    xdf: "application/xcap-diff+xml",
    xel: "application/xcap-el+xml",
    xns: "application/xcap-ns+xml",
    xenc: "application/xenc+xml",
    xhtml: "application/xhtml+xml",
    xht: "application/xhtml+xml",
    xml: "application/xml",
    xsl: "application/xml",
    xsd: "application/xml",
    rng: "application/xml",
    dtd: "application/xml-dtd",
    xop: "application/xop+xml",
    xpl: "application/xproc+xml",
    xslt: "application/xslt+xml",
    xspf: "application/xspf+xml",
    mxml: "application/xv+xml",
    xhvml: "application/xv+xml",
    xvml: "application/xv+xml",
    xvm: "application/xv+xml",
    yang: "application/yang",
    yin: "application/yin+xml",
    zip: "application/zip",
    "3gpp": "video/3gpp",
    adp: "audio/adpcm",
    amr: "audio/amr",
    au: "audio/basic",
    snd: "audio/basic",
    mid: "audio/midi",
    midi: "audio/midi",
    kar: "audio/midi",
    rmi: "audio/midi",
    mxmf: "audio/mobile-xmf",
    mp3: "audio/mpeg",
    m4a: "audio/x-m4a",
    mp4a: "audio/mp4",
    mpga: "audio/mpeg",
    mp2: "audio/mpeg",
    mp2a: "audio/mpeg",
    m2a: "audio/mpeg",
    m3a: "audio/mpeg",
    oga: "audio/ogg",
    ogg: "audio/ogg",
    spx: "audio/ogg",
    opus: "audio/ogg",
    s3m: "audio/s3m",
    sil: "audio/silk",
    uva: "audio/vnd.dece.audio",
    uvva: "audio/vnd.dece.audio",
    eol: "audio/vnd.digital-winds",
    dra: "audio/vnd.dra",
    dts: "audio/vnd.dts",
    dtshd: "audio/vnd.dts.hd",
    lvp: "audio/vnd.lucent.voice",
    pya: "audio/vnd.ms-playready.media.pya",
    ecelp4800: "audio/vnd.nuera.ecelp4800",
    ecelp7470: "audio/vnd.nuera.ecelp7470",
    ecelp9600: "audio/vnd.nuera.ecelp9600",
    rip: "audio/vnd.rip",
    wav: "audio/x-wav",
    weba: "audio/webm",
    aac: "audio/x-aac",
    aif: "audio/x-aiff",
    aiff: "audio/x-aiff",
    aifc: "audio/x-aiff",
    caf: "audio/x-caf",
    flac: "audio/x-flac",
    mka: "audio/x-matroska",
    m3u: "audio/x-mpegurl",
    wax: "audio/x-ms-wax",
    wma: "audio/x-ms-wma",
    ram: "audio/x-pn-realaudio",
    ra: "audio/x-realaudio",
    rmp: "audio/x-pn-realaudio-plugin",
    xm: "audio/xm",
    cdx: "chemical/x-cdx",
    cif: "chemical/x-cif",
    cmdf: "chemical/x-cmdf",
    cml: "chemical/x-cml",
    csml: "chemical/x-csml",
    xyz: "chemical/x-xyz",
    ttc: "font/collection",
    otf: "font/otf",
    ttf: "font/ttf",
    woff: "font/woff",
    woff2: "font/woff2",
    exr: "image/aces",
    apng: "image/apng",
    avci: "image/avci",
    avcs: "image/avcs",
    avif: "image/avif",
    bmp: "image/x-ms-bmp",
    cgm: "image/cgm",
    drle: "image/dicom-rle",
    fits: "image/fits",
    g3: "image/g3fax",
    gif: "image/gif",
    heic: "image/heic",
    heics: "image/heic-sequence",
    heif: "image/heif",
    heifs: "image/heif-sequence",
    hej2: "image/hej2k",
    hsj2: "image/hsj2",
    ief: "image/ief",
    jls: "image/jls",
    jp2: "image/jp2",
    jpg2: "image/jp2",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    jpe: "image/jpeg",
    jph: "image/jph",
    jhc: "image/jphc",
    jpm: "video/jpm",
    jpx: "image/jpx",
    jpf: "image/jpx",
    jxr: "image/jxr",
    jxra: "image/jxra",
    jxrs: "image/jxrs",
    jxs: "image/jxs",
    jxsc: "image/jxsc",
    jxsi: "image/jxsi",
    jxss: "image/jxss",
    ktx: "image/ktx",
    ktx2: "image/ktx2",
    png: "image/png",
    btif: "image/prs.btif",
    pti: "image/prs.pti",
    sgi: "image/sgi",
    svg: "image/svg+xml",
    svgz: "image/svg+xml",
    t38: "image/t38",
    tif: "image/tiff",
    tiff: "image/tiff",
    tfx: "image/tiff-fx",
    psd: "image/vnd.adobe.photoshop",
    azv: "image/vnd.airzip.accelerator.azv",
    uvi: "image/vnd.dece.graphic",
    uvvi: "image/vnd.dece.graphic",
    uvg: "image/vnd.dece.graphic",
    uvvg: "image/vnd.dece.graphic",
    djvu: "image/vnd.djvu",
    djv: "image/vnd.djvu",
    sub: "text/vnd.dvb.subtitle",
    dwg: "image/vnd.dwg",
    dxf: "image/vnd.dxf",
    fbs: "image/vnd.fastbidsheet",
    fpx: "image/vnd.fpx",
    fst: "image/vnd.fst",
    mmr: "image/vnd.fujixerox.edmics-mmr",
    rlc: "image/vnd.fujixerox.edmics-rlc",
    ico: "image/x-icon",
    dds: "image/vnd.ms-dds",
    mdi: "image/vnd.ms-modi",
    wdp: "image/vnd.ms-photo",
    npx: "image/vnd.net-fpx",
    b16: "image/vnd.pco.b16",
    tap: "image/vnd.tencent.tap",
    vtf: "image/vnd.valve.source.texture",
    wbmp: "image/vnd.wap.wbmp",
    xif: "image/vnd.xiff",
    pcx: "image/x-pcx",
    webp: "image/webp",
    "3ds": "image/x-3ds",
    ras: "image/x-cmu-raster",
    cmx: "image/x-cmx",
    fh: "image/x-freehand",
    fhc: "image/x-freehand",
    fh4: "image/x-freehand",
    fh5: "image/x-freehand",
    fh7: "image/x-freehand",
    jng: "image/x-jng",
    sid: "image/x-mrsid-image",
    pic: "image/x-pict",
    pct: "image/x-pict",
    pnm: "image/x-portable-anymap",
    pbm: "image/x-portable-bitmap",
    pgm: "image/x-portable-graymap",
    ppm: "image/x-portable-pixmap",
    rgb: "image/x-rgb",
    tga: "image/x-tga",
    xbm: "image/x-xbitmap",
    xpm: "image/x-xpixmap",
    xwd: "image/x-xwindowdump",
    "disposition-notification": "message/disposition-notification",
    u8msg: "message/global",
    u8dsn: "message/global-delivery-status",
    u8mdn: "message/global-disposition-notification",
    u8hdr: "message/global-headers",
    eml: "message/rfc822",
    mime: "message/rfc822",
    wsc: "message/vnd.wfa.wsc",
    "3mf": "model/3mf",
    gltf: "model/gltf+json",
    glb: "model/gltf-binary",
    igs: "model/iges",
    iges: "model/iges",
    msh: "model/mesh",
    mesh: "model/mesh",
    silo: "model/mesh",
    mtl: "model/mtl",
    stpx: "model/step+xml",
    stpz: "model/step+zip",
    stpxz: "model/step-xml+zip",
    dae: "model/vnd.collada+xml",
    dwf: "model/vnd.dwf",
    gdl: "model/vnd.gdl",
    gtw: "model/vnd.gtw",
    mts: "model/vnd.mts",
    ogex: "model/vnd.opengex",
    x_b: "model/vnd.parasolid.transmit.binary",
    x_t: "model/vnd.parasolid.transmit.text",
    vds: "model/vnd.sap.vds",
    usdz: "model/vnd.usdz+zip",
    bsp: "model/vnd.valve.source.compiled-map",
    vtu: "model/vnd.vtu",
    wrl: "model/vrml",
    vrml: "model/vrml",
    x3db: "model/x3d+fastinfoset",
    x3dbz: "model/x3d+binary",
    x3dv: "model/x3d-vrml",
    x3dvz: "model/x3d+vrml",
    x3d: "model/x3d+xml",
    x3dz: "model/x3d+xml",
    appcache: "text/cache-manifest",
    manifest: "text/cache-manifest",
    ics: "text/calendar",
    ifb: "text/calendar",
    coffee: "text/coffeescript",
    litcoffee: "text/coffeescript",
    css: "text/css",
    csv: "text/csv",
    html: "text/html",
    htm: "text/html",
    shtml: "text/html",
    jade: "text/jade",
    jsx: "text/jsx",
    less: "text/less",
    markdown: "text/markdown",
    md: "text/markdown",
    mml: "text/mathml",
    mdx: "text/mdx",
    n3: "text/n3",
    txt: "text/plain",
    text: "text/plain",
    conf: "text/plain",
    def: "text/plain",
    list: "text/plain",
    log: "text/plain",
    in: "text/plain",
    ini: "text/plain",
    dsc: "text/prs.lines.tag",
    rtx: "text/richtext",
    sgml: "text/sgml",
    sgm: "text/sgml",
    shex: "text/shex",
    slim: "text/slim",
    slm: "text/slim",
    spdx: "text/spdx",
    stylus: "text/stylus",
    styl: "text/stylus",
    tsv: "text/tab-separated-values",
    t: "text/troff",
    tr: "text/troff",
    roff: "text/troff",
    man: "text/troff",
    me: "text/troff",
    ms: "text/troff",
    ttl: "text/turtle",
    uri: "text/uri-list",
    uris: "text/uri-list",
    urls: "text/uri-list",
    vcard: "text/vcard",
    curl: "text/vnd.curl",
    dcurl: "text/vnd.curl.dcurl",
    mcurl: "text/vnd.curl.mcurl",
    scurl: "text/vnd.curl.scurl",
    ged: "text/vnd.familysearch.gedcom",
    fly: "text/vnd.fly",
    flx: "text/vnd.fmi.flexstor",
    gv: "text/vnd.graphviz",
    "3dml": "text/vnd.in3d.3dml",
    spot: "text/vnd.in3d.spot",
    jad: "text/vnd.sun.j2me.app-descriptor",
    wml: "text/vnd.wap.wml",
    wmls: "text/vnd.wap.wmlscript",
    vtt: "text/vtt",
    s: "text/x-asm",
    asm: "text/x-asm",
    c: "text/x-c",
    cc: "text/x-c",
    cxx: "text/x-c",
    cpp: "text/x-c",
    h: "text/x-c",
    hh: "text/x-c",
    dic: "text/x-c",
    htc: "text/x-component",
    f: "text/x-fortran",
    for: "text/x-fortran",
    f77: "text/x-fortran",
    f90: "text/x-fortran",
    hbs: "text/x-handlebars-template",
    java: "text/x-java-source",
    lua: "text/x-lua",
    mkd: "text/x-markdown",
    nfo: "text/x-nfo",
    opml: "text/x-opml",
    p: "text/x-pascal",
    pas: "text/x-pascal",
    pde: "text/x-processing",
    sass: "text/x-sass",
    scss: "text/x-scss",
    etx: "text/x-setext",
    sfv: "text/x-sfv",
    ymp: "text/x-suse-ymp",
    uu: "text/x-uuencode",
    vcs: "text/x-vcalendar",
    vcf: "text/x-vcard",
    yaml: "text/yaml",
    yml: "text/yaml",
    "3gp": "video/3gpp",
    "3g2": "video/3gpp2",
    h261: "video/h261",
    h263: "video/h263",
    h264: "video/h264",
    m4s: "video/iso.segment",
    jpgv: "video/jpeg",
    jpgm: "video/jpm",
    mj2: "video/mj2",
    mjp2: "video/mj2",
    ts: "video/mp2t",
    mp4: "video/mp4",
    mp4v: "video/mp4",
    mpg4: "video/mp4",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    mpe: "video/mpeg",
    m1v: "video/mpeg",
    m2v: "video/mpeg",
    ogv: "video/ogg",
    qt: "video/quicktime",
    mov: "video/quicktime",
    uvh: "video/vnd.dece.hd",
    uvvh: "video/vnd.dece.hd",
    uvm: "video/vnd.dece.mobile",
    uvvm: "video/vnd.dece.mobile",
    uvp: "video/vnd.dece.pd",
    uvvp: "video/vnd.dece.pd",
    uvs: "video/vnd.dece.sd",
    uvvs: "video/vnd.dece.sd",
    uvv: "video/vnd.dece.video",
    uvvv: "video/vnd.dece.video",
    dvb: "video/vnd.dvb.file",
    fvt: "video/vnd.fvt",
    mxu: "video/vnd.mpegurl",
    m4u: "video/vnd.mpegurl",
    pyv: "video/vnd.ms-playready.media.pyv",
    uvu: "video/vnd.uvvu.mp4",
    uvvu: "video/vnd.uvvu.mp4",
    viv: "video/vnd.vivo",
    webm: "video/webm",
    f4v: "video/x-f4v",
    fli: "video/x-fli",
    flv: "video/x-flv",
    m4v: "video/x-m4v",
    mkv: "video/x-matroska",
    mk3d: "video/x-matroska",
    mks: "video/x-matroska",
    mng: "video/x-mng",
    asf: "video/x-ms-asf",
    asx: "video/x-ms-asf",
    vob: "video/x-ms-vob",
    wm: "video/x-ms-wm",
    wmv: "video/x-ms-wmv",
    wmx: "video/x-ms-wmx",
    wvx: "video/x-ms-wvx",
    avi: "video/x-msvideo",
    movie: "video/x-sgi-movie",
    smv: "video/x-smv",
    ice: "x-conference/x-cooltalk"
};
function getContentTypeByExt(extension) {
    if (!extension || typeof extension !== "string") return "";
    extension = extension.replace(/^\./, "");
    if (!extension) return "";
    if (!Object.prototype.hasOwnProperty.call(map, extension)) return "";
    return map[extension];
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
var exports = __webpack_exports__;
/*!******************************!*\
  !*** ./src/cli/az-upload.ts ***!
  \******************************/

Object.defineProperty(exports, "resolveFileName", ({
    enumerable: true,
    get: function() {
        return resolveFileName;
    }
}));
const _path = __webpack_require__(/*! path */ "path");
const _helper = __webpack_require__(/*! ./helper */ "./src/cli/helper.ts");
const _putblob = __webpack_require__(/*! ../utils/azure/blob/put-blob */ "./src/utils/azure/blob/put-blob.ts");
const _copyblob = __webpack_require__(/*! ../utils/azure/blob/copy-blob */ "./src/utils/azure/blob/copy-blob.ts");
const _putblocklist = __webpack_require__(/*! ../utils/azure/blob/put-block-list */ "./src/utils/azure/blob/put-block-list.ts");
const _putblock = __webpack_require__(/*! ../utils/azure/blob/put-block */ "./src/utils/azure/blob/put-block.ts");
const _blockhelper = __webpack_require__(/*! ../utils/azure/blob/block-helper */ "./src/utils/azure/blob/block-helper.ts");
const _env = __webpack_require__(/*! ../utils/azure/env */ "./src/utils/azure/env.ts");
const _crypto = __webpack_require__(/*! ../utils/azure/crypto */ "./src/utils/azure/crypto.ts");
const _env1 = __webpack_require__(/*! ../utils/env */ "./src/utils/env.ts");
const _logger = __webpack_require__(/*! ../utils/logger */ "./src/utils/logger.ts");
const _networkretry = __webpack_require__(/*! ../utils/network-retry */ "./src/utils/network-retry.ts");
const _file = __webpack_require__(/*! ../utils/file */ "./src/utils/file.ts");
const _contenttype = __webpack_require__(/*! ../utils/azure/content-type */ "./src/utils/azure/content-type.ts");
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
    (0, _env1.loadEnvFiles)(envFiles);
    const connect = new _env.AzureStorageEnv();
    if (overwriteContainer) connect.container = overwriteContainer;
    connect.assertKey();
    connect.assertContainer();
    const localFileStat = (0, _file.fileStat)(localFile);
    const localFileName = _path.basename(localFile);
    const localFileSize = localFileStat.size;
    const extName = _path.extname(localFileName);
    const contentType = (0, _contenttype.getContentTypeByExt)(extName);
    const now = new Date();
    const resolvedBlob = [];
    if (remoteFile) resolvedBlob.push(resolveFileName(remoteFile, {
        now
    }));
    else resolvedBlob.push(remoteFile = localFileName);
    copy.forEach((it)=>resolvedBlob.push(resolveFileName(it, {
            now
        })));
    logger.log(`localFile=${JSON.stringify(localFileName)}`);
    logger.log(`size=${localFileSize} "${(0, _file.getHumanReadableFileSize)(localFileSize)}"`);
    logger.log(`content-type=${localFileSize} "${(0, _file.getHumanReadableFileSize)(localFileSize)}"`);
    for(let i = 0; i < resolvedBlob.length; i++){
        const remoteFile = resolvedBlob[i];
        logger.log(`remoteFile[${i}]=${JSON.stringify(`${connect.accountName}/${connect.container}/${remoteFile}`)}`);
    }
    const from = Date.now() / 1000;
    const blocks = (0, _blockhelper.getBlocksFormLocalFile)(localFile);
    const firstBlob = resolvedBlob[0];
    let networkRetry = _networkretry.networkRetry;
    if (dryrun) networkRetry = async ()=>null;
    if (blocks.length <= 1) {
        logger.log(`uploadMode="put 1 blob"`);
        const uploadResult = await networkRetry(()=>(0, _putblob.azPutBlob)({
                logger,
                connect,
                blob: firstBlob,
                file: localFile,
                contentType
            }), 5);
        if (uploadResult?.["content-md5"]) {
            const remoteMD5 = uploadResult["content-md5"];
            logger.log(`md5sum(remoteFile)=${remoteMD5}`);
            const localMD5 = await (0, _crypto.getFileMD5Base64)(localFile);
            if (localMD5 !== remoteMD5) throw new Error(`md5sums are different between local and remote, local md5sum is "${localMD5}"`);
        }
    } else {
        logger.log(`uploadMode="put ${blocks.length} blocks and put block list"`);
        for(let i = 0; i < blocks.length; i++){
            const block = blocks[i];
            const now = Date.now() / 1000;
            const elapsed = (now - from).toFixed(0);
            logger.log(`uploading block ${i + 1}/${blocks.length} "${block.uuid}" +${elapsed}s`);
            await networkRetry(()=>(0, _putblock.azPutBlock)({
                    logger,
                    connect,
                    blob: firstBlob,
                    block
                }), 5);
        }
        const blockUUIDs = blocks.map((it)=>it.uuid);
        await networkRetry(()=>(0, _putblocklist.azPutBlockList)({
                logger,
                connect,
                blob: firstBlob,
                blockUUIDs,
                contentType
            }), 3);
    }
    for(let i = 1; i < resolvedBlob.length; i++){
        const remoteFile = resolvedBlob[i];
        logger.log(`copying the blob to "${remoteFile}"`);
        await networkRetry(()=>(0, _copyblob.azCopyBlob)({
                logger,
                connect,
                blob: remoteFile,
                source: {
                    blob: firstBlob
                }
            }), 3);
    }
    const elapsed = (Date.now() / 1000 - from).toFixed(0);
    logger.log(`uploaded done (elapsed ${elapsed}s)`);
}
function resolveFileName(fileName, context) {
    const date = context.now;
    const pad2 = (num)=>num < 10 ? `0${num}` : `${num}`;
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
                return (0, _crypto.uuidv4)();
            default:
                return _;
        }
    });
}

})();

/******/ })()
;
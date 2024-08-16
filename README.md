# azure-utils

![Github Action Status](https://github.com/hangxingliu/azure-utils/actions/workflows/main.yaml/badge.svg?branch=main)

Standalone Node.js utils for Azure

## Features

- [x] Upload file to Azure Blob Storage
- [x] Download file from Azure Blob Storage
- [x] List files on Azure Blob Storage
- [x] Delete files on Azure Blob Storage
- [x] List uncommitted blocks
- [ ] Resume upload

## Supported Environment Variables

- `AZURE_STORAGE_KEY`
- `AZURE_STORAGE_ACCOUNT`
- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_CONTAINER`
- `AZURE_STORAGE_ACCESS_KEY`

## Usage

``` bash
export AZURE_STORAGE_CONTAINER=testaccount/container1
export AZURE_STORAGE_KEY='jPJyz......dA=='

./dist/az-upload.js cat.jpg 'user-uploads/$yyyy-$mm-$dd/$uuid.jpg' --cp 'user-uploads/by-uid/10/cat.jpg' --cp 'maybe.jpg'
./dist/az-ls-blobs.js user-uploads/
./dist/az-download.js maybe.jpg
./dist/az-del-blob.js maybe.jpg

# Get more usage by option `--help`
```


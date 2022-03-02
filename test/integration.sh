#!/usr/bin/env bash

throw() { echo -e "${red}fatal: ${1}${reset}" >&2; exit 1; }
task() { echo -e "${cyan}[.] ${1}${reset}" >&2; }
if test -t 1 || test -t 2; then
	bold="\x1b[1m"; dim="\x1b[2m";
	red="\x1b[31m"; cyan="\x1b[36m";
	reset="\x1b[0m";
fi

pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

if test -f .env; then
  task "sourcing '.env' file ...";
  source .env || throw "sourcing '.env' failed!";

  test -n "${AZURE_STORAGE_CONTAINER}" &&
    export AZURE_STORAGE_CONTAINER="${AZURE_STORAGE_CONTAINER}";
  test -n "${AZURE_STORAGE_CONNECTION_STRING}" &&
    export AZURE_STORAGE_CONNECTION_STRING="${AZURE_STORAGE_CONNECTION_STRING}";
fi

task "list blobs ..."
./dist/az-ls-blobs.sh --limit 10 || throw "list blobs failed";

target_name1='integration_test/file <1>.jpg';
target_name2='integration_test/file <2>.jpg';
task "upload file ..."
./dist/az-upload.sh ./test/testfile.jpg --cp "$target_name1" --cp "$target_name2" ||
  throw "upload file failed";

function test_ls() {
  ./dist/az-ls-blobs.sh --limit 10 'integration_test/' |
    awk -v name1="$target_name1" -v name2="$target_name2" '
      index($0, name1) == 1 { print $0; next; }
      index($0, name2) == 1 { print $0; next; }
    ';
}
task "check if files are uploaded ..."
ls_result="$(test_ls)";
printf "${dim}%s${reset}\n" "${ls_result}";
test -z "${ls_result}" && throw "can't match uploaded files";

ls_lines="$(echo "${ls_result}" | wc -l | awk '{print $1;}')";
[ "$ls_lines" != 2 ] && throw "match ${ls_lines} results but not 2";

task "download file ...";
./dist/az-download.sh "$target_name2" - >/dev/null || throw "download failed";

task "get download URL of file ...";
./dist/az-download.sh "$target_name2" --url || throw "get url failed";

task "delete test files ...";
./dist/az-del-blob.sh "$target_name1" "$target_name2" || throw "delete failed";

task "check if files are deleted ...";
ls_result="$(test_ls)";
printf "${dim}%s${reset}\n" "${ls_result}";
test -n "${ls_result}" && throw "files are still existing";

echo -e "${bold}[+] test done${reset}" >&2;

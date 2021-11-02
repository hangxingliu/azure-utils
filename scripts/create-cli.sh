#!/usr/bin/env bash

this_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
wrapper="${this_dir}/node-wrapper.sh"

cd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

files="$(find dist -type f -iname '*.js')";
[ -z "$files" ] && exit;

while read -r file; do
  sh_file="${file%.js}.sh";
  cat "${wrapper}" "${file}" > "${sh_file}" &&
    chmod +x "${sh_file}" &&
    echo "'${file}' => '${sh_file}'" || exit 1;
done <<< "${files}"


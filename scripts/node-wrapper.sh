#!/usr/bin/env bash

node="$(command -v node)"
[ -x "$node" ] || node="/usr/local/bin/node";
[ -x "$node" ] || node="/opt/homebrew/bin/node";
[ -x "$node" ] || node="/usr/bin/node";
[ -x "$node" ] || node="$HOME/bin/node";
if [ ! -x "$node" ] && [ -d "$HOME/.nvm/versions/node" ]; then
  nvm_node="$(find "$HOME/.nvm/versions/node" -maxdepth 1 -mindepth 1 | head -n 1)";
  [ -n "$nvm_node" ] && [ -x "$nvm_node/bin/node" ] && node="$nvm_node/bin/node";
fi
if [ ! -x "$node" ]; then
  echo "fatal: node: command not found" >&2;
  exit 1;
fi

tmpfile="$(mktemp)";
if [ -z "$tmpfile" ] || [ ! -f "$tmpfile" ]; then
  echo "fatal: allocate temporary file";
  exit 1;
fi
clean_tmp_file() { rm "$tmpfile"; }
trap clean_tmp_file EXIT;

awk '$1 == "#!/usr/bin/env" && $2 == "node" {ok=1} ok {print}' "$0" > "$tmpfile";
"$node" "$tmpfile" "${@}";
exit "$?";
#

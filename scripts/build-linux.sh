#!/usr/bin/env bash
set -euo pipefail
test "${SQUASH_BUILD_ALL_CONTEXT:-}" = 1 || { printf 'Only build_all.sh may invoke this helper.\n' >&2; exit 2; }
snapshot="$1"
output="$2"
export PATH="${SQUASH_LINUX_NODE:-/home/robin/.nvm/versions/node/v24.19.0/bin}:$HOME/.cargo/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export CARGO_TARGET_DIR="$HOME/.cache/squash-arcade/targets/linux"
export APPIMAGE_EXTRACT_AND_RUN=1
export CI=true
tools="$HOME/.cache/squash-arcade/tauri-cli"
if [ ! -f "$tools/node_modules/@tauri-apps/cli/tauri.js" ]; then
  npm install --prefix "$tools" --save-exact @tauri-apps/cli@2.11.4 --no-audit --no-fund
fi
work="$HOME/.cache/squash-arcade/work/$(basename "$(dirname "$(dirname "$snapshot")")")-linux"
mkdir -p "$work" "$output"
cp -a "$snapshot/." "$work/"
cd "$work"
result=0
node "$tools/node_modules/@tauri-apps/cli/tauri.js" build --bundles appimage,deb,rpm --ci || result=$?
version="$(tr -d '\r\n' < version.txt)"
for spec in 'appimage AppImage linux-x86_64.AppImage' 'deb deb linux-amd64.deb' 'rpm rpm linux-x86_64.rpm'; do
  read -r kind ext qualifier <<< "$spec"
  artifact="$(find "$CARGO_TARGET_DIR/release/bundle/$kind" -maxdepth 1 -name "*.$ext" -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2- || true)"
  if [ -n "$artifact" ]; then cp "$artifact" "$output/squash-arcade-v$version-$qualifier"; fi
done
printf '{"canonicalVersion":"%s","baseline":"%s","signing":"unsigned"}\n' "$version" "$(. /etc/os-release; printf '%s' "$PRETTY_NAME")" > "$output/squash-arcade-v$version-linux-metadata.json"
exit "$result"

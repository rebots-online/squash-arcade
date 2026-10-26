#!/usr/bin/env bash
set -euo pipefail
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
node "$tools/node_modules/@tauri-apps/cli/tauri.js" build --bundles appimage --ci
version="$(tr -d '\r\n' < version.txt)"
artifact="$(find "$CARGO_TARGET_DIR/release/bundle/appimage" -maxdepth 1 -name '*.AppImage' -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)"
test -n "$artifact"
cp "$artifact" "$output/squash-arcade-v$version-linux-x86_64.AppImage"
printf '{"canonicalVersion":"%s","baseline":"%s","signing":"unsigned"}\n' "$version" "$(. /etc/os-release; printf '%s' "$PRETTY_NAME")" > "$output/platform.json"

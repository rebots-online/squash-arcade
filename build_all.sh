#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
export SQUASH_BUILD_ALL_CONTEXT=1
case "${1:-}" in
  '') node scripts/build-all.mjs ;;
  --deploy-existing) node scripts/deploy.mjs ;;
  --recover-release) node scripts/recover-release.mjs "${2:?Release version required}" ;;
  --inventory-speech) node scripts/catalog-speech.mjs ;;
  *) printf 'Usage: ./build_all.sh [--deploy-existing|--recover-release VERSION|--inventory-speech]\n' >&2; exit 2 ;;
esac

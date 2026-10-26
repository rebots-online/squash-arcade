#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
export SQUASH_BUILD_ALL_CONTEXT=1
case "${1:-}" in
  '') node scripts/build-all.mjs; node scripts/deploy.mjs ;;
  --deploy-existing) node scripts/deploy.mjs ;;
  *) printf 'Usage: ./build_all.sh [--deploy-existing]\n' >&2; exit 2 ;;
esac

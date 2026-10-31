#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

: "${RUNTIME_DIR:?RUNTIME_DIR is required}"
: "${CAPTURE_URL:?CAPTURE_URL is required}"
: "${CAPTURE_DIR:?CAPTURE_DIR is required}"

/usr/bin/time -p node "$RUNTIME_DIR/scripts/default-capture.mjs"

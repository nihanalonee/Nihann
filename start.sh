#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

export PORT="${PORT:-3000}"
export NEXT_TELEMETRY_DISABLED=1

if [[ ! -d node_modules || ! -f node_modules/.package-lock.json ]]; then
  /usr/bin/time -p npm ci --no-audit --no-fund
fi

/usr/bin/time -p npm run build

runtime_dir="${OPENCODE_WEB_DIR:-$PWD/.omgithub-runtime}"
/usr/bin/time -p mkdir -p "$runtime_dir"
/usr/bin/time -p node -e '
const { writeFileSync } = require("node:fs");
const path = require("node:path");
const project = process.cwd();
writeFileSync(
  path.join(process.argv[1], "deployment-output.json"),
  JSON.stringify({ project, directory: path.join(project, "out") })
);
' "$runtime_dir"

exec node server.mjs

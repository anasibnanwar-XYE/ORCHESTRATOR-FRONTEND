#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
BACKEND_ROOT="/Users/anas/Documents/FACTORY/bigbrightpaints-erp"
VALIDATION_ENV="$ROOT/.env.validation.local"

if ! command -v bun >/dev/null 2>&1; then
  echo "bun is required for this mission." >&2
  exit 1
fi

if [ ! -d "$ROOT/node_modules" ]; then
  echo "[init] Installing frontend dependencies"
  (cd "$ROOT" && bun install)
fi

if [ ! -f "$VALIDATION_ENV" ]; then
  cat >&2 <<MSG
[init] Missing $VALIDATION_ENV
Create the gitignored validation env file before running browser or Playwright validation.
MSG
fi

if [ ! -d "$BACKEND_ROOT" ]; then
  cat >&2 <<MSG
[init] Missing backend repo at $BACKEND_ROOT
Workers should return to the orchestrator if the local backend repo is unavailable.
MSG
fi

cat <<MSG
[init] Mission runtime summary
- Frontend root: $ROOT
- Validation env: $VALIDATION_ENV
- Local backend app: http://127.0.0.1:8081
- Local backend management: http://127.0.0.1:9090
- Preferred readiness probe: GET /api/v1/auth/me -> 401/403 on port 8081
MSG

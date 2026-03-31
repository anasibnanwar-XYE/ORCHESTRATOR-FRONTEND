#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
VALIDATION_ENV="$ROOT/.env.validation.local"
REMOTE_BACKEND_URL="http://100.109.241.47:8081"
LOCAL_BACKEND_URL="http://127.0.0.1:8081"

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

cat <<MSG
[init] Mission runtime summary
- Frontend root: $ROOT
- Validation env: $VALIDATION_ENV
- Primary backend app: $REMOTE_BACKEND_URL
- Local fallback backend: $LOCAL_BACKEND_URL
- Preferred readiness probe: GET /api/v1/auth/me on the remote backend -> 401/403
MSG

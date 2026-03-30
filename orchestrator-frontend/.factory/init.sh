#!/usr/bin/env bash
set -euo pipefail

cd /home/realnigga/ORCHESTRATOR-FRONTEND-MISSION/orchestrator-frontend

# Install dependencies (idempotent)
if [ ! -d "node_modules" ] || [ "bun.lock" -nt "node_modules/.package-lock.json" ] 2>/dev/null; then
  bun install
fi

# Install Playwright browsers if not present
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
  npx playwright install chromium 2>/dev/null || true
fi

# Load test credentials from .env.test if present (not committed to git)
if [ -f ".env.test" ]; then
  set -a; source .env.test; set +a
fi

# Verify backend is reachable
if ! curl -sf http://localhost:8081/swagger-ui/index.html -o /dev/null 2>/dev/null; then
  echo "WARNING: Backend not reachable on localhost:8081."
fi

echo "Init complete. Frontend ready."

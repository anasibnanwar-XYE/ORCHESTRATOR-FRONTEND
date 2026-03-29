#!/usr/bin/env bash
set -euo pipefail

cd /home/realnigga/ORCHESTRATOR-FRONTEND-MISSION/orchestrator-frontend

# Install dependencies (idempotent)
if [ ! -d "node_modules" ] || [ "bun.lock" -nt "node_modules/.package-lock.json" ] 2>/dev/null; then
  bun install
fi

# Verify backend is reachable
if ! curl -sf http://localhost:8081/api/v1/auth/me -o /dev/null 2>/dev/null; then
  echo "WARNING: Backend not reachable on localhost:8081. Docker containers may not be running."
  echo "Run: cd /home/realnigga/Desktop/Mission-control && docker compose up -d"
fi

echo "Init complete. Frontend ready at /home/realnigga/ORCHESTRATOR-FRONTEND-MISSION/orchestrator-frontend"

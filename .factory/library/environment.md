# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** required env vars, external services, local setup notes, credential-handling rules.
**What does NOT belong here:** service commands and ports that already live in `.factory/services.yaml`.

---

- Frontend dev server runs locally on `http://127.0.0.1:3002`.
- Backend app is user-managed and reachable at `http://100.109.241.47:8081`.
- Backend actuator is reachable through `ssh asus-tuf-tail-ip` at `http://127.0.0.1:9090`; use liveness only for diagnostics.
- Backend Postgres on host port `5433` is backend-managed and out of scope for this frontend mission.
- Validation credentials are mission-local and live only in the mission `AGENTS.md`. Never copy raw credential values into repo files, tests, snapshots, or commits.
- If Playwright or local scripts need credentials, pass them inline via env vars during execution (for example `VALIDATION_SUPERADMIN_EMAIL`, `VALIDATION_SHARED_PASSWORD`) instead of hardcoding values.

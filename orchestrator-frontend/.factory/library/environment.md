# Environment

Environment variables, local runtime details, external dependencies, and setup notes for the Sales + Dealer mission.

**What belongs here:** runtime locations, ports, local env files, validation actors, backend startup/reset notes, platform quirks.
**What does NOT belong here:** feature decomposition, acceptance assertions, or service orchestration logic beyond quick reference.

---

## Mission Runtime

- Frontend repo: `/Users/anas/Documents/New project 5/orchestrator-frontend`
- Backend repo: `/Users/anas/Documents/FACTORY/bigbrightpaints-erp`
- Canonical docs root: `/Users/anas/Documents/FACTORY/bigbrightpaints-erp/docs`
- Frontend app URL: `http://127.0.0.1:3002`
- Primary remote backend app URL: `http://100.109.241.47:8081`
- Local fallback backend app URL: `http://127.0.0.1:8081`
- Local fallback backend management URL: `http://127.0.0.1:9090`

## Local Runtime Ports

- Frontend dev server: `3002`
- Backend app: `8081`
- Backend management: `9090`
- Postgres: `5433`
- RabbitMQ: `5672`
- RabbitMQ management: `15672`
- MailHog SMTP: `1025`
- MailHog UI: `8025`

Avoid unrelated local ports already in use during planning: `5000`, `5173`, `7000`.

## Validation Environment File

Use the gitignored file:

- `/Users/anas/Documents/New project 5/orchestrator-frontend/.env.validation.local`

This file stores local validation emails and the shared validation password. It is intentionally not committed. Workers and validators should source it when running Playwright or any browser automation that needs credentials.

### Expected variables

- `VALIDATION_SHARED_PASSWORD`
- `VALIDATION_SUPERADMIN_EMAIL`
- `VALIDATION_ADMIN_EMAIL`
- `VALIDATION_ACCOUNTING_EMAIL`
- `VALIDATION_SALES_EMAIL`
- `VALIDATION_FACTORY_EMAIL`
- `VALIDATION_DEALER_EMAIL`
- `VALIDATION_RIVAL_ADMIN_EMAIL`
- `VALIDATION_RIVAL_DEALER_EMAIL`
- `VALIDATION_MFA_ADMIN_EMAIL`
- `VALIDATION_MUSTCHANGE_ADMIN_EMAIL`
- `VALIDATION_LOCKED_ADMIN_EMAIL`
- `VALIDATION_HOLD_ADMIN_EMAIL`
- `VALIDATION_BLOCKED_ADMIN_EMAIL`

### Company scopes used in validation

- `SKE`: platform/superadmin validation scope
- `MOCK`: main tenant validation scope for admin, accounting, sales, factory, dealer
- `RIVAL`: cross-tenant isolation fixtures

## Backend Startup / Reset

Optional local fallback backend reset/runtime command:

```bash
. "/Users/anas/Documents/New project 5/orchestrator-frontend/.env.validation.local" && \
ERP_VALIDATION_SEED_PASSWORD="$VALIDATION_SHARED_PASSWORD" \
ERP_SEED_MOCK_ADMIN_PASSWORD="$VALIDATION_SHARED_PASSWORD" \
bash "/Users/anas/Documents/FACTORY/bigbrightpaints-erp/scripts/reset_final_validation_runtime.sh"
```

What this does:
- resets and reseeds the local Colima-backed Docker runtime
- starts app on `8081`
- starts management on `9090`
- starts db/rabbit/mailhog on their local ports
- provisions deterministic validation actors and fixtures

## Readiness Notes

Use the remote app port, not actuator alone, as the primary readiness signal:

```bash
curl -i http://100.109.241.47:8081/api/v1/auth/me
```

Expected ready-state response without auth: `401` or `403`.

If the remote backend is unavailable, the local fallback backend on `127.0.0.1:8081` may be used only after orchestrator approval. The local management port `9090` may report `DOWN` even when the fallback app is usable, so treat it as supporting evidence only.

## CORS / Proxy Notes

- For this mission, the frontend should proxy `/api` to `http://100.109.241.47:8081`
- `X-Company-Code` is the canonical tenant header
- `X-Company-Id` is legacy drift and should be removed from Sales + Dealer flows

## Data Safety

Realistic writes are allowed on validation actors, but workers must:
- keep writes minimal
- use unique names/references for created dealers, orders, support tickets, and credit requests
- avoid mutating non-validation users or other tenants
- never commit secrets from `.env.validation.local`

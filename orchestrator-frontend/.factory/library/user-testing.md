# User Testing

Validation surface notes, runtime setup, and concurrency guidance for the Sales + Dealer portal mission.

**What belongs here:** test surfaces, required tools, credentials source, concurrency rules, isolation guidance, and route-specific validation notes.

---

## Validation Surface

### Primary surface
- Browser UI on `http://127.0.0.1:3002`
- Primary remote backend on `http://100.109.241.47:8081`
- Local fallback backend on `http://127.0.0.1:8081`
- Tool: `agent-browser`

### Automated surface
- Playwright E2E in `tests/e2e`
- Tool: `playwright`
- Use the gitignored `.env.validation.local` file for credentials

### Supporting surface
- `curl` for readiness and network-contract spot checks only
- Preferred readiness check: `GET /api/v1/auth/me` on `8081` expecting `401` or `403`

## Validation Concurrency

Machine profile observed during planning:
- ~10 CPU cores
- ~24 GB RAM

Mission-safe limits:
- Playwright: **1 worker**
- Browser validators (`agent-browser`): **2 concurrent sessions max**
- `curl` or read-only network probes: **up to 5 concurrent**

### Why these limits
Sales + Dealer validation performs real writes against one shared seeded backend:
- dealer creation
- sales order creation / confirmation / cancellation
- dealer support ticket creation
- dealer credit request creation

These flows share backend state, so destructive or stateful checks must be serialized or isolated with unique test data even if the machine has spare CPU/RAM.

## Validation Accounts

Source credentials from:
- `/Users/anas/Documents/New project 5/orchestrator-frontend/.env.validation.local`

Company scopes used by validators:
- `VALIDATION_SUPERADMIN_EMAIL` -> `SKE`
- most tenant actors -> `MOCK`
- rival isolation actors -> `RIVAL`

Do not copy secrets into committed files.

## Setup Sequence

1. Confirm the remote backend through the `backend` service healthcheck in `.factory/services.yaml`
2. Start frontend through the `frontend` service in `.factory/services.yaml`
3. Source `.env.validation.local` before Playwright or any scripted browser flow
4. Confirm readiness:
   - `http://100.109.241.47:8081/api/v1/auth/me` returns `401` or `403`
   - `http://127.0.0.1:3002/login` loads successfully

## Assertion Grouping Guidance

### Shared shell and auth
Validate:
- `/api/v1/auth/me` bootstrap
- `X-Company-Code` usage
- no `X-Company-Id`
- deep-link restoration
- password-change corridor
- no icons/emojis or orchestrator branding in Sales/Dealer shell
- desktop/tablet/mobile shell behavior

### Sales commercial
Validate:
- `/sales/dashboard`
- `/sales/dealers`
- `/sales/dealers/new`
- `/sales/dealers/:dealerId`
- `/sales/promotions`
- `/sales/targets`
- dedicated loading/empty/blocked/validation states

### Sales orders and credit
Validate:
- `/sales/orders`
- `/sales/orders/new`
- `/sales/orders/:orderId`
- `/sales/orders/:orderId/timeline`
- `/sales/credit`
- `/sales/credit/:requestId`
- removal of legacy `/sales/credit-requests`, `/sales/credit-overrides`, `/sales/invoices`, `/sales/returns`, `/sales/dispatch`

### Dealer finance
Validate:
- `/dealer/dashboard`
- `/dealer/orders`
- `/dealer/orders/:orderId`
- `/dealer/invoices`
- `/dealer/invoices/:invoiceId`
- `/dealer/ledger`
- `/dealer/aging`

### Dealer support and credit
Validate:
- `/dealer/support`
- `/dealer/support/:ticketId`
- `/dealer/credit-requests`
- `/dealer/credit-requests/new`
- removal/redirect of `/dealer/profile`
- canonical dealer backend paths only

### Cross-area flows
Validate:
- Sales-confirmed orders visible in Dealer
- invoice follow-up parity across Sales and Dealer
- dealer credit request lifecycle round-trip
- cancellation / hold propagation back to Dealer
- dunning / receivable parity cues across portals
- canonical endpoint usage only

## Isolation Rules For Real Writes

Use unique identifiers in every mutating run. Recommended prefix:

```text
SDM-<YYYYMMDD-HHMMSS>-<short-purpose>
```

Examples:
- dealer name/code
- order note / external reference
- support ticket subject
- credit request justification text

Record created references/public IDs in the worker handoff so later validators or follow-up workers can inspect the same records.

## Known Runtime Constraints

- The management port `9090` may report `DOWN` even when the app on `8081` is usable.
- The remote backend is the primary validation target for this mission. The local Colima backend remains a fallback runtime only and should not be used mid-validation unless the orchestrator explicitly switches targets.
- Current checked-in Playwright auth helpers were known to drift before milestone 1; once fixed, workers should keep Playwright aligned with visible labels and canonical routes.

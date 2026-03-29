# User Testing

## Validation Surface

- **Primary surface:** Browser (web app on localhost:3002)
- **Tool:** agent-browser
- **Auth:** Real backend with seeded test accounts
- **Proxy:** Vite dev proxy to localhost:8081

## Validation Concurrency

- Machine: 16 cores, 15GB RAM, ~11GB available
- Dev server: ~200MB RAM
- Each agent-browser instance: ~300MB RAM
- Max concurrent validators: **5** (5 * 300MB + 200MB = 1.7GB, well within 8.4GB budget at 70% headroom)

## Test Account Credentials

All passwords: `Validation1!cc18570e52fe48dd`

| Role | Email | Company Code |
|---|---|---|
| Admin | validation.admin@example.com | MOCK |
| Accounting | validation.accounting@example.com | MOCK |
| Sales | validation.sales@example.com | MOCK |
| Factory | validation.factory@example.com | MOCK |
| Dealer | validation.dealer@example.com | MOCK |
| Superadmin | validation.superadmin@example.com | SKE |

## Setup Requirements

1. Backend Docker stack must be running (`docker ps` to verify)
2. Frontend dev server: `cd /home/realnigga/ORCHESTRATOR-FRONTEND-MISSION/orchestrator-frontend && bun run dev`
3. Wait for Vite ready message before testing
4. Login flow: navigate to localhost:3002/login, enter email + password + company code

## Testing Philosophy (CRITICAL)

agent-browser validators MUST simulate real human behavior, not just test predefined flows:

1. **Explore like a real user** — click around, open menus, try actions, navigate between pages
2. **Visual quality checks** — verify badge consistency, DataTable usage, CSS variable colors, spacing, typography
3. **Responsive checks** — resize to 1366px, 768px, 375px for every page tested
4. **Dark mode** — toggle theme and verify rendering
5. **Console monitoring** — check browser console on EVERY page for JS errors, failed requests, warnings
6. **Backend discovery** — when an API call fails (404, 400, 500), this likely means the backend changed. Document the failure with endpoint, response code, and response body. This is a discovery, not just a failure.
7. **Remove dead UI** — if a page/tab/action has no working backend support, that's a finding workers must act on

## Known Testing Constraints

- HR/Payroll module is on hold - skip any HR/payroll testing
- Some test data may not exist for all flows (e.g., production logs, packing records)
- Superadmin uses company code SKE, all others use MOCK
- Many frontend pages have stale UI for backend features that no longer exist — discovering these is part of the mission

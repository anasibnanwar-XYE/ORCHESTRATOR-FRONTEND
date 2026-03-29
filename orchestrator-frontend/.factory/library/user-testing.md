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

## Flow Validator Guidance: Browser (agent-browser)

### Isolation Rules
- All foundation assertions are read-only inspection tests — no data mutation
- All subagents share the same frontend instance at http://localhost:3002
- No login required for most foundation checks (CSS variables, theme, 404 page)
- For assertions requiring authenticated pages (DataTable on /admin/users), use admin account
- Each subagent should use its own agent-browser session to avoid conflicts
- Do NOT modify any data — only inspect and verify

### Concurrency
- Up to 4 subagents can run concurrently for foundation assertions
- Each uses its own browser session — no shared state conflicts
- All read-only: no risk of data interference

### Shared State to Avoid
- Do NOT log in/out in one subagent while another is testing authenticated pages
- Do NOT change theme settings if another subagent is testing theme behavior
- Keep theme-dependent tests isolated to their own subagent

## Flow Validator Guidance: Browser — Auth & Shell Assertions (auth-shell milestone)

### Isolation Rules
- Auth assertions (VAL-AUTH-001 to VAL-AUTH-017) involve heavy auth state manipulation (login, logout, MFA, company switch)
- Each subagent MUST use its own agent-browser session to avoid auth state conflicts
- Group 1 (login/auth core) manipulates login state heavily — must be isolated from Group 2
- Group 2 (profile/nav/shell) requires staying logged in — must not be disturbed by login/logout in other sessions
- Both groups can run concurrently using separate browser sessions
- Do NOT modify user profile data that would affect other tests (e.g., changing MFA state)

### Concurrency
- Max 2 concurrent subagents for auth-shell (each uses own session with independent auth state)
- Group 1 and Group 2 can run in parallel with separate sessions

### Shared State to Avoid
- Do NOT perform logout in one session while another session is testing authenticated features
- Do NOT modify MFA settings (enable/disable) that would affect login behavior for other sessions
- Do NOT change company context in one session while another tests company-dependent features
- Each session should login with its own credentials independently

### Auth Testing Notes
- For login tests: start from /login page, test valid and invalid credentials
- Company code field: MOCK for most test accounts, SKE for superadmin
- MFA: there may not be an MFA-enabled test account; if MFA test account doesn't exist, report as blocked
- Password reset: requires a valid reset token from backend; may need to trigger forgot-password flow first
- Forced password change: requires a user with mustChangePassword=true; may not exist in seed data
- Session keepalive: check network tab for periodic /auth/me requests while logged in
- Command palette: Ctrl+K (not Cmd+K on Linux) to open

## Known Testing Constraints

- HR/Payroll module is on hold - skip any HR/payroll testing
- Some test data may not exist for all flows (e.g., production logs, packing records)
- Superadmin uses company code SKE, all others use MOCK
- Many frontend pages have stale UI for backend features that no longer exist — discovering these is part of the mission

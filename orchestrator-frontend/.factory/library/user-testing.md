# User Testing

## Validation Surface

**Primary surface:** Web UI at `http://localhost:3002` via `agent-browser`

**Auth flow for testing:**
1. Navigate to http://localhost:3002/login
2. Enter email: `$VALIDATION_ADMIN_EMAIL` (from .env.test)
3. Enter password: `$VALIDATION_ADMIN_PASSWORD` (from .env.test)
4. Enter company code: `$VALIDATION_ADMIN_COMPANY` (from .env.test)
5. Submit → redirects to /hub or /admin

Credentials are stored in `.env.test` (gitignored). Source it before testing: `source .env.test`

**Backend:** Spring Boot on localhost:8081, proxied via Vite. All API calls go through /api/v1/* prefix.

**Required services:**
- Backend must be running on 8081 (check via services.yaml healthcheck)
- Frontend dev server on 3002

## Validation Concurrency

**Surface: agent-browser**
- Machine: 16 CPUs, 15 GB RAM, ~10 GB available
- App is lightweight (~200 MB dev server + ~300 MB per browser instance)
- Max concurrent validators: **5** (5 instances = ~1.7 GB, well within 8.4 GB budget at 70%)

## Testing Notes

- Backend is REAL and responsive — tests should make actual API calls, not mock
- 204 endpoints (suspend, unsuspend, delete, mfa/disable) will be fixed to handle no-body responses
- Audit trail endpoints will be fixed from legacy paths to canonical paths
- Test user creation should use unique emails with timestamps to avoid conflicts
- After creating test users, clean up (delete) them to avoid polluting the user list
- Approvals depend on backend state — may have 0 pending items; test empty state in that case
- Dashboard API (/portal/dashboard) returns only 3 highlights by default — this is a backend data issue, not frontend
- Settings API field names differ from frontend types: API uses periodLockEnforced/autoApprovalEnabled/mailEnabled/mailFromAddress/allowedOrigins, frontend expects periodLockEnabled/autoApproveThreshold/emailNotifications/smtpFromEmail/corsAllowedOrigins
- Changelog API may return empty results — test data may need seeding via superadmin POST /api/v1/superadmin/changelog
- Combobox/Select interaction via agent-browser: native click on option elements may time out; use JS eval to set value programmatically as fallback
- Toast notifications auto-dismiss quickly — verify success indirectly via API response status and form reset behavior

## Flow Validator Guidance: agent-browser

### Isolation Rules
- Each validator uses its own agent-browser session (unique session ID)
- All validators share the same admin credentials and backend
- Read-only page checks (dashboard, roles, changelog, settings) can run concurrently without conflict
- Write operations (send notification) should be isolated — only one validator per group should mutate data
- Validators should NOT delete or modify shared test data created by other validators
- Each validator should navigate independently and not depend on another validator's browser state

### Boundaries
- App URL: http://localhost:3002
- Login credentials: source `.env.test` for email/password/company
- Do NOT access pages outside the admin portal (/admin/*)
- Do NOT test pages from future milestones (api-integration, responsive-final)
- Screenshots saved to evidence directory per group

### Shared State Concerns
- Notification sending (VAL-NOTIF-002) creates a real notification — only the notifications group should do this
- Dashboard data is read-only and shared — safe for concurrent access
- Roles, changelog, settings are read-only admin pages — safe for concurrent access

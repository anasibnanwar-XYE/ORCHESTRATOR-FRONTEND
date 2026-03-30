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

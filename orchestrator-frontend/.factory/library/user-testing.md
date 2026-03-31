# User Testing Documentation - Admin Portal

## Environment

### Services
- Frontend: http://localhost:3002 (Vite dev server)
- Backend: http://localhost:8081 (Spring Boot, Docker-managed - DO NOT STOP)

### Test Credentials (from environment variables)
- Admin: `validation.admin@example.com` / `Validation1!cc18570e52fe48dd` / company `MOCK`
- Superadmin: `validation.superadmin@example.com` / `Validation1!cc18570e52fe48dd` / `SKE`

## Validation Concurrency

Max concurrent validators: **5**

Resource constraints:
- 16 CPUs available
- ~10GB RAM available
- Frontend is lightweight React app
- Backend calls are stateless

## Flow Validator Guidance: agent-browser

### Isolation Rules
- Each flow validator should use a fresh browser session
- Use distinct test user accounts if multiple validators run concurrently to avoid data conflicts
- Users list is global - creating/deleting the same test user simultaneously causes conflicts
- Serialize operations that mutate global state (user create, edit, delete)

### Testing Approach
1. Login with admin credentials via browser
2. Navigate to the feature under test
3. Perform actions and verify network calls/responses
4. Capture screenshots and network logs as evidence

### Known Workarounds
- Dropdown menu items may not click via standard click — use JS eval to find and click by text
- Combobox/Select dropdown may need JS eval to set values
- Network log shows duplicate entries due to React StrictMode — check presence/absence, not exact count

### Test Patterns

#### Creating a Test User
```javascript
// Use unique email to avoid conflicts
const email = `val-e2e-${Date.now()}@test.com`;
const displayName = `Test User ${Date.now()}`;
```

#### Verifying Network Calls
- Look for POST /api/v1/admin/users with status 200/201 for create
- Look for PUT /api/v1/admin/users/{id} with status 200 for update
- Check response body is valid JSON (no 400 errors)

### Evidence Requirements
- Screenshot of success/failure state
- Network log showing relevant API calls
- Console errors (if any)

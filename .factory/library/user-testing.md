# User Testing

Validation surface findings and resource guidance.

**What belongs here:** validation surfaces, test tools, concurrency limits, runtime gotchas, credential-handling rules.
**What does NOT belong here:** raw secrets or one-off screenshots.

---

## Validation Surface

- Primary surface: local frontend at `http://127.0.0.1:3002`
- Backend dependency: `http://100.109.241.47:8081`
- Backend diagnostics: `ssh asus-tuf-tail-ip` -> `http://127.0.0.1:9090/actuator/health/liveness`
- Browser UAT tool: `agent-browser`
- Repo-owned E2E tool to add during the mission: Playwright
- Current dry-run result: login page loads locally, auth requests reach backend, backend liveness is up, readiness is currently down and should be treated as an environment warning.

Credentials:
- Raw validation credentials live only in the mission `AGENTS.md` file.
- Do not commit raw credentials into repo files or tests.
- For automated test execution, pass credentials via inline env vars at runtime.

## Validation Concurrency

- Max concurrent browser validators for the web surface: `4`
- Reasoning: 10 logical CPUs, ~24 GB RAM, and prior dry-run measurements showed the frontend dev server and browser tooling fit comfortably within a 70 percent headroom budget at that concurrency.
- Playwright workflow suites should start conservatively at `1` worker until state isolation and test-data reset are proven.

## Flow Validator Guidance: web

This section provides guidance for browser-based flow validators testing the web UI at `http://127.0.0.1:3002`.

### Isolation Rules
- Each subagent MUST use a unique `agent-browser` session ID derived from the worker session ID.
- Session ID format: `<worker-session-id>__g1`, `<worker-session-id>__g2`, etc.
- Use separate browser sessions for different assertion groups to avoid localStorage/sessionStorage contamination.
- After each test scenario, clear cookies and storage before the next scenario.

### Boundaries
- Do NOT test assertions outside the assigned group.
- Do NOT modify backend data or settings; only test frontend behavior.
- Shared test accounts: see mission `AGENTS.md` for credentials.
- When testing login flows, use company codes exactly as specified (e.g., `SKE`, `MOCK`, `RIVAL`).

### Evidence Capture
- Save screenshots to: `.factory/validation/<milestone>/user-testing/evidence/<group-id>/`
- Capture network requests/responses where the validation contract requires.
- Name evidence files descriptively: `<assertion-id>_<action>_<state>.png`

### Concurrency Constraints
- Max 2 browser subagents can run concurrently to avoid resource exhaustion.
- If a test requires exclusive access to a user account, coordinate with other subagents or run serially.

### Tool Usage
- Invoke the `agent-browser` skill via the Skill tool for full usage documentation.
- Use `--session` flag with your assigned session ID for all browser operations.

### MFA Testing Requirements
- MFA-enabled test accounts require seeded TOTP secrets and recovery codes for testing MFA disable and recovery-code verification flows.
- If no seeded MFA secrets are available, MFA disable assertions (VAL-AUTH-010) will be blocked.
- MFA setup can be tested with non-MFA accounts by triggering setup from profile page.

### Account State Seeding Requirements
The following test states require backend seeding and cannot be triggered from the UI:
- **Lockout state (VAL-AUTH-002)**: Backend lockout threshold unknown; 9+ failed attempts did not trigger lockout. Consider seeding a pre-locked test account.
- **Tenant denial states (VAL-AUTH-003)**: TENANT_ON_HOLD, TENANT_BLOCKED require backend admin action to change tenant state.
- **Must-change-password (VAL-AUTH-014)**: Requires seeded account with mustChangePassword flag set.

### Known Frontend Issues (auth-sensitive-flows)
- **VAL-CROSS-002**: Protected deep link destination is NOT restored after MFA success. Users always land at /hub regardless of original deep link. The pending MFA state stores {email, password, companyCode} but not the intended destination URL.

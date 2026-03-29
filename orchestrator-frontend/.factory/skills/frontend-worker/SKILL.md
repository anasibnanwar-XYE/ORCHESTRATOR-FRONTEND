---
name: frontend-worker
description: Implements frontend features for the ERP multi-portal application
---

# Frontend Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Any frontend implementation feature: page builds, component work, API integration, responsiveness fixes, design system bridging, UX improvements, cleanup, or test writing.

## Required Skills

- `frontend-skill` — Invoke FIRST before any UI implementation. This skill enforces restrained composition, image-led hierarchy, cohesive content structure, and tasteful motion. Use it for all page builds, component work, and UX improvements to ensure production-grade visual quality.
- `agent-browser` — For manual verification of UI changes. Invoke after implementation to verify pages render correctly, flows work end-to-end, responsive behavior is correct, and visual quality meets standards.

## Work Procedure

### 1. Read Context First (MANDATORY)

Before writing ANY code:
- Read `.factory/library/api-mismatches.md` — critical API path/shape issues
- Read `.factory/library/rbac.md` — role boundaries for the portal you're working on
- Read `.factory/library/architecture.md` — code organization and patterns
- Read the feature description carefully — it contains expected behavior and verification steps

### 2. Verify Backend Contracts (Use codebase-scout-assistant)

For ANY API integration work, spawn **parallel `codebase-scout-assistant` subagents** via the Task tool to investigate the backend. Do NOT read backend files yourself — delegate to scouts for speed.

**How to investigate backend:**
- Spawn a `codebase-scout-assistant` with a prompt like: "Read the controller at /home/realnigga/Desktop/Mission-control/erp-domain/src/main/java/com/bigbrightpaints/erp/modules/{module}/controller/{Controller}.java. List all endpoints with HTTP method, path, @PreAuthorize, request/response DTOs."
- Spawn multiple scouts in parallel if you need to check multiple modules
- Also check `/home/realnigga/Desktop/Mission-control/openapi.json` for request/response shapes
- Do NOT trust frontend docs — backend code is the source of truth
- Test the endpoint with curl through the proxy: `curl -s http://localhost:3002/api/v1/...`

**When an API call fails (404, 400, 500, unexpected response):**
1. Immediately spawn parallel codebase-scout-assistants to read the relevant backend controllers
2. The backend has changed significantly — many frontend pages have UI for features that no longer exist
3. If the backend endpoint is gone or changed, fix the frontend to match reality
4. If the entire feature's backend support is gone, return to orchestrator

### 3. Invoke frontend-skill (MANDATORY for UI work)

Before implementing any UI:
- Invoke the `frontend-skill` via the Skill tool
- Follow its guidance for composition, hierarchy, spacing, and visual quality
- Ensure the result feels modern, clean, and human-designed — NOT AI-generated or cluttered

### 4. Write Tests First (TDD)

- Write failing unit tests BEFORE implementation
- Tests go in co-located `__tests__/` directories
- Use Vitest + React Testing Library
- Cover: rendering, user interactions, API call verification, error states, loading states, empty states

### 5. Implement

- Follow existing patterns in the codebase
- Use design system components from `src/components/ui/` — never create one-off UI
- Use CSS variables (`var(--color-*)`) — never hardcode hex colors
- Use DataTable for all tabular data with `mobileCardRenderer` for mobile
- Use responsive Tailwind classes (`sm:`, `md:`, `lg:`)
- Ensure all forms use `grid-cols-1 sm:grid-cols-2` (never fixed grid-cols-2)
- Add proper empty states, loading states, and error states
- Add tooltips for non-obvious actions
- Add helper text for form fields with non-obvious constraints
- Ensure destructive actions require confirmation dialogs
- Background sync: implement stale-while-revalidate where appropriate

### 6. Manual Verification (MANDATORY — Comprehensive)

Use `agent-browser` to verify ALL of the following (not just flows):

**Functional:**
- Page loads without errors (check browser console)
- Data displays correctly from real backend
- Key user flows work end-to-end (CRUD, status transitions, etc.)

**Visual Quality:**
- Consistent use of design system components (Badge, Button, DataTable, etc.)
- No hardcoded hex colors — all colors from CSS variables
- Proper spacing and typography
- Empty states, loading states, error states all present and well-designed
- Tooltips on non-obvious actions
- Confirmation dialogs on destructive actions

**Responsiveness:**
- Desktop (1366px+) renders correctly
- Tablet (768px) adapts layout properly
- Mobile (375px) uses card layouts for tables, single-column forms
- No horizontal overflow at any breakpoint
- Sidebar collapses on mobile

**Consistency:**
- Badge styles match other portals
- Table patterns match other portals
- Modal/drawer behavior matches other portals
- Button hierarchy (primary/secondary/ghost/danger) is correct

Each verification = one `interactiveChecks` entry with full action sequence and outcome.

### 7. Run Validators

```bash
cd /home/realnigga/ORCHESTRATOR-FRONTEND-MISSION/orchestrator-frontend
npx tsc --noEmit          # Must pass clean
bun run test --run        # Must pass
```

### 8. Commit

- Small, logical commits
- Format: `fix(portal): description` or `feat(portal): description`
- Stage only files you changed

## Example Handoff

```json
{
  "salientSummary": "Fixed credit request API paths in salesApi.ts from /sales/credit-requests to /credit/limit-requests, redesigned SalesCreditRequestsPage with frontend-skill for clean visual hierarchy, added mobile card renderer, verified all flows end-to-end with agent-browser at 3 breakpoints.",
  "whatWasImplemented": "Corrected 4 API endpoint paths for credit limit requests (list, create, approve, reject) to match backend /credit/limit-requests. Updated TypeScript types to match backend CreditLimitRequestDto. Redesigned page layout using frontend-skill guidance — clean stat cards, consistent Badge usage, proper empty state. Added responsive mobile card layout. Added toast feedback for approve/reject. Added confirmation dialog for reject action.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {"command": "npx tsc --noEmit", "exitCode": 0, "observation": "No type errors"},
      {"command": "bun run test --run", "exitCode": 0, "observation": "14 tests passed"},
      {"command": "curl -s -X POST http://localhost:3002/api/v1/auth/login -H 'Content-Type: application/json' -d '{...}' | head -c 80", "exitCode": 0, "observation": "Login successful"}
    ],
    "interactiveChecks": [
      {"action": "Navigated to /sales/credit-requests at 1366px with sales user", "observed": "Page loads with DataTable showing credit requests. Stat cards show pending/approved/rejected counts. Badge styles consistent with other portals. No console errors."},
      {"action": "Created new credit request, verified form validation and submission", "observed": "Form requires amount and reason. POST goes to /credit/limit-requests (correct). Success toast shown. Table refreshes."},
      {"action": "Resized to 768px tablet width", "observed": "Layout adapts. Table still readable. Sidebar collapsed to hamburger. No overflow."},
      {"action": "Resized to 375px mobile width", "observed": "DataTable switches to card layout. Each card shows dealer, amount, status badge. Touch targets 44px+. No horizontal scroll."},
      {"action": "Tested empty state by filtering to no results", "observed": "EmptyState component renders with icon, message, and 'Create Request' CTA."},
      {"action": "Tested dark mode toggle", "observed": "All colors switch correctly. No hardcoded hex visible. Badges, cards, table all use CSS variables."}
    ]
  },
  "tests": {
    "added": [
      {"file": "src/pages/sales/__tests__/SalesCreditRequestsPage.test.tsx", "cases": [
        {"name": "renders credit requests table", "verifies": "DataTable renders with correct columns"},
        {"name": "creates new credit request", "verifies": "Form calls /credit/limit-requests POST"},
        {"name": "shows empty state", "verifies": "EmptyState renders when no data"},
        {"name": "responsive mobile layout", "verifies": "Card renderer active at narrow width"}
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Backend endpoint does not exist or returns unexpected shape not in api-mismatches.md
- Feature requires changes to multiple portals simultaneously (scope too broad)
- RBAC boundary unclear — cannot determine which roles should see what
- Backend returns 500 errors consistently (backend bug)
- Feature depends on HR/Payroll module (on hold — do not implement)
- Design system component needed but doesn't exist and is too complex to create inline
- Any backend contract confusion that reading the controller code doesn't resolve

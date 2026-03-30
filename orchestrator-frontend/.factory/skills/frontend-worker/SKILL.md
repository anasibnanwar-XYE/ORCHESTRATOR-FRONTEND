---
name: frontend-worker
description: Implements frontend features for the ERP admin portal — UI polish, API integration, design unification, responsive fixes
---

# Frontend Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Any frontend implementation feature: page polish, component unification, API integration fixes, responsive/dark mode fixes, design system adoption, UX improvements, or test writing.

## Required Skills

- `frontend-skill` — Invoke FIRST before any UI implementation. Provides guidance on visual composition, hierarchy, spacing, and quality. The design bar is set by the existing auth pages (AuthLayout.tsx) — typography-driven, minimal, deliberate.
- `agent-browser` — For manual verification of UI changes. Invoke after implementation to verify pages render correctly, flows work end-to-end, responsive behavior is correct, and visual quality meets standards.

## Work Procedure

### 1. Read Context First (MANDATORY)

Before writing ANY code:
- Read `.factory/library/architecture.md` — code organization and patterns
- Read the feature description carefully — it contains expected behavior and verification steps
- Read `src/components/ui/index.ts` to know what shared components exist
- Check `src/components/ui/` for available components before building anything custom
- **NEVER build custom markup when a shared component exists.** Use StatCard, EmptyState, PageHeader, Badge, DataTable, Drawer, etc.

### 2. Invoke frontend-skill (MANDATORY for UI work)

Before implementing any UI:
- Invoke the `frontend-skill` via the Skill tool
- Follow its guidance for composition, hierarchy, spacing, and visual quality
- Ensure the result feels clean and production-grade

### 3. Write Tests First (TDD)

- Write failing unit tests BEFORE implementation
- Tests go in co-located `__tests__/` directories
- Use Vitest + React Testing Library
- Cover: rendering, user interactions, API call verification, error states, loading states, empty states
- Mock API calls with vitest mocks (vi.mock)

### 4. Implement

- Follow existing patterns in the codebase
- Use shared components from `src/components/ui/` — import from `@/components/ui`
- Use CSS variables (`var(--color-*)`) — NEVER hardcode hex colors or use raw Tailwind color classes
- Use DataTable for all tabular data with `mobileCardRenderer` for mobile
- Use responsive Tailwind classes (`sm:`, `md:`, `lg:`)
- Forms: `grid-cols-1 sm:grid-cols-2` (never fixed grid-cols-2)
- Add proper empty states (EmptyState component), loading states (Skeleton), and error states
- Destructive actions require ConfirmDialog
- 204 endpoints: check HTTP status (response.status === 204 or response.status < 300), NOT response.data.success

### 5. Manual Verification (MANDATORY)

Use `agent-browser` to verify:

**Functional:**
- Page loads without console errors
- Data displays correctly from real backend
- Key user flows work end-to-end

**Visual Quality:**
- Consistent use of design system components
- No hardcoded hex colors
- Proper spacing and typography
- Empty, loading, error states present

**Responsiveness:**
- Desktop (1440px) renders correctly
- Tablet (768px) adapts layout
- Mobile (375px) uses card layouts, single-column forms

**Dark Mode:**
- Toggle to dark mode — all colors switch correctly
- No hardcoded colors visible

Each verification = one `interactiveChecks` entry.

### 6. Run Validators

```bash
cd /home/realnigga/ORCHESTRATOR-FRONTEND-MISSION/orchestrator-frontend
npx tsc --noEmit
bun run test --run
```

Both must pass clean.

### 7. Commit

- Small, logical commits
- Format: `fix(admin): description` or `feat(admin): description`
- Stage only files you changed

## Example Handoff

```json
{
  "salientSummary": "Fixed 204 response handling for deleteUser/suspendUser/unsuspendUser/disableUserMfa in adminApi.ts. All four methods now check response.status instead of response.data.success. Updated UsersPage to handle 204 correctly. Verified full user lifecycle (create→suspend→unsuspend→delete) via agent-browser.",
  "whatWasImplemented": "Updated deleteUser, suspendUser, unsuspendUser, disableUserMfa API functions to handle 204 No Content responses correctly by checking response.status < 300 instead of response.data.success. Updated UsersPage action handlers to work with the new response handling. Added tests for each 204 scenario.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {"command": "npx tsc --noEmit", "exitCode": 0, "observation": "No type errors"},
      {"command": "bun run test --run", "exitCode": 0, "observation": "All tests passed"}
    ],
    "interactiveChecks": [
      {"action": "Navigated to /admin/users, suspended a user via dropdown", "observed": "PATCH /admin/users/{id}/suspend returned 204. Toast 'User suspended' shown. Status badge changed to Suspended."},
      {"action": "Unsuspended the same user", "observed": "PATCH returned 204. Status reverted to Active."},
      {"action": "Deleted a test user", "observed": "DELETE returned 204. User removed from list. No console errors."},
      {"action": "Tested at 375px mobile", "observed": "Cards render, actions dropdown works, no overflow."}
    ]
  },
  "tests": {
    "added": [
      {"file": "src/lib/__tests__/adminApi.test.ts", "cases": [
        {"name": "deleteUser handles 204", "verifies": "No JSON parsing on 204 response"},
        {"name": "suspendUser handles 204", "verifies": "Returns success on 204 status"}
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Backend endpoint does not exist or returns unexpected shape
- Feature requires changes to multiple portals simultaneously
- RBAC boundary unclear
- Backend returns 500 errors consistently (backend bug)
- Feature depends on HR/Payroll module (out of scope)
- Design system component needed but doesn't exist and is too complex to create inline

---
name: frontend-worker
description: Implements Sales and Dealer portal unification features with canonical backend alignment and high-end UX quality
---

# Frontend Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this skill for any feature that changes:
- Sales portal routes, layouts, pages, flows, or API integration
- Dealer portal routes, layouts, pages, flows, or API integration
- Shared shell behavior required by Sales and Dealer
- Playwright/browser validation harness work for this mission
- Final Figma publishing and regression hardening for Sales + Dealer screens

Do not use this skill to expand other portals unless the feature explicitly requires a shared shell change that is necessary for Sales or Dealer.

## Required Skills

- `frontend-design` — Invoke first for every feature that changes UI, layout, spacing, hierarchy, or visual polish. Use it to set the visual direction before coding.
- `ux-engineer` — Invoke before implementing routes, page structure, or interaction-heavy flows. Use it to make navigation, actions, forms, and state handling obvious.
- `agent-browser` — Invoke after implementation for real browser verification at desktop, tablet, and mobile widths.

## Work Procedure

### 1. Read the mission context before changing code

Read these first:
- mission feature description
- mission `AGENTS.md`
- `.factory/library/architecture.md`
- `.factory/library/environment.md`
- `.factory/library/user-testing.md`

Then read the canonical backend/docs files that match the feature's route family, using `/Users/anas/Documents/FACTORY/bigbrightpaints-erp/docs` as source of truth.

Minimum docs by area:
- Shared shell/auth work: `docs/frontend-portals/README.md`, `docs/frontend-api/README.md`, `docs/frontend-api/auth-and-company-scope.md`
- Sales work: `docs/frontend-portals/sales/{README,routes,api-contracts,role-boundaries,states-and-errors,workflows,playwright-journeys}.md`
- Dealer work: `docs/frontend-portals/dealer-client/{README,routes,api-contracts,role-boundaries,states-and-errors,workflows,playwright-journeys}.md`
- Cross-area parity: `docs/flows/order-to-cash.md`, `docs/flows/invoice-dealer-finance.md`

### 2. Reconfirm mission invariants

Before editing, verify that your plan keeps these invariants true:
- Sales + Dealer only; no orchestrator pages
- no icons or emojis anywhere in Sales/Dealer nav, content, empty states, or controls
- use only the existing component library in `src/components/ui`
- `GET /api/v1/auth/me` is the only identity bootstrap
- `X-Company-Code` is the only tenant header to preserve
- Dealer portal remains self-scoped; never add dealer pickers or foreign dealer context
- Sales may read invoice/dispatch only from current-order context; dispatch confirm belongs to Factory; approvals belong to Admin/Accounting
- remove non-canonical routes instead of hiding them behind dead navigation

If the canonical docs and the live remote backend disagree in a way that changes ownership or route scope, return to the orchestrator.

### 3. Invoke design skills before implementation

1. Invoke `frontend-design`
2. Invoke `ux-engineer`

Use the skill output to decide:
- section order
- density and spacing
- table vs card behavior
- empty/loading/error states
- primary/secondary action hierarchy
- how to keep the UI modern and minimal without icons

### 4. Write tests first

Write failing tests before implementation.

Expected testing mix:
- Vitest + React Testing Library for route/page/component behavior
- targeted Playwright updates for auth, shell, or end-to-end portal journeys when the feature changes browser behavior

Test the behavior the contract cares about, not implementation details.

### 5. Implement using current project patterns

Implementation rules:
- reuse existing components from `src/components/ui`
- do not add a second design system
- do not hardcode colors; use CSS variables
- prefer dedicated canonical routes over modal-only substitutes when the contract requires a route
- remove obsolete routes/components/endpoints rather than leaving dead paths behind
- keep all Sales/Dealer writes compatible with the remote backend on `100.109.241.47:8081`
- for real writes, use unique timestamped test data so validation runs do not collide

### 6. Verify against the primary remote backend

Use the primary remote runtime described in `.factory/services.yaml` and `.factory/library/environment.md`.

For any feature that touches API flows:
- ensure the remote backend at `100.109.241.47:8081` is reachable through the configured frontend proxy
- verify real request paths and status codes in the browser
- confirm no retired or non-canonical endpoints are called when the contract forbids them

### 7. Manual browser verification is mandatory

Use `agent-browser` after implementation.

Verify at minimum:
- desktop width (~1366px)
- tablet width (~768px)
- mobile width (~375px)

Check all of the following:
- no icons/emojis/orchestrator branding in the touched Sales/Dealer surface
- no horizontal overflow
- loading / empty / blocked / error states look intentional
- correct route ownership and role boundaries
- real backend reads/writes succeed where the feature requires them
- console stays clean

### 8. Run validators before finishing

Run fast targeted checks during iteration, then the relevant broader checks before handoff.

Typical commands:
```bash
bun run typecheck
bun run lint
bunx vitest run <targeted test files> --reporter=verbose
```

When shell/auth/route contracts change, also run the relevant Playwright journeys with the local validation env loaded and `--workers=1`.

### 9. Figma publish when the feature requires it

If the feature description asks for Figma publishing:
- publish the implemented Sales/Dealer screens to a new Figma draft file using the available Figma tools
- return the created Figma URL or file key in the handoff
- do not treat Figma publish as a substitute for local validation

## Example Handoff

```json
{
  "salientSummary": "Unified the Sales and Dealer shells into the same text-first layout system, removed icon-based nav and non-canonical shell entries, fixed Playwright auth selectors for the current login form, and verified local login plus canonical route access on desktop/tablet/mobile.",
  "whatWasImplemented": "Updated the shared Sales/Dealer shell structure to remove Lucide-based nav rendering, cleaned command palette and drawer entries, aligned auth/bootstrap flows to the local backend on 127.0.0.1:8081, and repaired stale Playwright helpers to use the current login labels and canonical route targets. Removed dealer-profile shell affordances and legacy Sales shell entries for non-canonical routes.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "bun run typecheck",
        "exitCode": 0,
        "observation": "TypeScript passed after route and shell updates."
      },
      {
        "command": "bun run lint",
        "exitCode": 0,
        "observation": "Lint passed with no new warnings."
      },
      {
        "command": "bunx vitest run src/lib/__tests__/portal-routing.test.ts src/pages/auth/__tests__/LoginPage.test.tsx --reporter=verbose",
        "exitCode": 0,
        "observation": "Targeted auth and routing tests passed."
      },
      {
        "command": ". ./.env.validation.local && bunx playwright test tests/e2e/auth-navigation.spec.ts tests/e2e/dealer-sales-mobile.spec.ts --workers=1",
        "exitCode": 0,
        "observation": "Playwright verified login, shell navigation, and mobile drawer behavior against the local backend."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Logged in as Sales, opened /sales/dashboard at 1366px, 768px, and 375px",
        "observed": "Shell stayed text-first with no icons or emojis, active state and spacing remained consistent, and there was no horizontal overflow."
      },
      {
        "action": "Logged in as Dealer and opened /dealer/invoices plus /dealer/support on desktop and mobile",
        "observed": "Dealer shell showed only canonical entries, /dealer/profile affordances were gone, and the mobile drawer closed automatically after route changes."
      },
      {
        "action": "Inspected browser network while loading protected routes",
        "observed": "Bootstrap used GET /api/v1/auth/me and tenant requests used X-Company-Code only; no calls to /api/v1/auth/profile or X-Company-Id were observed."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "tests/e2e/auth-navigation.spec.ts",
        "cases": [
          {
            "name": "sales user lands in canonical sales shell",
            "verifies": "Single-portal Sales login bypasses hub and restores allowed deep links."
          },
          {
            "name": "dealer user cannot reach sales shell",
            "verifies": "Cross-portal isolation stays fail-closed."
          }
        ]
      },
      {
        "file": "src/lib/__tests__/portal-routing.test.ts",
        "cases": [
          {
            "name": "dealer access remains dealer-only",
            "verifies": "Route ownership stays aligned with portal roles."
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

Return to the orchestrator if any of these happens:
- canonical docs and the live backend disagree about route ownership or endpoint family
- the feature needs backend code changes or schema changes
- the remote backend is unavailable or its contract no longer matches the mission-critical flows
- the feature would require modifying other portals beyond a minimal shared shell dependency
- a required canonical endpoint is missing and there is no approved fallback contract
- Figma publishing is required but blocked by auth, plan access, or tool failure

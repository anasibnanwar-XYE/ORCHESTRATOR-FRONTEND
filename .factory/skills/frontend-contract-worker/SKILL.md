---
name: frontend-contract-worker
description: Aligns frontend auth, admin, API wiring, and maintainable contract-bound code with backend docs.
---

# Frontend Contract Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the work procedure.

## When to Use This Skill

Use this skill for features that change auth/session behavior, admin and superadmin flows, API wrappers, route guards, maintainability refactors, docs updates tied to frontend behavior, and any work where backend contract alignment is the main risk.

## Work Procedure

1. Read `mission.md`, mission `AGENTS.md`, and the repo library files `api.md`, `architecture.md`, `environment.md`, `copy-guidelines.md`, and `scope-flags.md` before touching code.
2. Read the backend handoff docs for the exact feature surface. Treat those docs as the source of truth unless the mission artifacts explicitly call out an ambiguity.
3. Write or update failing tests first for the affected wrapper, context, route, or page behavior. Keep tests small and name the contract behavior they protect.
4. Implement the minimal code change that makes the contract pass. Keep generated client boundaries intact. Prefer fixing canonical request/response wiring over adding broad fallback logic.
5. Keep wording simple and consistent. Do not add emojis. Use fewer icons, not more.
6. Manually verify the changed flow with `agent-browser` using the seeded validation accounts from mission `AGENTS.md`. Capture the exact request path, route outcome, and visible UX result. If browser auth requests fail for same-origin or CORS reasons, inspect `vite.config.ts` proxy and `Origin` handling before assuming backend contract drift. If infrastructure still blocks interactive verification after reasonable checks, fall back to the strongest available automated coverage and document the blocker plus fallback evidence explicitly in the handoff.
7. Run the targeted tests you added, then `bun run lint`, `bun run typecheck`, and `bun run test`. Run `bun run build` when the feature changes auth/routing/shell behavior or any shared UI entry point.
8. In the handoff, call out any backend ambiguity, review-only page, or path conflict instead of hiding it in fallback code.

## Example Handoff

```json
{
  "salientSummary": "Aligned logout, refresh-token, and company switching with the backend contract and updated route gating for stale sessions. Verified the login and switch flows in the browser with a seeded admin account.",
  "whatWasImplemented": "Updated the auth API wrapper and shared session handling so refresh requests now send companyCode, logout clears state only after the server revocation call, and company switching rotates tokens before tenant-scoped navigation. Added regression tests for stale-session clearing and company-switch request shape.",
  "whatWasLeftUndone": "", 
  "verification": {
    "commandsRun": [
      {
        "command": "bun run test -- src/lib/__tests__/api.test.ts src/context/__tests__/AuthContext.test.tsx",
        "exitCode": 0,
        "observation": "Targeted auth regression tests passed after the wrapper changes."
      },
      {
        "command": "bun run lint && bun run typecheck && bun run test && bun run build",
        "exitCode": 0,
        "observation": "All required validators passed for the routing and auth change set."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Logged in as validation.admin@example.com, switched from MOCK to another available company, then refreshed the page.",
        "observed": "The switch call rotated tokens first, the header updated to the new company, and the next protected request used the new tenant context without a stale-data flash."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "src/context/__tests__/AuthContext.test.tsx",
        "cases": [
          {
            "name": "refresh sends companyCode and replaces both tokens",
            "verifies": "The session refresh flow stays aligned with the backend contract."
          },
          {
            "name": "invalid stored session clears state and routes to login",
            "verifies": "Stale sessions do not leave the protected shell mounted."
          }
        ]
      }
    ]
  },
  "discoveredIssues": [
    {
      "severity": "medium",
      "description": "The backend runtime-policy docs still disagree on the canonical update path for superadmin runtime changes.",
      "suggestedFix": "Have the orchestrator track the backend ambiguity in ERP Linear and pin the chosen path in shared state before related follow-up work."
    }
  ]
}
```

## When to Return to Orchestrator

- Backend docs conflict on the canonical path or payload and the mission artifacts do not already resolve it.
- The required page is marked review-only in `scope-flags.md`.
- The change would require backend code or a new backend endpoint.
- The seeded account or remote backend state is missing for the flow you must verify.

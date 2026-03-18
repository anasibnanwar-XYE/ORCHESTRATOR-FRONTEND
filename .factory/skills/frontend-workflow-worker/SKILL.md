---
name: frontend-workflow-worker
description: Implements end-to-end business workflow features across sales, purchasing, inventory, and accounting surfaces.
---

# Frontend Workflow Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the work procedure.

## When to Use This Skill

Use this skill for O2C, P2P, inventory, reconciliation, GST, reporting, and other business workflows where the same entity or totals must stay consistent across multiple screens.

## Work Procedure

1. Read `mission.md`, mission `AGENTS.md`, and the repo library files `api.md`, `architecture.md`, `environment.md`, `user-testing.md`, and `scope-flags.md`.
2. Read the backend handoff sections for the exact workflow before changing code. Identify the same business entity or reference that must remain consistent across screens.
3. Write failing tests first for the wrapper, page, or workflow boundary you are changing. Prefer tests that verify the exact entity ids, totals, stock quantities, statuses, or references the user will see.
4. Implement the workflow with maintainable API wiring. Keep the same-reference continuity visible across the named routes. Do not patch over drift with broad fallbacks.
5. Manually verify the workflow end-to-end with `agent-browser`, using the seeded mission accounts and real user routes. Capture the exact ids or references you followed across screens.
6. If you add or update retry-safe create flows, prove that replaying with the same idempotency key does not create duplicates.
7. Run targeted tests first, then `bun run lint`, `bun run typecheck`, and `bun run test`. Run `bun run build` when the change affects shared routes, workflow entry points, or shared UI primitives.
8. In the handoff, list the exact business references you traced and any backend-side ambiguity that blocked a clean frontend implementation.

## Example Handoff

```json
{
  "salientSummary": "Aligned the purchase-order, GRN, and stock update flow so the same raw-material item now stays consistent across accounting and factory surfaces. Verified the workflow manually with browser evidence.",
  "whatWasImplemented": "Updated the purchasing and inventory wrappers and the related accounting and factory pages so GRN creation is idempotent, over-receipt is rejected clearly, and the same stock item updates across both visible stock surfaces after receiving. Added regression tests for duplicate-line rejection and stock refresh continuity.",
  "whatWasLeftUndone": "", 
  "verification": {
    "commandsRun": [
      {
        "command": "bun run test -- src/pages/accounting/__tests__/GoodsReceiptNotesPage.test.tsx src/pages/factory/__tests__/RawMaterialsPage.test.tsx",
        "exitCode": 0,
        "observation": "Targeted workflow tests passed after the GRN and stock updates."
      },
      {
        "command": "bun run lint && bun run typecheck && bun run test",
        "exitCode": 0,
        "observation": "All mandatory validators passed for the workflow change set."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Created a GRN, then opened the corresponding raw-material stock views in Accounting and Factory using the same material reference.",
        "observed": "The same item quantity and batch visibility refreshed in both places after the GRN completed, with no duplicate receive created on retry."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "src/lib/__tests__/purchasingApi.test.ts",
        "cases": [
          {
            "name": "GRN create reuses idempotency key safely",
            "verifies": "Retrying a GRN submission does not create duplicate receiving records."
          }
        ]
      }
    ]
  },
  "discoveredIssues": [
    {
      "severity": "medium",
      "description": "The backend reconciliation docs still do not pin a dedicated frontend GST reconciliation route, so the mission will need a chosen frontend surface during implementation.",
      "suggestedFix": "Have the orchestrator pin the chosen surface in shared state before related workflow features proceed too far."
    }
  ]
}
```

## When to Return to Orchestrator

- The workflow depends on a backend endpoint or surface that does not exist.
- The same business entity cannot be traced across screens because backend contracts conflict.
- The target page is review-only or unsupported by the backend handoff.
- The required seeded account or workflow data cannot be created from the allowed frontend surfaces.

---
name: frontend-design-worker
description: Implements mobile and design-system features with high-quality frontend design and responsive behavior.
---

# Frontend Design Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the work procedure.

## When to Use This Skill

Use this skill for mobile layout work, shared design-system primitives, portal shell updates, responsive overlays, copy/icon cleanup, and any feature where polish and visual consistency are core acceptance criteria.

## Work Procedure

1. Read `mission.md`, mission `AGENTS.md`, and the repo library files `architecture.md`, `copy-guidelines.md`, `scope-flags.md`, and `user-testing.md`.
2. Before designing new UI, invoke the `frontend-design` skill and use it to guide the visual and interaction quality of the implementation.
3. Use the sibling ComponentShowcase only as a reference. Implement changes inside this repo; never edit the sibling repo.
4. Write or update failing tests first for the responsive behavior or UI state you are changing.
5. Implement shared primitives before page-by-page polish. Keep the UI simple, consistent, and maintainable. Do not spam icons. Do not use emojis.
6. Verify the final result with `agent-browser` on phone-sized viewports and capture annotated screenshots for the exact routes named in the feature.
7. Run targeted tests first, then `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` for shared shell or responsive primitives.
8. If a page is review-only or unsupported, return that finding instead of silently redesigning it into scope.

## Example Handoff

```json
{
  "salientSummary": "Introduced the shared mobile shell primitives and rolled them onto the Dealer and Sales shells. Verified the updated routes in a phone viewport with screenshot evidence.",
  "whatWasImplemented": "Added the local mobile shell and overlay primitives, simplified page copy and icon usage, updated Dealer and Sales shells to use the shared mobile navigation pattern, and refactored the order drawer so line items and footer actions stay reachable on phone-sized viewports.",
  "whatWasLeftUndone": "", 
  "verification": {
    "commandsRun": [
      {
        "command": "bun run test -- src/components/ui/__tests__/DataTable.test.tsx src/pages/sales/__tests__/SalesOrdersPage.test.tsx",
        "exitCode": 0,
        "observation": "Targeted responsive and page tests passed after the layout updates."
      },
      {
        "command": "bun run lint && bun run typecheck && bun run test && bun run build",
        "exitCode": 0,
        "observation": "All validators passed for the shared design-system changes."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Opened Dealer and Sales routes at a phone viewport and exercised the drawer, filters, and create-order flow.",
        "observed": "The mobile shell opened and closed cleanly, no header controls overflowed, and the create-order drawer remained fully usable with reachable footer actions."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "src/pages/sales/__tests__/SalesOrdersPage.test.tsx",
        "cases": [
          {
            "name": "mobile header actions remain visible",
            "verifies": "Phone layouts do not push primary actions off-screen."
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- The design reference is unclear or conflicts with the mission copy/icon rules.
- The target page is marked review-only.
- The required mobile behavior depends on a backend capability that is missing or ambiguous.

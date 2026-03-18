---
name: frontend-e2e-worker
description: Builds and validates repo-owned Playwright coverage and browser-based UAT flows for real user workflows.
---

# Frontend E2E Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the work procedure.

## When to Use This Skill

Use this skill for Playwright setup, reusable auth fixtures, E2E workflow coverage, and browser-based UAT harness work.

## Work Procedure

1. Read `mission.md`, mission `AGENTS.md`, and the repo library files `user-testing.md`, `environment.md`, `api.md`, and `scope-flags.md`.
2. Never commit raw credentials. Use env vars or inline runtime values from mission `AGENTS.md` when executing Playwright or browser flows.
3. Write failing Playwright tests first for the named user flow. Keep the tests user-like and route-driven, not implementation-coupled.
4. Add or update the smallest shared test helpers needed to keep the suite maintainable. Avoid hardcoded sleeps when a stable wait or explicit assertion exists.
5. Use `agent-browser` to dry-run the same flow manually and capture annotated screenshots for the UAT evidence path.
6. Keep Playwright workers conservative until state isolation is proven. Default to serial or one-worker runs for stateful accounting workflows.
7. Run the targeted Playwright spec, then the relevant app validators: `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` when the new test harness changes shared app or route behavior.
8. If a failure looks backend-side or the flow is blocked by backend state, return precise evidence to the orchestrator instead of hiding it in test retries.

## Example Handoff

```json
{
  "salientSummary": "Added the initial Playwright auth and navigation harness plus a browser-backed UAT flow for seeded validation users. Verified the same login and shell behavior manually and in Playwright.",
  "whatWasImplemented": "Set up Playwright config and reusable auth helpers, added serial auth-navigation smoke coverage, and created a matching agent-browser UAT recipe with screenshots for the seeded admin and superadmin flows. The tests read credentials from runtime env vars instead of hardcoded values.",
  "whatWasLeftUndone": "", 
  "verification": {
    "commandsRun": [
      {
        "command": "VALIDATION_SUPERADMIN_EMAIL=... VALIDATION_SHARED_PASSWORD=... bunx playwright test tests/e2e/auth-navigation.spec.ts --workers=1",
        "exitCode": 0,
        "observation": "The serial Playwright auth harness passed with runtime-provided credentials."
      },
      {
        "command": "bun run lint && bun run typecheck && bun run test && bun run build",
        "exitCode": 0,
        "observation": "The app and test validators stayed green after adding the harness."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Ran the matching login and navigation flow in agent-browser using the same validation user.",
        "observed": "The browser UAT matched the Playwright path and produced screenshot evidence for the same route transitions."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "tests/e2e/auth-navigation.spec.ts",
        "cases": [
          {
            "name": "superadmin lands on /superadmin from a clean login",
            "verifies": "Role-resolved entry point behavior stays stable in repo-owned E2E coverage."
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- The required validation credentials are unavailable at runtime.
- The backend state makes the flow non-deterministic and the mission artifacts do not yet provide a stable setup path.
- The failing behavior appears backend-side or depends on a backend contract ambiguity.

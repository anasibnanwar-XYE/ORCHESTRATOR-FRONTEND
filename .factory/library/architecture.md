# Architecture

Architectural decisions, patterns, and boundaries for this mission.

**What belongs here:** stable frontend structure, API-wiring rules, route-model rules, maintainability guidance.
**What does NOT belong here:** secrets, temporary debugging notes, or raw validation evidence.

---

- Backend handoff docs are the source of truth for supported frontend behavior.
- Keep generated OpenAPI client code under `src/lib/client` generated; prefer adapting app-facing wrappers in `src/lib` and page/context code instead of hand-editing generated artifacts.
- Prefer canonical backend paths and contract-aligned request shapes. Do not add broad fallback branches that hide drift.
- Keep auth/session logic centralized in shared wrappers or context instead of duplicating request handling across pages.
- When a workflow spans multiple screens, preserve the same business entity identifiers, totals, and visible status across those screens.
- Design-system work must be implemented in this repo only. Use the sibling ComponentShowcase as a reference, not an edit target.
- Keep the codebase maintainable: small helpers, clear API boundaries, minimal branching, and no "just-in-case" fallback sprawl.

## Mobile Design-System Patterns

Mobile overlays (BottomSheet, ActionSheet) use a **dual-render pattern**: both desktop modal and mobile sheet variants are rendered simultaneously, hidden via CSS (`hidden sm:flex` for desktop, `sm:hidden` for mobile). This allows smoother responsive transitions vs conditional rendering based on viewport.

All mobile components that need to account for iOS safe areas must use `env(safe-area-inset-bottom)` for bottom padding/positioning. See: BottomSheet, BottomNav, FAB, MobileAppShell.

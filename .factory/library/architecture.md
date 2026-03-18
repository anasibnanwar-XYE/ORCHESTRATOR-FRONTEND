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

### Dropdown Positioning in Scroll Containers

Dropdowns inside `overflow-y-auto` containers (like drawers) get clipped. Use fixed positioning with `getBoundingClientRect()` to escape the clipping context:

```tsx
const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

// Compute fixed position on trigger click
const handleTriggerClick = () => {
  const rect = triggerRef.current?.getBoundingClientRect();
  if (rect) setDropdownRect(rect);
};

// Dropdown renders at fixed position
{dropdownRect && (
  <div style={{ position: 'fixed', top: dropdownRect.bottom, left: dropdownRect.left, width: dropdownRect.width }}>
    {/* dropdown content */}
  </div>
)}
```

Add scroll/resize listeners to reposition when the viewport changes.

### Filter Persistence via URL Search Params

For list pages where back-navigation must restore filter state, sync filters to URL search params instead of local state:

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const searchQuery = searchParams.get('q') ?? '';
const setSearchQuery = (q: string) => setSearchParams(prev => { prev.set('q', q); return prev; }, { replace: true });
```

This ensures navigating away and back preserves context.

### Nested Interactive Elements

HTML doesn't allow `<button>` inside `<button>`. Use `<span role="button">` with keyboard handlers:

```tsx
<span
  role="button"
  tabIndex={0}
  onClick={(e) => { e.stopPropagation(); handleClear(); }}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleClear(); } }}
  className="cursor-pointer"
>
  Clear
</span>
```

Note: Add `focus-visible:ring-2` to `[role="button"]:focus-visible` in global CSS for consistent focus indication.

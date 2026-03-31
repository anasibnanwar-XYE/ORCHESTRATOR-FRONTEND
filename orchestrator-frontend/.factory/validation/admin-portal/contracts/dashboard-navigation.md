# Validation Contract — Admin Dashboard & Navigation

> Area: Admin Portal — Dashboard (`/admin`) and shell navigation  
> Frontend: `http://localhost:3002`  
> Backend: `http://localhost:8081`  
> Credentials: `validation.admin@example.com` / `Validation1!cc18570e52fe48dd` / `MOCK`

---

## Dashboard

### VAL-DASH-001: Dashboard loads with real data from /portal/dashboard
After login, navigate to `/admin`. The page must issue `GET /api/v1/portal/dashboard` (visible in the Network tab). Four stat highlight cards must render inside a `.grid` container. Each card must display a non-empty `label` (uppercase, 10px), a `value` (2xl font-semibold), and optionally a `detail` line. None of these fields may show "undefined", "null", "NaN", or remain as skeleton placeholders after 5 seconds. **Pass** if all four cards show populated text from the API response. **Fail** if any card shows placeholder/undefined values or if the network request errors and no retry succeeds.
Tool: agent-browser
Evidence: screenshot, network(GET /api/v1/portal/dashboard → 200), console-errors

### VAL-DASH-002: Stat cards render exactly 4 highlight metrics
The dashboard must render exactly 4 stat cards in a `grid-cols-2 lg:grid-cols-4` grid. Each card must contain a decorative sparkline SVG, a label, and a value. Count the cards via DOM query `div.grid > div` within the stat section. **Pass** if count equals 4 and each contains visible text. **Fail** if count differs or any card is empty.
Tool: agent-browser
Evidence: screenshot

### VAL-DASH-003: Dashboard displays correct greeting and date
The page header must show a time-of-day greeting ("Good morning", "Good afternoon", or "Good evening") matching the current hour, plus the current date in "weekday, day month year" format (e.g. "Sunday, 30 March 2026"). The subtitle must read "Platform overview and operational status." **Pass** if greeting matches time-of-day and date is today's date. **Fail** if greeting is wrong, date is missing, or subtitle is absent.
Tool: agent-browser
Evidence: screenshot

### VAL-DASH-004: Quick access cards are present with correct labels
Below the stat cards, a "Quick access" section must render exactly 6 navigation cards: Users, Roles, Approvals, Audit Trail, Changelog, Settings. Each card must show its label and a description line. **Pass** if all 6 cards are present with the exact labels listed. **Fail** if any card is missing, duplicated, or has wrong text.
Tool: agent-browser
Evidence: screenshot

### VAL-DASH-005: Quick access cards navigate to correct pages
Click each quick-access card and verify it navigates to the correct URL:
- "Users" → `/admin/users`
- "Roles" → `/admin/roles`
- "Approvals" → `/admin/approvals`
- "Audit Trail" → `/admin/audit-trail`
- "Changelog" → `/admin/changelog`
- "Settings" → `/admin/settings`
After each click, verify the browser URL matches the expected path and the page title/heading reflects the destination. Navigate back to `/admin` before testing the next card. **Pass** if all 6 navigations land on the correct URL. **Fail** if any card navigates to the wrong page or triggers an error.
Tool: agent-browser
Evidence: screenshot (per navigation), network

### VAL-DASH-006: Dashboard error state shows retry button
Simulate a dashboard API failure (e.g., by temporarily blocking the network request or testing with an invalid token). The dashboard must show an error banner with the text "Failed to load dashboard data." and a "Retry" button with a refresh icon. Clicking "Retry" must re-issue `GET /api/v1/portal/dashboard`. **Pass** if error state renders correctly and retry re-fetches. **Fail** if error state is missing or retry does nothing.
Tool: agent-browser
Evidence: screenshot, network(GET /api/v1/portal/dashboard)

### VAL-DASH-007: No console errors on dashboard load
Navigate to `/admin` with the browser console open. After the page fully loads (stat cards rendered, no spinners), check the console for errors. **Pass** if zero `console.error` entries appear (excluding known benign warnings). **Fail** if any `console.error` is logged during or after load.
Tool: agent-browser
Evidence: console-errors, screenshot

### VAL-DASH-008: Dashboard responsive layout — mobile (375px)
Set viewport to 375×812 (iPhone SE). Navigate to `/admin`. The stat cards must reflow to a 2-column grid (`grid-cols-2`). Quick-access cards must stack to a single column. The sidebar must NOT be visible (it should be hidden at `< lg` breakpoint). A hamburger menu icon must appear in the top bar. **Pass** if layout adapts as described. **Fail** if content overflows, sidebar is visible, or hamburger is missing.
Tool: agent-browser
Evidence: screenshot

### VAL-DASH-009: Dashboard responsive layout — tablet (768px)
Set viewport to 768×1024 (iPad). Navigate to `/admin`. The stat cards must display in a 2-column grid. Quick-access cards must display in a 2-column grid. The sidebar must be hidden (below `lg` breakpoint of 1024px) and hamburger must appear. **Pass** if layout is correct. **Fail** if sidebar is visible or layout breaks.
Tool: agent-browser
Evidence: screenshot

### VAL-DASH-010: Dashboard responsive layout — desktop (1440px)
Set viewport to 1440×900. Navigate to `/admin`. The stat cards must display in a 4-column grid (`lg:grid-cols-4`). The sidebar must be visible on the left side. Quick-access cards display in a 2-column grid. Content area must be bounded by `max-w-[1600px]`. **Pass** if layout renders as described with sidebar visible. **Fail** if sidebar is hidden or grid doesn't use 4 columns.
Tool: agent-browser
Evidence: screenshot

---

## Sidebar Navigation

### VAL-NAV-001: Sidebar displays all navigation groups and items
On desktop (≥1024px), the sidebar must display the following groups and items in order:
- *(no label)* → Dashboard
- **Management** → Users, Roles
- **Workflows** → Approvals, Notifications, Changelog
- **Analytics** → Audit Trail
- **Finance** → Dealer Finance
- **Support** → Tickets
- **System** → Settings
Each item must have an icon and a label. Group labels must appear as uppercase section headers. **Pass** if all groups and items are present in order. **Fail** if any group, item, or label is missing or misordered.
Tool: agent-browser
Evidence: screenshot

### VAL-NAV-002: Sidebar — every link navigates to the correct page
Click each sidebar item and verify the URL:
- Dashboard → `/admin` (exact)
- Users → `/admin/users`
- Roles → `/admin/roles`
- Approvals → `/admin/approvals`
- Notifications → `/admin/notifications`
- Changelog → `/admin/changelog`
- Audit Trail → `/admin/audit-trail`
- Dealer Finance → `/admin/finance`
- Tickets → `/admin/support`
- Settings → `/admin/settings`
After each click, confirm the URL matches and the main content area updates to show the target page (not an error or blank page). **Pass** if all 10 links navigate correctly. **Fail** if any link goes to the wrong URL or renders an error.
Tool: agent-browser
Evidence: screenshot (per page), network

### VAL-NAV-003: Active sidebar item is visually highlighted
Navigate to `/admin/users`. The "Users" sidebar item must have the `on` CSS class applied, rendering with a dark background (`--color-neutral-900` / white text in light mode, or `rgba(255,255,255,0.1)` in dark mode). All other items must NOT have the `on` class. Navigate to `/admin/audit-trail` and verify "Audit Trail" becomes the active item. **Pass** if exactly one item is highlighted matching the current route. **Fail** if no item or multiple items are highlighted.
Tool: agent-browser
Evidence: screenshot

### VAL-NAV-004: Sidebar collapse works on desktop
On desktop (≥1024px) with the sidebar expanded (220px wide), click the collapse toggle button (PanelLeftClose icon in sidebar header). The sidebar must animate to 52px width. Item labels, group labels, and the sign-out label must become invisible (`opacity: 0; width: 0`). Only icons remain visible, centered in the 52px column. The collapse state must persist in `localStorage` under key `orchestrator-admin-sidebar-collapsed` with value `"true"`. **Pass** if sidebar collapses to 52px and persists. **Fail** if sidebar width doesn't change or state isn't saved.
Tool: agent-browser
Evidence: screenshot (before/after), console(localStorage)

### VAL-NAV-005: Sidebar expand restores full width on desktop
With the sidebar collapsed (52px), click the expand toggle button (PanelLeft icon). The sidebar must animate back to 220px width. All labels, group headers, and the sign-out text must become visible again. `localStorage` key `orchestrator-admin-sidebar-collapsed` must update to `"false"`. **Pass** if sidebar expands and labels are visible. **Fail** if labels remain hidden or width is wrong.
Tool: agent-browser
Evidence: screenshot (before/after), console(localStorage)

### VAL-NAV-006: Collapsed sidebar shows tooltips on hover
With the sidebar collapsed to 52px, hover over each navigation item. A tooltip must appear (via CSS `::after` pseudo-element with `data-tip` attribute) showing the item label text. The tooltip must appear at `left: 60px` with a dark background. **Pass** if tooltips render for each item on hover. **Fail** if no tooltip appears or tooltip text is wrong.
Tool: agent-browser
Evidence: screenshot (showing tooltip)

### VAL-NAV-007: Mobile sidebar drawer opens on hamburger click
Set viewport to 375×812. The sidebar must be hidden. A hamburger menu button (Menu icon) must be visible in the top bar with `aria-label="Open menu"`. Click the hamburger. A sidebar drawer must slide in from the left (width: `min(260px, 82vw)`) with a semi-transparent backdrop overlay. The drawer must contain the full navigation with all groups and items (not collapsed). **Pass** if drawer opens with all nav items. **Fail** if drawer doesn't open or nav items are missing.
Tool: agent-browser
Evidence: screenshot (before/after)

### VAL-NAV-008: Mobile sidebar drawer closes on backdrop click
With the mobile drawer open, click the backdrop overlay (outside the drawer panel). The drawer must close and the backdrop must disappear. The main content must be fully visible again. **Pass** if drawer closes on backdrop click. **Fail** if drawer remains open.
Tool: agent-browser
Evidence: screenshot (after close)

### VAL-NAV-009: Mobile sidebar drawer closes on navigation
With the mobile drawer open, click any navigation item (e.g., "Users"). The drawer must close automatically (via `onNavClick` callback) and the page must navigate to the target URL. **Pass** if drawer closes and page navigates. **Fail** if drawer stays open after click.
Tool: agent-browser
Evidence: screenshot

---

## Breadcrumbs

### VAL-NAV-010: Breadcrumbs show portal root on dashboard
Navigate to `/admin`. The breadcrumb bar in the top header must show a single item: "Admin" (non-clickable, as it's the current page). No chevron separator should appear. **Pass** if breadcrumb shows exactly "Admin". **Fail** if breadcrumb is missing, empty, or shows multiple items on the dashboard.
Tool: agent-browser
Evidence: screenshot

### VAL-NAV-011: Breadcrumbs update when navigating to a sub-page
Navigate to `/admin/users`. The breadcrumbs must show: "Admin" (clickable) → "Users" (non-clickable, current). A chevron separator (ChevronRight icon) must appear between them. Click the "Admin" breadcrumb — it must navigate back to `/admin`. **Pass** if breadcrumbs render correctly and root crumb navigates home. **Fail** if breadcrumbs don't update or navigation fails.
Tool: agent-browser
Evidence: screenshot

### VAL-NAV-012: Breadcrumbs update for each sidebar destination
Navigate sequentially to each admin route and verify breadcrumbs:
- `/admin/users` → Admin > Users
- `/admin/roles` → Admin > Roles
- `/admin/approvals` → Admin > Approvals
- `/admin/notifications` → Admin > Notifications
- `/admin/changelog` → Admin > Changelog
- `/admin/audit-trail` → Admin > Audit Trail
- `/admin/finance` → Admin > Dealer Finance
- `/admin/support` → Admin > Support Tickets
- `/admin/settings` → Admin > Settings
**Pass** if every route shows the correct breadcrumb trail. **Fail** if any route shows wrong or missing breadcrumbs.
Tool: agent-browser
Evidence: screenshot (per page)

---

## Theme Toggle

### VAL-NAV-013: Theme toggle switches from light to dark mode
Navigate to `/admin`. Start in light mode (ensure `localStorage` key `o-theme` is `"light"` or cleared). Click the theme toggle button in the top bar (Moon icon). The `<html>` element must gain the `dark` class. The sidebar, top bar, stat cards, and content area must adopt dark mode colors. The toggle icon must switch from Moon to Sun. **Pass** if dark class is applied and visual theme changes. **Fail** if theme doesn't switch or icon doesn't change.
Tool: agent-browser
Evidence: screenshot (before/after), console(document.documentElement.classList)

### VAL-NAV-014: Theme toggle switches from dark to light mode
In dark mode, click the theme toggle (Sun icon). The `dark` class must be removed from `<html>`. The page must revert to light mode colors. The toggle icon must switch back to Moon. **Pass** if light mode restores correctly. **Fail** if dark class persists or visual theme doesn't revert.
Tool: agent-browser
Evidence: screenshot (before/after)

### VAL-NAV-015: Theme preference persists across page reload
Set theme to dark mode via the toggle. Verify `localStorage.getItem('o-theme')` returns `"dark"`. Reload the page (hard refresh). After reload, the page must render in dark mode with `dark` class on `<html>` and the Sun icon on the toggle. **Pass** if theme persists after reload. **Fail** if theme resets to light or localStorage value is lost.
Tool: agent-browser
Evidence: console(localStorage), screenshot (after reload)

---

## Profile Menu

### VAL-NAV-016: Profile menu opens and shows user info
Click the profile trigger button in the top bar (shows avatar + display name). A dropdown menu must appear with:
- User's display name (13px, font-medium)
- User's email address (11px, tertiary)
- User's role in uppercase (10px, tracking-wider)
- A "Profile" menu item
- A "Sign out" menu item (styled with error color)
**Pass** if dropdown renders with correct user information. **Fail** if dropdown doesn't open or info is missing/wrong.
Tool: agent-browser
Evidence: screenshot

### VAL-NAV-017: Profile menu — Profile link navigates to /profile
With the profile dropdown open, click "Profile". The page must navigate to `/profile`. The dropdown must close. **Pass** if navigation occurs to `/profile`. **Fail** if navigation doesn't happen or dropdown stays open.
Tool: agent-browser
Evidence: screenshot, network

### VAL-NAV-018: Profile menu closes on outside click
Open the profile dropdown. Click anywhere outside the dropdown (e.g., the main content area). The dropdown must close. **Pass** if dropdown dismisses on outside click. **Fail** if dropdown remains open.
Tool: agent-browser
Evidence: screenshot

---

## Company Switcher

### VAL-NAV-019: Company badge shows current company code
On desktop (≥640px, where company switcher is visible via `hidden sm:block`), the top bar must display a company switcher button showing a Building2 icon, the current company code (monospace font), and a ChevronDown icon. The company code must not be empty or "Company" (which is the fallback when no code is set). **Pass** if company code displays correctly from the session. **Fail** if code is empty, missing, or shows fallback.
Tool: agent-browser
Evidence: screenshot

### VAL-NAV-020: Company switcher dropdown opens and lists companies
Click the company switcher button. A dropdown must appear with a search input ("Search companies...") and a list of companies fetched from `GET /api/v1/companies`. Each company must show a code badge, company name, and company code. The current active company must have a checkmark icon. **Pass** if dropdown opens with company list from the API. **Fail** if dropdown doesn't open or list is empty when companies exist.
Tool: agent-browser
Evidence: screenshot, network(GET /api/v1/companies → 200)

### VAL-NAV-021: Company switcher closes on Escape key
Open the company switcher dropdown. Press the Escape key. The dropdown must close immediately. **Pass** if dropdown dismisses on Escape. **Fail** if dropdown remains open.
Tool: agent-browser
Evidence: screenshot

---

## Command Palette

### VAL-NAV-022: Command palette opens via Ctrl+K
On the admin dashboard, press `Ctrl+K` (or `Cmd+K` on macOS). A modal dialog must appear centered in the viewport with a search input ("Search pages, actions..."), auto-focused. The modal must have a semi-transparent backdrop. Navigation items and "Quick Actions" (Profile, theme toggle, Sign out) must be listed. **Pass** if palette opens with search focused and items listed. **Fail** if palette doesn't open or search isn't focused.
Tool: agent-browser
Evidence: screenshot

### VAL-NAV-023: Command palette closes on Escape
With the command palette open, press Escape. The palette must close and the backdrop must disappear. **Pass** if palette closes on Escape. **Fail** if palette remains open.
Tool: agent-browser
Evidence: screenshot

### VAL-NAV-024: Command palette closes on backdrop click
With the command palette open, click the backdrop (outside the palette panel). The palette must close. **Pass** if palette dismisses on backdrop click. **Fail** if palette remains open.
Tool: agent-browser
Evidence: screenshot

### VAL-NAV-025: Command palette search filters results
Open the command palette and type "user" into the search input. The results must filter to show only items matching "user" (e.g., "Users" under Admin navigation). Items that don't match must be hidden. Clear the search — all items must reappear. **Pass** if filtering works correctly. **Fail** if results don't filter or all items remain visible during search.
Tool: agent-browser
Evidence: screenshot (filtered and unfiltered)

### VAL-NAV-026: Command palette keyboard navigation works
Open the command palette. Press ArrowDown to move selection highlight to the next item. Press ArrowUp to move selection back. The selected item must show a highlighted background (`bg-[var(--color-surface-tertiary)]`). Press Enter on a selected navigation item — the page must navigate to that item's path and the palette must close. **Pass** if arrow keys move selection and Enter navigates. **Fail** if keyboard navigation doesn't work.
Tool: agent-browser
Evidence: screenshot

---

## Sign Out

### VAL-NAV-027: Sidebar sign-out button logs out the user
Click the "Sign out" button at the bottom of the sidebar. The user must be logged out and redirected to `/login`. The session must be cleared (no auth token in localStorage/cookies). **Pass** if sign-out redirects to login and clears session. **Fail** if user remains authenticated or redirect doesn't happen.
Tool: agent-browser
Evidence: screenshot (after sign-out), network

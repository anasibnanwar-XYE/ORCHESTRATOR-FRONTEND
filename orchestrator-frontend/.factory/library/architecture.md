# Architecture Library -- Sales and Dealer Portal Mission

## 1. What Belongs Here

This document is the worker-facing architectural reference for the Sales and Dealer portal redesign/unification mission. It covers the structural invariants, route ownership, data flows, and current drift risks that any worker touching these two portals must understand. Other portals (Admin, Accounting, Factory, Superadmin) are explicitly out of scope and workers should not modify their routes, layouts, or API wrappers unless a cross-cutting shell change is required and explicitly scoped.

Canonical backend documentation lives at `/Users/anas/Documents/FACTORY/bigbrightpaints-erp/docs`. The endpoint-inventory, frontend-portals tree, and frontend-api tree are the source of truth for API contracts. This library file summarizes what workers need at a glance but defers to those canonical sources for exact payload shapes and status codes.

---

## 2. System Overview

The frontend is a single React SPA (React 18, React Router 6, Vite 5) serving all portals through a unified shell. Each portal is a lazy-loaded layout component with its own sidebar, nav items, and nested routes. All API communication flows through a shared Axios instance (`src/lib/api.ts`) with automatic token refresh, company-header injection, and idempotency-key support.

Runtime topology:

```
Browser / Electron  -->  Vite dev server (:3002)  --proxy /api-->  Backend (:8081)  -->  PostgreSQL
```

Local backend runtime: `127.0.0.1:8081` via Colima-backed Docker.

The app is organized as a multi-portal shell where a user's role determines which portal(s) they see. The hub page (`/hub`) is the multi-portal picker for users with more than one portal assignment (e.g., ROLE_ADMIN inherits admin + accounting + sales + factory). Single-portal users (ROLE_SALES, ROLE_DEALER) bypass the hub and land directly in their portal.

---

## 3. Portal Ownership and Route Families

### 3.1 Sales Portal

**Route prefix:** `/sales/*`
**Layout:** `src/layouts/SalesLayout.tsx`
**Pages directory:** `src/pages/sales/`
**API wrapper:** `src/lib/salesApi.ts`
**Role:** `ROLE_SALES` (also accessible to `ROLE_ADMIN` via hub)

Current route family (defined in `src/App.tsx`):

| UI Route | Page Component | Purpose |
|---|---|---|
| `/sales` | SalesDashboardPage | Sales summary and metrics |
| `/sales/orders` | SalesOrdersPage | Order list and queue management |
| `/sales/orders/:id` | OrderDetailPage | Order detail with pricing and reservation |
| `/sales/dealers` | DealersPage | Dealer master list and management |
| `/sales/credit-requests` | CreditRequestsPage | Credit limit request workflows |
| `/sales/credit-overrides` | CreditOverridesPage | Credit override request workflows |
| `/sales/promotions` | PromotionsPage | Promotion management |
| `/sales/targets` | SalesTargetsPage | Sales target tracking |
| `/sales/dispatch` | DispatchPage | Dispatch queue visibility (read-only) |
| `/sales/invoices` | SalesInvoicesPage | Order-linked invoice follow-up |
| `/sales/returns` | SalesReturnsPage | Sales return workflows |
| `/sales/*` (fallback) | SalesDashboardPage | Catch-all redirects to dashboard |

**Backend prefix ownership:** `/api/v1/sales/**`, `/api/v1/dealers/**`, `/api/v1/credit/**`, read-only dispatch (`GET /api/v1/dispatch/order/{orderId}`), order-linked invoice reads (`GET /api/v1/invoices/{id}` only when linked to current order).

**Current nav items** (from `SalesLayout` today; several are non-canonical and will be removed by this mission):

1. Dashboard
2. Dealers
3. Orders
4. Credit Requests
5. Credit Overrides
6. Promotions
7. Invoices
8. Sales Targets
9. Dispatch
10. Returns

### 3.2 Dealer Portal

**Route prefix:** `/dealer/*`
**Layout:** `src/layouts/DealerLayout.tsx`
**Pages directory:** `src/pages/dealer/`
**API wrapper:** `src/lib/dealerApi.ts`
**Role:** `ROLE_DEALER` only -- dealers never see the hub

Current route family (defined in `src/App.tsx`):

| UI Route | Page Component | Purpose |
|---|---|---|
| `/dealer` | DealerDashboardPage | Dealer self-service summary |
| `/dealer/orders` | DealerOrdersPage | Dealer's own order list |
| `/dealer/invoices` | DealerInvoicesPage | Dealer's own invoices |
| `/dealer/ledger` | DealerLedgerPage | Running balance ledger |
| `/dealer/aging` | DealerAgingPage | Aging buckets and overdue |
| `/dealer/credit-requests` | DealerCreditRequestsPage | Self-service credit requests |
| `/dealer/support` | DealerSupportTicketsPage | Support ticket list and creation |
| `/dealer/profile` | DealerProfilePage | Dealer profile view |
| `/dealer/*` (fallback) | DealerDashboardPage | Catch-all redirects to dashboard |

**Backend prefix ownership:** `/api/v1/dealer-portal/**` exclusively. The dealer portal is auto-scoped by the backend from the JWT -- no dealer ID parameter is needed in any request.

**Current nav items** (from `DealerLayout` today; `Profile` is non-canonical and will be removed by this mission):

1. Dashboard
2. My Orders
3. Invoices
4. Ledger
5. Aging
6. Credit Requests
7. Support
8. Profile

### 3.3 What Is Explicitly Out of Scope for This Mission

- Admin portal (`/admin/*`) -- user management, roles, approvals, audit trail
- Accounting portal (`/accounting/*`) -- journals, reconciliation, periods, settlements
- Factory portal (`/factory/*`) -- production, packing, dispatch confirmation
- Superadmin portal (`/superadmin/*`) -- tenant onboarding, platform governance
- Orchestrator dashboard pages (`/api/v1/orchestrator/**`) -- not part of any portal redesign
- Shared shell components that are not touched by Sales/Dealer changes

---

## 4. Auth/Bootstrap and Tenant-Scope Invariants

### 4.1 Session Lifecycle

1. **Login:** `POST /api/v1/auth/login` with `{ email, password, companyCode }`. Returns `{ accessToken, refreshToken, user, companyCode, mustChangePassword, requiresMfa }`.
2. **MFA (if required):** Re-submits login endpoint with `mfaCode` or `recoveryCode`. MFA pending state stored in sessionStorage under key `bbp-orchestrator-mfa-pending`.
3. **Session hydration:** `GET /api/v1/auth/me` is the canonical identity bootstrap. The AuthContext validates stored tokens on mount by calling this endpoint.
4. **Token refresh:** Deduplicated singleton promise on 401. Calls `POST /api/v1/auth/refresh-token` with `{ refreshToken, companyCode }`.
5. **Keepalive:** 4-minute interval hitting `GET /api/v1/auth/me` with `keepalive: true`.

### 4.2 Tenant Scope

- Tenant identity is persisted as `companyCode` (string) in localStorage under `bbp-orchestrator-company-code`.
- **Canonical tenant header:** `X-Company-Code` (string). This is the only tenant header workers should send or rely on.
- **Active drift -- `X-Company-Id`:** The current request interceptor in `src/lib/api.ts` still injects `X-Company-Id`. This header is **not** part of the canonical architecture and must be removed during this mission. Workers must not introduce new code that reads or sends `X-Company-Id`. Existing interceptor logic that adds it should be cleaned up.
- Numeric tenant IDs are only valid as superadmin route params (e.g., `/api/v1/superadmin/tenants/{tenantId}`).
- Dealers are auto-scoped by the backend from JWT claims. The dealer portal never sends dealer IDs.

### 4.3 Role Resolution

Role-to-portal mapping (from `src/lib/portal-routing.ts`):

| Role | Portals Accessible | Hub Behavior |
|---|---|---|
| ROLE_SUPER_ADMIN | superadmin only | Never sees hub |
| ROLE_ADMIN | admin, accounting, sales, factory | Sees hub |
| ROLE_ACCOUNTING | accounting only | Direct to portal |
| ROLE_SALES | sales only | Direct to portal |
| ROLE_FACTORY | factory only | Direct to portal |
| ROLE_DEALER | dealer only | Direct to portal (never sees hub) |

Key invariants:
- `ROLE_ADMIN` inherits access to admin + accounting + sales + factory but never dealer.
- `ROLE_DEALER` has exactly one portal and always lands directly on `/dealer`.
- Superadmin is fully isolated -- cannot access any tenant-scoped portal.
- `canAccessPortal()` in `portal-routing.ts` is the guard function used by `RequirePortal` in `App.tsx`.

### 4.4 Must-Change-Password Gate

If `GET /api/v1/auth/me` returns `mustChangePassword: true`, the AuthGate component redirects all routes to `/change-password`. This gate applies to Sales and Dealer users identically. Workers must not bypass this gate when testing login flows.

### 4.5 Module Gating

`enabledModules` is an array of module keys from the user session. An empty or undefined array means all modules are enabled. `isModuleEnabled()` checks visibility of nav items tagged with a `module` key. Currently, Sales and Dealer nav items do not use module gating, but the infrastructure exists in both layouts.

---

## 5. Data Flow and API-Layer Structure

### 5.1 API Client Architecture

All API calls go through the singleton `ApiClient` class in `src/lib/api.ts`:

- **Base URL:** `/api/v1` (relative, proxied in dev)
- **Request interceptor:** Injects `Authorization: Bearer <token>` and `X-Company-Code` header for non-public routes. Adds `Idempotency-Key` UUID for POST/PUT/PATCH/DELETE. (**Active drift:** the current code also injects `X-Company-Id`; this must be removed -- see §4.2.)
- **Response interceptor:** On 401, attempts deduplicated token refresh and retries once. On refresh failure, clears session and redirects to `/login`.
- **Envelope unwrapping:** `apiData<T>()` extracts `.data` from `{ success, message, data }` envelope. `unwrap<T>()` handles both envelope-wrapped and raw responses.
- **Error resolution:** `src/lib/error-resolver.ts` maps backend error codes (AUTH_*, VAL_*, BUS_*, etc.) to user-facing messages. `MFA_REDIRECT` sentinel triggers redirect to `/mfa`.

### 5.2 Sales API Layer (`src/lib/salesApi.ts`)

Wraps all Sales portal endpoints. Key method families:

| Method Family | Backend Endpoints | Notes |
|---|---|---|
| Orders | `/api/v1/sales/orders`, `/api/v1/sales/orders/{id}`, `/api/v1/sales/orders/search` | `getOrder()` fetches full list (no single GET by ID exists) -- this is a known drift point |
| Dealers | `/api/v1/dealers`, `/api/v1/dealers/{dealerId}`, `/api/v1/dealers/search` | Dealer master management. **Current-state only:** the wrapper includes create, update, and search methods, but full delete-capable CRUD is not guaranteed. The canonical backend endpoint inventory should be checked before assuming delete operations exist. Workers must verify which CRUD operations the backend actually supports before implementing new UI for them. |
| Credit | `/api/v1/credit/limit-requests`, `/api/v1/credit/override-requests` | Request + approve/reject |
| Promotions | `/api/v1/sales/promotions` | CRUD |
| Targets | `/api/v1/sales/targets` | CRUD |
| Dispatch | `/api/v1/dispatch/confirm`, dispatch reads | Sales calls dispatch confirm; factory also calls it |
| Invoices | `/api/v1/invoices` (read-only, order-linked) | Sales does not own standalone invoice inbox |
| Returns | `/api/v1/accounting/sales/returns` | Sales return creation |
| Dashboard | `/api/v1/sales/dashboard` | Summary metrics (**current-state drift:** the Sales dashboard is currently derived client-side from order search results rather than a dedicated dashboard endpoint; workers must verify whether the backend serves this endpoint or whether dashboard data must be assembled from other calls) |

### 5.3 Dealer API Layer (`src/lib/dealerApi.ts`)

Wraps all Dealer portal endpoints under `/api/v1/dealer-portal/**`. All endpoints are auto-scoped by the backend -- no dealer ID parameter required.

| Method | Backend Endpoint | Notes |
|---|---|---|
| `getDashboard()` | `GET /dealer-portal/dashboard` | Summary metrics |
| `getOrders()` | `GET /dealer-portal/orders` | Returns `{ orders: [...] }` envelope |
| `getInvoices()` | `GET /dealer-portal/invoices` | Returns `{ invoices: [...] }` envelope |
| `getInvoicePdf()` | `GET /dealer-portal/invoices/{id}/pdf` | Returns blob |
| `getLedger()` | `GET /dealer-portal/ledger` | Returns `{ entries: [...] }` envelope |
| `getAging()` | `GET /dealer-portal/aging` | Aging report |
| `submitCreditRequest()` | `POST /dealer-portal/credit-limit-requests` | Self-service credit request |
| Support tickets | `/api/v1/dealer-portal/support/tickets` | GET and POST |

### 5.4 Data Fetching Pattern

Pages use `useApiQuery<T>(fetchFn, deps)` from `src/hooks/useApiQuery.ts` for standard fetch-with-loading-error-state, or call API methods directly in `useEffect` with manual state management. There is no SWR or React Query caching layer. Background refresh uses `useBackgroundFetch.ts`.

### 5.5 Type System

All DTOs are defined in `src/types/index.ts`. Sales and Dealer types are co-located in this file. Key type families for this mission:

- `SalesOrderDto`, `SalesOrderRequest`, `SalesOrderSearchFilters`
- `DealerDto`, `CreateDealerRequest`, `UpdateDealerRequest`
- `CreditRequestDto`, `CreditOverrideRequestDto`
- `PromotionDto`, `SalesTargetDto`
- `InvoiceDto`, `SalesReturnRequest`
- `DealerPortalDashboard`, `DealerPortalOrder`, `DealerPortalInvoice`
- `DealerPortalLedgerEntry`, `DealerPortalAging`
- `DealerSupportTicket`, `DealerSupportTicketCreateRequest`
- `ApiResponse<T>`, `PageResponse<T>`

The generated OpenAPI client in `src/lib/client/` provides typed service classes. The hand-written API wrappers (`salesApi.ts`, `dealerApi.ts`) are the primary interface used by pages. Workers should prefer the hand-written wrappers unless the generated client provides a capability the wrapper does not.

---

## 6. Design-System and Shell Invariants for This Mission

### 6.1 Shell Structure

Both Sales and Dealer layouts follow an identical structural pattern:

```
<div flex h-screen>
  <aside> (sidebar, hidden on mobile) </aside>
  <MobileSidebar> (slide-over on small screens) </MobileSidebar>
  <div flex-1>
    <header h-12> (breadcrumb, actions, theme toggle, profile menu) </header>
    <main flex-1 overflow-auto>
      <ErrorBoundary>
        <Outlet /> (page content)
      </ErrorBoundary>
    </main>
  </div>
</div>
```

Components used by both layouts:
- `OrchestratorLogo` -- branded logo in sidebar header
- `Breadcrumb` -- derived from `useBreadcrumbs()` hook with route label map
- `ProfileMenu` -- user display name, email, role badge, logout action
- `CommandPaletteButton` -- keyboard shortcut launcher
- `AdminCompanySwitcher` -- company context switcher (Sales only, hidden on mobile)
- `MobileSidebar` -- responsive slide-over drawer
- `ErrorBoundary` -- catches render errors inside `<Outlet />`

### 6.2 Sidebar Nav Pattern

Nav items are a static `NAV_ITEMS` array in each layout:

```typescript
interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  module?: string; // optional module gating key
}
```

**Active drift -- Icons and emojis:** The current `NAV_ITEMS` definitions and page components use Lucide icons in sidebar nav items, and some pages render emojis in headings, status labels, and empty states. **This mission removes all icons and emojis from Sales and Dealer portals.** The canonical target is text-only navigation labels and no emojis anywhere in the UI. Workers must strip `icon` from `NavItem` usage (or ignore it), remove Lucide imports from nav rendering, and eliminate all emoji characters from Sales and Dealer page content. Other portals are out of scope.

Active state: `bg-[var(--color-neutral-900)] text-white`. Inactive: `text-[var(--color-text-secondary)]` with hover state. The "Back to hub" button is rendered only when `shouldShowHub(access)` is true (never for single-portal users).

### 6.3 Design Tokens

The design system uses CSS custom properties consumed through Tailwind's `var(--...)` syntax. Key token families:

- **Colors:** `--color-primary-*`, `--color-status-*` (success, warning, error, info, pending), `--color-text-*`, `--color-surface-*`, `--color-border-*`
- **Spacing/radius:** `--radius-lg`, `--radius-xl`, `--radius-2xl`
- **Shadows:** `--shadow-sm` through `--shadow-xl`
- **Dark mode:** `class` strategy in Tailwind (toggled via `useTheme()`)

Workers must use CSS custom properties for colors, not hardcoded Tailwind color classes, to maintain dark-mode compatibility.

### 6.4 Shared UI Components

Located in `src/components/ui/`. Components most relevant to Sales/Dealer pages:

- `DataTable` -- table with mobile card renderer
- `Modal` / `Drawer` / `BottomSheet` -- overlay patterns
- `Button`, `Input`, `Select`, `Combobox`, `MultiSelect` -- form controls
- `Badge`, `Tabs`, `Tooltip`, `Toast` -- status and feedback
- `StatCard`, `EmptyState`, `Skeleton`, `Loader` -- content display
- `DatePicker`, `DateRangePicker`, `FilterBuilder` -- filtering
- `SalesOrderModal`, `DispatchModal`, `ProductEntryModal` -- specialized domain modals
- `DealerSelector` -- dealer search/selection component
- `JournalEntryModal` -- accounting domain (do not use in Sales/Dealer)

### 6.5 Layout Differences Between Sales and Dealer

| Property | Sales | Dealer |
|---|---|---|
| Max content width | `max-w-7xl` | `max-w-5xl` |
| Company switcher | Visible (desktop) | Not shown |
| "Back to hub" | Shown for ROLE_ADMIN | Never shown (dealers have one portal) |
| Profile menu "Profile" action | Navigates to `/profile` | Navigates to `/dealer/profile` |
| Sidebar label | "Sales" | "Dealer" |

---

## 7. Current Drift/Risks Workers Must Keep in Mind

### 7.1 Vite Proxy Hardcoded to Remote IP

`vite.config.ts` proxies `/api` to `http://100.109.241.47:8081` with a hardcoded `Origin` header. The local backend is now available at `127.0.0.1:8081` via Colima. Milestone 1 must align this proxy target. Until then, workers must verify which backend they are hitting.

### 7.2 Sales API -- Missing Single Order GET

`salesApi.getOrder(id)` fetches the full order list (up to 500 records) and filters client-side because the backend does not expose `GET /api/v1/sales/orders/{id}` as a standalone endpoint. This is a known drift point. The canonical endpoint inventory does not list a per-ID GET for sales orders. Workers should not invent one.

### 7.3 Route/API Parity Gaps

The current `App.tsx` route tree is missing a significant number of routes described in the canonical `frontend-portals` documentation. Workers must add these routes (and their corresponding page components) to achieve parity. The gaps are organized by portal below.

#### Sales Portal — Canonical target routes missing or drifted in the current app

| Canonical Route | Purpose | Notes |
|---|---|---|
| `/sales/dashboard` | Explicit dashboard route (not just `/sales` index redirect) | Currently `/sales` renders `SalesDashboardPage` directly; canonical docs want an explicit `/sales/dashboard` route that is the primary landing target |
| `/sales/dealers/new` | New dealer creation form | Currently creation is inline on the list page; canonical wants a dedicated form route |
| `/sales/dealers/:dealerId` | Dealer detail/edit view | Currently handled inline on the list page; canonical wants a dedicated detail route |
| `/sales/orders/new` | New order creation form | Does not exist in current routes; canonical describes a standalone order creation page |
| `/sales/orders/:orderId` | Order detail view | Exists as `/sales/orders/:id` but uses `:id` param; verify alignment with canonical `:orderId` naming |
| `/sales/orders/:orderId/timeline` | Order timeline / status history | Does not exist; canonical describes a timeline sub-route for order status tracking |
| `/sales/credit/:requestId` | Credit request detail/history view | The mission contract uses consolidated `/sales/credit` routes instead of legacy split credit pages |

#### Dealer Portal — Canonical target routes missing or drifted in the current app

| Canonical Route | Purpose | Notes |
|---|---|---|
| `/dealer/dashboard` | Explicit dashboard route (not just `/dealer` index redirect) | Same pattern as Sales: canonical wants an explicit route, not just an index redirect |
| `/dealer/orders/:orderId` | Order detail view | Does not exist; canonical describes a detail page for dealer's own orders |
| `/dealer/invoices/:invoiceId` | Invoice detail view | Does not exist; canonical describes a detail page for dealer's own invoices |
| `/dealer/credit-requests/new` | New credit request submission form | Does not exist; canonical wants a dedicated form route for self-service credit requests |
| `/dealer/support/:ticketId` | Support ticket detail view | Does not exist; canonical describes a detail page for support tickets |

Workers should align `App.tsx`, Sales/Dealer layouts, and page entry points to these canonical UI routes. Do not preserve legacy split credit-route UI or dealer-profile UI just because they exist today.

### 7.4 Dispatch Confirm Boundary

`salesApi.ts` includes a `confirmDispatch()` method that calls `POST /api/v1/dispatch/confirm`. However, the canonical frontend-portals documentation states that dispatch confirmation is factory-owned and sales must not call it. The Sales portal should only have read visibility into dispatch status. Workers must verify whether this method should be removed from `salesApi.ts` or if it is used for a specific sales-side dispatch flow that predates the canonical ownership split.

### 7.5 Sales Invoice Route

The current Sales layout includes a top-level `/sales/invoices` route with `SalesInvoicesPage`. The canonical `frontend-portals/sales/routes.md` explicitly states: "Do not create `/sales/invoices` as a top-level route in this portal." Sales should only render invoice reads in the context of an order detail view. Workers must consider whether this route should be converted to an order-linked view or removed.

### 7.6 Dealer Credit Request Contract Drift

The canonical UI routes for dealer self-service credit are `/dealer/credit-requests` and `/dealer/credit-requests/new`, while the canonical backend write endpoint is `POST /api/v1/dealer-portal/credit-limit-requests`. Workers must keep this distinction clear: the UI route family stays `/dealer/credit-requests*`, while the API contract for writes uses `credit-limit-requests`. Do not invent `/dealer/credit-limit-requests` as a UI route.

### 7.7 Dealer Support Ticket Endpoints

The `dealerApi.ts` wrapper references `/api/v1/support/tickets` (without `dealer-portal` prefix) for support tickets. The canonical endpoint inventory lists support tickets under both `/api/v1/dealer-portal/support/tickets` and `/api/v1/portal/support/tickets`. Workers must verify which prefix the backend actually serves for dealer-scoped tickets and align the wrapper accordingly.

### 7.8 Retired Endpoints

The following endpoints are retired and must not be reintroduced:
- `GET /api/v1/auth/profile` -- use `GET /api/v1/auth/me` instead
- `POST /api/v1/accounting/journals/manual` -- use journal-entries endpoints
- `POST /api/v1/accounting/journals/{entryId}/reverse` -- use `POST /api/v1/accounting/journal-entries/{entryId}/reverse`
- Direct `POST /api/v1/accounting/periods/{periodId}/close` -- use request-close/approve-close flow

### 7.9 OpenAPI Client vs Hand-Written Wrappers

The generated OpenAPI client in `src/lib/client/` provides typed service classes. The hand-written API wrappers (`salesApi.ts`, `dealerApi.ts`) are the primary interface used by pages. If drift occurs between the generated client and the hand-written wrappers, the canonical `openapi.json` from the backend repo wins. Workers should not regenerate the client without explicit instructions.

---

## 8. Validation-Relevant Architecture Notes

### 8.1 Local Backend Runtime

The local backend runs at `127.0.0.1:8081` via Colima-backed Docker. Workers can validate API calls against this instance. The Vite dev proxy must be aligned to this target (see drift note 7.1). After proxy alignment, all `/api` requests from the browser will route to the local backend.

### 8.2 Playwright Validation

E2E tests live in `tests/` at the project root. Playwright config is at `playwright.config.ts`. Tests run with `bun run test:e2e` (single worker). Playwright output goes to `playwright-output/` and reports to `playwright-report/`.

The canonical frontend-portals tree includes `playwright-journeys.md` files for each portal describing expected browser journeys. Workers should implement validation for:
- Sales portal navigation (all nav items reachable, data loads)
- Dealer portal navigation (all nav items reachable, data loads)
- Auth corridor (login, MFA if applicable, must-change-password gate)
- Role-based access (sales user cannot reach dealer portal, dealer user cannot reach sales portal)
- Deep-link preservation through login corridor

### 8.3 Unit Tests

Unit tests use Vitest with jsdom environment. Test files are co-located in `__tests__` directories alongside the files they test. Run with `bun run test`. The test config excludes Playwright E2E specs.

### 8.4 Type Checking

`bun run typecheck` runs `tsc --noEmit`. Workers must ensure type checking passes after any changes. The TypeScript config is at `tsconfig.json` with path alias `@/` mapping to `src/`.

### 8.5 Build Validation

`bun run build` runs type checking followed by Vite production build. The build uses manual chunks in `rollupOptions` to code-split per portal. Sales and Dealer pages are bundled into `portal-sales` and `portal-dealer` chunks respectively. Workers must verify the build succeeds with no errors.

### 8.6 Response Envelope Contract

Most backend API responses follow the envelope format:

```json
{
  "success": true,
  "data": "<payload>",
  "message": "Optional message",
  "timestamp": "ISO-8601"
}
```

Error responses include `success: false` with a `message` and optionally a `code` field. The `apiData<T>()` helper unwraps the envelope and throws on `success: false`. Workers must not assume raw data without unwrapping.

**Exception -- Auth endpoints:** Login (`POST /api/v1/auth/login`), MFA submission, token refresh (`POST /api/v1/auth/refresh-token`), and session bootstrap (`GET /api/v1/auth/me`) do **not** follow the standard envelope format. These endpoints return their own response shapes directly (e.g., login returns `{ accessToken, refreshToken, user, companyCode, ... }` at the top level). Workers must not attempt to unwrap auth responses with `apiData<T>()`. The auth flow handling in `AuthContext` and the API client's refresh logic already account for this distinction.

### 8.7 Dealer Portal Auto-Scoping

The dealer portal is unique in that all endpoints are auto-scoped by the backend. Workers must never pass dealer IDs to dealer-portal endpoints. If a test or page accidentally sends a dealer ID, the backend should reject it -- this is a validation point, not a feature.

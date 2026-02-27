# BBP Orchestrator ERP — Portal Specification & Change Plan

> **Purpose:** This document is the single source of truth for what each portal does, what it
> should do, what is broken, and how to fix it — step by step, slow and steady.
>
> **Audience:** Any developer working on this frontend. Read this BEFORE touching any code.
>
> **Last updated:** 2026-02-13
>
> **Deployment readiness plan:** See `FRONTEND-DEPLOYMENT-EXECUTION-PLAN.md` for the portal-by-portal audit, UX standards, and step-by-step ship plan.

---

## Table of Contents

1. [Golden Rules](#1-golden-rules)
2. [Architecture Overview](#2-architecture-overview)
3. [Design System Contract](#3-design-system-contract)
4. [Portal 1: Admin](#4-portal-1-admin)
5. [Portal 2: Accounting (Major Rework)](#5-portal-2-accounting-major-rework)
6. [Portal 3: Factory](#6-portal-3-factory)
7. [Portal 4: Sales](#7-portal-4-sales)
8. [Portal 5: Dealer](#8-portal-5-dealer)
9. [Cross-Cutting Issues](#9-cross-cutting-issues)
10. [Change Phases](#10-change-phases)
11. [Appendix C: Supplier Settlement Backend Contract](#appendix-c-supplier-settlement-backend-contract)
12. [Appendix D: Progress Log](#appendix-d-progress-log)

---

## 1. Golden Rules

These rules are NON-NEGOTIABLE. Every change must follow them.

### 1.0 Toolchain

| Tool | Command | Never Use |
|------|---------|-----------|
| Package manager | `bun install` | `npm install`, `npm ci` |
| Dev server | `bun run dev` | `npm run dev` |
| Build | `bun run build` | `npm run build` |
| Type check | `bunx tsc --noEmit` | `npx tsc` |
| Add dependency | `bun add <pkg>` | `npm install <pkg>` |
| Add dev dependency | `bun add -d <pkg>` | `npm install -D <pkg>` |
| Run script | `bun run <script>` | `npm run <script>` |
| Execute binary | `bunx <bin>` | `npx <bin>` |
| Lock file | `bun.lock` (already exists) | `package-lock.json` (legacy, do not delete yet) |
| E2E tests | `bunx playwright test` | `npx playwright test` |
| Storybook | `bun run storybook` | `npm run storybook` |
| Codegen | `bunx openapi-typescript-codegen` | `npx openapi-typescript-codegen` |

### 1.1 Process Rules

| # | Rule |
|---|------|
| R1 | **One page at a time.** Never change more than one page file in a single commit. |
| R2 | **Build must pass.** Run `bunx tsc --noEmit && bun run build` after EVERY page change. |
| R3 | **No big-bang refactors.** If a change touches more than 3 files, break it into smaller commits. |
| R4 | **Keep the current UI design.** The visual style (semantic tokens, card layouts, Swiss-style metrics, font-display headings) is approved. Changes are structural/navigational, not visual redesigns. |
| R5 | **Test with dark mode.** Every change must look correct in both light and dark themes. |
| R6 | **No `as any`.** New code must never use `as any`. Existing `as any` should be removed when you touch that file. |
| R7 | **No `alert()` or `window.confirm()`.** Use `ResponsiveModal` for confirmations. Use toast/inline for errors. |
| R8 | **No `console.log` in production.** Remove any you find when touching a file. |

### 1.2 Code Style Rules

| # | Rule |
|---|------|
| S1 | **Semantic tokens only.** No hardcoded colors (`text-gray-500`, `bg-zinc-800`). Use `text-secondary`, `bg-surface`, etc. |
| S2 | **Design system components first.** Use `ResponsiveModal`, `ResponsiveForm`, `FormInput`, `FormSelect`, `FormTextarea`, `ResponsiveButton`, `Badge`, `PageHeader` before writing custom markup. |
| S3 | **OpenAI Sans everywhere.** Font is already configured. Use `font-sans` for body, `font-display` for headings/numbers. Never override `font-family` inline. |
| S4 | **Generated client for admin endpoints.** Use `AuthControllerService`, `AdminUserControllerService`, etc. For domain endpoints (accounting, factory, sales), use the wrapper functions in `*Api.ts` files. |
| S5 | **Envelope unwrapping.** Backend returns `{ success, data, message }`. Use `unwrap()` for generated client responses. Use `apiData()` for raw fetch (it unwraps automatically). |
| S6 | **Session injection.** Pass `session` from `useAuth()` to all API calls that need auth. Use `setApiSession()` on login. |
| S7 | **Error handling.** Every API call needs: (a) loading state, (b) error state with retry or message, (c) empty state if applicable. |

### 1.3 Vocabulary Standards

Use professional, simple enterprise language. The following terms are BANNED:

| Banned Term | Use Instead |
|-------------|------------|
| Control Room / Cockpit | Dashboard |
| Radar | Status / Overview |
| Orchestrations | Workflows / Processes |
| Operator | Manager / Administrator |
| Intelligence | Analytics / Insights |
| Pulse | Health / Summary |
| Escalations | Action Items / Alerts |
| BBP (in UI labels) | Use the portal name instead |

---

## 2. Architecture Overview

### 2.1 Route Structure

```
/                           → AdminLayout (if admin access)
  /dashboard                → DashboardPage
  /operations               → OperationsControlPage
  /approvals                → ApprovalsPage
  /users                    → UserManagementPage
  /roles                    → RolesPage
  /companies                → CompaniesPage
  /hr/employees             → EmployeesPage
  /hr/attendance            → AttendancePage
  /hr/payroll               → PayrollPage
  /settings                 → SettingsPage
  /profile                  → ProfilePage

/accounting/*               → AccountingLayout
  (20 child routes — SEE SECTION 5 FOR REWORK PLAN)

/factory/*                  → FactoryLayout
  (12 child routes)

/sales/*                    → SalesLayout
  (6 child routes)

/dealer/*                   → DealerLayout
  (7 child routes)

/portals                    → PortalHubPage (portal switcher)
/login                      → LoginPage (unauthenticated)
/forgot-password            → ForgotPasswordPage
/reset-password             → ResetPasswordPage
```

### 2.2 Layout Pattern (All Layouts Must Follow)

```
<aside "fixed inset-y-0 left-0 z-50 w-72 ... lg:static lg:translate-x-0">
  <div "flex h-full flex-col">
    <!-- Header: fixed h-16, border-b -->
    <div "flex h-16 items-center ... border-b border-border">
      Portal Title
    </div>

    <!-- Nav: flex-1 with overflow-y-auto -->
    <nav "flex-1 overflow-y-auto px-4 py-4">
      <!-- Back to Portals button (if multi-portal user) -->
      <!-- Nav links -->
    </nav>

    <!-- Footer: static (NOT absolute), border-t -->
    <div "border-t border-border p-4">
      User avatar + name + email
    </div>
  </div>
</aside>
```

**Violations found and fixed:**
- SalesLayout had `absolute bottom-0` footer → FIXED (Sprint 7)
- DealerLayout had `absolute bottom-0` footer → FIXED (Sprint 7)
- AccountingLayout had no overflow handling for 18 items → FIXED (Sprint 7)

### 2.3 Backend API Base

- Dev: Vite proxy at `localhost:3002` → proxies `/api/*` to `http://127.0.0.1:8081`
- Config: `.env` file sets `VITE_API_BASE_URL` and `VITE_API_PROXY_TARGET`
- All API calls go through `OpenAPI.BASE` (set in `admin/lib/api.ts`)
- Admin endpoints: 31 core + 7 optional (auth, mfa, users, roles, settings, companies, profile)
- Domain endpoints: accounting, factory, sales, dealer controllers (not in admin OpenAPI spec)

---

## 3. Design System Contract

### 3.1 CSS Variables (from `styles.css`)

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|----------------|
| `--bg-primary` | `#fafafa` | `#09090b` | `bg-background` |
| `--bg-surface` | `#ffffff` | `#18181b` | `bg-surface` |
| `--bg-surface-highlight` | `#f4f4f5` | `#27272a` | `bg-surface-highlight` |
| `--text-primary` | `#18181b` | `#fafafa` | `text-primary` |
| `--text-secondary` | `#71717a` | `#a1a1aa` | `text-secondary` |
| `--text-tertiary` | `#a1a1aa` | `#52525b` | `text-tertiary` |
| `--border-primary` | `#e4e4e7` | `#27272a` | `border-border` |
| `--action-primary-bg` | `#18181b` | `#fafafa` | `bg-action-bg` |
| `--action-primary-text` | `#ffffff` | `#09090b` | `text-action-text` |
| Status success bg | `#f0fdf4` | `#052e16` | `bg-status-success-bg` |
| Status success text | `#15803d` | `#4ade80` | `text-status-success-text` |
| Status error bg | `#fef2f2` | `#450a0a` | `bg-status-error-bg` |
| Status error text | `#dc2626` | `#f87171` | `text-status-error-text` |
| Status warning bg | `#fffbeb` | `#451a03` | `bg-status-warning-bg` |
| Status warning text | `#d97706` | `#fbbf24` | `text-status-warning-text` |
| Status info bg | `#eff6ff` | `#172554` | `bg-status-info-bg` |
| Status info text | `#2563eb` | `#60a5fa` | `text-status-info-text` |

### 3.2 Typography

| Use Case | Tailwind Class | Font |
|----------|---------------|------|
| Body text | `font-sans` | OpenAI Sans → Inter → system |
| Headings, hero numbers | `font-display` | OpenAI Sans → Plus Jakarta Sans → Inter |
| Branding text | `font-brand` | OpenAI Sans → Philosopher → Georgia |
| Numeric values | Add `tabular-nums` | Same font, fixed-width digits |

### 3.3 Component Library

| Component | Import From | Use For |
|-----------|-------------|---------|
| `ResponsiveModal` | `design-system/` | All modals, confirmations, detail views |
| `ResponsiveForm` | `design-system/` | Form wrappers |
| `FormInput` | `design-system/` | Text/number/date inputs |
| `FormSelect` | `design-system/` | Dropdown selects |
| `FormTextarea` | `design-system/` | Multi-line text |
| `ResponsiveButton` | `design-system/` | Action buttons |
| `PageHeader` | `design-system/` | Page title + description + actions |
| `Badge` | `components/ui/Badge` | Status pills, tags |
| `SearchableCombobox` | `components/` | Async search dropdowns (dealers, accounts) |
| `Table/TableBody/...` | `components/ui/Table` | Data tables |
| `Card/CardContent` | `components/ui/Card` | Content containers |

---

## 4. Portal 1: Admin

### 4.1 Current State: COMPLETE

The admin portal is fully wired, audited, and redesigned. All 31 core endpoints are connected.

### 4.2 Pages

| Route | Page | Lines | Status | Notes |
|-------|------|-------|--------|-------|
| `/dashboard` | DashboardPage | ~400 | Done | Swiss-style KPI cards, contextual greeting, shimmer skeleton |
| `/operations` | OperationsControlPage | ~350 | Done | Live performance, supply chain, automation timeline |
| `/approvals` | ApprovalsPage | ~200 | Done | Approval queue with actions |
| `/users` | UserManagementPage | ~400 | Done | Full CRUD, suspend/unsuspend, MFA disable |
| `/roles` | RolesPage | ~300 | Done | List + create, permissions input |
| `/companies` | CompaniesPage | ~250 | Done | CRUD + company switching |
| `/hr/employees` | EmployeesPage | ~300 | Done | Employee list + CRUD |
| `/hr/attendance` | AttendancePage | ~250 | Done | Attendance tracking |
| `/hr/payroll` | PayrollPage | ~400 | Done | Weekly/monthly runs, calculate/approve/post/pay |
| `/settings` | SettingsPage | ~300 | Done | System settings form, mail config, approvals |
| `/profile` | ProfilePage | ~400 | Done | Profile edit, password change, MFA setup |

### 4.3 Nav Menu (11 items)

```
Dashboard
Operations
Approvals
User management
Role management
Companies
Employees
Attendance
Payroll
Settings
Profile
```

**Assessment:** 11 items is borderline but acceptable. No grouping needed yet.
If we add more admin features in the future, consider grouping:
- "Access" group: Users, Roles
- "HR" group: Employees, Attendance, Payroll
- "System" group: Settings, Companies

### 4.4 Remaining Work

- Token refresh strategy still pending backend engineer confirmation.
- Dashboard/Operations data is mock — needs real endpoint wiring when backend provides data.
- **Admin Approval Contract (NEW):** `GET /api/v1/admin/approvals` returns `creditRequests[]` and `payrollRuns[]`. Each item has `actionType`, `actionLabel`, `summary`, `sourcePortal`, `approveEndpoint`, `rejectEndpoint`. UI must use `actionLabel` from payload (not hardcoded), display `summary` verbatim. See Appendix H.
- **Observability endpoints (NEW):** 7 optional dashboard/health endpoints available — see Appendix G.

---

## 5. Portal 2: Accounting (Major Rework)

### 5.0 Backend Contract Summary

- **Total Endpoints:** 143 (GL/Periods/Journals: 58, Invoice/Receivables: 5, Purchasing/Payables: 14, Inventory/Costing: 21, HR/Payroll: 32, Reports: 13)
- **Scope Guardrail:** HR, Purchasing, Inventory, and Reports domains MUST remain under Accounting portal scope. See Appendix J.
- **New Audit Trail APIs:** `GET /api/v1/accounting/audit/transactions` and `GET /api/v1/accounting/audit/transactions/{journalEntryId}` — replaces legacy digest. See Appendix G.
- **Full handoff doc:** `orchestrator_erp/docs/accounting-portal-frontend-engineer-handoff.md`

### 5.1 The Problem

The accounting portal has **18 nav items** dumped into a flat list. This is the OPPOSITE of
professional enterprise UX. Related features are scattered:

- "Journal Entries" and "Ledger" are both core accounting but sit next to "Dealers"
- "Purchases" and "GRN" are the same procurement workflow but separate nav items
- "Period Management" and "Month-End Closing" are the same period workflow
- "Audit Digest" is buried between "Financial Reports" and "Period Management"
- "Config Health" is an internal tool mixed with user-facing features

### 5.2 Current Nav (18 items — BAD)

```
Dashboard
Journal Entries
Ledger
Chart of Accounts
Dealers
Suppliers
Invoices
Payments
Purchases
GRN
Payroll
Product Catalog
Financial Reports
Audit Digest
Period Management
Month-End Closing
Bank Reconciliation
Config Health
```

### 5.3 Proposed Nav (7 groups — GOOD)

The nav should have 7 top-level items. Clicking a top-level item loads that page, which
contains tabs or sections for related sub-features. No more than 7 items visible at once.

```
Dashboard                        → /accounting
Transactions                     → /accounting/transactions
  ├── Journal Entries            → /accounting/transactions?tab=journal (default)
  ├── Ledger                     → /accounting/transactions?tab=ledger
  └── Payments                   → /accounting/transactions?tab=payments
Partners                         → /accounting/partners
  ├── Dealers                    → /accounting/partners?tab=dealers (default)
  └── Suppliers                  → /accounting/partners?tab=suppliers
Procurement                      → /accounting/procurement
  ├── Purchase Orders            → /accounting/procurement?tab=orders (default)
  └── Goods Receipts             → /accounting/procurement?tab=receipts
Catalog & Inventory              → /accounting/catalog
  ├── Products                   → /accounting/catalog?tab=products (default)
  └── Raw Materials              → /accounting/catalog?tab=materials
Reports & Audit                  → /accounting/reports
  ├── Financial Reports          → /accounting/reports?tab=financials (default)
  ├── Audit Digest               → /accounting/reports?tab=audit
  └── Aged Receivables           → (inside Financial Reports, already a tab)
Period & Close                   → /accounting/periods
  ├── Accounting Periods         → /accounting/periods?tab=periods (default)
  ├── Month-End Closing          → /accounting/periods?tab=month-end
  └── Bank Reconciliation        → /accounting/periods?tab=reconciliation
```

**Hidden from nav (accessed via settings gear or header menu):**
- Chart of Accounts → accessible from a button inside Transactions page
- Config Health → accessible from a button inside Catalog page
- Invoices → accessible from Partners > Dealers (invoice list scoped to selected dealer)
- Payroll → accessible from header menu or admin portal only
- Profile / Settings → header user menu only

### 5.4 Implementation Strategy (Tab-Based Pages)

Each grouped page uses Headless UI `Tab.Group` at the top. The URL stays clean with a
`?tab=` query param. This means:

1. **No new route definitions needed** — each group is ONE route with internal tabs
2. **No layout changes needed** — just the nav array shrinks from 18 to 7
3. **Page components get combined** — e.g., `JournalPage`, `LedgerPage`, `PaymentsPage`
   all become tabs inside a new `TransactionsPage`
4. **Existing page code is PRESERVED** — we extract each page's content into a tab panel
   component, not rewrite it

### 5.5 Accounting Pages — Detailed Status & Fix Plan

#### Dashboard (`AccountingDashboardPage.tsx`, 391 lines)
- **Status:** Working
- **Changes needed:** None. Keep as-is.

#### Journal Entries (`JournalPage.tsx`, 934 lines)
- **Status:** Mostly working
- **Broken:** "Bulk Post" button shows `alert('Bulk Post not wired yet')`
- **Fix:** Remove the Bulk Post button entirely until backend supports it. Replace `alert()`
  with nothing — just don't render the button.
- **Move to:** `TransactionsPage` tab 1

#### Ledger (`LedgerPage.tsx`, 322 lines)
- **Status:** Working
- **Changes needed:** None structurally.
- **Move to:** `TransactionsPage` tab 2

#### Payments (`PaymentsPage.tsx`, 407 lines)
- **Status:** Partially broken — settlements list always empty (no backend endpoint)
- **Fix:** Remove the "Full Settlement" flow button or show "Coming soon" badge.
  Quick Receipt and Make Payment modals work fine — keep those.
- **Move to:** `TransactionsPage` tab 3

#### Dealers (`DealersPage.tsx`, 308 lines)
- **Status:** Working with `@ts-ignore` for `dealer.onHold` property
- **Fix:** Type the `onHold` property properly. Remove `@ts-ignore`.
- **Move to:** `PartnersPage` tab 1

#### Suppliers (`SuppliersPage.tsx`, 370 lines)
- **Status:** Working
- **Changes needed:** None structurally.
- **Move to:** `PartnersPage` tab 2

#### Purchase Orders (`PurchaseOrdersPage.tsx`, 443 lines)
- **Status:** Working
- **Changes needed:** None structurally.
- **Move to:** `ProcurementPage` tab 1

#### Goods Receipts (`GoodsReceiptPage.tsx`, 88 lines)
- **Status:** Working (read-only, auto-created by backend)
- **Changes needed:** None.
- **Move to:** `ProcurementPage` tab 2

#### Catalog (`CatalogPage.tsx`, 1000+ lines)
- **Status:** Working. Already has Products and Raw Materials tabs internally.
- **Changes needed:** Add a "Config Health" button in the page header that opens
  ConfigHealthPage content in a slide-over or navigates to it.
- **Stays at:** `/accounting/catalog` (already a combined page)

#### Financial Reports (`ReportsPage.tsx`, 631 lines)
- **Status:** Working but Export button is not wired
- **Fix:** Either wire CSV export or remove the button.
- **Move to:** `ReportsPage` tab 1 (it already has 6 internal tabs — P&L, Balance Sheet, etc.)

#### Audit Digest (`AuditDigestPage.tsx`, 168 lines)
- **Status:** Working
- **Changes needed:** None.
- **Move to:** `ReportsPage` tab 2 (or keep as a sub-section of the reports page)

#### Accounting Periods (`AccountingPeriodsPage.tsx`, 123 lines)
- **Status:** Working
- **Changes needed:** None.
- **Move to:** `PeriodsPage` tab 1

#### Month-End Closing (`MonthEndPage.tsx`, 225 lines)
- **Status:** Working
- **Changes needed:** None.
- **Move to:** `PeriodsPage` tab 2

#### Bank Reconciliation (`BankReconciliationPage.tsx`, 136 lines)
- **Status:** BROKEN — `reconcileBank()` always throws error. Backend doesn't have endpoint.
- **Fix:** Show "Coming soon" state with explanation. Do NOT show a form that can't submit.
- **Move to:** `PeriodsPage` tab 3

#### Chart of Accounts (`AccountsPage.tsx`, 214 lines)
- **Status:** Working
- **Changes needed:** Remove from nav. Add "Chart of Accounts" button in the
  Transactions page header (accessible but not a primary nav item).
- **Access via:** Button in TransactionsPage or direct URL `/accounting/accounts`

#### Config Health (`ConfigHealthPage.tsx`, 250 lines)
- **Status:** Working
- **Changes needed:** Remove from nav. Add "Config Health" button in Catalog page header.
- **Access via:** Button in CatalogPage or direct URL `/accounting/config-health`

#### Invoices (`InvoicesPage.tsx`, 261 lines)
- **Status:** Working
- **Changes needed:** Remove from nav. Invoices are contextual — accessed from
  dealer detail or dashboard dealer view. Keep the route alive for direct access.
- **Access via:** Dashboard dealer filter or Partners > Dealers actions

#### Payroll (`PayrollPage.tsx`, 786 lines)
- **Status:** Working. Uses `adminApi` not `accountingApi`.
- **Changes needed:** Remove from accounting nav. This is an HR function that belongs
  in the Admin portal (it's already there at `/hr/payroll`). If accounting users need
  payroll access, add a "Payroll" link in the header dropdown menu.
- **Access via:** Admin portal `/hr/payroll` or header menu link

### 5.6 Accounting Layout Nav — Before & After

**BEFORE (18 items):**
```
Dashboard | Journal Entries | Ledger | Chart of Accounts | Dealers |
Suppliers | Invoices | Payments | Purchases | GRN | Payroll |
Product Catalog | Financial Reports | Audit Digest | Period Management |
Month-End Closing | Bank Reconciliation | Config Health
```

**AFTER (7 items):**
```
Dashboard | Transactions | Partners | Procurement | Catalog | Reports | Periods
```

### 5.7 Accounting Vocabulary Fixes

| Current | Change To | Reason |
|---------|-----------|--------|
| "Journal" (page heading) | "Journal Entries" | Clarity — "Journal" alone is ambiguous |
| "Ledger" / "Account statement and multi-account view" | "General Ledger" | Standard accounting term |
| "Payments & Settlements" | "Payments" | Settlements don't work, simplify |
| "GRN" | "Goods Received" | Not everyone knows the abbreviation |
| "Config Health" | "Account Configuration" | Less technical |
| "Revenue & Tax Account Health" | "Account Mapping Status" | Professional |
| "Dealer Accounts" (under "Dealer Master" label) | "Dealers" | Drop the "Master" jargon |
| "Supplier Accounts" (under "Supplier Master" label) | "Suppliers" | Drop the "Master" jargon |
| "Manage hierarchy and account definitions" | "View and manage your chart of accounts" | Friendlier |

---

## 6. Portal 3: Factory

### 6.1 Current State: Functional with Code Quality Issues

12 pages, 4,078 lines of page code. Most pages work but have pervasive `as any` casts
and mixed UI component usage (some use design-system, some use raw Headless UI).

### 6.2 Pages

| Route | Page | Lines | Status | Issues |
|-------|------|-------|--------|--------|
| `/factory` | FactoryDashboardPage | 165 | Done | None |
| `/factory/orders` | OrderFulfillmentPage | 252 | Working | Requires ROLE_SALES (cross-portal dependency) |
| `/factory/batches` | ProductionBatchesPage | 488 | Working | Heavy `as any`, uses `alert()` for validation |
| `/factory/packing-queue` | PackingQueuePage | 348 | Working | Extended DTO, `as any` casts |
| `/factory/packing` | BulkPackingPage | 443 | Buggy | String interpolation bug in JSX. Backup file exists. |
| `/factory/dispatch` | DispatchPage | 173 | Done | Clean, complete |
| `/factory/raw-materials` | RawMaterialsPage | 469 | Working | `as any` casts, extended request types |
| `/factory/finished-goods` | FinishedGoodsPage | 321 | Working | Unused import, no delete, `as any` casts |
| `/factory/inventory` | InventoryPage | 144 | Done | Clean, complete |
| `/factory/adjustments` | InventoryAdjustmentsPage | 488 | Working | `any` typed enum, no edit/delete |
| `/factory/packaging-mappings` | PackagingMappingsPage | 389 | Working | No re-activation path |
| `/factory/tasks` | TasksPage | 398 | Working | No delete, cross-links not navigable |

### 6.3 Nav Menu (12 items)

```
Dashboard
Production Plans
Production Batches
Packing Queue
Bulk Packing
Dispatch
Raw Materials
Finished Goods
Inventory
Stock Adjustments
Size Mappings
Tasks
```

**Assessment:** 12 items is too many for a flat list. Consider grouping:

```
Dashboard                           → /factory
Production                          → /factory/production
  ├── Production Plans              (OrderFulfillmentPage)
  ├── Production Batches            (ProductionBatchesPage)
  └── Tasks                         (TasksPage)
Packing & Dispatch                  → /factory/packing
  ├── Packing Queue                 (PackingQueuePage)
  ├── Bulk Packing                  (BulkPackingPage)
  └── Dispatch                      (DispatchPage)
Inventory                           → /factory/inventory
  ├── Raw Materials                 (RawMaterialsPage)
  ├── Finished Goods                (FinishedGoodsPage)
  ├── Stock Overview                (InventoryPage)
  └── Adjustments                   (InventoryAdjustmentsPage)
Configuration                       → /factory/config
  ├── Size Mappings                 (PackagingMappingsPage)
```

**Result:** 5 nav items instead of 12.

### 6.4 Factory Fix Priority

| Priority | What | Why |
|----------|------|-----|
| P1 | Fix BulkPackingPage string interpolation bug | Renders `$` in UI |
| P2 | Delete `BulkPackingPage.tsx.backup` | Dead file |
| P3 | Remove all `as any` casts (every page) | Type safety |
| P4 | Replace `alert()` calls with inline validation | UX |
| P5 | Consolidate to design-system components | Consistency |
| P6 | Nav grouping (12 → 5) | Usability |
| P7 | Make cross-links in TasksPage navigable | Feature gap |
| P8 | Deprecate OrderFulfillmentPage in favor of DispatchPage | Duplicate flows |

---

## 7. Portal 4: Sales

### 7.0 Backend Contract Summary

- **Total Endpoints:** 48 (Orders/Dispatch: 8, Dealers/Receivables: 10, Credit: 7, Invoices: 5, Promotions/Targets: 8, Dispatch Queue: 7, Orchestrator: 3)
- **RBAC:** `ROLE_SALES` has `portal:sales` only. Dispatch confirm requires `dispatch.confirm` permission (not in sales default).
- **Full handoff doc:** `orchestrator_erp/docs/sales-portal-frontend-engineer-handoff.md`

### 7.1 Current State: Functional with Gaps

6 pages, 2,477 lines. Core order flow works. Some features incomplete.

### 7.2 Pages

| Route | Page | Lines | Status | Issues |
|-------|------|-------|--------|--------|
| `/sales` | SalesDashboardPage | 156 | Done | None |
| `/sales/dealers` | DealersPage | 172 | Done | None |
| `/sales/orders` | OrdersPage | 1302 | Mostly done | Workflow trace modal JSX missing; fulfillment state unused |
| `/sales/promotions` | PromotionsPage | 258 | Working | Duplicate header rendering |
| `/sales/credit-requests` | CreditRequestsPage | 136 | Partial | No approve/reject actions |
| `/sales/returns` | ReturnsPage | 453 | Partial | GET endpoint may not exist; no product search |

### 7.2b New Routes from Backend Handoff (Not Yet Implemented)

| Route | Purpose | Key API Calls | Role Gate |
|-------|---------|---------------|-----------|
| `/sales/dealers/:dealerId/receivables` | Dealer ledger/invoices/aging + dunning hold | `GET /dealers/{id}/ledger`, `GET /dealers/{id}/invoices`, `GET /dealers/{id}/aging`, `POST /dealers/{id}/dunning/hold` | `ROLE_ADMIN\|ROLE_SALES\|ROLE_ACCOUNTING` |
| `/sales/credit-overrides/request` | Create credit override for dispatch | `POST /api/v1/credit/override-requests` | `ROLE_ADMIN\|ROLE_SALES\|ROLE_FACTORY` |
| `/sales/credit-overrides/review` | Approve/reject override queue | `GET/POST /api/v1/credit/override-requests/{id}/approve\|reject` | `ROLE_ADMIN\|ROLE_ACCOUNTING` |
| `/sales/dispatch/queue` | Pending dispatch slips | `GET /api/v1/dispatch/pending`, `GET /api/v1/dispatch/slip/{slipId}` | `ROLE_ADMIN\|ROLE_FACTORY\|ROLE_SALES` (read-only for sales) |
| `/sales/dispatch/confirm` | Final dispatch confirmation | `POST /api/v1/sales/dispatch/confirm` | `ROLE_ADMIN\|ROLE_SALES\|ROLE_ACCOUNTING` + `dispatch.confirm` |
| `/sales/invoices` | Invoice list, detail, PDF, email | `GET /api/v1/invoices`, `GET /api/v1/invoices/{id}/pdf`, `POST /api/v1/invoices/{id}/email` | `ROLE_ADMIN\|ROLE_SALES\|ROLE_ACCOUNTING` |
| `/sales/targets` | Sales target CRUD | `GET/POST/PUT/DELETE /api/v1/sales/targets` | `ROLE_ADMIN\|ROLE_SALES` |
| `/sales/ops/traces/:traceId` | Orchestrator trace view | `GET /api/v1/orchestrator/traces/{traceId}` | All roles |

### 7.3 Nav Menu (6 items)

```
Dashboard
Dealers
Orders
Promotions
Credit Requests
Returns
```

**Assessment:** 6 items is fine. No grouping needed. Clean and navigable.

### 7.4 Sales Fix Priority

| Priority | What | Why |
|----------|------|-----|
| P1 | Fix OrdersPage duplicate heading in PromotionsPage | Visual bug |
| P2 | Wire or remove workflow trace modal in OrdersPage | Dead code / incomplete feature |
| P3 | Remove unused fulfillment state vars in OrdersPage | Dead code |
| P4 | CreditRequestsPage: add approve/reject or clarify read-only intent | Feature gap |
| P5 | ReturnsPage: verify GET endpoint exists; add product search combobox | UX + API gap |
| P6 | Semantic token audit on all pages | Consistency |

---

## 8. Portal 5: Dealer

### 8.0 Backend Contract Summary

- **Total Endpoints:** 11 (Self-Service Core: 7, Receivable Aliases: 3, Promotions: 1)
- **RBAC:** `ROLE_DEALER` has `portal:dealer` only. All data is self-scoped via `verifyDealerAccess()`.
- **Primary API surface:** `/api/v1/dealer-portal/*` (NOT `/api/v1/dealers/{dealerId}/*`)
- **Full handoff doc:** `orchestrator_erp/docs/dealer-portal-frontend-engineer-handoff.md`

### 8.1 Current State: Mostly Complete

6 pages, 1,586 lines. Clean, well-structured. Self-service portal for dealers.

### 8.2 Pages

| Route | Page | Lines | Status | Issues |
|-------|------|-------|--------|--------|
| `/dealer` | DealerDashboardPage | 240 | Done | None |
| `/dealer/orders` | OrdersPage | 418 | Partial | "Load More" is a no-op; links to nonexistent routes |
| `/dealer/invoices` | InvoicesPage | 210 | Done | None |
| `/dealer/ledger` | LedgerPage | 118 | Done | None |
| `/dealer/aging` | AgingPage | 188 | Done | None |
| `/dealer/profile` | DealerProfilePage | 412 | Partial | Notifications static; MFA read-only |

### 8.2b New Routes from Backend Handoff (Not Yet Implemented)

| Route | Purpose | Key API Calls | Role Gate |
|-------|---------|---------------|-----------|
| `/dealer/credit-requests` | Request credit limit increase | `POST /api/v1/dealer-portal/credit-requests` | `ROLE_DEALER` |
| `/dealer/promotions` | View active promotions (read-only) | `GET /api/v1/sales/promotions` | `ROLE_DEALER` |

### 8.3 Nav Menu (6 items)

```
Dashboard
My Orders
Invoices
Ledger
Aging
Profile
```

**Assessment:** 6 items. Clean. No changes needed.

### 8.4 Dealer Fix Priority

| Priority | What | Why |
|----------|------|-----|
| P1 | Fix "Load More" button (either wire pagination or remove) | Broken UX |
| P2 | Fix/remove links to nonexistent routes (track, reorder, invoice detail) | Dead links |
| P3 | Remove static notification preferences or mark as "Coming soon" | Misleading |
| P4 | Semantic token audit | Consistency |

---

## 9. Cross-Cutting Issues

### 9.1 Type Safety

**Problem:** Pervasive `as any` casts across factory, accounting, and sales pages. This
indicates the generated OpenAPI client DTOs are out of sync with actual backend responses.

**Fix plan:**
1. Re-generate the OpenAPI client from the latest `openapi.json`
2. Add missing fields to DTOs via `& { field: type }` intersection types (NOT `as any`)
3. Remove all `as any` casts one file at a time

### 9.2 Lazy Loading

**Problem:** All 66 routes import their components statically. The JS bundle is 1.4MB.

**Fix plan (future):**
1. Use `React.lazy()` + `Suspense` for each portal's pages
2. Split by layout boundary: admin chunk, accounting chunk, factory chunk, sales chunk, dealer chunk
3. This is NOT urgent — do after all functional work is done

### 9.3 Mixed Component Libraries

**Problem:** Some pages use `@headlessui/react` `Dialog` directly, others use `ResponsiveModal`.
Some use `lucide-react` icons, others use `@heroicons/react`.

**Fix plan:**
1. When touching a page, migrate its modals to `ResponsiveModal`
2. Standardize on `lucide-react` for icons (it's already the dominant choice)
3. Do this incrementally — one page per commit

### 9.4 Duplicate Functionality

| What | Where | Resolution |
|------|-------|------------|
| `getDealerOrders()` and `getMyOrders()` | `dealerApi.ts` | Remove `getMyOrders()`, it's an exact duplicate |
| OrderFulfillmentPage and DispatchPage | Factory portal | Deprecate OrderFulfillmentPage; DispatchPage is the newer flow |
| Payroll in Admin AND Accounting | Both portals | Remove from accounting nav; payroll is admin-only |
| Profile/Settings in Accounting | Accounting portal | Move to header user menu only |

### 9.5 Non-Functional Backend Endpoints

| Endpoint | Page Using It | Status | Action |
|----------|--------------|--------|--------|
| `reconcileBank()` | BankReconciliationPage | Always throws | Show "Coming soon" |
| `listSettlements()` | PaymentsPage | Removed from backend | Remove settlement list UI |
| Returns GET | ReturnsPage | May not exist | Verify with backend; handle gracefully |
| GST Input/Output endpoints | ReportsPage | Removed | Already handled (summary-only) |
| Bulk Post journal | JournalPage | Not wired | Remove button |

### 9.6 RBAC Baseline (Verified from Backend Code)

Method security is active via `@EnableMethodSecurity`. Authorities include both role names and permission codes.

| Role | Default Permissions | Notes |
|------|-------------------|-------|
| `ROLE_ADMIN` | All permissions | Super-user across all portals |
| `ROLE_SALES` | `portal:sales` | No `dispatch.confirm` by default |
| `ROLE_FACTORY` | `portal:factory`, `dispatch.confirm`, `factory.dispatch` | Can confirm dispatch |
| `ROLE_ACCOUNTING` | `portal:accounting`, `payroll.run` | No `dispatch.confirm` or `factory.dispatch` |
| `ROLE_DEALER` | `portal:dealer` | Self-scoped data only |

**Critical Mixed Gates:**
- Dispatch confirm (`POST /api/v1/sales/dispatch/confirm`): requires role + `dispatch.confirm` permission
- Packing record endpoints have no explicit `@PreAuthorize` — authenticated-only
- Finished goods writes require `ROLE_ADMIN|ROLE_FACTORY` (excludes accounting)
- Raw material intake requires `ROLE_ADMIN|ROLE_ACCOUNTING` (excludes factory)

### 9.7 Portal Endpoint Counts

| Portal | Total | Source Doc |
|--------|-------|-----------|
| Admin | 38 | `admin-portal-frontend-engineer-handoff.md` |
| Accounting | 143 | `accounting-portal-frontend-engineer-handoff.md` |
| Sales | 48 | `sales-portal-frontend-engineer-handoff.md` |
| Dealer | 11 | `dealer-portal-frontend-engineer-handoff.md` |
| Manufacturing | 69 | `manufacturing-portal-frontend-engineer-handoff.md` |

---

## 10. Change Phases

### Phase 1: Bug Fixes & Dead Code (1-2 days)

Do these in order, one file per commit:

| Step | File | What |
|------|------|------|
| 1.1 | `factory/BulkPackingPage.tsx` | Fix `${}` string interpolation bug in JSX |
| 1.2 | `factory/BulkPackingPage.tsx.backup` | Delete this file |
| 1.3 | `accounting/JournalPage.tsx` | Remove "Bulk Post" button and `alert()` call |
| 1.4 | `accounting/BankReconciliationPage.tsx` | Replace form with "Coming soon" message |
| 1.5 | `accounting/PaymentsPage.tsx` | Remove "Full Settlement" flow or badge "Coming soon" |
| 1.6 | `sales/PromotionsPage.tsx` | Remove duplicate header |
| 1.7 | `sales/OrdersPage.tsx` | Remove unused trace modal state + fulfillment state vars |
| 1.8 | `dealer/OrdersPage.tsx` | Fix "Load More" (remove or wire). Fix dead links. |
| 1.9 | `lib/dealerApi.ts` | Remove duplicate `getMyOrders()` |

**Verification:** `bunx tsc --noEmit && bun run build` after EACH step.

### Phase 2: Accounting Nav Restructure (2-3 days)

This is the big structural change. Do it SLOWLY.

| Step | What | Details |
|------|------|---------|
| 2.1 | Create `TransactionsPage.tsx` | Tab component that renders JournalPage, LedgerPage, PaymentsPage as tab panels. Extract each page's `return` JSX into a named component (e.g., `JournalTab`, `LedgerTab`, `PaymentsTab`). Each tab is a self-contained component with its own state and API calls. Add a "Chart of Accounts" button in the page header. |
| 2.2 | Create `PartnersPage.tsx` | Tab component: DealersTab, SuppliersTab. Move dealer/supplier content into tabs. |
| 2.3 | Create `ProcurementPage.tsx` | Tab component: PurchaseOrdersTab, GoodsReceiptsTab. |
| 2.4 | Merge Audit into Reports | Add "Audit Digest" as tab 7 in the existing ReportsPage (it already has 6 tabs). |
| 2.5 | Create `PeriodsPage.tsx` | Tab component: PeriodsTab, MonthEndTab, ReconciliationTab. |
| 2.6 | Update AccountingLayout nav | Change the `nav` array from 18 items to 7. |
| 2.7 | Update App.tsx routes | Replace 18 child routes with 7 (+ keep old URLs as redirects for bookmarks). |
| 2.8 | Remove Payroll from accounting nav | Payroll stays accessible via admin portal only. |
| 2.9 | Remove Invoices from accounting nav | Invoices accessible via dealer filter on dashboard or inside Partners > Dealers. |
| 2.10 | Remove Chart of Accounts from nav | Accessible via button in TransactionsPage header. |
| 2.11 | Remove Config Health from nav | Accessible via button in CatalogPage header. |

**Key principle:** The old page files (`JournalPage.tsx`, `LedgerPage.tsx`, etc.) stay in the
codebase as importable components. They are NOT deleted. They become tab content components
imported by the new group pages.

### Phase 3: Factory Nav Grouping (1-2 days)

Same tab-based pattern as accounting:

| Step | What |
|------|------|
| 3.1 | Create `ProductionPage.tsx` (tabs: Plans, Batches, Tasks) |
| 3.2 | Create `PackingPage.tsx` (tabs: Queue, Bulk Packing, Dispatch) |
| 3.3 | Create `InventoryPage.tsx` — rename existing to `StockOverviewPage.tsx`, new page has tabs: Raw Materials, Finished Goods, Stock Overview, Adjustments |
| 3.4 | Move Size Mappings under a "Configuration" nav item |
| 3.5 | Update FactoryLayout nav (12 → 5) |
| 3.6 | Update App.tsx routes |

### Phase 4: Code Quality Sweep (2-3 days)

One file at a time, across all portals:

| Step | What |
|------|------|
| 4.1 | Remove all `as any` casts — add proper types or intersection types |
| 4.2 | Replace all `alert()` calls with inline validation / ResponsiveModal |
| 4.3 | Replace all raw `@headlessui/react Dialog` with `ResponsiveModal` |
| 4.4 | Remove all `console.log` statements |
| 4.5 | Remove all `@ts-ignore` comments — fix the underlying type issues |
| 4.6 | Standardize on `lucide-react` icons |
| 4.7 | Ensure all pages have: loading skeleton, error state, empty state |
| 4.8 | Vocabulary fixes (see Section 5.7) |

### Phase 5: Future Enhancements (Backlog)

| Item | Priority | Notes |
|------|----------|-------|
| Lazy loading + code splitting | Medium | Split by portal layout boundary |
| Real data for Admin Dashboard/Operations | Depends on backend | Currently mock data |
| Token refresh automation | High | Waiting for backend spec |
| Pagination for list endpoints | Medium | Backend doesn't expose pagination params yet |
| Keyboard shortcuts standardization | Low | Only JournalPage has them currently |
| Accessibility audit (ARIA labels, focus management) | Medium | Important for enterprise |
| E2E tests with Playwright | Medium | Critical before production |

---

## Appendix A: File Index

### Admin Portal Pages
```
admin/pages/DashboardPage.tsx
admin/pages/OperationsControlPage.tsx
admin/pages/ApprovalsPage.tsx
admin/pages/UserManagementPage.tsx
admin/pages/RolesPage.tsx
admin/pages/CompaniesPage.tsx
admin/pages/hr/EmployeesPage.tsx
admin/pages/hr/AttendancePage.tsx
admin/pages/hr/PayrollPage.tsx
admin/pages/SettingsPage.tsx
admin/pages/ProfilePage.tsx
admin/pages/MfaPage.tsx
admin/pages/LoginPage.tsx
admin/pages/ForgotPasswordPage.tsx
admin/pages/ResetPasswordPage.tsx
admin/pages/FirstPasswordChangePage.tsx
admin/pages/PortalHubPage.tsx
```

### Accounting Portal Pages
```
admin/pages/accounting/AccountingDashboardPage.tsx
admin/pages/accounting/JournalPage.tsx
admin/pages/accounting/LedgerPage.tsx
admin/pages/accounting/AccountsPage.tsx
admin/pages/accounting/DealersPage.tsx
admin/pages/accounting/SuppliersPage.tsx
admin/pages/accounting/InvoicesPage.tsx
admin/pages/accounting/PaymentsPage.tsx
admin/pages/accounting/PurchaseOrdersPage.tsx
admin/pages/accounting/GoodsReceiptPage.tsx
admin/pages/accounting/PayrollPage.tsx
admin/pages/accounting/CatalogPage.tsx
admin/pages/accounting/ReportsPage.tsx
admin/pages/accounting/AuditDigestPage.tsx
admin/pages/accounting/AccountingPeriodsPage.tsx
admin/pages/accounting/MonthEndPage.tsx
admin/pages/accounting/BankReconciliationPage.tsx
admin/pages/accounting/ConfigHealthPage.tsx
```

### Factory Portal Pages
```
admin/pages/factory/FactoryDashboardPage.tsx
admin/pages/factory/OrderFulfillmentPage.tsx
admin/pages/factory/ProductionBatchesPage.tsx
admin/pages/factory/PackingQueuePage.tsx
admin/pages/factory/BulkPackingPage.tsx
admin/pages/factory/DispatchPage.tsx
admin/pages/factory/RawMaterialsPage.tsx
admin/pages/factory/FinishedGoodsPage.tsx
admin/pages/factory/InventoryPage.tsx
admin/pages/factory/InventoryAdjustmentsPage.tsx
admin/pages/factory/PackagingMappingsPage.tsx
admin/pages/factory/TasksPage.tsx
```

### Sales Portal Pages
```
admin/pages/sales/SalesDashboardPage.tsx
admin/pages/sales/OrdersPage.tsx
admin/pages/sales/DealersPage.tsx
admin/pages/sales/PromotionsPage.tsx
admin/pages/sales/CreditRequestsPage.tsx
admin/pages/sales/ReturnsPage.tsx
```

### Dealer Portal Pages
```
admin/pages/dealer/DealerDashboardPage.tsx
admin/pages/dealer/OrdersPage.tsx
admin/pages/dealer/InvoicesPage.tsx
admin/pages/dealer/LedgerPage.tsx
admin/pages/dealer/AgingPage.tsx
admin/pages/dealer/DealerProfilePage.tsx
```

### API Modules
```
admin/lib/api.ts              — Base URL, fetch wrappers, OpenAPI config
admin/lib/authApi.ts           — Auth endpoints (login, logout, me, password, refresh)
admin/lib/mfaApi.ts            — MFA endpoints (setup, activate, disable)
admin/lib/adminApi.ts          — Admin CRUD (users, roles, companies, settings, HR)
admin/lib/profileApi.ts        — User profile (get, update)
admin/lib/accountingApi.ts     — Accounting domain (1,275 lines)
admin/lib/factoryApi.ts        — Factory domain (434 lines)
admin/lib/salesApi.ts          — Sales domain (446 lines)
admin/lib/dealerApi.ts         — Dealer domain (309 lines)
admin/lib/purchasingApi.ts     — Purchasing (PO, GRN)
```

### Layouts
```
admin/layouts/AdminLayout.tsx
admin/layouts/AccountingLayout.tsx
admin/layouts/FactoryLayout.tsx
admin/layouts/SalesLayout.tsx
admin/layouts/DealerLayout.tsx
```

### Design System
```
admin/design-system/variables.css
admin/design-system/theme.ts
admin/design-system/index.tsx   — ResponsiveContainer, Grid, Card, Button, Modal, Form, etc.
```

---

## Appendix B: Backend Endpoint Map (Admin Core)

| Controller | Method | Path | Frontend Page |
|------------|--------|------|---------------|
| auth | POST | `/api/v1/auth/login` | LoginPage |
| auth | POST | `/api/v1/auth/logout` | AdminLayout header |
| auth | GET | `/api/v1/auth/me` | App.tsx (session check) |
| auth | POST | `/api/v1/auth/password/change` | ProfilePage |
| auth | POST | `/api/v1/auth/password/forgot` | ForgotPasswordPage |
| auth | POST | `/api/v1/auth/password/reset` | ResetPasswordPage |
| auth | POST | `/api/v1/auth/refresh-token` | App.tsx (token refresh) |
| mfa | POST | `/api/v1/auth/mfa/setup` | MfaPage |
| mfa | POST | `/api/v1/auth/mfa/activate` | MfaPage |
| mfa | POST | `/api/v1/auth/mfa/disable` | MfaPage |
| admin-users | GET | `/api/v1/admin/users` | UserManagementPage |
| admin-users | POST | `/api/v1/admin/users` | UserManagementPage |
| admin-users | PUT | `/api/v1/admin/users/{id}` | UserManagementPage |
| admin-users | DELETE | `/api/v1/admin/users/{id}` | UserManagementPage |
| admin-users | PATCH | `/api/v1/admin/users/{id}/suspend` | UserManagementPage |
| admin-users | PATCH | `/api/v1/admin/users/{id}/unsuspend` | UserManagementPage |
| admin-users | PATCH | `/api/v1/admin/users/{id}/mfa/disable` | UserManagementPage |
| roles | GET | `/api/v1/admin/roles` | RolesPage |
| roles | POST | `/api/v1/admin/roles` | RolesPage |
| roles | GET | `/api/v1/admin/roles/{roleKey}` | RolesPage |
| settings | GET | `/api/v1/admin/settings` | SettingsPage |
| settings | PUT | `/api/v1/admin/settings` | SettingsPage |
| settings | GET | `/api/v1/admin/approvals` | ApprovalsPage |
| settings | POST | `/api/v1/admin/notify` | ApprovalsPage |
| companies | GET | `/api/v1/companies` | CompaniesPage |
| companies | POST | `/api/v1/companies` | CompaniesPage |
| companies | PUT | `/api/v1/companies/{id}` | CompaniesPage |
| companies | DELETE | `/api/v1/companies/{id}` | CompaniesPage |
| multi-company | POST | `/api/v1/multi-company/companies/switch` | CompaniesPage |
| profile | GET | `/api/v1/auth/profile` | ProfilePage |
| profile | PUT | `/api/v1/auth/profile` | ProfilePage |

---

## Appendix C: Supplier Settlement Backend Contract

> **Source:** Backend handoff doc (`orchestrator_erp/docs/frontend-handoff-supplier-settlement-prompt.md`)
> **Added:** 2026-02-10

### C.1 Objective

Keep AP (supplier payable) flows consistent with centralized accounting invariants.
Support both:
- **Purchase-linked** AP clearing
- **On-account** AP clearing (when liability exists but no raw-material purchase document is linked)

### C.2 Architecture Rules (MUST follow)

| # | Rule |
|---|------|
| A1 | Supplier settlement/payment allocations **must not** use `invoiceId`. `invoiceId` is AR-side (dealer sales invoice), not AP-side. |
| A2 | Supplier settlement (`POST /api/v1/accounting/settlements/suppliers`) supports two modes: **purchase-linked** (`purchaseId` provided) and **on-account** (`purchaseId` omitted, `memo` recommended). |
| A3 | Supplier direct payment (`POST /api/v1/accounting/suppliers/payments`) is **purchase-linked only** — `purchaseId` required in every allocation. |
| A4 | For on-account supplier credits, use **settlement endpoint**, not payment endpoint. |
| A5 | `cashAccountId` must be an **ASSET** account. AR/AP control accounts are rejected by backend. |
| A6 | Backend error payload includes structured fields: `data.code`, `data.message`, `data.reason`, `data.path`, `data.traceId`, optional `data.details`. UI must surface `reason` and `traceId`. |

### C.3 Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/accounting/settlements/suppliers` | Supplier settlement (purchase-linked or on-account) |
| POST | `/api/v1/accounting/suppliers/payments` | Supplier direct payment (purchase-linked only) |
| GET | `/api/v1/purchasing/raw-material-purchases?supplierId={id}` | Load supplier purchase documents for allocation picker |

### C.4 Allocation Builder Behavior (UI)

1. Load supplier purchases from purchasing endpoint.
2. Show only rows with `outstandingAmount > 0` for document-linked allocation picker.
3. Add explicit "On-account" allocation option for settlement endpoint:
   - No `purchaseId`
   - Optional memo textbox (recommended for audit clarity)
4. For supplier direct payment endpoint, force purchase selection and block on-account allocations.
5. **Prevent any supplier flow from sending `invoiceId`.**
6. Validate allocation totals client-side before submit.

### C.5 Request Payload Examples

**A) Purchase-linked settlement:**
```json
{
  "supplierId": 1,
  "cashAccountId": 20,
  "settlementDate": "2026-02-10",
  "referenceNumber": "SUP-SETTLE-001",
  "idempotencyKey": "SUP-SETTLE-001",
  "memo": "Supplier settlement",
  "allocations": [
    {
      "purchaseId": 55,
      "appliedAmount": 4000.00,
      "discountAmount": 0,
      "writeOffAmount": 0,
      "fxAdjustment": 0,
      "memo": "PO/GRN linked settlement"
    }
  ]
}
```

**B) On-account settlement (no purchase document):**
```json
{
  "supplierId": 1,
  "cashAccountId": 20,
  "settlementDate": "2026-02-10",
  "referenceNumber": "SUP-SETTLE-ONACC-001",
  "idempotencyKey": "SUP-SETTLE-ONACC-001",
  "memo": "Supplier settlement (on-account)",
  "allocations": [
    {
      "appliedAmount": 1500.00,
      "discountAmount": 0,
      "writeOffAmount": 0,
      "fxAdjustment": 0,
      "memo": "Advance/AP on-account clearing for SKEINA"
    }
  ]
}
```

**C) Invalid patterns (frontend MUST block):**
- `invoiceId` sent in supplier settlement/payment allocation
- `cashAccountId` mapped to AP/AR or non-ASSET account

### C.6 Error Handling UX

On non-2xx response, show:
- **Primary message:** `data.reason || data.message || message`
- **Secondary diagnostic:** `Trace ID: {data.traceId}` (if present)
- If `data.details` exists, render as key-value list.
- Do NOT reduce all errors to generic "Bad Request".

### C.7 Date/Time Handling

- Backend uses company timezone for default accounting date.
- If `settlementDate` is omitted, backend uses company current date.
- Frontend should **always send explicit `settlementDate`** from the form to avoid ambiguity.

### C.8 Acceptance Criteria

- [ ] Supplier settlement succeeds for purchase-linked allocations
- [ ] Supplier settlement succeeds for on-account allocations (with or without memo)
- [ ] Supplier direct payment succeeds only for purchase-linked allocations
- [ ] Supplier direct payment fails with clear reason if `purchaseId` missing
- [ ] Supplier settlement fails with clear reason when `invoiceId` is sent
- [ ] Supplier settlement fails with clear reason when invalid cash account selected
- [ ] UI displays backend `reason` + `traceId` for all failures

---

## Appendix D: Progress Log

### 2026-02-10 — Session 1 (Commits `95b879d` through `a3bca29`)

**Sprints 0–7 + Phase 1–3 foundation:**
- Full codebase refactor: API wiring, UI polish, dead code cleanup
- Accounting nav restructure (18 → 7 items), unified UI across all portals
- Factory nav grouping, WelcomeLoader redesign
- `formatDate` crash fix (handles epoch, Java LocalDate arrays, ISO strings)

### 2026-02-10 — Session 2 (Commit `73a6a50`)

**Deep error extraction + payload hardening:**
- `admin/lib/api.ts`: `extractApiErrorMessage` probes `reason`/`message`/`error`/`data.*`/`details.*` from response body, wired into `apiRequest` reject path
- `admin/lib/client/core/request.ts`: Identical deep-probe logic in generated client's `catchErrorCodes`
- `admin/pages/accounting/PayrollPage.tsx`: Optional-chain `summary.period?.from`/`to`, null-safe `calculatedAt`
- `admin/pages/admin/EmployeesPage.tsx`: `buildEmployeePayload` trims strings, strips empty optionals; `paymentSchedule` defaults to `MONTHLY`; `dailyRate` → `dailyWage` field name fix

### 2026-02-10 — Session 3 (Current commit)

**ApiErrorBanner component + LedgerPage error handling + accountingApi fixes:**
- `admin/components/ApiErrorBanner.tsx` (NEW): Shared structured error display — extracts `reason`, `traceId`, `code`, `details` from API error bodies. Dismissible. Used by LedgerPage, will be adopted by SettlementModal, PayrollPage next.
- `admin/pages/accounting/LedgerPage.tsx`: Added `catch` block to `load()` (was `try/finally` only — uncaught promise rejections on 400s). Replaced local `formatDate`/`formatMoney` with shared `formatUtils` imports. Error state uses `ApiErrorInfo` type. Dealer error banner uses `ApiErrorBanner`. Error is dismissible.
- `admin/lib/accountingApi.ts`: Added `purchaseId?: number` to `SettlementAllocation` type (required for supplier AP flows per Appendix C). Fixed `accountStatement()` query params: `from` → `startDate`, `to` → `endDate` (matches backend canonical keys).

### 2026-02-13 — Session 4 (Commits `f3ce1c2` through `2f00292`)

**ReportsPage redesign + LedgerPage fix + App.tsx refresh fix:**
- `admin/pages/accounting/ReportsPage.tsx`: Complete redesign — underline tabs matching JournalTabsPage, per-report date controls, mobile card views, `font-mono` → `font-sans` (no mono font in tailwind config), open period display for P&L/BS/CF
- `admin/pages/accounting/LedgerPage.tsx`: Fixed filter bar from broken grid to flex, consolidated multi-select `h-28`, added `clsx` import, fixed `localeCompare` crash on Java LocalDate arrays
- `admin/App.tsx`: Fixed refresh redirect — added `initializing` guard so redirect-to-login effect doesn't fire during async session restore
- `admin/lib/accountingApi.ts`: Fixed URL query string appending `?` when empty (400 errors), fixed Java LocalDate array handling in `accountStatement()`

### 2026-02-13 — Session 5 (Commits `5975a8a` through `301e25f`)

**Period pages + Procurement flow + Electron + Snappy UX + Nav cleanup:**

Period pages:
- `AccountingPeriodsPage.tsx`: Replaced all hardcoded zinc colors with semantic tokens, added `normalizeDate` for Java LocalDate arrays
- `MonthEndPage.tsx`: Period selector now shows date range in dropdown and selected panel, added `normalizeDate`
- `ReportsPage.tsx`: Added open period name + date range for period-based reports

Procurement flow fix:
- `purchasingApi.ts`: Complete rewrite with proper types matching OpenAPI spec — PurchaseOrder, GoodsReceipt, RawMaterialPurchase as 3 separate entities. Added `createFullPurchase()` that chains PO → GRN → Invoice. Backend requires `goodsReceiptId` and `invoiceNumber` which frontend was never sending.
- `PurchaseOrdersPage.tsx`: Now calls `createFullPurchase` instead of raw invoice endpoint. Supplier search filters locally (no more API call per keystroke).
- `GoodsReceiptPage.tsx`: Now lists actual GRNs from `/api/v1/purchasing/goods-receipts`

Electron + UX:
- `electron/main.cjs`: Removed `openDevTools()` auto-open, added View menu with DevTools toggle (F12), added `--no-sandbox` for Linux paths with spaces
- `index.html`: CSS-only branded splash, inline theme application (no white/dark flash), removed hardcoded `bg-slate-900`
- `App.tsx`: Branded splash during session restore instead of flashing login page

Accounting nav (Phase 2 completion):
- `AccountingLayout.tsx`: Nav reduced from 11 → 7 items. Removed Chart of Accounts, Invoices, Payroll, Employees from sidebar (still accessible via Ctrl+K command palette and direct URL). Final nav: Dashboard | Journal | Dealers | Procurement | Products & Materials | Reports | Periods

---

## Appendix E: Phase Status Summary

| Phase | Status | Details |
|-------|--------|---------|
| Phase 1: Bug Fixes & Dead Code | **DONE** (9/9) | All items complete |
| Phase 2: Accounting Nav Restructure | **DONE** (11/11) | Nav: 18 → 11 → 7 items. All tab pages created, routes updated |
| Phase 3: Factory Nav Grouping | **DONE** (5/5) | Nav: 12 → 5 items. All tab pages created |
| Phase 4: Code Quality Sweep | **NOT STARTED** | `as any` removal, `alert()` → modal, icon standardization |
| Phase 5: Future Enhancements | **BACKLOG** | Lazy loading, real data, token refresh, pagination |
| Phase 6: New Backend Routes | **NOT STARTED** | Sales: 8 new routes, Dealer: 2, Accounting: 4, Manufacturing: 9. See handoff docs |

---

### Next session priorities

1. **Sales Portal: DealerDetailModal fix** — Modal not appearing on dealer name click (code verified correct, likely browser cache issue)
2. **Sales Portal: New routes** — Implement routes from Section 7.2b (dealer receivables, credit overrides, dispatch, invoices, targets)
3. **Phase 4: Code Quality Sweep** — Start with accounting pages:
   - Remove `as any` casts (one file at a time)
   - Replace remaining `alert()` / `window.confirm()` with `ResponsiveModal`
   - Remove `console.log` statements
   - Standardize icons to `lucide-react`
4. **SettlementModal rewrite for supplier flows** — Purchase allocation picker, on-account mode, ASSET account filter, strip `invoiceId` from supplier payloads, structured error display (see Appendix C for full contract)
5. **Admin Approval Queue** — Implement action-type matrix from Appendix H
6. **Accounting Audit Trail** — New route `/accounting/audit-trail` using `GET /api/v1/accounting/audit/transactions`

---

## Appendix F: RBAC Permission Matrix

| Role | Portal Permissions | Special Permissions |
|------|-------------------|---------------------|
| `ROLE_ADMIN` | All portals | All permissions |
| `ROLE_SALES` | `portal:sales` | — |
| `ROLE_FACTORY` | `portal:factory` | `dispatch.confirm`, `factory.dispatch` |
| `ROLE_ACCOUNTING` | `portal:accounting` | `payroll.run` |
| `ROLE_DEALER` | `portal:dealer` | — |

**Mixed Gate Critical Paths:**

| Action | Endpoint | Required Gate |
|--------|----------|---------------|
| Dispatch confirm (sales path) | `POST /api/v1/sales/dispatch/confirm` | `ROLE_ADMIN\|ROLE_SALES\|ROLE_ACCOUNTING` + `dispatch.confirm` |
| Dispatch confirm (factory path) | `POST /api/v1/dispatch/confirm` | `ROLE_ADMIN\|ROLE_FACTORY` + `dispatch.confirm` |
| Credit override approve/reject | `POST /api/v1/credit/override-requests/{id}/approve\|reject` | `ROLE_ADMIN\|ROLE_ACCOUNTING` |
| Credit request approve/reject | `POST /api/v1/sales/credit-requests/{id}/approve\|reject` | `ROLE_ADMIN\|ROLE_ACCOUNTING` |
| Raw material intake | `POST /api/v1/raw-materials/intake` | `ROLE_ADMIN\|ROLE_ACCOUNTING` (excludes factory) |
| Finished goods write | `POST\|PUT /api/v1/finished-goods` | `ROLE_ADMIN\|ROLE_FACTORY` (excludes accounting) |
| Packaging mapping write/delete | `POST\|PUT\|DELETE /api/v1/factory/packaging-mappings` | `ROLE_ADMIN` only |

---

## Appendix G: Portal Endpoint Counts & Domain Breakdown

| Portal | Total | Domain Breakdown |
|--------|-------|------------------|
| Admin | 38 | Auth: 7, MFA: 3, Users: 7, Roles: 3, Settings: 4, Companies: 5, Profile: 2, Observability: 7 |
| Accounting | 143 | GL/Periods/Journals: 58, Invoice/Receivables: 5, Purchasing/Payables: 14, Inventory/Costing: 21, HR/Payroll: 32, Reports: 13 |
| Sales | 48 | Orders/Dispatch: 8, Dealers/Receivables: 10, Credit: 7, Invoices: 5, Promotions/Targets: 8, Dispatch Queue: 7, Orchestrator: 3 |
| Dealer | 11 | Self-Service: 7, Receivable Aliases: 3, Promotions: 1 |
| Manufacturing | 69 | Production: 16, Costing: 1, Dispatch/Packing: 20, Inventory: 23, Ops Dashboard: 4, Reports: 5 |

**Grand Total:** 309 scoped endpoints across all 5 portals.

Full endpoint maps per portal: `orchestrator_erp/docs/*-portal-endpoint-map.md`

---

## Appendix H: Admin Approval Action Contract

**Endpoint:** `GET /api/v1/admin/approvals`

**Response arrays:** `data.creditRequests[]` and `data.payrollRuns[]`

**Fields per item:** `type`, `id`, `publicId`, `reference`, `status`, `summary`, `actionType`, `actionLabel`, `sourcePortal`, `approveEndpoint`, `rejectEndpoint`, `createdAt`

**Action-Type Matrix:**

| Type | Action Type | Source Portal | Approve Endpoint | Reject Endpoint |
|------|-------------|---------------|------------------|-----------------|
| `CREDIT_REQUEST` | `APPROVE_DEALER_CREDIT_REQUEST` | `DEALER_PORTAL` | `/api/v1/sales/credit-requests/{id}/approve` | `/api/v1/sales/credit-requests/{id}/reject` |
| `CREDIT_LIMIT_OVERRIDE_REQUEST` | `APPROVE_DISPATCH_CREDIT_OVERRIDE` | `SALES_PORTAL` or `FACTORY_PORTAL` | `/api/v1/credit/override-requests/{id}/approve` | `/api/v1/credit/override-requests/{id}/reject` |
| `PAYROLL_RUN` | `APPROVE_PAYROLL_RUN` | `HR_PORTAL` | `/api/v1/payroll/runs/{id}/approve` | `null` (no reject) |

**UI Rules:**
- Use `actionLabel` from payload as button text (never hardcode)
- Display `summary` verbatim — it contains financial context
- Only show reject button when `rejectEndpoint` is non-null
- Optimistic row lock during action; refresh queue after completion

---

## Appendix I: Discount, Reference & Idempotency Rules

### Cash Formulas

**Dealer settlement:** `cashAmount = totalApplied + totalFxGain - totalFxLoss - totalDiscount - totalWriteOff`

**Supplier settlement:** `cashAmount = totalApplied + totalFxLoss - totalFxGain - totalDiscount - totalWriteOff`

### Account Requirements

| Condition | Required Account Field |
|-----------|----------------------|
| `totalDiscount > 0` | `discountAccountId` |
| `totalWriteOff > 0` | `writeOffAccountId` |
| `totalFxGain > 0` | `fxGainAccountId` |
| `totalFxLoss > 0` | `fxLossAccountId` |
| Explicit payment lines | `sum(payment.amount)` must equal computed `cashAmount` |

### Allocation Abuse Guards

- Allocation-level negative net cash is rejected (tolerance: `0.01`)
- Supplier on-account allocations (`purchaseId = null`) cannot include discount/write-off/FX
- Allocation cannot exceed current outstanding amount on linked invoice/purchase (tolerance: `0.01`)

### Idempotency Rules

- Same `idempotencyKey` + same payload → return original response
- Same key + different payload → `409 Conflict`
- Mismatched partner/allocation/memo signatures → rejected as concurrency conflict

Full contract: `orchestrator_erp/docs/PORTAL_DISCOUNT_REFERENCE_BEHAVIOR_GUIDE.md`

---

## Appendix J: Accounting Portal Scope Guardrail

**Invariant:** HR, PURCHASING, INVENTORY, and REPORTS domains MUST remain under the Accounting portal in frontend scope.

This covers:
- Route ownership
- API contract coverage
- QA test ownership
- Release sign-off readiness

**Change-Control Rule:** Do NOT move these domains out of Accounting portal scope unless the same commit includes:
1. Updated portal endpoint map and frontend handoff docs for every affected portal
2. Updated `docs/endpoint-inventory.md` module mapping
3. An `asyncloop` entry with rationale, impact, and verification plan

Source: `orchestrator_erp/docs/ACCOUNTING_PORTAL_SCOPE_GUARDRAIL.md`

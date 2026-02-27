# ERP Frontend — Portal Master Plan (6 Portals)

Last reviewed: 2026-02-27

This is the deepest frontend blueprint we currently have for building the ERP UI on top of the latest backend in this repository.

It is intentionally **portal-by-portal**, and it explicitly documents:
- what endpoints exist today,
- what each portal must expose in the frontend,
- where the *missing* endpoints / missing OpenAPI coverage are,
- and how to implement the UI safely around tenant boundaries (company context), RBAC, and high-risk accounting actions.

---

## 0) Canonical Facts (Non-Negotiable)

### 0.1 Canonical portal set (frontend)

Client-facing portals (5):
- `ADMIN`
- `ACCOUNTING`
- `SALES`
- `FACTORY` (manufacturing/production)
- `DEALER`

Internal overlay portal (1):
- `SUPERADMIN` (you only; `ROLE_SUPER_ADMIN`)

Portal taxonomy is already stated in `docs/INDEX.md`.

### 0.2 Canonical API contract source(s)

Frontend/API contract snapshot:
- OpenAPI snapshot: `openapi.json` (repo root)
- Inventory doc derived from it: `docs/endpoint-inventory.md`

Important: **some superadmin endpoints exist in code but are missing from `openapi.json`** (see §6.2 + §8).

### 0.3 Canonical RBAC primitives you must use in the UI

Source: `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/rbac/domain/SystemRole.java`

Roles:
- `ROLE_SUPER_ADMIN` (platform control; overlay)
- `ROLE_ADMIN` (tenant-scoped admin)
- `ROLE_ACCOUNTING`
- `ROLE_SALES`
- `ROLE_FACTORY`
- `ROLE_DEALER`

Default permission codes (important for UI gating):
- `portal:accounting`
- `portal:sales`
- `portal:factory`
- `portal:dealer`
- plus action permissions like `dispatch.confirm`, `factory.dispatch`, `payroll.run`

UI gating must be **fail-closed**:
- hide nav/routes if role/permission is missing,
- and if an API call returns 403, show an access-denied state with the failing endpoint.

---

## 1) Tenant (Company) Context — The #1 Frontend Trap

### 1.1 Company context is enforced by JWT claims (not by a “selected company” in local state)

Source: `erp-domain/src/main/java/com/bigbrightpaints/erp/core/security/CompanyContextFilter.java`

- Every authenticated request must carry a JWT that includes company context:
  - claim `companyCode` (and legacy `cid`)
- The backend rejects authenticated requests if the token is missing company context.
- If you send `X-Company-Code` / `X-Company-Id` headers, they must match the token claim or the request is rejected.

### 1.2 Login and refresh explicitly require `companyCode`

Source:
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/auth/web/LoginRequest.java`
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/auth/web/RefreshTokenRequest.java`

Frontend must treat **company selection** as part of auth:

`POST /api/v1/auth/login`
```json
{ "email": "user@x.com", "password": "…", "companyCode": "BBP", "mfaCode": null, "recoveryCode": null }
```

`POST /api/v1/auth/refresh-token`
```json
{ "refreshToken": "…", "companyCode": "SKE" }
```

### 1.3 “Company switch” UX: what actually works today

There is an endpoint documented/used in some docs:
- `POST /api/v1/multi-company/companies/switch`

But it returns a `CompanyDto` only (no new access token). Source:
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/company/controller/MultiCompanyController.java`

So: **it does NOT switch tenant context for the JWT-backed API surface**.

**Correct frontend behavior today**:
1) When user wants to switch company:
   - call `POST /api/v1/auth/refresh-token` with the existing refresh token + target `companyCode`
   - store the new access token (+ refresh token)
2) Optional (nice-to-have): call `POST /api/v1/multi-company/companies/switch` to validate membership + load `CompanyDto` for UI labels

**Backlog (recommended):** update `POST /api/v1/multi-company/companies/switch` to return `AuthResponse` or a dedicated “switch response” that includes a new access token (see §8).

### 1.4 Company list (for the selector) is role-limited

Source: `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/company/controller/CompanyController.java`

`GET /api/v1/companies` is allowed for:
- `ROLE_ADMIN`, `ROLE_ACCOUNTING`, `ROLE_SALES`

Notably excludes:
- `ROLE_FACTORY`
- `ROLE_DEALER`

So in the UI:
- show a full company dropdown only when `GET /api/v1/companies` is allowed
- otherwise show a “Company code” input on login (and hide company switching post-login)

---

## 2) Frontend Architecture Blueprint (How to Build 6 Portals Without 6 Codebases)

### Option A (recommended): 1 app, 6 route groups

One frontend codebase with top-level route groups:
- `/admin/*`
- `/superadmin/*`
- `/accounting/*`
- `/sales/*`
- `/factory/*`
- `/dealer/*`

Benefits:
- one auth stack
- one shared component library
- one “portal launcher” for multi-role users
- fewer duplicated API clients

### Option B: 5 client apps + 1 internal app

Separate bundles/deployments per portal:
- easier whitelisting / smaller surface per role
- but increases maintenance and contract drift

**If you choose Option B**, keep one shared package for:
- auth + refresh + token storage
- API client and error normalization
- permission gating helpers
- idempotency helpers (file uploads & high-risk actions)

### Shared primitives every portal must share

1) `SessionStore`
   - access token, refresh token
   - `companyCode` from token / `/auth/me`
2) `MeCache`
   - `GET /api/v1/auth/me` → roles + permissions
   - invalidate on login/refresh/company switch
3) `ApiClient`
   - attaches `Authorization: Bearer <token>`
   - optional `X-Company-Code` header (must match token claim)
   - standard error parsing (backend responses are not fully standardized)
4) `PortalGate`
   - route guard based on `portal:*` permission codes
5) `DangerActionGuard`
   - confirmations + “type-to-confirm” for posting/dispatch/period lock/reversal
   - show audit-friendly reference numbers

---

## 3) Cross-Module Workflows (What Users Actually Do)

Source of canonical write-path decisions:
- `docs/system-map/CROSS_MODULE_WORKFLOWS.md`

These workflows are the UI backbone. Every portal page should map to one of these flows.

### 3.1 Order-to-Cash (O2C)

Participating portals:
- Sales (create/manage orders)
- Factory (dispatch execution)
- Accounting (receipts/settlements, GL & reporting)
- Admin (approvals, diagnostics)
- Dealer (views invoices/ledger, requests credit)

Canonical write decisions (important):
- Dispatch confirmation canonical write path: `POST /api/v1/sales/dispatch/confirm`
- `POST /api/v1/dispatch/confirm` is kept as a compatibility alias; frontend should prefer canonical path unless factory flow is explicitly built on the alias.

Minimum UI sequence:
1) Sales creates order → confirms order
2) Factory sees dispatch pending → preview slip → dispatch confirm
3) Invoice generated → Sales/Accounting can view/email PDF
4) Accounting posts receipts and settles dealer

### 3.2 Procure-to-Pay (P2P)

Participating portals:
- Accounting (PO/GRN/purchase invoice, supplier payments, settlements)
- Factory (consumes raw material stock; may view suppliers read-only)

Minimum UI sequence:
1) Create PO
2) Record goods receipt (GRN)
3) Create purchase invoice (raw material purchase)
4) Post supplier payment
5) Post supplier settlement

### 3.3 Production-to-Pack

Participating portals:
- Factory (production plans/batches/logs, packing)
- Accounting (cost allocation/valuation/WIP adjustments, reports)

Minimum UI sequence:
1) Production plan → batch → tasks/logs
2) Packing record / bulk pack operations
3) Finished goods batch stock becomes available for dispatch

### 3.4 Payroll

Participating portals:
- Accounting (HR + payroll runs)
- Admin (approval shortcuts)

Minimum UI sequence:
1) attendance tracking
2) payroll run create → calculate
3) approve → post → mark paid

### 3.5 Period close (Accounting control plane)

Participating portals:
- Accounting only (with Admin read-only diagnostics)

Minimum UI sequence:
1) month-end checklist
2) lock/close period
3) run trial balance + reconciliation dashboards
4) reopen only under controlled override

---

## 4) Portal-by-Portal Plan (What Frontend Must Contain)

Each portal section includes:
- purpose + persona
- role/permission gates
- required navigation (routes)
- endpoints (high level) and deep reference docs
- known missing endpoints / contract gaps

### 4.1 Admin Portal (`ADMIN`)

Primary role:
- `ROLE_ADMIN` (and often `ROLE_SUPER_ADMIN` as well)

Purpose:
- manage tenant-scoped users/roles/settings
- view approvals
- act as diagnostic control plane
- provide safe jump-off to other portals

Canonical nav blueprint:
- `admin-portal-nav-plan.md` (recommended route structure)

RBAC page matrix:
- `portal-permissions-matrix.md`

Key endpoint groups (OpenAPI tag: `ADMIN`):
- Auth: `/api/v1/auth/*`
- Admin users/roles/settings: `/api/v1/admin/*`
- Portal insights: `/api/v1/portal/*`
- Orchestrator dashboards/health/traces: `/api/v1/orchestrator/*` (read-only; see deprecations below)
- Companies: `/api/v1/companies` (list); create/update are superadmin-only (see §4.2)

Admin portal pages you must build (minimum):
1) Overview dashboard
   - Insights: `GET /api/v1/portal/dashboard|operations|workforce`
   - Approvals snapshot: `GET /api/v1/admin/approvals`
2) Access management
   - Users CRUD: `GET/POST /api/v1/admin/users`, `PUT/DELETE /api/v1/admin/users/{id}`
   - MFA disable/suspend: `PATCH /api/v1/admin/users/{id}/mfa/disable|suspend|unsuspend`
   - Roles CRUD: `GET/POST /api/v1/admin/roles`, `GET /api/v1/admin/roles/{roleKey}`
3) Approvals
   - Aggregated approvals list: `GET /api/v1/admin/approvals`
   - Actions depend on item type (credit override, credit requests, payroll actions)
4) Settings
   - `GET/PUT /api/v1/admin/settings`
   - notifications: `POST /api/v1/admin/notify`
5) Diagnostics
   - Accounting health: `GET /api/v1/accounting/configuration/health` (owned by accounting but admin can read)
   - Orchestrator health: `GET /api/v1/orchestrator/health/*`
   - Trace viewer: `GET /api/v1/orchestrator/traces/{traceId}`

Important deprecations (do not build UI around these write endpoints):
- `POST /api/v1/orchestrator/dispatch*` returns 410 Gone (deprecated) — see `docs/system-map/CROSS_MODULE_WORKFLOWS.md`
- `POST /api/v1/orchestrator/payroll/run` returns 410 Gone (deprecated)

### 4.2 SuperAdmin Portal (`SUPERADMIN` overlay)

Primary role:
- `ROLE_SUPER_ADMIN`

Purpose:
- create and manage companies (tenants)
- control lifecycle state (active/hold) and quotas
- view tenant runtime metrics / policy

Code-backed endpoints (not fully represented in `openapi.json` today):
Source: `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/company/controller/CompanyController.java`
- `POST /api/v1/companies` (create company) — `ROLE_SUPER_ADMIN`
- `PUT /api/v1/companies/{id}` (update company) — `ROLE_SUPER_ADMIN`
- `POST /api/v1/companies/{id}/lifecycle-state` — `ROLE_SUPER_ADMIN`
- `GET /api/v1/companies/{id}/tenant-metrics` — `ROLE_SUPER_ADMIN`
- `PUT /api/v1/companies/{id}/tenant-runtime/policy` — `ROLE_SUPER_ADMIN`

Source: `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/admin/controller/AdminSettingsController.java`
- `GET /api/v1/admin/tenant-runtime/metrics` — `ROLE_ADMIN`
- `PUT /api/v1/admin/tenant-runtime/policy` — `ROLE_SUPER_ADMIN`

Superadmin portal pages you must build (minimum):
1) Company Registry
   - Create company (form)
   - Search company by code (see “missing endpoint” below)
2) Company Detail
   - Update company profile (timezone, currency, GST defaults, quota envelope)
   - Lifecycle state control (ACTIVE/HOLD/etc) with reason codes
3) Tenant Runtime
   - Metrics dashboard + history snapshots (if available)
   - Policy mutation (hard/soft limits, holds, reasons)

Known hard gap you should plan for:
- There is **no superadmin “list all companies” endpoint** today.
  - `GET /api/v1/companies` is membership-scoped and does not include `ROLE_SUPER_ADMIN` in its `@PreAuthorize`.
  - In `dev/seed`, the superadmin user is not automatically assigned to all companies.
  - Result: superadmin can create/update only if they already know the company id/code.

Backlog recommendation:
- Add `GET /api/v1/companies/all` or widen `GET /api/v1/companies` to include `ROLE_SUPER_ADMIN` and return all companies.
- Update OpenAPI + `docs/endpoint-inventory.md` accordingly.

### 4.3 Accounting Portal (`ACCOUNTING`)

Primary role:
- `ROLE_ACCOUNTING` (also accessible to `ROLE_ADMIN`)

Portal scope invariant:
- HR, PURCHASING, INVENTORY, and REPORTS come under the Accounting portal in frontend scope.
  - Guardrail: `docs/ACCOUNTING_PORTAL_SCOPE_GUARDRAIL.md`

Deep engineer handoff (system-of-record for accounting UI build):
- `docs/accounting-portal-frontend-engineer-handoff.md`
- Full endpoint expectation map: `docs/accounting-portal-endpoint-map.md`

Accounting portal modules that MUST exist in frontend:
1) Accounting (GL + controls)
2) Inventory & Costing (valuation, WIP, landed cost, revaluation, adjustments)
3) Purchasing (PO/GRN/raw material purchases)
4) HR + Payroll (employees, attendance, payroll runs, posting)
5) Reports (BS/PL/CF/TB, inventory reconciliation/valuation, wastage, production costs)
6) Catalog (product master + bulk variants) — see §7

Key “costing/pricing” capability callouts (because this keeps going missing):
- Product master & bulk variants endpoints exist under accounting catalog:
  - `POST /api/v1/accounting/catalog/import` (file upload)
  - `GET/POST /api/v1/accounting/catalog/products`
  - `PUT /api/v1/accounting/catalog/products/{id}`
  - `POST /api/v1/accounting/catalog/products/bulk-variants?dryRun=true|false`
- Inventory valuation and costing visibility exists via reports + inventory endpoints:
  - `GET /api/v1/reports/inventory-valuation`
  - `GET /api/v1/reports/inventory-reconciliation`
  - `GET /api/v1/reports/production-logs/{id}/cost-breakdown`
  - `POST /api/v1/accounting/inventory/landed-cost`
  - `POST /api/v1/accounting/inventory/revaluation`
  - `POST /api/v1/accounting/inventory/wip-adjustment`

Known boundary mismatch to plan around:
- Some “inventory master” writes are restricted away from `ROLE_ACCOUNTING` (per the code-verified RBAC baseline in the handoff doc).
  - If the business requirement is “accounting users maintain finished goods master data”, you must:
    - either use `ROLE_ADMIN` for that role group in production,
    - or adjust backend `@PreAuthorize` to allow `ROLE_ACCOUNTING` on those specific endpoints.

### 4.4 Sales Portal (`SALES`)

Primary role:
- `ROLE_SALES` (some actions also available to `ROLE_ADMIN` / `ROLE_ACCOUNTING`)

Purpose:
- dealer management + credit workflows
- sales orders lifecycle
- invoice review + email/PDF
- dispatch confirm entrypoint (canonical O2C write path) for authorized users

Sales portal pages you must build (minimum):
1) Sales Dashboard
   - Pipeline metrics (derived from orders/invoices/credit queues)
2) Dealers
   - List/search/create/update dealers
   - Dealer ledger/aging/invoices
3) Sales Orders
   - List + detail + create + edit
   - Confirm / cancel
   - Status patching
4) Credit
   - Credit requests (create, list, edit until approved)
   - Credit override requests (create, list; approvals routed via Admin)
5) Invoices
   - List/detail, PDF download, email
6) Dispatch (Sales-side)
   - Dispatch confirmation (canonical): `POST /api/v1/sales/dispatch/confirm`
   - Requires both role gate and `dispatch.confirm` authority

Primary endpoints (OpenAPI tag: `SALES`):
- Sales orders:
  - `GET/POST /api/v1/sales/orders`
  - `GET/PUT/DELETE /api/v1/sales/orders/{id}`
  - `POST /api/v1/sales/orders/{id}/confirm`
  - `POST /api/v1/sales/orders/{id}/cancel`
  - `PATCH /api/v1/sales/orders/{id}/status`
- Dispatch:
  - `POST /api/v1/sales/dispatch/confirm` (canonical write path)
  - `POST /api/v1/sales/dispatch/reconcile-order-markers` (admin/accounting)
- Credit requests:
  - `GET/POST /api/v1/sales/credit-requests`
  - `PUT /api/v1/sales/credit-requests/{id}` (edit only)
  - `POST /api/v1/sales/credit-requests/{id}/approve|reject`
- Credit overrides:
  - `GET/POST /api/v1/credit/override-requests`
  - `POST /api/v1/credit/override-requests/{id}/approve|reject`
- Invoices:
  - `GET /api/v1/invoices`
  - `GET /api/v1/invoices/{id}`
  - `GET /api/v1/invoices/{id}/pdf`
  - `POST /api/v1/invoices/{id}/email`
  - `GET /api/v1/invoices/dealers/{dealerId}`

Dependencies you will still need in Sales UI:
- Dealer endpoints in tag `DEALERS` (because sales portal “Dealers” is bigger than just `/api/v1/sales/dealers`):
  - `GET/POST /api/v1/dealers`
  - `GET /api/v1/dealers/search`
  - `PUT /api/v1/dealers/{dealerId}`
  - `GET /api/v1/dealers/{dealerId}/ledger|aging|invoices`
- Product browsing for quoting / availability:
  - `GET /api/v1/production/brands`
  - `GET /api/v1/production/brands/{brandId}/products`
  - `GET /api/v1/finished-goods/stock-summary`
  - `GET /api/v1/finished-goods/low-stock`

### 4.5 Factory Portal (`FACTORY`)

Primary role:
- `ROLE_FACTORY` (and often `ROLE_ADMIN`)

Purpose:
- production operations: plans/batches/tasks/logs
- packaging operations: packing records, bulk → size packing, packaging mappings
- dispatch execution: queue, slip, preview, confirm, backorders
- inventory operations: finished goods batches, adjustments
- raw material visibility and intake/batches

Existing sitemap/data map:
- `manufacturing-portal-sitemap-datamap.md`

Factory portal pages you must build (minimum):
1) Dashboard (KPIs + queues)
2) Production
   - plans, batches, tasks, logs, cost allocation
3) Packaging
   - packing records + complete
   - unpacked batches queue
   - bulk pack screen
   - packaging mappings
   - packing history
4) Dispatch
   - pending queue
   - slip detail + order linkage
   - preview
   - confirm (requires `dispatch.confirm`)
   - backorder cancel, slip status update
5) Inventory
   - finished goods catalog + batches
   - bulk batch explorer
   - adjustments (out)
6) Raw Materials
   - catalog (read/write depends on role gates)
   - stock + low stock + inventory snapshots
   - batches
   - intake (note: role gating differs here; see accounting handoff)

Primary endpoints (OpenAPI tag: `FACTORY_PRODUCTION`):
- `/api/v1/factory/*` (production plans/batches/tasks/logs, packing, mappings, bulk batches)
- `/api/v1/production/*` (brands/products)

Key dependencies (owned by other portal tags but required in factory UI):
- Dispatch endpoints (OpenAPI tag: `ACCOUNTING`):
  - `GET /api/v1/dispatch/pending`
  - `GET /api/v1/dispatch/slip/{slipId}`
  - `GET /api/v1/dispatch/order/{orderId}`
  - `GET /api/v1/dispatch/preview/{slipId}`
  - `POST /api/v1/dispatch/confirm` (compat alias; requires dispatch.confirm)
  - `POST /api/v1/dispatch/backorder/{slipId}/cancel`
  - `PATCH /api/v1/dispatch/slip/{slipId}/status`
- Finished goods (OpenAPI tag: `ACCOUNTING`):
  - `GET /api/v1/finished-goods*`
  - `GET /api/v1/finished-goods/{id}/batches`
- Inventory adjustments (OpenAPI tag: `ACCOUNTING`):
  - `GET/POST /api/v1/inventory/adjustments`
- Raw materials:
  - `GET/POST/PUT/DELETE /api/v1/accounting/raw-materials*`
  - `GET /api/v1/raw-materials/stock*`
  - `GET/POST /api/v1/raw-material-batches/{rawMaterialId}`
  - `POST /api/v1/raw-materials/intake`
- Read-only documents (OpenAPI tag: `SALES`):
  - `GET /api/v1/invoices/dealers/{dealerId}`
  - `GET /api/v1/invoices/{id}`
  - `GET /api/v1/invoices/{id}/pdf`

### 4.6 Dealer Portal (`DEALER`)

Primary role:
- `ROLE_DEALER`

Purpose:
- dealer self-service view of ledger, invoices, orders, aging
- ability to request credit

Primary endpoints (OpenAPI tag: `DEALERS`):
- `GET /api/v1/dealer-portal/dashboard`
- `GET /api/v1/dealer-portal/ledger`
- `GET /api/v1/dealer-portal/invoices`
- `GET /api/v1/dealer-portal/invoices/{invoiceId}/pdf`
- `GET /api/v1/dealer-portal/orders`
- `GET /api/v1/dealer-portal/aging`
- `POST /api/v1/dealer-portal/credit-requests`

Dealer portal pages you must build (minimum):
1) Dashboard
2) Ledger
3) Invoices + PDF download
4) Orders
5) Aging
6) Credit Request form
7) Promotions (optional view; depends on RBAC allowing dealer read)

Dependencies:
- Promotions view (OpenAPI tag: `SALES`):
  - `GET /api/v1/sales/promotions`

---

## 5) “What’s missing?” — Why Frontend Feels Blocked Today

This section is intentionally direct: these are the top reasons “docs exist but frontend still can’t be built smoothly”.

### 5.1 OpenAPI coverage gaps for superadmin features

Superadmin endpoints exist in code but are missing from `openapi.json`:
- company lifecycle state control
- tenant metrics
- tenant runtime policy control
- admin tenant runtime metrics/policy

Fix plan:
1) update OpenAPI snapshot to include these endpoints
2) update `docs/endpoint-inventory.md` (sha256, path/operation counts)
3) add portal plan references in `docs/portals/*`

### 5.2 Company switching docs are misleading

Many docs point to `POST /api/v1/multi-company/companies/switch`, but tenant context is JWT-claim based.

Fix plan:
- Treat refresh-token as the real switch operation
- Optionally return a new token from the switch endpoint in a future backend change

### 5.3 No “list all companies” for superadmin

Without a superadmin list endpoint, the superadmin portal cannot even navigate to tenant details unless the user already knows ids/codes.

Fix plan (backend):
- add a superadmin list endpoint

### 5.4 Missing frontend guidance for Sales/Dealer portals

Accounting has a deep handoff; Admin has a nav plan; Factory has sitemap; Sales/Dealer need the same depth.

This master plan closes that gap structurally, and `docs/portals/PORTAL_ENDPOINTS_BY_PORTAL.md` provides exhaustive endpoint lists.

---

## 6) Catalog, Pricing, Costing — Where “FIFO/LIFO/WAC” Lives

### 6.1 Where costing method is configured (source-of-truth)

Backend normalization rules:
- `erp-domain/src/main/java/com/bigbrightpaints/erp/core/util/CostingMethodUtils.java`

Supported methods:
- Finished goods: `FIFO`, `LIFO`, `WAC` (weighted average)
- Raw materials: `FIFO`, `WAC` (no raw-material LIFO today)

Where the costing method is stored:
- `FinishedGood.costingMethod` (string)
- `RawMaterial.costingMethod` (string)

### 6.2 Where FIFO/LIFO/WAC changes behavior (why UI must expose it)

Finished goods batch selection (dispatch + adjustments) is driven by costing method:
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/inventory/service/FinishedGoodsService.java`
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/inventory/service/InventoryAdjustmentService.java`

Reports/valuation uses costing method:
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/reports/service/InventoryValuationService.java`

### 6.3 Where the frontend “sees costing”

Accounting portal MUST include these pages:
- Inventory valuation report → `GET /api/v1/reports/inventory-valuation`
- Inventory reconciliation → `GET /api/v1/reports/inventory-reconciliation`
- Production cost breakdown → `GET /api/v1/reports/production-logs/{id}/cost-breakdown`
- Cost allocation input → `POST /api/v1/factory/cost-allocation`
- Landed cost → `POST /api/v1/accounting/inventory/landed-cost`
- Revaluation → `POST /api/v1/accounting/inventory/revaluation`
- WIP adjustment → `POST /api/v1/accounting/inventory/wip-adjustment`

### 6.4 Catalog product master + “bulk variants” (where to wire it)

The catalog endpoints that support bulk product/variant creation are under accounting:
- Controller: `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/accounting/controller/AccountingCatalogController.java`
- Endpoints:
  - `POST /api/v1/accounting/catalog/import` (multipart)
  - `GET/POST /api/v1/accounting/catalog/products`
  - `PUT /api/v1/accounting/catalog/products/{id}`
  - `POST /api/v1/accounting/catalog/products/bulk-variants?dryRun=true|false`

Frontend should build two UX paths:
1) “CSV Import”
   - file upload + idempotency key
   - show row-level errors + partial success
2) “Bulk Variant Builder” (preferred)
   - color x size matrix
   - `dryRun=true` preview → show `conflicts` and `wouldCreate`
   - confirm → `dryRun=false` create → show `created`

Request/response models:
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/production/dto/BulkVariantRequest.java`
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/production/dto/BulkVariantResponse.java`

---

## 7) Delivery Roadmap (Build Order That Actually Works)

This roadmap is the “deep plan to ship” across 6 portals without getting stuck on missing pieces.

### Phase 0 — Foundation (shared across all portals)

Deliverables:
- Auth stack (login + refresh token)
- Company context handling (companyCode-aware token refresh)
- `GET /api/v1/auth/me` permission-gating system
- Global error normalization + access denied UX
- Generic table + form patterns (including PDF viewer/download + file uploads)

Acceptance criteria:
- can login to any company you’re assigned to
- can refresh token into another assigned company
- can render portal launcher based on `portal:*` permissions

### Phase 1 — Admin portal (tenant-scoped control plane)

Deliverables:
- Admin nav implemented (based on `admin-portal-nav-plan.md`)
- Users/roles/settings/approvals
- Diagnostics: health + trace viewer

Acceptance criteria:
- create user + assign roles + reset password
- approvals list loads and actions route correctly by type

### Phase 2 — Accounting portal (biggest surface)

Deliverables:
- implement routes per `docs/accounting-portal-frontend-engineer-handoff.md`
- include catalog + bulk variants + costing/valuation surfaces

Acceptance criteria:
- can post journal entries, lock period, view trial balance
- can run payroll flow end-to-end
- can create purchasing chain end-to-end
- can view inventory valuation and reconciliation
- can create bulk variants via dryRun + create

### Phase 3 — Factory portal (operations)

Deliverables:
- implement sitemap per `manufacturing-portal-sitemap-datamap.md`
- dispatch queue + confirm + inventory changes

Acceptance criteria:
- production log → packing → finished good batches visible
- dispatch confirm succeeds with correct permission

### Phase 4 — Sales portal (O2C + dealer management)

Deliverables:
- sales orders lifecycle
- dealers + ledger views
- credit requests + overrides
- invoice view/email/pdf

Acceptance criteria:
- create/confirm/cancel order
- create credit request; admin approves; sales sees status
- view invoice pdf and email invoice

### Phase 5 — Dealer portal (self-service)

Deliverables:
- dashboard/ledger/invoices/orders/aging/credit request

Acceptance criteria:
- dealer can view their ledger and invoices
- dealer can submit credit request

### Phase 6 — Superadmin overlay (platform controls)

Deliverables:
- company create/update + lifecycle state
- tenant runtime metrics/policy

Blocker to resolve first:
- add “list all companies” endpoint (see §4.2)
- update OpenAPI + endpoint inventory docs

---

## 8) Backend/API Backlog (To Make Frontend Truly Enterprise-Ready)

If you want the frontend build to be smooth and to avoid “we can’t build this screen”, you should schedule these backend contract improvements:

1) Fix company switching contract:
   - Make `POST /api/v1/multi-company/companies/switch` return a new token (or a dedicated switch response including access token)
   - Or document “refresh-token is the switch mechanism” everywhere and stop calling `/multi-company/*` “switch”
2) Add superadmin company listing:
   - `GET /api/v1/companies/all` (superadmin only) OR widen `GET /api/v1/companies` for superadmin
3) Add superadmin endpoints to OpenAPI snapshot:
   - `POST /api/v1/companies/{id}/lifecycle-state`
   - `GET /api/v1/companies/{id}/tenant-metrics`
   - `PUT /api/v1/companies/{id}/tenant-runtime/policy`
   - `GET /api/v1/admin/tenant-runtime/metrics`
   - `PUT /api/v1/admin/tenant-runtime/policy`
4) Pagination + searching:
   - Many list endpoints are unpaged. Add `page/size/sort` patterns where data volume will grow.
5) Standardize error schema:
   - Not every endpoint defines consistent 4xx/5xx bodies; frontend must be defensive.


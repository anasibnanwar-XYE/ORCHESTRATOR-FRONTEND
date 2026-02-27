# Portal Endpoints (OpenAPI + Code Deltas)

Last reviewed: 2026-02-27

This document answers: “what endpoints do we have, per portal?”

It is intentionally split into:
1) **OpenAPI-derived** inventories (from repo-root `openapi.json`)
2) **Known code-only endpoints** that exist in controllers but are missing from `openapi.json` today

Important notes:
- These groupings reflect **backend OpenAPI tags / ownership**, not necessarily “who consumes it”.
  - Example: Factory UI consumes many endpoints tagged `ACCOUNTING` (dispatch, finished goods).
- Use `portal-permissions-matrix.md` to understand which roles can call which endpoints in practice.

---

## A) OpenAPI-derived inventories (repo-root `openapi.json`)

Source of truth for this section: `openapi.json` → `paths` → operations → `tags`.

### A.1 `ADMIN` tag (48 ops)

```
DELETE /api/v1/admin/users/{id}
DELETE /api/v1/companies/{id}
GET /api/integration/health
GET /api/v1/admin/approvals
GET /api/v1/admin/roles
GET /api/v1/admin/roles/{roleKey}
GET /api/v1/admin/settings
GET /api/v1/admin/users
GET /api/v1/auth/me
GET /api/v1/auth/profile
GET /api/v1/companies
GET /api/v1/demo/ping
GET /api/v1/orchestrator/dashboard/admin
GET /api/v1/orchestrator/dashboard/factory
GET /api/v1/orchestrator/dashboard/finance
GET /api/v1/orchestrator/health/events
GET /api/v1/orchestrator/health/integrations
GET /api/v1/orchestrator/traces/{traceId}
GET /api/v1/portal/dashboard
GET /api/v1/portal/operations
GET /api/v1/portal/workforce
PATCH /api/v1/admin/users/{id}/mfa/disable
PATCH /api/v1/admin/users/{id}/suspend
PATCH /api/v1/admin/users/{id}/unsuspend
POST /api/v1/admin/notify
POST /api/v1/admin/roles
POST /api/v1/admin/users
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/mfa/activate
POST /api/v1/auth/mfa/disable
POST /api/v1/auth/mfa/setup
POST /api/v1/auth/password/change
POST /api/v1/auth/password/forgot
POST /api/v1/auth/password/reset
POST /api/v1/auth/refresh-token
POST /api/v1/companies
POST /api/v1/multi-company/companies/switch
POST /api/v1/orchestrator/dispatch
POST /api/v1/orchestrator/dispatch/{orderId}
POST /api/v1/orchestrator/factory/dispatch/{batchId}
POST /api/v1/orchestrator/orders/{orderId}/approve
POST /api/v1/orchestrator/orders/{orderId}/fulfillment
POST /api/v1/orchestrator/payroll/run
PUT /api/v1/admin/settings
PUT /api/v1/admin/users/{id}
PUT /api/v1/auth/profile
PUT /api/v1/companies/{id}
```

Operational warnings:
- `POST /api/v1/orchestrator/dispatch*` and `POST /api/v1/orchestrator/payroll/run` are deprecated (410 Gone) — do not build UI around them.
- `DELETE /api/v1/companies/{id}` currently denies deletion in code — treat as non-functional for UI.
- `POST /api/v1/companies` + `PUT /api/v1/companies/{id}` are **superadmin-only** in code.

### A.2 `ACCOUNTING` tag (148 ops)

```
DELETE /api/v1/accounting/raw-materials/{id}
DELETE /api/v1/hr/employees/{id}
GET /api/v1/accounting/accounts
GET /api/v1/accounting/accounts/tree
GET /api/v1/accounting/accounts/tree/{type}
GET /api/v1/accounting/accounts/{accountId}/activity
GET /api/v1/accounting/accounts/{accountId}/balance/as-of
GET /api/v1/accounting/accounts/{accountId}/balance/compare
GET /api/v1/accounting/aging/dealers/{dealerId}
GET /api/v1/accounting/aging/dealers/{dealerId}/pdf
GET /api/v1/accounting/aging/suppliers/{supplierId}
GET /api/v1/accounting/aging/suppliers/{supplierId}/pdf
GET /api/v1/accounting/audit/digest
GET /api/v1/accounting/audit/digest.csv
GET /api/v1/accounting/audit/transactions
GET /api/v1/accounting/audit/transactions/{journalEntryId}
GET /api/v1/accounting/catalog/products
GET /api/v1/accounting/configuration/health
GET /api/v1/accounting/date-context
GET /api/v1/accounting/default-accounts
GET /api/v1/accounting/gst/return
GET /api/v1/accounting/journal-entries
GET /api/v1/accounting/month-end/checklist
GET /api/v1/accounting/periods
GET /api/v1/accounting/raw-materials
GET /api/v1/accounting/reports/aged-debtors
GET /api/v1/accounting/reports/aging/dealer/{dealerId}
GET /api/v1/accounting/reports/aging/dealer/{dealerId}/detailed
GET /api/v1/accounting/reports/aging/receivables
GET /api/v1/accounting/reports/balance-sheet/hierarchy
GET /api/v1/accounting/reports/dso/dealer/{dealerId}
GET /api/v1/accounting/reports/income-statement/hierarchy
GET /api/v1/accounting/sales/returns
GET /api/v1/accounting/statements/dealers/{dealerId}
GET /api/v1/accounting/statements/dealers/{dealerId}/pdf
GET /api/v1/accounting/statements/suppliers/{supplierId}
GET /api/v1/accounting/statements/suppliers/{supplierId}/pdf
GET /api/v1/accounting/trial-balance/as-of
GET /api/v1/dispatch/order/{orderId}
GET /api/v1/dispatch/pending
GET /api/v1/dispatch/preview/{slipId}
GET /api/v1/dispatch/slip/{slipId}
GET /api/v1/finished-goods
GET /api/v1/finished-goods/low-stock
GET /api/v1/finished-goods/stock-summary
GET /api/v1/finished-goods/{id}
GET /api/v1/finished-goods/{id}/batches
GET /api/v1/hr/attendance/date/{date}
GET /api/v1/hr/attendance/employee/{employeeId}
GET /api/v1/hr/attendance/summary
GET /api/v1/hr/attendance/today
GET /api/v1/hr/employees
GET /api/v1/hr/leave-requests
GET /api/v1/hr/payroll-runs
GET /api/v1/inventory/adjustments
GET /api/v1/payroll/runs
GET /api/v1/payroll/runs/monthly
GET /api/v1/payroll/runs/weekly
GET /api/v1/payroll/runs/{id}
GET /api/v1/payroll/runs/{id}/lines
GET /api/v1/payroll/summary/current-month
GET /api/v1/payroll/summary/current-week
GET /api/v1/payroll/summary/monthly
GET /api/v1/payroll/summary/weekly
GET /api/v1/purchasing/goods-receipts
GET /api/v1/purchasing/goods-receipts/{id}
GET /api/v1/purchasing/purchase-orders
GET /api/v1/purchasing/purchase-orders/{id}
GET /api/v1/purchasing/raw-material-purchases
GET /api/v1/purchasing/raw-material-purchases/{id}
GET /api/v1/raw-material-batches/{rawMaterialId}
GET /api/v1/raw-materials/stock
GET /api/v1/raw-materials/stock/inventory
GET /api/v1/raw-materials/stock/low-stock
GET /api/v1/reports/account-statement
GET /api/v1/reports/balance-sheet
GET /api/v1/reports/balance-warnings
GET /api/v1/reports/cash-flow
GET /api/v1/reports/inventory-reconciliation
GET /api/v1/reports/inventory-valuation
GET /api/v1/reports/monthly-production-costs
GET /api/v1/reports/production-logs/{id}/cost-breakdown
GET /api/v1/reports/profit-loss
GET /api/v1/reports/reconciliation-dashboard
GET /api/v1/reports/trial-balance
GET /api/v1/reports/wastage
GET /api/v1/suppliers
GET /api/v1/suppliers/{id}
PATCH /api/v1/dispatch/slip/{slipId}/status
PATCH /api/v1/hr/leave-requests/{id}/status
POST /api/v1/accounting/accounts
POST /api/v1/accounting/accruals
POST /api/v1/accounting/bad-debts/write-off
POST /api/v1/accounting/catalog/import
POST /api/v1/accounting/catalog/products
POST /api/v1/accounting/catalog/products/bulk-variants
POST /api/v1/accounting/credit-notes
POST /api/v1/accounting/debit-notes
POST /api/v1/accounting/inventory/landed-cost
POST /api/v1/accounting/inventory/revaluation
POST /api/v1/accounting/inventory/wip-adjustment
POST /api/v1/accounting/journal-entries
POST /api/v1/accounting/journal-entries/{entryId}/cascade-reverse
POST /api/v1/accounting/journal-entries/{entryId}/reverse
POST /api/v1/accounting/month-end/checklist/{periodId}
POST /api/v1/accounting/payroll/payments
POST /api/v1/accounting/payroll/payments/batch
POST /api/v1/accounting/periods/{periodId}/close
POST /api/v1/accounting/periods/{periodId}/lock
POST /api/v1/accounting/periods/{periodId}/reopen
POST /api/v1/accounting/raw-materials
POST /api/v1/accounting/receipts/dealer
POST /api/v1/accounting/receipts/dealer/hybrid
POST /api/v1/accounting/sales/returns
POST /api/v1/accounting/settlements/dealers
POST /api/v1/accounting/settlements/suppliers
POST /api/v1/accounting/suppliers/payments
POST /api/v1/dispatch/backorder/{slipId}/cancel
POST /api/v1/dispatch/confirm
POST /api/v1/finished-goods
POST /api/v1/finished-goods/{id}/batches
POST /api/v1/hr/attendance/bulk-mark
POST /api/v1/hr/attendance/mark/{employeeId}
POST /api/v1/hr/employees
POST /api/v1/hr/leave-requests
POST /api/v1/hr/payroll-runs
POST /api/v1/inventory/adjustments
POST /api/v1/inventory/opening-stock
POST /api/v1/payroll/runs
POST /api/v1/payroll/runs/monthly
POST /api/v1/payroll/runs/weekly
POST /api/v1/payroll/runs/{id}/approve
POST /api/v1/payroll/runs/{id}/calculate
POST /api/v1/payroll/runs/{id}/mark-paid
POST /api/v1/payroll/runs/{id}/post
POST /api/v1/purchasing/goods-receipts
POST /api/v1/purchasing/purchase-orders
POST /api/v1/purchasing/raw-material-purchases
POST /api/v1/purchasing/raw-material-purchases/returns
POST /api/v1/raw-material-batches/{rawMaterialId}
POST /api/v1/raw-materials/intake
POST /api/v1/suppliers
PUT /api/v1/accounting/catalog/products/{id}
PUT /api/v1/accounting/default-accounts
PUT /api/v1/accounting/raw-materials/{id}
PUT /api/v1/finished-goods/{id}
PUT /api/v1/hr/employees/{id}
PUT /api/v1/suppliers/{id}
```

Deep UI/route guidance:
- `docs/accounting-portal-frontend-engineer-handoff.md`

### A.3 `SALES` tag (33 ops)

```
DELETE /api/v1/sales/orders/{id}
DELETE /api/v1/sales/promotions/{id}
DELETE /api/v1/sales/targets/{id}
GET /api/v1/credit/override-requests
GET /api/v1/invoices
GET /api/v1/invoices/dealers/{dealerId}
GET /api/v1/invoices/{id}
GET /api/v1/invoices/{id}/pdf
GET /api/v1/sales/credit-requests
GET /api/v1/sales/dealers
GET /api/v1/sales/dealers/search
GET /api/v1/sales/orders
GET /api/v1/sales/promotions
GET /api/v1/sales/targets
PATCH /api/v1/sales/orders/{id}/status
POST /api/v1/credit/override-requests
POST /api/v1/credit/override-requests/{id}/approve
POST /api/v1/credit/override-requests/{id}/reject
POST /api/v1/invoices/{id}/email
POST /api/v1/sales/credit-requests
POST /api/v1/sales/credit-requests/{id}/approve
POST /api/v1/sales/credit-requests/{id}/reject
POST /api/v1/sales/dispatch/confirm
POST /api/v1/sales/dispatch/reconcile-order-markers
POST /api/v1/sales/orders
POST /api/v1/sales/orders/{id}/cancel
POST /api/v1/sales/orders/{id}/confirm
POST /api/v1/sales/promotions
POST /api/v1/sales/targets
PUT /api/v1/sales/credit-requests/{id}
PUT /api/v1/sales/orders/{id}
PUT /api/v1/sales/promotions/{id}
PUT /api/v1/sales/targets/{id}
```

### A.4 `FACTORY_PRODUCTION` tag (29 ops)

```
DELETE /api/v1/factory/packaging-mappings/{id}
DELETE /api/v1/factory/production-plans/{id}
GET /api/v1/factory/bulk-batches/{finishedGoodId}
GET /api/v1/factory/bulk-batches/{parentBatchId}/children
GET /api/v1/factory/dashboard
GET /api/v1/factory/packaging-mappings
GET /api/v1/factory/packaging-mappings/active
GET /api/v1/factory/production-batches
GET /api/v1/factory/production-logs/{productionLogId}/packing-history
GET /api/v1/factory/production-plans
GET /api/v1/factory/production/logs
GET /api/v1/factory/production/logs/{id}
GET /api/v1/factory/tasks
GET /api/v1/factory/unpacked-batches
GET /api/v1/production/brands
GET /api/v1/production/brands/{brandId}/products
PATCH /api/v1/factory/production-plans/{id}/status
POST /api/v1/factory/cost-allocation
POST /api/v1/factory/pack
POST /api/v1/factory/packaging-mappings
POST /api/v1/factory/packing-records
POST /api/v1/factory/packing-records/{productionLogId}/complete
POST /api/v1/factory/production-batches
POST /api/v1/factory/production-plans
POST /api/v1/factory/production/logs
POST /api/v1/factory/tasks
PUT /api/v1/factory/packaging-mappings/{id}
PUT /api/v1/factory/production-plans/{id}
PUT /api/v1/factory/tasks/{id}
```

### A.5 `DEALERS` tag (15 ops)

```
GET /api/v1/dealer-portal/aging
GET /api/v1/dealer-portal/dashboard
GET /api/v1/dealer-portal/invoices
GET /api/v1/dealer-portal/invoices/{invoiceId}/pdf
GET /api/v1/dealer-portal/ledger
GET /api/v1/dealer-portal/orders
GET /api/v1/dealers
GET /api/v1/dealers/search
GET /api/v1/dealers/{dealerId}/aging
GET /api/v1/dealers/{dealerId}/invoices
GET /api/v1/dealers/{dealerId}/ledger
POST /api/v1/dealer-portal/credit-requests
POST /api/v1/dealers
POST /api/v1/dealers/{dealerId}/dunning/hold
PUT /api/v1/dealers/{dealerId}
```

### A.6 Untagged (portal-unclassified) ops: `AUDIT` (3 ops)

These endpoints currently have controller-only tags (no `ADMIN/ACCOUNTING/SALES/FACTORY_PRODUCTION/DEALERS` tag):

```
GET /api/v1/audit/business-events
GET /api/v1/audit/ml-events
POST /api/v1/audit/ml-events
```

Recommended UI ownership:
- Admin portal → Diagnostics → Audit/Events
- Accounting portal → Audit/Posting activity (read-only)

---

## B) Code-only endpoints missing from `openapi.json` (must be planned)

These endpoints exist in the latest backend code but are missing from the OpenAPI snapshot.

### B.1 Superadmin / tenant lifecycle + runtime policy (companies)

Source: `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/company/controller/CompanyController.java`

- `POST /api/v1/companies/{id}/lifecycle-state`
- `GET /api/v1/companies/{id}/tenant-metrics`
- `PUT /api/v1/companies/{id}/tenant-runtime/policy`

### B.2 Admin tenant runtime metrics/policy (admin)

Source: `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/admin/controller/AdminSettingsController.java`

- `GET /api/v1/admin/tenant-runtime/metrics`
- `PUT /api/v1/admin/tenant-runtime/policy`

---

## C) Regeneration helpers (for maintainers)

This doc is static, but the OpenAPI-derived parts can be regenerated using `jq`.

Example (ADMIN tag):
```bash
jq -r '
  def ishttp(m): m=="get" or m=="post" or m=="put" or m=="patch" or m=="delete";
  .paths | to_entries[] | .key as $p | .value | to_entries[]
  | select(ishttp(.key))
  | select((.value.tags//[]) | index("ADMIN"))
  | "\\(.key|ascii_upcase) \\($p)"
' openapi.json | sort
```


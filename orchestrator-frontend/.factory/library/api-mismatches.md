# API Mismatches (Frontend vs Backend)

Critical mismatches discovered during codebase investigation. Workers MUST fix these.

## CRITICAL - 404 Errors (Wrong Paths)

| Frontend Call | Backend Actual | Module |
|---|---|---|
| `GET/POST /sales/credit-requests` | `/credit/limit-requests` | Sales |
| `POST /sales/credit-requests/{id}/approve` | `/credit/limit-requests/{id}/approve` | Sales |
| `POST /sales/credit-requests/{id}/reject` | `/credit/limit-requests/{id}/reject` | Sales |
| `POST /sales/dispatch/confirm` | `/dispatch/confirm` (no /sales prefix) | Sales/Dispatch |
| `GET/POST /support/tickets` (dealer) | `/dealer-portal/support/tickets` | Dealer |
| `GET /admin/exports/pending` | No endpoint; use `/admin/approvals` (returns exportApprovals array) | Admin |
| `POST /superadmin/tenants/{id}/activate` | `PUT /superadmin/tenants/{id}/lifecycle` (single endpoint) | Superadmin |
| `POST /superadmin/tenants/{id}/suspend` | `PUT /superadmin/tenants/{id}/lifecycle` | Superadmin |
| `POST /superadmin/tenants/{id}/deactivate` | `PUT /superadmin/tenants/{id}/lifecycle` | Superadmin |
| `GET /catalog/products` | `/catalog/items` (not products) | Catalog |
| `POST /accounting/catalog/products/bulk-variants` | Does NOT exist | Catalog |
| `POST /factory/packing-records/{id}/complete` | Does NOT exist in backend | Factory |

## CRITICAL - 403 Errors (Wrong RBAC)

| Frontend Call | Issue | Fix |
|---|---|---|
| `POST /admin/changelog` | Backend: `/superadmin/changelog` (SUPER_ADMIN only) | Move changelog CRUD to superadmin portal |
| `PUT /admin/settings` | Requires SUPER_ADMIN (not tenant admin) | Add client-side RBAC guard |

## CRITICAL - Response Shape Mismatches

| Frontend Expects | Backend Returns | Endpoint |
|---|---|---|
| `PageResponse<DealerDto>` | `List<DealerResponse>` (no pagination) | `GET /dealers` |
| `sku` field | `code` field | `/catalog/items` |
| `colors[]`, `sizes[]` arrays | Single `color`, `size` values | `/catalog/items` POST |
| Missing `itemClass` field | Required: FINISHED_GOOD, RAW_MATERIAL, PACKAGING_RAW_MATERIAL | `/catalog/items` POST |

## CRITICAL - Missing Backend Endpoints

| Expected | Notes |
|---|---|
| `GET /sales/orders/{id}` | Frontend fetches ALL orders then filters client-side (perf issue) |
| `GET /superadmin/tenants/{id}/modules` | Only PUT exists (no GET to load current state) |

## Status Enum Mismatches

### Production Plans
| Frontend | Backend |
|---|---|
| `DRAFT` | `PLANNED` (default) |

### Dispatch Slips
| Frontend (wrong) | Backend (actual) |
|---|---|
| `CONFIRMED` | `RESERVED` |
| `DELIVERED` | Does not exist |
| Missing | `PENDING_STOCK` |
| Missing | `PENDING_PRODUCTION` |

### Production Logs
| Frontend (missing) | Backend |
|---|---|
| Not shown | `MIXED` (default status) |

## Deprecated Endpoints (410 Gone - Do NOT Use)

| Deprecated | Replacement |
|---|---|
| `POST /orchestrator/dispatch` | `/dispatch/confirm` |
| `POST /orchestrator/dispatch/{orderId}` | `/dispatch/confirm` |
| `POST /orchestrator/payroll/run` | `/payroll/runs` |
| `POST /auth/password/forgot/superadmin` | `/auth/password/forgot` |
| `GET/POST /hr/payroll-runs` | `/payroll/runs` |
| `GET /accounting/audit/digest` | @Deprecated |
| `GET /accounting/audit/digest.csv` | @Deprecated |

## Retired/Empty Controllers (Do NOT Build UI For)

- `AccountingCatalogController` - empty final class (retired)
- `ProductionCatalogController` - empty final class (retired)
- All `/accounting/catalog/**` paths - replaced by `/catalog/**`

## HR/Payroll - ON HOLD

HR/Payroll module is on hold from the backend side. Do NOT build frontend UI for:
- Employee management
- Attendance tracking
- Leave requests
- Payroll runs
- Salary structures

Remove existing HR/Payroll nav items and pages from the accounting portal.

# RBAC Boundaries

Backend role hierarchy: `ROLE_SUPER_ADMIN > ROLE_ADMIN` (superadmin inherits all admin permissions).

## Roles and Their Portal Access

| Role | Portal | Default Permissions |
|---|---|---|
| `ROLE_SUPER_ADMIN` | Superadmin | All permissions (inherits ADMIN) |
| `ROLE_ADMIN` | Admin | `portal:accounting`, `portal:factory`, `portal:sales`, `portal:dealer`, `dispatch.confirm`, `factory.dispatch`, `payroll.run` |
| `ROLE_ACCOUNTING` | Accounting | `portal:accounting`, `dispatch.confirm`, `payroll.run` |
| `ROLE_FACTORY` | Factory | `portal:factory`, `dispatch.confirm`, `factory.dispatch` |
| `ROLE_SALES` | Sales | `portal:sales` |
| `ROLE_DEALER` | Dealer | `portal:dealer` |

## Key RBAC Rules (Frontend Must Enforce)

### Superadmin-Only Actions
- Changelog create/update/delete (`/superadmin/changelog`)
- Settings update (`PUT /admin/settings`)
- Period reopen (`/accounting/periods/{id}/reopen`)
- Tenant lifecycle management (`/superadmin/tenants/{id}/lifecycle`)
- Supplier statement/aging PDFs (`/accounting/statements/suppliers/{id}/pdf`, `/accounting/aging/suppliers/{id}/pdf`)

### Admin-Only Actions (Not Accounting)
- Period close approval/rejection (`/accounting/periods/{id}/approve-close`, `reject-close`)
- Portal dashboard/operations/workforce (`/portal/dashboard`, `/portal/operations`, `/portal/workforce`)
- Invoice PDF download (`/invoices/{id}/pdf`)
- Sales targets create/update/delete

### Permission-Gated Actions
- Dispatch confirm: requires role (ADMIN/FACTORY) AND `dispatch.confirm` permission
- Financial dispatch reconcile: requires role (ADMIN/ACCOUNTING) AND `dispatch.confirm` permission

### Cross-Portal Read Access
- Sales orders: ADMIN, SALES, FACTORY, ACCOUNTING can all read
- Dealers list: ADMIN, SALES, ACCOUNTING
- Finished goods read: ADMIN, FACTORY, SALES, ACCOUNTING
- Finished goods write: ADMIN, FACTORY only (NOT ACCOUNTING)
- Finished goods batches: ADMIN, FACTORY, SALES (NOT ACCOUNTING)
- Low-stock alerts: ADMIN, FACTORY, SALES (NOT ACCOUNTING)
- Suppliers read: ADMIN, ACCOUNTING, FACTORY
- Suppliers write: ADMIN, ACCOUNTING only
- Raw materials read: ADMIN, ACCOUNTING, FACTORY
- Sales returns: ADMIN, ACCOUNTING, SALES

### Tenant Admin vs Superadmin Distinction
- Tenant admin manages WITHIN their tenant only
- Tenant admin CANNOT: access /superadmin/**, manage changelog, cross tenant boundaries, assign superadmin authority, modify platform settings
- Superadmin sees platform/control-plane truth across tenants - NOT automatic ownership of all tenant business data
- Audit trail split: Superadmin sees platform audit; Tenant admin sees tenant business audit only

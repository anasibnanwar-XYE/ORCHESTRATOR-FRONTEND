# DEALER Portal API Contracts

Canonical source: `openapi.json`
Generated at (UTC): `2026-02-23T18:20:38Z`
Source SHA256: `33ddd163c102607970ff0f4c45e95f0c2a9d2965749187f68beb5c012216efa1`

## Coverage

- Primary-owned operations: `7`
- Shared foundation operations: `13`
- Accessible cross-portal operations: `0`

## Shared Foundation APIs

| Method | Path | Prefix | Operation |
| --- | --- | --- | --- |
| POST | /api/v1/auth/login | auth | login |
| POST | /api/v1/auth/logout | auth | logout |
| GET | /api/v1/auth/me | auth | me |
| POST | /api/v1/auth/mfa/activate | auth | activate |
| POST | /api/v1/auth/mfa/disable | auth | disable |
| POST | /api/v1/auth/mfa/setup | auth | setup |
| POST | /api/v1/auth/password/change | auth | changePassword |
| POST | /api/v1/auth/password/forgot | auth | forgotPassword |
| POST | /api/v1/auth/password/reset | auth | resetPassword |
| GET | /api/v1/auth/profile | auth | profile |
| PUT | /api/v1/auth/profile | auth | update_1 |
| POST | /api/v1/auth/refresh-token | auth | refresh |
| POST | /api/v1/multi-company/companies/switch | multi-company | switchCompany |

## Primary-Owned Endpoints

| Method | Path | Prefix | Tag | Operation | Summary |
| --- | --- | --- | --- | --- | --- |
| GET | /api/v1/dealer-portal/aging | dealer-portal | dealer-portal-controller | getMyAging | - |
| POST | /api/v1/dealer-portal/credit-requests | dealer-portal | dealer-portal-controller | createCreditRequest_1 | - |
| GET | /api/v1/dealer-portal/dashboard | dealer-portal | dealer-portal-controller | getDashboard | - |
| GET | /api/v1/dealer-portal/invoices | dealer-portal | dealer-portal-controller | getMyInvoices | - |
| GET | /api/v1/dealer-portal/invoices/{invoiceId}/pdf | dealer-portal | dealer-portal-controller | getMyInvoicePdf | Download invoice PDF (dealer scoped) |
| GET | /api/v1/dealer-portal/ledger | dealer-portal | dealer-portal-controller | getMyLedger | - |
| GET | /api/v1/dealer-portal/orders | dealer-portal | dealer-portal-controller | getMyOrders | - |

## Accessible Cross-Portal Endpoints

| Method | Path | Primary Portal | Prefix | Operation |
| --- | --- | --- | --- | --- |

## Regeneration

`python3 scripts/generate_frontend_portal_contracts.py --input /Users/anas/Documents/orchestrator_erp/bigbrightpaints-erp/openapi.json --md-out docs/frontend/PORTAL_API_CONTRACTS.md --json-out docs/frontend/PORTAL_API_CONTRACTS.json --per-portal-dir docs/frontend/portals`

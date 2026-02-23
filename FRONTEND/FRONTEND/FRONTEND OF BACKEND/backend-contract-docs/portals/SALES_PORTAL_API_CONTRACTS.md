# SALES Portal API Contracts

Canonical source: `openapi.json`
Generated at (UTC): `2026-02-23T18:20:38Z`
Source SHA256: `33ddd163c102607970ff0f4c45e95f0c2a9d2965749187f68beb5c012216efa1`

## Coverage

- Primary-owned operations: `36`
- Shared foundation operations: `13`
- Accessible cross-portal operations: `26`

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
| GET | /api/v1/credit/override-requests | credit | credit-limit-override-controller | listRequests | - |
| POST | /api/v1/credit/override-requests | credit | credit-limit-override-controller | createRequest | - |
| POST | /api/v1/credit/override-requests/{id}/approve | credit | credit-limit-override-controller | approveRequest | - |
| POST | /api/v1/credit/override-requests/{id}/reject | credit | credit-limit-override-controller | rejectRequest | - |
| GET | /api/v1/dealers | dealers | dealer-controller | listDealers_1 | - |
| POST | /api/v1/dealers | dealers | dealer-controller | createDealer | - |
| GET | /api/v1/dealers/search | dealers | dealer-controller | searchDealers_1 | - |
| PUT | /api/v1/dealers/{dealerId} | dealers | dealer-controller | updateDealer | - |
| GET | /api/v1/dealers/{dealerId}/aging | dealers | dealer-controller | dealerAging | - |
| POST | /api/v1/dealers/{dealerId}/dunning/hold | dealers | dealer-controller | holdIfOverdue | - |
| GET | /api/v1/dealers/{dealerId}/invoices | dealers | dealer-controller | dealerInvoices_1 | - |
| GET | /api/v1/dealers/{dealerId}/ledger | dealers | dealer-controller | dealerLedger | - |
| GET | /api/v1/sales/credit-requests | sales | sales-controller | creditRequests | - |
| POST | /api/v1/sales/credit-requests | sales | sales-controller | createCreditRequest | - |
| PUT | /api/v1/sales/credit-requests/{id} | sales | sales-controller | updateCreditRequest | - |
| POST | /api/v1/sales/credit-requests/{id}/approve | sales | sales-controller | approveCreditRequest | - |
| POST | /api/v1/sales/credit-requests/{id}/reject | sales | sales-controller | rejectCreditRequest | - |
| GET | /api/v1/sales/dealers | sales | sales-controller | listDealers | - |
| GET | /api/v1/sales/dealers/search | sales | sales-controller | searchDealers | - |
| POST | /api/v1/sales/dispatch/confirm | sales | sales-controller | confirmDispatch | - |
| POST | /api/v1/sales/dispatch/reconcile-order-markers | sales | sales-controller | reconcileOrderMarkers | - |
| GET | /api/v1/sales/orders | sales | sales-controller | orders | - |
| POST | /api/v1/sales/orders | sales | sales-controller | createOrder | - |
| PUT | /api/v1/sales/orders/{id} | sales | sales-controller | updateOrder | - |
| DELETE | /api/v1/sales/orders/{id} | sales | sales-controller | deleteOrder | - |
| POST | /api/v1/sales/orders/{id}/cancel | sales | sales-controller | cancelOrder | - |
| POST | /api/v1/sales/orders/{id}/confirm | sales | sales-controller | confirmOrder | - |
| PATCH | /api/v1/sales/orders/{id}/status | sales | sales-controller | updateStatus | - |
| GET | /api/v1/sales/promotions | sales | sales-controller | promotions | - |
| POST | /api/v1/sales/promotions | sales | sales-controller | createPromotion | - |
| PUT | /api/v1/sales/promotions/{id} | sales | sales-controller | updatePromotion | - |
| DELETE | /api/v1/sales/promotions/{id} | sales | sales-controller | deletePromotion | - |
| GET | /api/v1/sales/targets | sales | sales-controller | targets | - |
| POST | /api/v1/sales/targets | sales | sales-controller | createTarget | - |
| PUT | /api/v1/sales/targets/{id} | sales | sales-controller | updateTarget | - |
| DELETE | /api/v1/sales/targets/{id} | sales | sales-controller | deleteTarget | - |

## Accessible Cross-Portal Endpoints

| Method | Path | Primary Portal | Prefix | Operation |
| --- | --- | --- | --- | --- |
| GET | /api/v1/companies | ADMIN | companies | list_1 |
| POST | /api/v1/companies | ADMIN | companies | create_1 |
| PUT | /api/v1/companies/{id} | ADMIN | companies | update |
| DELETE | /api/v1/companies/{id} | ADMIN | companies | delete |
| POST | /api/v1/dispatch/backorder/{slipId}/cancel | FACTORY | dispatch | cancelBackorder |
| POST | /api/v1/dispatch/confirm | FACTORY | dispatch | confirmDispatch_1 |
| GET | /api/v1/dispatch/order/{orderId} | FACTORY | dispatch | getPackagingSlipByOrder |
| GET | /api/v1/dispatch/pending | FACTORY | dispatch | getPendingSlips |
| GET | /api/v1/dispatch/preview/{slipId} | FACTORY | dispatch | getDispatchPreview |
| GET | /api/v1/dispatch/slip/{slipId} | FACTORY | dispatch | getPackagingSlip |
| PATCH | /api/v1/dispatch/slip/{slipId}/status | FACTORY | dispatch | updateSlipStatus |
| GET | /api/v1/finished-goods | FACTORY | finished-goods | listFinishedGoods |
| POST | /api/v1/finished-goods | FACTORY | finished-goods | createFinishedGood |
| GET | /api/v1/finished-goods/low-stock | FACTORY | finished-goods | getLowStockItems |
| GET | /api/v1/finished-goods/stock-summary | FACTORY | finished-goods | getStockSummary |
| GET | /api/v1/finished-goods/{id} | FACTORY | finished-goods | getFinishedGood |
| PUT | /api/v1/finished-goods/{id} | FACTORY | finished-goods | updateFinishedGood |
| GET | /api/v1/finished-goods/{id}/batches | FACTORY | finished-goods | listBatches |
| POST | /api/v1/finished-goods/{id}/batches | FACTORY | finished-goods | registerBatch |
| GET | /api/v1/invoices | ACCOUNTANT | invoices | listInvoices |
| GET | /api/v1/invoices/dealers/{dealerId} | ACCOUNTANT | invoices | dealerInvoices |
| GET | /api/v1/invoices/{id} | ACCOUNTANT | invoices | getInvoice |
| POST | /api/v1/invoices/{id}/email | ACCOUNTANT | invoices | sendInvoiceEmail |
| GET | /api/v1/invoices/{id}/pdf | ACCOUNTANT | invoices | downloadInvoicePdf |
| GET | /api/v1/production/brands | FACTORY | production | listBrands |
| GET | /api/v1/production/brands/{brandId}/products | FACTORY | production | listBrandProducts |

## Regeneration

`python3 scripts/generate_frontend_portal_contracts.py --input /Users/anas/Documents/orchestrator_erp/bigbrightpaints-erp/openapi.json --md-out docs/frontend/PORTAL_API_CONTRACTS.md --json-out docs/frontend/PORTAL_API_CONTRACTS.json --per-portal-dir docs/frontend/portals`

# FACTORY Portal API Contracts

Canonical source: `openapi.json`
Generated at (UTC): `2026-02-23T18:20:38Z`
Source SHA256: `33ddd163c102607970ff0f4c45e95f0c2a9d2965749187f68beb5c012216efa1`

## Coverage

- Primary-owned operations: `44`
- Shared foundation operations: `13`
- Accessible cross-portal operations: `17`

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
| POST | /api/v1/dispatch/backorder/{slipId}/cancel | dispatch | dispatch-controller | cancelBackorder | - |
| POST | /api/v1/dispatch/confirm | dispatch | dispatch-controller | confirmDispatch_1 | - |
| GET | /api/v1/dispatch/order/{orderId} | dispatch | dispatch-controller | getPackagingSlipByOrder | - |
| GET | /api/v1/dispatch/pending | dispatch | dispatch-controller | getPendingSlips | - |
| GET | /api/v1/dispatch/preview/{slipId} | dispatch | dispatch-controller | getDispatchPreview | - |
| GET | /api/v1/dispatch/slip/{slipId} | dispatch | dispatch-controller | getPackagingSlip | - |
| PATCH | /api/v1/dispatch/slip/{slipId}/status | dispatch | dispatch-controller | updateSlipStatus | - |
| GET | /api/v1/factory/bulk-batches/{finishedGoodId} | factory | packing-controller | listBulkBatches | - |
| GET | /api/v1/factory/bulk-batches/{parentBatchId}/children | factory | packing-controller | listChildBatches | - |
| POST | /api/v1/factory/cost-allocation | factory | factory-controller | allocateCosts | - |
| GET | /api/v1/factory/dashboard | factory | factory-controller | dashboard_1 | - |
| POST | /api/v1/factory/pack | factory | packing-controller | packBulkToSizes | - |
| GET | /api/v1/factory/packaging-mappings | factory | packaging-mapping-controller | listMappings | - |
| POST | /api/v1/factory/packaging-mappings | factory | packaging-mapping-controller | createMapping | - |
| GET | /api/v1/factory/packaging-mappings/active | factory | packaging-mapping-controller | listActiveMappings | - |
| PUT | /api/v1/factory/packaging-mappings/{id} | factory | packaging-mapping-controller | updateMapping | - |
| DELETE | /api/v1/factory/packaging-mappings/{id} | factory | packaging-mapping-controller | deactivateMapping | - |
| POST | /api/v1/factory/packing-records | factory | packing-controller | recordPacking | - |
| POST | /api/v1/factory/packing-records/{productionLogId}/complete | factory | packing-controller | completePacking | - |
| GET | /api/v1/factory/production-batches | factory | factory-controller | batches_1 | - |
| POST | /api/v1/factory/production-batches | factory | factory-controller | logBatch | - |
| GET | /api/v1/factory/production-logs/{productionLogId}/packing-history | factory | packing-controller | packingHistory | - |
| GET | /api/v1/factory/production-plans | factory | factory-controller | plans | - |
| POST | /api/v1/factory/production-plans | factory | factory-controller | createPlan | - |
| PUT | /api/v1/factory/production-plans/{id} | factory | factory-controller | updatePlan | - |
| DELETE | /api/v1/factory/production-plans/{id} | factory | factory-controller | deletePlan | - |
| PATCH | /api/v1/factory/production-plans/{id}/status | factory | factory-controller | updatePlanStatus | - |
| GET | /api/v1/factory/production/logs | factory | production-log-controller | list | - |
| POST | /api/v1/factory/production/logs | factory | production-log-controller | create | - |
| GET | /api/v1/factory/production/logs/{id} | factory | production-log-controller | detail | - |
| GET | /api/v1/factory/tasks | factory | factory-controller | tasks | - |
| POST | /api/v1/factory/tasks | factory | factory-controller | createTask | - |
| PUT | /api/v1/factory/tasks/{id} | factory | factory-controller | updateTask | - |
| GET | /api/v1/factory/unpacked-batches | factory | packing-controller | listUnpackedBatches | - |
| GET | /api/v1/finished-goods | finished-goods | finished-good-controller | listFinishedGoods | - |
| POST | /api/v1/finished-goods | finished-goods | finished-good-controller | createFinishedGood | - |
| GET | /api/v1/finished-goods/low-stock | finished-goods | finished-good-controller | getLowStockItems | - |
| GET | /api/v1/finished-goods/stock-summary | finished-goods | finished-good-controller | getStockSummary | - |
| GET | /api/v1/finished-goods/{id} | finished-goods | finished-good-controller | getFinishedGood | - |
| PUT | /api/v1/finished-goods/{id} | finished-goods | finished-good-controller | updateFinishedGood | - |
| GET | /api/v1/finished-goods/{id}/batches | finished-goods | finished-good-controller | listBatches | - |
| POST | /api/v1/finished-goods/{id}/batches | finished-goods | finished-good-controller | registerBatch | - |
| GET | /api/v1/production/brands | production | production-catalog-controller | listBrands | - |
| GET | /api/v1/production/brands/{brandId}/products | production | production-catalog-controller | listBrandProducts | - |

## Accessible Cross-Portal Endpoints

| Method | Path | Primary Portal | Prefix | Operation |
| --- | --- | --- | --- | --- |
| GET | /api/v1/credit/override-requests | SALES | credit | listRequests |
| POST | /api/v1/credit/override-requests | SALES | credit | createRequest |
| POST | /api/v1/credit/override-requests/{id}/approve | SALES | credit | approveRequest |
| POST | /api/v1/credit/override-requests/{id}/reject | SALES | credit | rejectRequest |
| GET | /api/v1/inventory/adjustments | ACCOUNTANT | inventory | listAdjustments |
| POST | /api/v1/inventory/adjustments | ACCOUNTANT | inventory | createAdjustment |
| POST | /api/v1/inventory/opening-stock | ACCOUNTANT | inventory | importOpeningStock |
| GET | /api/v1/raw-material-batches/{rawMaterialId} | ACCOUNTANT | raw-material-batches | batches |
| POST | /api/v1/raw-material-batches/{rawMaterialId} | ACCOUNTANT | raw-material-batches | createBatch |
| POST | /api/v1/raw-materials/intake | ACCOUNTANT | raw-materials | intake |
| GET | /api/v1/raw-materials/stock | ACCOUNTANT | raw-materials | stockSummary |
| GET | /api/v1/raw-materials/stock/inventory | ACCOUNTANT | raw-materials | inventory |
| GET | /api/v1/raw-materials/stock/low-stock | ACCOUNTANT | raw-materials | lowStock |
| GET | /api/v1/suppliers | ACCOUNTANT | suppliers | listSuppliers |
| POST | /api/v1/suppliers | ACCOUNTANT | suppliers | createSupplier |
| GET | /api/v1/suppliers/{id} | ACCOUNTANT | suppliers | getSupplier |
| PUT | /api/v1/suppliers/{id} | ACCOUNTANT | suppliers | updateSupplier |

## Regeneration

`python3 scripts/generate_frontend_portal_contracts.py --input /Users/anas/Documents/orchestrator_erp/bigbrightpaints-erp/openapi.json --md-out docs/frontend/PORTAL_API_CONTRACTS.md --json-out docs/frontend/PORTAL_API_CONTRACTS.json --per-portal-dir docs/frontend/portals`

# ADMIN Portal API Contracts

Canonical source: `openapi.json`
Generated at (UTC): `2026-02-23T18:20:38Z`
Source SHA256: `33ddd163c102607970ff0f4c45e95f0c2a9d2965749187f68beb5c012216efa1`

## Coverage

- Primary-owned operations: `38`
- Shared foundation operations: `13`
- Accessible cross-portal operations: `218`

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
| GET | /api/integration/health | integration | integration-health-controller | health_1 | - |
| GET | /api/v1/admin/approvals | admin | admin-settings-controller | approvals | - |
| POST | /api/v1/admin/notify | admin | admin-settings-controller | notifyUser | - |
| GET | /api/v1/admin/roles | admin | role-controller | listRoles | - |
| POST | /api/v1/admin/roles | admin | role-controller | createRole | - |
| GET | /api/v1/admin/roles/{roleKey} | admin | role-controller | getRoleByKey | - |
| GET | /api/v1/admin/settings | admin | admin-settings-controller | getSettings | - |
| PUT | /api/v1/admin/settings | admin | admin-settings-controller | updateSettings | - |
| GET | /api/v1/admin/users | admin | admin-user-controller | list_2 | - |
| POST | /api/v1/admin/users | admin | admin-user-controller | create_2 | - |
| PUT | /api/v1/admin/users/{id} | admin | admin-user-controller | update_2 | - |
| DELETE | /api/v1/admin/users/{id} | admin | admin-user-controller | delete_1 | - |
| PATCH | /api/v1/admin/users/{id}/mfa/disable | admin | admin-user-controller | disableMfa | - |
| PATCH | /api/v1/admin/users/{id}/suspend | admin | admin-user-controller | suspend | - |
| PATCH | /api/v1/admin/users/{id}/unsuspend | admin | admin-user-controller | unsuspend | - |
| GET | /api/v1/audit/business-events | audit | enterprise-audit-trail-controller | businessEvents | - |
| GET | /api/v1/audit/ml-events | audit | enterprise-audit-trail-controller | mlEvents | - |
| POST | /api/v1/audit/ml-events | audit | enterprise-audit-trail-controller | ingestMlEvents | - |
| GET | /api/v1/companies | companies | company-controller | list_1 | - |
| POST | /api/v1/companies | companies | company-controller | create_1 | - |
| PUT | /api/v1/companies/{id} | companies | company-controller | update | - |
| DELETE | /api/v1/companies/{id} | companies | company-controller | delete | - |
| GET | /api/v1/demo/ping | demo | demo-controller | ping | - |
| GET | /api/v1/orchestrator/dashboard/admin | orchestrator | dashboard-controller | adminDashboard | - |
| GET | /api/v1/orchestrator/dashboard/factory | orchestrator | dashboard-controller | factoryDashboard | - |
| GET | /api/v1/orchestrator/dashboard/finance | orchestrator | dashboard-controller | financeDashboard | - |
| POST | /api/v1/orchestrator/dispatch | orchestrator | orchestrator-controller | dispatchOrder | - |
| POST | /api/v1/orchestrator/dispatch/{orderId} | orchestrator | orchestrator-controller | dispatchOrderAlias | - |
| POST | /api/v1/orchestrator/factory/dispatch/{batchId} | orchestrator | orchestrator-controller | dispatch | - |
| GET | /api/v1/orchestrator/health/events | orchestrator | orchestrator-controller | eventHealth | - |
| GET | /api/v1/orchestrator/health/integrations | orchestrator | orchestrator-controller | integrationsHealth | - |
| POST | /api/v1/orchestrator/orders/{orderId}/approve | orchestrator | orchestrator-controller | approveOrder | - |
| POST | /api/v1/orchestrator/orders/{orderId}/fulfillment | orchestrator | orchestrator-controller | fulfillOrder | - |
| POST | /api/v1/orchestrator/payroll/run | orchestrator | orchestrator-controller | runPayroll | - |
| GET | /api/v1/orchestrator/traces/{traceId} | orchestrator | orchestrator-controller | trace | - |
| GET | /api/v1/portal/dashboard | portal | portal-insights-controller | dashboard | - |
| GET | /api/v1/portal/operations | portal | portal-insights-controller | operations | - |
| GET | /api/v1/portal/workforce | portal | portal-insights-controller | workforce | - |

## Accessible Cross-Portal Endpoints

| Method | Path | Primary Portal | Prefix | Operation |
| --- | --- | --- | --- | --- |
| GET | /api/v1/accounting/accounts | ACCOUNTANT | accounting | accounts |
| POST | /api/v1/accounting/accounts | ACCOUNTANT | accounting | createAccount |
| GET | /api/v1/accounting/accounts/tree | ACCOUNTANT | accounting | getChartOfAccountsTree |
| GET | /api/v1/accounting/accounts/tree/{type} | ACCOUNTANT | accounting | getAccountTreeByType |
| GET | /api/v1/accounting/accounts/{accountId}/activity | ACCOUNTANT | accounting | getAccountActivity |
| GET | /api/v1/accounting/accounts/{accountId}/balance/as-of | ACCOUNTANT | accounting | getBalanceAsOf |
| GET | /api/v1/accounting/accounts/{accountId}/balance/compare | ACCOUNTANT | accounting | compareBalances |
| POST | /api/v1/accounting/accruals | ACCOUNTANT | accounting | postAccrual |
| GET | /api/v1/accounting/aging/dealers/{dealerId} | ACCOUNTANT | accounting | dealerAging_1 |
| GET | /api/v1/accounting/aging/dealers/{dealerId}/pdf | ACCOUNTANT | accounting | dealerAgingPdf |
| GET | /api/v1/accounting/aging/suppliers/{supplierId} | ACCOUNTANT | accounting | supplierAging |
| GET | /api/v1/accounting/aging/suppliers/{supplierId}/pdf | ACCOUNTANT | accounting | supplierAgingPdf |
| GET | /api/v1/accounting/audit/digest | ACCOUNTANT | accounting | auditDigest |
| GET | /api/v1/accounting/audit/digest.csv | ACCOUNTANT | accounting | auditDigestCsv |
| GET | /api/v1/accounting/audit/transactions | ACCOUNTANT | accounting | transactionAudit |
| GET | /api/v1/accounting/audit/transactions/{journalEntryId} | ACCOUNTANT | accounting | transactionAuditDetail |
| POST | /api/v1/accounting/bad-debts/write-off | ACCOUNTANT | accounting | writeOffBadDebt |
| POST | /api/v1/accounting/catalog/import | ACCOUNTANT | accounting | importCatalog |
| GET | /api/v1/accounting/catalog/products | ACCOUNTANT | accounting | listProducts |
| POST | /api/v1/accounting/catalog/products | ACCOUNTANT | accounting | createProduct |
| POST | /api/v1/accounting/catalog/products/bulk-variants | ACCOUNTANT | accounting | createVariants |
| PUT | /api/v1/accounting/catalog/products/{id} | ACCOUNTANT | accounting | updateProduct |
| GET | /api/v1/accounting/configuration/health | ACCOUNTANT | accounting | health |
| POST | /api/v1/accounting/credit-notes | ACCOUNTANT | accounting | postCreditNote |
| GET | /api/v1/accounting/date-context | ACCOUNTANT | accounting | getAccountingDateContext |
| POST | /api/v1/accounting/debit-notes | ACCOUNTANT | accounting | postDebitNote |
| GET | /api/v1/accounting/default-accounts | ACCOUNTANT | accounting | defaultAccounts |
| PUT | /api/v1/accounting/default-accounts | ACCOUNTANT | accounting | updateDefaultAccounts |
| GET | /api/v1/accounting/gst/return | ACCOUNTANT | accounting | generateGstReturn |
| POST | /api/v1/accounting/inventory/landed-cost | ACCOUNTANT | accounting | recordLandedCost |
| POST | /api/v1/accounting/inventory/revaluation | ACCOUNTANT | accounting | revalueInventory |
| POST | /api/v1/accounting/inventory/wip-adjustment | ACCOUNTANT | accounting | adjustWip |
| GET | /api/v1/accounting/journal-entries | ACCOUNTANT | accounting | journalEntries |
| POST | /api/v1/accounting/journal-entries | ACCOUNTANT | accounting | createJournalEntry |
| POST | /api/v1/accounting/journal-entries/{entryId}/cascade-reverse | ACCOUNTANT | accounting | cascadeReverseJournalEntry |
| POST | /api/v1/accounting/journal-entries/{entryId}/reverse | ACCOUNTANT | accounting | reverseJournalEntry |
| GET | /api/v1/accounting/month-end/checklist | ACCOUNTANT | accounting | checklist |
| POST | /api/v1/accounting/month-end/checklist/{periodId} | ACCOUNTANT | accounting | updateChecklist |
| POST | /api/v1/accounting/payroll/payments | ACCOUNTANT | accounting | recordPayrollPayment |
| POST | /api/v1/accounting/payroll/payments/batch | ACCOUNTANT | accounting | processBatchPayment |
| GET | /api/v1/accounting/periods | ACCOUNTANT | accounting | listPeriods |
| POST | /api/v1/accounting/periods/{periodId}/close | ACCOUNTANT | accounting | closePeriod |
| POST | /api/v1/accounting/periods/{periodId}/lock | ACCOUNTANT | accounting | lockPeriod |
| POST | /api/v1/accounting/periods/{periodId}/reopen | ACCOUNTANT | accounting | reopenPeriod |
| GET | /api/v1/accounting/raw-materials | ACCOUNTANT | accounting | listRawMaterials |
| POST | /api/v1/accounting/raw-materials | ACCOUNTANT | accounting | createRawMaterial |
| PUT | /api/v1/accounting/raw-materials/{id} | ACCOUNTANT | accounting | updateRawMaterial |
| DELETE | /api/v1/accounting/raw-materials/{id} | ACCOUNTANT | accounting | deleteRawMaterial |
| POST | /api/v1/accounting/receipts/dealer | ACCOUNTANT | accounting | recordDealerReceipt |
| POST | /api/v1/accounting/receipts/dealer/hybrid | ACCOUNTANT | accounting | recordDealerHybridReceipt |
| GET | /api/v1/accounting/reports/aged-debtors | ACCOUNTANT | accounting | agedDebtors |
| GET | /api/v1/accounting/reports/aging/dealer/{dealerId} | ACCOUNTANT | accounting | getDealerAging |
| GET | /api/v1/accounting/reports/aging/dealer/{dealerId}/detailed | ACCOUNTANT | accounting | getDealerAgingDetailed |
| GET | /api/v1/accounting/reports/aging/receivables | ACCOUNTANT | accounting | getAgedReceivables |
| GET | /api/v1/accounting/reports/balance-sheet/hierarchy | ACCOUNTANT | accounting | getBalanceSheetHierarchy |
| GET | /api/v1/accounting/reports/dso/dealer/{dealerId} | ACCOUNTANT | accounting | getDealerDSO |
| GET | /api/v1/accounting/reports/income-statement/hierarchy | ACCOUNTANT | accounting | getIncomeStatementHierarchy |
| GET | /api/v1/accounting/sales/returns | ACCOUNTANT | accounting | listSalesReturns |
| POST | /api/v1/accounting/sales/returns | ACCOUNTANT | accounting | recordSalesReturn |
| POST | /api/v1/accounting/settlements/dealers | ACCOUNTANT | accounting | settleDealer |
| POST | /api/v1/accounting/settlements/suppliers | ACCOUNTANT | accounting | settleSupplier |
| GET | /api/v1/accounting/statements/dealers/{dealerId} | ACCOUNTANT | accounting | dealerStatement |
| GET | /api/v1/accounting/statements/dealers/{dealerId}/pdf | ACCOUNTANT | accounting | dealerStatementPdf |
| GET | /api/v1/accounting/statements/suppliers/{supplierId} | ACCOUNTANT | accounting | supplierStatement |
| GET | /api/v1/accounting/statements/suppliers/{supplierId}/pdf | ACCOUNTANT | accounting | supplierStatementPdf |
| POST | /api/v1/accounting/suppliers/payments | ACCOUNTANT | accounting | recordSupplierPayment |
| GET | /api/v1/accounting/trial-balance/as-of | ACCOUNTANT | accounting | getTrialBalanceAsOf |
| GET | /api/v1/credit/override-requests | SALES | credit | listRequests |
| POST | /api/v1/credit/override-requests | SALES | credit | createRequest |
| POST | /api/v1/credit/override-requests/{id}/approve | SALES | credit | approveRequest |
| POST | /api/v1/credit/override-requests/{id}/reject | SALES | credit | rejectRequest |
| GET | /api/v1/dealers | SALES | dealers | listDealers_1 |
| POST | /api/v1/dealers | SALES | dealers | createDealer |
| GET | /api/v1/dealers/search | SALES | dealers | searchDealers_1 |
| PUT | /api/v1/dealers/{dealerId} | SALES | dealers | updateDealer |
| GET | /api/v1/dealers/{dealerId}/aging | SALES | dealers | dealerAging |
| POST | /api/v1/dealers/{dealerId}/dunning/hold | SALES | dealers | holdIfOverdue |
| GET | /api/v1/dealers/{dealerId}/invoices | SALES | dealers | dealerInvoices_1 |
| GET | /api/v1/dealers/{dealerId}/ledger | SALES | dealers | dealerLedger |
| POST | /api/v1/dispatch/backorder/{slipId}/cancel | FACTORY | dispatch | cancelBackorder |
| POST | /api/v1/dispatch/confirm | FACTORY | dispatch | confirmDispatch_1 |
| GET | /api/v1/dispatch/order/{orderId} | FACTORY | dispatch | getPackagingSlipByOrder |
| GET | /api/v1/dispatch/pending | FACTORY | dispatch | getPendingSlips |
| GET | /api/v1/dispatch/preview/{slipId} | FACTORY | dispatch | getDispatchPreview |
| GET | /api/v1/dispatch/slip/{slipId} | FACTORY | dispatch | getPackagingSlip |
| PATCH | /api/v1/dispatch/slip/{slipId}/status | FACTORY | dispatch | updateSlipStatus |
| GET | /api/v1/factory/bulk-batches/{finishedGoodId} | FACTORY | factory | listBulkBatches |
| GET | /api/v1/factory/bulk-batches/{parentBatchId}/children | FACTORY | factory | listChildBatches |
| POST | /api/v1/factory/cost-allocation | FACTORY | factory | allocateCosts |
| GET | /api/v1/factory/dashboard | FACTORY | factory | dashboard_1 |
| POST | /api/v1/factory/pack | FACTORY | factory | packBulkToSizes |
| GET | /api/v1/factory/packaging-mappings | FACTORY | factory | listMappings |
| POST | /api/v1/factory/packaging-mappings | FACTORY | factory | createMapping |
| GET | /api/v1/factory/packaging-mappings/active | FACTORY | factory | listActiveMappings |
| PUT | /api/v1/factory/packaging-mappings/{id} | FACTORY | factory | updateMapping |
| DELETE | /api/v1/factory/packaging-mappings/{id} | FACTORY | factory | deactivateMapping |
| POST | /api/v1/factory/packing-records | FACTORY | factory | recordPacking |
| POST | /api/v1/factory/packing-records/{productionLogId}/complete | FACTORY | factory | completePacking |
| GET | /api/v1/factory/production-batches | FACTORY | factory | batches_1 |
| POST | /api/v1/factory/production-batches | FACTORY | factory | logBatch |
| GET | /api/v1/factory/production-logs/{productionLogId}/packing-history | FACTORY | factory | packingHistory |
| GET | /api/v1/factory/production-plans | FACTORY | factory | plans |
| POST | /api/v1/factory/production-plans | FACTORY | factory | createPlan |
| PUT | /api/v1/factory/production-plans/{id} | FACTORY | factory | updatePlan |
| DELETE | /api/v1/factory/production-plans/{id} | FACTORY | factory | deletePlan |
| PATCH | /api/v1/factory/production-plans/{id}/status | FACTORY | factory | updatePlanStatus |
| GET | /api/v1/factory/production/logs | FACTORY | factory | list |
| POST | /api/v1/factory/production/logs | FACTORY | factory | create |
| GET | /api/v1/factory/production/logs/{id} | FACTORY | factory | detail |
| GET | /api/v1/factory/tasks | FACTORY | factory | tasks |
| POST | /api/v1/factory/tasks | FACTORY | factory | createTask |
| PUT | /api/v1/factory/tasks/{id} | FACTORY | factory | updateTask |
| GET | /api/v1/factory/unpacked-batches | FACTORY | factory | listUnpackedBatches |
| GET | /api/v1/finished-goods | FACTORY | finished-goods | listFinishedGoods |
| POST | /api/v1/finished-goods | FACTORY | finished-goods | createFinishedGood |
| GET | /api/v1/finished-goods/low-stock | FACTORY | finished-goods | getLowStockItems |
| GET | /api/v1/finished-goods/stock-summary | FACTORY | finished-goods | getStockSummary |
| GET | /api/v1/finished-goods/{id} | FACTORY | finished-goods | getFinishedGood |
| PUT | /api/v1/finished-goods/{id} | FACTORY | finished-goods | updateFinishedGood |
| GET | /api/v1/finished-goods/{id}/batches | FACTORY | finished-goods | listBatches |
| POST | /api/v1/finished-goods/{id}/batches | FACTORY | finished-goods | registerBatch |
| POST | /api/v1/hr/attendance/bulk-mark | ACCOUNTANT | hr | bulkMarkAttendance |
| GET | /api/v1/hr/attendance/date/{date} | ACCOUNTANT | hr | attendanceByDate |
| GET | /api/v1/hr/attendance/employee/{employeeId} | ACCOUNTANT | hr | employeeAttendance |
| POST | /api/v1/hr/attendance/mark/{employeeId} | ACCOUNTANT | hr | markAttendance |
| GET | /api/v1/hr/attendance/summary | ACCOUNTANT | hr | attendanceSummary |
| GET | /api/v1/hr/attendance/today | ACCOUNTANT | hr | attendanceToday |
| GET | /api/v1/hr/employees | ACCOUNTANT | hr | employees |
| POST | /api/v1/hr/employees | ACCOUNTANT | hr | createEmployee |
| PUT | /api/v1/hr/employees/{id} | ACCOUNTANT | hr | updateEmployee |
| DELETE | /api/v1/hr/employees/{id} | ACCOUNTANT | hr | deleteEmployee |
| GET | /api/v1/hr/leave-requests | ACCOUNTANT | hr | leaveRequests |
| POST | /api/v1/hr/leave-requests | ACCOUNTANT | hr | createLeaveRequest |
| PATCH | /api/v1/hr/leave-requests/{id}/status | ACCOUNTANT | hr | updateLeaveStatus |
| GET | /api/v1/hr/payroll-runs | ACCOUNTANT | hr | payrollRuns |
| POST | /api/v1/hr/payroll-runs | ACCOUNTANT | hr | createPayrollRun_1 |
| GET | /api/v1/inventory/adjustments | ACCOUNTANT | inventory | listAdjustments |
| POST | /api/v1/inventory/adjustments | ACCOUNTANT | inventory | createAdjustment |
| POST | /api/v1/inventory/opening-stock | ACCOUNTANT | inventory | importOpeningStock |
| GET | /api/v1/invoices | ACCOUNTANT | invoices | listInvoices |
| GET | /api/v1/invoices/dealers/{dealerId} | ACCOUNTANT | invoices | dealerInvoices |
| GET | /api/v1/invoices/{id} | ACCOUNTANT | invoices | getInvoice |
| POST | /api/v1/invoices/{id}/email | ACCOUNTANT | invoices | sendInvoiceEmail |
| GET | /api/v1/invoices/{id}/pdf | ACCOUNTANT | invoices | downloadInvoicePdf |
| GET | /api/v1/payroll/runs | ACCOUNTANT | payroll | listPayrollRuns |
| POST | /api/v1/payroll/runs | ACCOUNTANT | payroll | createPayrollRun |
| GET | /api/v1/payroll/runs/monthly | ACCOUNTANT | payroll | listMonthlyPayrollRuns |
| POST | /api/v1/payroll/runs/monthly | ACCOUNTANT | payroll | createMonthlyPayrollRun |
| GET | /api/v1/payroll/runs/weekly | ACCOUNTANT | payroll | listWeeklyPayrollRuns |
| POST | /api/v1/payroll/runs/weekly | ACCOUNTANT | payroll | createWeeklyPayrollRun |
| GET | /api/v1/payroll/runs/{id} | ACCOUNTANT | payroll | getPayrollRun |
| POST | /api/v1/payroll/runs/{id}/approve | ACCOUNTANT | payroll | approvePayroll |
| POST | /api/v1/payroll/runs/{id}/calculate | ACCOUNTANT | payroll | calculatePayroll |
| GET | /api/v1/payroll/runs/{id}/lines | ACCOUNTANT | payroll | getPayrollRunLines |
| POST | /api/v1/payroll/runs/{id}/mark-paid | ACCOUNTANT | payroll | markAsPaid |
| POST | /api/v1/payroll/runs/{id}/post | ACCOUNTANT | payroll | postPayroll |
| GET | /api/v1/payroll/summary/current-month | ACCOUNTANT | payroll | getCurrentMonthPaySummary |
| GET | /api/v1/payroll/summary/current-week | ACCOUNTANT | payroll | getCurrentWeekPaySummary |
| GET | /api/v1/payroll/summary/monthly | ACCOUNTANT | payroll | getMonthlyPaySummary |
| GET | /api/v1/payroll/summary/weekly | ACCOUNTANT | payroll | getWeeklyPaySummary |
| GET | /api/v1/production/brands | FACTORY | production | listBrands |
| GET | /api/v1/production/brands/{brandId}/products | FACTORY | production | listBrandProducts |
| GET | /api/v1/purchasing/goods-receipts | ACCOUNTANT | purchasing | listGoodsReceipts |
| POST | /api/v1/purchasing/goods-receipts | ACCOUNTANT | purchasing | createGoodsReceipt |
| GET | /api/v1/purchasing/goods-receipts/{id} | ACCOUNTANT | purchasing | getGoodsReceipt |
| GET | /api/v1/purchasing/purchase-orders | ACCOUNTANT | purchasing | listPurchaseOrders |
| POST | /api/v1/purchasing/purchase-orders | ACCOUNTANT | purchasing | createPurchaseOrder |
| GET | /api/v1/purchasing/purchase-orders/{id} | ACCOUNTANT | purchasing | getPurchaseOrder |
| GET | /api/v1/purchasing/raw-material-purchases | ACCOUNTANT | purchasing | listPurchases |
| POST | /api/v1/purchasing/raw-material-purchases | ACCOUNTANT | purchasing | createPurchase |
| POST | /api/v1/purchasing/raw-material-purchases/returns | ACCOUNTANT | purchasing | recordPurchaseReturn |
| GET | /api/v1/purchasing/raw-material-purchases/{id} | ACCOUNTANT | purchasing | getPurchase |
| GET | /api/v1/raw-material-batches/{rawMaterialId} | ACCOUNTANT | raw-material-batches | batches |
| POST | /api/v1/raw-material-batches/{rawMaterialId} | ACCOUNTANT | raw-material-batches | createBatch |
| POST | /api/v1/raw-materials/intake | ACCOUNTANT | raw-materials | intake |
| GET | /api/v1/raw-materials/stock | ACCOUNTANT | raw-materials | stockSummary |
| GET | /api/v1/raw-materials/stock/inventory | ACCOUNTANT | raw-materials | inventory |
| GET | /api/v1/raw-materials/stock/low-stock | ACCOUNTANT | raw-materials | lowStock |
| GET | /api/v1/reports/account-statement | ACCOUNTANT | reports | accountStatement |
| GET | /api/v1/reports/balance-sheet | ACCOUNTANT | reports | balanceSheet |
| GET | /api/v1/reports/balance-warnings | ACCOUNTANT | reports | balanceWarnings |
| GET | /api/v1/reports/cash-flow | ACCOUNTANT | reports | cashFlow |
| GET | /api/v1/reports/inventory-reconciliation | ACCOUNTANT | reports | inventoryReconciliation |
| GET | /api/v1/reports/inventory-valuation | ACCOUNTANT | reports | inventoryValuation |
| GET | /api/v1/reports/monthly-production-costs | ACCOUNTANT | reports | monthlyProductionCosts |
| GET | /api/v1/reports/production-logs/{id}/cost-breakdown | ACCOUNTANT | reports | costBreakdown |
| GET | /api/v1/reports/profit-loss | ACCOUNTANT | reports | profitLoss |
| GET | /api/v1/reports/reconciliation-dashboard | ACCOUNTANT | reports | reconciliationDashboard |
| GET | /api/v1/reports/trial-balance | ACCOUNTANT | reports | trialBalance |
| GET | /api/v1/reports/wastage | ACCOUNTANT | reports | wastageReport |
| GET | /api/v1/sales/credit-requests | SALES | sales | creditRequests |
| POST | /api/v1/sales/credit-requests | SALES | sales | createCreditRequest |
| PUT | /api/v1/sales/credit-requests/{id} | SALES | sales | updateCreditRequest |
| POST | /api/v1/sales/credit-requests/{id}/approve | SALES | sales | approveCreditRequest |
| POST | /api/v1/sales/credit-requests/{id}/reject | SALES | sales | rejectCreditRequest |
| GET | /api/v1/sales/dealers | SALES | sales | listDealers |
| GET | /api/v1/sales/dealers/search | SALES | sales | searchDealers |
| POST | /api/v1/sales/dispatch/confirm | SALES | sales | confirmDispatch |
| POST | /api/v1/sales/dispatch/reconcile-order-markers | SALES | sales | reconcileOrderMarkers |
| GET | /api/v1/sales/orders | SALES | sales | orders |
| POST | /api/v1/sales/orders | SALES | sales | createOrder |
| PUT | /api/v1/sales/orders/{id} | SALES | sales | updateOrder |
| DELETE | /api/v1/sales/orders/{id} | SALES | sales | deleteOrder |
| POST | /api/v1/sales/orders/{id}/cancel | SALES | sales | cancelOrder |
| POST | /api/v1/sales/orders/{id}/confirm | SALES | sales | confirmOrder |
| PATCH | /api/v1/sales/orders/{id}/status | SALES | sales | updateStatus |
| GET | /api/v1/sales/promotions | SALES | sales | promotions |
| POST | /api/v1/sales/promotions | SALES | sales | createPromotion |
| PUT | /api/v1/sales/promotions/{id} | SALES | sales | updatePromotion |
| DELETE | /api/v1/sales/promotions/{id} | SALES | sales | deletePromotion |
| GET | /api/v1/sales/targets | SALES | sales | targets |
| POST | /api/v1/sales/targets | SALES | sales | createTarget |
| PUT | /api/v1/sales/targets/{id} | SALES | sales | updateTarget |
| DELETE | /api/v1/sales/targets/{id} | SALES | sales | deleteTarget |
| GET | /api/v1/suppliers | ACCOUNTANT | suppliers | listSuppliers |
| POST | /api/v1/suppliers | ACCOUNTANT | suppliers | createSupplier |
| GET | /api/v1/suppliers/{id} | ACCOUNTANT | suppliers | getSupplier |
| PUT | /api/v1/suppliers/{id} | ACCOUNTANT | suppliers | updateSupplier |

## Regeneration

`python3 scripts/generate_frontend_portal_contracts.py --input /Users/anas/Documents/orchestrator_erp/bigbrightpaints-erp/openapi.json --md-out docs/frontend/PORTAL_API_CONTRACTS.md --json-out docs/frontend/PORTAL_API_CONTRACTS.json --per-portal-dir docs/frontend/portals`

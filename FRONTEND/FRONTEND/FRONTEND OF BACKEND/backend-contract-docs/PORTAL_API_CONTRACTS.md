# Frontend Portal API Contracts (Canonical)

Canonical source: `openapi.json`
Generated at (UTC): `2026-02-23T18:20:38Z`
Source SHA256: `33ddd163c102607970ff0f4c45e95f0c2a9d2965749187f68beb5c012216efa1`

## Coverage Status

- Total operations in OpenAPI: `276`
- Operations with primary portal assignment: `276`
- Portal taxonomy: `ADMIN`, `SUPERADMIN`, `ACCOUNTANT`, `SALES`, `FACTORY`, `DEALER`
- SuperAdmin note: this is an elevated admin persona; backend routes are mostly under existing admin/company endpoints.

| Portal | Primary-Owned Ops | Accessible Ops |
| --- | --- | --- |
| ADMIN | 38 | 269 |
| SUPERADMIN | 0 | 269 |
| ACCOUNTANT | 138 | 171 |
| SALES | 36 | 75 |
| FACTORY | 44 | 74 |
| DEALER | 7 | 20 |

## Shared Foundation APIs (All Portals)

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

## ADMIN Portal Endpoint Pack

- Primary-owned operations: `38`

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

## ACCOUNTANT Portal Endpoint Pack

- Primary-owned operations: `138`

| Method | Path | Prefix | Tag | Operation | Summary |
| --- | --- | --- | --- | --- | --- |
| GET | /api/v1/accounting/accounts | accounting | accounting-controller | accounts | - |
| POST | /api/v1/accounting/accounts | accounting | accounting-controller | createAccount | - |
| GET | /api/v1/accounting/accounts/tree | accounting | accounting-controller | getChartOfAccountsTree | - |
| GET | /api/v1/accounting/accounts/tree/{type} | accounting | accounting-controller | getAccountTreeByType | - |
| GET | /api/v1/accounting/accounts/{accountId}/activity | accounting | accounting-controller | getAccountActivity | - |
| GET | /api/v1/accounting/accounts/{accountId}/balance/as-of | accounting | accounting-controller | getBalanceAsOf | - |
| GET | /api/v1/accounting/accounts/{accountId}/balance/compare | accounting | accounting-controller | compareBalances | - |
| POST | /api/v1/accounting/accruals | accounting | accounting-controller | postAccrual | - |
| GET | /api/v1/accounting/aging/dealers/{dealerId} | accounting | accounting-controller | dealerAging_1 | - |
| GET | /api/v1/accounting/aging/dealers/{dealerId}/pdf | accounting | accounting-controller | dealerAgingPdf | Download dealer aging PDF |
| GET | /api/v1/accounting/aging/suppliers/{supplierId} | accounting | accounting-controller | supplierAging | - |
| GET | /api/v1/accounting/aging/suppliers/{supplierId}/pdf | accounting | accounting-controller | supplierAgingPdf | Download supplier aging PDF |
| GET | /api/v1/accounting/audit/digest | accounting | accounting-controller | auditDigest | - |
| GET | /api/v1/accounting/audit/digest.csv | accounting | accounting-controller | auditDigestCsv | - |
| GET | /api/v1/accounting/audit/transactions | accounting | accounting-controller | transactionAudit | - |
| GET | /api/v1/accounting/audit/transactions/{journalEntryId} | accounting | accounting-controller | transactionAuditDetail | - |
| POST | /api/v1/accounting/bad-debts/write-off | accounting | accounting-controller | writeOffBadDebt | - |
| POST | /api/v1/accounting/catalog/import | accounting | accounting-catalog-controller | importCatalog | - |
| GET | /api/v1/accounting/catalog/products | accounting | accounting-catalog-controller | listProducts | - |
| POST | /api/v1/accounting/catalog/products | accounting | accounting-catalog-controller | createProduct | - |
| POST | /api/v1/accounting/catalog/products/bulk-variants | accounting | accounting-catalog-controller | createVariants | - |
| PUT | /api/v1/accounting/catalog/products/{id} | accounting | accounting-catalog-controller | updateProduct | - |
| GET | /api/v1/accounting/configuration/health | accounting | accounting-configuration-controller | health | - |
| POST | /api/v1/accounting/credit-notes | accounting | accounting-controller | postCreditNote | - |
| GET | /api/v1/accounting/date-context | accounting | accounting-controller | getAccountingDateContext | - |
| POST | /api/v1/accounting/debit-notes | accounting | accounting-controller | postDebitNote | - |
| GET | /api/v1/accounting/default-accounts | accounting | accounting-controller | defaultAccounts | - |
| PUT | /api/v1/accounting/default-accounts | accounting | accounting-controller | updateDefaultAccounts | - |
| GET | /api/v1/accounting/gst/return | accounting | accounting-controller | generateGstReturn | - |
| POST | /api/v1/accounting/inventory/landed-cost | accounting | accounting-controller | recordLandedCost | - |
| POST | /api/v1/accounting/inventory/revaluation | accounting | accounting-controller | revalueInventory | - |
| POST | /api/v1/accounting/inventory/wip-adjustment | accounting | accounting-controller | adjustWip | - |
| GET | /api/v1/accounting/journal-entries | accounting | accounting-controller | journalEntries | - |
| POST | /api/v1/accounting/journal-entries | accounting | accounting-controller | createJournalEntry | - |
| POST | /api/v1/accounting/journal-entries/{entryId}/cascade-reverse | accounting | accounting-controller | cascadeReverseJournalEntry | - |
| POST | /api/v1/accounting/journal-entries/{entryId}/reverse | accounting | accounting-controller | reverseJournalEntry | - |
| GET | /api/v1/accounting/month-end/checklist | accounting | accounting-controller | checklist | - |
| POST | /api/v1/accounting/month-end/checklist/{periodId} | accounting | accounting-controller | updateChecklist | - |
| POST | /api/v1/accounting/payroll/payments | accounting | accounting-controller | recordPayrollPayment | - |
| POST | /api/v1/accounting/payroll/payments/batch | accounting | payroll-controller | processBatchPayment | - |
| GET | /api/v1/accounting/periods | accounting | accounting-controller | listPeriods | - |
| POST | /api/v1/accounting/periods/{periodId}/close | accounting | accounting-controller | closePeriod | - |
| POST | /api/v1/accounting/periods/{periodId}/lock | accounting | accounting-controller | lockPeriod | - |
| POST | /api/v1/accounting/periods/{periodId}/reopen | accounting | accounting-controller | reopenPeriod | - |
| GET | /api/v1/accounting/raw-materials | accounting | raw-material-controller | listRawMaterials | - |
| POST | /api/v1/accounting/raw-materials | accounting | raw-material-controller | createRawMaterial | - |
| PUT | /api/v1/accounting/raw-materials/{id} | accounting | raw-material-controller | updateRawMaterial | - |
| DELETE | /api/v1/accounting/raw-materials/{id} | accounting | raw-material-controller | deleteRawMaterial | - |
| POST | /api/v1/accounting/receipts/dealer | accounting | accounting-controller | recordDealerReceipt | - |
| POST | /api/v1/accounting/receipts/dealer/hybrid | accounting | accounting-controller | recordDealerHybridReceipt | - |
| GET | /api/v1/accounting/reports/aged-debtors | accounting | report-controller | agedDebtors | - |
| GET | /api/v1/accounting/reports/aging/dealer/{dealerId} | accounting | accounting-controller | getDealerAging | - |
| GET | /api/v1/accounting/reports/aging/dealer/{dealerId}/detailed | accounting | accounting-controller | getDealerAgingDetailed | - |
| GET | /api/v1/accounting/reports/aging/receivables | accounting | accounting-controller | getAgedReceivables | - |
| GET | /api/v1/accounting/reports/balance-sheet/hierarchy | accounting | accounting-controller | getBalanceSheetHierarchy | - |
| GET | /api/v1/accounting/reports/dso/dealer/{dealerId} | accounting | accounting-controller | getDealerDSO | - |
| GET | /api/v1/accounting/reports/income-statement/hierarchy | accounting | accounting-controller | getIncomeStatementHierarchy | - |
| GET | /api/v1/accounting/sales/returns | accounting | accounting-controller | listSalesReturns | - |
| POST | /api/v1/accounting/sales/returns | accounting | accounting-controller | recordSalesReturn | - |
| POST | /api/v1/accounting/settlements/dealers | accounting | accounting-controller | settleDealer | - |
| POST | /api/v1/accounting/settlements/suppliers | accounting | accounting-controller | settleSupplier | - |
| GET | /api/v1/accounting/statements/dealers/{dealerId} | accounting | accounting-controller | dealerStatement | - |
| GET | /api/v1/accounting/statements/dealers/{dealerId}/pdf | accounting | accounting-controller | dealerStatementPdf | Download dealer statement PDF |
| GET | /api/v1/accounting/statements/suppliers/{supplierId} | accounting | accounting-controller | supplierStatement | - |
| GET | /api/v1/accounting/statements/suppliers/{supplierId}/pdf | accounting | accounting-controller | supplierStatementPdf | Download supplier statement PDF |
| POST | /api/v1/accounting/suppliers/payments | accounting | accounting-controller | recordSupplierPayment | - |
| GET | /api/v1/accounting/trial-balance/as-of | accounting | accounting-controller | getTrialBalanceAsOf | - |
| POST | /api/v1/hr/attendance/bulk-mark | hr | hr-controller | bulkMarkAttendance | - |
| GET | /api/v1/hr/attendance/date/{date} | hr | hr-controller | attendanceByDate | - |
| GET | /api/v1/hr/attendance/employee/{employeeId} | hr | hr-controller | employeeAttendance | - |
| POST | /api/v1/hr/attendance/mark/{employeeId} | hr | hr-controller | markAttendance | - |
| GET | /api/v1/hr/attendance/summary | hr | hr-controller | attendanceSummary | - |
| GET | /api/v1/hr/attendance/today | hr | hr-controller | attendanceToday | - |
| GET | /api/v1/hr/employees | hr | hr-controller | employees | - |
| POST | /api/v1/hr/employees | hr | hr-controller | createEmployee | - |
| PUT | /api/v1/hr/employees/{id} | hr | hr-controller | updateEmployee | - |
| DELETE | /api/v1/hr/employees/{id} | hr | hr-controller | deleteEmployee | - |
| GET | /api/v1/hr/leave-requests | hr | hr-controller | leaveRequests | - |
| POST | /api/v1/hr/leave-requests | hr | hr-controller | createLeaveRequest | - |
| PATCH | /api/v1/hr/leave-requests/{id}/status | hr | hr-controller | updateLeaveStatus | - |
| GET | /api/v1/hr/payroll-runs | hr | hr-controller | payrollRuns | - |
| POST | /api/v1/hr/payroll-runs | hr | hr-controller | createPayrollRun_1 | - |
| GET | /api/v1/inventory/adjustments | inventory | inventory-adjustment-controller | listAdjustments | - |
| POST | /api/v1/inventory/adjustments | inventory | inventory-adjustment-controller | createAdjustment | - |
| POST | /api/v1/inventory/opening-stock | inventory | opening-stock-import-controller | importOpeningStock | - |
| GET | /api/v1/invoices | invoices | invoice-controller | listInvoices | - |
| GET | /api/v1/invoices/dealers/{dealerId} | invoices | invoice-controller | dealerInvoices | - |
| GET | /api/v1/invoices/{id} | invoices | invoice-controller | getInvoice | - |
| POST | /api/v1/invoices/{id}/email | invoices | invoice-controller | sendInvoiceEmail | - |
| GET | /api/v1/invoices/{id}/pdf | invoices | invoice-controller | downloadInvoicePdf | Download invoice PDF |
| GET | /api/v1/payroll/runs | payroll | hr-payroll-controller | listPayrollRuns | - |
| POST | /api/v1/payroll/runs | payroll | hr-payroll-controller | createPayrollRun | - |
| GET | /api/v1/payroll/runs/monthly | payroll | hr-payroll-controller | listMonthlyPayrollRuns | - |
| POST | /api/v1/payroll/runs/monthly | payroll | hr-payroll-controller | createMonthlyPayrollRun | - |
| GET | /api/v1/payroll/runs/weekly | payroll | hr-payroll-controller | listWeeklyPayrollRuns | - |
| POST | /api/v1/payroll/runs/weekly | payroll | hr-payroll-controller | createWeeklyPayrollRun | - |
| GET | /api/v1/payroll/runs/{id} | payroll | hr-payroll-controller | getPayrollRun | - |
| POST | /api/v1/payroll/runs/{id}/approve | payroll | hr-payroll-controller | approvePayroll | - |
| POST | /api/v1/payroll/runs/{id}/calculate | payroll | hr-payroll-controller | calculatePayroll | - |
| GET | /api/v1/payroll/runs/{id}/lines | payroll | hr-payroll-controller | getPayrollRunLines | - |
| POST | /api/v1/payroll/runs/{id}/mark-paid | payroll | hr-payroll-controller | markAsPaid | - |
| POST | /api/v1/payroll/runs/{id}/post | payroll | hr-payroll-controller | postPayroll | - |
| GET | /api/v1/payroll/summary/current-month | payroll | hr-payroll-controller | getCurrentMonthPaySummary | - |
| GET | /api/v1/payroll/summary/current-week | payroll | hr-payroll-controller | getCurrentWeekPaySummary | - |
| GET | /api/v1/payroll/summary/monthly | payroll | hr-payroll-controller | getMonthlyPaySummary | - |
| GET | /api/v1/payroll/summary/weekly | payroll | hr-payroll-controller | getWeeklyPaySummary | - |
| GET | /api/v1/purchasing/goods-receipts | purchasing | purchasing-workflow-controller | listGoodsReceipts | - |
| POST | /api/v1/purchasing/goods-receipts | purchasing | purchasing-workflow-controller | createGoodsReceipt | - |
| GET | /api/v1/purchasing/goods-receipts/{id} | purchasing | purchasing-workflow-controller | getGoodsReceipt | - |
| GET | /api/v1/purchasing/purchase-orders | purchasing | purchasing-workflow-controller | listPurchaseOrders | - |
| POST | /api/v1/purchasing/purchase-orders | purchasing | purchasing-workflow-controller | createPurchaseOrder | - |
| GET | /api/v1/purchasing/purchase-orders/{id} | purchasing | purchasing-workflow-controller | getPurchaseOrder | - |
| GET | /api/v1/purchasing/raw-material-purchases | purchasing | raw-material-purchase-controller | listPurchases | - |
| POST | /api/v1/purchasing/raw-material-purchases | purchasing | raw-material-purchase-controller | createPurchase | - |
| POST | /api/v1/purchasing/raw-material-purchases/returns | purchasing | raw-material-purchase-controller | recordPurchaseReturn | - |
| GET | /api/v1/purchasing/raw-material-purchases/{id} | purchasing | raw-material-purchase-controller | getPurchase | - |
| GET | /api/v1/raw-material-batches/{rawMaterialId} | raw-material-batches | raw-material-controller | batches | - |
| POST | /api/v1/raw-material-batches/{rawMaterialId} | raw-material-batches | raw-material-controller | createBatch | - |
| POST | /api/v1/raw-materials/intake | raw-materials | raw-material-controller | intake | - |
| GET | /api/v1/raw-materials/stock | raw-materials | raw-material-controller | stockSummary | - |
| GET | /api/v1/raw-materials/stock/inventory | raw-materials | raw-material-controller | inventory | - |
| GET | /api/v1/raw-materials/stock/low-stock | raw-materials | raw-material-controller | lowStock | - |
| GET | /api/v1/reports/account-statement | reports | report-controller | accountStatement | - |
| GET | /api/v1/reports/balance-sheet | reports | report-controller | balanceSheet | - |
| GET | /api/v1/reports/balance-warnings | reports | report-controller | balanceWarnings | - |
| GET | /api/v1/reports/cash-flow | reports | report-controller | cashFlow | - |
| GET | /api/v1/reports/inventory-reconciliation | reports | report-controller | inventoryReconciliation | - |
| GET | /api/v1/reports/inventory-valuation | reports | report-controller | inventoryValuation | - |
| GET | /api/v1/reports/monthly-production-costs | reports | report-controller | monthlyProductionCosts | - |
| GET | /api/v1/reports/production-logs/{id}/cost-breakdown | reports | report-controller | costBreakdown | - |
| GET | /api/v1/reports/profit-loss | reports | report-controller | profitLoss | - |
| GET | /api/v1/reports/reconciliation-dashboard | reports | report-controller | reconciliationDashboard | - |
| GET | /api/v1/reports/trial-balance | reports | report-controller | trialBalance | - |
| GET | /api/v1/reports/wastage | reports | report-controller | wastageReport | - |
| GET | /api/v1/suppliers | suppliers | supplier-controller | listSuppliers | - |
| POST | /api/v1/suppliers | suppliers | supplier-controller | createSupplier | - |
| GET | /api/v1/suppliers/{id} | suppliers | supplier-controller | getSupplier | - |
| PUT | /api/v1/suppliers/{id} | suppliers | supplier-controller | updateSupplier | - |

## SALES Portal Endpoint Pack

- Primary-owned operations: `36`

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

## FACTORY Portal Endpoint Pack

- Primary-owned operations: `44`

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

## DEALER Portal Endpoint Pack

- Primary-owned operations: `7`

| Method | Path | Prefix | Tag | Operation | Summary |
| --- | --- | --- | --- | --- | --- |
| GET | /api/v1/dealer-portal/aging | dealer-portal | dealer-portal-controller | getMyAging | - |
| POST | /api/v1/dealer-portal/credit-requests | dealer-portal | dealer-portal-controller | createCreditRequest_1 | - |
| GET | /api/v1/dealer-portal/dashboard | dealer-portal | dealer-portal-controller | getDashboard | - |
| GET | /api/v1/dealer-portal/invoices | dealer-portal | dealer-portal-controller | getMyInvoices | - |
| GET | /api/v1/dealer-portal/invoices/{invoiceId}/pdf | dealer-portal | dealer-portal-controller | getMyInvoicePdf | Download invoice PDF (dealer scoped) |
| GET | /api/v1/dealer-portal/ledger | dealer-portal | dealer-portal-controller | getMyLedger | - |
| GET | /api/v1/dealer-portal/orders | dealer-portal | dealer-portal-controller | getMyOrders | - |

## SUPERADMIN Contract Overlay

- SuperAdmin inherits the ADMIN pack plus tenant-governance and high-privilege operations.
| Method | Path | Operation | Reason |
| --- | --- | --- | --- |
| GET | /api/v1/admin/roles | listRoles | Tenant lifecycle / role governance |
| POST | /api/v1/admin/roles | createRole | Tenant lifecycle / role governance |
| GET | /api/v1/admin/roles/{roleKey} | getRoleByKey | Tenant lifecycle / role governance |
| GET | /api/v1/companies | list_1 | Tenant lifecycle / role governance |
| POST | /api/v1/companies | create_1 | Tenant lifecycle / role governance |
| PUT | /api/v1/companies/{id} | update | Tenant lifecycle / role governance |
| DELETE | /api/v1/companies/{id} | delete | Tenant lifecycle / role governance |

## Master Endpoint Ledger (All Operations)

| Method | Path | Prefix | Primary Portal | Accessible Portals | Operation |
| --- | --- | --- | --- | --- | --- |
| GET | /api/integration/health | integration | ADMIN | ADMIN, SUPERADMIN | health_1 |
| GET | /api/v1/accounting/accounts | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | accounts |
| POST | /api/v1/accounting/accounts | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createAccount |
| GET | /api/v1/accounting/accounts/tree | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getChartOfAccountsTree |
| GET | /api/v1/accounting/accounts/tree/{type} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getAccountTreeByType |
| GET | /api/v1/accounting/accounts/{accountId}/activity | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getAccountActivity |
| GET | /api/v1/accounting/accounts/{accountId}/balance/as-of | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getBalanceAsOf |
| GET | /api/v1/accounting/accounts/{accountId}/balance/compare | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | compareBalances |
| POST | /api/v1/accounting/accruals | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | postAccrual |
| GET | /api/v1/accounting/aging/dealers/{dealerId} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | dealerAging_1 |
| GET | /api/v1/accounting/aging/dealers/{dealerId}/pdf | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | dealerAgingPdf |
| GET | /api/v1/accounting/aging/suppliers/{supplierId} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | supplierAging |
| GET | /api/v1/accounting/aging/suppliers/{supplierId}/pdf | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | supplierAgingPdf |
| GET | /api/v1/accounting/audit/digest | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | auditDigest |
| GET | /api/v1/accounting/audit/digest.csv | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | auditDigestCsv |
| GET | /api/v1/accounting/audit/transactions | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | transactionAudit |
| GET | /api/v1/accounting/audit/transactions/{journalEntryId} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | transactionAuditDetail |
| POST | /api/v1/accounting/bad-debts/write-off | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | writeOffBadDebt |
| POST | /api/v1/accounting/catalog/import | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | importCatalog |
| GET | /api/v1/accounting/catalog/products | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listProducts |
| POST | /api/v1/accounting/catalog/products | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createProduct |
| POST | /api/v1/accounting/catalog/products/bulk-variants | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createVariants |
| PUT | /api/v1/accounting/catalog/products/{id} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | updateProduct |
| GET | /api/v1/accounting/configuration/health | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | health |
| POST | /api/v1/accounting/credit-notes | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | postCreditNote |
| GET | /api/v1/accounting/date-context | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getAccountingDateContext |
| POST | /api/v1/accounting/debit-notes | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | postDebitNote |
| GET | /api/v1/accounting/default-accounts | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | defaultAccounts |
| PUT | /api/v1/accounting/default-accounts | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | updateDefaultAccounts |
| GET | /api/v1/accounting/gst/return | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | generateGstReturn |
| POST | /api/v1/accounting/inventory/landed-cost | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | recordLandedCost |
| POST | /api/v1/accounting/inventory/revaluation | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | revalueInventory |
| POST | /api/v1/accounting/inventory/wip-adjustment | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | adjustWip |
| GET | /api/v1/accounting/journal-entries | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | journalEntries |
| POST | /api/v1/accounting/journal-entries | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createJournalEntry |
| POST | /api/v1/accounting/journal-entries/{entryId}/cascade-reverse | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | cascadeReverseJournalEntry |
| POST | /api/v1/accounting/journal-entries/{entryId}/reverse | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | reverseJournalEntry |
| GET | /api/v1/accounting/month-end/checklist | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | checklist |
| POST | /api/v1/accounting/month-end/checklist/{periodId} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | updateChecklist |
| POST | /api/v1/accounting/payroll/payments | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | recordPayrollPayment |
| POST | /api/v1/accounting/payroll/payments/batch | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | processBatchPayment |
| GET | /api/v1/accounting/periods | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listPeriods |
| POST | /api/v1/accounting/periods/{periodId}/close | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | closePeriod |
| POST | /api/v1/accounting/periods/{periodId}/lock | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | lockPeriod |
| POST | /api/v1/accounting/periods/{periodId}/reopen | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | reopenPeriod |
| GET | /api/v1/accounting/raw-materials | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listRawMaterials |
| POST | /api/v1/accounting/raw-materials | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createRawMaterial |
| PUT | /api/v1/accounting/raw-materials/{id} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | updateRawMaterial |
| DELETE | /api/v1/accounting/raw-materials/{id} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | deleteRawMaterial |
| POST | /api/v1/accounting/receipts/dealer | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | recordDealerReceipt |
| POST | /api/v1/accounting/receipts/dealer/hybrid | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | recordDealerHybridReceipt |
| GET | /api/v1/accounting/reports/aged-debtors | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | agedDebtors |
| GET | /api/v1/accounting/reports/aging/dealer/{dealerId} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getDealerAging |
| GET | /api/v1/accounting/reports/aging/dealer/{dealerId}/detailed | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getDealerAgingDetailed |
| GET | /api/v1/accounting/reports/aging/receivables | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getAgedReceivables |
| GET | /api/v1/accounting/reports/balance-sheet/hierarchy | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getBalanceSheetHierarchy |
| GET | /api/v1/accounting/reports/dso/dealer/{dealerId} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getDealerDSO |
| GET | /api/v1/accounting/reports/income-statement/hierarchy | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getIncomeStatementHierarchy |
| GET | /api/v1/accounting/sales/returns | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listSalesReturns |
| POST | /api/v1/accounting/sales/returns | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | recordSalesReturn |
| POST | /api/v1/accounting/settlements/dealers | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | settleDealer |
| POST | /api/v1/accounting/settlements/suppliers | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | settleSupplier |
| GET | /api/v1/accounting/statements/dealers/{dealerId} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | dealerStatement |
| GET | /api/v1/accounting/statements/dealers/{dealerId}/pdf | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | dealerStatementPdf |
| GET | /api/v1/accounting/statements/suppliers/{supplierId} | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | supplierStatement |
| GET | /api/v1/accounting/statements/suppliers/{supplierId}/pdf | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | supplierStatementPdf |
| POST | /api/v1/accounting/suppliers/payments | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | recordSupplierPayment |
| GET | /api/v1/accounting/trial-balance/as-of | accounting | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getTrialBalanceAsOf |
| GET | /api/v1/admin/approvals | admin | ADMIN | ADMIN, SUPERADMIN | approvals |
| POST | /api/v1/admin/notify | admin | ADMIN | ADMIN, SUPERADMIN | notifyUser |
| GET | /api/v1/admin/roles | admin | ADMIN | ADMIN, SUPERADMIN | listRoles |
| POST | /api/v1/admin/roles | admin | ADMIN | ADMIN, SUPERADMIN | createRole |
| GET | /api/v1/admin/roles/{roleKey} | admin | ADMIN | ADMIN, SUPERADMIN | getRoleByKey |
| GET | /api/v1/admin/settings | admin | ADMIN | ADMIN, SUPERADMIN | getSettings |
| PUT | /api/v1/admin/settings | admin | ADMIN | ADMIN, SUPERADMIN | updateSettings |
| GET | /api/v1/admin/users | admin | ADMIN | ADMIN, SUPERADMIN | list_2 |
| POST | /api/v1/admin/users | admin | ADMIN | ADMIN, SUPERADMIN | create_2 |
| PUT | /api/v1/admin/users/{id} | admin | ADMIN | ADMIN, SUPERADMIN | update_2 |
| DELETE | /api/v1/admin/users/{id} | admin | ADMIN | ADMIN, SUPERADMIN | delete_1 |
| PATCH | /api/v1/admin/users/{id}/mfa/disable | admin | ADMIN | ADMIN, SUPERADMIN | disableMfa |
| PATCH | /api/v1/admin/users/{id}/suspend | admin | ADMIN | ADMIN, SUPERADMIN | suspend |
| PATCH | /api/v1/admin/users/{id}/unsuspend | admin | ADMIN | ADMIN, SUPERADMIN | unsuspend |
| GET | /api/v1/audit/business-events | audit | ADMIN | ADMIN, SUPERADMIN | businessEvents |
| GET | /api/v1/audit/ml-events | audit | ADMIN | ADMIN, SUPERADMIN | mlEvents |
| POST | /api/v1/audit/ml-events | audit | ADMIN | ADMIN, SUPERADMIN | ingestMlEvents |
| POST | /api/v1/auth/login | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | login |
| POST | /api/v1/auth/logout | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | logout |
| GET | /api/v1/auth/me | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | me |
| POST | /api/v1/auth/mfa/activate | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | activate |
| POST | /api/v1/auth/mfa/disable | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | disable |
| POST | /api/v1/auth/mfa/setup | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | setup |
| POST | /api/v1/auth/password/change | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | changePassword |
| POST | /api/v1/auth/password/forgot | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | forgotPassword |
| POST | /api/v1/auth/password/reset | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | resetPassword |
| GET | /api/v1/auth/profile | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | profile |
| PUT | /api/v1/auth/profile | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | update_1 |
| POST | /api/v1/auth/refresh-token | auth | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | refresh |
| GET | /api/v1/companies | companies | ADMIN | ADMIN, SUPERADMIN, ACCOUNTANT, SALES | list_1 |
| POST | /api/v1/companies | companies | ADMIN | ADMIN, SUPERADMIN, ACCOUNTANT, SALES | create_1 |
| PUT | /api/v1/companies/{id} | companies | ADMIN | ADMIN, SUPERADMIN, ACCOUNTANT, SALES | update |
| DELETE | /api/v1/companies/{id} | companies | ADMIN | ADMIN, SUPERADMIN, ACCOUNTANT, SALES | delete |
| GET | /api/v1/credit/override-requests | credit | SALES | SALES, ADMIN, SUPERADMIN, FACTORY | listRequests |
| POST | /api/v1/credit/override-requests | credit | SALES | SALES, ADMIN, SUPERADMIN, FACTORY | createRequest |
| POST | /api/v1/credit/override-requests/{id}/approve | credit | SALES | SALES, ADMIN, SUPERADMIN, FACTORY | approveRequest |
| POST | /api/v1/credit/override-requests/{id}/reject | credit | SALES | SALES, ADMIN, SUPERADMIN, FACTORY | rejectRequest |
| GET | /api/v1/dealer-portal/aging | dealer-portal | DEALER | DEALER | getMyAging |
| POST | /api/v1/dealer-portal/credit-requests | dealer-portal | DEALER | DEALER | createCreditRequest_1 |
| GET | /api/v1/dealer-portal/dashboard | dealer-portal | DEALER | DEALER | getDashboard |
| GET | /api/v1/dealer-portal/invoices | dealer-portal | DEALER | DEALER | getMyInvoices |
| GET | /api/v1/dealer-portal/invoices/{invoiceId}/pdf | dealer-portal | DEALER | DEALER | getMyInvoicePdf |
| GET | /api/v1/dealer-portal/ledger | dealer-portal | DEALER | DEALER | getMyLedger |
| GET | /api/v1/dealer-portal/orders | dealer-portal | DEALER | DEALER | getMyOrders |
| GET | /api/v1/dealers | dealers | SALES | SALES, ACCOUNTANT, ADMIN, SUPERADMIN | listDealers_1 |
| POST | /api/v1/dealers | dealers | SALES | SALES, ACCOUNTANT, ADMIN, SUPERADMIN | createDealer |
| GET | /api/v1/dealers/search | dealers | SALES | SALES, ACCOUNTANT, ADMIN, SUPERADMIN | searchDealers_1 |
| PUT | /api/v1/dealers/{dealerId} | dealers | SALES | SALES, ACCOUNTANT, ADMIN, SUPERADMIN | updateDealer |
| GET | /api/v1/dealers/{dealerId}/aging | dealers | SALES | SALES, ACCOUNTANT, ADMIN, SUPERADMIN | dealerAging |
| POST | /api/v1/dealers/{dealerId}/dunning/hold | dealers | SALES | SALES, ACCOUNTANT, ADMIN, SUPERADMIN | holdIfOverdue |
| GET | /api/v1/dealers/{dealerId}/invoices | dealers | SALES | SALES, ACCOUNTANT, ADMIN, SUPERADMIN | dealerInvoices_1 |
| GET | /api/v1/dealers/{dealerId}/ledger | dealers | SALES | SALES, ACCOUNTANT, ADMIN, SUPERADMIN | dealerLedger |
| GET | /api/v1/demo/ping | demo | ADMIN | ADMIN, SUPERADMIN | ping |
| POST | /api/v1/dispatch/backorder/{slipId}/cancel | dispatch | FACTORY | FACTORY, SALES, ADMIN, SUPERADMIN | cancelBackorder |
| POST | /api/v1/dispatch/confirm | dispatch | FACTORY | FACTORY, SALES, ADMIN, SUPERADMIN | confirmDispatch_1 |
| GET | /api/v1/dispatch/order/{orderId} | dispatch | FACTORY | FACTORY, SALES, ADMIN, SUPERADMIN | getPackagingSlipByOrder |
| GET | /api/v1/dispatch/pending | dispatch | FACTORY | FACTORY, SALES, ADMIN, SUPERADMIN | getPendingSlips |
| GET | /api/v1/dispatch/preview/{slipId} | dispatch | FACTORY | FACTORY, SALES, ADMIN, SUPERADMIN | getDispatchPreview |
| GET | /api/v1/dispatch/slip/{slipId} | dispatch | FACTORY | FACTORY, SALES, ADMIN, SUPERADMIN | getPackagingSlip |
| PATCH | /api/v1/dispatch/slip/{slipId}/status | dispatch | FACTORY | FACTORY, SALES, ADMIN, SUPERADMIN | updateSlipStatus |
| GET | /api/v1/factory/bulk-batches/{finishedGoodId} | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | listBulkBatches |
| GET | /api/v1/factory/bulk-batches/{parentBatchId}/children | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | listChildBatches |
| POST | /api/v1/factory/cost-allocation | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | allocateCosts |
| GET | /api/v1/factory/dashboard | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | dashboard_1 |
| POST | /api/v1/factory/pack | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | packBulkToSizes |
| GET | /api/v1/factory/packaging-mappings | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | listMappings |
| POST | /api/v1/factory/packaging-mappings | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | createMapping |
| GET | /api/v1/factory/packaging-mappings/active | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | listActiveMappings |
| PUT | /api/v1/factory/packaging-mappings/{id} | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | updateMapping |
| DELETE | /api/v1/factory/packaging-mappings/{id} | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | deactivateMapping |
| POST | /api/v1/factory/packing-records | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | recordPacking |
| POST | /api/v1/factory/packing-records/{productionLogId}/complete | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | completePacking |
| GET | /api/v1/factory/production-batches | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | batches_1 |
| POST | /api/v1/factory/production-batches | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | logBatch |
| GET | /api/v1/factory/production-logs/{productionLogId}/packing-history | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | packingHistory |
| GET | /api/v1/factory/production-plans | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | plans |
| POST | /api/v1/factory/production-plans | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | createPlan |
| PUT | /api/v1/factory/production-plans/{id} | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | updatePlan |
| DELETE | /api/v1/factory/production-plans/{id} | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | deletePlan |
| PATCH | /api/v1/factory/production-plans/{id}/status | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | updatePlanStatus |
| GET | /api/v1/factory/production/logs | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | list |
| POST | /api/v1/factory/production/logs | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | create |
| GET | /api/v1/factory/production/logs/{id} | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | detail |
| GET | /api/v1/factory/tasks | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | tasks |
| POST | /api/v1/factory/tasks | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | createTask |
| PUT | /api/v1/factory/tasks/{id} | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | updateTask |
| GET | /api/v1/factory/unpacked-batches | factory | FACTORY | FACTORY, ADMIN, SUPERADMIN | listUnpackedBatches |
| GET | /api/v1/finished-goods | finished-goods | FACTORY | FACTORY, SALES, ACCOUNTANT, ADMIN, SUPERADMIN | listFinishedGoods |
| POST | /api/v1/finished-goods | finished-goods | FACTORY | FACTORY, SALES, ACCOUNTANT, ADMIN, SUPERADMIN | createFinishedGood |
| GET | /api/v1/finished-goods/low-stock | finished-goods | FACTORY | FACTORY, SALES, ACCOUNTANT, ADMIN, SUPERADMIN | getLowStockItems |
| GET | /api/v1/finished-goods/stock-summary | finished-goods | FACTORY | FACTORY, SALES, ACCOUNTANT, ADMIN, SUPERADMIN | getStockSummary |
| GET | /api/v1/finished-goods/{id} | finished-goods | FACTORY | FACTORY, SALES, ACCOUNTANT, ADMIN, SUPERADMIN | getFinishedGood |
| PUT | /api/v1/finished-goods/{id} | finished-goods | FACTORY | FACTORY, SALES, ACCOUNTANT, ADMIN, SUPERADMIN | updateFinishedGood |
| GET | /api/v1/finished-goods/{id}/batches | finished-goods | FACTORY | FACTORY, SALES, ACCOUNTANT, ADMIN, SUPERADMIN | listBatches |
| POST | /api/v1/finished-goods/{id}/batches | finished-goods | FACTORY | FACTORY, SALES, ACCOUNTANT, ADMIN, SUPERADMIN | registerBatch |
| POST | /api/v1/hr/attendance/bulk-mark | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | bulkMarkAttendance |
| GET | /api/v1/hr/attendance/date/{date} | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | attendanceByDate |
| GET | /api/v1/hr/attendance/employee/{employeeId} | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | employeeAttendance |
| POST | /api/v1/hr/attendance/mark/{employeeId} | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | markAttendance |
| GET | /api/v1/hr/attendance/summary | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | attendanceSummary |
| GET | /api/v1/hr/attendance/today | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | attendanceToday |
| GET | /api/v1/hr/employees | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | employees |
| POST | /api/v1/hr/employees | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createEmployee |
| PUT | /api/v1/hr/employees/{id} | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | updateEmployee |
| DELETE | /api/v1/hr/employees/{id} | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | deleteEmployee |
| GET | /api/v1/hr/leave-requests | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | leaveRequests |
| POST | /api/v1/hr/leave-requests | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createLeaveRequest |
| PATCH | /api/v1/hr/leave-requests/{id}/status | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | updateLeaveStatus |
| GET | /api/v1/hr/payroll-runs | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | payrollRuns |
| POST | /api/v1/hr/payroll-runs | hr | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createPayrollRun_1 |
| GET | /api/v1/inventory/adjustments | inventory | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | listAdjustments |
| POST | /api/v1/inventory/adjustments | inventory | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | createAdjustment |
| POST | /api/v1/inventory/opening-stock | inventory | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | importOpeningStock |
| GET | /api/v1/invoices | invoices | ACCOUNTANT | ACCOUNTANT, SALES, ADMIN, SUPERADMIN | listInvoices |
| GET | /api/v1/invoices/dealers/{dealerId} | invoices | ACCOUNTANT | ACCOUNTANT, SALES, ADMIN, SUPERADMIN | dealerInvoices |
| GET | /api/v1/invoices/{id} | invoices | ACCOUNTANT | ACCOUNTANT, SALES, ADMIN, SUPERADMIN | getInvoice |
| POST | /api/v1/invoices/{id}/email | invoices | ACCOUNTANT | ACCOUNTANT, SALES, ADMIN, SUPERADMIN | sendInvoiceEmail |
| GET | /api/v1/invoices/{id}/pdf | invoices | ACCOUNTANT | ACCOUNTANT, SALES, ADMIN, SUPERADMIN | downloadInvoicePdf |
| POST | /api/v1/multi-company/companies/switch | multi-company | SHARED | ADMIN, SUPERADMIN, ACCOUNTANT, SALES, FACTORY, DEALER | switchCompany |
| GET | /api/v1/orchestrator/dashboard/admin | orchestrator | ADMIN | ADMIN, SUPERADMIN | adminDashboard |
| GET | /api/v1/orchestrator/dashboard/factory | orchestrator | ADMIN | ADMIN, SUPERADMIN | factoryDashboard |
| GET | /api/v1/orchestrator/dashboard/finance | orchestrator | ADMIN | ADMIN, SUPERADMIN | financeDashboard |
| POST | /api/v1/orchestrator/dispatch | orchestrator | ADMIN | ADMIN, SUPERADMIN | dispatchOrder |
| POST | /api/v1/orchestrator/dispatch/{orderId} | orchestrator | ADMIN | ADMIN, SUPERADMIN | dispatchOrderAlias |
| POST | /api/v1/orchestrator/factory/dispatch/{batchId} | orchestrator | ADMIN | ADMIN, SUPERADMIN | dispatch |
| GET | /api/v1/orchestrator/health/events | orchestrator | ADMIN | ADMIN, SUPERADMIN | eventHealth |
| GET | /api/v1/orchestrator/health/integrations | orchestrator | ADMIN | ADMIN, SUPERADMIN | integrationsHealth |
| POST | /api/v1/orchestrator/orders/{orderId}/approve | orchestrator | ADMIN | ADMIN, SUPERADMIN | approveOrder |
| POST | /api/v1/orchestrator/orders/{orderId}/fulfillment | orchestrator | ADMIN | ADMIN, SUPERADMIN | fulfillOrder |
| POST | /api/v1/orchestrator/payroll/run | orchestrator | ADMIN | ADMIN, SUPERADMIN | runPayroll |
| GET | /api/v1/orchestrator/traces/{traceId} | orchestrator | ADMIN | ADMIN, SUPERADMIN | trace |
| GET | /api/v1/payroll/runs | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listPayrollRuns |
| POST | /api/v1/payroll/runs | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createPayrollRun |
| GET | /api/v1/payroll/runs/monthly | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listMonthlyPayrollRuns |
| POST | /api/v1/payroll/runs/monthly | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createMonthlyPayrollRun |
| GET | /api/v1/payroll/runs/weekly | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listWeeklyPayrollRuns |
| POST | /api/v1/payroll/runs/weekly | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createWeeklyPayrollRun |
| GET | /api/v1/payroll/runs/{id} | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getPayrollRun |
| POST | /api/v1/payroll/runs/{id}/approve | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | approvePayroll |
| POST | /api/v1/payroll/runs/{id}/calculate | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | calculatePayroll |
| GET | /api/v1/payroll/runs/{id}/lines | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getPayrollRunLines |
| POST | /api/v1/payroll/runs/{id}/mark-paid | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | markAsPaid |
| POST | /api/v1/payroll/runs/{id}/post | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | postPayroll |
| GET | /api/v1/payroll/summary/current-month | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getCurrentMonthPaySummary |
| GET | /api/v1/payroll/summary/current-week | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getCurrentWeekPaySummary |
| GET | /api/v1/payroll/summary/monthly | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getMonthlyPaySummary |
| GET | /api/v1/payroll/summary/weekly | payroll | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getWeeklyPaySummary |
| GET | /api/v1/portal/dashboard | portal | ADMIN | ADMIN, SUPERADMIN | dashboard |
| GET | /api/v1/portal/operations | portal | ADMIN | ADMIN, SUPERADMIN | operations |
| GET | /api/v1/portal/workforce | portal | ADMIN | ADMIN, SUPERADMIN | workforce |
| GET | /api/v1/production/brands | production | FACTORY | FACTORY, SALES, ADMIN, SUPERADMIN | listBrands |
| GET | /api/v1/production/brands/{brandId}/products | production | FACTORY | FACTORY, SALES, ADMIN, SUPERADMIN | listBrandProducts |
| GET | /api/v1/purchasing/goods-receipts | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listGoodsReceipts |
| POST | /api/v1/purchasing/goods-receipts | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createGoodsReceipt |
| GET | /api/v1/purchasing/goods-receipts/{id} | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getGoodsReceipt |
| GET | /api/v1/purchasing/purchase-orders | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listPurchaseOrders |
| POST | /api/v1/purchasing/purchase-orders | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createPurchaseOrder |
| GET | /api/v1/purchasing/purchase-orders/{id} | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getPurchaseOrder |
| GET | /api/v1/purchasing/raw-material-purchases | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | listPurchases |
| POST | /api/v1/purchasing/raw-material-purchases | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | createPurchase |
| POST | /api/v1/purchasing/raw-material-purchases/returns | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | recordPurchaseReturn |
| GET | /api/v1/purchasing/raw-material-purchases/{id} | purchasing | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | getPurchase |
| GET | /api/v1/raw-material-batches/{rawMaterialId} | raw-material-batches | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | batches |
| POST | /api/v1/raw-material-batches/{rawMaterialId} | raw-material-batches | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | createBatch |
| POST | /api/v1/raw-materials/intake | raw-materials | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | intake |
| GET | /api/v1/raw-materials/stock | raw-materials | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | stockSummary |
| GET | /api/v1/raw-materials/stock/inventory | raw-materials | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | inventory |
| GET | /api/v1/raw-materials/stock/low-stock | raw-materials | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | lowStock |
| GET | /api/v1/reports/account-statement | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | accountStatement |
| GET | /api/v1/reports/balance-sheet | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | balanceSheet |
| GET | /api/v1/reports/balance-warnings | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | balanceWarnings |
| GET | /api/v1/reports/cash-flow | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | cashFlow |
| GET | /api/v1/reports/inventory-reconciliation | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | inventoryReconciliation |
| GET | /api/v1/reports/inventory-valuation | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | inventoryValuation |
| GET | /api/v1/reports/monthly-production-costs | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | monthlyProductionCosts |
| GET | /api/v1/reports/production-logs/{id}/cost-breakdown | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | costBreakdown |
| GET | /api/v1/reports/profit-loss | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | profitLoss |
| GET | /api/v1/reports/reconciliation-dashboard | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | reconciliationDashboard |
| GET | /api/v1/reports/trial-balance | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | trialBalance |
| GET | /api/v1/reports/wastage | reports | ACCOUNTANT | ACCOUNTANT, ADMIN, SUPERADMIN | wastageReport |
| GET | /api/v1/sales/credit-requests | sales | SALES | SALES, ADMIN, SUPERADMIN | creditRequests |
| POST | /api/v1/sales/credit-requests | sales | SALES | SALES, ADMIN, SUPERADMIN | createCreditRequest |
| PUT | /api/v1/sales/credit-requests/{id} | sales | SALES | SALES, ADMIN, SUPERADMIN | updateCreditRequest |
| POST | /api/v1/sales/credit-requests/{id}/approve | sales | SALES | SALES, ADMIN, SUPERADMIN | approveCreditRequest |
| POST | /api/v1/sales/credit-requests/{id}/reject | sales | SALES | SALES, ADMIN, SUPERADMIN | rejectCreditRequest |
| GET | /api/v1/sales/dealers | sales | SALES | SALES, ADMIN, SUPERADMIN | listDealers |
| GET | /api/v1/sales/dealers/search | sales | SALES | SALES, ADMIN, SUPERADMIN | searchDealers |
| POST | /api/v1/sales/dispatch/confirm | sales | SALES | SALES, ADMIN, SUPERADMIN | confirmDispatch |
| POST | /api/v1/sales/dispatch/reconcile-order-markers | sales | SALES | SALES, ADMIN, SUPERADMIN | reconcileOrderMarkers |
| GET | /api/v1/sales/orders | sales | SALES | SALES, ADMIN, SUPERADMIN | orders |
| POST | /api/v1/sales/orders | sales | SALES | SALES, ADMIN, SUPERADMIN | createOrder |
| PUT | /api/v1/sales/orders/{id} | sales | SALES | SALES, ADMIN, SUPERADMIN | updateOrder |
| DELETE | /api/v1/sales/orders/{id} | sales | SALES | SALES, ADMIN, SUPERADMIN | deleteOrder |
| POST | /api/v1/sales/orders/{id}/cancel | sales | SALES | SALES, ADMIN, SUPERADMIN | cancelOrder |
| POST | /api/v1/sales/orders/{id}/confirm | sales | SALES | SALES, ADMIN, SUPERADMIN | confirmOrder |
| PATCH | /api/v1/sales/orders/{id}/status | sales | SALES | SALES, ADMIN, SUPERADMIN | updateStatus |
| GET | /api/v1/sales/promotions | sales | SALES | SALES, ADMIN, SUPERADMIN | promotions |
| POST | /api/v1/sales/promotions | sales | SALES | SALES, ADMIN, SUPERADMIN | createPromotion |
| PUT | /api/v1/sales/promotions/{id} | sales | SALES | SALES, ADMIN, SUPERADMIN | updatePromotion |
| DELETE | /api/v1/sales/promotions/{id} | sales | SALES | SALES, ADMIN, SUPERADMIN | deletePromotion |
| GET | /api/v1/sales/targets | sales | SALES | SALES, ADMIN, SUPERADMIN | targets |
| POST | /api/v1/sales/targets | sales | SALES | SALES, ADMIN, SUPERADMIN | createTarget |
| PUT | /api/v1/sales/targets/{id} | sales | SALES | SALES, ADMIN, SUPERADMIN | updateTarget |
| DELETE | /api/v1/sales/targets/{id} | sales | SALES | SALES, ADMIN, SUPERADMIN | deleteTarget |
| GET | /api/v1/suppliers | suppliers | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | listSuppliers |
| POST | /api/v1/suppliers | suppliers | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | createSupplier |
| GET | /api/v1/suppliers/{id} | suppliers | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | getSupplier |
| PUT | /api/v1/suppliers/{id} | suppliers | ACCOUNTANT | ACCOUNTANT, FACTORY, ADMIN, SUPERADMIN | updateSupplier |

## Regeneration

`python3 scripts/generate_frontend_portal_contracts.py --input /Users/anas/Documents/orchestrator_erp/bigbrightpaints-erp/openapi.json --md-out docs/frontend/PORTAL_API_CONTRACTS.md --json-out docs/frontend/PORTAL_API_CONTRACTS.json --per-portal-dir docs/frontend/portals`

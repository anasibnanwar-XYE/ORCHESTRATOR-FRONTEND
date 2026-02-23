# ACCOUNTANT Portal API Contracts

Canonical source: `openapi.json`
Generated at (UTC): `2026-02-23T18:20:38Z`
Source SHA256: `33ddd163c102607970ff0f4c45e95f0c2a9d2965749187f68beb5c012216efa1`

## Coverage

- Primary-owned operations: `138`
- Shared foundation operations: `13`
- Accessible cross-portal operations: `20`

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

## Accessible Cross-Portal Endpoints

| Method | Path | Primary Portal | Prefix | Operation |
| --- | --- | --- | --- | --- |
| GET | /api/v1/companies | ADMIN | companies | list_1 |
| POST | /api/v1/companies | ADMIN | companies | create_1 |
| PUT | /api/v1/companies/{id} | ADMIN | companies | update |
| DELETE | /api/v1/companies/{id} | ADMIN | companies | delete |
| GET | /api/v1/dealers | SALES | dealers | listDealers_1 |
| POST | /api/v1/dealers | SALES | dealers | createDealer |
| GET | /api/v1/dealers/search | SALES | dealers | searchDealers_1 |
| PUT | /api/v1/dealers/{dealerId} | SALES | dealers | updateDealer |
| GET | /api/v1/dealers/{dealerId}/aging | SALES | dealers | dealerAging |
| POST | /api/v1/dealers/{dealerId}/dunning/hold | SALES | dealers | holdIfOverdue |
| GET | /api/v1/dealers/{dealerId}/invoices | SALES | dealers | dealerInvoices_1 |
| GET | /api/v1/dealers/{dealerId}/ledger | SALES | dealers | dealerLedger |
| GET | /api/v1/finished-goods | FACTORY | finished-goods | listFinishedGoods |
| POST | /api/v1/finished-goods | FACTORY | finished-goods | createFinishedGood |
| GET | /api/v1/finished-goods/low-stock | FACTORY | finished-goods | getLowStockItems |
| GET | /api/v1/finished-goods/stock-summary | FACTORY | finished-goods | getStockSummary |
| GET | /api/v1/finished-goods/{id} | FACTORY | finished-goods | getFinishedGood |
| PUT | /api/v1/finished-goods/{id} | FACTORY | finished-goods | updateFinishedGood |
| GET | /api/v1/finished-goods/{id}/batches | FACTORY | finished-goods | listBatches |
| POST | /api/v1/finished-goods/{id}/batches | FACTORY | finished-goods | registerBatch |

## Regeneration

`python3 scripts/generate_frontend_portal_contracts.py --input /Users/anas/Documents/orchestrator_erp/bigbrightpaints-erp/openapi.json --md-out docs/frontend/PORTAL_API_CONTRACTS.md --json-out docs/frontend/PORTAL_API_CONTRACTS.json --per-portal-dir docs/frontend/portals`

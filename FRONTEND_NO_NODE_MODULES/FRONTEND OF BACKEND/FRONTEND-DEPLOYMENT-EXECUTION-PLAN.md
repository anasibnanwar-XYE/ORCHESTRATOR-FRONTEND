# Frontend Deployment Execution Plan — Definitive Edition

> **Runtime:** BUN only. `bun install`, `bun run dev`, `bun run build`, `bunx tsc --noEmit`.
>
> **Build gate:** `bunx tsc --noEmit && bun run build` must pass after every file change.
>
> **Last updated:** 2026-02-24
>
> **Backend contract SHA:** `33ddd163c102607970ff0f4c45e95f0c2a9d2965749187f68beb5c012216efa1`

---

# PART 1 — ENDPOINT AUDIT (Contract vs Codebase)

Every endpoint from the 6 portal contracts is listed below. Each row is marked:
- **WIRED** = wrapper function exists in API module AND called from a page
- **WRAPPED** = wrapper function exists but no page calls it yet
- **CLIENT** = exists in generated OpenAPI client only, no wrapper function
- **MISSING** = not in generated client, not wrapped, not wired

---

## 1A. Auth Foundation (13 endpoints — shared by all portals)

| # | Method | Path | Status | Wrapper | Page |
|---|--------|------|--------|---------|------|
| 1 | POST | `/api/v1/auth/login` | WIRED | `authApi.login()` | App.tsx |
| 2 | POST | `/api/v1/auth/logout` | WIRED | `authApi.logout()` | App.tsx |
| 3 | GET | `/api/v1/auth/me` | WIRED | `authApi.getMe()` | App.tsx |
| 4 | POST | `/api/v1/auth/mfa/setup` | WIRED | `mfaApi.setup()` | ProfilePage |
| 5 | POST | `/api/v1/auth/mfa/activate` | WIRED | `mfaApi.activate()` | ProfilePage |
| 6 | POST | `/api/v1/auth/mfa/disable` | WIRED | `mfaApi.disable()` | ProfilePage |
| 7 | POST | `/api/v1/auth/password/change` | WIRED | `authApi.changePassword()` | FirstPasswordChangePage, SettingsPage |
| 8 | POST | `/api/v1/auth/password/forgot` | WIRED | `authApi.forgotPassword()` | ForgotPasswordPage |
| 9 | POST | `/api/v1/auth/password/reset` | WIRED | `authApi.resetPassword()` | ResetPasswordPage |
| 10 | GET | `/api/v1/auth/profile` | WIRED | `profileApi.getProfile()` | ProfilePage |
| 11 | PUT | `/api/v1/auth/profile` | WIRED | `profileApi.updateProfile()` | ProfilePage |
| 12 | POST | `/api/v1/auth/refresh-token` | WRAPPED | `authApi.refreshToken()` | **NOT WIRED — no 401 interceptor** |
| 13 | POST | `/api/v1/multi-company/companies/switch` | WRAPPED | `adminApi.switchCompany()` | CompaniesPage (partial) |

**Gaps:**
- `refresh-token` has a wrapper but no automatic 401 interceptor. This is the #1 auth gap.

---

## 1B. Admin Portal (38 primary + 218 accessible cross-portal)

### Admin-Owned Endpoints

| # | Method | Path | Operation | Status | Wrapper | Page |
|---|--------|------|-----------|--------|---------|------|
| 1 | GET | `/api/v1/admin/users` | list | WIRED | `adminApi.listUsers()` | UserManagementPage |
| 2 | POST | `/api/v1/admin/users` | create | WIRED | `adminApi.createUser()` | UserManagementPage |
| 3 | PUT | `/api/v1/admin/users/{id}` | update | WIRED | `adminApi.updateUser()` | UserManagementPage |
| 4 | DELETE | `/api/v1/admin/users/{id}` | delete | WIRED | `adminApi.deleteUser()` | UserManagementPage |
| 5 | PATCH | `/api/v1/admin/users/{id}/mfa/disable` | disableMfa | WIRED | `adminApi.disableUserMfa()` | UserManagementPage |
| 6 | PATCH | `/api/v1/admin/users/{id}/suspend` | suspend | WIRED | `adminApi.suspendUser()` | UserManagementPage |
| 7 | PATCH | `/api/v1/admin/users/{id}/unsuspend` | unsuspend | WIRED | `adminApi.unsuspendUser()` | UserManagementPage |
| 8 | GET | `/api/v1/admin/roles` | listRoles | WIRED | `adminApi.listRoles()` | RolesPage |
| 9 | POST | `/api/v1/admin/roles` | createRole | WIRED | `adminApi.createRole()` | RolesPage |
| 10 | GET | `/api/v1/admin/roles/{roleKey}` | getRoleByKey | WRAPPED | `adminApi.getRoleByKey()` | **No page** |
| 11 | GET | `/api/v1/admin/settings` | getSettings | WIRED | `adminApi.getAdminSettings()` | SettingsPage |
| 12 | PUT | `/api/v1/admin/settings` | updateSettings | WIRED | `adminApi.updateAdminSettings()` | SettingsPage |
| 13 | GET | `/api/v1/admin/approvals` | approvals | WIRED | `adminApi.getAdminApprovals()` | ApprovalsPage |
| 14 | POST | `/api/v1/admin/notify` | notifyUser | WIRED | `adminApi.sendAdminNotification()` | SettingsPage |
| 15 | GET | `/api/v1/companies` | list | WIRED | `adminApi.listCompanies()` | CompaniesPage |
| 16 | POST | `/api/v1/companies` | create | WIRED | `adminApi.createCompany()` | CompaniesPage |
| 17 | PUT | `/api/v1/companies/{id}` | update | WIRED | `adminApi.updateCompany()` | CompaniesPage |
| 18 | DELETE | `/api/v1/companies/{id}` | delete | WIRED | `adminApi.deleteCompany()` | CompaniesPage |
| 19 | GET | `/api/v1/audit/business-events` | businessEvents | CLIENT | — | **No page** |
| 20 | GET | `/api/v1/audit/ml-events` | mlEvents | CLIENT | — | **No page** |
| 21 | POST | `/api/v1/audit/ml-events` | ingestMlEvents | CLIENT | — | **No page** |
| 22 | GET | `/api/integration/health` | health | CLIENT | — | **No page** |
| 23 | GET | `/api/v1/demo/ping` | ping | CLIENT | — | Not needed |
| 24 | GET | `/api/v1/orchestrator/dashboard/admin` | adminDashboard | CLIENT | — | **No page** (DashboardPage uses portalApi instead) |
| 25 | GET | `/api/v1/orchestrator/dashboard/factory` | factoryDashboard | CLIENT | — | **No page** |
| 26 | GET | `/api/v1/orchestrator/dashboard/finance` | financeDashboard | CLIENT | — | **No page** |
| 27 | POST | `/api/v1/orchestrator/dispatch` | dispatchOrder | CLIENT | — | Uses DispatchConfirmModal instead |
| 28 | POST | `/api/v1/orchestrator/dispatch/{orderId}` | dispatchOrderAlias | CLIENT | — | Same as above |
| 29 | POST | `/api/v1/orchestrator/factory/dispatch/{batchId}` | factoryDispatch | CLIENT | — | DispatchPage (factory) uses salesApi.confirmFactoryDispatch instead |
| 30 | GET | `/api/v1/orchestrator/health/events` | eventHealth | CLIENT | — | **No page** |
| 31 | GET | `/api/v1/orchestrator/health/integrations` | integrationsHealth | CLIENT | — | **No page** |
| 32 | POST | `/api/v1/orchestrator/orders/{orderId}/approve` | approveOrder | WIRED | `salesApi.approveSalesOrder()` | OrdersPage |
| 33 | POST | `/api/v1/orchestrator/orders/{orderId}/fulfillment` | fulfillOrder | WIRED | `salesApi.updateOrderFulfillment()` | OrderFulfillmentPage |
| 34 | POST | `/api/v1/orchestrator/payroll/run` | runPayroll | CLIENT | — | **No page** |
| 35 | GET | `/api/v1/orchestrator/traces/{traceId}` | trace | WRAPPED | `salesApi.getWorkflowTrace()` | **No page uses it** |
| 36 | GET | `/api/v1/portal/dashboard` | dashboard | WIRED | `portalApi.getDashboardInsights()` | DashboardPage |
| 37 | GET | `/api/v1/portal/operations` | operations | WIRED | `portalApi.getOperationsInsights()` | OperationsControlPage |
| 38 | GET | `/api/v1/portal/workforce` | workforce | WRAPPED | `portalApi.getWorkforceInsights()` | **No page** |

**Admin Gaps to Close:**
1. ApprovalsPage has no approve/reject action buttons — wire to `approveEndpoint`/`rejectEndpoint` from payload
2. `GET /api/v1/audit/business-events` — not surfaced in any page (needed for audit trail)
3. `GET /api/v1/orchestrator/traces/{traceId}` — wrapper exists but never called from UI
4. `GET /api/v1/portal/workforce` — wrapper exists but no page
5. RolesPage has no edit/delete — only create+list
6. EmployeesPage has no edit/delete — only create+list

---

## 1C. Accounting Portal (138 primary endpoints)

### GL / Journals / Periods (23 endpoints)

| # | Method | Path | Operation | Status | Wrapper |
|---|--------|------|-----------|--------|---------|
| 1 | GET | `/api/v1/accounting/accounts` | accounts | WIRED | `accountingApi.listAccounts()` |
| 2 | POST | `/api/v1/accounting/accounts` | createAccount | WIRED | via generated client |
| 3 | GET | `/api/v1/accounting/accounts/tree` | getChartOfAccountsTree | WIRED | `accountingApi.listAccountTree()` |
| 4 | GET | `/api/v1/accounting/accounts/tree/{type}` | getAccountTreeByType | WRAPPED | `accountingApi.listAccountTreeByType()` |
| 5 | GET | `/api/v1/accounting/accounts/{id}/activity` | getAccountActivity | WIRED | `accountingApi.accountStatement()` |
| 6 | GET | `/api/v1/accounting/accounts/{id}/balance/as-of` | getBalanceAsOf | CLIENT | — |
| 7 | GET | `/api/v1/accounting/accounts/{id}/balance/compare` | compareBalances | CLIENT | — |
| 8 | GET | `/api/v1/accounting/journal-entries` | journalEntries | WIRED | `accountingApi.listJournalEntries()` |
| 9 | POST | `/api/v1/accounting/journal-entries` | createJournalEntry | WIRED | `accountingApi.createJournalEntry()` |
| 10 | POST | `/api/v1/accounting/journal-entries/{id}/reverse` | reverseJournalEntry | WIRED | `accountingApi.reverseJournalEntry()` |
| 11 | POST | `/api/v1/accounting/journal-entries/{id}/cascade-reverse` | cascadeReverse | WIRED | `accountingApi.cascadeReverseJournalEntry()` |
| 12 | POST | `/api/v1/accounting/accruals` | postAccrual | WIRED | `accountingApi.postAccrual()` |
| 13 | GET | `/api/v1/accounting/periods` | listPeriods | WIRED | `accountingApi.listAccountingPeriods()` |
| 14 | POST | `/api/v1/accounting/periods/{id}/close` | closePeriod | WIRED | `accountingApi.closeAccountingPeriod()` |
| 15 | POST | `/api/v1/accounting/periods/{id}/lock` | lockPeriod | CLIENT | — |
| 16 | POST | `/api/v1/accounting/periods/{id}/reopen` | reopenPeriod | CLIENT | — |
| 17 | GET | `/api/v1/accounting/month-end/checklist` | checklist | WIRED | `accountingApi.getMonthEndChecklist()` |
| 18 | POST | `/api/v1/accounting/month-end/checklist/{periodId}` | updateChecklist | WIRED | `accountingApi.updateMonthEndChecklist()` |
| 19 | GET | `/api/v1/accounting/date-context` | getAccountingDateContext | **MISSING** | — |
| 20 | GET | `/api/v1/accounting/default-accounts` | defaultAccounts | CLIENT | — |
| 21 | PUT | `/api/v1/accounting/default-accounts` | updateDefaultAccounts | CLIENT | — |
| 22 | GET | `/api/v1/accounting/configuration/health` | health | WIRED | via generated client |
| 23 | GET | `/api/v1/accounting/gst/return` | generateGstReturn | WIRED | `accountingApi.getGstSummary()` |

### Dealer/Supplier Financials (20 endpoints)

| # | Method | Path | Operation | Status | Wrapper |
|---|--------|------|-----------|--------|---------|
| 24 | POST | `/api/v1/accounting/settlements/dealers` | settleDealer | WIRED | `accountingApi.createDealerSettlement()` |
| 25 | POST | `/api/v1/accounting/settlements/suppliers` | settleSupplier | WIRED | `accountingApi.createSupplierSettlement()` |
| 26 | POST | `/api/v1/accounting/receipts/dealer` | recordDealerReceipt | WIRED | `accountingApi.createDealerReceipt()` |
| 27 | POST | `/api/v1/accounting/receipts/dealer/hybrid` | recordDealerHybridReceipt | CLIENT | — |
| 28 | POST | `/api/v1/accounting/suppliers/payments` | recordSupplierPayment | WIRED | `accountingApi.createSupplierPayment()` |
| 29 | POST | `/api/v1/accounting/credit-notes` | postCreditNote | WIRED | `accountingApi.createCreditNote()` |
| 30 | POST | `/api/v1/accounting/debit-notes` | postDebitNote | WIRED | `accountingApi.createDebitNote()` |
| 31 | POST | `/api/v1/accounting/bad-debts/write-off` | writeOffBadDebt | CLIENT | — |
| 32 | GET | `/api/v1/accounting/statements/dealers/{id}` | dealerStatement | CLIENT | — |
| 33 | GET | `/api/v1/accounting/statements/dealers/{id}/pdf` | dealerStatementPdf | CLIENT | — |
| 34 | GET | `/api/v1/accounting/statements/suppliers/{id}` | supplierStatement | CLIENT | — |
| 35 | GET | `/api/v1/accounting/statements/suppliers/{id}/pdf` | supplierStatementPdf | CLIENT | — |
| 36 | GET | `/api/v1/accounting/aging/dealers/{id}` | dealerAging | WIRED | via generated client |
| 37 | GET | `/api/v1/accounting/aging/dealers/{id}/pdf` | dealerAgingPdf | CLIENT | — |
| 38 | GET | `/api/v1/accounting/aging/suppliers/{id}` | supplierAging | WIRED | `accountingApi.getSupplierAging()` |
| 39 | GET | `/api/v1/accounting/aging/suppliers/{id}/pdf` | supplierAgingPdf | CLIENT | — |
| 40 | GET | `/api/v1/accounting/sales/returns` | listSalesReturns | WIRED | via raw `apiData` in ReturnsPage |
| 41 | POST | `/api/v1/accounting/sales/returns` | recordSalesReturn | WIRED | via raw `apiData` in ReturnsPage |
| 42 | GET | `/api/v1/accounting/audit/digest` | auditDigest | WIRED | `accountingApi.getAuditDigest()` |
| 43 | GET | `/api/v1/accounting/audit/digest.csv` | auditDigestCsv | CLIENT | — |

### Inventory Accounting (3 endpoints)

| # | Method | Path | Operation | Status | Wrapper |
|---|--------|------|-----------|--------|---------|
| 44 | POST | `/api/v1/accounting/inventory/landed-cost` | recordLandedCost | CLIENT | — |
| 45 | POST | `/api/v1/accounting/inventory/revaluation` | revalueInventory | CLIENT | — |
| 46 | POST | `/api/v1/accounting/inventory/wip-adjustment` | adjustWip | CLIENT | — |

### Payroll (Accounting owns 20 endpoints)

| # | Method | Path | Operation | Status | Wrapper |
|---|--------|------|-----------|--------|---------|
| 47 | POST | `/api/v1/accounting/payroll/payments` | recordPayrollPayment | CLIENT | — |
| 48 | POST | `/api/v1/accounting/payroll/payments/batch` | processBatchPayment | CLIENT | — |
| 49 | GET | `/api/v1/payroll/runs` | listPayrollRuns | WIRED | `adminApi.listPayrollRuns()` |
| 50 | POST | `/api/v1/payroll/runs` | createPayrollRun | WIRED | via generated client |
| 51 | GET | `/api/v1/payroll/runs/weekly` | listWeeklyPayrollRuns | WIRED | `adminApi.createWeeklyPayrollRun()` |
| 52 | POST | `/api/v1/payroll/runs/weekly` | createWeeklyPayrollRun | WIRED | `adminApi.runWeeklyPayroll()` |
| 53 | GET | `/api/v1/payroll/runs/monthly` | listMonthlyPayrollRuns | WIRED | `adminApi.createMonthlyPayrollRun()` |
| 54 | POST | `/api/v1/payroll/runs/monthly` | createMonthlyPayrollRun | WIRED | `adminApi.runMonthlyPayroll()` |
| 55 | GET | `/api/v1/payroll/runs/{id}` | getPayrollRun | WIRED | `adminApi.getPayrollRun()` |
| 56 | GET | `/api/v1/payroll/runs/{id}/lines` | getPayrollRunLines | WIRED | `adminApi.getPayrollRunLines()` |
| 57 | POST | `/api/v1/payroll/runs/{id}/approve` | approvePayroll | WIRED | `adminApi.approvePayroll()` |
| 58 | POST | `/api/v1/payroll/runs/{id}/calculate` | calculatePayroll | WIRED | `adminApi.calculatePayroll()` |
| 59 | POST | `/api/v1/payroll/runs/{id}/mark-paid` | markAsPaid | WIRED | `adminApi.markPayrollAsPaid()` |
| 60 | POST | `/api/v1/payroll/runs/{id}/post` | postPayroll | WIRED | `adminApi.postPayrollToAccounting()` |
| 61 | GET | `/api/v1/payroll/summary/current-week` | currentWeek | WIRED | `adminApi.getCurrentWeekPaySummary()` |
| 62 | GET | `/api/v1/payroll/summary/current-month` | currentMonth | WIRED | `adminApi.getCurrentMonthPaySummary()` |
| 63 | GET | `/api/v1/payroll/summary/weekly` | weeklySummary | WIRED | `adminApi.getWeeklyPaySummary()` |
| 64 | GET | `/api/v1/payroll/summary/monthly` | monthlySummary | WIRED | `adminApi.getMonthlyPaySummary()` |

### Reports & Reconciliation (13 endpoints)

| # | Method | Path | Operation | Status | Wrapper |
|---|--------|------|-----------|--------|---------|
| 65 | GET | `/api/v1/reports/reconciliation-dashboard` | **reconciliationDashboard** | **WIRED** | `accountingApi.getReconciliationReport()` |
| 66 | GET | `/api/v1/reports/inventory-reconciliation` | inventoryReconciliation | CLIENT | — |
| 67 | GET | `/api/v1/reports/inventory-valuation` | inventoryValuation | CLIENT | — |
| 68 | GET | `/api/v1/reports/monthly-production-costs` | monthlyProductionCosts | CLIENT | — |
| 69 | GET | `/api/v1/reports/production-logs/{id}/cost-breakdown` | costBreakdown | CLIENT | — |
| 70 | GET | `/api/v1/reports/wastage` | wastageReport | CLIENT | — |
| 71 | GET | `/api/v1/reports/balance-warnings` | balanceWarnings | CLIENT | — |
| 72 | GET | `/api/v1/reports/account-statement` | accountStatement | CLIENT | — |
| 73 | GET | `/api/v1/reports/profit-loss` | profitLoss | WIRED | via ReportsPage (uses hierarchy endpoint) |
| 74 | GET | `/api/v1/reports/balance-sheet` | balanceSheet | WIRED | via ReportsPage (uses hierarchy endpoint) |
| 75 | GET | `/api/v1/reports/cash-flow` | cashFlow | WIRED | `accountingApi.getCashFlow()` |
| 76 | GET | `/api/v1/reports/trial-balance` | trialBalance | WIRED | `accountingApi.getTrialBalance()` |
| 77 | GET | `/api/v1/accounting/trial-balance/as-of` | trialBalanceAsOf | WIRED | `accountingApi.getTrialBalance()` |

### HR (15 endpoints)

| # | Method | Path | Operation | Status | Wrapper |
|---|--------|------|-----------|--------|---------|
| 78 | GET | `/api/v1/hr/employees` | employees | WIRED | `adminApi.listEmployees()` |
| 79 | POST | `/api/v1/hr/employees` | createEmployee | WIRED | `adminApi.createEmployee()` |
| 80 | PUT | `/api/v1/hr/employees/{id}` | updateEmployee | WRAPPED | `adminApi.updateEmployee()` — **no page calls it** |
| 81 | DELETE | `/api/v1/hr/employees/{id}` | deleteEmployee | CLIENT | — |
| 82 | GET | `/api/v1/hr/leave-requests` | leaveRequests | WRAPPED | `adminApi.listLeaveRequests()` — **no page calls it** |
| 83 | POST | `/api/v1/hr/leave-requests` | createLeaveRequest | WRAPPED | `adminApi.createLeaveRequest()` — **no page calls it** |
| 84 | PATCH | `/api/v1/hr/leave-requests/{id}/status` | updateLeaveStatus | WRAPPED | `adminApi.updateLeaveRequestStatus()` — **no page calls it** |
| 85 | GET | `/api/v1/hr/attendance/today` | attendanceToday | WIRED | `adminApi.getTodayAttendance()` |
| 86 | GET | `/api/v1/hr/attendance/date/{date}` | attendanceByDate | WIRED | `adminApi.getAttendanceByDate()` |
| 87 | GET | `/api/v1/hr/attendance/summary` | attendanceSummary | WIRED | `adminApi.getTodayAttendanceSummary()` |
| 88 | GET | `/api/v1/hr/attendance/employee/{id}` | employeeAttendance | WRAPPED | `adminApi.getEmployeeAttendanceHistory()` — imported but never called |
| 89 | POST | `/api/v1/hr/attendance/mark/{employeeId}` | markAttendance | WIRED | `adminApi.markEmployeeAttendance()` |
| 90 | POST | `/api/v1/hr/attendance/bulk-mark` | bulkMarkAttendance | WIRED | `adminApi.bulkMarkAttendance()` |
| 91 | GET | `/api/v1/hr/payroll-runs` | payrollRuns | WRAPPED | `adminApi.getPayrollSummary()` — no page |
| 92 | POST | `/api/v1/hr/payroll-runs` | createPayrollRun | WRAPPED | `adminApi.processPayroll()` — no page |

### Audit Transactions (2 endpoints — MISSING from client)

| # | Method | Path | Operation | Status |
|---|--------|------|-----------|--------|
| 93 | GET | `/api/v1/accounting/audit/transactions` | transactionAudit | **MISSING** |
| 94 | GET | `/api/v1/accounting/audit/transactions/{journalEntryId}` | transactionAuditDetail | **MISSING** |

### Purchasing / Suppliers / Catalog / Raw Materials / Invoices — remaining 44 endpoints

All purchasing endpoints (PO, GRN, Raw Material Purchases) are WIRED via `purchasingApi.ts`.
All supplier endpoints are WIRED via `accountingApi.ts`.
All catalog endpoints are WIRED via `accountingApi.ts`.
All raw material endpoints are WIRED via `factoryApi.ts`.
All invoice endpoints are WIRED via `accountingApi.ts`.

---

## 1D. Sales Portal (36 primary endpoints)

| # | Method | Path | Operation | Status | Wrapper | Page |
|---|--------|------|-----------|--------|---------|------|
| 1 | GET | `/api/v1/sales/orders` | orders | WIRED | `salesApi.listSalesOrders()` | OrdersPage |
| 2 | POST | `/api/v1/sales/orders` | createOrder | WIRED | `salesApi.createSalesOrder()` | OrdersPage |
| 3 | PUT | `/api/v1/sales/orders/{id}` | updateOrder | CLIENT | — | **No page** |
| 4 | DELETE | `/api/v1/sales/orders/{id}` | deleteOrder | CLIENT | — | **No page** |
| 5 | POST | `/api/v1/sales/orders/{id}/cancel` | cancelOrder | WRAPPED | `salesApi.cancelSalesOrder()` | OrdersPage uses `updateOrderStatus` instead |
| 6 | POST | `/api/v1/sales/orders/{id}/confirm` | confirmOrder | WIRED | `salesApi.confirmSalesOrder()` | OrdersPage |
| 7 | PATCH | `/api/v1/sales/orders/{id}/status` | updateStatus | WIRED | `salesApi.updateOrderStatus()` | OrdersPage |
| 8 | GET | `/api/v1/sales/credit-requests` | creditRequests | WIRED | `salesApi.listCreditRequests()` | CreditRequestsPage |
| 9 | POST | `/api/v1/sales/credit-requests` | createCreditRequest | WIRED | `salesApi.createCreditRequest()` | CreditRequestsPage |
| 10 | PUT | `/api/v1/sales/credit-requests/{id}` | updateCreditRequest | CLIENT | — | **No page** |
| 11 | POST | `/api/v1/sales/credit-requests/{id}/approve` | approveCreditRequest | CLIENT | — | **No page — missing approve button** |
| 12 | POST | `/api/v1/sales/credit-requests/{id}/reject` | rejectCreditRequest | CLIENT | — | **No page — missing reject button** |
| 13 | GET | `/api/v1/credit/override-requests` | listRequests | WRAPPED | `salesApi.listCreditOverrideRequests()` | **CreditOverridesPage doesn't call it** |
| 14 | POST | `/api/v1/credit/override-requests` | createRequest | WIRED | `salesApi.createCreditOverrideRequest()` | CreditOverridesPage |
| 15 | POST | `/api/v1/credit/override-requests/{id}/approve` | approveRequest | WRAPPED | `salesApi.approveCreditOverride()` | **No page** |
| 16 | POST | `/api/v1/credit/override-requests/{id}/reject` | rejectRequest | WRAPPED | `salesApi.rejectCreditOverride()` | **No page** |
| 17 | GET | `/api/v1/sales/promotions` | promotions | WIRED | `salesApi.listPromotions()` | PromotionsPage |
| 18 | POST | `/api/v1/sales/promotions` | createPromotion | WIRED | `salesApi.createPromotion()` | PromotionsPage |
| 19 | PUT | `/api/v1/sales/promotions/{id}` | updatePromotion | WIRED | `salesApi.updatePromotion()` | PromotionsPage |
| 20 | DELETE | `/api/v1/sales/promotions/{id}` | deletePromotion | WIRED | `salesApi.deletePromotion()` | PromotionsPage |
| 21 | GET | `/api/v1/sales/targets` | targets | WIRED | `salesApi.listSalesTargets()` | TargetsPage |
| 22 | POST | `/api/v1/sales/targets` | createTarget | WIRED | `salesApi.createSalesTarget()` | TargetsPage |
| 23 | PUT | `/api/v1/sales/targets/{id}` | updateTarget | WIRED | `salesApi.updateSalesTarget()` | TargetsPage |
| 24 | DELETE | `/api/v1/sales/targets/{id}` | deleteTarget | WIRED | `salesApi.deleteSalesTarget()` | TargetsPage |
| 25 | POST | `/api/v1/sales/dispatch/confirm` | confirmDispatch | WIRED | `salesApi.confirmDispatch()` | DispatchConfirmModal |
| 26 | POST | `/api/v1/sales/dispatch/reconcile-order-markers` | reconcileOrderMarkers | CLIENT | — | **No page** |
| 27 | GET | `/api/v1/sales/dealers` | listDealers | WIRED | `accountingApi.listDealers()` | DealersPage |
| 28 | GET | `/api/v1/sales/dealers/search` | searchDealers | WIRED | `accountingApi.searchDealers()` | Multiple pages |
| 29-36 | Dealer CRUD, invoices, ledger, aging, hold | — | WIRED | Various | Various |

**Sales Gaps to Close:**
1. Credit request approve/reject buttons (`POST .../approve`, `POST .../reject`) — endpoints exist, no UI
2. Credit override list view — wrapper exists, page doesn't call it
3. Workflow trace viewer — wrapper exists (`salesApi.getWorkflowTrace()`), no UI
4. ReturnsPage uses raw `apiData()` instead of typed wrapper functions
5. OrdersPage has no order detail view

---

## 1E. Factory Portal (44 primary endpoints)

| # | Method | Path | Operation | Status | Wrapper | Page |
|---|--------|------|-----------|--------|---------|------|
| 1 | GET | `/api/v1/factory/dashboard` | dashboard | WIRED | `factoryApi.getFactoryDashboard()` | FactoryDashboardPage |
| 2 | GET | `/api/v1/factory/production-plans` | plans | WRAPPED | `factoryApi.listProductionPlans()` | **NO PAGE EXISTS** |
| 3 | POST | `/api/v1/factory/production-plans` | createPlan | WRAPPED | `factoryApi.createProductionPlan()` | **NO PAGE EXISTS** |
| 4 | PUT | `/api/v1/factory/production-plans/{id}` | updatePlan | WRAPPED | `factoryApi.updateProductionPlan()` | **NO PAGE EXISTS** |
| 5 | DELETE | `/api/v1/factory/production-plans/{id}` | deletePlan | WRAPPED | `factoryApi.deleteProductionPlan()` | **NO PAGE EXISTS** |
| 6 | PATCH | `/api/v1/factory/production-plans/{id}/status` | updatePlanStatus | CLIENT | — | **NO PAGE EXISTS** |
| 7 | GET | `/api/v1/factory/production/logs` | list | WIRED | `factoryApi.listProductionLogs()` | ProductionBatchesPage |
| 8 | POST | `/api/v1/factory/production/logs` | create | WIRED | `factoryApi.createProductionLog()` | ProductionBatchesPage |
| 9 | GET | `/api/v1/factory/production/logs/{id}` | detail | WIRED | `factoryApi.getProductionLog()` | PackingQueuePage |
| 10 | GET | `/api/v1/factory/production-batches` | batches | WIRED | `factoryApi.listProductionBatches()` | ProductionBatchesPage |
| 11 | POST | `/api/v1/factory/production-batches` | logBatch | WIRED | `factoryApi.createProductionBatch()` | ProductionBatchesPage |
| 12 | GET | `/api/v1/factory/tasks` | tasks | WIRED | `factoryApi.listTasks()` | TasksPage |
| 13 | POST | `/api/v1/factory/tasks` | createTask | WIRED | `factoryApi.createTask()` | TasksPage |
| 14 | PUT | `/api/v1/factory/tasks/{id}` | updateTask | WIRED | `factoryApi.updateTask()` | TasksPage |
| 15 | GET | `/api/v1/factory/packaging-mappings` | listMappings | WIRED | `factoryApi.listPackagingMappings()` | PackagingMappingsPage |
| 16 | POST | `/api/v1/factory/packaging-mappings` | createMapping | WIRED | `factoryApi.createPackagingMapping()` | PackagingMappingsPage |
| 17 | GET | `/api/v1/factory/packaging-mappings/active` | listActive | CLIENT | — | **No page** |
| 18 | PUT | `/api/v1/factory/packaging-mappings/{id}` | updateMapping | WIRED | `factoryApi.updatePackagingMapping()` | PackagingMappingsPage |
| 19 | DELETE | `/api/v1/factory/packaging-mappings/{id}` | deactivate | WIRED | `factoryApi.deactivatePackagingMapping()` | PackagingMappingsPage |
| 20 | GET | `/api/v1/factory/unpacked-batches` | listUnpacked | WIRED | `factoryApi.listUnpackedBatches()` | PackingQueuePage |
| 21 | POST | `/api/v1/factory/packing-records` | recordPacking | WIRED | `factoryApi.createPackingRecord()` | PackingQueuePage |
| 22 | POST | `/api/v1/factory/packing-records/{id}/complete` | completePacking | WIRED | `factoryApi.completePackingForLog()` | PackingQueuePage |
| 23 | GET | `/api/v1/factory/production-logs/{id}/packing-history` | packingHistory | WIRED | `factoryApi.getPackingHistory()` | PackingQueuePage |
| 24 | GET | `/api/v1/factory/bulk-batches/{finishedGoodId}` | listBulkBatches | WIRED | `factoryApi.listBulkBatches()` | BulkPackingPage |
| 25 | GET | `/api/v1/factory/bulk-batches/{parentBatchId}/children` | listChildBatches | CLIENT | — | **No page** |
| 26 | POST | `/api/v1/factory/pack` | packBulkToSizes | WIRED | `factoryApi.packFinishedGoods()` | BulkPackingPage |
| 27 | POST | `/api/v1/factory/cost-allocation` | allocateCosts | CLIENT | — | **No page** |
| 28-44 | Dispatch + Finished Goods + Production Brands | — | Mostly WIRED | Various | Various |

**Factory Gaps to Close:**
1. **Production Plans CRUD — 5 endpoints with ZERO UI** (wrappers exist, no page)
2. `POST /api/v1/factory/cost-allocation` — no wrapper, no page
3. `GET /api/v1/factory/bulk-batches/{parentBatchId}/children` — no wrapper, no page
4. `PATCH /api/v1/factory/production-plans/{id}/status` — no wrapper, no page

---

## 1F. Dealer Portal (7 primary endpoints)

| # | Method | Path | Operation | Status | Wrapper | Page |
|---|--------|------|-----------|--------|---------|------|
| 1 | GET | `/api/v1/dealer-portal/dashboard` | getDashboard | WIRED | `dealerApi.getDealerDashboard()` | DealerDashboardPage |
| 2 | GET | `/api/v1/dealer-portal/orders` | getMyOrders | WIRED | `dealerApi.getDealerOrders()` | OrdersPage |
| 3 | GET | `/api/v1/dealer-portal/invoices` | getMyInvoices | WIRED | `dealerApi.getDealerInvoices()` | InvoicesPage |
| 4 | GET | `/api/v1/dealer-portal/invoices/{id}/pdf` | getMyInvoicePdf | WIRED | `dealerApi.getDealerInvoicePdf()` | InvoicesPage |
| 5 | GET | `/api/v1/dealer-portal/ledger` | getMyLedger | WIRED | `dealerApi.getDealerLedger()` | LedgerPage |
| 6 | GET | `/api/v1/dealer-portal/aging` | getMyAging | WIRED | `dealerApi.getDealerAging()` | AgingPage |
| 7 | POST | `/api/v1/dealer-portal/credit-requests` | createCreditRequest | **NOT WIRED** | — | **CreditRequestsPage uses salesApi (wrong!)** |

**Dealer Gaps to Close:**
1. `POST /api/v1/dealer-portal/credit-requests` — needs wrapper in `dealerApi.ts`, page must switch from `salesApi`
2. PromotionsPage uses `salesApi.listPromotions()` — may 403 for dealer-only users
3. OrdersPage renders phantom timeline fields that don't exist in the response
4. DealerProfilePage shows fields the API doesn't return

---

# PART 2 — STEP-BY-STEP EXECUTION PLAN

---

## Phase 0: Foundation (Before Any Portal Work)

### Step 0.1 — Token Refresh Interceptor
**Scope:** `admin/lib/api.ts`
**Endpoints:** `POST /api/v1/auth/refresh-token`
**Work:**
1. Add 401 response interceptor to `apiRequest` and `apiData`
2. On 401: queue failed request → call `authApi.refreshToken()` → update stored tokens → replay
3. On refresh failure: clear session → redirect to login
4. Handle `mustChangePassword: true` → redirect to `/first-password-change`
**Build gate:** `bun run build`

### Step 0.2 — Auth Headers
**Scope:** `admin/lib/api.ts`
**Work:**
1. Send `X-Company-Code` (not `X-Company-Id`) on all authenticated requests
2. Send both `X-Company-Code` and `X-Company-Id` with same value for backward compat
3. Add `Idempotency-Key` (UUID v4) header to all POST/PUT/PATCH requests
**Build gate:** `bun run build`

### Step 0.3 — Shared UX Components
**Scope:** Create 5 new files in `admin/components/ui/`
**Work:**
1. `ConfirmDialog.tsx` — wraps `ResponsiveModal`, confirm/cancel, danger variant (replaces all `alert()`/`confirm()`)
2. `EmptyState.tsx` — icon + title + description + optional CTA
3. `PageSkeleton.tsx` — shimmer loading placeholder
4. `Toast.tsx` — auto-dismiss notification (success/error/info), stacked top-right
5. `StatusBadge.tsx` — unified status→color mapping used by every portal
**Build gate:** `bun run build`

### Step 0.4 — Font & CSS Cleanup
**Scope:** `tailwind.config.js`, `admin/index.css`, `styles.css`
**Work:**
1. Add `fontFamily.mono: ['JetBrains Mono', ...]` to tailwind config
2. Remove `font-body` (duplicate of `font-sans`)
3. Add `@font-face` for JetBrains Mono Regular/Medium
4. Unify CSS variables: `variables.css` is canonical, `styles.css` is fallback-only for pre-React splash
**Build gate:** `bun run build`

### Step 0.5 — Centralize Utilities
**Scope:** All page files that define local `formatDate`/`formatMoney`
**Work:** Remove all local definitions, import from `admin/lib/formatUtils.ts` everywhere
**Build gate:** `bun run build`

---

## Phase 1: Admin Portal

### Step 1.1 — Approvals: Add Approve/Reject Actions
**Scope:** `admin/pages/ApprovalsPage.tsx`
**Endpoints to hook:**
- `POST /api/v1/sales/credit-requests/{id}/approve`
- `POST /api/v1/sales/credit-requests/{id}/reject`
- `POST /api/v1/credit/override-requests/{id}/approve`
- `POST /api/v1/credit/override-requests/{id}/reject`
- `POST /api/v1/payroll/runs/{id}/approve`
**Work:** Read `approveEndpoint` and `rejectEndpoint` from each approval item's payload. Call dynamically. Use `ConfirmDialog` before destructive actions. Show reject button only when `rejectEndpoint` is non-null.

### Step 1.2 — Auth Pages: Token Consistency
**Scope:** `LoginPage.tsx`, `MfaPage.tsx`, `FirstPasswordChangePage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`
**Work:** Replace all hardcoded `zinc-*`, `rose-*` colors with semantic tokens. Use `FormInput` components. Fix `OpenAPI.TOKEN` mutation in FirstPasswordChangePage. Replace `window.location.href` with `useNavigate()`.

### Step 1.3 — Dashboard & Operations
**Scope:** `DashboardPage.tsx`, `OperationsControlPage.tsx`
**Endpoints to hook (new):** `GET /api/v1/portal/workforce` (already wrapped, not wired)
**Work:** Replace 26x `dark:bg-[#121214]` with `bg-surface`. Wire workforce insights to Dashboard. Remove static "Recommended Actions" from OperationsControlPage.

### Step 1.4 — HR Pages: Full CRUD + Leave
**Scope:** `admin/EmployeesPage.tsx`, `admin/AttendancePage.tsx`, `admin/PayrollPage.tsx`
**Endpoints to hook (new):**
- `PUT /api/v1/hr/employees/{id}` — wrapper exists (`adminApi.updateEmployee()`), add edit UI
- `DELETE /api/v1/hr/employees/{id}` — add wrapper + delete button
- `GET /api/v1/hr/leave-requests` — wrapper exists (`adminApi.listLeaveRequests()`), no UI
- `POST /api/v1/hr/leave-requests` — wrapper exists (`adminApi.createLeaveRequest()`), no UI
- `PATCH /api/v1/hr/leave-requests/{id}/status` — wrapper exists, no UI
**Work:** Add edit/delete to EmployeesPage. Build Leave tab in AccountingEmployeesPage with leave request list + create + approve/reject. Implement PayrollPage History tab. Replace all `confirm()`/`alert()` with `ConfirmDialog`. Remove all `as any`. Replace raw HTML with design-system components.

### Step 1.5 — Roles: Edit/Delete
**Scope:** `admin/RolesPage.tsx`
**Endpoints:** `GET /api/v1/admin/roles/{roleKey}` (wrapped, not wired)
**Work:** Add edit/delete role capabilities. Wire `getRoleByKey()` for detail view.

### Step 1.6 — Settings: Fix Non-Functional Toggles
**Scope:** `admin/SettingsPage.tsx`
**Work:** Remove session timeout/JIT provisioning/notification toggles that don't persist (no backend endpoints exist). Or wire to `PUT /api/v1/admin/settings` if these fields are in the settings payload.

---

## Phase 2: Accounting Portal

### Step 2.1 — CRITICAL: Fix DealersPage React Hooks Violation
**Scope:** `accounting/DealersPage.tsx`
**Work:** Move all `useState` calls above conditional returns. Remove 4x `@ts-ignore`, 2x `alert()`, `window.confirm()`. Replace with `ConfirmDialog`.

### Step 2.2 — Reconciliation Dashboard (Endpoint EXISTS)
**Scope:** `accounting/BankReconciliationPage.tsx` (currently 15-line stub)
**Endpoint:** `GET /api/v1/reports/reconciliation-dashboard?bankAccountId=&statementBalance=`
**Wrapper:** `accountingApi.getReconciliationReport()` — **ALREADY EXISTS**
**Work:**
1. Replace stub with full reconciliation UI
2. Bank account selector (from `listAccounts()` filtered to ASSET type)
3. Statement balance input
4. Call `getReconciliationReport()` with params
5. Display: matched items, unmatched items, variance, reconciliation summary
6. Add `ConfirmDialog` before any reconciliation actions
**This is NOT a missing endpoint — the wrapper exists, the page just never calls it.**

### Step 2.3 — Additional Report Endpoints to Wire
**Scope:** `accounting/ReportsPage.tsx`
**New endpoints to hook:**
- `GET /api/v1/reports/inventory-reconciliation` — add Inventory Reconciliation tab
- `GET /api/v1/reports/inventory-valuation` — add Inventory Valuation tab
- `GET /api/v1/reports/monthly-production-costs` — add Production Costs tab
- `GET /api/v1/reports/wastage` — add Wastage Report tab
- `GET /api/v1/reports/balance-warnings` — add Balance Warnings indicator
- `GET /api/v1/accounting/audit/digest.csv` — add CSV export button to AuditDigestPage
**Work:** Create wrapper functions for each in `accountingApi.ts`. Add report tabs/sections. Add export button for CSV.

### Step 2.4 — Statements & Aging PDFs
**Scope:** `accounting/DealersPage.tsx`, `accounting/SuppliersPage.tsx`
**New endpoints to hook:**
- `GET /api/v1/accounting/statements/dealers/{id}/pdf` — download button
- `GET /api/v1/accounting/statements/suppliers/{id}/pdf` — download button
- `GET /api/v1/accounting/aging/dealers/{id}/pdf` — download button
- `GET /api/v1/accounting/aging/suppliers/{id}/pdf` — download button
**Work:** Add PDF download buttons in dealer/supplier detail views. Create wrapper functions.

### Step 2.5 — Missing Accounting Endpoints to Wire
**Scope:** Various
**Endpoints to hook:**
- `POST /api/v1/accounting/bad-debts/write-off` — add action in dealer aging view
- `GET/PUT /api/v1/accounting/default-accounts` — add to Settings or ConfigHealth page
- `POST /api/v1/accounting/inventory/landed-cost` — add to Inventory tab
- `POST /api/v1/accounting/inventory/revaluation` — add to Inventory tab
- `POST /api/v1/accounting/inventory/wip-adjustment` — add to Inventory tab
- `POST /api/v1/accounting/payroll/payments` — add to Payroll page
- `POST /api/v1/accounting/payroll/payments/batch` — add batch payment action
- `POST /api/v1/accounting/periods/{id}/lock` — add lock button to PeriodsPage
- `POST /api/v1/accounting/periods/{id}/reopen` — add reopen button to PeriodsPage
- `POST /api/v1/accounting/receipts/dealer/hybrid` — add hybrid receipt option to PaymentsPage

### Step 2.6 — Audit Transactions (MISSING from generated client)
**Scope:** `accountingApi.ts`, new page or tab
**Endpoints:** `GET /api/v1/accounting/audit/transactions`, `GET /api/v1/accounting/audit/transactions/{journalEntryId}`
**Work:** These endpoints are **not in the generated OpenAPI client**. Either:
1. Regenerate client from latest `openapi.json`, OR
2. Add raw `apiData` wrappers manually
Then build audit transaction list page with drill-down into journal entry detail.

### Step 2.7 — Delete Duplicate Page
**Scope:** `accounting/JournalTabsPage.tsx`
**Work:** Delete file (exact duplicate of `TransactionsPage.tsx`). Update any imports/routes.

### Step 2.8 — Design-System Migration (9 files)
**Scope:** CatalogPage, SuppliersPage, AuditDigestPage, InvoicesPage, PayrollPage, AccountingPeriodsPage, MonthEndPage, GoodsReceiptPage, PurchaseOrdersPage
**Work:** Replace raw HTML/HeadlessUI with design-system components. Replace hardcoded colors with semantic tokens. Replace `confirm()` with `ConfirmDialog`. Remove `console.error`.

---

## Phase 3: Sales Portal

### Step 3.1 — Credit Request Approve/Reject
**Scope:** `sales/CreditRequestsPage.tsx`
**Endpoints to hook:**
- `POST /api/v1/sales/credit-requests/{id}/approve` — add wrapper to `salesApi.ts`
- `POST /api/v1/sales/credit-requests/{id}/reject` — add wrapper to `salesApi.ts`
**Work:** Add approve/reject buttons on each pending request. Use `ConfirmDialog`. Add status filter tabs. Replace raw autocomplete with `SearchableCombobox`.

### Step 3.2 — Credit Override List View
**Scope:** `sales/CreditOverridesPage.tsx`
**Endpoints:** `salesApi.listCreditOverrideRequests()` — wrapper exists, page doesn't call it
**Work:** Add request history list above the create form. Show status of each request.

### Step 3.3 — Returns: Typed API Functions
**Scope:** `salesApi.ts`, `sales/ReturnsPage.tsx`
**Endpoints:** `GET /api/v1/accounting/sales/returns`, `POST /api/v1/accounting/sales/returns`
**Work:** Create typed wrapper functions in `accountingApi.ts` (these are accounting-owned endpoints). Replace raw `apiData()` calls in ReturnsPage. Add product search via `SearchableCombobox`.

### Step 3.4 — Fix Broken Components
**Scope:** `components/CreditUtilizationBar.tsx`, `components/DealerCard.tsx`, `DealersPage.tsx`
**Work:**
- Fix `text-muted-foreground` → `text-tertiary`
- Fix hardcoded `status="active"` on every dealer → read actual status from API

### Step 3.5 — Extract CreateOrderModal
**Scope:** `sales/OrdersPage.tsx` (1321 lines)
**Work:** Extract `CreateOrderModal` (~838 lines) to `sales/modals/CreateOrderModal.tsx`. Remove `as any` on dealer selection.

### Step 3.6 — Design-System Migration
**Scope:** OrdersPage, InvoicesPage, TargetsPage, DealerReceivablesPage, DispatchPage, RegisterDealerModal, DealerDetailModal
**Work:** Replace HeadlessUI/raw HTML modals with `ResponsiveModal`. Replace raw forms with `FormInput`. Add mobile card views.

---

## Phase 4: Factory Portal

### Step 4.1 — CRITICAL: Production Plans Page (New)
**Scope:** Create `factory/ProductionPlansPage.tsx`
**Endpoints to hook:**
- `GET /api/v1/factory/production-plans` — `factoryApi.listProductionPlans()`
- `POST /api/v1/factory/production-plans` — `factoryApi.createProductionPlan()`
- `PUT /api/v1/factory/production-plans/{id}` — `factoryApi.updateProductionPlan()`
- `DELETE /api/v1/factory/production-plans/{id}` — `factoryApi.deleteProductionPlan()`
- `PATCH /api/v1/factory/production-plans/{id}/status` — add wrapper to `factoryApi.ts`
**Work:** Full CRUD page with status transitions (Draft→Approved→In Progress→Completed). Fix `ProductionPage.tsx` tab — replace `OrderFulfillmentPage` with `ProductionPlansPage`. Move OrderFulfillmentPage to separate "Order Queue" tab.

### Step 4.2 — Code Quality Sweep (4 files)
**Scope:** `ProductionBatchesPage.tsx`, `PackingQueuePage.tsx`, `RawMaterialsPage.tsx`, `FinishedGoodsPage.tsx`
**Work:** Remove 25x `as any` — type DTOs properly. Replace 4x `alert()` with `Toast`/inline banners. Remove 17x `console.error`. Replace `confirm()` with `ConfirmDialog`. Replace hardcoded packing sizes with data from `listPackagingMappings()`.

### Step 4.3 — Missing Endpoint Wiring
**Scope:** `factoryApi.ts`
**Endpoints to hook:**
- `POST /api/v1/factory/cost-allocation` — add wrapper, add action in production batch detail
- `GET /api/v1/factory/bulk-batches/{parentBatchId}/children` — add wrapper, add child batch expansion
- `PATCH /api/v1/dispatch/slip/{slipId}/status` — add wrapper, add status update in DispatchPage
- `POST /api/v1/dispatch/backorder/{slipId}/cancel` — add wrapper, add cancel backorder button

### Step 4.4 — Design-System Migration
**Scope:** FactoryDashboardPage, StockOverviewPage, OrderFulfillmentPage, PackagingMappingsPage
**Work:** Replace raw HTML tables with `ResponsiveTable`. Replace raw cards with `ResponsiveCard`. Replace hardcoded `indigo-*`/`emerald-*`/`blue-*` colors with semantic tokens.

---

## Phase 5: Dealer Portal

### Step 5.1 — Fix Wrong API Dependencies
**Scope:** `dealerApi.ts`, `dealer/CreditRequestsPage.tsx`, `dealer/PromotionsPage.tsx`
**Endpoints to hook:**
- `POST /api/v1/dealer-portal/credit-requests` — add `createDealerCreditRequest()` to `dealerApi.ts`
**Work:** Switch CreditRequestsPage from `salesApi.listCreditRequests()`/`salesApi.createCreditRequest()` to dealer-portal-specific endpoints. For PromotionsPage, wrap `salesApi.listPromotions()` with graceful 403 handling.

### Step 5.2 — Fix Phantom Data
**Scope:** `dealer/OrdersPage.tsx`, `dealer/DealerProfilePage.tsx`
**Work:**
- Remove phantom progress timeline (fields `confirmedAt`, `shippedAt`, `deliveredDate` don't exist in API response). Replace with simple `StatusBadge`.
- Remove 9x `any` types — type order response properly
- Fix DealerProfilePage: remove dealer-specific fields the API doesn't return. Remove `DLR-XXXX` fallback.
- Remove static notifications list — replace with `EmptyState`

### Step 5.3 — Design-System Migration
**Scope:** `dealer/OrdersPage.tsx`, `dealer/DealerProfilePage.tsx`, `dealer/CreditRequestsPage.tsx`, `dealer/PromotionsPage.tsx`
**Work:** Replace all raw HTML with design-system components. Replace `@heroicons/react` with `lucide-react`. Use `ResponsiveTable` for lists.

### Step 5.4 — Utility Deduplication
**Scope:** `dealer/InvoicesPage.tsx`, `dealer/AgingPage.tsx`, `dealer/DealerProfilePage.tsx`, `dealer/DealerDashboardPage.tsx`
**Work:** Remove local `formatDate`/`formatMoney` — import from `formatUtils.ts`. Remove `as any`. Remove `console.error`. Remove dead imports.

---

## Phase 6: Superadmin Portal (Control-Plane Only)

### Scope Guardrail

Superadmin operates on **tenant metadata and policy only**, never on tenant business records.

| In Scope | Out of Scope |
|----------|-------------|
| Create/list/update companies (tenants) | Tenant sales/purchasing/journal screens |
| Tenant lifecycle: ACTIVE / HOLD / BLOCKED | Direct cross-tenant business data browsing |
| Tenant runtime policy: concurrent/request/user quotas | Any endpoint that posts tenant financial events |
| Tenant metrics: active users, requests, error rate | Inventory rows, payroll details, invoices |
| Audit trail: control-plane actions + policy change logs | Drill-down into tenant transactional data |
| Platform RBAC governance for privileged roles only | Modifying tenant-level roles/users (that's Admin portal) |

**Break-glass rule:** If emergency tenant data access is needed, require explicit "break-glass + reason + immutable audit" flow. This is NOT built in Phase 6 — it is a future enhancement with its own security review.

### Step 6.1 — Shell & Layout
**Scope:** Create `admin/layouts/SuperadminLayout.tsx`, `admin/lib/superadminApi.ts`
**Endpoints to hook:**
- `GET /api/v1/companies` — tenant registry
- `POST /api/v1/companies` — create tenant
- `PUT /api/v1/companies/{id}` — update tenant
- `DELETE /api/v1/companies/{id}` — decommission tenant (with break-glass ConfirmDialog)
- `GET /api/v1/admin/roles` — platform RBAC governance
- `GET /api/v1/audit/business-events` — control-plane audit trail
**Work:** Create layout with sidebar: Dashboard, Tenant Registry, Tenant Policy, Platform RBAC, Audit Trail. Add `/superadmin/*` route group in App.tsx gated on `ROLE_SUPERADMIN`.

### Step 6.2 — Tenant Registry Page
**Scope:** Create `admin/pages/superadmin/TenantRegistryPage.tsx`
**Endpoints:** Companies CRUD (reuse `adminApi` wrappers)
**Work:** List all tenants with: name, code, status (ACTIVE/HOLD/BLOCKED), user count, created date. Create/edit/decommission with `ConfirmDialog` (danger variant for decommission). Status transitions with immutable audit logging.

### Step 6.3 — Tenant Policy Page
**Scope:** Create `admin/pages/superadmin/TenantPolicyPage.tsx`
**Work:** Per-tenant runtime policy controls:
- Concurrent session limit
- Request rate limit
- Max users quota
- Storage quota
These may require backend endpoints that don't exist yet. If so, build the page as read-only with `EmptyState` and a "Coming soon — backend support pending" note.

### Step 6.4 — Tenant Metrics Dashboard
**Scope:** Create `admin/pages/superadmin/SuperadminDashboardPage.tsx`
**Endpoints:**
- `GET /api/integration/health` — system health
- `GET /api/v1/orchestrator/health/events` — event health
- `GET /api/v1/orchestrator/health/integrations` — integration health
**Work:** High-signal control-plane dashboard: total tenants, system health cards (green/yellow/red), event health, integration health. No tenant business data.

### Step 6.5 — Control-Plane Audit Trail
**Scope:** Create `admin/pages/superadmin/AuditTrailPage.tsx`
**Endpoints:** `GET /api/v1/audit/business-events`
**Work:** Filterable list of control-plane events only (tenant creation, policy changes, role assignments, break-glass access). Date range filter, event type filter, user filter. Paginated table with detail expansion. This page explicitly filters out tenant transactional events.

### Step 6.6 — Platform RBAC Governance
**Scope:** Create `admin/pages/superadmin/PlatformRbacPage.tsx`
**Endpoints:** `GET /api/v1/admin/roles`, `POST /api/v1/admin/roles`, `GET /api/v1/admin/roles/{roleKey}`
**Work:** View and manage privileged platform roles only (ROLE_SUPERADMIN, ROLE_ADMIN). NOT tenant-level roles. Show which tenants have which privileged roles assigned.

---

# PART 3 — PHASE SEQUENCING

| Day | Phase | Steps | Scope |
|-----|-------|-------|-------|
| 1 | Foundation | 0.1, 0.2 | Token refresh interceptor, auth headers |
| 2 | Foundation | 0.3, 0.4 | Shared UX components, font/CSS cleanup |
| 3 | Foundation + Admin | 0.5, 1.1 | Utility centralization, Approvals actions |
| 4 | Admin | 1.2 | Auth pages token consistency (5 files) |
| 5 | Admin | 1.3, 1.4 | Dashboard, HR pages CRUD + Leave |
| 6 | Admin | 1.5, 1.6 | Roles edit/delete, Settings cleanup |
| 7 | Accounting | 2.1, 2.2 | DealersPage hooks fix, Reconciliation Dashboard |
| 8 | Accounting | 2.3 | Report endpoints wiring (6 new reports) |
| 9 | Accounting | 2.4, 2.5 | Statement/aging PDFs, missing endpoint wiring |
| 10 | Accounting | 2.6, 2.7, 2.8 | Audit transactions, delete duplicate, design migration |
| 11 | Sales | 3.1, 3.2 | Credit request approve/reject, override list view |
| 12 | Sales | 3.3, 3.4 | Returns typed API, fix broken components |
| 13 | Sales | 3.5, 3.6 | Extract CreateOrderModal, design migration |
| 14 | Factory | 4.1 | Production Plans page (CRITICAL — new page) |
| 15 | Factory | 4.2 | Code quality sweep (25 `as any`, 4 `alert()`, 17 `console.error`) |
| 16 | Factory | 4.3, 4.4 | Missing endpoint wiring, design migration |
| 17 | Dealer | 5.1, 5.2 | Fix wrong APIs, fix phantom data |
| 18 | Dealer | 5.3, 5.4 | Design migration, utility dedup |
| 19 | Superadmin | 6.1, 6.2 | Shell/layout, tenant registry |
| 20 | Superadmin | 6.3, 6.4, 6.5, 6.6 | Policy, dashboard, audit trail, RBAC |

---

# PART 4 — QUALITY GATES

### Gate 1: Build
- `bun run build` passes with zero errors
- `bunx tsc --noEmit` passes with zero type errors
- Zero `as any` in new or touched code
- Zero `console.log/error` in production code
- Zero `alert()` or `confirm()` calls

### Gate 2: UX (Adaptive Design)
- Every page has: loading skeleton, empty state, error state with retry
- Every table converts to cards on mobile (< 640px)
- Every modal is full-screen on mobile, centered max-w-lg on desktop
- Dark mode renders correctly on every page
- Touch targets are 44px minimum on mobile
- No horizontal scroll at any breakpoint

### Gate 3: Consistency
- Zero hardcoded Tailwind colors — all semantic tokens from `variables.css`
- Single icon library per file (`lucide-react` preferred)
- All modals use `ResponsiveModal`
- All forms use `FormInput` / `FormSelect` / `FormTextarea`
- All status indicators use unified `StatusBadge`
- All confirmations use `ConfirmDialog`
- `formatDate`/`formatMoney` imported from `formatUtils.ts` only

### Gate 4: Contract Compliance
- Every page's API calls match the backend contract documents
- `X-Company-Code` header sent on all authenticated requests
- `Idempotency-Key` header sent on all mutating requests
- Token refresh handles 401 without user intervention
- `mustChangePassword` flag forces password change before navigation

### Gate 5: Accessibility
- All inputs have associated `<label>` elements
- Focus order follows logical tab sequence
- Color contrast meets WCAG AA (4.5:1)
- `prefers-reduced-motion` respected
- Screen reader: all icons have `aria-label` or are `aria-hidden`

---

# PART 5 — FILE INVENTORY

### Files to CREATE

| File | Portal | Purpose |
|------|--------|---------|
| `admin/components/ui/ConfirmDialog.tsx` | Shared | Confirmation modal |
| `admin/components/ui/EmptyState.tsx` | Shared | Empty state with icon + CTA |
| `admin/components/ui/PageSkeleton.tsx` | Shared | Loading skeleton |
| `admin/components/ui/Toast.tsx` | Shared | Auto-dismiss notifications |
| `admin/components/ui/StatusBadge.tsx` | Shared | Unified status badge |
| `admin/layouts/SuperadminLayout.tsx` | Superadmin | Portal layout |
| `admin/lib/superadminApi.ts` | Superadmin | API module (thin wrappers) |
| `admin/pages/superadmin/SuperadminDashboardPage.tsx` | Superadmin | Control-plane dashboard |
| `admin/pages/superadmin/TenantRegistryPage.tsx` | Superadmin | Company/tenant management |
| `admin/pages/superadmin/TenantPolicyPage.tsx` | Superadmin | Runtime policy controls |
| `admin/pages/superadmin/AuditTrailPage.tsx` | Superadmin | Control-plane audit trail |
| `admin/pages/superadmin/PlatformRbacPage.tsx` | Superadmin | Privileged role governance |
| `admin/pages/factory/ProductionPlansPage.tsx` | Factory | Production plan CRUD |
| `sales/modals/CreateOrderModal.tsx` | Sales | Extracted from OrdersPage |

### Files to DELETE

| File | Reason |
|------|--------|
| `admin/pages/accounting/JournalTabsPage.tsx` | Exact duplicate of TransactionsPage.tsx |
| `admin/layouts/FactoryLayout.tsx.corrupted` | Dead corrupted backup file |

---

# PART 6 — DEFINITION OF DONE

A portal is "done" when:

1. All contract endpoints for that portal are either WIRED to a page or explicitly documented as "deferred with reason"
2. Every page passes all 5 quality gates
3. Every page passes the adaptive design checklist (mobile + tablet + desktop + dark mode)
4. `bun run build` succeeds with zero errors
5. No placeholder, stub, or "coming soon" pages remain for release-critical features
6. All semantic tokens used — zero hardcoded colors
7. All shared components used — zero raw HTML for interactive elements
8. Superadmin portal operates on tenant metadata/policy only — zero business data exposure

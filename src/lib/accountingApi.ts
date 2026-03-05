 /**
  * Accounting API wrapper
  *
  * Covers accounting-portal operations:
  *  - Journal list (dashboard recent entries)
  *  - Income statement hierarchy (revenue, expenses, net profit)
  *  - Aged receivables (outstanding receivables)
  *  - Periods
  *  - Default accounts
  *  - Trial balance
  */
 
 import { apiRequest } from './api';
 import type { ApiResponse } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Accounting Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface JournalListItem {
   id: number;
   referenceNumber: string;
   entryDate: string;
   memo: string;
   status: string;
   journalType: string;
   sourceModule: string;
   sourceReference: string;
   totalDebit: number;
   totalCredit: number;
 }
 
 export interface AccountingPeriodDto {
   id: number;
   name: string;
   startDate: string;
   endDate: string;
   status: 'OPEN' | 'CLOSED' | 'LOCKED';
 }
 
 export interface AccountNode {
   id: number;
   code: string;
   name: string;
   balance: number;
   children?: AccountNode[];
 }
 
 export interface IncomeStatementHierarchy {
   revenue: AccountNode[];
   totalRevenue: number;
   cogs: AccountNode[];
   totalCogs: number;
   grossProfit: number;
   expenses: AccountNode[];
   totalExpenses: number;
   netIncome: number;
 }
 
 export interface AgedReceivablesReport {
   totalOutstanding: number;
   current: number;
   days1to30: number;
   days31to60: number;
   days61to90: number;
   daysOver90: number;
   dealers?: Array<{
     dealerId: number;
     dealerName: string;
     totalOutstanding: number;
   }>;
 }
 
 export interface TrialBalanceSnapshot {
   asOfDate: string;
   entries: Array<{
     accountId: number;
     accountCode: string;
     accountName: string;
     accountType: string;
     debit: number;
     credit: number;
   }>;
   totalDebits: number;
   totalCredits: number;
 }
 
 export interface CompanyDefaultAccountsResponse {
   inventoryAccountId: number | null;
   cogsAccountId: number | null;
   revenueAccountId: number | null;
   discountAccountId: number | null;
   taxAccountId: number | null;
 }
 
 export interface ManualJournalRequest {
   memo: string;
   entryDate: string;
   referenceNumber?: string;
   idempotencyKey?: string;
   lines: Array<{
     accountId: number;
     debit: number;
     credit: number;
     description?: string;
   }>;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // API calls
 // ─────────────────────────────────────────────────────────────────────────────
 
 export const accountingApi = {
   // ── Journal Entries ──────────────────────────────────────────────────────
 
   /**
    * GET /api/v1/accounting/journals
    * Returns list of journal summary items (light DTO).
    */
   async getJournals(params?: { size?: number }): Promise<JournalListItem[]> {
     const query = params?.size ? `?size=${params.size}` : '';
     const response = await apiRequest.get<ApiResponse<JournalListItem[]>>(
       `/accounting/journals${query}`
     );
     return response.data.data;
   },
 
   // ── Income Statement (P&L) ───────────────────────────────────────────────
 
   /**
    * GET /api/v1/accounting/reports/income-statement/hierarchy
    * Returns hierarchical P&L data with revenue, expenses, net income.
    */
   async getIncomeStatement(): Promise<IncomeStatementHierarchy> {
     const response = await apiRequest.get<ApiResponse<IncomeStatementHierarchy>>(
       '/accounting/reports/income-statement/hierarchy'
     );
     return response.data.data;
   },
 
   // ── Aged Receivables ─────────────────────────────────────────────────────
 
   /**
    * GET /api/v1/accounting/reports/aging/receivables
    * Returns aged receivables totals.
    */
   async getAgedReceivables(): Promise<AgedReceivablesReport> {
     const response = await apiRequest.get<ApiResponse<AgedReceivablesReport>>(
       '/accounting/reports/aging/receivables'
     );
     return response.data.data;
   },
 
   // ── Trial Balance ────────────────────────────────────────────────────────
 
   /**
    * GET /api/v1/accounting/trial-balance/as-of
    * Returns trial balance snapshot as of today.
    */
   async getTrialBalance(asOf?: string): Promise<TrialBalanceSnapshot> {
     const query = asOf ? `?date=${asOf}` : '';
     const response = await apiRequest.get<ApiResponse<TrialBalanceSnapshot>>(
       `/accounting/trial-balance/as-of${query}`
     );
     return response.data.data;
   },
 
   // ── Accounting Periods ───────────────────────────────────────────────────
 
   /**
    * GET /api/v1/accounting/periods
    * Returns all accounting periods.
    */
   async getPeriods(): Promise<AccountingPeriodDto[]> {
     const response = await apiRequest.get<ApiResponse<AccountingPeriodDto[]>>(
       '/accounting/periods'
     );
     return response.data.data;
   },
 
   // ── Default Accounts ─────────────────────────────────────────────────────
 
   /**
    * GET /api/v1/accounting/default-accounts
    * Returns configured default GL accounts.
    */
   async getDefaultAccounts(): Promise<CompanyDefaultAccountsResponse> {
     const response = await apiRequest.get<ApiResponse<CompanyDefaultAccountsResponse>>(
       '/accounting/default-accounts'
     );
     return response.data.data;
   },
 
   /**
    * PUT /api/v1/accounting/default-accounts
    * Update default GL accounts mapping.
    */
   async updateDefaultAccounts(
     data: Partial<CompanyDefaultAccountsResponse>
   ): Promise<CompanyDefaultAccountsResponse> {
     const response = await apiRequest.put<ApiResponse<CompanyDefaultAccountsResponse>>(
       '/accounting/default-accounts',
       data
     );
     return response.data.data;
   },
 };

 /**
  * Accounting API wrapper
  *
  * Covers accounting-portal operations:
  *  - Chart of accounts (tree view, CRUD, activity, balance as-of)
  *  - Journal entries (list, create manual, reverse, cascade-reverse)
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

 export interface JournalEntryLine {
   id: number;
   accountId: number;
   accountCode: string;
   accountName: string;
   debit: number;
   credit: number;
   description: string;
 }

 export interface JournalEntryDto {
   id: number;
   publicId: string;
   referenceNumber: string;
   entryDate: string;
   memo: string;
   status: string;
   dealerId: number | null;
   dealerName: string | null;
   supplierId: number | null;
   supplierName: string | null;
   accountingPeriodId: number | null;
   accountingPeriodLabel: string | null;
   accountingPeriodStatus: string | null;
   reversalOfEntryId: number | null;
   reversalEntryId: number | null;
   createdAt: string;
   updatedAt: string;
   createdBy: string;
   lines: JournalEntryLine[];
 }

 export interface AccountingPeriodDto {
   id: number;
   name: string;
   startDate: string;
   endDate: string;
   status: 'OPEN' | 'CLOSED' | 'LOCKED';
 }

 /** Account type per backend AccountType enum */
 export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

 export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
   ASSET: 'Assets',
   LIABILITY: 'Liabilities',
   EQUITY: 'Equity',
   REVENUE: 'Revenue',
   EXPENSE: 'Expenses',
 };

 export interface AccountNode {
   id: number;
   code: string;
   name: string;
   balance: number;
   children?: AccountNode[];
 }

 export interface AccountDto {
   id: number;
   publicId: string;
   code: string;
   name: string;
   type: AccountType;
   balance: number;
   parentId?: number | null;
 }

 export interface AccountRequest {
   code: string;
   name: string;
   type: AccountType;
   parentId?: number | null;
 }

 export interface AccountMovement {
   date: string;
   referenceNumber: string;
   memo: string;
   debit: number;
   credit: number;
   balance: number;
 }

 export interface AccountActivityReport {
   accountCode: string;
   accountName: string;
   startDate: string;
   endDate: string;
   openingBalance: number;
   closingBalance: number;
   totalDebits: number;
   totalCredits: number;
   movements: AccountMovement[];
 }

 /** Full account tree node (with type string from backend) */
 export interface AccountTreeNode {
   id: number;
   code: string;
   name: string;
   type: string;
   balance: number;
   level: number;
   parentId: number | null;
   children: AccountTreeNode[];
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

 export interface CompanyDefaultAccountsRequest {
   inventoryAccountId?: number | null;
   cogsAccountId?: number | null;
   revenueAccountId?: number | null;
   discountAccountId?: number | null;
   taxAccountId?: number | null;
 }

 export interface AccountingPeriodUpsertRequest {
   year: number;
   month: number;
   costingMethod?: string;
 }

 export interface AccountingPeriodCloseRequest {
   force?: boolean;
   note?: string;
 }

 export interface AccountingPeriodLockRequest {
   reason?: string;
 }

 export interface AccountingPeriodReopenRequest {
   reason?: string;
 }

 export interface SettlementAllocationRequest {
   invoiceId?: number;
   purchaseId?: number;
   amount: number;
 }

 export interface SettlementPaymentRequest {
   cashAccountId: number;
   amount: number;
 }

 export interface DealerReceiptRequest {
   dealerId: number;
   cashAccountId: number;
   amount: number;
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
   allocations: SettlementAllocationRequest[];
 }

 export interface IncomingLine {
   cashAccountId: number;
   amount: number;
   allocations: SettlementAllocationRequest[];
 }

 export interface DealerReceiptSplitRequest {
   dealerId: number;
   incomingLines: IncomingLine[];
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
 }

 export interface DealerSettlementRequest {
   dealerId: number;
   cashAccountId?: number;
   discountAccountId?: number;
   writeOffAccountId?: number;
   settlementDate?: string;
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
   allocations: SettlementAllocationRequest[];
   payments?: SettlementPaymentRequest[];
 }

 export interface SupplierSettlementRequest {
   supplierId: number;
   cashAccountId: number;
   discountAccountId?: number;
   writeOffAccountId?: number;
   settlementDate?: string;
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
   allocations: SettlementAllocationRequest[];
 }

 export interface SupplierPaymentRequest {
   supplierId: number;
   cashAccountId: number;
   amount: number;
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
   allocations: SettlementAllocationRequest[];
 }

 export interface PartnerSettlementResponse {
   journalEntry: JournalEntryDto;
   totalApplied: number;
   cashAmount: number;
   totalDiscount: number;
   totalWriteOff: number;
   totalFxGain: number;
   totalFxLoss: number;
 }

 export interface CreditNoteRequest {
   invoiceId: number;
   amount?: number;
   entryDate?: string;
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
   adminOverride?: boolean;
 }

 export interface DebitNoteRequest {
   purchaseId: number;
   amount?: number;
   entryDate?: string;
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
   adminOverride?: boolean;
 }

 export interface BadDebtWriteOffRequest {
   invoiceId: number;
   expenseAccountId: number;
   amount: number;
   entryDate?: string;
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
   adminOverride?: boolean;
 }

 export interface AccrualRequest {
   debitAccountId: number;
   creditAccountId: number;
   amount: number;
   entryDate?: string;
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
   autoReverseDate?: string;
   adminOverride?: boolean;
 }

 export interface DealerResponse {
   id: number;
   name: string;
   code: string;
   gstin?: string;
   city?: string;
   region?: string;
   status: string;
   outstandingBalance?: number;
 }

 export interface SupplierResponse {
   id: number;
   name: string;
   code?: string;
   status: string;
 }

 export interface ManualJournalRequest {
   narration?: string;
   entryDate: string;
   idempotencyKey?: string;
   lines: Array<{
     accountId: number;
     debit: number;
     credit: number;
     description?: string;
   }>;
 }

 export interface JournalReversalRequest {
   reversalDate?: string;
   reason?: string;
   memo?: string;
   cascadeRelatedEntries?: boolean;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // API calls
 // ─────────────────────────────────────────────────────────────────────────────

 export const accountingApi = {
   // ── Chart of Accounts ────────────────────────────────────────────────────

   /** GET /api/v1/accounting/accounts — flat list of accounts */
   async getAccounts(): Promise<AccountDto[]> {
     const response = await apiRequest.get<ApiResponse<AccountDto[]>>('/accounting/accounts');
     return response.data.data;
   },

   /** GET /api/v1/accounting/accounts/tree — full hierarchy */
   async getAccountTree(): Promise<AccountTreeNode[]> {
     const response = await apiRequest.get<ApiResponse<AccountTreeNode[]>>(
       '/accounting/accounts/tree'
     );
     return response.data.data;
   },

   /** GET /api/v1/accounting/accounts/tree/{type} — hierarchy by account type */
   async getAccountTreeByType(type: AccountType): Promise<AccountTreeNode[]> {
     const response = await apiRequest.get<ApiResponse<AccountTreeNode[]>>(
       `/accounting/accounts/tree/${type}`
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/accounts — create new account */
   async createAccount(data: AccountRequest): Promise<AccountDto> {
     const response = await apiRequest.post<ApiResponse<AccountDto>>(
       '/accounting/accounts',
       data
     );
     return response.data.data;
   },

   /**
    * GET /api/v1/accounting/accounts/{id}/activity
    * Returns ledger of journal lines with running balance.
    */
   async getAccountActivity(
     accountId: number,
     params?: { fromDate?: string; toDate?: string }
   ): Promise<AccountActivityReport> {
     const search = new URLSearchParams(
       Object.fromEntries(
         Object.entries(params ?? {})
           .filter(([, v]) => v !== undefined && v !== '')
           .map(([k, v]) => [k, String(v)])
       )
     );
     const query = search.toString() ? `?${search.toString()}` : '';
     const response = await apiRequest.get<ApiResponse<AccountActivityReport>>(
       `/accounting/accounts/${accountId}/activity${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/accounting/accounts/{id}/balance/as-of?date=YYYY-MM-DD */
   async getAccountBalanceAsOf(accountId: number, date: string): Promise<number> {
     const response = await apiRequest.get<ApiResponse<number>>(
       `/accounting/accounts/${accountId}/balance/as-of?date=${date}`
     );
     return response.data.data;
   },

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

   /** GET /api/v1/accounting/journals with all filter params */
   async getJournalsFiltered(params: {
     fromDate?: string;
     toDate?: string;
     type?: string;
     sourceModule?: string;
   }): Promise<JournalListItem[]> {
     const search = new URLSearchParams(
       Object.fromEntries(
         Object.entries(params)
           .filter(([, v]) => v !== undefined && v !== '')
           .map(([k, v]) => [k, String(v)])
       )
     );
     const query = search.toString() ? `?${search.toString()}` : '';
     const response = await apiRequest.get<ApiResponse<JournalListItem[]>>(
       `/accounting/journals${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/accounting/journal-entries — full detail list with lines */
   async getJournalEntries(): Promise<JournalEntryDto[]> {
     const response = await apiRequest.get<ApiResponse<JournalEntryDto[]>>(
       '/accounting/journal-entries'
     );
     return response.data.data;
   },

  /**
   * Fetch a single journal entry by id.
   * The backend has no single-entry endpoint, so we fetch the list and find by id.
   */
  async getJournalEntryById(id: number): Promise<JournalEntryDto | null> {
    const entries = await accountingApi.getJournalEntries();
    return entries.find((e) => e.id === id) ?? null;
  },

   /** POST /api/v1/accounting/journals/manual — create manual journal entry */
   async createManualJournal(data: ManualJournalRequest): Promise<JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto>>(
       '/accounting/journals/manual',
       data
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/journals/{id}/reverse */
   async reverseJournal(
     entryId: number,
     data: JournalReversalRequest
   ): Promise<JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto>>(
       `/accounting/journals/${entryId}/reverse`,
       data
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/journal-entries/{id}/cascade-reverse */
   async cascadeReverseJournal(
     entryId: number,
     data: JournalReversalRequest
   ): Promise<JournalEntryDto[]> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto[]>>(
       `/accounting/journal-entries/${entryId}/cascade-reverse`,
       data
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
 
   /** POST /api/v1/accounting/periods — create period */
   async createPeriod(data: AccountingPeriodUpsertRequest): Promise<AccountingPeriodDto> {
     const response = await apiRequest.post<ApiResponse<AccountingPeriodDto>>(
       '/accounting/periods',
       data
     );
     return response.data.data;
   },
 
   /** POST /api/v1/accounting/periods/{periodId}/close */
   async closePeriod(periodId: number, data: AccountingPeriodCloseRequest): Promise<AccountingPeriodDto> {
     const response = await apiRequest.post<ApiResponse<AccountingPeriodDto>>(
       `/accounting/periods/${periodId}/close`,
       data
     );
     return response.data.data;
   },
 
   /** POST /api/v1/accounting/periods/{periodId}/lock */
   async lockPeriod(periodId: number, data: AccountingPeriodLockRequest): Promise<AccountingPeriodDto> {
     const response = await apiRequest.post<ApiResponse<AccountingPeriodDto>>(
       `/accounting/periods/${periodId}/lock`,
       data
     );
     return response.data.data;
   },
 
   /** POST /api/v1/accounting/periods/{periodId}/reopen */
   async reopenPeriod(periodId: number, data: AccountingPeriodReopenRequest): Promise<AccountingPeriodDto> {
     const response = await apiRequest.post<ApiResponse<AccountingPeriodDto>>(
       `/accounting/periods/${periodId}/reopen`,
       data
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
 
   // ── Settlements & Receipts ────────────────────────────────────────────────

   /** POST /api/v1/accounting/receipts/dealer */
   async recordDealerReceipt(data: DealerReceiptRequest): Promise<JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto>>(
       '/accounting/receipts/dealer',
       data
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/receipts/dealer/hybrid */
   async recordHybridReceipt(data: DealerReceiptSplitRequest): Promise<JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto>>(
       '/accounting/receipts/dealer/hybrid',
       data
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/settlements/dealers */
   async createDealerSettlement(data: DealerSettlementRequest): Promise<PartnerSettlementResponse> {
     const response = await apiRequest.post<ApiResponse<PartnerSettlementResponse>>(
       '/accounting/settlements/dealers',
       data
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/settlements/suppliers */
   async createSupplierSettlement(data: SupplierSettlementRequest): Promise<PartnerSettlementResponse> {
     const response = await apiRequest.post<ApiResponse<PartnerSettlementResponse>>(
       '/accounting/settlements/suppliers',
       data
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/suppliers/payments */
   async recordSupplierPayment(data: SupplierPaymentRequest): Promise<JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto>>(
       '/accounting/suppliers/payments',
       data
     );
     return response.data.data;
   },

   // ── Credit / Debit Notes ─────────────────────────────────────────────────

   /** POST /api/v1/accounting/credit-notes */
   async createCreditNote(data: CreditNoteRequest): Promise<JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto>>(
       '/accounting/credit-notes',
       data
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/debit-notes */
   async createDebitNote(data: DebitNoteRequest): Promise<JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto>>(
       '/accounting/debit-notes',
       data
     );
     return response.data.data;
   },

   // ── Bad Debt & Accruals ──────────────────────────────────────────────────

   /** POST /api/v1/accounting/bad-debts/write-off */
   async writeBadDebt(data: BadDebtWriteOffRequest): Promise<JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto>>(
       '/accounting/bad-debts/write-off',
       data
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/accruals */
   async recordAccrual(data: AccrualRequest): Promise<JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<JournalEntryDto>>(
       '/accounting/accruals',
       data
     );
     return response.data.data;
   },

   // ── Dealers / Suppliers (for dropdowns) ──────────────────────────────────

   /** GET /api/v1/dealers */
   async getDealers(): Promise<DealerResponse[]> {
     const response = await apiRequest.get<ApiResponse<DealerResponse[]>>('/dealers');
     return response.data.data;
   },

   /** GET /api/v1/suppliers */
   async getSuppliers(): Promise<SupplierResponse[]> {
     const response = await apiRequest.get<ApiResponse<SupplierResponse[]>>('/suppliers');
     return response.data.data;
   },
 };

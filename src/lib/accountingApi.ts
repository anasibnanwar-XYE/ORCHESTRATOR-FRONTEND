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
   label?: string;
   startDate: string;
   endDate: string;
   status: 'OPEN' | 'CLOSED' | 'LOCKED';
   year?: number;
   month?: number;
   bankReconciled?: boolean;
   inventoryCounted?: boolean;
   closedAt?: string;
   closedBy?: string;
   lockedAt?: string;
   lockedBy?: string;
   reopenedAt?: string;
   reopenedBy?: string;
 }

 /** Account type per backend AccountType enum */
 /** Account type per backend AccountType enum */
export type AccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'EXPENSE'
  | 'COGS'
  | 'OTHER_INCOME'
  | 'OTHER_EXPENSE';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: 'Assets',
  LIABILITY: 'Liabilities',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expenses',
  COGS: 'Cost of Goods Sold',
  OTHER_INCOME: 'Other Income',
  OTHER_EXPENSE: 'Other Expense',
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

/** AgingBuckets — matches backend AgingBuckets record */
export interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
}

/** DealerAgingDetail — per-dealer breakdown in AgedReceivablesReport */
export interface DealerAgingDetail {
  dealerId: number;
  dealerCode: string;
  dealerName: string;
  buckets: AgingBuckets;
  totalOutstanding: number;
}

/** AgedReceivablesReport — matches backend AgingReportService.AgedReceivablesReport */
export interface AgedReceivablesReport {
  asOfDate: string;
  dealers: DealerAgingDetail[];
  totalBuckets: AgingBuckets;
  grandTotal: number;
  /** @deprecated use grandTotal */
  totalOutstanding?: number;
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

 export interface AutoSettlementRequest {
   cashAccountId?: number;
   amount: number;
   referenceNumber?: string;
   memo?: string;
   idempotencyKey?: string;
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

/** Light invoice reference for settlement allocation dropdowns */
export interface InvoiceRef {
  id: number;
  invoiceNumber: string;
  outstandingAmount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
}

/** Light purchase reference for settlement allocation dropdowns */
export interface PurchaseRef {
  id: number;
  invoiceNumber: string;
  outstandingAmount: number;
  totalAmount: number;
  invoiceDate: string;
  status: string;
}

 // ─────────────────────────────────────────────────────────────────────────────
 // Bank Reconciliation types
 // ─────────────────────────────────────────────────────────────────────────────

 export interface BankReconciliationSessionCreateRequest {
   bankAccountId: number;
   statementDate: string;
   closingBalance: number;
   openingBalance?: number;
   memo?: string;
 }

 export interface BankReconciliationSessionSummaryDto {
   sessionId: number;
   bankAccountId: number;
   bankAccountName?: string;
   statementDate: string;
   closingBalance: number;
   openingBalance?: number;
   status: 'DRAFT' | 'COMPLETED';
   clearedCount?: number;
   pendingCount?: number;
   clearedBalance?: number;
   difference?: number;
   memo?: string;
   createdAt: string;
   completedAt?: string;
 }

 export interface BankReconciliationItem {
   transactionId: number;
   entryDate: string;
   description: string;
   debit: number;
   credit: number;
   cleared: boolean;
   referenceNumber?: string;
   journalEntryId?: number;
 }

 export interface BankReconciliationSessionDetailDto extends BankReconciliationSessionSummaryDto {
   items: BankReconciliationItem[];
   accountingPeriodId?: number | null;
   accountingPeriodLabel?: string | null;
 }

 export interface BankReconciliationSessionItemsUpdateRequest {
   clearedTransactionIds: number[];
 }

 export interface BankReconciliationSessionCompletionRequest {
   accountingPeriodId?: number;
   memo?: string;
 }

 export interface BankReconciliationSessionPageResponse {
   content: BankReconciliationSessionSummaryDto[];
   totalElements: number;
   totalPages: number;
   page: number;
   size: number;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Reconciliation discrepancy types
 // ─────────────────────────────────────────────────────────────────────────────

 export type DiscrepancyResolution = 'ACKNOWLEDGED' | 'ADJUSTMENT_JOURNAL' | 'WRITE_OFF';

 export interface ReconciliationDiscrepancyDto {
   id: number;
   type: string;
   status: string;
   description: string;
   amount: number;
   detectedAt: string;
   resolution?: DiscrepancyResolution;
   note?: string;
   adjustmentAccountId?: number | null;
   resolvedAt?: string | null;
 }

 export interface ReconciliationDiscrepancyListResponse {
   items?: ReconciliationDiscrepancyDto[];
 }

 export interface ReconciliationDiscrepancyResolveRequest {
   resolution: DiscrepancyResolution;
   adjustmentAccountId?: number;
   note?: string;
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

   /** POST /api/v1/accounting/dealers/{dealerId}/auto-settle */
   async autoSettleDealer(dealerId: number, data: AutoSettlementRequest): Promise<PartnerSettlementResponse> {
     const response = await apiRequest.post<ApiResponse<PartnerSettlementResponse>>(
       `/accounting/dealers/${dealerId}/auto-settle`,
       data
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/suppliers/{supplierId}/auto-settle */
   async autoSettleSupplier(supplierId: number, data: AutoSettlementRequest): Promise<PartnerSettlementResponse> {
     const response = await apiRequest.post<ApiResponse<PartnerSettlementResponse>>(
       `/accounting/suppliers/${supplierId}/auto-settle`,
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

  /** GET /api/v1/invoices/dealers/{dealerId} — invoices for a dealer (for allocation dropdowns) */
  async getDealerInvoices(dealerId: number): Promise<InvoiceRef[]> {
    const response = await apiRequest.get<ApiResponse<InvoiceRef[]>>(
      `/invoices/dealers/${dealerId}`
    );
    return response.data.data;
  },

  /** GET /api/v1/purchasing/raw-material-purchases?supplierId={id} — purchases for a supplier */
  async getSupplierPurchases(supplierId: number): Promise<PurchaseRef[]> {
    const response = await apiRequest.get<ApiResponse<PurchaseRef[]>>(
      `/purchasing/raw-material-purchases?supplierId=${supplierId}`
    );
    return response.data.data;
  },
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Extended API methods (operations pages)
 // ─────────────────────────────────────────────────────────────────────────────

 /** Bank Reconciliation Session API methods */
 export const bankReconciliationApi = {
   /**
    * POST /api/v1/accounting/reconciliation/bank/sessions
    * Create a new bank reconciliation session.
    */
   async createSession(
     data: BankReconciliationSessionCreateRequest
   ): Promise<BankReconciliationSessionSummaryDto> {
     const response = await apiRequest.post<ApiResponse<BankReconciliationSessionSummaryDto>>(
       '/accounting/reconciliation/bank/sessions',
       data
     );
     return response.data.data;
   },

   /**
    * GET /api/v1/accounting/reconciliation/bank/sessions?page=0&size=20
    * List existing sessions (paginated).
    */
   async listSessions(
     params?: { page?: number; size?: number }
   ): Promise<BankReconciliationSessionPageResponse> {
     const search = new URLSearchParams();
     if (params?.page !== undefined) search.set('page', String(params.page));
     if (params?.size !== undefined) search.set('size', String(params.size));
     const query = search.toString() ? `?${search.toString()}` : '';
     const response = await apiRequest.get<ApiResponse<BankReconciliationSessionPageResponse>>(
       `/accounting/reconciliation/bank/sessions${query}`
     );
     return response.data.data;
   },

   /**
    * GET /api/v1/accounting/reconciliation/bank/sessions/{sessionId}
    * Get full session detail including line items.
    */
   async getSession(sessionId: number): Promise<BankReconciliationSessionDetailDto> {
     const response = await apiRequest.get<ApiResponse<BankReconciliationSessionDetailDto>>(
       `/accounting/reconciliation/bank/sessions/${sessionId}`
     );
     return response.data.data;
   },

   /**
    * PUT /api/v1/accounting/reconciliation/bank/sessions/{sessionId}/items
    * Update cleared transaction IDs for the session.
    */
   async updateSessionItems(
     sessionId: number,
     data: BankReconciliationSessionItemsUpdateRequest
   ): Promise<BankReconciliationSessionDetailDto> {
     const response = await apiRequest.put<ApiResponse<BankReconciliationSessionDetailDto>>(
       `/accounting/reconciliation/bank/sessions/${sessionId}/items`,
       data
     );
     return response.data.data;
   },

   /**
    * POST /api/v1/accounting/reconciliation/bank/sessions/{sessionId}/complete
    * Complete (lock) the session.
    */
   async completeSession(
     sessionId: number,
     data?: BankReconciliationSessionCompletionRequest
   ): Promise<BankReconciliationSessionDetailDto> {
     const response = await apiRequest.post<ApiResponse<BankReconciliationSessionDetailDto>>(
       `/accounting/reconciliation/bank/sessions/${sessionId}/complete`,
       data ?? {}
     );
     return response.data.data;
   },

   /**
    * GET /api/v1/accounting/reconciliation/discrepancies
    * List open (or all) discrepancies.
    */
   async listDiscrepancies(
     params?: { status?: string; type?: string }
   ): Promise<ReconciliationDiscrepancyDto[]> {
     const search = new URLSearchParams(
       Object.fromEntries(
         Object.entries(params ?? {})
           .filter(([, v]) => v !== undefined && v !== '')
           .map(([k, v]) => [k, String(v)])
       )
     );
     const query = search.toString() ? `?${search.toString()}` : '';
     const response = await apiRequest.get<ApiResponse<ReconciliationDiscrepancyListResponse>>(
       `/accounting/reconciliation/discrepancies${query}`
     );
     return response.data.data?.items ?? [];
   },

   /**
    * POST /api/v1/accounting/reconciliation/discrepancies/{id}/resolve
    * Resolve a discrepancy by acknowledge, adjustment journal, or write-off.
    */
   async resolveDiscrepancy(
     discrepancyId: number,
     data: ReconciliationDiscrepancyResolveRequest
   ): Promise<ReconciliationDiscrepancyDto> {
     const response = await apiRequest.post<ApiResponse<ReconciliationDiscrepancyDto>>(
       `/accounting/reconciliation/discrepancies/${discrepancyId}/resolve`,
       data
     );
     return response.data.data;
   },
 };

 /** Month-End Checklist API methods */
 export const monthEndApi = {
   /** GET /api/v1/accounting/month-end/checklist?periodId={id} */
   async getChecklist(periodId?: number): Promise<MonthEndChecklistDto> {
     const query = periodId ? `?periodId=${periodId}` : '';
     const response = await apiRequest.get<ApiResponse<MonthEndChecklistDto>>(
       `/accounting/month-end/checklist${query}`
     );
     return response.data.data;
   },

   /** POST /api/v1/accounting/month-end/checklist/{periodId} */
   async updateChecklist(
     periodId: number,
     data: MonthEndChecklistUpdateRequest
   ): Promise<MonthEndChecklistDto> {
     const response = await apiRequest.post<ApiResponse<MonthEndChecklistDto>>(
       `/accounting/month-end/checklist/${periodId}`,
       data
     );
     return response.data.data;
   },
 };

 /** Audit API methods */
 export const auditApi = {
   /** GET /api/v1/accounting/audit/digest */
   async getAuditDigest(): Promise<AuditDigestResponse> {
     const response = await apiRequest.get<ApiResponse<AuditDigestResponse>>(
       '/accounting/audit/digest'
     );
     return response.data.data;
   },

   /** GET /api/v1/accounting/audit/digest.csv — returns raw CSV text */
   async getAuditDigestCsv(): Promise<string> {
     const response = await apiRequest.get<string>(
       '/accounting/audit/digest.csv',
       { responseType: 'text' }
     );
     return response.data;
   },

   /** GET /api/v1/accounting/audit-trail — paginated */
   async getAuditTrail(params?: {
     page?: number;
     size?: number;
   }): Promise<AuditTrailPageResponse> {
     const search = new URLSearchParams();
     if (params?.page !== undefined) search.set('page', String(params.page));
     if (params?.size !== undefined) search.set('size', String(params.size));
     const query = search.toString() ? `?${search.toString()}` : '';
     const response = await apiRequest.get<ApiResponse<AuditTrailPageResponse>>(
       `/accounting/audit-trail${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/accounting/audit/transactions — paginated */
   async getTransactionAudit(params?: {
     page?: number;
     size?: number;
     fromDate?: string;
     toDate?: string;
   }): Promise<TransactionAuditPageResponse> {
     const search = new URLSearchParams();
     if (params?.page !== undefined) search.set('page', String(params.page));
     if (params?.size !== undefined) search.set('size', String(params.size));
     if (params?.fromDate) search.set('fromDate', params.fromDate);
     if (params?.toDate) search.set('toDate', params.toDate);
     const query = search.toString() ? `?${search.toString()}` : '';
     const response = await apiRequest.get<ApiResponse<TransactionAuditPageResponse>>(
       `/accounting/audit/transactions${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/accounting/audit/transactions/{journalEntryId} */
   async getTransactionAuditDetail(
     journalEntryId: number
   ): Promise<AccountingTransactionAuditDetailDto> {
     const response = await apiRequest.get<ApiResponse<AccountingTransactionAuditDetailDto>>(
       `/accounting/audit/transactions/${journalEntryId}`
     );
     return response.data.data;
   },
 };

 /** Config Health API */
 export const configHealthApi = {
   /** GET /api/v1/accounting/configuration/health */
   async getHealthReport(): Promise<ConfigurationHealthReport> {
     const response = await apiRequest.get<ApiResponse<ConfigurationHealthReport>>(
       '/accounting/configuration/health'
     );
     return response.data.data;
   },
 };

 /** Date Context API */
 export const dateContextApi = {
   /** GET /api/v1/accounting/date-context */
   async getDateContext(): Promise<DateContextResponse> {
     const response = await apiRequest.get<ApiResponse<DateContextResponse>>(
       '/accounting/date-context'
     );
     return response.data.data;
   },
 };

 /** GST Reconciliation API */
 export const gstReconciliationApi = {
   /**
    * GET /api/v1/accounting/gst/reconciliation
    * Accepts optional `period` query param in YYYY-MM format.
    * Returns collected output tax, input tax credit, and net liability
    * for the given period.
    */
   async getReconciliation(params?: { period?: string }): Promise<GstReconciliationDto> {
     const search = params?.period
       ? `?period=${encodeURIComponent(params.period)}`
       : '';
     const response = await apiRequest.get<ApiResponse<GstReconciliationDto>>(
       `/accounting/gst/reconciliation${search}`
     );
     return response.data.data;
   },
 };
 // ─────────────────────────────────────────────────────────────────────────────
 // Month-End Checklist types
 // ─────────────────────────────────────────────────────────────────────────────

 export interface MonthEndChecklistItemDto {
   key: string;
   label: string;
   status: 'PASS' | 'FAIL' | 'PENDING' | 'MANUAL';
   checked: boolean;
   count?: number;
   note?: string;
 }

 export interface MonthEndChecklistDto {
   period: AccountingPeriodDto;
   items: MonthEndChecklistItemDto[];
   readyToClose: boolean;
 }

 export interface MonthEndChecklistUpdateRequest {
   bankReconciled?: boolean;
   inventoryCounted?: boolean;
   note?: string;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Audit types
 // ─────────────────────────────────────────────────────────────────────────────

 export interface AuditDigestResponse {
   periodLabel: string;
   entries: string[];
 }

 export interface AccountingAuditTrailEntryDto {
   id: number;
   timestamp: string;
   companyId: number;
   companyCode: string;
   actorUserId: number;
   actorIdentifier: string;
   actionType: string;
   entityType: string;
   entityId: string;
   referenceNumber: string;
   traceId: string;
   ipAddress: string;
   beforeState: string;
   afterState: string;
   sensitiveOperation: boolean;
   metadata: Record<string, string>;
 }

 export interface AuditTrailPageResponse {
   content: AccountingAuditTrailEntryDto[];
   totalElements: number;
   totalPages: number;
   page: number;
   size: number;
 }

 export interface AccountingTransactionAuditListItemDto {
   journalEntryId: number;
   referenceNumber: string;
   entryDate: string;
   status: string;
   module: string;
   transactionType: string;
   memo: string;
   dealerId: number | null;
   dealerName: string | null;
   supplierId: number | null;
   supplierName: string | null;
   totalDebit: number;
   totalCredit: number;
   reversalOfId: number | null;
   reversalEntryId: number | null;
   correctionType: string | null;
   consistencyStatus: string;
   postedAt: string | null;
 }

 export interface TransactionAuditPageResponse {
   content: AccountingTransactionAuditListItemDto[];
   totalElements: number;
   totalPages: number;
   page: number;
   size: number;
 }

 export interface AccountingTransactionAuditDetailDto {
   journalEntryId: number;
   journalPublicId: string;
   referenceNumber: string;
   entryDate: string;
   status: string;
   module: string;
   transactionType: string;
   memo: string;
   dealerId: number | null;
   dealerName: string | null;
   supplierId: number | null;
   supplierName: string | null;
   accountingPeriodId: number | null;
   accountingPeriodLabel: string | null;
   accountingPeriodStatus: string | null;
   reversalOfId: number | null;
   reversalEntryId: number | null;
   correctionType: string | null;
   correctionReason: string | null;
   voidReason: string | null;
   totalDebit: number;
   totalCredit: number;
   consistencyStatus: string;
   consistencyNotes: string[];
   lines: Array<{
     accountId: number;
     accountName: string;
     accountCode: string;
     debit: number;
     credit: number;
     description: string;
   }>;
   linkedDocuments: Array<{
     documentType: string;
     documentId: number;
     referenceNumber: string;
   }>;
   eventTrail: Array<{
     event: string;
     timestamp: string;
     actor: string;
     note: string;
   }>;
   createdAt: string;
   updatedAt: string;
   postedAt: string | null;
   createdBy: string;
   postedBy: string | null;
   lastModifiedBy: string | null;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Config Health types
 // ─────────────────────────────────────────────────────────────────────────────

 export interface ConfigurationIssue {
   companyCode: string;
   domain: string;
   reference: string;
   message: string;
 }

 export interface ConfigurationHealthReport {
   healthy: boolean;
   issues: ConfigurationIssue[];
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Date Context type
 // ─────────────────────────────────────────────────────────────────────────────

 export type DateContextResponse = Record<string, unknown>;

 // ─────────────────────────────────────────────────────────────────────────────
 // GST Reconciliation types
 // ─────────────────────────────────────────────────────────────────────────────

 /** GstComponentSummary mirrors the type in reportsApi for cross-page comparison */
 export interface GstReconciliationComponentSummary {
   cgst: number;
   sgst: number;
   igst: number;
   total: number;
 }

 /**
  * GstReconciliationDto
  * Returned by GET /api/v1/accounting/gst/reconciliation?period=YYYY-MM
  *
  * `collected`     — output tax collected from sales/invoices
  * `inputTaxCredit` — input tax credit from purchases
  * `netLiability`  — net tax liability (collected - inputTaxCredit)
  * `cgst`, `sgst`, `igst`, `total` — top-level variance totals (net liability components)
  */
 export interface GstReconciliationDto {
   period: string; // YYYY-MM
   periodStart: string; // YYYY-MM-DD
   periodEnd: string; // YYYY-MM-DD
   collected: GstReconciliationComponentSummary;
   inputTaxCredit: GstReconciliationComponentSummary;
   netLiability: GstReconciliationComponentSummary;
   cgst: number;
   sgst: number;
   igst: number;
   total: number;
 }

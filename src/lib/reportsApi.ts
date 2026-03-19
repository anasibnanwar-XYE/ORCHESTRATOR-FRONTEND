 /**
  * Reports & Invoices API wrapper
  *
  * Covers:
  *  - Invoices (list, get, PDF download, email)
  *  - Trial Balance
  *  - Profit & Loss
  *  - Balance Sheet
  *  - Cash Flow
  *  - Aged Debtors
  *  - GST Return
  *  - Inventory Valuation
  *  - Reconciliation Dashboard
  */

 import { apiRequest } from './api';
 import type { ApiResponse } from '@/types';

 // ─────────────────────────────────────────────────────────────────────────────
 // Invoice Types
 // ─────────────────────────────────────────────────────────────────────────────

 export interface InvoiceLineDto {
   id: number;
   productCode: string;
   description: string;
   quantity: number;
   unitPrice: number;
   discountAmount: number;
   taxableAmount: number;
   taxRate: number;
   taxAmount: number;
   cgstAmount: number;
   sgstAmount: number;
   igstAmount: number;
   lineTotal: number;
 }

 export interface InvoiceDto {
   id: number;
   publicId: string;
   invoiceNumber: string;
   issueDate: string;
   dueDate: string;
   status: string;
   currency: string;
   dealerId: number;
   dealerName: string;
   salesOrderId: number | null;
   journalEntryId: number | null;
   subtotal: number;
   taxTotal: number;
   totalAmount: number;
   outstandingAmount: number;
   lines: InvoiceLineDto[];
   createdAt: string;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Report Metadata
 // ─────────────────────────────────────────────────────────────────────────────

 export interface ReportMetadata {
   asOfDate?: string;
   startDate?: string;
   endDate?: string;
   source?: 'LIVE' | 'AS_OF' | 'SNAPSHOT';
   accountingPeriodId?: number;
   accountingPeriodStatus?: string;
   snapshotId?: number | null;
   pdfReady?: boolean;
   csvReady?: boolean;
   requestedExportFormat?: string;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Report Types
 // ─────────────────────────────────────────────────────────────────────────────

 export interface TrialBalanceRow {
   accountId: number;
   code: string;
   name: string;
   type: string;
   debit: number;
   credit: number;
   net: number;
 }

 export interface TrialBalanceDto {
   rows: TrialBalanceRow[];
   totalDebit: number;
   totalCredit: number;
   balanced: boolean;
   metadata: ReportMetadata;
 }

 export interface ExpenseCategory {
   category: string;
   amount: number;
 }

 export interface ProfitLossDto {
   revenue: number;
   costOfGoodsSold: number;
   grossProfit: number;
   operatingExpenses: number;
   operatingExpenseCategories: ExpenseCategory[];
   netIncome: number;
   metadata: ReportMetadata;
 }

 export interface SectionLine {
   accountId: number;
   accountCode: string;
   accountName: string;
   amount: number;
 }

 export interface BalanceSheetDto {
   totalAssets: number;
   totalLiabilities: number;
   totalEquity: number;
   balanced: boolean;
   currentAssets: SectionLine[];
   fixedAssets: SectionLine[];
   currentLiabilities: SectionLine[];
   longTermLiabilities: SectionLine[];
   equityLines: SectionLine[];
   metadata: ReportMetadata;
 }

 export interface CashFlowDto {
   operating: number;
   investing: number;
   financing: number;
   netChange: number;
   metadata: ReportMetadata;
 }

 export interface ExportHints {
   pdfReady: boolean;
   csvReady: boolean;
   requestedFormat?: string;
 }

 export interface AgedDebtorDto {
   dealerId: number;
   dealerCode: string;
   dealerName: string;
   current: number;
   oneToThirtyDays: number;
   thirtyOneToSixtyDays: number;
   sixtyOneToNinetyDays: number;
   ninetyPlusDays: number;
   totalOutstanding: number;
   exportHints?: ExportHints;
   metadata?: ReportMetadata;
 }

 export interface GstComponentSummary {
   cgst: number;
   sgst: number;
   igst: number;
   total: number;
 }

 export interface GstRateSummary {
   taxRate: number;
   taxableAmount: number;
   outputTax: number;
   inputTaxCredit: number;
   netTax: number;
 }

 export interface GstTransactionDetail {
   sourceType: string;
   sourceId: number;
   referenceNumber: string;
   transactionDate: string;
   partyName: string;
   taxRate: number;
   taxableAmount: number;
   cgst: number;
   sgst: number;
   igst: number;
   totalTax: number;
   direction: 'OUTPUT' | 'INPUT';
 }

 export interface GstReturnReportDto {
   periodId?: number;
   periodLabel?: string;
   periodStart?: string;
   periodEnd?: string;
   outputTax: GstComponentSummary;
   inputTaxCredit: GstComponentSummary;
   netLiability: GstComponentSummary;
   rateSummaries: GstRateSummary[];
   transactionDetails: GstTransactionDetail[];
   metadata: ReportMetadata;
 }

 export interface InventoryValuationItemDto {
   inventoryItemId: number;
   inventoryType: 'RAW_MATERIAL' | 'FINISHED_GOOD';
   code: string;
   name: string;
   category: string;
   brand: string;
   quantityOnHand: number;
   reservedQuantity: number;
   availableQuantity: number;
   unitCost: number;
   totalValue: number;
   lowStock: boolean;
 }

 export interface InventoryValuationGroupDto {
   groupType: 'CATEGORY' | 'BRAND';
   groupKey: string;
   totalValue: number;
   itemCount: number;
   lowStockItems: number;
 }

 export interface InventoryValuationDto {
   totalValue: number;
   lowStockItems: number;
   costingMethod: string;
   items: InventoryValuationItemDto[];
   groupByCategory: InventoryValuationGroupDto[];
   groupByBrand: InventoryValuationGroupDto[];
   metadata: ReportMetadata;
 }

 export interface BalanceWarningDto {
   type: string;
   message: string;
   severity: string;
 }

 export interface ReconciliationDashboardDto {
   bankBalanced: boolean;
   bankLedgerBalance: number;
   bankStatementBalance: number;
   bankVariance: number;
   inventoryBalanced: boolean;
   ledgerInventoryBalance: number;
   physicalInventoryValue: number;
   inventoryVariance: number;
   balanceWarnings: BalanceWarningDto[];
 }

 export interface ReportQueryParams {
   periodId?: number;
   startDate?: string;
   endDate?: string;
   date?: string;
   exportFormat?: 'PDF' | 'CSV';
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Helper
 // ─────────────────────────────────────────────────────────────────────────────

 function buildQuery(params: object): string {
   const search = new URLSearchParams(
     Object.fromEntries(
       Object.entries(params)
         .filter(([, v]) => v !== undefined && v !== '')
         .map(([k, v]) => [k, String(v)])
     )
   );
   return search.toString() ? `?${search.toString()}` : '';
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // API calls
 // ─────────────────────────────────────────────────────────────────────────────

 export const invoicesApi = {
   /** GET /api/v1/invoices — list all invoices */
   async getInvoices(params?: { status?: string; dealerId?: number }): Promise<InvoiceDto[]> {
     const query = buildQuery(params ?? {});
     const response = await apiRequest.get<ApiResponse<InvoiceDto[]>>(`/invoices${query}`);
     return response.data.data;
   },

   /** GET /api/v1/invoices/{id} — get invoice by id */
   async getInvoice(id: number): Promise<InvoiceDto> {
     const response = await apiRequest.get<ApiResponse<InvoiceDto>>(`/invoices/${id}`);
     return response.data.data;
   },

   /** GET /api/v1/invoices/{id}/pdf — download invoice as PDF blob */
   async downloadInvoicePdf(id: number): Promise<Blob> {
     const response = await apiRequest.get<Blob>(`/invoices/${id}/pdf`, {
       responseType: 'blob',
     });
     return response.data;
   },

   /** POST /api/v1/invoices/{id}/email — send invoice by email */
   async sendInvoiceEmail(id: number): Promise<string> {
     const response = await apiRequest.post<ApiResponse<string>>(`/invoices/${id}/email`, {});
     return response.data.data;
   },
 };

 export const reportsApi = {
   /** GET /api/v1/reports/trial-balance */
   async getTrialBalance(params?: ReportQueryParams): Promise<TrialBalanceDto> {
     const query = buildQuery(params ?? {});
     const response = await apiRequest.get<ApiResponse<TrialBalanceDto>>(
       `/reports/trial-balance${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/reports/profit-loss */
   async getProfitLoss(params?: ReportQueryParams): Promise<ProfitLossDto> {
     const query = buildQuery(params ?? {});
     const response = await apiRequest.get<ApiResponse<ProfitLossDto>>(
       `/reports/profit-loss${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/reports/balance-sheet */
   async getBalanceSheet(params?: ReportQueryParams): Promise<BalanceSheetDto> {
     const query = buildQuery(params ?? {});
     const response = await apiRequest.get<ApiResponse<BalanceSheetDto>>(
       `/reports/balance-sheet${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/reports/cash-flow */
   async getCashFlow(): Promise<CashFlowDto> {
     const response = await apiRequest.get<ApiResponse<CashFlowDto>>('/reports/cash-flow');
     return response.data.data;
   },

   /** GET /api/v1/reports/aged-debtors (canonical) */
   async getAgedDebtors(params?: ReportQueryParams): Promise<AgedDebtorDto[]> {
     const query = buildQuery(params ?? {});
     const response = await apiRequest.get<ApiResponse<AgedDebtorDto[]>>(
       `/reports/aged-debtors${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/reports/gst-return */
   async getGstReturn(params?: { periodId?: number; period?: string }): Promise<GstReturnReportDto> {
     const query = buildQuery(params ?? {});
     const response = await apiRequest.get<ApiResponse<GstReturnReportDto>>(
       `/reports/gst-return${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/reports/inventory-valuation */
   async getInventoryValuation(params?: { date?: string }): Promise<InventoryValuationDto> {
     const query = buildQuery(params ?? {});
     const response = await apiRequest.get<ApiResponse<InventoryValuationDto>>(
       `/reports/inventory-valuation${query}`
     );
     return response.data.data;
   },

   /** GET /api/v1/reports/reconciliation-dashboard */
   async getReconciliationDashboard(params: {
     bankAccountId: number;
     statementBalance?: number;
   }): Promise<ReconciliationDashboardDto> {
     const query = buildQuery(params);
     const response = await apiRequest.get<ApiResponse<ReconciliationDashboardDto>>(
       `/reports/reconciliation-dashboard${query}`
     );
     return response.data.data;
   },
 };

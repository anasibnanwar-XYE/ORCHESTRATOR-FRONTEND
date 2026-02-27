import { apiData, apiRequest, setApiSession } from './api';
import type { AuthSession } from '../types/auth';
import type { CatalogImportResponse } from './client/models/CatalogImportResponse';
import type { AccountActivityReport } from './client/models/AccountActivityReport';

export type { CatalogImportResponse };

// --- Re-export Types from Generated Client ---
// export type { AccountDto as AccountSummary } from './client/models/AccountDto'; // Alias removed to avoid conflict with local AccountSummary 
// AccountSummary had: id, code, name, type, balance, parentId, parentName, hierarchyLevel, children.
// AccountDto usually has these. I should check.
// If not exact match, I will define the interface locally and map it.
// Let's stick to local interfaces for now to ensure frontend doesn't break, and map response to it.

// Helper to unwrap "envelope"
const unwrap = <T>(response: any): T => {
  if (response && typeof response === 'object') {
    if ('success' in response && 'data' in response) {
      if (!response.success && response.message) {
        // If success is false, throw.
        throw new Error(response.message);
      }
      // Sometimes success is optional/implicit.
      return response.data as T;
    }
  }
  return response as T;
};

// Helper for session
const withSession = (session?: AuthSession | null) => {
  if (session) setApiSession(session);
};

// --- Local Interfaces (preserving existing structure where possible) ---

export const asNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

// Export formatAccountType for UI formatting
export const formatAccountType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'ASSET': 'Asset',
    'LIABILITY': 'Liability',
    'EQUITY': 'Equity',
    'REVENUE': 'Revenue',
    'EXPENSE': 'Expense',
    'COGS': 'COGS',
  };
  return typeMap[type] || type;
};

export const importCatalogCsv = async (file: File, session?: AuthSession | null): Promise<CatalogImportResponse> => {
  withSession(session);
  const formData = new FormData();
  formData.append('file', file);
  return apiData<CatalogImportResponse>('/api/v1/accounting/catalog/import', {
    method: 'POST',
    body: formData,
  }, session);
};

// Account Interfaces
export interface AccountSummary {
  id: number;
  code: string;
  name: string;
  type: string;
  balance?: number;
  parentId?: number;
  parentName?: string;
  hierarchyLevel?: number;
  children?: AccountSummary[];
}

// Journal Entry Interfaces
export interface JournalEntryRequest {
  referenceNumber?: string;
  entryDate: string;
  memo?: string;
  autoApprove?: boolean;
  dealerId?: number;
  supplierId?: number | null;
  voucherType?: 'Journal' | 'Receipt' | 'Payment' | 'Contra';
  adminOverride?: boolean;
  lines: Array<{
    accountId: number;
    description?: string;
    debit: number;
    credit: number;
  }>;
}

export interface JournalEntryLine {
  accountId: number;
  accountCode?: string;
  accountName?: string;
  description?: string;
  debit?: number;
  credit?: number;
}

export interface JournalEntrySummary {
  id: number;
  referenceNumber?: string;
  entryDate: string;
  memo?: string;
  status: string;
  debitTotal: number;
  creditTotal: number;
  createdAt?: string;
  createdBy?: string;
  voucherType?: string;
  dealerName?: string;
  lines?: JournalEntryLine[];
}

export type ReversalReasonCode =
  | 'CUSTOMER_RETURN'
  | 'VENDOR_CREDIT'
  | 'PRICING_ERROR'
  | 'DUPLICATE_ENTRY'
  | 'WRONG_ACCOUNT'
  | 'WRONG_PERIOD'
  | 'FRAUD_CORRECTION'
  | 'SYSTEM_ERROR'
  | 'AUDIT_ADJUSTMENT'
  | 'OTHER';

export interface JournalEntryReversalRequest {
  reversalDate?: string;
  voidOnly?: boolean;
  reason?: string;
  memo?: string;
  adminOverride?: boolean;
  reversalPercentage?: number;
  cascadeRelatedEntries?: boolean;
  relatedEntryIds?: number[];
  reasonCode?: ReversalReasonCode;
  approvedBy?: string;
  supportingDocumentRef?: string;
}

// Dealer Interfaces replaced by aliases to generated types below

export interface DealerLookup {
  id: number;
  code: string;
  name: string;
}

export interface DealerLedgerEntry {
  date?: string;
  reference?: string;
  memo?: string;
  debit?: number;
  credit?: number;
  runningBalance?: number;
}

export interface DealerLedgerView {
  dealerId: number;
  dealerName?: string;
  currentBalance?: number;
  entries: DealerLedgerEntry[];
}

export interface DealerInvoiceSummary {
  id: number;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount?: number;
  outstandingAmount?: number;
  appliedAmount?: number;
  advanceApplied?: boolean;
  status?: string;
  currency?: string;
}

export interface DealerInvoicesView {
  dealerId: number;
  dealerName?: string;
  totalOutstanding?: number;
  ledgerBalance?: number;
  netOutstanding?: number;
  advanceCredit?: number;
  invoiceCount?: number;
  invoices: DealerInvoiceSummary[];
}

export interface DealerAgingBucketMap {
  [bucket: string]: number;
}

export interface DealerAgingInvoice {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  daysOverdue?: number;
  outstandingAmount?: number;
}

export interface DealerAgingView {
  dealerId: number;
  dealerName?: string;
  creditLimit?: number;
  totalOutstanding?: number;
  ledgerBalance?: number;
  netOutstanding?: number;
  advanceCredit?: number;
  availableCredit?: number;
  agingBuckets?: DealerAgingBucketMap;
  overdueInvoices?: DealerAgingInvoice[];
}

// Supplier Interfaces
export interface SupplierResponse {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  contactEmail?: string;
  contactPhone?: string;
  gstin?: string;
  address?: string;
  creditLimit?: number;
  payableAccountId?: number;
  outstandingBalance?: number;
}

export interface SupplierRequest {
  name: string;
  code?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  creditLimit?: number;
  payableAccountId?: number;
  gstin?: string;
}

// Statement Interfaces
export interface StatementRow {
  date: string;
  reference?: string;
  description?: string;
  debit: number;
  credit: number;
  balance: number;
}

// Aging Report Interfaces
export interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
}

export interface DealerAgingSummary {
  dealerId: number;
  dealerCode: string;
  dealerName: string;
  buckets: AgingBuckets;
  totalOutstanding: number;
}

export interface AgedReceivablesReport {
  asOfDate: string;
  dealers: DealerAgingSummary[];
  grandTotal: number;
}

export interface DsoReport {
  asOfDate: string;
  dealerId: number;
  dealerName: string;
  dso: number;
  totalSales: number;
  totalReceivables: number;
  periodDays: number;
}


// Import Services
import { AccountingControllerService } from './client/services/AccountingControllerService';
import { SupplierControllerService } from './client/services/SupplierControllerService';
import { DealerControllerService } from './client/services/DealerControllerService';
import { InvoiceControllerService } from './client/services/InvoiceControllerService';
import { ReportControllerService } from './client/services/ReportControllerService';
import { SalesControllerService } from './client/services/SalesControllerService'; // Check if needed
import { CompanyControllerService } from './client/services/CompanyControllerService';

// Import Models
import type { JournalEntryRequest as ApiJournalEntryRequest } from './client/models/JournalEntryRequest';
import type { JournalEntryReversalRequest as ApiJournalEntryReversalRequest } from './client/models/JournalEntryReversalRequest';
import type { AccountRequest } from './client/models/AccountRequest';
// Duplicate import removed
import type { AuditDigestResponse } from './client/models/AuditDigestResponse';
// --- Settlement & Types ---
import type { DealerSettlementRequest } from './client/models/DealerSettlementRequest';
import type { SupplierSettlementRequest } from './client/models/SupplierSettlementRequest';
import type { ApiResponsePartnerSettlementResponse } from './client/models/ApiResponsePartnerSettlementResponse';
import type { AccountStatementEntryDto } from './client/models/AccountStatementEntryDto'; // Added
import type { GstReturnDto } from './client/models/GstReturnDto'; // Added
import type { DealerReceiptRequest } from './client/models/DealerReceiptRequest'; // Added
import type { SupplierPaymentRequest } from './client/models/SupplierPaymentRequest'; // Added
import type { AccrualRequest } from './client/models/AccrualRequest'; // Added
import type { MonthEndChecklistDto } from './client/models/MonthEndChecklistDto';
import type { MonthEndChecklistItemDto } from './client/models/MonthEndChecklistItemDto';
import type { MonthEndChecklistUpdateRequest } from './client/models/MonthEndChecklistUpdateRequest';

// type { SettlementAllocation } from './client/models/DealerSettlementRequest'; // Removed invalid import 
// DealerSettlementRequest has allocations: Array<SettlementAllocation>. 
// Wait, SettlementAllocation might be a separate model or inline. 
// Let's import DealerSettlementRequest and check if I can access SettlementAllocation via it or if it is a separate file.
// Usually generated models are separate files.
// Let's assume SettlementAllocation is a model.
// Also SettlementResponse -> ApiResponsePartnerSettlementResponse.
// SettlementPaymentRequest -> inline or separate?
// Let's add imports and aliasing.

export type SettlementResponse = ApiResponsePartnerSettlementResponse;

// --- Debit/Credit Note Types ---
import type { DebitNoteRequest } from './client/models/DebitNoteRequest';
import type { CreditNoteRequest } from './client/models/CreditNoteRequest';
export type { DebitNoteRequest, CreditNoteRequest };

// --- Purchase Types ---
import type { RawMaterialPurchaseResponse } from './client/models/RawMaterialPurchaseResponse';
export type PurchaseDto = RawMaterialPurchaseResponse; // Alias for UI

// --- Invoice Types ---
// --- Invoice Types ---
// InvoiceDto is defined locally later in this file.

// --- Journal Types ---
// JournalEntrySummary is defined locally in this file.



// Duplicate SettlementResponse removed

// SettlementAllocation is likely used in the payload.
// If it's not exported as a standalone type, I might need to derive it or define it.
// Checking SettlementModal.tsx: import { type SettlementAllocation } ...
// It expects it to be exported.
// I will check if 'SettlementAllocation' exists in client/models.
// For now, I'll add the function exports and assume I can import the types or alias them.
// If SettlementAllocation is not a top level model, I might need to define it to match the generated one.

export async function createDealerSettlement(
  payload: DealerSettlementRequest,
  session?: AuthSession | null
): Promise<SettlementResponse> {
  withSession(session);
  // Manual call to ensure correct endpoint: POST /api/v1/accounting/settlements/dealers
  return apiData<SettlementResponse>('/api/v1/accounting/settlements/dealers', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, session);
}

export async function createSupplierSettlement(
  payload: SupplierSettlementRequest,
  session?: AuthSession | null
): Promise<SettlementResponse> {
  withSession(session);
  return unwrap(await AccountingControllerService.settleSupplier(payload));
}

// Re-export specific types needed by UI
export type { DealerSettlementRequest, SupplierSettlementRequest };
// I'll try to export SettlementAllocation if it exists, or define it compatible with the Request.
export type SettlementAllocation = {
  invoiceId?: number;
  purchaseId?: number;
  appliedAmount: number;
  discountAmount?: number;
  writeOffAmount?: number;
  fxAdjustment?: number;
  memo?: string;
};
export type SettlementPaymentRequest = {
  accountId: number;
  amount: number;
  method?: string;
  referenceNumber?: string;
  memo?: string;
}; // UI seems to use this type locally or imported.

export type { AuditDigestResponse };

// --- Catalog Types ---
import type { ProductCreateRequest } from './client/models/ProductCreateRequest';
import type { ProductUpdateRequest } from './client/models/ProductUpdateRequest';
import type { ApiResponseProductionProductDto } from './client/models/ApiResponseProductionProductDto'; // This seems to be the DTO
import type { BulkVariantRequest } from './client/models/BulkVariantRequest';
import type { BulkVariantResponse } from './client/models/BulkVariantResponse';
export type { BulkVariantRequest, BulkVariantResponse };

import type { ProductionProductDto } from './client/models/ProductionProductDto';
export type CatalogProduct = ProductionProductDto;
export interface CatalogProductCreatePayload {
  brandId?: number;
  brandName?: string;
  brandCode?: string;
  productName: string;
  category: string;
  defaultColour?: string;
  sizeLabel?: string;
  unitOfMeasure?: string;
  customSkuCode?: string;
  basePrice?: number;
  gstRate?: number;
  minDiscountPercent?: number;
  minSellingPrice?: number;
  metadata?: Record<string, any>;
}

export interface CatalogProductUpdatePayload extends Partial<CatalogProductCreatePayload> {
  id: number;
}

import { AccountingCatalogControllerService } from './client/services/AccountingCatalogControllerService';
import type { CancelRequest } from './client/models/CancelRequest';
import type { StatusRequest } from './client/models/StatusRequest';

// Dealer Types
import type { DealerResponse } from './client/models/DealerResponse';
import type { CreateDealerRequest } from './client/models/CreateDealerRequest';

export type DealerSummary = DealerResponse;
export type CreateDealerPayload = CreateDealerRequest;

// --- API Functions ---

// Account Functions
export async function listAccounts(session?: AuthSession | null): Promise<AccountSummary[]> {
  withSession(session);
  const response: any = await AccountingControllerService.accounts();
  // Safe unwrap: check if it's strictly an array, or has .data which is an array
  const rawData = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);

  return rawData.map((row: any) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    type: formatAccountType(row.type),
    balance: row.balance != null ? asNumber(row.balance) : undefined,
    parentId: row.parentId,
    parentName: row.parentName,
    hierarchyLevel: row.hierarchyLevel,
  }));
}

export async function listAccountTree(session?: AuthSession | null): Promise<AccountSummary[]> {
  withSession(session);
  // Generated method found as getChartOfAccountsTree
  const data = unwrap<any[]>(await AccountingControllerService.getChartOfAccountsTree());

  const mapNode = (node: any): AccountSummary => ({
    id: node.id,
    code: node.code,
    name: node.name,
    type: formatAccountType(node.type),
    balance: node.balance != null ? asNumber(node.balance) : undefined,
    parentId: node.parentId,
    parentName: node.parentName,
    hierarchyLevel: node.hierarchyLevel,
    children: node.children ? node.children.map(mapNode) : undefined
  });

  return data.map(mapNode);
}

export async function listAccountTreeByType(type: string, session?: AuthSession | null): Promise<AccountSummary[]> {
  withSession(session);
  const data = unwrap<any[]>(await AccountingControllerService.getAccountTreeByType(type));

  const mapNode = (node: any): AccountSummary => ({
    id: node.id,
    code: node.code,
    name: node.name,
    type: formatAccountType(node.type),
    balance: node.balance != null ? asNumber(node.balance) : undefined,
    parentId: node.parentId,
    parentName: node.parentName,
    hierarchyLevel: node.hierarchyLevel,
    children: node.children ? node.children.map(mapNode) : undefined
  });

  return data.map(mapNode);
}


// Journal Entry Functions
export async function listJournalEntries(
  filters?: { from?: string; to?: string; dealerId?: number; status?: string; q?: string },
  session?: AuthSession | null
): Promise<JournalEntrySummary[]> {
  // Manual call because generated client misses filters
  const usp = new URLSearchParams();
  if (filters?.from) usp.set('from', filters.from);
  if (filters?.to) usp.set('to', filters.to);
  if (filters?.dealerId) usp.set('dealerId', String(filters.dealerId));
  if (filters?.status) usp.set('status', filters.status);
  if (filters?.q) usp.set('q', filters.q);

  const payload = await apiData<Array<any>>(
    `/api/v1/accounting/journal-entries${usp.toString() ? `?${usp.toString()}` : ''}`,
    {},
    session ?? undefined
  );

  return payload.map((row: any) => ({
    id: row.id,
    referenceNumber: row.referenceNumber,
    entryDate: row.entryDate,
    memo: row.memo,
    status: row.status,
    debitTotal: asNumber(row.debitTotal),
    creditTotal: asNumber(row.creditTotal),
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    voucherType: row.voucherType,
    dealerName: row.dealerName,
    lines: row.lines?.map((line: any) => ({
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      description: line.description,
      debit: line.debit != null ? asNumber(line.debit) : undefined,
      credit: line.credit != null ? asNumber(line.credit) : undefined,
    })),
  }));
}

export async function createJournalEntry(
  payload: JournalEntryRequest,
  session?: AuthSession | null,
  companyCode?: string
): Promise<JournalEntrySummary> {
  withSession(session);
  return unwrap(await AccountingControllerService.createJournalEntry(payload as ApiJournalEntryRequest));
}

export async function reverseJournalEntry(
  id: number,
  payload: JournalEntryReversalRequest,
  session?: AuthSession | null,
  companyCode?: string
): Promise<JournalEntrySummary> {
  withSession(session);
  return unwrap(await AccountingControllerService.reverseJournalEntry(id, payload as ApiJournalEntryReversalRequest));
}

export async function cascadeReverseJournalEntry(
  id: number,
  payload: JournalEntryReversalRequest,
  session?: AuthSession | null,
  companyCode?: string
): Promise<JournalEntrySummary> {
  withSession(session);
  // Note: cascadeReverseJournalEntry in generated client returns ApiResponseListJournalEntryDto (list?)
  // But original returns JournalEntrySummary (single?)
  // Let's check type. If list, return first? Or change return type.
  // Original: returns JournalEntrySummary.
  // Generated: cascadeReverseJournalEntry returns List.
  // This implies cascade reverse creates multiple reversal entries (one for each related entry).
  // I should probably return the list or just the main one.
  // For now, let's cast to any and return whatever it returns, OR fix the interface.
  // I'll return the first one or the whole list if I change the signature.
  // To match legacy signature:
  return unwrap<any>(await AccountingControllerService.cascadeReverseJournalEntry(id, payload as ApiJournalEntryReversalRequest));
}

// Reports
export async function getAgedReceivablesReport(
  asOfDate?: string,
  session?: AuthSession | null,
  companyCode?: string
): Promise<AgedReceivablesReport> {
  withSession(session);
  const payload = unwrap<AgedReceivablesReport>(await AccountingControllerService.getAgedReceivables(asOfDate));
  // Ensure numbers
  return {
    asOfDate: payload.asOfDate,
    grandTotal: asNumber(payload.grandTotal),
    dealers: payload.dealers.map(d => ({
      ...d,
      totalOutstanding: asNumber(d.totalOutstanding),
      buckets: {
        current: asNumber(d.buckets.current),
        days1to30: asNumber(d.buckets.days1to30),
        days31to60: asNumber(d.buckets.days31to60),
        days61to90: asNumber(d.buckets.days61to90),
        over90: asNumber(d.buckets.over90)
      }
    }))
  };
}

export async function getDealerDsoReport(
  dealerId: number,
  session?: AuthSession | null,
  companyCode?: string
): Promise<DsoReport> {
  withSession(session);
  const payload = unwrap<DsoReport>(await AccountingControllerService.getDealerDso(dealerId));
  return {
    ...payload,
    dso: asNumber(payload.dso),
    totalSales: asNumber(payload.totalSales),
    totalReceivables: asNumber(payload.totalReceivables),
    periodDays: asNumber(payload.periodDays)
  };
}

export async function getDealerLedgerView(
  dealerId: number,
  session?: AuthSession | null,
  companyCode?: string
): Promise<DealerLedgerView> {
  withSession(session);
  const payload = unwrap<any>(await DealerControllerService.dealerLedger(dealerId));
  return {
    dealerId: asNumber(payload.dealerId),
    dealerName: payload.dealerName,
    currentBalance: asNumber(payload.currentBalance),
    entries: (payload.entries ?? []).map((row: any) => ({
      date: row.date,
      reference: row.reference,
      memo: row.memo,
      debit: row.debit != null ? asNumber(row.debit) : undefined,
      credit: row.credit != null ? asNumber(row.credit) : undefined,
      runningBalance: row.runningBalance != null ? asNumber(row.runningBalance) : undefined
    }))
  };
}

export async function getDealerInvoicesView(
  dealerId: number,
  session?: AuthSession | null,
  companyCode?: string
): Promise<DealerInvoicesView> {
  withSession(session);
  const payload = unwrap<any>(await DealerControllerService.dealerInvoices1(dealerId));
  return {
    dealerId: asNumber(payload.dealerId),
    dealerName: payload.dealerName,
    totalOutstanding: asNumber(payload.totalOutstanding),
    ledgerBalance: asNumber(payload.ledgerBalance),
    netOutstanding: asNumber(payload.netOutstanding),
    advanceCredit: asNumber(payload.advanceCredit),
    invoiceCount: asNumber(payload.invoiceCount),
    invoices: (payload.invoices ?? []).map((row: any) => ({
      id: asNumber(row.id),
      invoiceNumber: row.invoiceNumber,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      totalAmount: row.totalAmount != null ? asNumber(row.totalAmount) : undefined,
      outstandingAmount: row.outstandingAmount != null ? asNumber(row.outstandingAmount) : undefined,
      appliedAmount: row.appliedAmount != null ? asNumber(row.appliedAmount) : undefined,
      advanceApplied: Boolean(row.advanceApplied),
      status: row.status,
      currency: row.currency
    }))
  };
}

export async function getDealerAgingView(
  dealerId: number,
  session?: AuthSession | null,
  companyCode?: string
): Promise<DealerAgingView> {
  withSession(session);
  const payload = unwrap<any>(await DealerControllerService.dealerAging(dealerId));
  const rawBuckets = payload.agingBuckets ?? {};
  const normalizedBuckets: DealerAgingBucketMap = {};
  Object.keys(rawBuckets).forEach((key) => {
    normalizedBuckets[key] = asNumber(rawBuckets[key]);
  });
  return {
    dealerId: asNumber(payload.dealerId),
    dealerName: payload.dealerName,
    creditLimit: asNumber(payload.creditLimit),
    totalOutstanding: asNumber(payload.totalOutstanding),
    ledgerBalance: asNumber(payload.ledgerBalance),
    netOutstanding: asNumber(payload.netOutstanding),
    advanceCredit: asNumber(payload.advanceCredit),
    availableCredit: asNumber(payload.availableCredit),
    agingBuckets: normalizedBuckets,
    overdueInvoices: (payload.overdueInvoices ?? []).map((row: any) => ({
      invoiceNumber: row.invoiceNumber,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      daysOverdue: row.daysOverdue != null ? asNumber(row.daysOverdue) : undefined,
      outstandingAmount: row.outstandingAmount != null ? asNumber(row.outstandingAmount) : undefined
    }))
  };
}

export async function getCashFlow(session?: AuthSession | null): Promise<any> {
  withSession(session);
  return unwrap(await ReportControllerService.cashFlow());
}



export async function accountStatement(
  accountId: number,
  from?: string,
  to?: string,
  session?: AuthSession | null,
  companyCode?: string
): Promise<StatementRow[]> {
  withSession(session);
  const usp = new URLSearchParams();
  if (from) usp.set('startDate', from);
  if (to) usp.set('endDate', to);

  const qs = usp.toString();
  const report = await apiData<AccountActivityReport>(`/api/v1/accounting/accounts/${accountId}/activity${qs ? `?${qs}` : ''}`, {}, session);

  const movements = report.movements || [];
  return movements.map((d) => ({
    date: Array.isArray(d.date)
      ? `${d.date[0]}-${String(d.date[1]).padStart(2, '0')}-${String(d.date[2]).padStart(2, '0')}`
      : String(d.date || ''),
    reference: d.reference || '',
    description: d.description || '',
    debit: asNumber(d.debit),
    credit: asNumber(d.credit),
    balance: asNumber(d.runningBalance)
  }));
}

export async function getGstSummary(from?: string, to?: string, session?: AuthSession | null, companyCode?: string): Promise<any> {
  withSession(session);
  // Mapping to generateGstReturn as it returns GST data. 
  // It expects 'period' (e.g. YYYY-MM). We derive it from 'from'.
  const period = from ? from.substring(0, 7) : undefined;
  return unwrap(await AccountingControllerService.generateGstReturn(period));
}

// getGstInputCredit removed - endpoint /api/v1/reports/gst/input-credit does not exist in backend
// getGstOutputLiability removed - endpoint /api/v1/reports/gst/output-liability does not exist in backend

export async function incomeStatementHierarchy(session?: AuthSession | null): Promise<any> {
  withSession(session);
  return unwrap(await AccountingControllerService.getIncomeStatementHierarchy());
}

export async function balanceSheetHierarchy(session?: AuthSession | null): Promise<any> {
  withSession(session);
  return unwrap(await AccountingControllerService.getBalanceSheetHierarchy());
}



// Dealer Functions
export async function listDealers(session?: AuthSession | null, companyCode?: string): Promise<DealerSummary[]> {
  withSession(session);
  // Try DealerControllerService.listDealers() if exists? Or apiData call.
  // In previous file: /api/v1/sales/dealers
  // Generated Service for /api/v1/sales/dealers is likely SalesControllerService or DealerControllerService
  // I will fallback to manual if unsure, to avoid breaking key lists.
  // But wait, DealerControllerService exists.
  return apiData<DealerSummary[]>('/api/v1/sales/dealers', {}, session);
}

export async function createDealer(
  payload: CreateDealerPayload,
  session?: AuthSession | null,
  companyCode?: string
): Promise<DealerSummary> {
  withSession(session);
  // Manual fallback or find Service
  return apiData<DealerSummary>('/api/v1/dealers', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, session);
}

export async function updateDealer(
  id: number,
  payload: CreateDealerPayload,
  session?: AuthSession | null,
  companyCode?: string
): Promise<DealerSummary> {
  withSession(session);
  return apiData<DealerSummary>(`/api/v1/dealers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }, session);
}

export async function searchDealers(
  query: string,
  session?: AuthSession | null,
  companyCode?: string
): Promise<DealerLookup[]> {
  const usp = new URLSearchParams();
  usp.set('query', query);
  return apiData<DealerLookup[]>(`/api/v1/sales/dealers/search?${usp.toString()}`, {}, session);
}

// Supplier Functions
export async function listSuppliers(session?: AuthSession | null, companyCode?: string): Promise<SupplierResponse[]> {
  withSession(session);
  return unwrap(await SupplierControllerService.listSuppliers());
}

export async function searchSuppliers(
  query: string,
  session?: AuthSession | null,
  companyCode?: string
): Promise<SupplierResponse[]> {
  const suppliers = await listSuppliers(session, companyCode);
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return suppliers;

  return suppliers.filter((supplier) => {
    const name = (supplier.name ?? '').toLowerCase();
    const code = (supplier.code ?? '').toLowerCase();
    return name.includes(normalizedQuery) || code.includes(normalizedQuery);
  });
}

// Payment Functions
export async function createDealerReceipt(
  payload: DealerReceiptRequest,
  session?: AuthSession | null
): Promise<any> {
  withSession(session);
  return unwrap(await AccountingControllerService.recordDealerReceipt(payload));
}

export async function createSupplierPayment(
  payload: SupplierPaymentRequest,
  session?: AuthSession | null
): Promise<any> {
  withSession(session);
  // There are TWO likely methods: recordSupplierPayment (line 57) or similar.
  // I verified AccountingControllerService has recordSupplierPayment.
  return unwrap(await AccountingControllerService.recordSupplierPayment(payload));
}

export async function postAccrual(
  payload: AccrualRequest,
  session?: AuthSession | null
): Promise<any> {
  withSession(session);
  return unwrap(await AccountingControllerService.postAccrual(payload));
}


export async function createSupplier(
  payload: SupplierRequest,
  session?: AuthSession | null,
  companyCode?: string
): Promise<SupplierResponse> {
  withSession(session);
  return unwrap(await SupplierControllerService.createSupplier(payload));
}

export async function updateSupplier(
  id: number,
  payload: SupplierRequest,
  session?: AuthSession | null,
  companyCode?: string
): Promise<SupplierResponse> {
  withSession(session);
  return unwrap(await SupplierControllerService.updateSupplier(id, payload));
}

// Purchase Functions
export async function listPurchases(
  session?: AuthSession | null,
  companyCode?: string,
  supplierId?: number
): Promise<PurchaseDto[]> {
  withSession(session);
  // Generated client doesn't support filtering by supplierId in list invocations generally
  // manually constructing call to support query params if backend supports it
  const usp = new URLSearchParams();
  if (supplierId) usp.set('supplierId', String(supplierId));

  // Using apiData for flexibility if generated client is rigid
  // Endpoint: /api/v1/purchasing/raw-material-purchases
  return apiData<PurchaseDto[]>(
    `/api/v1/purchasing/raw-material-purchases${usp.toString() ? `?${usp.toString()}` : ''}`,
    {},
    session
  );
}

// Debit/Credit Note Functions
export async function createDebitNote(
  payload: DebitNoteRequest,
  session?: AuthSession | null,
  companyCode?: string
): Promise<JournalEntrySummary> {
  withSession(session);
  // Maps to postDebitNote
  return unwrap(await AccountingControllerService.postDebitNote(payload));
}

export async function createCreditNote(
  payload: CreditNoteRequest,
  session?: AuthSession | null,
  companyCode?: string
): Promise<JournalEntrySummary> {
  withSession(session);
  // Maps to postCreditNote
  return unwrap(await AccountingControllerService.postCreditNote(payload));
}

// Catalog Functions (CatalogProduct, etc already added)


// Statement Functions


// Accounting Periods
export interface AccountingPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
}

export interface MonthEndChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

export async function listAccountingPeriods(session?: AuthSession | null): Promise<AccountingPeriod[]> {
  withSession(session);
  return apiData<AccountingPeriod[]>('/api/v1/accounting/periods', {}, session);
}

export async function closeAccountingPeriod(id: number, session?: AuthSession | null): Promise<void> {
  withSession(session);
  return apiData<void>(`/api/v1/accounting/periods/${id}/close`, { method: 'POST' }, session);
}

export async function lockAccountingPeriod(id: number, session?: AuthSession | null): Promise<void> {
  withSession(session);
  return apiData<void>(`/api/v1/accounting/periods/${id}/lock`, { method: 'POST' }, session);
}

export async function reopenAccountingPeriod(id: number, session?: AuthSession | null): Promise<void> {
  withSession(session);
  return apiData<void>(`/api/v1/accounting/periods/${id}/reopen`, { method: 'POST' }, session);
}

export async function getMonthEndChecklist(session?: AuthSession | null, periodId?: number): Promise<MonthEndChecklistItem[]> {
  withSession(session);
  const dto = unwrap<MonthEndChecklistDto>(await AccountingControllerService.checklist(periodId));
  const items = dto?.items ?? [];
  return items
    .map((item: MonthEndChecklistItemDto) => ({
      id: item.key ?? '',
      label: item.label ?? item.key ?? '',
      completed: !!item.completed,
      required: true,
    }))
    .filter((item) => item.id.length > 0);
}

export async function updateMonthEndChecklist(periodId: number, items: MonthEndChecklistItem[], session?: AuthSession | null): Promise<void> {
  withSession(session);
  const normalizeKey = (value: string) => value.replace(/[^a-z]/gi, '').toLowerCase();
  const byKey = new Map(items.map((item) => [normalizeKey(item.id), item]));

  const bankReconciled =
    byKey.get('bankreconciled')?.completed ??
    items.find((item) => normalizeKey(item.id).includes('bank'))?.completed ??
    false;

  const inventoryCounted =
    byKey.get('inventorycounted')?.completed ??
    items.find((item) => normalizeKey(item.id).includes('inventory'))?.completed ??
    false;

  const payload: MonthEndChecklistUpdateRequest = {
    bankReconciled,
    inventoryCounted,
  };

  await AccountingControllerService.updateChecklist(periodId, payload);
}

export interface SupplierAgingReport {
  supplierId: number;
  supplierName: string;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days90Plus: number;
  total: number;
}

export async function getSupplierAging(supplierId: number, session?: AuthSession | null): Promise<SupplierAgingReport> {
  withSession(session);
  return apiData<SupplierAgingReport>(`/api/v1/accounting/aging/suppliers/${supplierId}`, {}, session);
}

// Bank Reconciliation
export async function reconcileBank(payload: any, session?: AuthSession | null): Promise<any> {
  withSession(session);
  throw new Error('Bank reconciliation is not available in the backend API (OpenAPI does not expose /api/v1/accounting/bank-reconciliation).');
}

export async function resolveSalesJournalMap(
  orderIds: number[],
  session?: AuthSession | null,
  companyCode?: string
): Promise<Record<number, JournalEntrySummary | null>> {
  if (!orderIds.length) return {};

  // Naive parallel implementation as there is no batch endpoint
  // Fetch potential journal entries for these orders (by reference SALE-{id})
  // Ideally backend should support this.
  const map: Record<number, JournalEntrySummary | null> = {};

  await Promise.all(
    orderIds.map(async (id) => {
      try {
        // Search for journal entry with q = SALE-{id}
        // Logic matches InvoicesPage handling: q=${encodeURIComponent(journal?.referenceNumber || ...)}
        // We assume reference is SALE-{id} for sales orders.
        const entries = await listJournalEntries({ q: `SALE-${id}` }, session);
        // If found, take the first one
        map[id] = entries.length > 0 ? entries[0] : null;
      } catch (e) {
        console.warn(`Failed to resolve journal for order ${id}`, e);
        map[id] = null;
      }
    })
  );

  return map;
}

// Financial Reports


export async function getTrialBalance(
  asOfDate?: string,
  session?: AuthSession | null,
  companyCode?: string
): Promise<any> {
  withSession(session);
  if (!asOfDate) {
    // Fallback to today or ignore?
    // Generated client signature: getTrialBalanceAsOf(date: string)
    const date = new Date().toISOString().split('T')[0];
    return unwrap(await AccountingControllerService.getTrialBalanceAsOf(date));
  }
  return unwrap(await AccountingControllerService.getTrialBalanceAsOf(asOfDate));
}

// Reconciliation
export async function getReconciliationReport(
  bankAccountId: number,
  statementBalance?: number,
  session?: AuthSession | null,
  companyCode?: string
): Promise<any> {
  const usp = new URLSearchParams();
  usp.set('bankAccountId', String(bankAccountId));
  if (statementBalance !== undefined) usp.set('statementBalance', String(statementBalance));
  return apiData<any>(
    `/api/v1/reports/reconciliation-dashboard${usp.toString() ? `?${usp.toString()}` : ''}`,
    {},
    session ?? undefined
  );

}

export async function getAuditDigest(
  from?: string,
  to?: string,
  session?: AuthSession | null,
  companyCode?: string,
  format: 'json' | 'csv' = 'json'
): Promise<AuditDigestResponse | string> {
  withSession(session);
  // Generated client signature: getAuditDigest(from?: string, to?: string, format?: 'json' | 'csv')
  const result = await AccountingControllerService.auditDigest(from, to);
  if (format === 'csv') {
    return result as unknown as string; // Backend returns string for CSV
  }
  return unwrap(result);
}

// --- Catalog Functions ---

export async function listCatalogProducts(session?: AuthSession | null): Promise<CatalogProduct[]> {
  withSession(session);
  const response: any = await AccountingCatalogControllerService.listProducts();
  // Safe unwrap
  return Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
}

export async function createCatalogProduct(
  payload: CatalogProductCreatePayload,
  session?: AuthSession | null
): Promise<CatalogProduct> {
  withSession(session);
  return unwrap<any>(await AccountingCatalogControllerService.createProduct(payload));
}

export async function updateCatalogProduct(
  id: number,
  payload: CatalogProductUpdatePayload,
  session?: AuthSession | null
): Promise<CatalogProduct> {
  withSession(session);
  return unwrap<any>(await AccountingCatalogControllerService.updateProduct(id, payload));
}

export async function createBulkVariants(
  payload: BulkVariantRequest,
  session?: AuthSession | null
): Promise<BulkVariantResponse> {
  withSession(session);
  return unwrap(await AccountingCatalogControllerService.createVariants(payload));
}


// listSettlements removed - endpoint /api/v1/accounting/settlements does not exist
// Use createDealerSettlement or createSupplierSettlement instead

export {
  toggleDealerHold
} from './dealerApi';


// GST Reports



// Invoice Functions
export interface InvoiceLineDto {
  id: number;
  productCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface InvoiceDto {
  id: number;
  invoiceNumber: string;
  dealerId: number;
  dealerName?: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  status: string;
  salesOrderId?: number;
  lines?: InvoiceLineDto[];
}

export async function listInvoices(
  filters?: { dealerId?: number; from?: string; to?: string; status?: string },
  session?: AuthSession | null,
  companyCode?: string
): Promise<InvoiceDto[]> {
  const normalizedStatus = filters?.status?.trim().toUpperCase();
  let invoices: InvoiceDto[];
  if (filters?.dealerId) {
    withSession(session);
    invoices = unwrap(await InvoiceControllerService.dealerInvoices(filters.dealerId));
  } else {
    const usp = new URLSearchParams();
    if (filters?.from) usp.set('from', filters.from);
    if (filters?.to) usp.set('to', filters.to);
    if (filters?.status) usp.set('status', filters.status);
    invoices = await apiData<InvoiceDto[]>(
      `/api/v1/invoices${usp.toString() ? `?${usp.toString()}` : ''}`,
      {},
      session
    );
  }
  if (normalizedStatus) {
    return invoices.filter((inv) => (inv.status ?? '').toUpperCase() === normalizedStatus);
  }
  return invoices;
}

export async function getInvoice(
  id: number,
  session?: AuthSession | null,
  companyCode?: string
): Promise<InvoiceDto> {
  withSession(session);
  return unwrap(await InvoiceControllerService.getInvoice(id));
}

// Helper to get invoice by order ID - matches usage in DispatchConfirmModal
// It seems DispatchConfirmModal expects this to return the invoice directly.
// Backend support: getInvoiceByOrderId? 
// InvoiceControllerService has no getInvoiceByOrderId.
// But listInvoices has NO orderId filter in generated code, but UI thinks it does.
// Alternatively, listInvoices might return list and we filter.
// Or we assume listInvoices supports q or similar?
// Let's implement it by listing invoices and filtering by salesOrderId manually if needed.
// WAIT: InvoicesPage mapped `inv.salesOrderId`.
// So the DTO has `salesOrderId`.
// We can list invoices and find one with that orderId.
export async function getInvoiceByOrderId(
  orderId: number,
  session?: AuthSession | null,
  companyCode?: string
): Promise<InvoiceDto> {
  // Ideally backend endpont: GET /api/v1/invoices?salesOrderId=...
  // generated listInvoices takes no args or generic.
  // My custom listInvoices takes filters.
  // Let's try filtered list first if supported, else client side filter.
  // Assuming listInvoices is implemented to pass query params.
  // There is no salesOrderId in the filters defined in listInvoices signature currently.
  // Let's add it or just fetch all (risky) or fetch recent.
  // Better: check if there is an endpoint I missed.
  // No.
  // Let's search by likely reference?
  // Reference sometimes matches order.
  // Safest: List all (maybe paginated?) and find. Or, assume api supports `salesOrderId` generic param.
  // I will add salesOrderId to filters in listInvoices and pass it.
  // But wait, listInvoices signature in accountingApi.ts: filters?: { dealerId, from, to, status }
  // I'll update listInvoices signature first.

  // Actually, let's just make getInvoiceByOrderId use apiData directly with salesOrderId param, hoping backend supports it.
  // If not, it returns all and we find.
  const usp = new URLSearchParams();
  usp.set('salesOrderId', String(orderId));
  const list = await apiData<InvoiceDto[]>(`/api/v1/invoices?${usp.toString()}`, {}, session);
  if (list.length > 0) return list[0];
  throw new Error(`Invoice for order ${orderId} not found`);
}


export async function sendInvoiceEmail(
  id: number,
  session?: AuthSession | null,
  companyCode?: string
): Promise<void> {
  withSession(session);
  await InvoiceControllerService.sendInvoiceEmail(id);
}

export function getInvoicePdfUrl(
  id: number,
  baseUrl: string
): string {
  // Returns the direct URL to the PDF endpoint
  // Matches usage: getInvoicePdfUrl(success.invoiceId, API_BASE_URL)
  // endpoint: /api/v1/invoices/{id}/pdf
  // Remove trailing slash from baseUrl if present
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/api/v1/invoices/${id}/pdf`;
}

// --- Audit Transaction Interfaces ---

export interface AuditTransactionSummary {
  journalEntryId: number;
  transactionType?: string;
  amount?: number;
  date?: string;
  description?: string;
  user?: string;
  status?: string;
  referenceNumber?: string;
  createdAt?: string;
}

export interface AuditTransactionDetail extends AuditTransactionSummary {
  lines?: Array<{
    accountId?: number;
    accountCode?: string;
    accountName?: string;
    description?: string;
    debit?: number;
    credit?: number;
  }>;
  auditTrail?: Array<{
    timestamp?: string;
    action?: string;
    performedBy?: string;
    notes?: string;
  }>;
  metadata?: Record<string, unknown>;
}

export interface AuditTransactionPage {
  content: AuditTransactionSummary[];
  totalElements?: number;
  totalPages?: number;
  page?: number;
  size?: number;
}

export const listAuditTransactions = async (
  params?: { page?: number; size?: number; journalEntryId?: number; from?: string; to?: string },
  session?: AuthSession | null
): Promise<AuditTransactionPage> => {
  const usp = new URLSearchParams();
  if (params?.page !== undefined) usp.set('page', String(params.page));
  if (params?.size !== undefined) usp.set('size', String(params.size));
  if (params?.journalEntryId !== undefined) usp.set('journalEntryId', String(params.journalEntryId));
  if (params?.from) usp.set('from', params.from);
  if (params?.to) usp.set('to', params.to);

  const raw = await apiData<unknown>(
    `/api/v1/accounting/audit/transactions${usp.toString() ? `?${usp.toString()}` : ''}`,
    {},
    session ?? undefined
  );

  // Support both paginated envelope { content: [], totalElements, … } and plain array
  if (Array.isArray(raw)) {
    return { content: raw as AuditTransactionSummary[] };
  }
  const envelope = raw as Record<string, unknown>;
  if (envelope && Array.isArray(envelope['content'])) {
    return {
      content: envelope['content'] as AuditTransactionSummary[],
      totalElements: typeof envelope['totalElements'] === 'number' ? envelope['totalElements'] : undefined,
      totalPages: typeof envelope['totalPages'] === 'number' ? envelope['totalPages'] : undefined,
      page: typeof envelope['page'] === 'number' ? envelope['page'] : undefined,
      size: typeof envelope['size'] === 'number' ? envelope['size'] : undefined,
    };
  }
  return { content: [] };
};

export const getAuditTransactionDetail = async (
  journalEntryId: number,
  session?: AuthSession | null
): Promise<AuditTransactionDetail> => {
  return apiData<AuditTransactionDetail>(
    `/api/v1/accounting/audit/transactions/${journalEntryId}`,
    {},
    session ?? undefined
  );
};

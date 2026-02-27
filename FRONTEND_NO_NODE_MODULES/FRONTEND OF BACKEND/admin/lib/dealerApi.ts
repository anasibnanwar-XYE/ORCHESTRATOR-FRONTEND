import { apiData, setApiSession } from './api';
import type { AuthSession } from '../types/auth';
import { OpenAPI } from './client/core/OpenAPI';
import type { CreateDealerRequest } from './client/models/CreateDealerRequest';
import type { DealerResponse } from './client/models/DealerResponse';
import { DealerControllerService } from './client/services/DealerControllerService';
import { DealerPortalControllerService } from './client/services/DealerPortalControllerService';

// ...

export const getDealerOrders = async (session?: AuthSession | null): Promise<DealerPortalOrder[]> => {
  withSession(session);
  const payload = unwrap<any>(await DealerPortalControllerService.getMyOrders());
  const orders = Array.isArray(payload) ? payload : [];
  return orders.map((o: any) => ({
    id: asNumber(o?.id),
    orderNumber: o?.orderNumber ?? undefined,
    status: o?.status ?? 'UNKNOWN',
    totalAmount: asNumber(o?.totalAmount),
    createdAt: o?.createdAt ?? undefined,
    notes: o?.notes ?? undefined,
  }));
};

const asNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

// Helper for session
const withSession = (session?: AuthSession | null) => {
  if (session) setApiSession(session);
};

// Helper to unwrap "envelope"
const unwrap = <T>(response: any): T => {
  if (response && typeof response === 'object') {
    if ('success' in response && 'data' in response) {
      if (!response.success && response.message) {
        throw new Error(response.message);
      }
      return response.data as T;
    }
  }
  return response as T;
};

/**
 * Dealer portal dashboard
 * GET /api/v1/dealer-portal/dashboard
 */
export type DealerPortalDashboard = {
  dealerId?: number;
  dealerName?: string;
  dealerCode?: string;
  currentBalance?: number;
  creditLimit?: number;
  availableCredit?: number;
  totalOutstanding?: number;
  netOutstanding?: number;
  advanceCredit?: number;
  pendingInvoices?: number;
  agingBuckets?: Record<string, number>;
};

export async function getDealerDashboard(session?: AuthSession | null): Promise<DealerPortalDashboard> {
  withSession(session);
  const payload = unwrap<any>(await DealerPortalControllerService.getDashboard());
  const buckets = payload?.agingBuckets;
  return {
    dealerId: payload?.dealerId,
    dealerName: payload?.dealerName,
    dealerCode: payload?.dealerCode,
    currentBalance: asNumber(payload?.currentBalance),
    creditLimit: asNumber(payload?.creditLimit),
    availableCredit: asNumber(payload?.availableCredit),
    totalOutstanding: asNumber(payload?.totalOutstanding),
    netOutstanding: asNumber(payload?.netOutstanding),
    advanceCredit: asNumber(payload?.advanceCredit),
    pendingInvoices: asNumber(payload?.pendingInvoices),
    agingBuckets: buckets && typeof buckets === 'object'
      ? Object.fromEntries(Object.entries(buckets).map(([key, value]) => [key, asNumber(value)]))
      : undefined,
  };
}

/**
 * Dealer portal orders
 * GET /api/v1/dealer-portal/orders
 */
export type DealerPortalOrder = {
  id: number;
  orderNumber?: string;
  status: string;
  totalAmount?: number;
  createdAt?: string;
  notes?: string;
};

/**
 * Dealer portal invoices
 * GET /api/v1/dealer-portal/invoices
 */
export type DealerPortalInvoice = {
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
};

export type DealerPortalInvoicesView = {
  dealerId?: number;
  dealerName?: string;
  totalOutstanding?: number;
  ledgerBalance?: number;
  netOutstanding?: number;
  advanceCredit?: number;
  invoiceCount?: number;
  invoices: DealerPortalInvoice[];
};

export async function getDealerInvoices(session?: AuthSession | null): Promise<DealerPortalInvoicesView> {
  withSession(session);
  const payload = unwrap<any>(await DealerPortalControllerService.getMyInvoices());
  const invoices = Array.isArray(payload?.invoices) ? payload.invoices : [];
  return {
    dealerId: payload?.dealerId,
    dealerName: payload?.dealerName,
    totalOutstanding: asNumber(payload?.totalOutstanding),
    ledgerBalance: asNumber(payload?.ledgerBalance),
    netOutstanding: asNumber(payload?.netOutstanding),
    advanceCredit: asNumber(payload?.advanceCredit),
    invoiceCount: asNumber(payload?.invoiceCount),
    invoices: invoices.map((inv: any) => ({
      id: asNumber(inv?.id),
      invoiceNumber: inv?.invoiceNumber ?? undefined,
      issueDate: inv?.issueDate ?? undefined,
      dueDate: inv?.dueDate ?? undefined,
      totalAmount: asNumber(inv?.totalAmount),
      outstandingAmount: asNumber(inv?.outstandingAmount),
      appliedAmount: asNumber(inv?.appliedAmount),
      advanceApplied: Boolean(inv?.advanceApplied),
      status: inv?.status ?? undefined,
      currency: inv?.currency ?? undefined,
    })),
  };
}

export async function getDealerInvoicePdf(
  invoiceId: number,
  session?: AuthSession | null
): Promise<{ blob: Blob; fileName?: string }> {
  if (session) {
    setApiSession(session);
  }

  const base = OpenAPI.BASE || '';
  const url = `${base}/api/v1/dealer-portal/invoices/${invoiceId}/pdf`;
  const headers = new Headers();

  const token = session?.accessToken || (OpenAPI.TOKEN as string | undefined);
  if (token) {
    headers.set('Authorization', `${session?.tokenType ?? 'Bearer'} ${token}`);
  }

  const companyId = session?.companyCode || (OpenAPI.HEADERS as Record<string, string> | undefined)?.['X-Company-Id'];
  if (companyId) {
    headers.set('X-Company-Id', companyId);
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to load invoice PDF (HTTP ${response.status})`);
  }

  const blob = await response.blob();
  const cd = response.headers.get('content-disposition') ?? '';
  const match = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(cd);
  const fileName = match?.[1] ? decodeURIComponent(match[1].trim()) : undefined;
  return { blob, fileName };
}

/**
 * Dealer portal ledger
 * GET /api/v1/dealer-portal/ledger
 */
export type DealerLedgerEntry = {
  date?: string;
  reference?: string;
  memo?: string;
  debit?: number;
  credit?: number;
  runningBalance?: number;
};

export type DealerPortalLedgerView = {
  dealerId?: number;
  dealerName?: string;
  currentBalance?: number;
  entries: DealerLedgerEntry[];
};

export async function getDealerLedger(session?: AuthSession | null): Promise<DealerPortalLedgerView> {
  withSession(session);
  const payload = unwrap<any>(await DealerPortalControllerService.getMyLedger());
  const entries = Array.isArray(payload?.entries) ? payload.entries : [];
  return {
    dealerId: payload?.dealerId,
    dealerName: payload?.dealerName,
    currentBalance: asNumber(payload?.currentBalance),
    entries: entries.map((e: any) => ({
      date: e?.date ?? undefined,
      reference: e?.reference ?? undefined,
      memo: e?.memo ?? undefined,
      debit: asNumber(e?.debit),
      credit: asNumber(e?.credit),
      runningBalance: asNumber(e?.runningBalance),
    })),
  };
}

/**
 * Dealer portal aging
 * GET /api/v1/dealer-portal/aging
 */
export type DealerPortalOverdueInvoice = {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  daysOverdue?: number;
  outstandingAmount?: number;
};

export type DealerPortalAgingView = {
  dealerId?: number;
  dealerName?: string;
  creditLimit?: number;
  totalOutstanding?: number;
  ledgerBalance?: number;
  netOutstanding?: number;
  advanceCredit?: number;
  availableCredit?: number;
  agingBuckets?: Record<string, number>;
  overdueInvoices: DealerPortalOverdueInvoice[];
};

export async function getDealerAging(session?: AuthSession | null): Promise<DealerPortalAgingView> {
  withSession(session);
  const payload = unwrap<any>(await DealerPortalControllerService.getMyAging());
  const buckets = payload?.agingBuckets;
  const overdueInvoices = Array.isArray(payload?.overdueInvoices) ? payload.overdueInvoices : [];
  return {
    dealerId: payload?.dealerId,
    dealerName: payload?.dealerName,
    creditLimit: asNumber(payload?.creditLimit),
    totalOutstanding: asNumber(payload?.totalOutstanding),
    ledgerBalance: asNumber(payload?.ledgerBalance),
    netOutstanding: asNumber(payload?.netOutstanding),
    advanceCredit: asNumber(payload?.advanceCredit),
    availableCredit: asNumber(payload?.availableCredit),
    agingBuckets: buckets && typeof buckets === 'object'
      ? Object.fromEntries(Object.entries(buckets).map(([key, value]) => [key, asNumber(value)]))
      : undefined,
    overdueInvoices: overdueInvoices.map((inv: any) => ({
      invoiceNumber: inv?.invoiceNumber ?? undefined,
      issueDate: inv?.issueDate ?? undefined,
      dueDate: inv?.dueDate ?? undefined,
      daysOverdue: asNumber(inv?.daysOverdue),
      outstandingAmount: asNumber(inv?.outstandingAmount),
    })),
  };
}

/**
 * Credit request type for dealer portal
 */
export type DealerCreditRequestPayload = {
  amountRequested: number;
  reason?: string;
};

/**
 * Submit a credit limit increase request via the dealer portal.
 * POST /api/v1/dealer-portal/credit-requests
 */
export const createDealerCreditRequest = async (
  payload: DealerCreditRequestPayload,
  session?: AuthSession | null
): Promise<unknown> => {
  withSession(session);
  return apiData<unknown>('/api/v1/dealer-portal/credit-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, session);
};

/**
 * Toggle dealer hold state (Accounting/Admin use).
 *
 * Backend currently only supports placing a dealer on hold via dunning evaluation:
 * `POST /api/v1/dealers/{dealerId}/dunning/hold`.
 *
 * There is no API to manually release a dealer from hold (set status back to ACTIVE),
 * so `hold=false` will throw until such an endpoint exists.
 */
export async function toggleDealerHold(
  dealerId: number,
  hold: boolean,
  _reason?: string,
  session?: AuthSession | null
): Promise<{ success: boolean; message: string }> {
  withSession(session);
  if (!hold) {
    // Backend does not yet support releasing holds. Return informative response.
    return {
      success: false,
      message: 'Releasing a dealer hold requires backend support (pending). Contact system administrator.'
    };
  }
  // Force evaluation with lowest thresholds; dealer is placed ON_HOLD if any overdue/outstanding exists.
  await DealerControllerService.holdIfOverdue(dealerId, 0, 0);
  return { success: true, message: 'Dealer placed on hold successfully.' };
}

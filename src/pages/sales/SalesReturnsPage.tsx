/**
 * SalesReturnsPage — Sales portal returns processing
 *
 * Features:
 *   - List of invoiced orders available for return
 *   - Return form capturing return quantity per line item with reason
 *   - Creates return record and credit note/balance adjustment
 */

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  RefreshCcw,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { salesApi } from '@/lib/salesApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { InvoiceDto, SalesReturnRequest } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtCurrency(v?: number): string {
  if (v == null) return '—';
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'dd MMM yyyy');
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

function InvoiceStatusBadge({ status }: { status?: string }) {
  const s = status?.toUpperCase() ?? '';
  const cls =
    s === 'PAID'
      ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
      : s === 'PARTIALLY_PAID'
      ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
      : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
  const label = s === 'PARTIALLY_PAID' ? 'Part Paid' : (status ?? '—');
  return (
    <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', cls)}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Return Line Input
// ─────────────────────────────────────────────────────────────────────────────

interface ReturnLineState {
  lineId: number;
  maxQty: number;
  returnQty: string;
  productCode: string;
  description: string;
  unitPrice?: number;
}

function buildReturnLines(invoice: InvoiceDto): ReturnLineState[] {
  return (invoice.lines ?? []).map((line) => ({
    lineId: line.id ?? 0,
    maxQty: line.quantity ?? 0,
    returnQty: '',
    productCode: line.productCode ?? '',
    description: line.description ?? '',
    unitPrice: line.unitPrice,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SalesReturnsPage
// ─────────────────────────────────────────────────────────────────────────────

export function SalesReturnsPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Return modal
  const [returnInvoice, setReturnInvoice] = useState<InvoiceDto | null>(null);
  const [returnLines, setReturnLines] = useState<ReturnLineState[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);

  // Detail loading for return form
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.listInvoices({ size: 100 });
      // Filter to invoices that can be returned (PAID or PARTIALLY_PAID or INVOICED)
      const returnable = Array.isArray(data)
        ? data.filter((inv) => ['PAID', 'PARTIALLY_PAID', 'INVOICED', 'DISPATCHED'].includes(inv.status?.toUpperCase() ?? ''))
        : [];
      setInvoices(returnable);
    } catch {
      setError('Unable to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Return modal ─────────────────────────────────────────────────────────

  async function openReturn(invoice: InvoiceDto) {
    setReturnInvoice(invoice);
    setReturnReason('');
    setReasonError('');
    setReturnSuccess(false);

    if (invoice.lines && invoice.lines.length > 0) {
      setReturnLines(buildReturnLines(invoice));
    } else if (invoice.id) {
      setDetailLoading(true);
      try {
        const full = await salesApi.getInvoice(invoice.id);
        setReturnInvoice(full);
        setReturnLines(buildReturnLines(full));
      } catch {
        toast.error('Failed to load invoice lines');
        setReturnLines([]);
      } finally {
        setDetailLoading(false);
      }
    }
  }

  function updateReturnQty(lineId: number, qty: string) {
    setReturnLines((lines) =>
      lines.map((l) => (l.lineId === lineId ? { ...l, returnQty: qty } : l))
    );
  }

  async function handleProcessReturn() {
    if (!returnInvoice?.id) return;
    if (!returnReason.trim()) {
      setReasonError('Return reason is required');
      return;
    }
    setReasonError('');

    const activeLines = returnLines
      .filter((l) => {
        const qty = parseFloat(l.returnQty);
        return !isNaN(qty) && qty > 0;
      })
      .map((l) => ({
        invoiceLineId: l.lineId,
        quantity: parseFloat(l.returnQty),
      }));

    if (activeLines.length === 0) {
      toast.error('Enter a return quantity for at least one line item');
      return;
    }

    // Validate quantities
    for (const line of returnLines) {
      const qty = parseFloat(line.returnQty);
      if (!isNaN(qty) && qty > 0 && qty > line.maxQty) {
        toast.error(`Return quantity for ${line.productCode || 'line'} cannot exceed ordered quantity (${line.maxQty})`);
        return;
      }
    }

    setProcessing(true);
    try {
      const req: SalesReturnRequest = {
        invoiceId: returnInvoice.id,
        reason: returnReason.trim(),
        lines: activeLines,
      };
      await salesApi.processSalesReturn(req);
      setReturnSuccess(true);
      toast.success('Return processed — credit note created');
    } catch {
      toast.error('Failed to process return');
    } finally {
      setProcessing(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Returns</h1>
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
            Process sales returns and generate credit notes.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle size={20} className="text-[var(--color-error)]" />
            <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 px-3 h-7 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <RefreshCcw size={12} />
              Retry
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">No invoices available for return</p>
            <p className="text-[12px] text-[var(--color-text-tertiary)]">Only dispatched or paid invoices can be returned.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    {['Invoice', 'Dealer', 'Date', 'Total', 'Status', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{inv.invoiceNumber ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{inv.dealerName ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtDate(inv.issueDate)}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(inv.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openReturn(inv)}
                          className="flex items-center gap-1.5 px-3 h-7 rounded-lg border border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                        >
                          <RotateCcw size={12} />
                          Initiate Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{inv.invoiceNumber}</p>
                    <InvoiceStatusBadge status={inv.status} />
                  </div>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">{inv.dealerName} · {fmtDate(inv.issueDate)}</p>
                  <p className="text-[12px] tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(inv.totalAmount)}</p>
                  <button
                    type="button"
                    onClick={() => openReturn(inv)}
                    className="flex items-center gap-1 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <RotateCcw size={12} /> Initiate Return
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Return Modal */}
      <Modal
        isOpen={!!returnInvoice}
        onClose={() => { setReturnInvoice(null); setReturnLines([]); setReturnSuccess(false); }}
        title={returnSuccess ? 'Return Processed' : `Return — ${returnInvoice?.invoiceNumber ?? ''}`}
      >
        {returnSuccess ? (
          <div className="space-y-4 p-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-success-bg)]">
              <CheckCircle size={18} className="text-[var(--color-success)] shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-[var(--color-success)]">Return processed successfully</p>
                <p className="text-[12px] text-[var(--color-success)] mt-0.5">
                  Credit note created and dealer balance adjusted.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setReturnInvoice(null); setReturnSuccess(false); }}
              className="w-full h-9 rounded-lg bg-[var(--color-neutral-900)] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-1">
            {/* Invoice summary */}
            {returnInvoice && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[var(--color-text-secondary)]">
                <span>Dealer: <span className="font-medium text-[var(--color-text-primary)]">{returnInvoice.dealerName}</span></span>
                <span>Total: <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{fmtCurrency(returnInvoice.totalAmount)}</span></span>
                <span>Date: <span className="tabular-nums">{fmtDate(returnInvoice.issueDate)}</span></span>
              </div>
            )}

            {/* Line items */}
            {detailLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ) : returnLines.length > 0 ? (
              <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                <div className="px-3 py-2 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-subtle)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Return Quantities</p>
                </div>
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {returnLines.map((line) => (
                    <div key={line.lineId} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate">
                          {line.description || line.productCode || `Line ${line.lineId}`}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-tertiary)]">
                          Ordered: {line.maxQty} · {fmtCurrency(line.unitPrice)} each
                        </p>
                      </div>
                      <div className="shrink-0">
                        <input
                          type="number"
                          min="0"
                          max={line.maxQty}
                          step="1"
                          value={line.returnQty}
                          onChange={(e) => updateReturnQty(line.lineId, e.target.value)}
                          placeholder="0"
                          className="w-20 px-2 py-1 text-[12px] tabular-nums text-right rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-neutral-900)] transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-[var(--color-text-tertiary)] text-center py-4">
                No line items available
              </p>
            )}

            {/* Return reason */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Return Reason <span className="text-[var(--color-error)]">*</span>
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => { setReturnReason(e.target.value); if (e.target.value.trim()) setReasonError(''); }}
                placeholder="Reason for return..."
                rows={2}
                className={clsx(
                  'w-full px-3 py-2 text-[13px] rounded-lg border bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none transition-colors',
                  reasonError
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border-default)] focus:border-[var(--color-neutral-900)]'
                )}
              />
              {reasonError && (
                <p className="text-[11px] text-[var(--color-error)]">{reasonError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setReturnInvoice(null); setReturnLines([]); }}
                className="px-4 h-8 rounded-lg text-[12px] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessReturn}
                disabled={processing || detailLoading}
                className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-[12px] font-medium bg-[var(--color-neutral-900)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <RotateCcw size={13} />
                {processing ? 'Processing…' : 'Process Return'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

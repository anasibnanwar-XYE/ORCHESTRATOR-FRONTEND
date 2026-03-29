/**
 * SalesInvoicesPage — Sales portal invoices view
 *
 * Features:
 *   - List all invoices (invoice number, order ref, dealer, date, amount, GST, total, payment status)
 *   - Invoice detail modal showing line items
 */

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  RefreshCcw,
  Eye,

} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { salesApi } from '@/lib/salesApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { InvoiceDto } from '@/types';

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
      : s === 'OVERDUE'
      ? 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
      : s === 'PARTIALLY_PAID'
      ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
      : s === 'CANCELLED'
      ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
      : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
  const label = s === 'PARTIALLY_PAID' ? 'Part Paid' : (status ?? '—');
  return (
    <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', cls)}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SalesInvoicesPage
// ─────────────────────────────────────────────────────────────────────────────

export function SalesInvoicesPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail modal
  const [detailInvoice, setDetailInvoice] = useState<InvoiceDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.listInvoices({ size: 100 });
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setError('Unable to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Detail handler ────────────────────────────────────────────────────────

  async function openDetail(invoice: InvoiceDto) {
    if (!invoice.id) return;
    setDetailInvoice(invoice);
    if (!invoice.lines) {
      setDetailLoading(true);
      try {
        const full = await salesApi.getInvoice(invoice.id);
        setDetailInvoice(full);
      } catch {
        toast.error('Failed to load invoice details');
      } finally {
        setDetailLoading(false);
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Invoices</h1>
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
            View and track all sales invoices.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
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
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">No invoices yet</p>
            <p className="text-[12px] text-[var(--color-text-tertiary)]">Invoices are generated when orders are dispatched.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    {['Invoice', 'Dealer', 'Date', 'Due', 'Total', 'Outstanding', 'Status', ''].map((h) => (
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
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(inv.totalAmount)}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(inv.outstandingAmount)}</td>
                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(inv)}
                          className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                          title="View details"
                        >
                          <Eye size={13} />
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
                  <p className="text-[12px] text-[var(--color-text-secondary)]">{inv.dealerName}</p>
                  <div className="flex gap-4 text-[12px] tabular-nums text-[var(--color-text-secondary)]">
                    <span>Total: {fmtCurrency(inv.totalAmount)}</span>
                    <span>Outstanding: {fmtCurrency(inv.outstandingAmount)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDetail(inv)}
                    className="flex items-center gap-1 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <Eye size={12} /> View Details
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        title={detailInvoice?.invoiceNumber ?? 'Invoice Detail'}
      >
        {detailInvoice && (
          <div className="space-y-4 p-1">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Dealer</p>
                <p className="text-[var(--color-text-primary)] mt-0.5">{detailInvoice.dealerName ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Status</p>
                <div className="mt-0.5">
                  <InvoiceStatusBadge status={detailInvoice.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Issue Date</p>
                <p className="text-[var(--color-text-primary)] mt-0.5 tabular-nums">{fmtDate(detailInvoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Due Date</p>
                <p className="text-[var(--color-text-primary)] mt-0.5 tabular-nums">{fmtDate(detailInvoice.dueDate)}</p>
              </div>
            </div>

            {/* Line items */}
            {detailLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ) : detailInvoice.lines && detailInvoice.lines.length > 0 ? (
              <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                <div className="px-3 py-2 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-subtle)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Line Items</p>
                </div>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Product</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Qty</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Unit</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Tax</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {detailInvoice.lines.map((line, idx) => (
                      <tr key={line.id ?? idx}>
                        <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                          {line.description ?? line.productCode ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text-secondary)]">{line.quantity ?? '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(line.unitPrice)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(line.taxAmount)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-[var(--color-text-primary)]">{fmtCurrency(line.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* Totals */}
            <div className="space-y-1.5 pt-1">
              {[
                { label: 'Subtotal', value: detailInvoice.subtotal },
                { label: 'Tax', value: detailInvoice.taxTotal },
                { label: 'Total', value: detailInvoice.totalAmount, bold: true },
                { label: 'Outstanding', value: detailInvoice.outstandingAmount },
              ].map(({ label, value, bold }) => (
                <div key={label} className="flex justify-between text-[12px]">
                  <span className={clsx('text-[var(--color-text-secondary)]', bold && 'font-semibold text-[var(--color-text-primary)]')}>{label}</span>
                  <span className={clsx('tabular-nums', bold && 'font-semibold text-[var(--color-text-primary)]')}>{fmtCurrency(value)}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDetailInvoice(null)}
              className="w-full h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

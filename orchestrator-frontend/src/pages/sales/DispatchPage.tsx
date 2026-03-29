/**
 * DispatchPage — Sales portal dispatch coordination
 *
 * Features:
 *   - List of confirmed orders pending dispatch
 *   - Confirm Dispatch action: records dispatch, updates order to Dispatched, generates dispatch slip reference
 *   - Reconcile Order Markers: compare packed vs dispatched quantities, highlight discrepancies
 */

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  RefreshCcw,
  Truck,
  CheckCircle,
  PackageX,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { salesApi } from '@/lib/salesApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type {
  SalesOrderDto,
  SalesDispatchConfirmRequest,
  SalesDispatchConfirmResponse,
  DispatchMarkerReconciliationResponse,
} from '@/types';

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
// DispatchPage
// ─────────────────────────────────────────────────────────────────────────────

export function DispatchPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<SalesOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dispatch confirm modal
  const [dispatchTarget, setDispatchTarget] = useState<SalesOrderDto | null>(null);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [confirmedBy, setConfirmedBy] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<SalesDispatchConfirmResponse | null>(null);

  // Reconcile state
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<DispatchMarkerReconciliationResponse | null>(null);
  const [reconcileOpen, setReconcileOpen] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await salesApi.searchOrders({ status: 'CONFIRMED', page: 0, size: 100 });
      setOrders(result.content ?? []);
    } catch {
      setError('Unable to load pending dispatches. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Dispatch handler ─────────────────────────────────────────────────────

  function openDispatch(order: SalesOrderDto) {
    setDispatchTarget(order);
    setDispatchNotes('');
    setConfirmedBy('');
    setDispatchResult(null);
  }

  async function handleConfirmDispatch() {
    if (!dispatchTarget) return;
    setDispatching(true);
    try {
      const req: SalesDispatchConfirmRequest = {
        orderId: dispatchTarget.id,
        confirmedBy: confirmedBy.trim() || undefined,
        dispatchNotes: dispatchNotes.trim() || undefined,
        lines: (dispatchTarget.items ?? []).map((item) => ({
          lineId: item.id,
          shipQty: item.quantity,
        })),
      };
      const result = await salesApi.confirmDispatch(req);
      setDispatchResult(result);
      toast.success('Dispatch confirmed — order updated to Dispatched');
      await load();
    } catch {
      toast.error('Failed to confirm dispatch');
    } finally {
      setDispatching(false);
    }
  }

  // ── Reconcile handler ────────────────────────────────────────────────────

  async function handleReconcile() {
    setReconciling(true);
    try {
      const result = await salesApi.reconcileOrderMarkers();
      setReconcileResult(result);
      setReconcileOpen(true);
    } catch {
      toast.error('Failed to reconcile order markers');
    } finally {
      setReconciling(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Dispatch</h1>
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
            Confirm dispatch for confirmed orders and reconcile order markers.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReconcile}
          disabled={reconciling}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-50 transition-colors"
        >
          <RefreshCcw size={13} className={reconciling ? 'animate-spin' : ''} />
          {reconciling ? 'Reconciling…' : 'Reconcile Markers'}
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
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
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <CheckCircle size={24} className="text-[var(--color-success)]" />
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">No orders pending dispatch</p>
            <p className="text-[12px] text-[var(--color-text-tertiary)]">All confirmed orders have been dispatched.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    {['Order', 'Dealer', 'Date', 'Amount', 'Items', ''].map((h) => (
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
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{order.dealerName ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtDate(order.createdAt)}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{order.items?.length ?? 0} line{order.items?.length !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDispatch(order)}
                          className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[var(--color-neutral-900)] text-white text-[11px] font-medium hover:opacity-90 transition-opacity"
                        >
                          <Truck size={12} />
                          Confirm Dispatch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
              {orders.map((order) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{order.orderNumber}</p>
                    <span className="text-[11px] tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(order.totalAmount)}</span>
                  </div>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">{order.dealerName} · {fmtDate(order.createdAt)}</p>
                  <button
                    type="button"
                    onClick={() => openDispatch(order)}
                    className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-[var(--color-neutral-900)] text-white text-[12px] font-medium hover:opacity-90 transition-opacity"
                  >
                    <Truck size={13} />
                    Confirm Dispatch
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dispatch Confirm Modal */}
      <Modal
        isOpen={!!dispatchTarget}
        onClose={() => { setDispatchTarget(null); setDispatchResult(null); }}
        title={dispatchResult ? 'Dispatch Confirmed' : `Confirm Dispatch — ${dispatchTarget?.orderNumber ?? ''}`}
      >
        {dispatchResult ? (
          <div className="space-y-4 p-1">
            {/* Outcome: success or partial/zero-shipment */}
            {dispatchResult.dispatched === false ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-warning-bg)]">
                <PackageX size={18} className="text-[var(--color-warning)] shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-warning)]">Partial or zero shipment</p>
                  <p className="text-[12px] text-[var(--color-warning)] mt-0.5">
                    Some or all items could not be shipped. Check stock availability.
                  </p>
                  {dispatchResult.packingSlipId && (
                    <p className="text-[12px] text-[var(--color-warning)] mt-0.5">
                      Slip reference: #{dispatchResult.packingSlipId}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-success-bg)]">
                <CheckCircle size={18} className="text-[var(--color-success)] shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-success)]">Dispatch successful</p>
                  {dispatchResult.packingSlipId && (
                    <p className="text-[12px] text-[var(--color-success)] mt-0.5">
                      Dispatch slip reference: #{dispatchResult.packingSlipId}
                    </p>
                  )}
                  {dispatchResult.finalInvoiceId && (
                    <p className="text-[12px] text-[var(--color-success)] mt-0.5">
                      Invoice #{dispatchResult.finalInvoiceId} generated
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* GST Breakdown */}
            {dispatchResult.gstBreakdown && (
              <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                <div className="px-3 py-2 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-subtle)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">GST Breakdown</p>
                </div>
                <div className="divide-y divide-[var(--color-border-subtle)] text-[12px]">
                  {dispatchResult.gstBreakdown.taxableAmount != null && (
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-[var(--color-text-secondary)]">Taxable Amount</span>
                      <span className="tabular-nums text-[var(--color-text-primary)]">
                        ₹{dispatchResult.gstBreakdown.taxableAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {dispatchResult.gstBreakdown.cgst != null && (
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-[var(--color-text-secondary)]">CGST</span>
                      <span className="tabular-nums text-[var(--color-text-primary)]">
                        ₹{dispatchResult.gstBreakdown.cgst.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {dispatchResult.gstBreakdown.sgst != null && (
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-[var(--color-text-secondary)]">SGST</span>
                      <span className="tabular-nums text-[var(--color-text-primary)]">
                        ₹{dispatchResult.gstBreakdown.sgst.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {dispatchResult.gstBreakdown.igst != null && dispatchResult.gstBreakdown.igst > 0 && (
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-[var(--color-text-secondary)]">IGST</span>
                      <span className="tabular-nums text-[var(--color-text-primary)]">
                        ₹{dispatchResult.gstBreakdown.igst.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {dispatchResult.gstBreakdown.totalTax != null && (
                    <div className="flex justify-between px-3 py-2 font-medium">
                      <span className="text-[var(--color-text-primary)]">Total Tax</span>
                      <span className="tabular-nums text-[var(--color-text-primary)]">
                        ₹{dispatchResult.gstBreakdown.totalTax.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setDispatchTarget(null); setDispatchResult(null); }}
              className="w-full h-9 rounded-lg bg-[var(--color-neutral-900)] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-1">
            {/* Order summary */}
            {dispatchTarget && (
              <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                <div className="px-3 py-2 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-subtle)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Order Lines</p>
                </div>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Product</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Qty</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Ship Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {(dispatchTarget.items ?? []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-[var(--color-text-secondary)]">{item.productCode}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text-secondary)]">{item.quantity}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-[var(--color-text-primary)]">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Confirmed By
              </label>
              <input
                type="text"
                value={confirmedBy}
                onChange={(e) => setConfirmedBy(e.target.value)}
                placeholder="Your name or ID"
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-neutral-900)] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Dispatch Notes (optional)
              </label>
              <textarea
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="Any notes about this dispatch..."
                rows={2}
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:border-[var(--color-neutral-900)] transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDispatchTarget(null)}
                className="px-4 h-8 rounded-lg text-[12px] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={dispatching}
                className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-[12px] font-medium bg-[var(--color-neutral-900)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Truck size={13} />
                {dispatching ? 'Confirming…' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reconcile Result Modal */}
      <Modal
        isOpen={reconcileOpen}
        onClose={() => setReconcileOpen(false)}
        title="Order Marker Reconciliation"
      >
        {reconcileResult && (
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Scanned', value: reconcileResult.scannedOrders ?? 0 },
                { label: 'Reconciled', value: reconcileResult.reconciledOrders ?? 0 },
                {
                  label: 'Discrepancies',
                  value: (reconcileResult.scannedOrders ?? 0) - (reconcileResult.reconciledOrders ?? 0),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className={clsx(
                    'rounded-xl p-3 text-center border',
                    label === 'Discrepancies' && value > 0
                      ? 'border-[var(--color-error)] bg-[var(--color-error-bg)]'
                      : 'border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]'
                  )}
                >
                  <p className={clsx(
                    'text-[20px] font-semibold tabular-nums',
                    label === 'Discrepancies' && value > 0
                      ? 'text-[var(--color-error)]'
                      : 'text-[var(--color-text-primary)]'
                  )}>
                    {value}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {reconcileResult.reconciledOrderIds && reconcileResult.reconciledOrderIds.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Reconciled Order IDs
                </p>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  {reconcileResult.reconciledOrderIds.join(', ')}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setReconcileOpen(false)}
              className="w-full h-9 rounded-lg border border-[var(--color-border-default)] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

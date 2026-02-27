import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getPendingSlips,
  getPackagingSlip,
  confirmDispatch,
  type PackagingSlipDto,
  type PackagingSlipLineDto,
  type DispatchConfirmRequest,
  type DispatchLine,
} from '../../lib/salesApi';

const fmtDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const slipStatusClasses = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'DISPATCHED':
      return 'bg-status-success-bg text-status-success-text';
    case 'CANCELLED':
      return 'bg-status-error-bg text-status-error-text';
    case 'PENDING':
    case 'RESERVED':
      return 'bg-brand-500/10 text-brand-400';
    case 'PARTIAL':
      return 'bg-status-warning-bg text-status-warning-text';
    default:
      return 'bg-surface-highlight text-secondary';
  }
};

/**
 * Dispatch queue page for the sales portal.
 *
 * ROLE_SALES can VIEW the dispatch queue (pending slips) but CANNOT confirm dispatch
 * unless they have the explicit `dispatch.confirm` permission granted by an admin.
 * The confirm button is conditionally shown based on the user's permissions.
 */
export default function DispatchPage() {
  const { session, user } = useAuth();
  const canConfirm = user?.permissions?.includes('dispatch.confirm') ?? false;

  const [slips, setSlips] = useState<PackagingSlipDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detail modal (view-only or confirm depending on permission)
  const [selectedSlip, setSelectedSlip] = useState<PackagingSlipDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lineShipQty, setLineShipQty] = useState<Record<number, number>>({});
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmResult, setConfirmResult] = useState('');

  const loadSlips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingSlips(session);
      setSlips(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dispatch queue');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadSlips();
  }, [loadSlips]);

  const openSlipDetail = async (slip: PackagingSlipDto) => {
    if (slip.lines && slip.lines.length > 0) {
      setSelectedSlip(slip);
      initLineQty(slip.lines);
      return;
    }
    if (slip.id == null) return;
    setDetailLoading(true);
    try {
      const detail = await getPackagingSlip(slip.id, session);
      setSelectedSlip(detail);
      initLineQty(detail.lines ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load slip details');
    } finally {
      setDetailLoading(false);
    }
  };

  const initLineQty = (lines: PackagingSlipLineDto[]) => {
    const qty: Record<number, number> = {};
    lines.forEach((line) => {
      if (line.id != null) {
        qty[line.id] = line.orderedQuantity ?? line.quantity ?? 0;
      }
    });
    setLineShipQty(qty);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedSlip || !canConfirm) return;
    setConfirmSubmitting(true);
    setConfirmResult('');
    setError('');
    try {
      const lines: DispatchLine[] = (selectedSlip.lines ?? [])
        .filter((l) => l.id != null)
        .map((l) => ({
          lineId: l.id!,
          shipQty: lineShipQty[l.id!] ?? 0,
        }));

      const payload: DispatchConfirmRequest = {
        packingSlipId: selectedSlip.id,
        orderId: selectedSlip.salesOrderId,
        lines,
      };

      const result = await confirmDispatch(payload, session);
      setConfirmResult(`Dispatch confirmed. Invoice: ${result.finalInvoiceId ?? 'N/A'}`);
      setSelectedSlip(null);
      await loadSlips();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Dispatch confirmation failed');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">Dispatch Queue</h1>
          <p className="mt-1 text-sm text-secondary">
            {canConfirm
              ? 'View and confirm pending dispatch slips.'
              : 'View pending dispatch slips. Dispatch confirmation is handled by the factory team.'}
          </p>
        </div>
        <button
          onClick={loadSlips}
          disabled={loading}
          className="self-start rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}
      {confirmResult && (
        <div className="rounded-lg bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {confirmResult}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-secondary text-sm py-8 justify-center">
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {!loading && slips.length === 0 && (
        <div className="py-12 text-center text-sm text-secondary">
          No pending packaging slips in the dispatch queue.
        </div>
      )}

      {/* Queue table — desktop */}
      {!loading && slips.length > 0 && (
        <>
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-highlight text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                  <th className="px-4 py-3">Slip #</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Dealer</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-center">Lines</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-surface-highlight/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{slip.slipNumber ?? slip.publicId ?? `#${slip.id}`}</td>
                    <td className="px-4 py-3 text-primary">{slip.orderNumber ?? slip.salesOrderId}</td>
                    <td className="px-4 py-3 text-primary">{slip.dealerName ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${slipStatusClasses(slip.status)}`}>
                        {slip.status ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary whitespace-nowrap">{fmtDate(slip.createdAt)}</td>
                    <td className="px-4 py-3 text-center text-secondary">{slip.lines?.length ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openSlipDetail(slip)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border border-border text-secondary hover:text-primary hover:bg-surface-highlight"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            {slips.map((slip) => (
              <div key={slip.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-primary">{slip.slipNumber ?? `#${slip.id}`}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${slipStatusClasses(slip.status)}`}>
                    {slip.status ?? 'N/A'}
                  </span>
                </div>
                <div className="text-sm text-secondary">
                  <p>Order: {slip.orderNumber ?? slip.salesOrderId}</p>
                  <p>Dealer: {slip.dealerName ?? '—'}</p>
                </div>
                <button
                  onClick={() => openSlipDetail(slip)}
                  className="w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors border border-border text-secondary hover:text-primary hover:bg-surface-highlight"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Slip detail modal */}
      {(selectedSlip || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-secondary text-sm py-8 justify-center">
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                Loading slip details…
              </div>
            ) : selectedSlip ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">
                      {canConfirm ? 'Confirm Dispatch' : 'Slip Details'} — {selectedSlip.slipNumber ?? `Slip #${selectedSlip.id}`}
                    </h3>
                    <p className="text-sm text-secondary mt-1">
                      Order: {selectedSlip.orderNumber ?? selectedSlip.salesOrderId} | Dealer: {selectedSlip.dealerName ?? '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSlip(null)}
                    className="text-secondary hover:text-primary transition-colors text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>

                {/* Lines */}
                {(selectedSlip.lines?.length ?? 0) > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-highlight text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Batch</th>
                          <th className="px-4 py-3 text-right">Ordered</th>
                          {canConfirm && <th className="px-4 py-3 text-right">Ship Qty</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedSlip.lines!.map((line) => (
                          <tr key={line.id} className="hover:bg-surface-highlight/50 transition-colors">
                            <td className="px-4 py-3 text-primary">
                              {line.productName ?? line.productCode ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-secondary">
                              {line.batchCode ?? line.batchPublicId ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-primary tabular-nums">
                              {line.orderedQuantity ?? line.quantity ?? 0}
                            </td>
                            {canConfirm && (
                              <td className="px-4 py-3 text-right">
                                {line.id != null ? (
                                  <input
                                    type="number"
                                    min={0}
                                    max={line.orderedQuantity ?? line.quantity ?? 999}
                                    value={lineShipQty[line.id] ?? 0}
                                    onChange={(e) =>
                                      setLineShipQty((prev) => ({
                                        ...prev,
                                        [line.id!]: Math.max(0, Number(e.target.value)),
                                      }))
                                    }
                                    className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-primary text-right outline-none focus:border-brand-400 transition-colors tabular-nums"
                                  />
                                ) : (
                                  '—'
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-secondary py-4 text-center">No line items on this slip.</p>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setSelectedSlip(null)}
                    disabled={confirmSubmitting}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                  >
                    {canConfirm ? 'Cancel' : 'Close'}
                  </button>
                  {canConfirm && (
                    <button
                      onClick={handleConfirmDispatch}
                      disabled={confirmSubmitting}
                      className="rounded-lg px-5 py-2 text-sm font-medium transition-all disabled:opacity-50"
                      style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
                    >
                      {confirmSubmitting ? 'Confirming…' : 'Confirm Dispatch'}
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

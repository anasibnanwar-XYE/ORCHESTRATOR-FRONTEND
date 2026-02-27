import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPendingSlips, type PackagingSlipDto } from '../../lib/salesApi';
import DispatchConfirmModal from '../../components/DispatchConfirmModal';
import { Truck, Package, RefreshCw, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { ResponsiveTable } from '../../design-system/ResponsiveTable';
import { formatDate } from '../../lib/formatUtils';

/**
 * DispatchPage - Manufacturing portal dispatch/fulfillment
 *
 * Slip-based flow: lists pending packaging slips and allows factory users
 * to dispatch (issue goods + invoice) without needing Sales role.
 */
export default function DispatchPage() {
  const { session } = useAuth();
  const [slips, setSlips] = useState<PackagingSlipDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dispatchingSlip, setDispatchingSlip] = useState<PackagingSlipDto | null>(null);

  const loadSlips = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingSlips(session);
      setSlips(data || []);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      if (apiErr?.status === 403) {
        setError('Access denied: You need ROLE_FACTORY or ROLE_ADMIN to view pending slips.');
      } else if (apiErr?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load pending slips');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-primary">Dispatch</h1>
          <p className="mt-1 text-sm text-secondary">
            View pending packaging slips and issue goods from inventory.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSlips}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight disabled:opacity-50 min-h-[44px]"
        >
          <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </header>

      {message && (
        <div className="rounded-xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {message}
          <button onClick={() => setMessage(null)} className="float-right ml-2 font-bold hover:opacity-75">×</button>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>{error}</div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-primary">Pending Dispatch</h2>
            <p className="text-xs text-tertiary">
              {slips.length} {slips.length === 1 ? 'slip' : 'slips'} ready or partially processed
            </p>
          </div>
        </div>

        <div className="p-0">
          <ResponsiveTable
            data={slips}
            keyExtractor={(s) => String(s.id)}
            columns={[
              {
                key: 'slip',
                header: 'Slip Number',
                render: (s) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-highlight">
                      <Package className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <div className="font-semibold text-primary">{s.slipNumber || `#${s.id}`}</div>
                      <div className="text-xs text-secondary">Created {formatDate(s.createdAt)}</div>
                    </div>
                  </div>
                )
              },
              {
                key: 'order',
                header: 'Ref Order',
                render: (s) => (
                  <div>
                    <div className="font-medium text-primary">{s.orderNumber || `#${s.salesOrderId}`}</div>
                    <div className="text-xs text-secondary">{s.dealerName || '—'}</div>
                  </div>
                )
              },
              {
                key: 'lines',
                header: 'Items',
                render: (s) => (
                  <span className="text-sm text-primary tabular-nums">
                    {s.lines?.length ?? 0} {(s.lines?.length ?? 0) === 1 ? 'line' : 'lines'}
                  </span>
                )
              },
              {
                key: 'status',
                header: 'Status',
                render: (s) => (
                  <span className={clsx(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    s.status === 'PARTIAL' ? "bg-status-warning-bg text-status-warning-text" :
                      s.status === 'PENDING' ? "bg-status-info-bg text-status-info-text" :
                        "bg-surface-highlight text-secondary"
                  )}>
                    {s.status || 'PENDING'}
                  </span>
                )
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (s) => (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setDispatchingSlip(s)}
                      className="inline-flex items-center gap-2 rounded-lg bg-action-bg px-4 py-2 text-sm font-medium text-action-text shadow-sm hover:opacity-90 min-h-[44px]"
                    >
                      <Truck className="h-4 w-4" />
                      Dispatch
                    </button>
                  </div>
                )
              }
            ]}
            emptyMessage="No pending slips found. Waiting for Sales to confirm orders."
          />
        </div>
      </div>

      <DispatchConfirmModal
        slip={dispatchingSlip}
        open={!!dispatchingSlip}
        onClose={() => setDispatchingSlip(null)}
        onSuccess={() => {
          setDispatchingSlip(null);
          setMessage('Dispatch processed successfully.');
          loadSlips();
        }}
        useFactoryFlow={true}
      />
    </div>
  );
}

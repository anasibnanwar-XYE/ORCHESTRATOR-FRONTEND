import { useEffect, useState } from 'react';
import { RefreshCw, Box, AlertCircle, FlaskConical, Truck, PackageOpen } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { getFactoryDashboard, type FactoryDashboardDto } from '../../lib/factoryApi';
import { Link } from 'react-router-dom';
import { listSalesOrders, type SalesOrderSummary } from '../../lib/salesApi';
import { formatDate, formatMoney } from '../../lib/formatUtils';

export default function FactoryDashboardPage() {
  const { session } = useAuth();
  const [data, setData] = useState<FactoryDashboardDto | null>(null);
  const [pendingOrders, setPendingOrders] = useState<SalesOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    getFactoryDashboard(session)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load factory dashboard.'))
      .finally(() => setLoading(false));

    listSalesOrders({ status: 'PENDING_PRODUCTION' }, session)
      .then(setPendingOrders)
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const kpi = [
    { label: 'Production Efficiency', value: `${(data?.productionEfficiency ?? 0).toFixed(1)}%` },
    { label: 'Batches Logged', value: String(data?.batchesLogged ?? 0) },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-primary truncate">Dashboard</h1>
          <p className="mt-1 text-sm text-secondary truncate">Manufacturing overview and pending orders</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            to="/factory/production?tab=batches"
            className="rounded-lg bg-action-bg px-3 sm:px-4 py-2 text-sm font-medium text-action-text shadow-sm hover:opacity-90 min-h-[44px] inline-flex items-center"
          >
            Log Batch
          </Link>
          <Link
            to="/factory/packing?tab=dispatch"
            className="rounded-lg border border-border bg-surface px-3 sm:px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight min-h-[44px] inline-flex items-center"
          >
            Dispatch
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-transparent bg-status-error-bg p-4 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <div id="production-status" className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {kpi.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-secondary truncate">{item.label}</p>
            <p className="mt-1 sm:mt-2 font-display text-2xl sm:text-3xl font-semibold text-primary tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-primary truncate">Production Queue</h2>
              <p className="text-xs text-secondary">Orders pending production</p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg p-2 text-secondary hover:bg-surface-highlight min-h-[44px] min-w-[44px]"
            >
              <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Box className="h-12 w-12 text-tertiary" />
                <p className="mt-2 text-sm text-secondary">No orders pending production.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-lg border border-border p-3 sm:p-4 transition-colors hover:bg-surface-highlight">
                    <div className="min-w-0 flex-1 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-primary text-sm sm:text-base truncate">{order.orderNumber ?? `#${order.id}`}</span>
                        <span className="rounded-full bg-status-warning-bg px-2 py-0.5 text-xs font-medium text-status-warning-text shrink-0">
                          Pending
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-secondary truncate">{order.dealerName}</div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center justify-between gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className="text-right w-full sm:w-auto">
                        <div className="text-sm font-medium text-primary tabular-nums truncate">{formatMoney(order.totalAmount)}</div>
                        <div className="text-xs text-secondary">{formatDate(order.createdAt)}</div>
                      </div>
                      <Link
                        to="/factory/production?tab=batches"
                        className="rounded-lg bg-action-bg px-3 py-1.5 text-xs font-medium text-action-text hover:opacity-90 min-h-[36px] inline-flex items-center"
                      >
                        Log Batch
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-4 sm:px-6 py-3 sm:py-4">
              <AlertCircle className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-primary truncate">System Alerts</h3>
            </div>
            <ul className="p-4 sm:p-6 space-y-2 sm:space-y-3">
              {(data?.alerts?.length ? data.alerts : ['All systems nominal.']).map((alert, idx) => (
                <li key={`${alert}-${idx}`} className="flex items-start gap-3 text-sm text-secondary">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-status-success-text flex-shrink-0" />
                  <span className="truncate">{alert}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
            <h3 className="text-sm font-medium text-primary truncate">Quick Actions</h3>
            <nav className="mt-3 sm:mt-4 space-y-2">
              <Link
                to="/factory/production?tab=batches"
                className="flex items-center justify-between rounded-lg bg-surface-highlight p-3 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight/80 min-h-[44px]"
              >
                <span className="truncate">Log production batch</span>
                <FlaskConical className="h-4 w-4 text-tertiary flex-shrink-0" />
              </Link>
              <Link
                to="/factory/packing?tab=dispatch"
                className="flex items-center justify-between rounded-lg bg-surface-highlight p-3 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight/80 min-h-[44px]"
              >
                <span className="truncate">Dispatch orders</span>
                <Truck className="h-4 w-4 text-tertiary flex-shrink-0" />
              </Link>
              <Link
                to="/factory/inventory?tab=adjustments"
                className="flex items-center justify-between rounded-lg bg-surface-highlight p-3 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight/80 min-h-[44px]"
              >
                <span className="truncate">Inventory adjustments</span>
                <PackageOpen className="h-4 w-4 text-tertiary flex-shrink-0" />
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

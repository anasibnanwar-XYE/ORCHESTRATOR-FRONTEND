import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { listDealers, type DealerSummary } from '../../lib/accountingApi';
import { listSalesOrders, listCreditRequests, type SalesOrderSummary } from '../../lib/salesApi';
import { formatDate, formatCurrency } from '../../lib/formatUtils';

export default function SalesDashboardPage() {
  const { session } = useAuth();
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [orders, setOrders] = useState<SalesOrderSummary[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);

    try {
      // Load independent data in parallel but handle failures individually so one 500 doesn't break the whole dashboard
      const results = await Promise.allSettled([
        listDealers(session, session.companyCode),
        listSalesOrders({}, session),
        listCreditRequests(session),
      ]);

      // Dealers
      if (results[0].status === 'fulfilled') {
        setDealers(results[0].value);
      } else {
        console.error('Failed to load dealers:', results[0].reason);
      }

      // Orders
      if (results[1].status === 'fulfilled') {
        setOrders(results[1].value);
      } else {
        console.error('Failed to load orders:', results[1].reason);
      }

      // Credit Requests
      if (results[2].status === 'fulfilled') {
        const reqs = results[2].value;
        setCredits(Array.isArray(reqs) ? reqs.length : 0);
      } else {
        console.error('Failed to load credit requests:', results[2].reason);
        // Don't set global error for credit requests failure, just log it
        // This allows the dashboard to show orders/dealers even if credit service is down
      }

      // Only set detailed error if EVERYTHING failed
      if (results.every(r => r.status === 'rejected')) {
        setError('Failed to load dashboard data');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load sales dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.companyCode]);

  const openOrders = useMemo(() => orders.filter((o) => (o.status ?? '').toUpperCase() !== 'CANCELLED'), [orders]);

  const cards = [
    { label: 'Total Dealers', value: dealers.length },
    { label: 'Open Orders', value: openOrders.length },
    { label: 'Pending Credit Requests', value: credits },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary truncate">Sales Overview</h1>
          <p className="mt-1 text-sm text-secondary truncate">Dealer metrics, open orders, and credit approvals</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-secondary shadow-sm transition-colors hover:bg-surface-highlight focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2 disabled:opacity-50"
        >
          <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-transparent bg-status-error-bg p-4 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <div id="sales-targets" className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-secondary truncate">{card.label}</p>
            <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-4 sm:px-6 py-3 sm:py-4">
          <Activity className="h-5 w-5 text-secondary" />
          <h2 className="text-base font-semibold text-primary truncate">Recent Orders</h2>
        </div>
        <div className="p-4 sm:p-6">
          {orders.length === 0 ? (
            <p className="text-center text-sm text-secondary">No orders found.</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-lg border border-border p-3 sm:p-4 transition-colors hover:bg-surface-highlight">
                  <div className="min-w-0 flex-1 w-full">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="font-medium text-primary text-sm sm:text-base truncate">{o.orderNumber ?? `#${o.id}`}</span>
                      <span className={clsx(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                        o.status === 'CONFIRMED' ? "bg-status-success-bg text-status-success-text" :
                          o.status === 'CANCELLED' ? "bg-status-error-bg text-status-error-text" :
                            "bg-surface-highlight text-secondary"
                      )}>
                        {o.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-secondary truncate">
                      {o.dealerName ?? 'Unknown Dealer'} • {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 w-full sm:w-auto">
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(o.totalAmount)}
                    </p>
                    <p className="text-xs text-secondary">Total Value</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


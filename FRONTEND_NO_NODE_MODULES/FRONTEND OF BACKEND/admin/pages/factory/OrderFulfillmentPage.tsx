import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listSalesOrders, updateOrderFulfillment, type SalesOrderSummary, type FulfillmentStatus } from '../../lib/salesApi';
import DispatchConfirmModal from '../../components/DispatchConfirmModal';
import { Package, RefreshCw, Play, CheckCircle, Truck } from 'lucide-react';
import clsx from 'clsx';
import { formatDate, formatMoney } from '../../lib/formatUtils';

export default function OrderFulfillmentPage() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<SalesOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'PENDING_PRODUCTION' | 'PROCESSING' | 'READY_TO_SHIP' | ''>('');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [dispatchingOrder, setDispatchingOrder] = useState<SalesOrderSummary | null>(null);

  const loadOrders = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const allOrders: SalesOrderSummary[] = [];
      
      // Load orders in different statuses
      const statuses: Array<'PENDING_PRODUCTION' | 'PROCESSING' | 'READY_TO_SHIP'> = 
        statusFilter ? [statusFilter] : ['PENDING_PRODUCTION', 'PROCESSING', 'READY_TO_SHIP'];
      
      for (const status of statuses) {
        try {
          const data = await listSalesOrders({ status }, session);
          allOrders.push(...data);
        } catch (err: any) {
          if (err?.status === 403) {
            // Silently skip if no access - might not have ROLE_SALES
            continue;
          }
          throw err;
        }
      }
      
      setOrders(allOrders);
    } catch (err: any) {
      if (err?.status === 403) {
        setError('Access denied: You need ROLE_SALES or ROLE_ADMIN to view sales orders. Factory users should contact an administrator to add the sales role or use factory-specific endpoints.');
      } else if (err?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [session, statusFilter]);

  const updateFulfillment = async (orderId: number, status: FulfillmentStatus, notes?: string) => {
    if (!session) return;
    setUpdatingOrderId(orderId);
    setError(null);
    try {
      await updateOrderFulfillment(orderId, { status, notes }, session);
      setMessage(`Order status updated to ${status.replace(/_/g, ' ').toLowerCase()}`);
      loadOrders();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      if (err?.status === 403) {
        setError('Access denied: You need ROLE_SALES or ROLE_ADMIN to update order status. Factory users should use factory/orchestrator endpoints.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update order status');
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PRODUCTION':
        return 'bg-status-warning-bg text-status-warning-text';
      case 'PROCESSING':
        return 'bg-status-info-bg text-status-info-text';
      case 'READY_TO_SHIP':
        return 'bg-status-success-bg text-status-success-text';
      default:
        return 'bg-surface-highlight text-primary';
    }
  };

  const filteredOrders = orders.filter((order) => !statusFilter || order.status === statusFilter);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Order Queue</h1>
          <p className="mt-1 text-sm text-secondary">
            Manage order production status and fulfillment workflow
          </p>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight disabled:opacity-50"
        >
          <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </header>

      {message && (
        <div className="rounded-xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Orders</h2>
            <p className="text-xs text-tertiary">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_PRODUCTION">Pending Production</option>
            <option value="PROCESSING">Processing</option>
            <option value="READY_TO_SHIP">Ready to Ship</option>
          </select>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-tertiary" />
              <p className="mt-2 text-sm text-secondary">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-tertiary" />
              <p className="mt-2 text-sm font-medium text-secondary">No orders found</p>
              <p className="mt-1 text-xs text-tertiary">
                {statusFilter ? 'Try changing the status filter' : 'Orders will appear here when they are ready for production'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-surface-highlight sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                        <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            {order.orderNumber ?? `Order #${order.id}`}
                          </span>
                          <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', getStatusColor(order.status))}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-secondary">
                          {order.dealerName && <span>Dealer: {order.dealerName}</span>}
                          {order.dealerName && order.createdAt && <span className="mx-2">•</span>}
                          {order.createdAt && (
                            <span>Created: {formatDate(order.createdAt)}</span>
                          )}
                        </div>
                        {order.totalAmount && (
                          <div className="mt-1 text-sm font-medium text-primary">
                            Total: {formatMoney(order.totalAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    {order.status === 'PENDING_PRODUCTION' && (
                      <button
                        type="button"
                        onClick={() => updateFulfillment(order.id, 'PROCESSING')}
                        disabled={updatingOrderId === order.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        <Play className="h-4 w-4" />
                        Start Production
                      </button>
                    )}
                    {order.status === 'PROCESSING' && (
                      <button
                        type="button"
                        onClick={() => updateFulfillment(order.id, 'READY_TO_SHIP')}
                        disabled={updatingOrderId === order.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Ready to Ship
                      </button>
                    )}
                    {order.status === 'READY_TO_SHIP' && (
                      <button
                        type="button"
                        onClick={() => setDispatchingOrder(order)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                      >
                        <Truck className="h-4 w-4" />
                        Dispatch & Invoice
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DispatchConfirmModal
        order={dispatchingOrder}
        open={!!dispatchingOrder}
        onClose={() => setDispatchingOrder(null)}
        onSuccess={() => {
          setDispatchingOrder(null);
          setMessage('Order dispatched and invoiced successfully.');
          loadOrders();
        }}
      />
    </div>
  );
}


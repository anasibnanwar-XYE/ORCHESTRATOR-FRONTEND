import { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { getDealerOrders, type DealerPortalOrder } from '../../lib/dealerApi';
import { StatusBadge } from '../../components/ui/StatusBadge';

type UIStatus = 'confirmed' | 'in_transit' | 'delivered' | 'pending' | 'cancelled';

interface TransformedOrder {
  id: string;
  orderNumber: string;
  status: UIStatus;
  totalAmount: number;
  placedDate: string;
  items: Array<{ description?: string; name?: string; quantity?: number; productCode?: string; sku?: string }>;
}

export default function OrdersPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<DealerPortalOrder[]>([]);

  useEffect(() => {
    async function load() {
      if (!session) return;
      setLoading(true);
      setError(null);
      try {
        const dealerOrders = await getDealerOrders(session);
        setOrders(dealerOrders);
      } catch (err: unknown) {
        const e = err as { status?: number; message?: string };
        if (e?.status === 409 || e?.message?.toLowerCase().includes('no dealer account')) {
          setError(
            'No dealer account is linked to your user. Please contact your administrator to set up your dealer account.'
          );
        } else if (e?.status === 403) {
          setError(
            'You do not have permission to access dealer orders. Please contact your administrator.'
          );
        } else {
          setError(e?.message ?? 'Failed to load orders. Please try refreshing the page.');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  // Map backend status to UI status
  const getUIStatus = (status: string): UIStatus => {
    const upper = status.toUpperCase();
    if (upper === 'CONFIRMED') return 'confirmed';
    if (upper === 'SHIPPED' || upper === 'PROCESSING' || upper === 'READY_TO_SHIP')
      return 'in_transit';
    if (upper === 'DELIVERED') return 'delivered';
    if (upper === 'CANCELLED') return 'cancelled';
    return 'pending';
  };

  const transformedOrders: TransformedOrder[] = orders.map((order) => {
    const uiStatus = getUIStatus(order.status ?? 'PENDING');
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

    return {
      id: String(order.id),
      orderNumber: order.orderNumber ?? `SO-${order.id}`,
      status: uiStatus,
      totalAmount: order.totalAmount ?? 0,
      placedDate: orderDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      items: [],
    };
  });

  const getStatusConfig = (status: UIStatus) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed',
          icon: CheckCircleIcon,
          colorClass: 'bg-status-info-bg text-status-info-text',
          borderClass: 'border-status-info-text/20',
        };
      case 'in_transit':
        return {
          label: 'In Transit',
          icon: TruckIcon,
          colorClass: 'bg-status-info-bg text-status-info-text',
          borderClass: 'border-status-info-text/20',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          icon: CheckCircleIcon,
          colorClass: 'bg-status-success-bg text-status-success-text',
          borderClass: 'border-status-success-text/20',
        };
      case 'pending':
        return {
          label: 'Pending Approval',
          icon: ClockIcon,
          colorClass: 'bg-status-warning-bg text-status-warning-text',
          borderClass: 'border-status-warning-text/20',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: XCircleIcon,
          colorClass: 'bg-status-error-bg text-status-error-text',
          borderClass: 'border-status-error-text/20',
        };
    }
  };

  const finalFilteredOrders = transformedOrders.filter((order) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' &&
        ['confirmed', 'in_transit', 'pending'].includes(order.status)) ||
      (activeTab === 'completed' && ['delivered', 'cancelled'].includes(order.status));

    const matchesSearch = order.orderNumber
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;

    return matchesTab && matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-md bg-status-error-bg p-4 text-sm text-status-error-text">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-primary">My Orders</h1>
        <p className="mt-1 text-sm text-secondary">Track and manage your orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['all', 'active', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 text-sm font-semibold transition',
              activeTab === tab
                ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                : 'text-secondary hover:text-primary'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-10 py-2 text-sm text-primary transition focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-tertiary" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-primary transition focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {finalFilteredOrders.map((order) => {
          const statusConfig = getStatusConfig(order.status);
          return (
            <div
              key={order.id}
              className={clsx(
                'rounded-2xl border border-border bg-surface p-6 shadow-sm',
                statusConfig.borderClass
              )}
            >
              {/* Order Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx('rounded-full p-2', statusConfig.colorClass)}>
                    <ShoppingBagIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Order #{order.orderNumber}</p>
                    <div className="mt-1">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-secondary">Placed: {order.placedDate}</p>
                </div>
              </div>

              {/* Order Items */}
              {order.items.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Items ({order.items.length})
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-primary">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        • {item.description ?? item.name ?? 'Item'} (x{item.quantity})
                        <span className="ml-2 text-xs text-tertiary">
                          SKU: {item.productCode ?? item.sku ?? 'N/A'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === 'in_transit' && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-status-info-bg px-4 py-2 text-sm font-semibold text-status-info-text">
                    <TruckIcon className="h-4 w-4" />
                    In Transit
                  </span>
                )}
                {order.status === 'pending' && (
                  <div className="flex items-center gap-2 text-xs text-status-warning-text">
                    <ClockIcon className="h-4 w-4" />
                    Awaiting credit approval
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Showing count */}
      {!loading && orders.length > 0 && (
        <p className="text-center text-sm text-secondary">
          Showing {finalFilteredOrders.length} of {orders.length} orders
        </p>
      )}

      {/* Empty State */}
      {finalFilteredOrders.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-tertiary" />
          <p className="mt-4 font-semibold text-primary">No orders found</p>
          <p className="mt-1 text-sm text-secondary">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { getDealerOrders } from '../../lib/dealerApi';

export default function OrdersPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<Array<{
    id: number;
    orderNumber?: string;
    status: string;
    totalAmount?: number;
    createdAt?: string;
    dealerId?: number;
    dealerName?: string;
    items?: Array<any>;
    [key: string]: any;
  }>>([]);

  useEffect(() => {
    async function load() {
      if (!session) return;
      setLoading(true);
      setError(null);
      try {
        // Use dealer-portal orders endpoint
        const dealerOrders = await getDealerOrders(session);
        setOrders(dealerOrders);
      } catch (err: unknown) {
        const e = err as { status?: number; message?: string };
        // Handle specific error cases
        if (e?.status === 409 || e?.message?.toLowerCase().includes('no dealer account')) {
          setError('No dealer account is linked to your user. Please contact your administrator to set up your dealer account.');
        } else if (e?.status === 403) {
          setError('You do not have permission to access dealer orders. Please contact your administrator.');
        } else {
          setError(e?.message || 'Failed to load orders. Please try refreshing the page.');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  // Transform backend status to UI status
  const getUIStatus = (status: string): 'confirmed' | 'in_transit' | 'delivered' | 'pending' | 'cancelled' => {
    const upper = status.toUpperCase();
    if (upper === 'CONFIRMED') return 'confirmed';
    if (upper === 'SHIPPED' || upper === 'PROCESSING' || upper === 'READY_TO_SHIP') return 'in_transit';
    if (upper === 'DELIVERED') return 'delivered';
    if (upper === 'CANCELLED') return 'cancelled';
    return 'pending';
  };

  // Transform backend orders to UI format
  const transformedOrders = (Array.isArray(orders) ? orders : []).map((order) => {
    const uiStatus = getUIStatus(order.status || 'PENDING');
    // Align with SalesOrderDto: createdAt is the primary date
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

    // Derived dates handling (backend might not have these specific fields, adapt as needed)
    // If SalesOrderDto doesn't have confirmedAt etc, we might need to rely on history or just map what we have.
    // For now, mapping what we can and using safe fallbacks.
    const confirmedAt = (order as any).confirmedAt; // Fallback if property exists but not in local type
    const shippedAt = (order as any).shippedAt;
    const deliveredDate = (order as any).deliveredDate;

    return {
      id: String(order.id),
      orderNumber: order.orderNumber || `SO-${order.id}`,
      status: uiStatus,
      totalAmount: order.totalAmount || 0,
      placedDate: orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: (order as any).items || [], // SalesOrderDto has items
      progress: {
        placed: { completed: true, date: orderDate.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
        confirmed: { completed: uiStatus !== 'pending', date: confirmedAt ? new Date(confirmedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric' }) : (uiStatus !== 'pending' ? orderDate.toLocaleString('en-IN', { month: 'short', day: 'numeric' }) : undefined) },
        transit: { completed: ['in_transit', 'delivered'].includes(uiStatus), date: shippedAt ? new Date(shippedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric' }) : (['in_transit', 'delivered'].includes(uiStatus) ? orderDate.toLocaleString('en-IN', { month: 'short', day: 'numeric' }) : undefined) },
        delivered: { completed: uiStatus === 'delivered', date: deliveredDate ? new Date(deliveredDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : undefined },
      },
      // Passthrough original fields for deeper components if needed
      original: order,
      deliveredDate: deliveredDate ? new Date(deliveredDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : undefined,
      estimatedDelivery: (order as any).estimatedDelivery ? new Date((order as any).estimatedDelivery).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : undefined
    };
  });


  const getStatusConfig = (status: 'confirmed' | 'in_transit' | 'delivered' | 'pending' | 'cancelled') => {
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
      (activeTab === 'active' && ['confirmed', 'in_transit', 'pending'].includes(order.status)) ||
      (activeTab === 'completed' && ['delivered', 'cancelled'].includes(order.status));

    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
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
        <p className="mt-1 text-sm text-secondary">
          Track and manage your orders
        </p>
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
            className={clsx(
              'w-full rounded-xl border border-border bg-surface px-10 py-2 text-sm text-primary transition focus:outline-none focus:ring-2 focus:ring-brand-400',
              'dark:placeholder:text-tertiary'
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-tertiary" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={clsx(
              'rounded-xl border border-border bg-surface px-3 py-2 text-sm text-primary transition focus:outline-none focus:ring-2 focus:ring-brand-400'
            )}
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
                    <p className="font-semibold text-primary">
                      Order #{order.orderNumber}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', statusConfig.colorClass)}>
                        <statusConfig.icon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-secondary">
                    Placed: {order.placedDate}
                  </p>
                  {order.deliveredDate && (
                    <p className="text-xs text-status-success-text">
                      Delivered: {order.deliveredDate}
                    </p>
                  )}
                  {order.estimatedDelivery && !order.deliveredDate && (
                    <p className="text-xs text-brand-600 dark:text-brand-400">
                      Est. Delivery: {order.estimatedDelivery}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Progress Timeline (for active orders) */}
              {(order.status === 'in_transit' || order.status === 'confirmed') && (
                <div className="mt-6 rounded-xl bg-surface-highlight p-4">
                  <div className="relative flex items-center justify-between">
                    {/* Progress Line */}
                    <div className="absolute left-0 top-3 h-0.5 w-full bg-border" />
                    <div
                      className="absolute left-0 top-3 h-0.5 bg-brand-500 transition-all duration-500"
                      style={{
                        width: `${(Object.values(order.progress).filter((p) => p.completed).length / 4) * 100
                          }%`,
                      }}
                    />

                    {/* Steps */}
                    {[
                      { key: 'placed', label: 'Placed', date: order.progress.placed.date },
                      { key: 'confirmed', label: 'Confirmed', date: order.progress.confirmed.date },
                      { key: 'transit', label: 'In Transit', date: order.progress.transit.date },
                      { key: 'delivered', label: 'Delivered', date: order.progress.delivered.date },
                    ].map((step, index) => {
                      const isCompleted = order.progress[step.key as keyof typeof order.progress].completed;
                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                          <div
                            className={clsx(
                              'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                              isCompleted
                                ? 'border-brand-500 bg-brand-500 text-white'
                                : 'border-border bg-surface text-tertiary'
                            )}
                          >
                            {isCompleted && <CheckCircleIcon className="h-4 w-4" />}
                          </div>
                          <p className={clsx('mt-2 text-xs font-medium', isCompleted ? 'text-primary' : 'text-tertiary')}>
                            {step.label}
                          </p>
                          {step.date && (
                            <p className="mt-0.5 text-[10px] text-tertiary">
                              {step.date}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Items ({order.items.length})
                </p>
                <ul className="mt-2 space-y-1 text-sm text-primary">
                  {order.items.map((item: any, idx: number) => (
                    <li key={idx}>
                      • {item.description ?? item.name ?? 'Item'} (x{item.quantity})
                      <span className="ml-2 text-xs text-tertiary">SKU: {item.productCode ?? item.sku ?? 'N/A'}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === 'in_transit' && (
                  <span
                    className="inline-flex items-center gap-1 rounded-xl bg-status-info-bg px-4 py-2 text-sm font-semibold text-status-info-text"
                  >
                    <TruckIcon className="h-4 w-4" />
                    In Transit
                  </span>
                )}
                <Link
                  to="/dealer/invoices"
                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-highlight dark:bg-surface dark:hover:bg-surface-highlight"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  View Invoices
                </Link>
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

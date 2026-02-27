import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import {
  listSalesOrders,
  createSalesOrder,
  confirmSalesOrder,
  approveSalesOrder,
  updateOrderStatus,
  type SalesOrderSummary,
  type CreateSalesOrderRequest,
  type GstTreatment,
  type OrderApprovalRequest,
} from '../../lib/salesApi';
import PackagingSlipModal from '../../components/PackagingSlipModal';
import DispatchConfirmModal from '../../components/DispatchConfirmModal';
import SearchableCombobox, { type ComboboxOption } from '../../components/SearchableCombobox';
import { HelpCircle, Truck } from 'lucide-react';
import TutorialGuide from '../../components/TutorialGuide';
import { createOrderSteps } from '../../lib/tutorialSteps';
import {
  listProductionBrands,
  listBrandProducts,
  type ProductionBrandDto,
  type ProductionProductCatalogDto,
} from '../../lib/factoryApi';
import { resolveSalesJournalMap, searchDealers, listAccounts, createDealerReceipt, type DealerLookup, type JournalEntrySummary, type AccountSummary } from '../../lib/accountingApi';
import { ApiError } from '../../lib/api';
import { resolvePortalAccess } from '../../types/portal-routing';
import { formatAmount } from '../../lib/formatUtils';

type FilterStatus =
  | ''
  | 'BOOKED'
  | 'CONFIRMED'
  | 'PENDING_PRODUCTION'
  | 'READY_TO_SHIP'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'CANCELLED';
const formatCurrency = formatAmount;
type OrderItemDraft = { brandId?: number; productId?: number; quantity: number; unitPrice: string; gstRate?: string };

export default function OrdersPage() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const portalAccess = useMemo(() => resolvePortalAccess(user), [user]);

  // Role checks
  const isFactory = user?.roles?.includes('ROLE_FACTORY') || user?.roles?.includes('ROLE_ORCHESTRATOR');
  // Admin can also manage orders
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const canManageOrders = isFactory || isAdmin;
  const isSalesOnly = !canManageOrders;

  const [status, setStatus] = useState<FilterStatus>('');
  const [orders, setOrders] = useState<SalesOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [journalByOrder, setJournalByOrder] = useState<Record<number, JournalEntrySummary | null>>({});
  const [configToast, setConfigToast] = useState<string | null>(null);
  const [viewingSlipOrder, setViewingSlipOrder] = useState<SalesOrderSummary | null>(null);
  const [dispatchingOrder, setDispatchingOrder] = useState<SalesOrderSummary | null>(null);
  const [approvingOrder, setApprovingOrder] = useState<number | null>(null);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listSalesOrders({ status }, session);
      setOrders(list);

      // Only fetch journal entries if user has accounting access
      // This prevents 403 errors for sales-only users
      if (portalAccess.accounting) {
        const ids = list.map((o) => o.id);
        if (ids.length > 0) {
          try {
            const map = await resolveSalesJournalMap(ids, session);
            setJournalByOrder(map);
          } catch (journalErr: unknown) {
            // Silently handle 403/401 errors - user just doesn't have accounting access
            const status = journalErr instanceof ApiError ? journalErr.status : undefined;
            if (status === 403 || status === 401) {
              setJournalByOrder({});
            } else {
              setJournalByOrder({});
            }
          }
        } else {
          setJournalByOrder({});
        }
      } else {
        // User doesn't have accounting access, don't try to fetch journal entries
        setJournalByOrder({});
      }
    } catch (err: unknown) {
      // Provide specific error messages for role/permission issues
      const status = err instanceof ApiError ? err.status : undefined;
      if (status === 403) {
        setError('Access denied: You need ROLE_SALES or ROLE_ADMIN to view sales orders. Please contact an administrator to add the required role.');
      } else if (status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.companyCode, status]);

  useEffect(() => {
    if (!configToast) return;
    const id = window.setTimeout(() => setConfigToast(null), 8000);
    return () => window.clearTimeout(id);
  }, [configToast]);

  const refresh = () => load();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Orders</h1>
          <p className="mt-1 text-sm text-secondary">
            Manage and track customer orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FilterStatus)}
            className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING_PRODUCTION">Pending production</option>
            <option value="READY_TO_SHIP">Ready to ship</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={() => { setCreating(true); setError(null); setMessage(null); }}
            className="rounded-md bg-action-bg px-3 py-1.5 text-sm font-medium text-action-text shadow hover:opacity-90"
          >
            Create Order
          </button>
        </div>
      </div>

      {message && <div className="rounded-xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">{message}</div>}
      {error && <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">{error}</div>}
      {configToast && <div className="rounded-xl border border-transparent bg-status-warning-bg px-4 py-3 text-sm text-status-warning-text">{configToast}</div>}

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-secondary">Orders</p>
          {loading && <span className="text-xs text-secondary">Loading…</span>}
        </div>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">No orders.</p>
        ) : (
          <>
            {/* Desktop: Grid View */}
            <div className="hidden lg:block mt-3 divide-y divide-white/5 text-sm">
              <div className={`grid ${canManageOrders ? 'grid-cols-6' : 'grid-cols-5'} gap-2 px-2 py-2 text-xs uppercase tracking-wide text-secondary`}>
                <div>Order</div>
                <div>Dealer</div>
                <div>Status</div>
                <div>Total</div>
                <div>Created</div>
                {canManageOrders && <div>Actions</div>}
              </div>
              {orders.map((order) => {
                const rawStatus = (order.status ?? '').toString().toUpperCase();
                const statusLabel = rawStatus || 'BOOKED';
                const journal = journalByOrder[order.id];
                return (
                  <div key={order.id} className={`grid ${canManageOrders ? 'grid-cols-6' : 'grid-cols-5'} items-center gap-2 px-2 py-2`}>
                    <div className="font-medium text-primary">{order.orderNumber ?? `#${order.id}`}</div>
                    <div className="truncate text-secondary">{order.dealerName ?? '—'}</div>
                    <div>
                      <span className="rounded-full bg-surface-highlight px-3 py-1 text-xs text-secondary">
                        {statusLabel}
                        {rawStatus === 'PENDING_PRODUCTION' && ' · awaiting production'}
                      </span>
                    </div>
                    <div className="text-primary">{order.totalAmount != null ? formatCurrency(order.totalAmount) : '—'}</div>
                    <div className="text-secondary">{order.createdAt ?? '—'}</div>

                    {/* Actions Column */}
                    {canManageOrders && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-status-success-text/50 px-2 py-1 text-xs text-status-success-text hover:bg-status-success-bg"
                          onClick={async () => {
                            if (!session) return;
                            try {
                              await confirmSalesOrder(order.id, session);
                              setMessage('Order confirmed');
                              setError(null);
                              refresh();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to confirm');
                            }
                          }}
                          disabled={statusLabel !== 'BOOKED'}
                          title="Confirm Order"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-status-error-text/50 px-2 py-1 text-xs text-status-error-text hover:bg-status-error-bg"
                          onClick={async () => {
                            if (!session) return;
                            try {
                              await updateOrderStatus(order.id, 'CANCELLED', session);
                              setMessage('Order cancelled');
                              setError(null);
                              refresh();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to cancel');
                            }
                          }}
                          disabled={statusLabel === 'CANCELLED' || statusLabel === 'SHIPPED'}
                          title="Cancel Order"
                        >
                          Cancel
                        </button>

                        {/* Dispatch Button for Factory */}
                        {isFactory && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-status-info-text/50 px-2 py-1 text-xs text-status-info-text hover:bg-status-info-bg disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setDispatchingOrder(order)}
                            disabled={!['CONFIRMED', 'PENDING_PRODUCTION', 'READY_TO_SHIP', 'PROCESSING', 'PARTIAL', 'RESERVED'].includes(statusLabel)}
                            title={['CONFIRMED', 'PENDING_PRODUCTION', 'READY_TO_SHIP', 'PROCESSING', 'PARTIAL', 'RESERVED'].includes(statusLabel) ? "Dispatch Order" : "Order must be Confirmed to Dispatch"}
                          >
                            <Truck className="h-3 w-3" />
                          </button>
                        )}

                        {statusLabel === 'CONFIRMED' && (
                          <button
                            type="button"
                            className="rounded-md border border-status-success-text/50 px-2 py-1 text-xs text-status-success-text hover:bg-status-success-bg"
                            disabled={!session || approvingOrder === order.id}
                            onClick={async () => {
                              if (!session) return;
                              try {
                                setApprovingOrder(order.id);
                                const result = await approveSalesOrder(
                                  order.id,
                                  {
                                    approvedBy: user?.displayName || user?.email || 'System',
                                    totalAmount: order.totalAmount || 0,
                                  },
                                  session
                                );
                                setMessage(`Order #${order.orderNumber || order.id} approved successfully${result.traceId ? ` (Trace: ${result.traceId})` : ''}`);
                                refresh();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Failed to approve order');
                              } finally {
                                setApprovingOrder(null);
                              }
                            }}
                          >
                            {approvingOrder === order.id ? '...' : 'Approve'}
                          </button>
                        )}

                        {journal && portalAccess.accounting && (
                          <button
                            type="button"
                            className="rounded-md border border-border px-2 py-1 text-xs text-secondary hover:bg-surface-highlight"
                            onClick={() => {
                              const ref = journal.referenceNumber || `SALE-${order.id}`;
                              navigate(`/accounting/journal?q=${encodeURIComponent(ref)}`);
                            }}
                          >
                            View journal
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );

              })}
            </div>

            {/* Mobile: Card View */}
            <div className="lg:hidden mt-3 space-y-3">
              {orders.map((order) => {
                const rawStatus = (order.status ?? '').toString().toUpperCase();
                const statusLabel = rawStatus || 'BOOKED';
                const journal = journalByOrder[order.id];
                return (
                  <div key={order.id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                    <div className="mb-3 border-b border-border pb-3">
                      <div className="font-semibold text-primary text-sm mb-1">{order.orderNumber ?? `#${order.id}`}</div>
                      <div className="text-xs text-secondary">{order.dealerName ?? '—'}</div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-secondary">Status</span>
                        <span className="rounded-full bg-surface-highlight px-3 py-1 text-xs text-secondary">
                          {statusLabel}
                          {rawStatus === 'PENDING_PRODUCTION' && ' · awaiting production'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-secondary">Total</span>
                        <span className="text-sm font-medium text-primary">{order.totalAmount != null ? formatCurrency(order.totalAmount) : '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-secondary">Created</span>
                        <span className="text-xs text-secondary">{order.createdAt ?? '—'}</span>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    {canManageOrders && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                        <button
                          type="button"
                          className="flex-1 rounded-md border border-status-success-text/50 px-3 py-2 text-xs text-status-success-text hover:bg-status-success-bg touch-manipulation min-h-[44px]"
                          onClick={async () => {
                            if (!session) return;
                            try {
                              await confirmSalesOrder(order.id, session);
                              setMessage('Order confirmed');
                              setError(null);
                              refresh();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to confirm');
                            }
                          }}
                          disabled={statusLabel !== 'BOOKED'}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="flex-1 rounded-md border border-status-error-text/50 px-3 py-2 text-xs text-status-error-text hover:bg-status-error-bg touch-manipulation min-h-[44px]"
                          onClick={async () => {
                            if (!session) return;
                            try {
                              await updateOrderStatus(order.id, 'CANCELLED', session);
                              setMessage('Order cancelled');
                              setError(null);
                              refresh();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to cancel');
                            }
                          }}
                          disabled={statusLabel === 'CANCELLED' || statusLabel === 'SHIPPED'}
                        >
                          Cancel
                        </button>

                        {/* Dispatch Button for Factory Mobile */}
                        {isFactory && (
                          <button
                            type="button"
                            className="flex-1 rounded-md border border-status-info-text/50 px-3 py-2 text-xs text-status-info-text hover:bg-status-info-bg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                            onClick={() => setDispatchingOrder(order)}
                            disabled={!['CONFIRMED', 'PENDING_PRODUCTION', 'READY_TO_SHIP', 'PROCESSING', 'PARTIAL', 'RESERVED'].includes(statusLabel)}
                          >
                            Dispatch
                          </button>
                        )}

                        {statusLabel === 'CONFIRMED' && (
                          <>
                            <button
                              type="button"
                              className="flex-1 rounded-md border border-status-success-text/50 px-3 py-2 text-xs text-status-success-text hover:bg-status-success-bg touch-manipulation min-h-[44px]"
                              disabled={!session || approvingOrder === order.id}
                              onClick={async () => {
                                if (!session) return;
                                try {
                                  setApprovingOrder(order.id);
                                  await approveSalesOrder(
                                    order.id,
                                    {
                                      approvedBy: user?.displayName || user?.email || 'System',
                                      totalAmount: order.totalAmount || 0,
                                    },
                                    session
                                  );
                                  setMessage(`Order #${order.orderNumber || order.id} approved successfully`);
                                  refresh();
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : 'Failed to approve order');
                                } finally {
                                  setApprovingOrder(null);
                                }
                              }}
                            >
                              {approvingOrder === order.id ? 'Approving...' : 'Approve'}
                            </button>

                          </>
                        )}
                        {journal && portalAccess.accounting && (
                          <button
                            type="button"
                            className="w-full rounded-md border border-border px-3 py-2 text-xs text-secondary hover:bg-surface-highlight touch-manipulation min-h-[44px]"
                            onClick={() => {
                              const ref = journal.referenceNumber || `SALE-${order.id}`;
                              navigate(`/accounting/journal?q=${encodeURIComponent(ref)}`);
                            }}
                          >
                            View journal
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <CreateOrderModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => { setCreating(false); refresh(); setMessage('Order created'); }}
        onError={(msg) => setError(msg)}
      />

      <PackagingSlipModal
        order={viewingSlipOrder}
        open={!!viewingSlipOrder}
        onClose={() => setViewingSlipOrder(null)}
      />

      <DispatchConfirmModal
        order={dispatchingOrder}
        open={!!dispatchingOrder}
        onClose={() => setDispatchingOrder(null)}
        onSuccess={() => {
          setDispatchingOrder(null);
          setMessage('Order dispatched successfully');
          refresh();
        }}
      />

    </div>
  );
}

/**
 * CreateOrderModal - Sales order creation flow
 * 
 * This modal is for BOOKING DEMAND (creating sales orders).
 * Dispatch/fulfillment is handled by the Manufacturing portal.
 * 
 * Sales orders → Book demand
 * Dispatch → Issue goods from inventory (Manufacturing portal)
 */
function CreateOrderModal({ open, onClose, onCreated, onError }: { open: boolean; onClose: () => void; onCreated: () => void; onError?: (message: string) => void }) {
  const { session } = useAuth();
  const [companyCode] = useState(useAuth().session?.companyCode);
  const [selectedDealer, setSelectedDealer] = useState<DealerLookup | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cash' | 'split'>('credit');
  const [cashAccountId, setCashAccountId] = useState<number>(0);
  const [payments, setPayments] = useState<Array<{ cashAccountId: number; amount: number; referenceNumber?: string; memo?: string }>>([
    { cashAccountId: 0, amount: 0 },
  ]);
  const [cashAccounts, setCashAccounts] = useState<AccountSummary[]>([]);
  const [paymentSectionExpanded, setPaymentSectionExpanded] = useState(false);
  const [gstTreatment, setGstTreatment] = useState<GstTreatment>('NONE');
  const [orderGstRate, setOrderGstRate] = useState('');
  const [brands, setBrands] = useState<ProductionBrandDto[]>([]);
  const [products, setProducts] = useState<Record<number, ProductionProductCatalogDto[]>>({});
  const [items, setItems] = useState<OrderItemDraft[]>([{ quantity: 1, unitPrice: '', gstRate: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  useEffect(() => {
    if (!open || !session) return;
    listProductionBrands(session).then(setBrands).catch(() => undefined);
    // Load cash accounts for cash payment option
    listAccounts(session)
      .then(accounts => {
        const cashAccts = accounts.filter(a =>
          a.type === 'Asset' &&
          (a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank'))
        );
        setCashAccounts(cashAccts);
        if (cashAccts.length > 0 && !cashAccountId) {
          setCashAccountId(cashAccts[0].id);
        }
      })
      .catch(() => undefined);
  }, [open, session]);

  useEffect(() => {
    if (open) return;
    setSelectedDealer(null);
    setPaymentMethod('credit');
    setCashAccountId(0);
    setPayments([{ cashAccountId: 0, amount: 0 }]);
    setPaymentSectionExpanded(false);
    setGstTreatment('NONE');
    setOrderGstRate('');
    setItems([{ quantity: 1, unitPrice: '', gstRate: '' }]);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (gstTreatment !== 'PER_ITEM') return;
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (hasValue(item.gstRate)) return item;
        if (!item.brandId || !item.productId) return item;
        const product = resolveProduct(item.brandId, item.productId);
        if (!product || product.gstRate == null) return item;
        changed = true;
        return { ...item, gstRate: String(product.gstRate) };
      });
      return changed ? next : prev;
    });
  }, [gstTreatment, products]);

  const loadDealers = async (query: string): Promise<ComboboxOption[]> => {
    try {
      const results = await searchDealers(query, session, companyCode);
      return results.map((d) => ({
        id: d.id,
        label: d.name,
        subLabel: d.code,
        original: d,
      }));
    } catch {
      return [];
    }
  };

  const loadProducts = async (brandId: number) => {
    if (!session) return;
    if (products[brandId]) return;
    const list = await listBrandProducts(brandId, session);
    setProducts((prev) => ({ ...prev, [brandId]: list }));
  };

  const resolveProduct = (brandId?: number, productId?: number) => {
    if (!brandId || !productId) return undefined;
    return (products[brandId] ?? []).find((p) => p.id === productId);
  };

  const hasValue = (value: unknown) => {
    if (value === null || value === undefined) return false;
    return String(value).trim().length > 0;
  };

  const parseMoney = (value: string | number | undefined) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const parsePercent = (value: string | number | undefined) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        if (parsed < 0) return 0;
        if (parsed > 100) return 100;
        return parsed;
      }
    }
    return 0;
  };

  const resolveMinPrice = (product?: ProductionProductCatalogDto) => {
    if (!product) return 0;
    const base = product.basePrice ?? 0;
    const discountPercent = product.minDiscountPercent ?? 0;
    const explicit = product.minSellingPrice ?? 0;
    const discountFloor = base > 0 && discountPercent > 0 ? base - (base * discountPercent) / 100 : base;
    return Math.max(discountFloor, explicit, 0);
  };

  const orderTotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (!item.brandId || !item.productId || item.quantity <= 0) {
          return sum;
        }
        const price = parseMoney(item.unitPrice);
        return price > 0 ? sum + price * item.quantity : sum;
      }, 0),
    [items]
  );

  const gstSummary = useMemo(() => {
    const subtotal = orderTotal;
    if (subtotal <= 0) {
      return { subtotal: 0, gstTotal: 0, totalWithGst: 0, roundingAdjustment: 0 };
    }

    let gstTotal = 0;
    if (gstTreatment === 'PER_ITEM') {
      gstTotal = items.reduce((sum, item) => {
        if (!item.brandId || !item.productId || item.quantity <= 0) return sum;
        const product = resolveProduct(item.brandId, item.productId);
        const lineBase = parseMoney(item.unitPrice) * item.quantity;
        if (lineBase <= 0) return sum;
        const rate = hasValue(item.gstRate)
          ? parsePercent(item.gstRate)
          : parsePercent(product?.gstRate);
        return sum + (lineBase * rate) / 100;
      }, 0);
    } else if (gstTreatment === 'ORDER_TOTAL') {
      const rate = parsePercent(orderGstRate);
      gstTotal = (subtotal * rate) / 100;
    }

    const rawTotal = subtotal + gstTotal;
    const totalWithGst = Math.round(rawTotal * 100) / 100;
    const roundingAdjustment = totalWithGst - rawTotal;

    return { subtotal, gstTotal, totalWithGst, roundingAdjustment };
  }, [orderTotal, items, gstTreatment, orderGstRate, parsePercent, parseMoney]);

  const paymentTotal = useMemo(() => {
    if (paymentMethod === 'credit' || paymentMethod === 'cash') {
      return paymentMethod === 'cash' ? gstSummary.totalWithGst || orderTotal : 0;
    }
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [paymentMethod, payments, gstSummary.totalWithGst, orderTotal]);

  const canSubmit = useMemo(() => {
    if (!selectedDealer) return false;
    if (items.length === 0) return false;
    const rowsValid = items.every((item) => item.brandId && item.productId && item.quantity > 0 && parseMoney(item.unitPrice) > 0);
    const totalAmount = gstSummary.totalWithGst || orderTotal;
    let paymentValid = false;
    if (paymentMethod === 'credit') {
      paymentValid = true;
    } else if (paymentMethod === 'cash') {
      paymentValid = cashAccountId > 0;
    } else if (paymentMethod === 'split') {
      paymentValid = payments.length > 0 &&
        payments.every(p => p.cashAccountId > 0 && p.amount > 0) &&
        Math.abs(paymentTotal - totalAmount) < 0.01;
    }
    return rowsValid && orderTotal > 0 && paymentValid;
  }, [selectedDealer, items, orderTotal, paymentMethod, cashAccountId, payments, paymentTotal, gstSummary.totalWithGst]);

  const submit = async () => {
    if (!session || !selectedDealer || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    type PreparedRow = {
      product: ProductionProductCatalogDto;
      productCode: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      index: number;
    };

    const prepared = items
      .map((item, index): PreparedRow | null => {
        if (!item.brandId || !item.productId || item.quantity <= 0) {
          return null;
        }
        const product = resolveProduct(item.brandId, item.productId);
        if (!product) return null;
        const productCode = product.skuCode?.trim();
        const productName = product.productName?.trim();
        if (!productCode || !productName) return null;
        const unitPrice = parseMoney(item.unitPrice);
        if (unitPrice <= 0) return null;
        return { product, productCode, productName, quantity: item.quantity, unitPrice, index };
      })
      .filter(
        (entry): entry is PreparedRow =>
          entry !== null
      );

    if (prepared.length === 0) {
      const message = 'Add at least one valid product.';
      setError(message);
      onError?.(message);
      setSubmitting(false);
      return;
    }

    const subtotal = prepared.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);
    const totalWithGst = gstSummary.totalWithGst || subtotal;
    const orderLevelGstRate = gstTreatment === 'ORDER_TOTAL' ? parsePercent(orderGstRate) : undefined;

    // Generate idempotency key to prevent duplicate orders
    const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const payload: CreateSalesOrderRequest = {
      dealerId: selectedDealer.id,
      totalAmount: totalWithGst,
      currency: 'INR',
      gstTreatment,
      gstRate: orderLevelGstRate,
      gstInclusive: false, // GST is added on top, not included in base price
      idempotencyKey,
      items: prepared.map((row) => {
        const rawItemRate = items[row.index]?.gstRate;
        const perItemRate = gstTreatment === 'PER_ITEM' && hasValue(rawItemRate)
          ? parsePercent(rawItemRate)
          : undefined;
        return {
          productCode: row.productCode,
          description: `${row.productName} (${row.productCode})`,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          gstRate: perItemRate,
          // Note: productId and gstAmount are not accepted by backend API
        };
      }),
    };

    try {
      const orderResponse = await createSalesOrder(payload, session);

      // Handle cash payments (single or split-tender)
      if ((paymentMethod === 'cash' || paymentMethod === 'split') && orderResponse?.id) {
        try {
          if (paymentMethod === 'cash' && cashAccountId > 0) {
            // Single cash payment
            await createDealerReceipt({
              dealerId: selectedDealer.id,
              cashAccountId: cashAccountId,
              amount: totalWithGst,
              referenceNumber: `ORDER-${orderResponse.orderNumber || orderResponse.id}`,
              memo: `Cash payment for order ${orderResponse.orderNumber || orderResponse.id}`
            }, session);
          } else if (paymentMethod === 'split') {
            // Split-tender: create multiple receipts, one per payment line
            const orderRef = `ORDER-${orderResponse.orderNumber || orderResponse.id}`;
            for (const payment of payments.filter(p => p.cashAccountId > 0 && p.amount > 0)) {
              await createDealerReceipt({
                dealerId: selectedDealer.id,
                cashAccountId: payment.cashAccountId,
                amount: payment.amount,
                referenceNumber: payment.referenceNumber || `${orderRef}-${payment.cashAccountId}`,
                memo: payment.memo || `Split payment for ${orderRef}`
              }, session);
            }
          }
        } catch (receiptErr: unknown) {
          // Order was created but receipt failed - show warning but don't fail the whole operation
          const receiptMessage = receiptErr instanceof Error ? receiptErr.message : 'Unknown error';
          setError(`Order created successfully, but cash receipt failed: ${receiptMessage}`);
        }
      }

      onCreated();
    } catch (err: unknown) {
      // Parse backend errors with specific handling per status code
      let message = 'Failed to create order';

      if (err instanceof ApiError) {
        // Extract the most specific message from the error body
        const body = err.body as Record<string, unknown> | undefined;
        const topMessage = typeof body?.message === 'string' ? body.message : '';
        const nestedData = body?.data as Record<string, unknown> | undefined;
        const nestedMessage = typeof nestedData?.message === 'string' ? nestedData.message : '';
        const errorCode = typeof nestedData?.code === 'string' ? nestedData.code : '';
        // Use the most specific message available
        const bestMessage = nestedMessage || topMessage || err.message;

        if (err.status === 409) {
          // 409 Conflict — BUS_001 (IllegalStateException) or CONC_001 (idempotency)
          if (errorCode === 'CONC_001') {
            message = 'This order may have already been submitted. Please refresh the page and check your orders.';
          } else {
            // BUS_001 — business rule violation. Parse known scenarios from the message.
            const lower = bestMessage.toLowerCase();
            if (lower.includes('on hold') || lower.includes('suspended') || lower.includes('blocked')) {
              message = 'Cannot create order: This dealer is currently on hold. Please contact an administrator.';
            } else if (lower.includes('credit limit')) {
              if (paymentMethod === 'cash' || paymentMethod === 'split') {
                message = 'Cannot create order: Dealer credit limit exceeded. Even for cash/split payments, the server enforces credit limits during order creation. Workaround: increase the dealer\'s credit limit or clear outstanding balance first.';
              } else {
                message = 'Cannot create order: Dealer credit limit has been exceeded. Request a credit limit increase or switch to cash payment after adjusting the credit limit.';
              }
            } else if (lower.includes('inactive')) {
              message = 'Cannot create order: One or more selected products are inactive. Please remove them and try again.';
            } else if (lower.includes('not configured') || lower.includes('finished good')) {
              message = 'Cannot create order: Product configuration is incomplete. A finished good mapping may be missing. Please contact an administrator.';
            } else if (lower.includes('revenue account')) {
              message = 'Cannot create order: A revenue account has not been configured for one or more products. Please contact an administrator.';
            } else if (lower.includes('gst') || lower.includes('liability account')) {
              message = 'Cannot create order: GST liability account is missing for one or more products. Please contact an administrator.';
            } else if (bestMessage && bestMessage !== 'Operation not allowed in current state' && bestMessage !== 'Invalid state') {
              // Backend returned a specific message — use it
              message = `Cannot create order: ${bestMessage}`;
            } else if (paymentMethod === 'cash' || paymentMethod === 'split') {
              // Generic 409 with cash payment — most likely credit limit issue
              message = 'Cannot create order: The server rejected this order (likely credit limit exceeded). Cash payment does not bypass credit limit checks during order creation. Increase the dealer\'s credit limit or clear their outstanding balance first.';
            } else {
              // Generic 409 — the backend sanitized the real error in production mode
              message = 'Cannot create order: A business rule prevented this operation. Possible causes: dealer on hold, credit limit exceeded, or incomplete product configuration. Please verify and try again.';
            }
          }
        } else if (err.status === 400 || err.status === 422) {
          // Validation errors
          const lower = bestMessage.toLowerCase();
          if (lower.includes('suspended') || lower.includes('blocked')) {
            message = 'Cannot create order: Dealer account is suspended or blocked.';
          } else if (lower.includes('credit limit')) {
            message = 'Cannot create order: Dealer credit limit has been exceeded.';
          } else if (lower.includes('mapping') || lower.includes('required mapping')) {
            message = 'Cannot create order: Required product mappings are missing. Please contact an administrator.';
          } else {
            message = bestMessage || 'Validation failed. Please check your inputs and try again.';
          }
        } else if (err.status === 403) {
          message = 'You do not have permission to create orders. Ensure you are using a user with ROLE_SALES or ROLE_ADMIN.';
        } else {
          message = bestMessage || err.message || 'An unexpected error occurred.';
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Transition show={open} as={Fragment}>
        <Dialog onClose={onClose} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>

          {/* Full-screen container to center the panel */}
          <div className="fixed inset-0 flex items-start justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
            {/* Panel transition wrapper */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 translate-y-3"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-3"
            >
              <Dialog.Panel className="w-full max-w-full sm:max-w-2xl md:max-w-3xl my-auto rounded-xl sm:rounded-2xl border border-border bg-surface p-3 sm:p-4 md:p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-lg max-h-[95vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold">Create Order</Dialog.Title>
                  <button
                    type="button"
                    onClick={() => setTutorialOpen(true)}
                    className="rounded-full p-1 text-tertiary hover:bg-surface-highlight hover:text-secondary"
                    title="How to create an order"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <div id="order-dealer">
                    <SearchableCombobox
                      label="Dealer"
                      placeholder="Search dealer by name or code..."
                      loadOptions={loadDealers}
                      value={selectedDealer ? { id: selectedDealer.id, label: selectedDealer.name, subLabel: selectedDealer.code } : null}
                      onChange={(opt) => setSelectedDealer(opt ? (opt as any).original : null)}
                    />
                  </div>

                  <div className="rounded-lg border border-border bg-surface/50 p-3 sm:p-4" id="order-payment">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-secondary">Payment Method</p>
                      <button
                        type="button"
                        onClick={() => setPaymentSectionExpanded(!paymentSectionExpanded)}
                        className="md:hidden text-xs text-secondary hover:text-primary"
                      >
                        {paymentSectionExpanded ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    <div className={clsx('space-y-3', !paymentSectionExpanded && 'hidden md:block')}>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="credit"
                            checked={paymentMethod === 'credit'}
                            onChange={(e) => setPaymentMethod(e.target.value as 'credit' | 'cash' | 'split')}
                            className="h-4 w-4 accent-action-bg focus:ring-primary"
                          />
                          <span className="text-sm text-primary">Credit</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={paymentMethod === 'cash'}
                            onChange={(e) => setPaymentMethod(e.target.value as 'credit' | 'cash' | 'split')}
                            className="h-4 w-4 accent-action-bg focus:ring-primary"
                          />
                          <span className="text-sm text-primary">Cash</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="split"
                            checked={paymentMethod === 'split'}
                            onChange={(e) => setPaymentMethod(e.target.value as 'credit' | 'cash' | 'split')}
                            className="h-4 w-4 accent-action-bg focus:ring-primary"
                          />
                          <span className="text-sm text-primary">Split Tender</span>
                        </label>
                      </div>

                      {paymentMethod === 'cash' && (
                        <div>
                          <label className="block text-xs uppercase tracking-[0.3em] text-secondary mb-1">
                            Cash Account *
                          </label>
                          <select
                            value={cashAccountId || ''}
                            onChange={(e) => setCashAccountId(Number(e.target.value))}
                            className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select cash account...</option>
                            {cashAccounts.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.code} - {account.name}
                              </option>
                            ))}
                          </select>
                          {!cashAccountId && (
                            <p className="mt-1 text-xs text-status-error-text">Please select a cash account</p>
                          )}
                        </div>
                      )}

                      {paymentMethod === 'split' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs uppercase tracking-[0.3em] text-secondary">
                              Payment Lines *
                            </label>
                            <button
                              type="button"
                              onClick={() => setPayments([...payments, { cashAccountId: 0, amount: 0 }])}
                              className="text-xs text-primary hover:opacity-80"
                            >
                              + Add Payment
                            </button>
                          </div>
                          {payments.map((payment, index) => (
                            <div key={index} className="rounded-lg border border-border bg-surface p-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] uppercase tracking-wider text-secondary">
                                    Account *
                                  </label>
                                  <select
                                    value={payment.cashAccountId || ''}
                                    onChange={(e) => {
                                      const newPayments = [...payments];
                                      newPayments[index].cashAccountId = Number(e.target.value);
                                      setPayments(newPayments);
                                    }}
                                    className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    <option value="">Select...</option>
                                    {cashAccounts.map(account => (
                                      <option key={account.id} value={account.id}>
                                        {account.code} - {account.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-wider text-secondary">
                                    Amount *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={payment.amount || ''}
                                    onChange={(e) => {
                                      const newPayments = [...payments];
                                      newPayments[index].amount = Number(e.target.value) || 0;
                                      setPayments(newPayments);
                                    }}
                                    className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  placeholder="Reference"
                                  value={payment.referenceNumber || ''}
                                  onChange={(e) => {
                                    const newPayments = [...payments];
                                    newPayments[index].referenceNumber = e.target.value;
                                    setPayments(newPayments);
                                  }}
                                  className="rounded border border-border px-2 py-1 text-xs bg-surface text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <div className="flex gap-1">
                                  <input
                                    placeholder="Memo"
                                    value={payment.memo || ''}
                                    onChange={(e) => {
                                      const newPayments = [...payments];
                                      newPayments[index].memo = e.target.value;
                                      setPayments(newPayments);
                                    }}
                                    className="flex-1 rounded border border-border px-2 py-1 text-xs bg-surface text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                  {payments.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                                      className="flex items-center justify-center rounded-md p-1.5 text-status-error-text hover:bg-status-error-bg min-h-[36px] min-w-[36px]"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="text-xs font-medium text-primary pt-2 border-t border-border">
                            <div className="flex justify-between">
                              <span>Payment Total:</span>
                              <span className={Math.abs(paymentTotal - (gstSummary.totalWithGst || orderTotal)) > 0.01 ? 'text-status-error-text' : 'text-status-success-text'}>
                                ₹{paymentTotal.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-secondary">
                              <span>Order Total:</span>
                              <span>₹{(gstSummary.totalWithGst || orderTotal).toFixed(2)}</span>
                            </div>
                            {Math.abs(paymentTotal - (gstSummary.totalWithGst || orderTotal)) > 0.01 && (
                               <div className="text-status-error-text text-[10px] mt-1">
                                Payment total must equal order total
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3" id="order-gst">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-secondary">GST Treatment</p>
                      <select
                        value={gstTreatment}
                        onChange={(e) => setGstTreatment(e.target.value as GstTreatment)}
                        className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="NONE">None</option>
                        <option value="PER_ITEM">Per item</option>
                        <option value="ORDER_TOTAL">Order total</option>
                      </select>
                    </div>
                    {gstTreatment === 'ORDER_TOTAL' && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-secondary">Order GST Rate (%)</p>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={orderGstRate}
                          onChange={(e) => setOrderGstRate(e.target.value)}
                          placeholder="e.g. 18"
                          className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}
                    <div className="text-xs text-secondary self-end">
                      <p>Subtotal: ₹ {formatCurrency(gstSummary.subtotal)}</p>
                      <p>GST: ₹ {formatCurrency(gstSummary.gstTotal)}</p>
                      <p className="font-medium text-primary">
                        Total: ₹ {formatCurrency(gstSummary.totalWithGst || gstSummary.subtotal)}
                      </p>
                    </div>
                  </div>

                  <div id="order-items">
                    <p className="text-xs uppercase tracking-[0.3em] text-secondary">Items</p>
                    <div className="mt-2 space-y-3">
                      {items.map((item, idx) => {
                        const product = resolveProduct(item.brandId, item.productId);
                        const minPrice = resolveMinPrice(product);
                        const lineTotal = product ? parseMoney(item.unitPrice) * Math.max(0, item.quantity) : 0;

                        const brandOptions: ComboboxOption[] = brands
                          .filter((b) => typeof b.id === 'number' && !!b.name)
                          .map((b) => ({ id: b.id as number, label: b.name as string }));
                        const currentProducts = item.brandId ? products[item.brandId] ?? [] : [];
                        const productOptions: ComboboxOption[] = currentProducts
                          .filter((p) => typeof p.id === 'number' && !!p.productName)
                          .map((p) => ({
                            id: p.id as number,
                            label: p.productName as string,
                            subLabel: p.skuCode ?? '',
                          }));

                        return (
                          <div key={`order-item-${idx}`} className="space-y-2 rounded-xl border border-border p-3">
                            {/* Mobile: stacked layout / Desktop: grid */}
                            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-12 sm:items-start sm:gap-2">
                              <div className="sm:col-span-3">
                                <label className="mb-1 block text-[10px] uppercase tracking-wider text-secondary sm:hidden">Brand</label>
                                <SearchableCombobox
                                  placeholder="Brand"
                                  options={brandOptions}
                                  value={item.brandId ? brandOptions.find(b => b.id === item.brandId) ?? null : null}
                                  onChange={async (opt) => {
                                    const brandId = Number(opt?.id) || undefined;
                                    setItems((prev) => prev.map((p, i) => (i === idx ? { brandId, productId: undefined, quantity: p.quantity, unitPrice: '' } : p)));
                                    if (brandId) await loadProducts(brandId);
                                  }}
                                  className="w-full"
                                />
                              </div>
                              <div className="sm:col-span-5">
                                <label className="mb-1 block text-[10px] uppercase tracking-wider text-secondary sm:hidden">Product</label>
                                <SearchableCombobox
                                  placeholder="Product"
                                  options={productOptions}
                                  value={item.productId ? productOptions.find(p => p.id === item.productId) ?? null : null}
                                  onChange={(opt) => {
                                    const productId = Number(opt?.id) || undefined;
                                    setItems((prev) => prev.map((p, i) => {
                                      if (i !== idx) return p;
                                      if (!productId || !p.brandId) {
                                        return { ...p, productId: undefined, unitPrice: '' };
                                      }
                                      const selected = resolveProduct(p.brandId, productId);
                                      const nextGstRate = gstTreatment === 'PER_ITEM' && !hasValue(p.gstRate) && selected?.gstRate != null
                                        ? String(selected.gstRate)
                                        : p.gstRate;
                                      return {
                                        ...p,
                                        productId,
                                        unitPrice: selected && selected.basePrice ? String(selected.basePrice) : p.unitPrice,
                                        gstRate: nextGstRate,
                                      };
                                    }));
                                  }}
                                  className="w-full"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2 sm:contents">
                                <div className="sm:col-span-1">
                                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-secondary sm:hidden">Qty</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: Math.max(1, Number(e.target.value) || 1) } : p)))}
                                    className="h-[38px] w-full rounded-md border border-border bg-surface px-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Qty"
                                  />
                                </div>
                                <div className="sm:col-span-1">
                                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-secondary sm:hidden">Price</label>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, unitPrice: e.target.value } : p)))}
                                    className="h-[38px] w-full rounded-md border border-border bg-surface px-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Unit price"
                                  />
                                </div>
                                <div className="sm:col-span-1">
                                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-secondary sm:hidden">GST %</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    value={item.gstRate ?? ''}
                                    onChange={(e) =>
                                      setItems((prev) =>
                                        prev.map((p, i) => (i === idx ? { ...p, gstRate: e.target.value } : p))
                                      )
                                    }
                                    disabled={gstTreatment !== 'PER_ITEM'}
                                    className={clsx(
                                      'h-[38px] w-full rounded-md border border-border bg-surface px-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary',
                                      gstTreatment !== 'PER_ITEM' && 'opacity-60 cursor-not-allowed'
                                    )}
                                    placeholder="GST %"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-secondary">
                              <div className="flex-1 min-w-0">
                                {product ? (
                                  <span>Min: ₹ {formatCurrency(minPrice)} · Total: ₹ {formatCurrency(lineTotal)}</span>
                                ) : (
                                  <span>Select a product to see pricing guidance.</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                                className="inline-flex items-center gap-1 rounded-md border border-status-error-text/20 bg-status-error-bg px-2.5 py-1.5 text-xs font-medium text-status-error-text hover:bg-status-error-bg/80 transition-colors touch-manipulation min-h-[36px] sm:min-h-0"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setItems((prev) => [...prev, { quantity: 1, unitPrice: '', gstRate: '' }])}
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-secondary hover:bg-surface-highlight"
                      >
                        Add item
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-secondary">Order total</p>
                        <p className="text-lg font-semibold text-primary">₹ {formatCurrency(gstSummary.totalWithGst || gstSummary.subtotal)}</p>
                      </div>
                      <div className="text-xs text-secondary">
                        {items.filter((item) => item.brandId && item.productId).length} line(s)
                      </div>
                    </div>
                  </div>

                  {error && <div className="rounded-xl border border-transparent bg-status-error-bg px-3 py-2 text-xs text-status-error-text">{error}</div>}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-secondary hover:bg-surface-highlight"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="order-submit"
                      disabled={!canSubmit || submitting}
                      onClick={submit}
                      className="rounded-md bg-action-bg px-4 py-2 text-sm font-medium text-action-text shadow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Creating…' : 'Create Order'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      <TutorialGuide
        steps={createOrderSteps}
        enabled={tutorialOpen}
        onExit={() => setTutorialOpen(false)}
      />
    </>
  );
}

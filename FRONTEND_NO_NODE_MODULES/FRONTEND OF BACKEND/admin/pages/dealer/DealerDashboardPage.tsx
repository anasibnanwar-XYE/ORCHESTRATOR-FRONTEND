import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  LogOut,
  Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDealerDashboard, getDealerOrders } from '../../lib/dealerApi';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { formatMoney } from '../../lib/formatUtils';

export default function DealerDashboardPage() {
  const { session, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    currentBalance?: number;
    creditLimit?: number;
    availableCredit?: number;
    totalOutstanding?: number;
    pendingInvoices?: number;
  } | null>(null);

  const [recentOrders, setRecentOrders] = useState<Array<{
    id: number;
    orderNumber?: string;
    status: string;
    totalAmount?: number;
    createdAt?: string;
    dealerId?: number;
    dealerName?: string;
  }>>([]);

  useEffect(() => {
    async function load() {
      if (!session || !user) return;
      setLoading(true);
      setError(null);
      try {
        const [orders, dashboard] = await Promise.all([
          getDealerOrders(session),
          getDealerDashboard(session),
        ]);

        // Safeguard: ensure orders is an array before calling slice
        const ordersArray = Array.isArray(orders) ? orders : [];
        setRecentOrders(ordersArray.slice(0, 5).map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          dealerId: o.dealerId,
          dealerName: o.dealerName,
          status: o.status || 'BOOKED',
          totalAmount: o.totalAmount || 0,
          createdAt: o.createdAt || o.date || o.orderDate || undefined,
        })));

        setSummary({
          currentBalance: dashboard.currentBalance,
          creditLimit: dashboard.creditLimit,
          availableCredit: dashboard.availableCredit,
          totalOutstanding: dashboard.netOutstanding ?? dashboard.totalOutstanding,
          pendingInvoices: dashboard.pendingInvoices,
        });

      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        // Handle specific error cases
        if (err?.status === 409 || err?.message?.toLowerCase().includes('no dealer account')) {
          setError(`You are viewing the Dealer Portal but no dealer account is linked to your user (${user?.email}).

If you are an admin user, you may be on the wrong portal. Try these options:
• Click the menu icon (☰) and sign out, then log in again
• Click the sign-out button in the top-right corner

If you are a dealer user, please contact your administrator to link your dealer account.`);
        } else if (err?.status === 403) {
          setError('You do not have permission to access the dealer portal. Please contact your administrator.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data. Please try refreshing the page.');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session, user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold text-primary">
          {getGreeting()}, {user?.displayName || 'Partner'}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Welcome to your partner portal.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-status-error-text/20 bg-status-error-bg p-4">
          <p className="text-sm text-status-error-text whitespace-pre-line">{error}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/portals')}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 touch-manipulation cursor-pointer active:bg-zinc-100"
            >
              <Home className="h-4 w-4" />
              Portal Selection
            </button>
            <button
              type="button"
              onClick={() => { signOut(); }}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 touch-manipulation cursor-pointer active:bg-zinc-100"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-secondary">Current balance</div>
              <div className="mt-1 text-xl font-semibold text-primary">{formatMoney(summary.currentBalance)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-secondary">Credit limit</div>
              <div className="mt-1 text-xl font-semibold text-primary">{formatMoney(summary.creditLimit)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-secondary">Available credit</div>
              <div className="mt-1 text-xl font-semibold text-primary">{formatMoney(summary.availableCredit)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-secondary">Pending invoices</div>
              <div className="mt-1 text-xl font-semibold text-primary">{summary.pendingInvoices ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
            Recent Orders
          </h2>
          <Link to="/dealer/orders" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {recentOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingBag className="mx-auto h-8 w-8 text-tertiary" />
                <p className="mt-2 text-sm text-secondary">No recent orders found.</p>
              </CardContent>
            </Card>
          ) : (
            recentOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-surface-highlight p-3">
                        <ShoppingBag className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{order.orderNumber || `Order #${order.id}`}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-secondary">
                          <Badge variant={order.status === 'CONFIRMED' ? 'success' : order.status === 'CANCELLED' ? 'error' : 'secondary'}>
                            {order.status}
                          </Badge>
                          <span>•</span>
                          <span>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Date unavailable'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {order.totalAmount ? formatMoney(order.totalAmount) : '—'}
                      </p>
                      <Link
                        to="/dealer/orders"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        View Details <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

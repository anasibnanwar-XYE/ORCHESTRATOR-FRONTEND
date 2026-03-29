 /**
  * SalesDashboardPage
  *
  * Sales portal dashboard with key metric stat cards:
  *  - Total Orders (clickable → /sales/orders)
  *  - Revenue (confirmed/dispatched/invoiced/settled orders)
  *  - Outstanding Receivables (invoiced but not settled)
  *  - Active Orders (in-progress operational states)
  *  - Pending Dispatches (confirmed, processing orders)
  *
  * Also shows recent orders widget with clickable rows.
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   ShoppingCart,
   TrendingUp,
   AlertCircle,
   RefreshCcw,
   ArrowRight,
   Truck,
   IndianRupee,
   Clock,
   Activity,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { salesApi } from '@/lib/salesApi';
 import type { SalesDashboardMetrics, SalesOrderDto } from '@/types';
 import { format } from 'date-fns';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtCurrency(value: number): string {
   if (value >= 10_000_000) {
     return `₹${(value / 10_000_000).toFixed(2)}Cr`;
   }
   if (value >= 100_000) {
     return `₹${(value / 100_000).toFixed(2)}L`;
   }
   return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
 }
 
 function fmtDate(iso: string): string {
   try {
     return format(new Date(iso), 'dd MMM');
   } catch {
     return iso;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Status badge colours
 // ─────────────────────────────────────────────────────────────────────────────
 
 function statusBadgeClass(status: string): string {
   switch (status.toUpperCase()) {
     case 'CONFIRMED':
     case 'RESERVED':
       return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
     case 'CANCELLED':
       return 'bg-[var(--color-error-bg)] text-[var(--color-error)]';
     case 'DISPATCHED':
     case 'INVOICED':
       return 'bg-[var(--color-info-bg,var(--color-surface-tertiary))] text-[var(--color-info,var(--color-text-secondary))]';
     case 'SETTLED':
     case 'CLOSED':
       return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]';
     case 'DRAFT':
       return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
     default:
       return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
   }
 }
 
 function statusLabel(status: string): string {
   const map: Record<string, string> = {
     DRAFT: 'Draft',
     RESERVED: 'Reserved',
     PENDING_PRODUCTION: 'Pending Production',
     PENDING_INVENTORY: 'Pending Inventory',
     READY_TO_SHIP: 'Ready to Ship',
     PROCESSING: 'Processing',
     CONFIRMED: 'Confirmed',
     DISPATCHED: 'Dispatched',
     INVOICED: 'Invoiced',
     SETTLED: 'Settled',
     CLOSED: 'Closed',
     CANCELLED: 'Cancelled',
   };
   return map[status.toUpperCase()] ?? status;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // KPI Card
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface KpiCardProps {
   label: string;
   value: string | number;
   description?: string;
   onClick: () => void;
   isLoading?: boolean;
   icon: React.ReactNode;
 }
 
 function KpiCard({ label, value, description, onClick, isLoading, icon }: KpiCardProps) {
   if (isLoading) {
     return (
       <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
         <Skeleton width="50%" className="mb-2" />
         <Skeleton height={28} width="60%" />
         {description && <Skeleton width="40%" className="mt-1.5" />}
       </div>
     );
   }
 
   return (
     <button
       type="button"
       onClick={onClick}
       className={clsx(
         'group text-left p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
         'transition-all duration-200 hover:border-[var(--color-border-strong)]',
         'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none',
         'focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)] focus-visible:ring-offset-1',
         'w-full',
       )}
     >
       <div className="flex items-start justify-between gap-3">
         <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
           {label}
         </p>
         <div className="shrink-0 text-[var(--color-text-tertiary)] opacity-60 group-hover:opacity-100 transition-opacity">
           {icon}
         </div>
       </div>
       <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-2 tabular-nums tracking-tight">
         {value}
       </p>
       {description && (
         <div className="mt-1.5 flex items-center justify-between gap-2">
           <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{description}</p>
           <ArrowRight
             size={12}
             className="shrink-0 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
           />
         </div>
       )}
     </button>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function SalesDashboardPage() {
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [metrics, setMetrics] = useState<SalesDashboardMetrics | null>(null);
   const [recentOrders, setRecentOrders] = useState<SalesOrderDto[]>([]);
 
   const loadDashboard = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [metricsData, ordersData] = await Promise.all([
         salesApi.getDashboardMetrics(),
         salesApi.searchOrders({ page: 0, size: 5 }),
       ]);
       setMetrics(metricsData);
       setRecentOrders(ordersData.content ?? []);
     } catch {
       setError("Couldn't load sales data. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadDashboard();
   }, [loadDashboard]);
 
   const greeting = (() => {
     const h = new Date().getHours();
     if (h < 12) return 'Good morning';
     if (h < 17) return 'Good afternoon';
     return 'Good evening';
   })();
 
   return (
     <div className="space-y-6">
       {/* ── Page Header ─────────────────────────────────────────────── */}
       <div>
         <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
           {new Date().toLocaleDateString('en-IN', {
             weekday: 'long',
             day: 'numeric',
             month: 'long',
             year: 'numeric',
           })}
         </p>
         <h1 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">{greeting}</h1>
         <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
           Sales portal — revenue overview
         </p>
       </div>
 
       {/* ── Error State ─────────────────────────────────────────────── */}
       {error && (
         <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={15} className="shrink-0" />
           <span className="flex-1">{error}</span>
           <button
             type="button"
             onClick={loadDashboard}
             className="flex items-center gap-1.5 text-[12px] font-medium underline underline-offset-2 hover:no-underline"
           >
             <RefreshCcw size={12} />
             Retry
           </button>
         </div>
       )}
 
       {/* ── KPI Stat Cards ──────────────────────────────────────────── */}
       <section>
         <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
           <KpiCard
             label="Total Orders"
             value={isLoading ? '—' : metrics?.totalOrders ?? 0}
             description="All orders this period"
             onClick={() => navigate('/sales/orders')}
             isLoading={isLoading}
             icon={<ShoppingCart size={15} />}
           />
           <KpiCard
             label="Revenue"
             value={isLoading ? '—' : fmtCurrency(metrics?.revenue ?? 0)}
             description="Confirmed & dispatched"
             onClick={() => navigate('/sales/orders')}
             isLoading={isLoading}
             icon={<IndianRupee size={15} />}
           />
           <KpiCard
             label="Outstanding Receivables"
             value={isLoading ? '—' : fmtCurrency(metrics?.outstandingReceivables ?? 0)}
             description="Invoiced, not settled"
             onClick={() => navigate('/sales/orders')}
             isLoading={isLoading}
             icon={<TrendingUp size={15} />}
           />
           <KpiCard
             label="Active Orders"
             value={isLoading ? '—' : metrics?.activeOrders ?? 0}
             description="In progress"
             onClick={() => navigate('/sales/orders')}
             isLoading={isLoading}
             icon={<Activity size={15} />}
           />
           <KpiCard
             label="Pending Dispatches"
             value={isLoading ? '—' : metrics?.pendingDispatches ?? 0}
             description="Awaiting dispatch"
             onClick={() => navigate('/sales/orders')}
             isLoading={isLoading}
             icon={<Truck size={15} />}
           />
         </div>
       </section>
 
       {/* ── Recent Orders ────────────────────────────────────────────── */}
       <section>
         <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
           <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
             <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
               Recent Orders
             </p>
             <button
               type="button"
               onClick={() => navigate('/sales/orders')}
               className="text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
             >
               View all
               <ArrowRight size={12} />
             </button>
           </div>
 
           {isLoading ? (
             <div className="p-4 space-y-3">
               {[1, 2, 3, 4, 5].map((i) => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="space-y-1">
                     <Skeleton width={120} />
                     <Skeleton width={80} />
                   </div>
                   <Skeleton width={80} />
                 </div>
               ))}
             </div>
           ) : recentOrders.length === 0 ? (
             <div className="px-4 py-10 text-center">
               <ShoppingCart size={24} className="mx-auto text-[var(--color-text-tertiary)] opacity-40 mb-2" />
               <p className="text-[13px] text-[var(--color-text-tertiary)]">No orders yet</p>
               <button
                 type="button"
                 onClick={() => navigate('/sales/orders')}
                 className="mt-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2"
               >
                 Create your first order
               </button>
             </div>
           ) : (
             <div className="divide-y divide-[var(--color-border-subtle)]">
               {recentOrders.map((order) => (
                 <button
                   key={order.id}
                   type="button"
                   onClick={() => navigate(`/sales/orders/${order.id}`)}
                   className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-secondary)] transition-colors text-left"
                 >
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {order.orderNumber}
                       </span>
                       <span className={clsx(
                         'text-[10px] font-medium px-1.5 py-px rounded-full shrink-0',
                         statusBadgeClass(order.status),
                       )}>
                         {statusLabel(order.status)}
                       </span>
                     </div>
                     <p className="text-[11px] text-[var(--color-text-tertiary)] mt-px">
                       {order.dealerName ?? 'Unknown Dealer'} · {fmtDate(order.createdAt)}
                     </p>
                   </div>
                   <div className="text-right shrink-0">
                     <p className="text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                       {fmtCurrency(order.totalAmount)}
                     </p>
                   </div>
                 </button>
               ))}
             </div>
           )}
         </div>
       </section>
 
       {/* ── Quick Actions ─────────────────────────────────────────── */}
       {!isLoading && !error && (
         <section>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
             Quick Actions
           </p>
           <div className="flex flex-wrap gap-2">
             <button
               type="button"
               onClick={() => navigate('/sales/orders')}
               className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
             >
               <ShoppingCart size={13} />
               View Orders
             </button>
             <button
               type="button"
               onClick={() => navigate('/sales/dealers')}
               className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
             >
               <Clock size={13} />
               Manage Dealers
             </button>
           </div>
         </section>
       )}
     </div>
   );
 }

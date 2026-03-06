 /**
  * DealerDashboardPage
  *
  * Dealer self-service dashboard — shows the dealer's own account metrics:
  *  - Total Orders (→ /dealer/orders)
  *  - Outstanding Balance (→ /dealer/ledger)
  *  - Last Payment Date (→ /dealer/ledger)
  *  - Available Credit (→ /dealer/credit-requests)
  *  - Pending Requests (→ /dealer/credit-requests)
  *
  * All data is scoped to the authenticated dealer — no dealer ID needed.
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   ShoppingBag,
   CreditCard,
   Calendar,
   Wallet,
   Clock,
   RefreshCcw,
   AlertCircle,
   ArrowRight,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { dealerApi } from '@/lib/dealerApi';
 import type { DealerPortalDashboard } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtCurrency(value: number | undefined): string {
   if (value === undefined || value === null) return '—';
   if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)}Cr`;
   if (value >= 100_000) return `₹${(value / 100_000).toFixed(2)}L`;
   return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
 }
 
 function fmtDate(iso: string | undefined): string {
   if (!iso) return '—';
   try {
     return format(new Date(iso), 'd MMM yyyy');
   } catch {
     return iso;
   }
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
 
 export function DealerDashboardPage() {
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [dashboard, setDashboard] = useState<DealerPortalDashboard | null>(null);
 
   const loadDashboard = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await dealerApi.getDashboard();
       setDashboard(data);
     } catch {
       setError("Couldn't load your account data. Please try again.");
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
           Overview
         </p>
         <h1 className="mt-1 text-[22px] font-semibold text-[var(--color-text-primary)] tracking-tight">
           {greeting}
         </h1>
       </div>
 
       {/* ── Error State ─────────────────────────────────────────────── */}
       {error && !isLoading && (
         <div className="flex items-start gap-3 p-4 bg-[var(--color-error-bg)] border border-[var(--color-error)] border-opacity-20 rounded-xl">
           <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-error)]" />
           <div className="flex-1 min-w-0">
             <p className="text-[13px] text-[var(--color-error)]">{error}</p>
             <button
               type="button"
               onClick={loadDashboard}
               className="mt-1.5 text-[12px] font-medium text-[var(--color-error)] underline underline-offset-2"
             >
               Retry
             </button>
           </div>
         </div>
       )}
 
       {/* ── KPI Cards ───────────────────────────────────────────────── */}
       {!error && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
           <KpiCard
             label="Total Orders"
             value={isLoading ? '—' : (dashboard?.totalOrders ?? 0)}
             description="All time orders"
             onClick={() => navigate('/dealer/orders')}
             isLoading={isLoading}
             icon={<ShoppingBag size={16} />}
           />
           <KpiCard
             label="Outstanding Balance"
             value={isLoading ? '—' : fmtCurrency(dashboard?.outstandingBalance)}
             description="Amount due"
             onClick={() => navigate('/dealer/ledger')}
             isLoading={isLoading}
             icon={<Wallet size={16} />}
           />
           <KpiCard
             label="Last Payment"
             value={isLoading ? '—' : fmtDate(dashboard?.lastPaymentDate)}
             description="Most recent payment received"
             onClick={() => navigate('/dealer/ledger')}
             isLoading={isLoading}
             icon={<Calendar size={16} />}
           />
           <KpiCard
             label="Available Credit"
             value={isLoading ? '—' : fmtCurrency(dashboard?.availableCredit)}
             description="Credit limit remaining"
             onClick={() => navigate('/dealer/credit-requests')}
             isLoading={isLoading}
             icon={<CreditCard size={16} />}
           />
           <KpiCard
             label="Pending Requests"
             value={isLoading ? '—' : (dashboard?.pendingRequests ?? 0)}
             description="Awaiting review"
             onClick={() => navigate('/dealer/credit-requests')}
             isLoading={isLoading}
             icon={<Clock size={16} />}
           />
         </div>
       )}
 
       {/* ── Credit Summary ───────────────────────────────────────────── */}
       {!isLoading && !error && dashboard?.creditLimit !== undefined && (
         <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
             Credit Utilization
           </p>
           <div className="flex items-center justify-between mb-2">
             <span className="text-[12px] text-[var(--color-text-secondary)]">
               {fmtCurrency(dashboard.outstandingBalance)} used
             </span>
             <span className="text-[12px] text-[var(--color-text-secondary)]">
               {fmtCurrency(dashboard.creditLimit)} limit
             </span>
           </div>
           {dashboard.creditLimit > 0 && (
             <div className="w-full h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
               <div
                 className="h-full bg-[var(--color-neutral-900)] rounded-full transition-all duration-500"
                 style={{
                   width: `${Math.min(100, ((dashboard.outstandingBalance ?? 0) / dashboard.creditLimit) * 100)}%`,
                 }}
               />
             </div>
           )}
           <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
             Status: <span className="font-medium text-[var(--color-text-secondary)]">{dashboard.creditStatus ?? '—'}</span>
           </p>
         </div>
       )}
 
       {/* ── Quick Actions ────────────────────────────────────────────── */}
       {!isLoading && !error && (
         <div>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
             Quick actions
           </p>
           <div className="flex flex-wrap gap-2">
             <button
               type="button"
               onClick={() => navigate('/dealer/invoices')}
               className="h-9 px-4 text-[13px] font-medium bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] transition-colors"
             >
               View Invoices
             </button>
             <button
               type="button"
               onClick={() => navigate('/dealer/aging')}
               className="h-9 px-4 text-[13px] font-medium bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] transition-colors"
             >
               Aging Report
             </button>
             <button
               type="button"
               onClick={() => navigate('/dealer/support')}
               className="h-9 px-4 text-[13px] font-medium bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] transition-colors"
             >
               Support
             </button>
             <button
               type="button"
               onClick={loadDashboard}
               className="h-9 px-3 text-[13px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
               title="Refresh"
             >
               <RefreshCcw size={14} />
             </button>
           </div>
         </div>
       )}
     </div>
   );
 }

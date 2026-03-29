 /**
  * DealerOrdersPage — My Orders
  *
  * Read-only paginated list of the authenticated dealer's orders.
  * Shows: order number, date, status, total amount, payment status.
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import {
    RefreshCcw,
   AlertCircle,
   ChevronLeft,
   ChevronRight,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { dealerApi } from '@/lib/dealerApi';
 import type { DealerPortalOrder } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtCurrency(value: number | undefined): string {
   if (value === undefined || value === null) return '—';
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
 // Status badge
 // ─────────────────────────────────────────────────────────────────────────────
 
 const ORDER_STATUS_LABELS: Record<string, string> = {
   DRAFT: 'Draft',
   RESERVED: 'Reserved',
   CONFIRMED: 'Confirmed',
   PROCESSING: 'Processing',
   DISPATCHED: 'Dispatched',
   INVOICED: 'Invoiced',
   SETTLED: 'Settled',
   CLOSED: 'Closed',
   CANCELLED: 'Cancelled',
   PENDING_PRODUCTION: 'Pending Production',
   PENDING_INVENTORY: 'Pending Inventory',
   READY_TO_SHIP: 'Ready to Ship',
 };
 
 function orderStatusBadge(status: string | undefined) {
   if (!status) return null;
   const upper = status.toUpperCase();
   const cls = (() => {
     switch (upper) {
       case 'CONFIRMED':
       case 'RESERVED':
         return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
       case 'CANCELLED':
         return 'bg-[var(--color-error-bg)] text-[var(--color-error)]';
       case 'DRAFT':
         return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
       case 'SETTLED':
       case 'CLOSED':
         return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]';
       default:
         return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
     }
   })();
   return (
     <span className={clsx('text-[10px] font-medium px-1.5 py-px rounded-full whitespace-nowrap', cls)}>
       {ORDER_STATUS_LABELS[upper] ?? status}
     </span>
   );
 }
 
 function paymentStatusBadge(status: string | undefined) {
   if (!status) return null;
   const upper = status.toUpperCase();
   const cls = (() => {
     switch (upper) {
       case 'PAID':
         return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
       case 'UNPAID':
         return 'bg-[var(--color-error-bg)] text-[var(--color-error)]';
       case 'PARTIAL':
         return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
       default:
         return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
     }
   })();
   const label = upper === 'UNPAID' ? 'Unpaid' : upper === 'PAID' ? 'Paid' : upper === 'PARTIAL' ? 'Partial' : status;
   return (
     <span className={clsx('text-[10px] font-medium px-1.5 py-px rounded-full whitespace-nowrap', cls)}>
       {label}
     </span>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Skeleton Row
 // ─────────────────────────────────────────────────────────────────────────────
 
 function SkeletonRow() {
   return (
     <tr className="border-b border-[var(--color-border-subtle)]">
       {[1, 2, 3, 4, 5].map((i) => (
         <td key={i} className="px-4 py-3">
           <Skeleton width={i === 1 ? '80%' : '60%'} />
         </td>
       ))}
     </tr>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 const PAGE_SIZE = 15;
 
 export function DealerOrdersPage() {
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [orders, setOrders] = useState<DealerPortalOrder[]>([]);
   const [page, setPage] = useState(0);
 
   const loadOrders = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await dealerApi.getOrders({ page: 0, size: 100 });
      setOrders(data);
       setPage(0);
     } catch {
       setError("Couldn't load your orders. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadOrders();
   }, [loadOrders]);
 
   // Client-side pagination
   const totalPages = Math.ceil(orders.length / PAGE_SIZE);
   const pageOrders = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
 
   return (
     <div className="space-y-5">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
             Orders
           </p>
           <h1 className="mt-0.5 text-[20px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             My Orders
           </h1>
         </div>
         <button
           type="button"
           onClick={loadOrders}
           className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
           title="Refresh"
         >
           <RefreshCcw size={15} />
         </button>
       </div>
 
       {/* ── Error ───────────────────────────────────────────────────── */}
       {error && !isLoading && (
         <div className="flex items-start gap-3 p-4 bg-[var(--color-error-bg)] border border-[var(--color-error)] border-opacity-20 rounded-xl">
           <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-error)]" />
           <div className="flex-1 min-w-0">
             <p className="text-[13px] text-[var(--color-error)]">{error}</p>
             <button
               type="button"
               onClick={loadOrders}
               className="mt-1 text-[12px] font-medium text-[var(--color-error)] underline underline-offset-2"
             >
               Retry
             </button>
           </div>
         </div>
       )}
 
       {/* ── Table ───────────────────────────────────────────────────── */}
       {!error && (
         <>
           {/* Desktop table */}
           <div className="hidden sm:block overflow-x-auto rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
             <table className="w-full border-collapse">
               <thead>
                 <tr className="border-b border-[var(--color-border-default)]">
                   {['Order Number', 'Date', 'Status', 'Total', 'Payment'].map((h) => (
                     <th
                       key={h}
                       className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]"
                     >
                       {h}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {isLoading
                   ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                   : pageOrders.length === 0
                     ? (
                       <tr>
                         <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-[var(--color-text-tertiary)]">
                           No orders found
                         </td>
                       </tr>
                     )
                     : pageOrders.map((order) => (
                       <tr
                         key={order.id ?? order.orderNumber}
                         className="border-b border-[var(--color-border-subtle)] last:border-0"
                       >
                         <td className="px-4 py-3 text-[13px] font-medium text-[var(--color-text-primary)] tabular-nums">
                           {order.orderNumber ?? '—'}
                         </td>
                         <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)] tabular-nums">
                           {fmtDate(order.createdAt)}
                         </td>
                         <td className="px-4 py-3">
                           {orderStatusBadge(order.status)}
                         </td>
                         <td className="px-4 py-3 text-[13px] tabular-nums text-[var(--color-text-primary)]">
                           {fmtCurrency(order.totalAmount)}
                         </td>
                         <td className="px-4 py-3">
                           {paymentStatusBadge(order.paymentStatus)}
                         </td>
                       </tr>
                     ))
                 }
               </tbody>
             </table>
           </div>
 
           {/* Mobile cards */}
           <div className="sm:hidden space-y-2">
             {isLoading
               ? Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
                   <Skeleton width="60%" className="mb-2" />
                   <Skeleton width="40%" />
                 </div>
               ))
               : pageOrders.length === 0
                 ? (
                   <div className="p-6 text-center text-[13px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
                     No orders found
                   </div>
                 )
                 : pageOrders.map((order) => (
                   <div
                     key={order.id ?? order.orderNumber}
                     className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl"
                   >
                     <div className="flex items-start justify-between gap-2 mb-2">
                       <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {order.orderNumber ?? '—'}
                       </span>
                       {orderStatusBadge(order.status)}
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-[12px] text-[var(--color-text-tertiary)]">
                         {fmtDate(order.createdAt)}
                       </span>
                       <div className="flex items-center gap-2">
                         <span className="text-[12px] tabular-nums text-[var(--color-text-secondary)]">
                           {fmtCurrency(order.totalAmount)}
                         </span>
                         {paymentStatusBadge(order.paymentStatus)}
                       </div>
                     </div>
                   </div>
                 ))
             }
           </div>
 
           {/* Pagination */}
           {!isLoading && totalPages > 1 && (
             <div className="flex items-center justify-between gap-3 pt-1">
               <p className="text-[12px] text-[var(--color-text-tertiary)]">
                 Page {page + 1} of {totalPages}
               </p>
               <div className="flex items-center gap-1">
                 <button
                   type="button"
                   onClick={() => setPage((p) => Math.max(0, p - 1))}
                   disabled={page === 0}
                   className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                 >
                   <ChevronLeft size={15} />
                 </button>
                 <button
                   type="button"
                   onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                   disabled={page >= totalPages - 1}
                   className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                 >
                   <ChevronRight size={15} />
                 </button>
               </div>
             </div>
           )}
         </>
       )}
     </div>
   );
 }

 /**
  * DealerAgingPage — My Aging
  *
  * Shows the dealer's aging report:
 *  - Bucket cards from agingBuckets map (current, 1-30 days, 31-60 days, 61-90 days, 90+ days)
  *  - Bucket amounts sum to total outstanding
 *  - Overdue invoices table (overdueInvoices[])
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import {
   Clock,
   RefreshCcw,
   AlertCircle,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { dealerApi } from '@/lib/dealerApi';
 import type { DealerPortalAging, DealerPortalOverdueInvoice } from '@/types';
 
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
 
 function bucketPercent(amount: number | undefined, total: number | undefined): number {
   if (!amount || !total || total === 0) return 0;
   return Math.round((amount / total) * 100);
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Bucket Card
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface BucketCardProps {
   label: string;
   amount: number | undefined;
   total: number | undefined;
   isOverdue?: boolean;
   isLoading?: boolean;
 }
 
 function BucketCard({ label, amount, total, isOverdue, isLoading }: BucketCardProps) {
   if (isLoading) {
     return (
       <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
         <Skeleton width="50%" className="mb-2" />
         <Skeleton height={24} width="70%" />
       </div>
     );
   }
 
   const pct = bucketPercent(amount, total);
   const hasAmount = (amount ?? 0) > 0;
 
   return (
     <div className={clsx(
       'p-4 bg-[var(--color-surface-primary)] border rounded-xl',
       isOverdue && hasAmount
         ? 'border-[var(--color-error)] border-opacity-30'
         : 'border-[var(--color-border-default)]',
     )}>
       <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
         {label}
       </p>
       <p className={clsx(
         'text-xl font-semibold tabular-nums tracking-tight',
         isOverdue && hasAmount ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]',
       )}>
         {fmtCurrency(amount)}
       </p>
       {pct > 0 && (
         <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{pct}% of total</p>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function DealerAgingPage() {
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [aging, setAging] = useState<DealerPortalAging | null>(null);
 
   const loadAging = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await dealerApi.getAging();
       setAging(data);
     } catch {
       setError("Couldn't load your aging report. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadAging();
   }, [loadAging]);
 
   // Verify bucket amounts sum to total
   const bucketSum = !isLoading && aging
    ? Object.values(aging.agingBuckets ?? {}).reduce((acc, v) => acc + (v ?? 0), 0)
     : 0;
 
   return (
     <div className="space-y-6">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
             Receivables
           </p>
           <h1 className="mt-0.5 text-[20px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             My Aging
           </h1>
         </div>
         <button
           type="button"
           onClick={loadAging}
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
               onClick={loadAging}
               className="mt-1 text-[12px] font-medium text-[var(--color-error)] underline underline-offset-2"
             >
               Retry
             </button>
           </div>
         </div>
       )}
 
       {!error && (
         <>
           {/* ── Total Outstanding ──────────────────────────────────────── */}
           <div className="flex items-center justify-between p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
             <div className="flex items-center gap-2">
               <Clock size={15} className="text-[var(--color-text-tertiary)]" />
               <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                 Total Outstanding
               </span>
             </div>
             {isLoading
               ? <Skeleton width={80} height={20} />
               : (
                 <span className="text-[16px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                   {fmtCurrency(aging?.totalOutstanding ?? bucketSum)}
                 </span>
               )
             }
           </div>
 
           {/* ── Aging Buckets ─────────────────────────────────────────── */}
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <BucketCard
              label="Current"
              amount={aging?.agingBuckets?.['current']}
              total={aging?.totalOutstanding ?? bucketSum}
              isLoading={isLoading}
            />
            <BucketCard
              label="1–30 Days"
              amount={aging?.agingBuckets?.['1-30 days']}
              total={aging?.totalOutstanding ?? bucketSum}
              isOverdue
              isLoading={isLoading}
            />
            <BucketCard
              label="31–60 Days"
              amount={aging?.agingBuckets?.['31-60 days']}
              total={aging?.totalOutstanding ?? bucketSum}
              isOverdue
              isLoading={isLoading}
            />
            <BucketCard
              label="61–90 Days"
              amount={aging?.agingBuckets?.['61-90 days']}
              total={aging?.totalOutstanding ?? bucketSum}
              isOverdue
              isLoading={isLoading}
            />
            <BucketCard
              label="90+ Days"
              amount={aging?.agingBuckets?.['90+ days']}
              total={aging?.totalOutstanding ?? bucketSum}
              isOverdue
              isLoading={isLoading}
            />
           </div>
 
          {/* ── Overdue Invoices ─────────────────────────────────────── */}
          {!isLoading && (aging?.overdueInvoices ?? []).length > 0 && (
             <div>
               <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
                Overdue invoices
               </p>

               {/* Desktop table */}
               <div className="hidden sm:block overflow-x-auto rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
                 <table className="w-full border-collapse">
                   <thead>
                     <tr className="border-b border-[var(--color-border-default)]">
                      {['Invoice', 'Issue Date', 'Due Date', 'Outstanding', 'Days Overdue'].map((h) => (
                         <th
                           key={h}
                           className={clsx(
                             'px-4 py-2.5 text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]',
                            h === 'Outstanding' ? 'text-right' : 'text-left',
                           )}
                         >
                           {h}
                         </th>
                       ))}
                     </tr>
                   </thead>
                   <tbody>
                    {(aging?.overdueInvoices ?? []).map((item: DealerPortalOverdueInvoice, idx: number) => (
                       <tr
                         key={`${item.invoiceNumber ?? ''}-${idx}`}
                         className="border-b border-[var(--color-border-subtle)] last:border-0"
                       >
                         <td className="px-4 py-3 text-[13px] font-medium text-[var(--color-text-primary)]">
                           {item.invoiceNumber ?? '—'}
                         </td>
                         <td className="px-4 py-3 text-[13px] tabular-nums text-[var(--color-text-secondary)]">
                          {fmtDate(item.issueDate)}
                         </td>
                        <td className="px-4 py-3 text-[13px] tabular-nums text-[var(--color-text-secondary)]">
                          {fmtDate(item.dueDate)}
                        </td>
                         <td className="px-4 py-3 text-[13px] tabular-nums text-right font-medium text-[var(--color-error)]">
                          {fmtCurrency(item.outstandingAmount)}
                         </td>
                         <td className="px-4 py-3 text-[13px] tabular-nums text-[var(--color-text-secondary)]">
                           {item.daysOverdue !== undefined ? `${item.daysOverdue}d` : '—'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               {/* Mobile card list */}
               <div className="sm:hidden space-y-2">
                 {(aging?.overdueInvoices ?? []).map((item: DealerPortalOverdueInvoice, idx: number) => (
                   <div
                     key={`mobile-${item.invoiceNumber ?? ''}-${idx}`}
                     className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-error)] border-opacity-30 rounded-xl"
                   >
                     <div className="flex items-start justify-between gap-2 mb-2">
                       <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {item.invoiceNumber ?? '—'}
                       </span>
                       {item.daysOverdue !== undefined && (
                         <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-error-bg)] text-[var(--color-error)] whitespace-nowrap shrink-0">
                           {item.daysOverdue}d overdue
                         </span>
                       )}
                     </div>
                     <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                       <div>
                         <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Issue Date</p>
                         <p className="text-[12px] tabular-nums text-[var(--color-text-secondary)] mt-0.5">{fmtDate(item.issueDate)}</p>
                       </div>
                       <div>
                         <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Due Date</p>
                         <p className="text-[12px] tabular-nums text-[var(--color-text-secondary)] mt-0.5">{fmtDate(item.dueDate)}</p>
                       </div>
                       <div className="col-span-2">
                         <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Outstanding</p>
                         <p className="text-[14px] font-semibold tabular-nums text-[var(--color-error)] mt-0.5">
                           {fmtCurrency(item.outstandingAmount)}
                         </p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
         </>
       )}
     </div>
   );
 }

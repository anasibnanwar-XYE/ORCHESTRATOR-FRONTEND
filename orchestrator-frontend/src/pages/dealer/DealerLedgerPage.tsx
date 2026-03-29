 /**
  * DealerLedgerPage — My Ledger
  *
  * Chronological list of the dealer's transactions with:
  *  - Date, Reference, Description, Type
  *  - Debit, Credit, Running Balance columns
  *  - Final balance matches outstanding balance
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import {
   BookOpen,
   RefreshCcw,
   AlertCircle,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { dealerApi } from '@/lib/dealerApi';
 import type { DealerPortalLedgerEntry } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtCurrency(value: number | undefined): string {
   if (value === undefined || value === null || value === 0) return '—';
   return '₹' + Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
 }
 
 function fmtBalance(value: number | undefined): string {
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
 
 function transactionTypeBadge(type: string | undefined) {
   if (!type) return null;
   const upper = type.toUpperCase();
   const cls = (() => {
     switch (upper) {
       case 'INVOICE': return 'bg-[var(--color-error-bg)] text-[var(--color-error)]';
       case 'PAYMENT': return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
       case 'CREDIT_NOTE': return 'bg-[var(--color-info-bg,var(--color-surface-tertiary))] text-[var(--color-info,var(--color-text-secondary))]';
       case 'ADJUSTMENT': return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
       default: return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
     }
   })();
   const label = upper === 'CREDIT_NOTE' ? 'Credit Note' : type.charAt(0) + type.slice(1).toLowerCase();
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
       {[1, 2, 3, 4, 5, 6].map((i) => (
         <td key={i} className="px-4 py-3">
           <Skeleton width={i === 2 ? '70%' : '60%'} />
         </td>
       ))}
     </tr>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function DealerLedgerPage() {
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [entries, setEntries] = useState<DealerPortalLedgerEntry[]>([]);
 
   const loadLedger = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await dealerApi.getLedger();
      setEntries(data);
     } catch {
       setError("Couldn't load your ledger. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadLedger();
   }, [loadLedger]);
 
   // Final balance = last entry's running balance (matches outstanding)
   const finalBalance = entries.length > 0 ? entries[entries.length - 1].balance : undefined;
 
   return (
     <div className="space-y-5">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
             Transactions
           </p>
           <h1 className="mt-0.5 text-[20px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             My Ledger
           </h1>
         </div>
         <button
           type="button"
           onClick={loadLedger}
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
               onClick={loadLedger}
               className="mt-1 text-[12px] font-medium text-[var(--color-error)] underline underline-offset-2"
             >
               Retry
             </button>
           </div>
         </div>
       )}
 
       {/* ── Final Balance Banner ─────────────────────────────────────── */}
       {!isLoading && !error && finalBalance !== undefined && (
         <div className="flex items-center justify-between p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
           <div className="flex items-center gap-2">
             <BookOpen size={15} className="text-[var(--color-text-tertiary)]" />
             <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
               Current Outstanding Balance
             </span>
           </div>
           <span className="text-[16px] font-semibold tabular-nums text-[var(--color-text-primary)]">
             {fmtBalance(finalBalance)}
           </span>
         </div>
       )}
 
       {/* ── Table ───────────────────────────────────────────────────── */}
       {!error && (
         <>
           {/* Desktop */}
           <div className="hidden sm:block overflow-x-auto rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
             <table className="w-full border-collapse">
               <thead>
                 <tr className="border-b border-[var(--color-border-default)]">
                   {['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'].map((h) => (
                     <th
                       key={h}
                       className={clsx(
                         'px-4 py-2.5 text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]',
                         ['Debit', 'Credit', 'Balance'].includes(h) ? 'text-right' : 'text-left',
                       )}
                     >
                       {h}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {isLoading
                   ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                   : entries.length === 0
                     ? (
                       <tr>
                         <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-[var(--color-text-tertiary)]">
                           No transactions found
                         </td>
                       </tr>
                     )
                     : entries.map((entry, idx) => (
                       <tr
                         key={`${entry.reference ?? ''}-${idx}`}
                         className="border-b border-[var(--color-border-subtle)] last:border-0"
                       >
                         <td className="px-4 py-3 text-[13px] tabular-nums text-[var(--color-text-secondary)] whitespace-nowrap">
                           {fmtDate(entry.date)}
                         </td>
                         <td className="px-4 py-3 text-[13px] font-medium text-[var(--color-text-primary)]">
                           {entry.reference ?? '—'}
                         </td>
                         <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)] max-w-[200px] truncate">
                           <div className="flex items-center gap-2">
                             {transactionTypeBadge(entry.type ?? entry.description)}
                             <span className="truncate">{entry.description ?? entry.type ?? '—'}</span>
                           </div>
                         </td>
                         <td className="px-4 py-3 text-[13px] tabular-nums text-right text-[var(--color-error)]">
                           {(entry.debit ?? 0) > 0 ? fmtCurrency(entry.debit) : '—'}
                         </td>
                         <td className="px-4 py-3 text-[13px] tabular-nums text-right text-[var(--color-success)]">
                           {(entry.credit ?? 0) > 0 ? fmtCurrency(entry.credit) : '—'}
                         </td>
                         <td className="px-4 py-3 text-[13px] tabular-nums text-right font-medium text-[var(--color-text-primary)]">
                           {fmtBalance(entry.balance)}
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
               : entries.length === 0
                 ? (
                   <div className="p-6 text-center text-[13px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
                     No transactions found
                   </div>
                 )
                 : entries.map((entry, idx) => (
                   <div
                     key={`${entry.reference ?? ''}-${idx}`}
                     className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl"
                   >
                     <div className="flex items-start justify-between gap-2 mb-1">
                       <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {entry.reference ?? '—'}
                       </span>
                       {transactionTypeBadge(entry.type)}
                     </div>
                     <p className="text-[12px] text-[var(--color-text-tertiary)] mb-2">
                       {fmtDate(entry.date)}
                     </p>
                     <div className="grid grid-cols-3 gap-2">
                       <div>
                         <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Debit</p>
                         <p className="text-[12px] tabular-nums text-[var(--color-error)]">
                           {(entry.debit ?? 0) > 0 ? fmtCurrency(entry.debit) : '—'}
                         </p>
                       </div>
                       <div>
                         <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Credit</p>
                         <p className="text-[12px] tabular-nums text-[var(--color-success)]">
                           {(entry.credit ?? 0) > 0 ? fmtCurrency(entry.credit) : '—'}
                         </p>
                       </div>
                       <div>
                         <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Balance</p>
                         <p className="text-[12px] tabular-nums font-medium text-[var(--color-text-primary)]">
                           {fmtBalance(entry.balance)}
                         </p>
                       </div>
                     </div>
                   </div>
                 ))
             }
           </div>
         </>
       )}
     </div>
   );
 }

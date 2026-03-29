 /**
  * DealerInvoicesPage — My Invoices
  *
  * Paginated list of dealer's invoices with PDF download per row.
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import {
   FileText,
   Download,
   RefreshCcw,
   AlertCircle,
   ChevronLeft,
   ChevronRight,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { dealerApi } from '@/lib/dealerApi';
 import { useToast } from '@/components/ui/Toast';
 import type { DealerPortalInvoice } from '@/types';
import { downloadBlob } from '@/utils/mobileUtils';
 
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
 
 function invoiceStatusBadge(status: string | undefined) {
   if (!status) return null;
   const upper = status.toUpperCase();
   const cls = (() => {
     switch (upper) {
       case 'PAID': return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
       case 'UNPAID': return 'bg-[var(--color-error-bg)] text-[var(--color-error)]';
       case 'PARTIAL': return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
       case 'OVERDUE': return 'bg-[var(--color-error-bg)] text-[var(--color-error)]';
       default: return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
     }
   })();
   const label = upper === 'UNPAID' ? 'Unpaid' : upper === 'PAID' ? 'Paid' : upper === 'PARTIAL' ? 'Partial' : upper === 'OVERDUE' ? 'Overdue' : status;
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
 
 export function DealerInvoicesPage() {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [invoices, setInvoices] = useState<DealerPortalInvoice[]>([]);
   const [page, setPage] = useState(0);
   const [downloadingId, setDownloadingId] = useState<number | null>(null);
 
   const loadInvoices = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await dealerApi.getInvoices({ page: 0, size: 100 });
      setInvoices(data);
       setPage(0);
     } catch {
       setError("Couldn't load your invoices. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadInvoices();
   }, [loadInvoices]);
 
   const handleDownloadPdf = useCallback(async (invoice: DealerPortalInvoice) => {
     if (!invoice.id) return;
     setDownloadingId(invoice.id);
     try {
       const blob = await dealerApi.getInvoicePdf(invoice.id);
      downloadBlob(blob, `${invoice.invoiceNumber ?? `invoice-${invoice.id}`}.pdf`);
       toast({ title: 'Download started', type: 'success' });
     } catch {
       toast({ title: 'Could not download PDF', type: 'error' });
     } finally {
       setDownloadingId(null);
     }
   }, [toast]);
 
   // Client-side pagination
   const totalPages = Math.ceil(invoices.length / PAGE_SIZE);
   const pageInvoices = invoices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
 
   return (
     <div className="space-y-5">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
             Invoices
           </p>
           <h1 className="mt-0.5 text-[20px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             My Invoices
           </h1>
         </div>
         <button
           type="button"
           onClick={loadInvoices}
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
               onClick={loadInvoices}
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
           {/* Desktop */}
           <div className="hidden sm:block overflow-x-auto rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
             <table className="w-full border-collapse">
               <thead>
                 <tr className="border-b border-[var(--color-border-default)]">
                   {['Invoice', 'Date', 'Total', 'Outstanding', 'Status', ''].map((h) => (
                     <th
                       key={h}
                       className={clsx(
                         'px-4 py-2.5 text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]',
                         ['Total', 'Outstanding'].includes(h) ? 'text-right' : 'text-left',
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
                   : pageInvoices.length === 0
                     ? (
                       <tr>
                         <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-[var(--color-text-tertiary)]">
                           No invoices found
                         </td>
                       </tr>
                     )
                     : pageInvoices.map((inv) => (
                       <tr
                         key={inv.id ?? inv.invoiceNumber}
                         className="border-b border-[var(--color-border-subtle)] last:border-0"
                       >
                         <td className="px-4 py-3 text-[13px] font-medium text-[var(--color-text-primary)]">
                           <div className="flex items-center gap-2">
                             <FileText size={13} className="text-[var(--color-text-tertiary)] shrink-0" />
                             {inv.invoiceNumber ?? '—'}
                           </div>
                         </td>
                         <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)] tabular-nums">
                           {fmtDate(inv.issueDate)}
                         </td>
                         <td className="px-4 py-3 text-[13px] tabular-nums text-right font-medium text-[var(--color-text-primary)]">
                           {fmtCurrency(inv.totalAmount)}
                         </td>
                         <td className="px-4 py-3 text-[13px] tabular-nums text-right font-medium">
                           {(inv.outstandingAmount ?? 0) > 0
                             ? <span className="text-[var(--color-error)]">{fmtCurrency(inv.outstandingAmount)}</span>
                             : <span className="text-[var(--color-text-tertiary)]">—</span>
                           }
                         </td>
                         <td className="px-4 py-3">
                           {invoiceStatusBadge(inv.status)}
                         </td>
                         <td className="px-4 py-3">
                           <button
                             type="button"
                             aria-label="Download PDF"
                             onClick={() => handleDownloadPdf(inv)}
                             disabled={downloadingId === inv.id}
                             className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-40 transition-colors"
                             title="Download PDF"
                           >
                             <Download size={14} />
                           </button>
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
               : pageInvoices.length === 0
                 ? (
                   <div className="p-6 text-center text-[13px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
                     No invoices found
                   </div>
                 )
                 : pageInvoices.map((inv) => (
                   <div
                     key={inv.id ?? inv.invoiceNumber}
                     className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl"
                   >
                     <div className="flex items-start justify-between gap-2 mb-1">
                       <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {inv.invoiceNumber ?? '—'}
                       </span>
                       {invoiceStatusBadge(inv.status)}
                     </div>
                     <p className="text-[12px] text-[var(--color-text-tertiary)] mb-2">
                       {fmtDate(inv.issueDate)}
                     </p>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div>
                           <p className="text-[11px] text-[var(--color-text-tertiary)]">Total</p>
                           <p className="text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">
                             {fmtCurrency(inv.totalAmount)}
                           </p>
                         </div>
                         {(inv.outstandingAmount ?? 0) > 0 && (
                           <div>
                             <p className="text-[11px] text-[var(--color-text-tertiary)]">Outstanding</p>
                             <p className="text-[13px] font-medium tabular-nums text-[var(--color-error)]">
                               {fmtCurrency(inv.outstandingAmount)}
                             </p>
                           </div>
                         )}
                       </div>
                       <button
                         type="button"
                         aria-label="Download PDF"
                         onClick={() => handleDownloadPdf(inv)}
                         disabled={downloadingId === inv.id}
                         className="h-8 px-3 text-[12px] font-medium bg-[var(--color-surface-tertiary)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-colors flex items-center gap-1.5"
                       >
                         <Download size={13} />
                         PDF
                       </button>
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

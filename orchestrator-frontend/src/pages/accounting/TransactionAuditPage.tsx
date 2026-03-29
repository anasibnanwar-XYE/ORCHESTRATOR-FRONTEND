 /**
  * TransactionAuditPage
  *
  * Journal-level audit trail with detail drill-down.
  * Also displays the current Date Context (server date, open period, etc.)
  *
  * Data sources:
  *  GET /api/v1/accounting/date-context         → DateContextResponse (Map)
  *  GET /api/v1/accounting/audit/transactions   → paginated list
  *  GET /api/v1/accounting/audit/transactions/{id} → detail
  */

 import { useState, useEffect, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   Calendar,
   RefreshCcw,
   AlertCircle,
   ChevronRight,
   ArrowLeft,
   BookOpen,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Badge } from '@/components/ui/Badge';
 import {
   auditApi,
   dateContextApi,
   type TransactionAuditPageResponse,
   type AccountingTransactionAuditListItemDto,
   type AccountingTransactionAuditDetailDto,
   type DateContextResponse,
 } from '@/lib/accountingApi';

 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────

 function formatDate(s: string): string {
   try { return format(parseISO(s), 'dd MMM yyyy'); } catch { return s; }
 }

 function formatTimestamp(ts: string): string {
   try { return format(parseISO(ts), 'dd MMM yyyy HH:mm'); } catch { return ts; }
 }

 function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
   switch (status?.toUpperCase()) {
     case 'POSTED': return 'success';
     case 'VOID': return 'danger';
     case 'PENDING':
     case 'DRAFT': return 'warning';
     default: return 'default';
   }
 }

 function consistencyVariant(cs: string): 'success' | 'warning' | 'danger' | 'default' {
   switch (cs?.toUpperCase()) {
     case 'OK': return 'success';
     case 'WARNING': return 'warning';
     case 'ERROR': return 'danger';
     default: return 'default';
   }
 }

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Date Context panel
 // ─────────────────────────────────────────────────────────────────────────────

 interface DateContextPanelProps {
   context: DateContextResponse | null;
   loading: boolean;
   error: string | null;
 }

 function DateContextPanel({ context, loading, error }: DateContextPanelProps) {
   const entries = context ? Object.entries(context) : [];

   return (
     <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
       <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--color-border-subtle)]">
         <Calendar size={15} className="text-[var(--color-text-tertiary)]" />
         <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
           Date Context
         </span>
       </div>
       <div className="p-5">
         {loading ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
             {Array.from({ length: 4 }).map((_, i) => (
               <Skeleton key={i} className="h-12" />
             ))}
           </div>
         ) : error ? (
           <div className="flex items-center gap-2 text-[var(--color-danger,#ef4444)]">
             <AlertCircle size={14} />
             <span className="text-[12px]">{error}</span>
           </div>
         ) : entries.length === 0 ? (
           <p className="text-[13px] text-[var(--color-text-secondary)]">No date context available.</p>
         ) : (
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
             {entries.map(([key, value]) => (
               <div key={key} className="p-3 rounded-lg bg-[var(--color-surface-secondary)]">
                 <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] truncate">
                   {key.replace(/([A-Z])/g, ' $1').trim()}
                 </p>
                 <p className="mt-1 text-[13px] font-medium text-[var(--color-text-primary)] tabular-nums truncate">
                   {String(value)}
                 </p>
               </div>
             ))}
           </div>
         )}
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Transaction list row
 // ─────────────────────────────────────────────────────────────────────────────

 interface TxRowProps {
   tx: AccountingTransactionAuditListItemDto;
   onClick: (tx: AccountingTransactionAuditListItemDto) => void;
 }

 function TxRow({ tx, onClick }: TxRowProps) {
   return (
     <tr
       className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-tertiary)] cursor-pointer transition-colors"
       onClick={() => onClick(tx)}
     >
       <td className="px-4 py-3 text-[12px] tabular-nums text-[var(--color-text-tertiary)] whitespace-nowrap">
         {formatDate(tx.entryDate)}
       </td>
       <td className="px-4 py-3">
         <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
           {tx.referenceNumber}
         </span>
       </td>
       <td className="px-4 py-3">
         <Badge variant={statusVariant(tx.status)} className="text-[11px]">
           {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
         </Badge>
       </td>
       <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)]">
         {tx.module ?? '—'}
       </td>
       <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)] max-w-[200px] truncate">
         {tx.memo ?? '—'}
       </td>
       <td className="px-4 py-3 text-[13px] tabular-nums text-right text-[var(--color-text-primary)]">
         {formatINR(tx.totalDebit)}
       </td>
       {tx.consistencyStatus && tx.consistencyStatus !== 'OK' && (
         <td className="px-4 py-3">
           <Badge variant={consistencyVariant(tx.consistencyStatus)} className="text-[10px]">
             {tx.consistencyStatus}
           </Badge>
         </td>
       )}
       <td className="px-4 py-2">
         <ChevronRight size={14} className="text-[var(--color-text-tertiary)]" />
       </td>
     </tr>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Detail view
 // ─────────────────────────────────────────────────────────────────────────────

 interface DetailViewProps {
   detail: AccountingTransactionAuditDetailDto;
   onBack: () => void;
 }

 function DetailView({ detail, onBack }: DetailViewProps) {
   const navigate = useNavigate();

   return (
     <div className="space-y-5">
       <div className="flex items-center gap-3">
         <button
           type="button"
           onClick={onBack}
           className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
           aria-label="Back to list"
         >
           <ArrowLeft size={16} />
         </button>
         <div>
           <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
             {detail.referenceNumber}
           </h2>
           <p className="text-[12px] text-[var(--color-text-tertiary)]">
             {formatDate(detail.entryDate)}
             {detail.accountingPeriodLabel && ` · ${detail.accountingPeriodLabel}`}
           </p>
         </div>
         <div className="ml-auto flex items-center gap-2">
           <Badge variant={statusVariant(detail.status)}>
             {detail.status.charAt(0) + detail.status.slice(1).toLowerCase()}
           </Badge>
           <button
             type="button"
             onClick={() => navigate(`/accounting/journals/${detail.journalEntryId}`)}
             className="inline-flex items-center gap-1.5 px-3 h-7 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors border border-[var(--color-border-default)]"
           >
             <BookOpen size={12} />
             View Journal
           </button>
         </div>
       </div>

       {/* Meta */}
       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
         {[
           { label: 'Type', value: detail.transactionType ?? detail.module ?? '—' },
           { label: 'Module', value: detail.module ?? '—' },
           { label: 'Posted by', value: detail.postedBy ?? detail.createdBy ?? '—' },
           detail.dealerName && { label: 'Dealer', value: detail.dealerName },
           detail.supplierName && { label: 'Supplier', value: detail.supplierName },
           detail.correctionType && { label: 'Correction', value: detail.correctionType },
         ].filter(Boolean).map((item) => item && (
           <div key={item.label} className="p-3 rounded-lg bg-[var(--color-surface-secondary)]">
             <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
               {item.label}
             </p>
             <p className="mt-1 text-[13px] text-[var(--color-text-primary)]">{item.value}</p>
           </div>
         ))}
       </div>

       {/* Memo */}
       {detail.memo && (
         <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)]">
           <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
             Memo
           </p>
           <p className="text-[13px] text-[var(--color-text-primary)]">{detail.memo}</p>
         </div>
       )}

       {/* Lines */}
       {detail.lines && detail.lines.length > 0 && (
         <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
           <p className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] border-b border-[var(--color-border-subtle)]">
             Journal Lines
           </p>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="border-b border-[var(--color-border-subtle)]">
                   {['Account', 'Description', 'Debit', 'Credit'].map((h) => (
                     <th key={h} className={clsx(
                       'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]',
                       h === 'Debit' || h === 'Credit' ? 'text-right' : 'text-left',
                     )}>
                       {h}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {detail.lines.map((line, i) => (
                   <tr key={i} className="border-b border-[var(--color-border-subtle)] last:border-0">
                     <td className="px-4 py-2.5">
                       <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {line.accountName}
                       </p>
                       <p className="text-[11px] text-[var(--color-text-tertiary)]">{line.accountCode}</p>
                     </td>
                     <td className="px-4 py-2.5 text-[13px] text-[var(--color-text-secondary)] max-w-[200px] truncate">
                       {line.description || '—'}
                     </td>
                     <td className="px-4 py-2.5 text-right text-[13px] tabular-nums text-[var(--color-text-primary)]">
                       {line.debit > 0 ? formatINR(line.debit) : '—'}
                     </td>
                     <td className="px-4 py-2.5 text-right text-[13px] tabular-nums text-[var(--color-text-primary)]">
                       {line.credit > 0 ? formatINR(line.credit) : '—'}
                     </td>
                   </tr>
                 ))}
               </tbody>
               <tfoot>
                 <tr className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
                   <td colSpan={2} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                     Total
                   </td>
                   <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                     {formatINR(detail.totalDebit)}
                   </td>
                   <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                     {formatINR(detail.totalCredit)}
                   </td>
                 </tr>
               </tfoot>
             </table>
           </div>
         </div>
       )}

       {/* Consistency notes */}
       {detail.consistencyNotes && detail.consistencyNotes.length > 0 && (
         <div className="p-4 rounded-xl border border-[var(--color-warning,#f59e0b)]/30 bg-[var(--color-warning,#f59e0b)]/5">
           <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-warning,#f59e0b)] mb-2">
             Consistency Notes
           </p>
           {detail.consistencyNotes.map((note, i) => (
             <p key={i} className="text-[13px] text-[var(--color-text-primary)]">{note}</p>
           ))}
         </div>
       )}

       {/* Event trail */}
       {detail.eventTrail && detail.eventTrail.length > 0 && (
         <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
           <p className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] border-b border-[var(--color-border-subtle)]">
             Event Trail
           </p>
           <div className="divide-y divide-[var(--color-border-subtle)]">
             {detail.eventTrail.map((evt, i) => (
               <div key={i} className="px-4 py-3 flex items-start gap-3">
                 <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] shrink-0" />
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 justify-between flex-wrap">
                     <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                       {evt.event}
                     </p>
                     <span className="text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
                       {formatTimestamp(evt.timestamp)}
                     </span>
                   </div>
                   {evt.actor && (
                     <p className="text-[12px] text-[var(--color-text-tertiary)]">{evt.actor}</p>
                   )}
                   {evt.note && (
                     <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">{evt.note}</p>
                   )}
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function TransactionAuditPage() {
   // Date context
   const [dateContext, setDateContext] = useState<DateContextResponse | null>(null);
   const [dateContextLoading, setDateContextLoading] = useState(true);
   const [dateContextError, setDateContextError] = useState<string | null>(null);

   // Transaction list
   const [txData, setTxData] = useState<TransactionAuditPageResponse | null>(null);
   const [txLoading, setTxLoading] = useState(true);
   const [txError, setTxError] = useState<string | null>(null);
   const [currentPage, setCurrentPage] = useState(0);

   // Detail view
   const [selectedTx, setSelectedTx] = useState<AccountingTransactionAuditListItemDto | null>(null);
   const [detail, setDetail] = useState<AccountingTransactionAuditDetailDto | null>(null);
   const [detailLoading, setDetailLoading] = useState(false);
   const [detailError, setDetailError] = useState<string | null>(null);

   // Load date context
   useEffect(() => {
     setDateContextLoading(true);
     dateContextApi.getDateContext()
       .then((data) => setDateContext(data))
       .catch(() => setDateContextError('Could not load date context.'))
       .finally(() => setDateContextLoading(false));
   }, []);

   // Load transactions
   const loadTransactions = useCallback((page: number) => {
     setTxLoading(true);
     setTxError(null);
     auditApi.getTransactionAudit({ page, size: 20 })
       .then((data) => setTxData(data))
       .catch(() => setTxError('Could not load transaction audit.'))
       .finally(() => setTxLoading(false));
   }, []);

   useEffect(() => {
     loadTransactions(0);
   }, [loadTransactions]);

   // Load detail
   const handleTxClick = useCallback(async (tx: AccountingTransactionAuditListItemDto) => {
     setSelectedTx(tx);
     setDetail(null);
     setDetailError(null);
     setDetailLoading(true);
     try {
       const d = await auditApi.getTransactionAuditDetail(tx.journalEntryId);
       setDetail(d);
     } catch {
       setDetailError('Could not load transaction detail.');
     } finally {
       setDetailLoading(false);
     }
   }, []);

   const handleBack = useCallback(() => {
     setSelectedTx(null);
     setDetail(null);
     setDetailError(null);
   }, []);

   const handlePageChange = useCallback((p: number) => {
     setCurrentPage(p);
     loadTransactions(p);
   }, [loadTransactions]);

   // ── Detail view ──────────────────────────────────────────────────────────

   if (selectedTx) {
     return (
       <div className="space-y-6">
         <DateContextPanel
           context={dateContext}
           loading={dateContextLoading}
           error={dateContextError}
         />
         {detailLoading && (
           <div className="space-y-3">
             {Array.from({ length: 5 }).map((_, i) => (
               <Skeleton key={i} className="h-16 rounded-xl" />
             ))}
           </div>
         )}
         {detailError && (
           <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--color-danger,#ef4444)]/10 text-[var(--color-danger,#ef4444)]">
             <AlertCircle size={16} />
             <span className="text-[13px]">{detailError}</span>
             <button
               type="button"
               className="ml-auto underline text-[13px]"
               onClick={handleBack}
             >
               Back
             </button>
           </div>
         )}
         {detail && <DetailView detail={detail} onBack={handleBack} />}
       </div>
     );
   }

   // ── List view ────────────────────────────────────────────────────────────

   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-start justify-between gap-4 flex-wrap">
         <div>
           <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
             Transaction Audit
           </h1>
           <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
             Journal-level audit trail with consistency checks and event history.
           </p>
         </div>
         <button
           type="button"
           onClick={() => loadTransactions(currentPage)}
           disabled={txLoading}
           className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
           aria-label="Refresh transactions"
         >
           <RefreshCcw size={15} className={clsx(txLoading && 'animate-spin')} />
         </button>
       </div>

       {/* Date Context */}
       <DateContextPanel
         context={dateContext}
         loading={dateContextLoading}
         error={dateContextError}
       />

       {/* Transaction audit table */}
       <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
         {txLoading ? (
           <div className="p-5 space-y-2">
             {Array.from({ length: 8 }).map((_, i) => (
               <Skeleton key={i} className="h-10 w-full" />
             ))}
           </div>
         ) : txError ? (
           <div className="p-5 flex items-center gap-2 text-[var(--color-danger,#ef4444)]">
             <AlertCircle size={15} />
             <span className="text-[13px]">{txError}</span>
           </div>
         ) : !txData || txData.content.length === 0 ? (
           <div className="py-12 text-center">
             <p className="text-[13px] text-[var(--color-text-secondary)]">
               No transactions found.
             </p>
           </div>
         ) : (
           <>
             {/* Desktop table */}
             <div className="overflow-x-auto hidden sm:block">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-[var(--color-border-default)]">
                     {['Date', 'Reference', 'Status', 'Module', 'Memo', 'Amount'].map((h) => (
                       <th
                         key={h}
                         className={clsx(
                           'px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]',
                           h === 'Amount' ? 'text-right' : 'text-left',
                         )}
                       >
                         {h}
                       </th>
                     ))}
                     <th className="px-4 py-3" />
                   </tr>
                 </thead>
                 <tbody>
                   {txData.content.map((tx) => (
                     <TxRow key={tx.journalEntryId} tx={tx} onClick={handleTxClick} />
                   ))}
                 </tbody>
               </table>
             </div>

             {/* Mobile cards */}
             <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
               {txData.content.map((tx) => (
                 <button
                   key={tx.journalEntryId}
                   type="button"
                   className="w-full text-left p-4 hover:bg-[var(--color-surface-tertiary)] transition-colors"
                   onClick={() => handleTxClick(tx)}
                 >
                   <div className="flex items-center justify-between gap-2">
                     <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                       {tx.referenceNumber}
                     </span>
                     <Badge variant={statusVariant(tx.status)} className="text-[11px]">
                       {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                     </Badge>
                   </div>
                   <div className="mt-1 flex items-center justify-between gap-2">
                     <span className="text-[12px] text-[var(--color-text-tertiary)]">
                       {formatDate(tx.entryDate)} · {tx.module ?? '—'}
                     </span>
                     <span className="text-[12px] tabular-nums text-[var(--color-text-primary)]">
                       {formatINR(tx.totalDebit)}
                     </span>
                   </div>
                 </button>
               ))}
             </div>

             {/* Pagination */}
             {txData.totalPages > 1 && (
               <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--color-border-subtle)]">
                 <p className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                   Page {currentPage + 1} of {txData.totalPages}
                   {' · '}
                   {txData.totalElements.toLocaleString()} total
                 </p>
                 <div className="flex items-center gap-2">
                   <Button
                     size="sm"
                     variant="secondary"
                     disabled={currentPage === 0}
                     onClick={() => handlePageChange(currentPage - 1)}
                   >
                     Previous
                   </Button>
                   <Button
                     size="sm"
                     variant="secondary"
                     disabled={currentPage >= txData.totalPages - 1}
                     onClick={() => handlePageChange(currentPage + 1)}
                   >
                     Next
                   </Button>
                 </div>
               </div>
             )}
           </>
         )}
       </div>
     </div>
   );
 }

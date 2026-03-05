 /**
  * JournalDetailPage
  *
  * Detail view for a single journal entry.
  *
  * Shows:
  *  - Header: date, reference number, status badge, memo/narration
  *  - Accounting period + linked dealer/supplier (if any)
  *  - Balanced line item table: account code, name, debit, credit
  *  - Footer: total debits, total credits (must be equal)
  *  - Reverse/cascade-reverse actions
  *
  * Data source:
  *  GET /api/v1/accounting/journal-entries (list + find by id)
  */

 import { useState, useCallback, useEffect } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import {
   ArrowLeft,
   RotateCcw,
   ChevronsRight,
   AlertCircle,
   RefreshCcw,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import {
   accountingApi,
   type JournalEntryDto,
   type JournalEntryLine,
 } from '@/lib/accountingApi';

 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 function formatDate(dateStr: string): string {
   try {
     return format(parseISO(dateStr), 'dd MMM yyyy');
   } catch {
     return dateStr;
   }
 }

 function todayISO(): string {
   return new Date().toISOString().split('T')[0];
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Status Badge
 // ─────────────────────────────────────────────────────────────────────────────

 function JournalStatusBadge({ status }: { status: string }) {
   const dotMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
     POSTED: 'success',
     VOID: 'danger',
     REVERSED: 'warning',
     PENDING: 'warning',
   };
   const variant = dotMap[status] ?? 'default';
   const label = status.charAt(0) + status.slice(1).toLowerCase();
   return <Badge variant={variant} dot>{label}</Badge>;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Reverse Modal
 // ─────────────────────────────────────────────────────────────────────────────

 interface ReverseModalProps {
   isOpen: boolean;
   isCascade: boolean;
   onClose: () => void;
   onConfirm: (reason: string, reversalDate: string, cascade: boolean) => Promise<void>;
   isLoading: boolean;
   referenceNumber: string;
 }

 function ReverseModal({
   isOpen,
   isCascade,
   onClose,
   onConfirm,
   isLoading,
   referenceNumber,
 }: ReverseModalProps) {
   const [reason, setReason] = useState('');
   const [reversalDate, setReversalDate] = useState(todayISO());

   if (!isOpen) return null;

   return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       title={isCascade ? 'Cascade Reverse Journal' : 'Reverse Journal'}
       description={
         isCascade
           ? 'This will reverse this journal and all related downstream entries.'
           : `Create a mirrored reversal of ${referenceNumber}.`
       }
       size="sm"
       footer={
         <>
           <Button variant="secondary" onClick={onClose} disabled={isLoading}>
             Cancel
           </Button>
           <Button
             variant="danger"
             isLoading={isLoading}
             onClick={() => void onConfirm(reason, reversalDate, isCascade)}
           >
             {isCascade ? 'Cascade Reverse' : 'Reverse'}
           </Button>
         </>
       }
     >
       <div className="space-y-3">
         <div>
           <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] mb-1.5">
             Reversal Date
           </label>
           <input
             type="date"
             value={reversalDate}
             onChange={(e) => setReversalDate(e.target.value)}
             className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:border-[var(--color-neutral-400)]"
           />
         </div>
         <Input
           label="Reason"
           value={reason}
           onChange={(e) => setReason(e.target.value)}
           placeholder="Why is this entry being reversed?"
         />
         {isCascade && (
           <div className="flex items-start gap-2 text-[12px] text-[var(--color-warning-icon)] bg-[var(--color-warning-subtle)] rounded-lg px-3 py-2">
             <AlertCircle size={13} className="shrink-0 mt-0.5" />
             <span>
               All downstream journal entries linked to this one will also be reversed.
             </span>
           </div>
         )}
       </div>
     </Modal>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Journal Detail Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function JournalDetailPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();

   const [entry, setEntry] = useState<JournalEntryDto | null>(null);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [reverseModal, setReverseModal] = useState<'single' | 'cascade' | null>(null);
   const [reverseLoading, setReverseLoading] = useState(false);
   const [reverseError, setReverseError] = useState('');

   const loadEntry = useCallback(async () => {
     if (!id) return;
     setLoading(true);
     setHasError(false);
     try {
       const data = await accountingApi.getJournalEntryById(Number(id));
       setEntry(data);
       if (!data) setHasError(true);
     } catch {
       setHasError(true);
     } finally {
       setLoading(false);
     }
   }, [id]);

   useEffect(() => {
     void loadEntry();
   }, [loadEntry]);

   const handleReverse = useCallback(
     async (reason: string, reversalDate: string, cascade: boolean) => {
       if (!entry) return;
       setReverseLoading(true);
       setReverseError('');
       try {
         if (cascade) {
           await accountingApi.cascadeReverseJournal(entry.id, {
             reversalDate,
             reason,
             cascadeRelatedEntries: true,
           });
         } else {
           await accountingApi.reverseJournal(entry.id, { reversalDate, reason });
         }
         setReverseModal(null);
         void loadEntry();
       } catch (err: unknown) {
         const message =
           err instanceof Error ? err.message : 'Failed to reverse journal. Please try again.';
         setReverseError(message);
       } finally {
         setReverseLoading(false);
       }
     },
     [entry, loadEntry]
   );

   // Computed totals
   const totals = entry
     ? {
         debit: entry.lines.reduce((s, l) => s + l.debit, 0),
         credit: entry.lines.reduce((s, l) => s + l.credit, 0),
       }
     : null;

   const isBalanced = totals ? Math.abs(totals.debit - totals.credit) < 0.01 : true;

   // ── Render loading state
   if (loading) {
     return (
       <div className="space-y-4">
         <div className="flex items-center gap-3">
           <Skeleton width={80} height={28} />
           <Skeleton width="50%" height={28} />
         </div>
         <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-5 space-y-3">
           {Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} height={20} />
           ))}
         </div>
         <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
           {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="px-5 py-3 grid grid-cols-4 gap-4 border-b border-[var(--color-border-subtle)]">
               {Array.from({ length: 4 }).map((_, j) => (
                 <Skeleton key={j} height={16} />
               ))}
             </div>
           ))}
         </div>
       </div>
     );
   }

   // ── Render error state
   if (hasError || !entry) {
     return (
       <div className="flex flex-col items-center gap-3 py-16 text-center">
         <AlertCircle size={28} className="text-[var(--color-text-tertiary)]" />
         <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
           Journal entry not found
         </p>
         <p className="text-[12px] text-[var(--color-text-tertiary)]">
           This entry may have been deleted or you don't have access.
         </p>
         <div className="flex items-center gap-2 mt-1">
           <Button variant="secondary" size="sm" leftIcon={<RefreshCcw />} onClick={loadEntry}>
             Try again
           </Button>
           <Button
             variant="secondary"
             size="sm"
             leftIcon={<ArrowLeft />}
             onClick={() => navigate('/accounting/journals')}
           >
             Back to Journals
           </Button>
         </div>
       </div>
     );
   }

   return (
     <div className="space-y-4">
       {/* Back nav */}
       <button
         type="button"
         onClick={() => navigate('/accounting/journals')}
         className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
       >
         <ArrowLeft size={14} />
         Back to Journals
       </button>

       {/* Header card */}
       <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-5">
         <div className="flex items-start justify-between gap-4">
           <div className="min-w-0">
             {/* Reference number + status */}
             <div className="flex items-center gap-2.5 flex-wrap">
               <h1 className="text-[18px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                 {entry.referenceNumber}
               </h1>
               <JournalStatusBadge status={entry.status} />
               {entry.reversalOfEntryId && (
                 <Badge variant="warning">Reversal</Badge>
               )}
               {entry.reversalEntryId && (
                 <Badge variant="default">Has Reversal</Badge>
               )}
             </div>

             {/* Date + period */}
             <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
               {formatDate(entry.entryDate)}
               {entry.accountingPeriodLabel && (
                 <span className="ml-2 text-[var(--color-text-tertiary)]">
                   · Period: {entry.accountingPeriodLabel}
                 </span>
               )}
             </p>

             {/* Memo */}
             {entry.memo && (
               <p className="mt-2 text-[13px] text-[var(--color-text-secondary)] leading-relaxed max-w-prose">
                 {entry.memo}
               </p>
             )}

             {/* Linked partner */}
             {(entry.dealerName || entry.supplierName) && (
               <p className="mt-1.5 text-[11px] text-[var(--color-text-tertiary)]">
                 {entry.dealerName && `Dealer: ${entry.dealerName}`}
                 {entry.supplierName && `Supplier: ${entry.supplierName}`}
               </p>
             )}
           </div>

           {/* Actions */}
           {entry.status === 'POSTED' && (
             <div className="flex items-center gap-2 shrink-0">
               <Button
                 variant="secondary"
                 size="sm"
                 leftIcon={<RotateCcw />}
                 onClick={() => setReverseModal('single')}
               >
                 Reverse
               </Button>
               <Button
                 variant="secondary"
                 size="sm"
                 leftIcon={<ChevronsRight />}
                 onClick={() => setReverseModal('cascade')}
               >
                 Cascade Reverse
               </Button>
             </div>
           )}
         </div>

         {/* Metadata grid */}
         <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-3">
           {[
             { label: 'Created by', value: entry.createdBy || '—' },
             { label: 'Created at', value: entry.createdAt ? formatDate(entry.createdAt) : '—' },
             { label: 'Period', value: entry.accountingPeriodLabel || '—' },
             { label: 'Period Status', value: entry.accountingPeriodStatus || '—' },
           ].map(({ label, value }) => (
             <div key={label}>
               <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                 {label}
               </p>
               <p className="mt-0.5 text-[12px] text-[var(--color-text-primary)]">{value}</p>
             </div>
           ))}
         </div>
       </div>

       {/* Reverse error banner */}
       {reverseError && (
         <div className="flex items-center gap-2 text-[12px] text-[var(--color-error)] bg-[var(--color-error-subtle)] rounded-lg px-4 py-2.5">
           <AlertCircle size={13} />
           {reverseError}
         </div>
       )}

       {/* Line items table */}
       <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
         <div className="px-5 py-3 border-b border-[var(--color-border-subtle)]">
           <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
             Journal Lines
           </h2>
         </div>

         {/* Desktop */}
         <div className="hidden sm:block overflow-x-auto">
           <table className="w-full">
             <thead>
               <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-default)]">
                 {['Account Code', 'Account Name', 'Description', 'Debit', 'Credit'].map(
                   (h, i) => (
                     <th
                       key={h}
                       className={clsx(
                         'px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]',
                         i >= 3 ? 'text-right' : 'text-left',
                       )}
                     >
                       {h}
                     </th>
                   )
                 )}
               </tr>
             </thead>
             <tbody className="divide-y divide-[var(--color-border-subtle)]">
               {entry.lines.map((line: JournalEntryLine) => (
                 <tr key={line.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                   <td className="px-5 py-3">
                     <span className="text-[12px] font-mono tabular-nums text-[var(--color-text-secondary)]">
                       {line.accountCode}
                     </span>
                   </td>
                   <td className="px-5 py-3">
                     <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                       {line.accountName}
                     </span>
                   </td>
                   <td className="px-5 py-3 max-w-[200px]">
                     <span className="text-[12px] text-[var(--color-text-secondary)] truncate block">
                       {line.description || '—'}
                     </span>
                   </td>
                   <td className="px-5 py-3 text-right">
                     <span className={clsx(
                       'text-[13px] tabular-nums font-medium',
                       line.debit > 0
                         ? 'text-[var(--color-text-primary)]'
                         : 'text-[var(--color-text-tertiary)]',
                     )}>
                       {line.debit > 0 ? formatINR(line.debit) : '—'}
                     </span>
                   </td>
                   <td className="px-5 py-3 text-right">
                     <span className={clsx(
                       'text-[13px] tabular-nums font-medium',
                       line.credit > 0
                         ? 'text-[var(--color-text-primary)]'
                         : 'text-[var(--color-text-tertiary)]',
                     )}>
                       {line.credit > 0 ? formatINR(line.credit) : '—'}
                     </span>
                   </td>
                 </tr>
               ))}
             </tbody>
             {/* Totals footer */}
             <tfoot>
               <tr className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
                 <td colSpan={3} className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                   Total
                 </td>
                 <td className="px-5 py-3 text-right text-[13px] font-bold tabular-nums text-[var(--color-text-primary)]">
                   {totals && formatINR(totals.debit)}
                 </td>
                 <td className="px-5 py-3 text-right text-[13px] font-bold tabular-nums text-[var(--color-text-primary)]">
                   {totals && formatINR(totals.credit)}
                 </td>
               </tr>
             </tfoot>
           </table>
         </div>

         {/* Mobile */}
         <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
           {entry.lines.map((line: JournalEntryLine) => (
             <div key={line.id} className="px-4 py-3">
               <div className="flex items-start justify-between gap-2">
                 <div>
                   <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                     {line.accountName}
                   </p>
                   <p className="text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
                     {line.accountCode}
                   </p>
                 </div>
                 <div className="text-right shrink-0">
                   {line.debit > 0 && (
                     <p className="text-[12px] font-medium tabular-nums text-[var(--color-text-primary)]">
                       Dr {formatINR(line.debit)}
                     </p>
                   )}
                   {line.credit > 0 && (
                     <p className="text-[12px] font-medium tabular-nums text-[var(--color-text-primary)]">
                       Cr {formatINR(line.credit)}
                     </p>
                   )}
                 </div>
               </div>
               {line.description && (
                 <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                   {line.description}
                 </p>
               )}
             </div>
           ))}
         </div>

         {/* Balance check indicator */}
         {!isBalanced && (
           <div className="flex items-center gap-2 px-5 py-2.5 border-t border-[var(--color-border-subtle)] bg-[var(--color-error-subtle)] text-[12px] text-[var(--color-error)]">
             <AlertCircle size={13} />
             This journal entry is not balanced — debits and credits do not match.
           </div>
         )}
       </div>

       {/* Reverse modals */}
       <ReverseModal
         isOpen={reverseModal === 'single'}
         isCascade={false}
         onClose={() => setReverseModal(null)}
         onConfirm={handleReverse}
         isLoading={reverseLoading}
         referenceNumber={entry.referenceNumber}
       />
       <ReverseModal
         isOpen={reverseModal === 'cascade'}
         isCascade
         onClose={() => setReverseModal(null)}
         onConfirm={handleReverse}
         isLoading={reverseLoading}
         referenceNumber={entry.referenceNumber}
       />
     </div>
   );
 }

 /**
  * JournalsPage
  *
  * Journal Entries list with:
  *  1. Paginated DataTable with search/filter (keyword + date range)
  *  2. Create journal entry modal — dynamic add/remove debit/credit lines,
  *     account selector, real-time balance validation (debits must equal credits),
  *     submit disabled if imbalanced
  *  3. Reverse journal entry action with ConfirmDialog
  *  4. Cascade-reverse action for journals with downstream entries
  *  5. Navigate to journal detail on row click
  *
  * API endpoints:
  *  GET  /api/v1/accounting/journals
  *  GET  /api/v1/accounting/accounts
  *  POST /api/v1/accounting/journals/manual
  *  POST /api/v1/accounting/journals/{id}/reverse
  *  POST /api/v1/accounting/journal-entries/{id}/cascade-reverse
  */

 import { useState, useCallback, useEffect, useMemo, useId } from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   Plus,
   Search,
   AlertCircle,
   RefreshCcw,
   RotateCcw,
   ChevronsRight,
   Trash2,
   ChevronLeft,
   ChevronRight,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { v4 as uuidv4 } from 'uuid';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { EmptyState } from '@/components/ui/EmptyState';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
 import {
   accountingApi,
   type JournalListItem,
   type AccountDto,
   type JournalEntryDto,
  type SupplierResponse,
 } from '@/lib/accountingApi';
import { requiresSupplierContextAccount } from '@/lib/accountingAccountHelpers';

 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────

 const PAGE_SIZE = 20;

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 0,
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
 // Journal Line (for create modal)
 // ─────────────────────────────────────────────────────────────────────────────

 interface DraftLine {
   id: string;
   accountId: string;
   debit: string;
   credit: string;
   description: string;
 }

 function emptyLine(): DraftLine {
   return { id: uuidv4(), accountId: '', debit: '', credit: '', description: '' };
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Create Journal Modal
 // ─────────────────────────────────────────────────────────────────────────────

 interface CreateJournalModalProps {
   isOpen: boolean;
   onClose: () => void;
   onCreated: (entry: JournalEntryDto) => void;
   accounts: AccountDto[];
  suppliers: SupplierResponse[];
 }

 function CreateJournalModal({
   isOpen,
   onClose,
   onCreated,
   accounts,
  suppliers,
 }: CreateJournalModalProps) {
   const formId = useId();
   const [entryDate, setEntryDate] = useState(todayISO);
   const [narration, setNarration] = useState('');
  const [supplierId, setSupplierId] = useState('');
   const [lines, setLines] = useState<DraftLine[]>([emptyLine(), emptyLine()]);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState('');

   const updateLine = useCallback(
     (id: string, field: keyof DraftLine, value: string) => {
       setLines((prev) =>
         prev.map((l) => {
           if (l.id !== id) return l;
           const updated = { ...l, [field]: value };
           // Mutual exclusion: entering debit clears credit, and vice versa
           if (field === 'debit' && value) updated.credit = '';
           if (field === 'credit' && value) updated.debit = '';
           return updated;
         })
       );
     },
     []
   );

   const removeLine = useCallback((id: string) => {
     setLines((prev) => (prev.length <= 2 ? prev : prev.filter((l) => l.id !== id)));
   }, []);

   const totals = useMemo(() => {
     const debit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
     const credit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
     return {
       debit,
       credit,
       balanced: Math.abs(debit - credit) < 0.01 && debit > 0,
     };
   }, [lines]);

   const accountOptions = useMemo(
     () =>
       accounts.map((a) => ({
         value: String(a.id),
         label: `${a.code} — ${a.name}`,
       })),
     [accounts]
   );

  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );

  const supplierRequired = useMemo(
    () =>
      lines.some((line) =>
        requiresSupplierContextAccount(accountsById.get(Number(line.accountId)))
      ),
    [accountsById, lines]
  );

  const supplierOptions = useMemo(
    () => [
      {
        value: '',
        label: suppliers.length > 0 ? 'Select supplier...' : 'No suppliers available',
      },
      ...suppliers
        .filter((supplier) => supplier.status !== 'SUSPENDED')
        .map((supplier) => ({
          value: String(supplier.id),
          label: supplier.code ? `${supplier.name} (${supplier.code})` : supplier.name,
        })),
    ],
    [suppliers]
  );

   const handleReset = () => {
     setEntryDate(todayISO());
     setNarration('');
    setSupplierId('');
     setLines([emptyLine(), emptyLine()]);
     setSubmitError('');
   };

   const handleSubmit = async () => {
     if (!totals.balanced) return;
     const validLines = lines.filter(
       (l) => l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0)
     );
     if (validLines.length < 2) {
       setSubmitError('At least two lines with valid amounts are required.');
       return;
     }
    if (supplierRequired && !supplierId) {
      setSubmitError('Select a supplier when posting to Accounts Payable.');
      return;
    }
     setSubmitError('');
     setIsSubmitting(true);
     try {
       const result = await accountingApi.createManualJournal({
         entryDate,
         narration: narration.trim() || undefined,
        supplierId: supplierRequired ? Number(supplierId) : undefined,
         idempotencyKey: uuidv4(),
         lines: validLines.map((l) => ({
           accountId: Number(l.accountId),
           debit: parseFloat(l.debit) || 0,
           credit: parseFloat(l.credit) || 0,
           description: l.description.trim() || undefined,
         })),
       });
       onCreated(result);
       handleReset();
       onClose();
     } catch (err: unknown) {
       const message =
         err instanceof Error ? err.message : 'Failed to post journal. Please try again.';
       setSubmitError(message);
     } finally {
       setIsSubmitting(false);
     }
   };

   if (!isOpen) return null;

   return (
     <div className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[3vh]">
       <div
         className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px]"
         onClick={onClose}
         style={{ animation: 'fadeIn 200ms ease-out forwards' }}
       />
       <div
         className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] flex flex-col mx-4 overflow-hidden"
         style={{
           boxShadow: 'var(--shadow-modal)',
           animation: 'slideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
         }}
       >
         {/* Header */}
         <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
           <div>
             <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
               New Journal Entry
             </h2>
             <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
               Debits must equal credits before posting.
             </p>
           </div>
           <button
             type="button"
             onClick={onClose}
             className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors text-[var(--color-text-tertiary)]"
           >
             <Trash2 size={15} />
           </button>
         </div>

         {/* Body */}
         <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
           {submitError && (
             <div className="flex items-center gap-2 text-[12px] text-[var(--color-error)] bg-[var(--color-error-subtle)] rounded-lg px-3 py-2">
               <AlertCircle size={13} />
               {submitError}
             </div>
           )}

           {/* Meta fields */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div>
               <label
                 htmlFor={`${formId}-date`}
                 className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] mb-1.5"
               >
                 Entry Date
               </label>
               <input
                 id={`${formId}-date`}
                 type="date"
                 value={entryDate}
                 onChange={(e) => setEntryDate(e.target.value)}
                 className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:border-[var(--color-neutral-400)]"
               />
             </div>
             <div>
               <label
                 htmlFor={`${formId}-narration`}
                 className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] mb-1.5"
               >
                 Narration
               </label>
               <input
                 id={`${formId}-narration`}
                 type="text"
                 value={narration}
                 onChange={(e) => setNarration(e.target.value)}
                 placeholder="Entry description (optional)"
                 className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-none focus-visible:border-[var(--color-neutral-400)]"
               />
             </div>
           </div>

           {supplierRequired && (
             <div>
               <Select
                 label="Supplier *"
                 value={supplierId}
                 onChange={(e) => setSupplierId(e.target.value)}
                 options={supplierOptions}
                 hint={
                   suppliers.length > 0
                     ? 'Required because one or more lines use a supplier payable account.'
                     : 'No suppliers are available yet, so Accounts Payable journals cannot be posted.'
                 }
               />
             </div>
           )}

           {/* Lines — desktop table */}
           <div className="hidden sm:block border border-[var(--color-border-default)] rounded-xl overflow-hidden">
             <table className="w-full">
               <thead>
                 <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-default)]">
                   {['Account', 'Debit (INR)', 'Credit (INR)', 'Description', ''].map(
                     (h, i) => (
                       <th
                         key={h || i}
                         className={clsx(
                           'px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]',
                           i === 1 || i === 2 ? 'text-right' : 'text-left',
                           i === 4 ? 'w-8' : '',
                         )}
                       >
                         {h}
                       </th>
                     )
                   )}
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--color-border-subtle)]">
                 {lines.map((line) => (
                   <tr key={line.id}>
                     <td className="px-2 py-1.5 w-[35%]">
                       <select
                         value={line.accountId}
                         onChange={(e) => updateLine(line.id, 'accountId', e.target.value)}
                         className="w-full h-8 px-2 border border-transparent rounded-md text-[13px] bg-transparent text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none"
                       >
                         <option value="">Select account</option>
                         {accountOptions.map((o) => (
                           <option key={o.value} value={o.value}>
                             {o.label}
                           </option>
                         ))}
                       </select>
                     </td>
                     <td className="px-2 py-1.5 w-[18%]">
                       <input
                         type="number"
                         step="0.01"
                         min="0"
                         value={line.debit}
                         onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                         placeholder="0.00"
                         className="w-full h-8 px-2 border border-transparent rounded-md text-[13px] text-right tabular-nums bg-transparent text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none placeholder:text-[var(--color-text-tertiary)]"
                       />
                     </td>
                     <td className="px-2 py-1.5 w-[18%]">
                       <input
                         type="number"
                         step="0.01"
                         min="0"
                         value={line.credit}
                         onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                         placeholder="0.00"
                         className="w-full h-8 px-2 border border-transparent rounded-md text-[13px] text-right tabular-nums bg-transparent text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none placeholder:text-[var(--color-text-tertiary)]"
                       />
                     </td>
                     <td className="px-2 py-1.5">
                       <input
                         type="text"
                         value={line.description}
                         onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                         placeholder="Note"
                         className="w-full h-8 px-2 border border-transparent rounded-md text-[13px] bg-transparent text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none placeholder:text-[var(--color-text-tertiary)]"
                       />
                     </td>
                     <td className="px-1 py-1.5">
                       <button
                         type="button"
                         onClick={() => removeLine(line.id)}
                         disabled={lines.length <= 2}
                         className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] disabled:opacity-30 transition-colors"
                         aria-label="Remove line"
                       >
                         <Trash2 size={12} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
               <tfoot>
                 <tr className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
                   <td className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                     Total
                   </td>
                   <td className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                     {totals.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                   </td>
                   <td className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                     {totals.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                   </td>
                   <td colSpan={2} />
                 </tr>
               </tfoot>
             </table>
           </div>

           {/* Lines — mobile cards */}
           <div className="sm:hidden space-y-3">
             {lines.map((line, idx) => (
               <div
                 key={line.id}
                 className="border border-[var(--color-border-default)] rounded-xl p-3 space-y-2"
               >
                 <div className="flex items-center justify-between">
                   <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                     Line {idx + 1}
                   </span>
                   <button
                     type="button"
                     onClick={() => removeLine(line.id)}
                     disabled={lines.length <= 2}
                     className="h-6 w-6 flex items-center justify-center rounded text-[var(--color-text-tertiary)] disabled:opacity-30"
                     aria-label="Remove line"
                   >
                     <Trash2 size={12} />
                   </button>
                 </div>
                 <select
                   value={line.accountId}
                   onChange={(e) => updateLine(line.id, 'accountId', e.target.value)}
                   className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none"
                 >
                   <option value="">Select account</option>
                   {accountOptions.map((o) => (
                     <option key={o.value} value={o.value}>
                       {o.label}
                     </option>
                   ))}
                 </select>
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">
                       Debit
                     </label>
                     <input
                       type="number"
                       step="0.01"
                       value={line.debit}
                       onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                       placeholder="0.00"
                       className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] text-right tabular-nums bg-[var(--color-surface-primary)] focus:outline-none"
                     />
                   </div>
                   <div>
                     <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">
                       Credit
                     </label>
                     <input
                       type="number"
                       step="0.01"
                       value={line.credit}
                       onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                       placeholder="0.00"
                       className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] text-right tabular-nums bg-[var(--color-surface-primary)] focus:outline-none"
                     />
                   </div>
                 </div>
                 <input
                   type="text"
                   value={line.description}
                   onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                   placeholder="Description"
                   className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
                 />
               </div>
             ))}
           </div>

           {/* Add line + balance indicator */}
           <div className="flex items-center justify-between">
             <button
               type="button"
               onClick={() => setLines((prev) => [...prev, emptyLine()])}
               className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
             >
               <Plus size={14} />
               Add line
             </button>

             {!totals.balanced && totals.debit + totals.credit > 0 && (
               <div className="flex items-center gap-1.5 text-[var(--color-warning-icon)]">
                 <AlertCircle size={12} />
                 <span className="text-[11px] font-medium">
                   Out of balance:{' '}
                   {Math.abs(totals.debit - totals.credit).toLocaleString('en-IN', {
                     minimumFractionDigits: 2,
                   })}
                 </span>
               </div>
             )}
             {totals.balanced && totals.debit > 0 && (
               <div className="flex items-center gap-1.5 text-[var(--color-success-icon)]">
                 <span className="text-[11px] font-medium">Balanced</span>
               </div>
             )}
           </div>
         </div>

         {/* Footer */}
         <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
           <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
             Cancel
           </Button>
           <Button
             variant="primary"
             onClick={() => void handleSubmit()}
             isLoading={isSubmitting}
             disabled={!totals.balanced || (supplierRequired && !supplierId)}
           >
             Post Entry
           </Button>
         </div>
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Reverse Journal Modal
 // ─────────────────────────────────────────────────────────────────────────────

 interface ReverseModalProps {
   journal: JournalListItem;
   isCascade: boolean;
   isOpen: boolean;
   onClose: () => void;
   onConfirmed: (journal: JournalListItem, reason: string, reversalDate: string, cascade: boolean) => Promise<void>;
   isLoading: boolean;
 }

 function ReverseModal({
   journal,
   isCascade,
   isOpen,
   onClose,
   onConfirmed,
   isLoading,
 }: ReverseModalProps) {
   const [reason, setReason] = useState('');
   const [reversalDate, setReversalDate] = useState(todayISO);

   if (!isOpen) return null;

   return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       title={isCascade ? 'Cascade Reverse Journal' : 'Reverse Journal'}
       description={
         isCascade
           ? 'This will reverse the journal and all related downstream entries.'
           : `Create a mirrored reversal of journal ${journal.referenceNumber}.`
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
             onClick={() => void onConfirmed(journal, reason, reversalDate, isCascade)}
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
               Cascade reverse will create mirrored reversal entries for all downstream
               journal entries linked to this one.
             </span>
           </div>
         )}
       </div>
     </Modal>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function JournalsPage() {
   const navigate = useNavigate();

   // Data
   const [journals, setJournals] = useState<JournalListItem[]>([]);
   const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [hasError, setHasError] = useState(false);

   // Filters
   const [keyword, setKeyword] = useState('');
   const [fromDate, setFromDate] = useState('');
   const [toDate, setToDate] = useState('');

   // Pagination
   const [page, setPage] = useState(0);

   // Modals
   const [createOpen, setCreateOpen] = useState(false);
   const [reverseTarget, setReverseTarget] = useState<{
     journal: JournalListItem;
     cascade: boolean;
   } | null>(null);
   const [reverseLoading, setReverseLoading] = useState(false);

   const loadJournals = useCallback(async () => {
     setLoading(true);
     setHasError(false);
     try {
      const [journalsData, accountsData, suppliersData] = await Promise.all([
         accountingApi.getJournalsFiltered({ fromDate, toDate }),
         accountingApi.getAccounts(),
        accountingApi.getSuppliers().catch(() => [] as SupplierResponse[]),
       ]);
       setJournals(journalsData);
       setAccounts(accountsData);
      setSuppliers(suppliersData);
     } catch {
       setHasError(true);
     } finally {
       setLoading(false);
     }
   }, [fromDate, toDate]);

   useEffect(() => {
     void loadJournals();
     setPage(0);
   }, [loadJournals]);

   // Client-side keyword filter
   const filtered = useMemo(() => {
     const q = keyword.toLowerCase().trim();
     if (!q) return journals;
     return journals.filter(
       (j) =>
         j.referenceNumber?.toLowerCase().includes(q) ||
         j.memo?.toLowerCase().includes(q) ||
         j.journalType?.toLowerCase().includes(q) ||
         j.sourceModule?.toLowerCase().includes(q)
     );
   }, [journals, keyword]);

   const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
   const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

   const handleJournalCreated = useCallback((entry: JournalEntryDto) => {
     const newItem: JournalListItem = {
       id: entry.id,
       referenceNumber: entry.referenceNumber,
       entryDate: entry.entryDate,
       memo: entry.memo,
       status: entry.status,
       journalType: 'MANUAL',
       sourceModule: 'MANUAL',
       sourceReference: '',
       totalDebit: entry.lines.reduce((s, l) => s + l.debit, 0),
       totalCredit: entry.lines.reduce((s, l) => s + l.credit, 0),
     };
     setJournals((prev) => [newItem, ...prev]);
   }, []);

   const handleReverse = useCallback(
     async (
       journal: JournalListItem,
       reason: string,
       reversalDate: string,
       cascade: boolean
     ) => {
       setReverseLoading(true);
       try {
         if (cascade) {
           await accountingApi.cascadeReverseJournal(journal.id, {
             reversalDate,
             reason,
             cascadeRelatedEntries: true,
           });
         } else {
           await accountingApi.reverseJournal(journal.id, { reversalDate, reason });
         }
         setReverseTarget(null);
         void loadJournals();
       } catch {
         // Error stays in modal via parent error handling
       } finally {
         setReverseLoading(false);
       }
     },
     [loadJournals]
   );

   return (
     <div className="space-y-4">
       {/* Page header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
             Journal Entries
           </h1>
           <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
             All manual and system-generated journal entries
           </p>
         </div>
         <Button
           variant="primary"
           size="sm"
           leftIcon={<Plus />}
           onClick={() => setCreateOpen(true)}
         >
           New Journal
         </Button>
       </div>

       {/* Filters */}
       <div className="flex flex-wrap items-center gap-3">
         {/* Keyword search */}
         <div className="relative flex-1 min-w-[200px] max-w-sm">
           <Search
             size={14}
             className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
           />
           <input
             type="text"
             value={keyword}
             onChange={(e) => {
               setKeyword(e.target.value);
               setPage(0);
             }}
             placeholder="Search journals…"
             className="w-full h-9 pl-8 pr-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-400)]"
           />
         </div>

         {/* Date range */}
         <div className="flex items-center gap-2">
           <input
             type="date"
             value={fromDate}
             onChange={(e) => setFromDate(e.target.value)}
             className="h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-neutral-400)]"
             aria-label="From date"
           />
           <span className="text-[11px] text-[var(--color-text-tertiary)]">to</span>
           <input
             type="date"
             value={toDate}
             onChange={(e) => setToDate(e.target.value)}
             className="h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-neutral-400)]"
             aria-label="To date"
           />
           {(fromDate || toDate) && (
             <button
               type="button"
               onClick={() => {
                 setFromDate('');
                 setToDate('');
               }}
               className="text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
             >
               Clear
             </button>
           )}
         </div>
       </div>

       {/* Table */}
       <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
         {loading ? (
           <div className="divide-y divide-[var(--color-border-subtle)]">
             <div className="px-4 py-2.5 bg-[var(--color-surface-secondary)] grid grid-cols-6 gap-4">
               {Array.from({ length: 6 }).map((_, i) => (
                 <Skeleton key={i} height={14} />
               ))}
             </div>
             {Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="px-4 py-3 grid grid-cols-6 gap-4">
                 {Array.from({ length: 6 }).map((_, j) => (
                   <Skeleton key={j} height={16} />
                 ))}
               </div>
             ))}
           </div>
         ) : hasError ? (
           <div className="flex flex-col items-center gap-3 py-16 text-center">
             <AlertCircle size={28} className="text-[var(--color-text-tertiary)]" />
             <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
               Couldn't load journal entries
             </p>
             <Button
               variant="secondary"
               size="sm"
               leftIcon={<RefreshCcw />}
               onClick={() => void loadJournals()}
             >
               Try again
             </Button>
           </div>
         ) : paginated.length === 0 ? (
           <div className="py-16 px-4">
             <EmptyState
               title={
                 keyword || fromDate || toDate
                   ? 'No journals match your filters'
                   : 'No journal entries yet'
               }
               description={
                 keyword || fromDate || toDate
                   ? 'Try adjusting your search or date range.'
                   : 'Create your first journal entry to get started.'
               }
             />
           </div>
         ) : (
           <>
             {/* Desktop table */}
             <div className="hidden sm:block overflow-x-auto">
               <table className="w-full">
                 <thead>
                   <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-default)]">
                     {[
                       { label: 'Reference', align: 'left' },
                       { label: 'Date', align: 'left' },
                       { label: 'Description', align: 'left' },
                       { label: 'Status', align: 'left' },
                       { label: 'Debit', align: 'right' },
                       { label: 'Credit', align: 'right' },
                       { label: '', align: 'right' },
                     ].map(({ label, align }, i) => (
                       <th
                         key={label || i}
                         className={clsx(
                           'px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]',
                           align === 'right' ? 'text-right' : 'text-left',
                         )}
                       >
                         {label}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--color-border-subtle)]">
                   {paginated.map((j) => (
                     <tr
                       key={j.id}
                       onClick={() => navigate(`/accounting/journals/${j.id}`)}
                       className="hover:bg-[var(--color-surface-secondary)] cursor-pointer transition-colors group"
                     >
                       <td className="px-4 py-3">
                         <span className="text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">
                           {j.referenceNumber}
                         </span>
                       </td>
                       <td className="px-4 py-3">
                         <span className="text-[12px] tabular-nums text-[var(--color-text-secondary)] whitespace-nowrap">
                           {formatDate(j.entryDate)}
                         </span>
                       </td>
                       <td className="px-4 py-3 max-w-[220px]">
                         <span className="text-[12px] text-[var(--color-text-secondary)] truncate block">
                           {j.memo || j.journalType}
                         </span>
                       </td>
                       <td className="px-4 py-3">
                         <JournalStatusBadge status={j.status} />
                       </td>
                       <td className="px-4 py-3 text-right">
                         <span className="text-[12px] tabular-nums text-[var(--color-text-primary)]">
                           {formatINR(j.totalDebit)}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-right">
                         <span className="text-[12px] tabular-nums text-[var(--color-text-primary)]">
                           {formatINR(j.totalCredit)}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-right">
                         <div
                           className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={(e) => e.stopPropagation()}
                         >
                           {j.status === 'POSTED' && (
                             <>
                               <button
                                 type="button"
                                 title="Reverse"
                                 onClick={() =>
                                   setReverseTarget({ journal: j, cascade: false })
                                 }
                                 className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] transition-colors"
                               >
                                 <RotateCcw size={13} />
                               </button>
                               <button
                                 type="button"
                                 title="Cascade reverse"
                                 onClick={() =>
                                   setReverseTarget({ journal: j, cascade: true })
                                 }
                                 className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] transition-colors"
                               >
                                 <ChevronsRight size={13} />
                               </button>
                             </>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>

             {/* Mobile cards */}
             <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
               {paginated.map((j) => (
                 <button
                   key={j.id}
                   type="button"
                   onClick={() => navigate(`/accounting/journals/${j.id}`)}
                   className="w-full text-left px-4 py-3 hover:bg-[var(--color-surface-secondary)] transition-colors"
                 >
                   <div className="flex items-center justify-between gap-2">
                     <span className="text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">
                       {j.referenceNumber}
                     </span>
                     <JournalStatusBadge status={j.status} />
                   </div>
                   <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)] truncate">
                     {j.memo || j.journalType} · {formatDate(j.entryDate)}
                   </p>
                   <p className="mt-1 text-[12px] tabular-nums text-[var(--color-text-secondary)]">
                     Dr {formatINR(j.totalDebit)} / Cr {formatINR(j.totalCredit)}
                   </p>
                 </button>
               ))}
             </div>

             {/* Pagination */}
             {totalPages > 1 && (
               <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-subtle)]">
                 <p className="text-[11px] text-[var(--color-text-tertiary)]">
                   {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{' '}
                   {filtered.length} entries
                 </p>
                 <div className="flex items-center gap-1">
                   <button
                     type="button"
                     onClick={() => setPage((p) => Math.max(0, p - 1))}
                     disabled={page === 0}
                     className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] disabled:opacity-30 transition-colors"
                     aria-label="Previous page"
                   >
                     <ChevronLeft size={14} />
                   </button>
                   <span className="text-[12px] font-medium text-[var(--color-text-secondary)] px-2">
                     {page + 1} / {totalPages}
                   </span>
                   <button
                     type="button"
                     onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                     disabled={page >= totalPages - 1}
                     className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] disabled:opacity-30 transition-colors"
                     aria-label="Next page"
                   >
                     <ChevronRight size={14} />
                   </button>
                 </div>
               </div>
             )}
           </>
         )}
       </div>

       {/* Modals */}
       <CreateJournalModal
         isOpen={createOpen}
         onClose={() => setCreateOpen(false)}
         onCreated={handleJournalCreated}
         accounts={accounts}
          suppliers={suppliers}
       />

       {reverseTarget && (
         <ReverseModal
           journal={reverseTarget.journal}
           isCascade={reverseTarget.cascade}
           isOpen
           onClose={() => setReverseTarget(null)}
           onConfirmed={handleReverse}
           isLoading={reverseLoading}
         />
       )}
     </div>
   );
 }

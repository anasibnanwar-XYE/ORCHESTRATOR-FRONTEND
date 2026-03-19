 /**
  * BankReconciliationPage
  *
  * Persistent bank-reconciliation session workflow.
  *
  * Behaviour:
  *  - Sessions list view: shows all previous sessions with status and date context.
  *  - "New Session" button opens a create form (bank account, statement date, closing balance).
  *  - Session detail view: shows line items with per-row cleared toggle.
  *  - "Save Progress" button posts updated cleared IDs back to the backend.
  *  - "Complete Session" button locks the session into a non-editable COMPLETED state.
  *  - Completed sessions are read-only; draft sessions are resumable.
  *  - Readiness indicator is shown after completion.
  *
  * API:
  *  POST /api/v1/accounting/reconciliation/bank/sessions            (create)
  *  GET  /api/v1/accounting/reconciliation/bank/sessions            (list)
  *  GET  /api/v1/accounting/reconciliation/bank/sessions/{id}       (detail / resume)
  *  PUT  /api/v1/accounting/reconciliation/bank/sessions/{id}/items (update cleared)
  *  POST /api/v1/accounting/reconciliation/bank/sessions/{id}/complete (complete)
  *  GET  /api/v1/accounting/accounts                                (bank account picker)
  */

 import { useState, useEffect, useCallback } from 'react';
 import {
   ArrowLeft,
   Plus,
   RefreshCcw,
   CheckCircle2,
   Clock,
   AlertCircle,
   ChevronRight,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Badge } from '@/components/ui/Badge';
 import { useToast } from '@/components/ui/Toast';
 import {
   accountingApi,
   bankReconciliationApi,
   type AccountDto,
   type BankReconciliationSessionSummaryDto,
   type BankReconciliationSessionDetailDto,
   type BankReconciliationItem,
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

 function formatDate(s: string): string {
   try { return format(parseISO(s), 'dd MMM yyyy'); } catch { return s; }
 }

 function formatDateTime(s: string): string {
   try { return format(parseISO(s), 'dd MMM yyyy HH:mm'); } catch { return s; }
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Sub-views
 // ─────────────────────────────────────────────────────────────────────────────

 /** Session create form */
 interface CreateSessionFormProps {
   accounts: AccountDto[];
   onCancel: () => void;
   onCreated: (session: BankReconciliationSessionSummaryDto) => void;
 }

 function CreateSessionForm({ accounts, onCancel, onCreated }: CreateSessionFormProps) {
   const toast = useToast();
   const [bankAccountId, setBankAccountId] = useState<string>('');
   const [statementDate, setStatementDate] = useState<string>(
     format(new Date(), 'yyyy-MM-dd')
   );
   const [closingBalance, setClosingBalance] = useState<string>('');
   const [openingBalance, setOpeningBalance] = useState<string>('');
   const [memo, setMemo] = useState<string>('');
   const [submitting, setSubmitting] = useState(false);

   const assetAccounts = accounts.filter(
     (a) => a.type === 'ASSET' || (a.type as string).includes('ASSET')
   );

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!bankAccountId || !statementDate || !closingBalance) return;

     setSubmitting(true);
     try {
       const session = await bankReconciliationApi.createSession({
         bankAccountId: Number(bankAccountId),
         statementDate,
         closingBalance: parseFloat(closingBalance),
         openingBalance: openingBalance ? parseFloat(openingBalance) : undefined,
         memo: memo.trim() || undefined,
       });
       toast.success('Session created', 'Bank reconciliation session started.');
       onCreated(session);
     } catch {
       toast.error('Could not create session', 'Please check your inputs and try again.');
     } finally {
       setSubmitting(false);
     }
   };

   return (
     <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-5 max-w-lg">
       <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-4">
         New Reconciliation Session
       </h2>
       <form onSubmit={handleSubmit} className="space-y-4">
         {/* Bank account */}
         <div>
           <label
             htmlFor="bankAccountId"
             className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1"
           >
             Bank Account <span className="text-[var(--color-error)]">*</span>
           </label>
           <select
             id="bankAccountId"
             value={bankAccountId}
             onChange={(e) => setBankAccountId(e.target.value)}
             required
             className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]"
           >
             <option value="">Select account</option>
             {assetAccounts.map((a) => (
               <option key={a.id} value={a.id}>
                 {a.code} — {a.name}
               </option>
             ))}
           </select>
         </div>

         {/* Statement date */}
         <div>
           <label
             htmlFor="statementDate"
             className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1"
           >
             Statement Date <span className="text-[var(--color-error)]">*</span>
           </label>
           <input
             id="statementDate"
             type="date"
             value={statementDate}
             onChange={(e) => setStatementDate(e.target.value)}
             required
             className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]"
           />
         </div>

         {/* Closing balance */}
         <div>
           <label
             htmlFor="closingBalance"
             className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1"
           >
             Statement Closing Balance <span className="text-[var(--color-error)]">*</span>
           </label>
           <input
             id="closingBalance"
             type="number"
             step="0.01"
             placeholder="0.00"
             value={closingBalance}
             onChange={(e) => setClosingBalance(e.target.value)}
             required
             className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]"
           />
         </div>

         {/* Opening balance (optional) */}
         <div>
           <label
             htmlFor="openingBalance"
             className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1"
           >
             Statement Opening Balance
           </label>
           <input
             id="openingBalance"
             type="number"
             step="0.01"
             placeholder="0.00"
             value={openingBalance}
             onChange={(e) => setOpeningBalance(e.target.value)}
             className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]"
           />
         </div>

         {/* Memo */}
         <div>
           <label
             htmlFor="memo"
             className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1"
           >
             Memo
           </label>
           <input
             id="memo"
             type="text"
             placeholder="Optional notes"
             value={memo}
             onChange={(e) => setMemo(e.target.value)}
             className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]"
           />
         </div>

         <div className="flex items-center gap-2 pt-1">
           <Button type="submit" variant="primary" size="sm" disabled={submitting}>
             {submitting ? 'Creating...' : 'Start Session'}
           </Button>
           <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
             Cancel
           </Button>
         </div>
       </form>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Session detail view (resume / complete)
 // ─────────────────────────────────────────────────────────────────────────────

 interface SessionDetailViewProps {
   session: BankReconciliationSessionDetailDto;
   onBack: () => void;
   onSessionUpdated: (session: BankReconciliationSessionDetailDto) => void;
 }

 function SessionDetailView({ session, onBack, onSessionUpdated }: SessionDetailViewProps) {
   const toast = useToast();
   const [items, setItems] = useState<BankReconciliationItem[]>(session.items ?? []);
   const [saving, setSaving] = useState(false);
   const [completing, setCompleting] = useState(false);

   const isCompleted = session.status === 'COMPLETED';
   const clearedIds = items.filter((i) => i.cleared).map((i) => i.transactionId);
   const clearedBalance = items
     .filter((i) => i.cleared)
     .reduce((sum, i) => sum + (i.credit - i.debit), 0);
   const difference = session.closingBalance - clearedBalance;

   const handleToggle = (transactionId: number) => {
     if (isCompleted) return;
     setItems((prev) =>
       prev.map((item) =>
         item.transactionId === transactionId ? { ...item, cleared: !item.cleared } : item
       )
     );
   };

   const handleSave = async () => {
     setSaving(true);
     try {
       const updated = await bankReconciliationApi.updateSessionItems(session.sessionId, {
         clearedTransactionIds: clearedIds,
       });
       setItems(updated.items ?? []);
       onSessionUpdated(updated);
       toast.success('Progress saved', 'Cleared items have been updated.');
     } catch {
       toast.error('Save failed', 'Could not save progress. Please try again.');
     } finally {
       setSaving(false);
     }
   };

   const handleComplete = async () => {
     setCompleting(true);
     try {
       const completed = await bankReconciliationApi.completeSession(session.sessionId);
       onSessionUpdated(completed);
       toast.success('Session completed', 'Bank reconciliation session has been completed.');
     } catch {
       toast.error('Complete failed', 'Could not complete the session. Please try again.');
     } finally {
       setCompleting(false);
     }
   };

   return (
     <div className="space-y-4">
       {/* Header bar */}
       <div className="flex flex-wrap items-center gap-3">
         <Button
           variant="ghost"
           size="sm"
           leftIcon={<ArrowLeft size={13} />}
           onClick={onBack}
         >
           All Sessions
         </Button>
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 flex-wrap">
             <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
               {session.bankAccountName ?? `Account #${session.bankAccountId}`}
             </h2>
             <Badge variant={isCompleted ? 'success' : 'warning'} dot>
               {isCompleted ? 'Completed' : 'Draft'}
             </Badge>
           </div>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
             Statement date: {formatDate(session.statementDate)}
             {isCompleted && session.completedAt
               ? ` · Completed ${formatDateTime(session.completedAt)}`
               : ''}
           </p>
         </div>
       </div>

       {/* Summary cards */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
           <p className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-widest">
             Statement Balance
           </p>
           <p className="mt-1 text-[20px] font-semibold tabular-nums text-[var(--color-text-primary)]">
             {formatINR(session.closingBalance)}
           </p>
         </div>
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
           <p className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-widest">
             Cleared Balance
           </p>
           <p className="mt-1 text-[20px] font-semibold tabular-nums text-[var(--color-text-primary)]">
             {formatINR(clearedBalance)}
           </p>
           <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
             {clearedIds.length} item{clearedIds.length !== 1 ? 's' : ''} cleared
           </p>
         </div>
         <div className={clsx(
           'rounded-xl border p-4',
           Math.abs(difference) < 0.01
             ? 'border-[var(--color-border-default)] bg-[var(--color-surface-primary)]'
             : 'border-[var(--color-error-border-subtle)] bg-[var(--color-error-bg)]',
         )}>
           <p className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-widest">
             Difference
           </p>
           <p className={clsx(
             'mt-1 text-[20px] font-semibold tabular-nums',
             Math.abs(difference) < 0.01
               ? 'text-[var(--color-success-icon)]'
               : 'text-[var(--color-error)]',
           )}>
             {formatINR(difference)}
           </p>
           {Math.abs(difference) < 0.01 && (
             <p className="mt-0.5 text-[11px] text-[var(--color-success-icon)]">Balanced</p>
           )}
         </div>
       </div>

       {/* Line items */}
       {items.length === 0 ? (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-8 text-center">
           <p className="text-[13px] text-[var(--color-text-tertiary)]">
             No transactions found for this bank account and period.
           </p>
         </div>
       ) : (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
             <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
               Transactions ({items.length})
             </h3>
             {!isCompleted && (
               <p className="text-[11px] text-[var(--color-text-tertiary)]">
                 Check each transaction that appears on the bank statement
               </p>
             )}
           </div>
           <div className="divide-y divide-[var(--color-border-subtle)]">
             {items.map((item) => (
               <div
                 key={item.transactionId}
                 className={clsx(
                   'flex items-center gap-3 px-4 py-3 transition-colors',
                   !isCompleted && 'hover:bg-[var(--color-surface-secondary)] cursor-pointer',
                 )}
                 onClick={() => handleToggle(item.transactionId)}
               >
                 {/* Checkbox */}
                 <div className={clsx(
                   'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                   item.cleared
                     ? 'bg-[var(--color-neutral-900)] border-[var(--color-neutral-900)]'
                     : 'border-[var(--color-border-default)]',
                   isCompleted && 'cursor-default',
                 )}>
                   {item.cleared && (
                     <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                       <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                     </svg>
                   )}
                 </div>

                 {/* Date and description */}
                 <div className="flex-1 min-w-0">
                   <p className="text-[13px] text-[var(--color-text-primary)] truncate">
                     {item.description || item.referenceNumber || `Transaction #${item.transactionId}`}
                   </p>
                   <p className="text-[11px] text-[var(--color-text-tertiary)]">
                     {formatDate(item.entryDate)}
                     {item.referenceNumber ? ` · ${item.referenceNumber}` : ''}
                   </p>
                 </div>

                 {/* Debit / Credit */}
                 <div className="text-right shrink-0">
                   {item.debit > 0 && (
                     <p className="text-[13px] tabular-nums text-[var(--color-error)]">
                       -{formatINR(item.debit)}
                     </p>
                   )}
                   {item.credit > 0 && (
                     <p className="text-[13px] tabular-nums text-[var(--color-success-icon)]">
                       +{formatINR(item.credit)}
                     </p>
                   )}
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

       {/* Action bar */}
       {!isCompleted && (
         <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
               {Math.abs(difference) < 0.01
                 ? 'All items balanced — ready to complete'
                 : `Difference of ${formatINR(difference)} remaining`}
             </p>
             <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
               Clear all matching transactions before completing.
             </p>
           </div>
           <div className="flex items-center gap-2">
             <Button
               variant="secondary"
               size="sm"
               onClick={handleSave}
               disabled={saving}
             >
               {saving ? 'Saving...' : 'Save Progress'}
             </Button>
             <Button
               variant="primary"
               size="sm"
               onClick={handleComplete}
               disabled={completing || Math.abs(difference) > 0.01}
             >
               {completing ? 'Completing...' : 'Complete Session'}
             </Button>
           </div>
         </div>
       )}

       {isCompleted && (
         <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
           <CheckCircle2 size={16} className="text-[var(--color-success-icon)] shrink-0" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">
             This reconciliation session is complete and read-only.
             {session.completedAt ? ` Completed on ${formatDateTime(session.completedAt)}.` : ''}
           </p>
         </div>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Session list
 // ─────────────────────────────────────────────────────────────────────────────

 interface SessionListProps {
   sessions: BankReconciliationSessionSummaryDto[];
   onSelect: (session: BankReconciliationSessionSummaryDto) => void;
   onNewSession: () => void;
   loading: boolean;
   error: string | null;
   onRetry: () => void;
 }

 function SessionList({ sessions, onSelect, onNewSession, loading, error, onRetry }: SessionListProps) {
   return (
     <div className="space-y-4">
       {error && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)]">
           <AlertCircle size={16} className="text-[var(--color-error)] shrink-0" />
           <p className="text-[13px] text-[var(--color-error)]">{error}</p>
           <Button variant="secondary" size="sm" onClick={onRetry} className="ml-auto shrink-0">
             Retry
           </Button>
         </div>
       )}

       {loading && (
         <div className="space-y-2">
           {Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} className="h-16 rounded-xl" />
           ))}
         </div>
       )}

       {!loading && !error && sessions.length === 0 && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-8 text-center">
           <Clock size={28} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
             No reconciliation sessions yet
           </p>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1 mb-4">
             Start a new session to begin reconciling your bank account.
           </p>
           <Button variant="primary" size="sm" leftIcon={<Plus size={13} />} onClick={onNewSession}>
             New Session
           </Button>
         </div>
       )}

       {!loading && !error && sessions.length > 0 && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <div className="divide-y divide-[var(--color-border-subtle)]">
             {sessions.map((session) => (
               <button
                 key={session.sessionId}
                 type="button"
                 onClick={() => onSelect(session)}
                 className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-secondary)] transition-colors text-left"
               >
                 <div
                   className={clsx(
                     'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                     session.status === 'COMPLETED'
                       ? 'bg-[var(--color-success-bg)] text-[var(--color-success-icon)]'
                       : 'bg-[var(--color-warning-bg)] text-[var(--color-warning-icon)]',
                   )}
                 >
                   {session.status === 'COMPLETED' ? (
                     <CheckCircle2 size={15} />
                   ) : (
                     <Clock size={15} />
                   )}
                 </div>

                 <div className="flex-1 min-w-0">
                   <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                     {session.bankAccountName ?? `Account #${session.bankAccountId}`}
                   </p>
                   <p className="text-[11px] text-[var(--color-text-tertiary)]">
                     Statement date: {formatDate(session.statementDate)}
                     {session.status === 'COMPLETED' && session.completedAt
                       ? ` · Completed ${formatDate(session.completedAt)}`
                       : ''}
                   </p>
                 </div>

                 <div className="text-right shrink-0 mr-1">
                   <p className="text-[13px] tabular-nums font-medium text-[var(--color-text-primary)]">
                     {formatINR(session.closingBalance)}
                   </p>
                   <Badge
                     variant={session.status === 'COMPLETED' ? 'success' : 'warning'}
                     className="text-[10px]"
                   >
                     {session.status === 'COMPLETED' ? 'Completed' : 'Draft'}
                   </Badge>
                 </div>

                 <ChevronRight size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
               </button>
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

 type View = 'list' | 'create' | 'detail';

 export function BankReconciliationPage() {
   const toast = useToast();
   const [view, setView] = useState<View>('list');
   const [sessions, setSessions] = useState<BankReconciliationSessionSummaryDto[]>([]);
   const [loadingList, setLoadingList] = useState(true);
   const [listError, setListError] = useState<string | null>(null);
   const [accounts, setAccounts] = useState<AccountDto[]>([]);
   const [activeSession, setActiveSession] = useState<BankReconciliationSessionDetailDto | null>(null);
   const [loadingSession, setLoadingSession] = useState(false);

   const loadSessions = useCallback(async () => {
     setLoadingList(true);
     setListError(null);
     try {
       const result = await bankReconciliationApi.listSessions({ page: 0, size: 50 });
       setSessions(result?.content ?? []);
     } catch {
       setListError('Could not load reconciliation sessions. Please try again.');
     } finally {
       setLoadingList(false);
     }
   }, []);

   const loadAccounts = useCallback(async () => {
     try {
       const result = await accountingApi.getAccounts();
       setAccounts(result ?? []);
     } catch {
       // non-critical; account picker will be empty
     }
   }, []);

   useEffect(() => {
     loadSessions();
     loadAccounts();
   }, [loadSessions, loadAccounts]);

   const handleSelectSession = async (session: BankReconciliationSessionSummaryDto) => {
     setLoadingSession(true);
     try {
       const detail = await bankReconciliationApi.getSession(session.sessionId);
       setActiveSession(detail);
       setView('detail');
     } catch {
       toast.error('Could not load session', 'Please try again.');
     } finally {
       setLoadingSession(false);
     }
   };

   const handleSessionCreated = async (summary: BankReconciliationSessionSummaryDto) => {
     // Immediately open the new session for editing
     setLoadingSession(true);
     try {
       const detail = await bankReconciliationApi.getSession(summary.sessionId);
       setActiveSession(detail);
       setSessions((prev) => [summary, ...prev]);
       setView('detail');
     } catch {
       // Fall back to list refresh
       await loadSessions();
       setView('list');
     } finally {
       setLoadingSession(false);
     }
   };

   const handleSessionUpdated = (updated: BankReconciliationSessionDetailDto) => {
     setActiveSession(updated);
     setSessions((prev) =>
       prev.map((s) =>
         s.sessionId === updated.sessionId
           ? { ...s, status: updated.status, completedAt: updated.completedAt }
           : s
       )
     );
   };

   return (
     <div className="space-y-5">
       {/* Page header */}
       <div className="flex items-center justify-between gap-3 flex-wrap">
         <div>
           <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
             Bank Reconciliation
           </h1>
           <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
             Create, resume, and complete bank reconciliation sessions.
           </p>
         </div>
         {view === 'list' && (
           <div className="flex items-center gap-2">
             <Button
               variant="ghost"
               size="sm"
               leftIcon={<RefreshCcw size={13} />}
               onClick={loadSessions}
               disabled={loadingList}
             >
               Refresh
             </Button>
             <Button
               variant="primary"
               size="sm"
               leftIcon={<Plus size={13} />}
               onClick={() => setView('create')}
             >
               New Session
             </Button>
           </div>
         )}
       </div>

       {/* Loading session detail spinner */}
       {loadingSession && (
         <div className="space-y-2">
           {Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} className="h-16 rounded-xl" />
           ))}
         </div>
       )}

       {!loadingSession && (
         <>
           {view === 'list' && (
             <SessionList
               sessions={sessions}
               onSelect={handleSelectSession}
               onNewSession={() => setView('create')}
               loading={loadingList}
               error={listError}
               onRetry={loadSessions}
             />
           )}

           {view === 'create' && (
             <CreateSessionForm
               accounts={accounts}
               onCancel={() => setView('list')}
               onCreated={handleSessionCreated}
             />
           )}

           {view === 'detail' && activeSession && (
             <SessionDetailView
               session={activeSession}
               onBack={() => {
                 setView('list');
                 loadSessions();
               }}
               onSessionUpdated={handleSessionUpdated}
             />
           )}
         </>
       )}
     </div>
   );
 }

 /**
  * MonthEndChecklistPage
  *
  * Month-end closing checklist for an accounting period.
  *
  * Behaviour:
  *  - Loads periods list, lets user pick which period to check
  *  - Fetches MonthEndChecklistDto for the selected period
  *  - Shows each checklist item with pass/fail/pending status
  *  - Manual items (bankReconciled, inventoryCounted) can be ticked
  *  - "Close Month" button is disabled until readyToClose === true
  *  - Closing navigates user to AccountingPeriodsPage to complete
  *
  * API:
  *  GET  /api/v1/accounting/periods
  *  GET  /api/v1/accounting/month-end/checklist?periodId={id}
  *  POST /api/v1/accounting/month-end/checklist/{periodId}   (bankReconciled / inventoryCounted)
  */

 import { useState, useEffect, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   CheckCircle2,
   XCircle,
   Clock,
   RefreshCcw,
   AlertCircle,
   ArrowRight,
   CheckSquare,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Badge } from '@/components/ui/Badge';
 import { useToast } from '@/components/ui/Toast';
 import {
   accountingApi,
   monthEndApi,
   type AccountingPeriodDto,
   type MonthEndChecklistDto,
   type MonthEndChecklistItemDto,
 } from '@/lib/accountingApi';

 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────

 const ITEM_LABELS: Record<string, string> = {
   inventoryReconciled: 'Inventory reconciled',
   arReconciled: 'Accounts receivable reconciled',
   apReconciled: 'Accounts payable reconciled',
   gstReconciled: 'GST reconciled',
   reconciliationDiscrepanciesResolved: 'Reconciliation discrepancies resolved',
   unbalancedJournals: 'No unbalanced journals',
   unlinkedDocuments: 'No unlinked documents',
   uninvoicedReceipts: 'No uninvoiced receipts',
   unpostedDocuments: 'No unposted documents',
   trialBalanceBalanced: 'Trial balance is balanced',
   bankReconciled: 'Bank reconciliation confirmed',
   inventoryCounted: 'Physical inventory count confirmed',
 };

 /** Keys that the user can manually check */
 const MANUAL_KEYS = new Set(['bankReconciled', 'inventoryCounted']);

 function formatDate(s: string): string {
   try { return format(parseISO(s), 'MMM yyyy'); } catch { return s; }
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Status icon
 // ─────────────────────────────────────────────────────────────────────────────

 function ItemStatus({ item }: { item: MonthEndChecklistItemDto }) {
   if (item.checked || item.status === 'PASS') {
     return <CheckCircle2 size={16} className="text-[var(--color-success,#22c55e)] shrink-0" />;
   }
   if (item.status === 'FAIL') {
     return <XCircle size={16} className="text-[var(--color-danger,#ef4444)] shrink-0" />;
   }
   return <Clock size={16} className="text-[var(--color-text-tertiary)] shrink-0" />;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Checklist item row
 // ─────────────────────────────────────────────────────────────────────────────

 interface ChecklistRowProps {
   item: MonthEndChecklistItemDto;
   onToggle: (key: string, checked: boolean) => void;
   isUpdating: boolean;
 }

 function ChecklistRow({ item, onToggle, isUpdating }: ChecklistRowProps) {
   const isManual = MANUAL_KEYS.has(item.key);
   const label = ITEM_LABELS[item.key] ?? item.label ?? item.key;
   const isPassed = item.checked || item.status === 'PASS';

   return (
     <div className={clsx(
       'flex items-start gap-3 p-4 rounded-xl border transition-colors',
       isPassed
         ? 'border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)]'
         : item.status === 'FAIL'
           ? 'border-[var(--color-danger,#ef4444)]/20 bg-[var(--color-danger,#ef4444)]/5'
           : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)]',
     )}>
       {/* Manual checkbox OR status icon */}
       {isManual ? (
         <button
           type="button"
           disabled={isUpdating}
           onClick={() => onToggle(item.key, !item.checked)}
           className={clsx(
             'w-4 h-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
             item.checked
               ? 'bg-[var(--color-neutral-900)] border-[var(--color-neutral-900)]'
               : 'border-[var(--color-border-default)] hover:border-[var(--color-neutral-900)]',
             isUpdating && 'opacity-50 cursor-not-allowed',
           )}
           aria-label={`Toggle ${label}`}
         >
           {item.checked && (
             <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
               <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
           )}
         </button>
       ) : (
         <div className="mt-0.5">
           <ItemStatus item={item} />
         </div>
       )}

       <div className="flex-1 min-w-0">
         <p className={clsx(
           'text-[13px] font-medium',
           isPassed
             ? 'text-[var(--color-text-primary)] line-through opacity-50'
             : 'text-[var(--color-text-primary)]',
         )}>
           {label}
         </p>
         {item.count !== undefined && item.count > 0 && (
           <p className="mt-0.5 text-[11px] text-[var(--color-danger,#ef4444)]">
             {item.count} {item.count === 1 ? 'item' : 'items'} require attention
           </p>
         )}
         {item.note && (
           <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">{item.note}</p>
         )}
       </div>

       {isManual && (
         <Badge variant={item.checked ? 'success' : 'default'} className="shrink-0 text-[10px]">
           {item.checked ? 'Confirmed' : 'Manual'}
         </Badge>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function MonthEndChecklistPage() {
   const navigate = useNavigate();
   const { toast } = useToast();

   // Periods
   const [periods, setPeriods] = useState<AccountingPeriodDto[]>([]);
   const [periodsLoading, setPeriodsLoading] = useState(true);
   const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

   // Checklist
   const [checklist, setChecklist] = useState<MonthEndChecklistDto | null>(null);
   const [checklistLoading, setChecklistLoading] = useState(false);
   const [checklistError, setChecklistError] = useState<string | null>(null);
   const [updating, setUpdating] = useState(false);

   // Load periods on mount
   useEffect(() => {
     let cancelled = false;
     setPeriodsLoading(true);
     accountingApi.getPeriods()
       .then((data) => {
         if (cancelled) return;
         const openPeriods = data.filter((p) => p.status === 'OPEN');
         setPeriods(openPeriods);
         if (openPeriods.length > 0) {
           setSelectedPeriodId(openPeriods[0].id);
         }
       })
       .catch(() => {
         if (!cancelled) setPeriods([]);
       })
       .finally(() => {
         if (!cancelled) setPeriodsLoading(false);
       });
     return () => { cancelled = true; };
   }, []);

   // Load checklist when period changes
   const loadChecklist = useCallback((periodId: number) => {
     setChecklistLoading(true);
     setChecklistError(null);
     monthEndApi.getChecklist(periodId)
       .then((data) => setChecklist(data))
       .catch(() => setChecklistError('Could not load checklist. Try refreshing.'))
       .finally(() => setChecklistLoading(false));
   }, []);

   useEffect(() => {
     if (selectedPeriodId !== null) {
       loadChecklist(selectedPeriodId);
     }
   }, [selectedPeriodId, loadChecklist]);

   // Toggle manual item
   const handleToggle = useCallback(async (key: string, checked: boolean) => {
     if (!selectedPeriodId || !checklist) return;
     setUpdating(true);
     try {
       const req = key === 'bankReconciled'
         ? { bankReconciled: checked }
         : { inventoryCounted: checked };
       const updated = await monthEndApi.updateChecklist(selectedPeriodId, req);
       setChecklist(updated);
     } catch {
       toast({ title: 'Could not update item', type: 'error' });
     } finally {
       setUpdating(false);
     }
   }, [selectedPeriodId, checklist, toast]);

   // Compute totals
   const totalItems = checklist?.items.length ?? 0;
   const passedItems = checklist?.items.filter(
     (i) => i.checked || i.status === 'PASS'
   ).length ?? 0;

   return (
     <div className="space-y-6">
       {/* Header */}
       <div>
         <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
           Month-End Checklist
         </h1>
         <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
           Complete all closing tasks before closing the period.
         </p>
       </div>

       {/* Period selector */}
       <div className="flex flex-wrap items-center gap-3">
         {periodsLoading ? (
           <Skeleton className="h-8 w-48" />
         ) : periods.length === 0 ? (
           <p className="text-[13px] text-[var(--color-text-secondary)]">
             No open periods found.
           </p>
         ) : (
           <div className="flex items-center gap-2 flex-wrap">
             <span className="text-[12px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-widest">
               Period
             </span>
             {periods.map((p) => (
               <button
                 key={p.id}
                 type="button"
                 onClick={() => setSelectedPeriodId(p.id)}
                 className={clsx(
                   'px-3 h-8 rounded-lg text-[13px] font-medium transition-colors',
                   selectedPeriodId === p.id
                     ? 'bg-[var(--color-neutral-900)] text-white'
                     : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                 )}
               >
                 {p.label ?? formatDate(p.startDate)}
               </button>
             ))}
           </div>
         )}

         {selectedPeriodId !== null && !checklistLoading && (
           <button
             type="button"
             onClick={() => loadChecklist(selectedPeriodId)}
             className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
             aria-label="Refresh checklist"
           >
             <RefreshCcw size={15} />
           </button>
         )}
       </div>

       {/* Error */}
       {checklistError && (
         <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--color-danger,#ef4444)]/10 text-[var(--color-danger,#ef4444)]">
           <AlertCircle size={16} />
           <span className="text-[13px]">{checklistError}</span>
         </div>
       )}

       {/* Loading */}
       {checklistLoading && (
         <div className="space-y-3">
           {Array.from({ length: 6 }).map((_, i) => (
             <Skeleton key={i} className="h-16 rounded-xl" />
           ))}
         </div>
       )}

       {/* No period selected / no open periods */}
       {!checklistLoading && !checklistError && selectedPeriodId === null && !periodsLoading && (
         <div className="py-12 text-center">
           <CheckSquare size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">
             No open periods available. Create a period to get started.
           </p>
           <Button
             size="sm"
             variant="secondary"
             className="mt-4"
             onClick={() => navigate('/accounting/periods')}
           >
             Go to Periods
           </Button>
         </div>
       )}

       {/* Checklist */}
       {!checklistLoading && !checklistError && checklist && (
         <>
           {/* Progress header */}
           <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
             <div>
               <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                 {passedItems} of {totalItems} tasks complete
               </p>
               <div className="mt-2 h-1.5 w-48 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
                 <div
                   className="h-full bg-[var(--color-neutral-900)] rounded-full transition-all duration-300"
                   style={{ width: totalItems > 0 ? `${(passedItems / totalItems) * 100}%` : '0%' }}
                 />
               </div>
             </div>
             <div className="flex items-center gap-2">
               <Badge variant={checklist.readyToClose ? 'success' : 'warning'} dot>
                 {checklist.readyToClose ? 'Ready to close' : 'Not ready'}
               </Badge>
             </div>
           </div>

           {/* Items */}
           <div className="space-y-2">
             {checklist.items.map((item) => (
               <ChecklistRow
                 key={item.key}
                 item={item}
                 onToggle={handleToggle}
                 isUpdating={updating}
               />
             ))}
           </div>

           {/* Close Month CTA */}
           <div className="flex items-center justify-between p-5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
             <div>
               <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                 Close Month
               </p>
               <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
                 {checklist.readyToClose
                   ? 'All tasks complete. You can now close this period.'
                   : 'Complete all checklist items before closing.'}
               </p>
             </div>
             <Button
               variant="primary"
               disabled={!checklist.readyToClose}
               onClick={() => navigate('/accounting/periods')}
               className="gap-2"
             >
               Close Period
               <ArrowRight size={14} />
             </Button>
           </div>
         </>
       )}
     </div>
   );
 }

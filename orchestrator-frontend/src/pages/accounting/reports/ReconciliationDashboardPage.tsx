 /**
  * ReconciliationDashboardPage
  *
  * AR/AP subledger reconciliation status and open discrepancy resolution.
  * Discrepancies can be acknowledged, adjusted, or written off.
  *
  * API:
  *  GET  /api/v1/accounting/reconciliation/subledger
  *  GET  /api/v1/accounting/reconciliation/discrepancies?status=OPEN
  *  POST /api/v1/accounting/reconciliation/discrepancies/{id}/resolve
  *  GET  /api/v1/accounting/accounts
  */

 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { ExportButton } from '@/components/ui/ExportButton';
 import { apiRequest } from '@/lib/api';
 import { useToast } from '@/components/ui/Toast';
 import {
   bankReconciliationApi,
   accountingApi,
   type ReconciliationDiscrepancyDto,
   type DiscrepancyResolution,
   type AccountDto,
 } from '@/lib/accountingApi';
 import type { ApiResponse } from '@/types';

 // ─────────────────────────────────────────────────────────────────────────────
 // Types
 // ─────────────────────────────────────────────────────────────────────────────

 interface SubledgerReconciliationReport {
   arBalance?: number;
   apBalance?: number;
   arLedgerBalance?: number;
   apLedgerBalance?: number;
   arVariance?: number;
   apVariance?: number;
   balanced?: boolean;
   lastUpdated?: string;
 }

 // Use ReconciliationDiscrepancyDto from accountingApi instead of inline type
 type DiscrepancyItem = ReconciliationDiscrepancyDto;

 // ─────────────────────────────────────────────────────────────────────────────
 // Status card
 // ─────────────────────────────────────────────────────────────────────────────

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 interface StatusCardProps {
   title: string;
   balanced: boolean;
   balancedLabel: string;
   unbalancedLabel: string;
   rows: { label: string; value: number }[];
   varianceLabel?: string;
   variance?: number;
 }

 function StatusCard({ title, balanced, balancedLabel, unbalancedLabel, rows, varianceLabel, variance }: StatusCardProps) {
   return (
     <div className={clsx(
       'rounded-xl border p-5',
       balanced
         ? 'border-[var(--color-border-default)] bg-[var(--color-surface-primary)]'
         : 'border-[var(--color-error-border-subtle)] bg-[var(--color-error-bg)]',
     )}>
       <div className="flex items-center justify-between mb-4">
         <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">{title}</h3>
         <div className="flex items-center gap-1.5">
           {balanced ? (
             <CheckCircle2 size={15} className="text-[var(--color-success-icon)]" />
           ) : (
             <XCircle size={15} className="text-[var(--color-error)]" />
           )}
           <span className={clsx('text-[12px] font-medium', balanced ? 'text-[var(--color-success-icon)]' : 'text-[var(--color-error)]')}>
             {balanced ? balancedLabel : unbalancedLabel}
           </span>
         </div>
       </div>

       <div className="space-y-2">
         {rows.map(({ label, value }) => (
           <div key={label} className="flex items-center justify-between text-[13px]">
             <span className="text-[var(--color-text-secondary)]">{label}</span>
             <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{formatINR(value)}</span>
           </div>
         ))}
         {varianceLabel !== undefined && variance !== undefined && Math.abs(variance) > 0.01 && (
           <div className="flex items-center justify-between text-[13px] pt-2 border-t border-[var(--color-border-subtle)]">
             <span className="text-[var(--color-error)]">{varianceLabel}</span>
             <span className="tabular-nums font-semibold text-[var(--color-error)]">{formatINR(variance)}</span>
           </div>
         )}
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Discrepancy resolution modal
 // ─────────────────────────────────────────────────────────────────────────────

 interface ResolveModalProps {
   discrepancy: DiscrepancyItem;
   accounts: AccountDto[];
   onClose: () => void;
   onResolved: (updated: DiscrepancyItem) => void;
 }

 function ResolveModal({ discrepancy, accounts, onClose, onResolved }: ResolveModalProps) {
   const toast = useToast();
   const [resolution, setResolution] = useState<DiscrepancyResolution>('ACKNOWLEDGED');
   const [adjustmentAccountId, setAdjustmentAccountId] = useState<string>('');
   const [note, setNote] = useState<string>('');
   const [submitting, setSubmitting] = useState(false);

   const requiresAccount = resolution === 'ADJUSTMENT_JOURNAL' || resolution === 'WRITE_OFF';

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (requiresAccount && !adjustmentAccountId) return;

     setSubmitting(true);
     try {
       const updated = await bankReconciliationApi.resolveDiscrepancy(discrepancy.id, {
         resolution,
         adjustmentAccountId: requiresAccount ? Number(adjustmentAccountId) : undefined,
         note: note.trim() || undefined,
       });
       toast.success('Discrepancy resolved', `Item resolved via ${resolution.replace('_', ' ').toLowerCase()}.`);
       onResolved(updated);
     } catch {
       toast.error('Resolution failed', 'Could not resolve the discrepancy. Please try again.');
     } finally {
       setSubmitting(false);
     }
   };

   return (
     /* Modal backdrop */
     <div
       className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
       role="dialog"
       aria-modal="true"
       aria-label="Resolve discrepancy"
     >
       <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] shadow-xl w-full max-w-md">
         {/* Modal header */}
         <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
           <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
             Resolve Discrepancy
           </h2>
           <button
             type="button"
             onClick={onClose}
             className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
             aria-label="Close"
           >
             <X size={16} />
           </button>
         </div>

         {/* Context */}
         <div className="px-5 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
           <p className="text-[13px] text-[var(--color-text-primary)]">{discrepancy.description}</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
             Amount: {formatINR(discrepancy.amount ?? 0)} · Type: {discrepancy.type}
           </p>
         </div>

         {/* Form */}
         <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
           {/* Resolution type */}
           <div>
             <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
               Resolution method <span className="text-[var(--color-error)]">*</span>
             </p>
             <div className="space-y-2">
               {(
                 [
                   { value: 'ACKNOWLEDGED', label: 'Acknowledge', desc: 'Mark this discrepancy as known and accepted.' },
                   { value: 'ADJUSTMENT_JOURNAL', label: 'Adjustment Journal', desc: 'Post an adjustment journal entry to correct the difference.' },
                   { value: 'WRITE_OFF', label: 'Write Off', desc: 'Write off the amount to an expense or write-off account.' },
                 ] as { value: DiscrepancyResolution; label: string; desc: string }[]
               ).map(({ value, label, desc }) => (
                 <label
                   key={value}
                   className={clsx(
                     'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                     resolution === value
                       ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-50)]'
                       : 'border-[var(--color-border-default)] hover:border-[var(--color-border-emphasis)]',
                   )}
                 >
                   <input
                     type="radio"
                     name="resolution"
                     value={value}
                     checked={resolution === value}
                     onChange={() => setResolution(value)}
                     className="mt-0.5 accent-[var(--color-primary-600)]"
                   />
                   <div>
                     <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{label}</p>
                     <p className="text-[11px] text-[var(--color-text-tertiary)]">{desc}</p>
                   </div>
                 </label>
               ))}
             </div>
           </div>

           {/* Account (required for adjustment and write-off) */}
           {requiresAccount && (
             <div>
               <label
                 htmlFor="adjustmentAccountId"
                 className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1"
               >
                 {resolution === 'WRITE_OFF' ? 'Write-off Account' : 'Adjustment Account'}
                 {' '}<span className="text-[var(--color-error)]">*</span>
               </label>
               <select
                 id="adjustmentAccountId"
                 value={adjustmentAccountId}
                 onChange={(e) => setAdjustmentAccountId(e.target.value)}
                 required
                 className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]"
               >
                 <option value="">Select account</option>
                 {accounts.map((a) => (
                   <option key={a.id} value={a.id}>
                     {a.code} — {a.name}
                   </option>
                 ))}
               </select>
             </div>
           )}

           {/* Note */}
           <div>
             <label
               htmlFor="note"
               className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1"
             >
               Note
             </label>
             <textarea
               id="note"
               value={note}
               onChange={(e) => setNote(e.target.value)}
               placeholder="Optional explanation"
               rows={2}
               className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] resize-none"
             />
           </div>

           <div className="flex items-center gap-2">
             <Button type="submit" variant="primary" size="sm" disabled={submitting}>
               {submitting ? 'Resolving...' : 'Resolve'}
             </Button>
             <Button type="button" variant="secondary" size="sm" onClick={onClose}>
               Cancel
             </Button>
           </div>
         </form>
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function ReconciliationDashboardPage() {
   const toast = useToast();
   const [subledger, setSubledger] = useState<SubledgerReconciliationReport | null>(null);
   const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [accounts, setAccounts] = useState<AccountDto[]>([]);
   const [resolvingItem, setResolvingItem] = useState<DiscrepancyItem | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [subledgerRes, discRes] = await Promise.allSettled([
         apiRequest.get<ApiResponse<SubledgerReconciliationReport>>('/accounting/reconciliation/subledger'),
         bankReconciliationApi.listDiscrepancies({ status: 'OPEN' }),
       ]);

       if (subledgerRes.status === 'fulfilled') {
         setSubledger(subledgerRes.value.data?.data ?? null);
       }
       if (discRes.status === 'fulfilled') {
         setDiscrepancies(discRes.value ?? []);
       }
     } catch {
       setError('Failed to load reconciliation data. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   // Load accounts for discrepancy resolution dropdown
   const loadAccounts = useCallback(async () => {
     try {
       const result = await accountingApi.getAccounts();
       setAccounts(result ?? []);
     } catch {
       // non-critical
     }
   }, []);

   useEffect(() => {
     load();
     loadAccounts();
   }, [load, loadAccounts]);

   const handleExport = async () => {
     toast.info('Export initiated', 'Reconciliation dashboard export has been requested.');
   };

   const handleResolved = (updated: DiscrepancyItem) => {
     // Remove the resolved item from the open list
     setDiscrepancies((prev) => prev.filter((d) => d.id !== updated.id));
     setResolvingItem(null);
   };

   const arBalanced = subledger ? Math.abs(subledger.arVariance ?? 0) < 0.01 : true;
   const apBalanced = subledger ? Math.abs(subledger.apVariance ?? 0) < 0.01 : true;

   return (
     <div className="space-y-5">
       <PageHeader
         title="Reconciliation Dashboard"
         description="AR, AP, and bank reconciliation status"
         actions={
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="sm" leftIcon={<RefreshCcw size={13} />} onClick={load}>Refresh</Button>
             <ExportButton onExport={handleExport} />
           </div>
         }
       />

       {error && !isLoading && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)]">
           <AlertCircle size={16} className="text-[var(--color-error)] shrink-0" />
           <p className="text-[13px] text-[var(--color-error)]">{error}</p>
           <Button variant="secondary" size="sm" onClick={load} className="ml-auto shrink-0">Retry</Button>
         </div>
       )}

       {isLoading && (
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
         </div>
       )}

       {!isLoading && subledger && (
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <StatusCard
             title="Accounts Receivable"
             balanced={arBalanced}
             balancedLabel="AR reconciled"
             unbalancedLabel="AR discrepancy"
             rows={[
               { label: 'AR Balance (Subledger)', value: subledger.arBalance ?? 0 },
               { label: 'AR Balance (Ledger)', value: subledger.arLedgerBalance ?? 0 },
             ]}
             varianceLabel="Variance"
             variance={subledger.arVariance ?? 0}
           />
           <StatusCard
             title="Accounts Payable"
             balanced={apBalanced}
             balancedLabel="AP reconciled"
             unbalancedLabel="AP discrepancy"
             rows={[
               { label: 'AP Balance (Subledger)', value: subledger.apBalance ?? 0 },
               { label: 'AP Balance (Ledger)', value: subledger.apLedgerBalance ?? 0 },
             ]}
             varianceLabel="Variance"
             variance={subledger.apVariance ?? 0}
           />
         </div>
       )}

       {!isLoading && !subledger && !error && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-8 text-center">
           <p className="text-[13px] text-[var(--color-text-tertiary)]">No reconciliation data available.</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1">
             Run a subledger sync to generate reconciliation data.
           </p>
         </div>
       )}

       {/* Open Discrepancies */}
       {!isLoading && discrepancies.length > 0 && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--color-border-subtle)]">
             <AlertTriangle size={14} className="text-[var(--color-warning-icon)]" />
             <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
               Open Discrepancies ({discrepancies.length})
             </h2>
           </div>
           <div className="divide-y divide-[var(--color-border-subtle)]">
             {discrepancies.map((d) => (
               <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-3">
                 <div>
                   <p className="text-[13px] text-[var(--color-text-primary)]">{d.description}</p>
                   <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 uppercase tracking-wider">
                     {d.type}
                   </p>
                 </div>
                 <div className="flex items-center gap-3 shrink-0">
                   <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                     {formatINR(d.amount ?? 0)}
                   </span>
                   <Button
                     variant="secondary"
                     size="sm"
                     onClick={() => setResolvingItem(d)}
                   >
                     Resolve
                   </Button>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

       {!isLoading && discrepancies.length === 0 && subledger && (
         <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)]">
           <CheckCircle2 size={15} className="text-[var(--color-success-icon)] shrink-0" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">
             No open discrepancies. Reconciliation is up to date.
           </p>
         </div>
       )}

       {/* Resolution modal */}
       {resolvingItem && (
         <ResolveModal
           discrepancy={resolvingItem}
           accounts={accounts}
           onClose={() => setResolvingItem(null)}
           onResolved={handleResolved}
         />
       )}
     </div>
   );
 }

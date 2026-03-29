 /**
  * CreditOverridesPage — Sales portal credit override request management
  *
  * Features:
  *   - Table of override requests (ID, dealer, original/requested limits, status)
  *   - Create form (dealer, new limit/dispatch amount, justification)
  *   - Approve (updates credit limit) / Reject with reason
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import {
   Plus,
   AlertCircle,
   RefreshCcw,
   Check,
   X,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { salesApi } from '@/lib/salesApi';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { useToast } from '@/components/ui/Toast';
 import type {
   CreditOverrideRequestDto,
   CreditOverrideCreateRequest,
   DealerLookupResponse,
 } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtCurrency(v?: number): string {
   if (v == null) return '—';
   return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
 }
 
 function fmtDate(iso?: string): string {
   if (!iso) return '—';
   try {
     return format(new Date(iso), 'dd MMM yyyy');
   } catch {
     return iso;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Status badge
 // ─────────────────────────────────────────────────────────────────────────────
 
 function OverrideStatusBadge({ status }: { status?: string }) {
   const s = status?.toUpperCase() ?? '';
   const cls = s === 'APPROVED'
     ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
     : s === 'REJECTED'
       ? 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
       : s === 'PENDING'
         ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
         : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]';
   return (
     <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', cls)}>
       {status ?? 'Unknown'}
     </span>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Dealer search combobox
 // ─────────────────────────────────────────────────────────────────────────────
 
 function DealerSearchInput({
   value,
   onChange,
   onSelect,
 }: {
   value: string;
   onChange: (v: string) => void;
   onSelect: (dealer: DealerLookupResponse) => void;
 }) {
   const [options, setOptions] = useState<DealerLookupResponse[]>([]);
   const [open, setOpen] = useState(false);
 
   useEffect(() => {
     if (!value.trim()) {
       setOptions([]);
       return;
     }
     const h = setTimeout(() => {
       salesApi.searchDealers(value)
         .then((res) => { setOptions(res); setOpen(true); })
         .catch(() => setOptions([]));
     }, 250);
     return () => clearTimeout(h);
   }, [value]);
 
   return (
     <div className="relative">
       <input
         type="text"
         value={value}
         onChange={(e) => onChange(e.target.value)}
         onFocus={() => options.length > 0 && setOpen(true)}
         placeholder="Search dealer..."
         className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors"
       />
       {open && options.length > 0 && (
         <>
           <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
           <div className="absolute top-10 left-0 right-0 z-20 max-h-52 overflow-auto rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] shadow-lg py-1">
             {options.map((opt) => (
               <button
                 key={opt.id}
                 type="button"
                 onClick={() => { onSelect(opt); setOpen(false); }}
                 className="w-full text-left px-3 py-2.5 hover:bg-[var(--color-surface-secondary)] transition-colors"
               >
                 <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{opt.name}</p>
                 <p className="text-[11px] text-[var(--color-text-tertiary)]">{opt.code}</p>
               </button>
             ))}
           </div>
         </>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Create Override Request form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface CreateOverrideFormProps {
   onSubmit: (req: CreditOverrideCreateRequest) => Promise<void>;
   onCancel: () => void;
   isSubmitting: boolean;
 }
 
 function CreateOverrideForm({ onSubmit, onCancel, isSubmitting }: CreateOverrideFormProps) {
   const [dealerSearch, setDealerSearch] = useState('');
   const [selectedDealer, setSelectedDealer] = useState<DealerLookupResponse | null>(null);
   const [dispatchAmount, setDispatchAmount] = useState('');
   const [reason, setReason] = useState('');
   const [expiresAt, setExpiresAt] = useState('');
   const [errors, setErrors] = useState<{ dealer?: string; dispatchAmount?: string }>({});
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     const errs: typeof errors = {};
     if (!dispatchAmount || isNaN(Number(dispatchAmount)) || Number(dispatchAmount) <= 0) {
       errs.dispatchAmount = 'Enter a valid dispatch amount';
     }
     if (Object.keys(errs).length > 0) {
       setErrors(errs);
       return;
     }
     await onSubmit({
       dealerId: selectedDealer?.id,
       dispatchAmount: Number(dispatchAmount),
       reason: reason || undefined,
       expiresAt: expiresAt || undefined,
     });
   };
 
   return (
     <form onSubmit={handleSubmit} className="space-y-4">
       <div className="space-y-1.5">
         <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">Dealer (optional)</label>
         <DealerSearchInput
           value={dealerSearch}
           onChange={(v) => { setDealerSearch(v); setSelectedDealer(null); }}
           onSelect={(d) => {
             setSelectedDealer(d);
             setDealerSearch(`${d.name}${d.code ? ` (${d.code})` : ''}`);
           }}
         />
         {selectedDealer && (
           <p className="text-[11px] text-[var(--color-text-tertiary)]">
             Current limit: {fmtCurrency(selectedDealer.creditLimit)}
           </p>
         )}
       </div>
 
       <Input
         label="Dispatch amount (₹) *"
         type="number"
         min="0"
         step="100"
         value={dispatchAmount}
         onChange={(e) => { setDispatchAmount(e.target.value); setErrors((er) => ({ ...er, dispatchAmount: undefined })); }}
         error={errors.dispatchAmount}
         placeholder="Amount requiring credit override"
       />
 
       <div className="space-y-1.5">
         <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">Justification</label>
         <textarea
           value={reason}
           onChange={(e) => setReason(e.target.value)}
           rows={3}
           placeholder="Reason for the override request..."
           className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors resize-none"
         />
       </div>
 
       <Input
         label="Expires at (optional)"
         type="date"
         value={expiresAt}
         onChange={(e) => setExpiresAt(e.target.value)}
       />
 
       <div className="flex justify-end gap-2 pt-1">
         <button
           type="button"
           onClick={onCancel}
           className="h-9 px-4 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
         >
           Cancel
         </button>
         <button
           type="submit"
           disabled={isSubmitting}
           className="h-9 px-5 rounded-lg text-[13px] font-medium bg-[var(--color-neutral-900)] text-white hover:bg-[var(--color-neutral-700)] disabled:opacity-50 transition-colors dark:bg-white dark:text-[var(--color-neutral-900)]"
         >
           {isSubmitting ? 'Submitting...' : 'Submit override'}
         </button>
       </div>
     </form>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Decision modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 function OverrideDecisionModal({
   request,
   action,
   onConfirm,
   onCancel,
   isLoading,
 }: {
   request: CreditOverrideRequestDto;
   action: 'approve' | 'reject';
   onConfirm: (reason: string) => void;
   onCancel: () => void;
   isLoading: boolean;
 }) {
   const [reason, setReason] = useState('');
   const isApprove = action === 'approve';
 
   return (
     <Modal
       isOpen
       onClose={onCancel}
       title={isApprove ? 'Approve override request' : 'Reject override request'}
       description={`${request.dealerName ?? 'Dealer'} — ${fmtCurrency(request.dispatchAmount)} dispatch`}
       size="sm"
     >
       <div className="space-y-4">
         {isApprove && (
           <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-success-bg)] text-[var(--color-success)] text-[12px]">
             <Check size={13} className="mt-0.5 shrink-0" />
             Approving will allow the dispatch to proceed with the override.
           </div>
         )}
         <div className="space-y-1.5">
           <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
             {isApprove ? 'Notes (optional)' : 'Rejection reason *'}
           </label>
           <textarea
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             rows={3}
             placeholder={isApprove ? 'Approval notes...' : 'Why is this being rejected?'}
             className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors resize-none"
           />
         </div>
         <div className="flex justify-end gap-2">
           <button
             type="button"
             onClick={onCancel}
             className="h-9 px-4 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
           >
             Cancel
           </button>
           <button
             type="button"
             onClick={() => onConfirm(reason)}
             disabled={isLoading || (!isApprove && !reason.trim())}
             className={clsx(
               'h-9 px-5 rounded-lg text-[13px] font-medium disabled:opacity-50 transition-colors',
               isApprove
                 ? 'bg-[var(--color-neutral-900)] text-white dark:bg-white dark:text-[var(--color-neutral-900)]'
                 : 'bg-[var(--color-error)] text-white',
             )}
           >
             {isLoading ? (isApprove ? 'Approving...' : 'Rejecting...') : (isApprove ? 'Approve' : 'Reject')}
           </button>
         </div>
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function CreditOverridesPage() {
   const { success: toastSuccess, error: toastError } = useToast();
 
   const [overrides, setOverrides] = useState<CreditOverrideRequestDto[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const [createOpen, setCreateOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const [decisionTarget, setDecisionTarget] = useState<{ req: CreditOverrideRequestDto; action: 'approve' | 'reject' } | null>(null);
   const [isDeciding, setIsDeciding] = useState(false);
 
   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const data = await salesApi.listCreditOverrides();
       setOverrides(data);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Unable to load override requests');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => {
     load();
   }, [load]);
 
   const handleCreate = async (req: CreditOverrideCreateRequest) => {
     setIsSubmitting(true);
     try {
       await salesApi.createCreditOverride(req);
       toastSuccess('Override request submitted');
       setCreateOpen(false);
       load();
     } catch (err) {
       toastError(err instanceof Error ? err.message : 'Failed to submit');
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const handleDecision = async (reason: string) => {
     if (!decisionTarget) return;
     setIsDeciding(true);
     try {
       if (decisionTarget.action === 'approve') {
         await salesApi.approveCreditOverride(decisionTarget.req.id!, { reason: reason || undefined });
         toastSuccess('Override approved');
       } else {
         await salesApi.rejectCreditOverride(decisionTarget.req.id!, { reason: reason || undefined });
         toastSuccess('Override rejected');
       }
       setDecisionTarget(null);
       load();
     } catch (err) {
       toastError(err instanceof Error ? err.message : 'Decision failed');
     } finally {
       setIsDeciding(false);
     }
   };
 
   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Credit Override Requests</h1>
           <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
             Manage requests to override credit limits for dispatch.
           </p>
         </div>
         <button
           type="button"
           onClick={() => setCreateOpen(true)}
           className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-medium bg-[var(--color-neutral-900)] text-white hover:bg-[var(--color-neutral-700)] transition-colors dark:bg-white dark:text-[var(--color-neutral-900)]"
         >
           <Plus size={14} />
           New override
         </button>
       </div>
 
       {/* Error */}
       {error && (
         <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={14} />
           <span>{error}</span>
           <button
             type="button"
             onClick={load}
             className="ml-auto flex items-center gap-1 text-[12px] underline"
           >
             <RefreshCcw size={12} /> Retry
           </button>
         </div>
       )}
 
       {/* Desktop table */}
       <div className="hidden sm:block rounded-xl border border-[var(--color-border-default)] overflow-hidden bg-[var(--color-surface-primary)]">
         <table className="w-full text-[13px]">
           <thead>
             <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-default)]">
               <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Request ID</th>
               <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Dealer</th>
               <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Credit Limit</th>
               <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Dispatch Amount</th>
               <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Headroom Required</th>
               <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Status</th>
               <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Date</th>
               <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-[var(--color-border-subtle)]">
             {loading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <tr key={i} className="border-b border-[var(--color-border-subtle)]">
                   {Array.from({ length: 8 }).map((_, j) => (
                     <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                   ))}
                 </tr>
               ))
             ) : overrides.length === 0 ? (
               <tr>
                 <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[var(--color-text-secondary)]">
                   No override requests yet.
                 </td>
               </tr>
             ) : (
               overrides.map((req) => {
                 const isPending = req.status?.toUpperCase() === 'PENDING';
                 return (
                   <tr key={req.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                     <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-text-secondary)]">
                       {req.publicId ?? `#${req.id}`}
                     </td>
                     <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                       {req.dealerName ?? '—'}
                     </td>
                     <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-secondary)]">
                       {fmtCurrency(req.creditLimit)}
                     </td>
                     <td className="px-4 py-3 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                       {fmtCurrency(req.dispatchAmount)}
                     </td>
                     <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-secondary)]">
                       {req.requiredHeadroom != null ? fmtCurrency(req.requiredHeadroom) : '—'}
                     </td>
                     <td className="px-4 py-3">
                       <OverrideStatusBadge status={req.status} />
                     </td>
                     <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                       {fmtDate(req.createdAt)}
                     </td>
                     <td className="px-4 py-3">
                       {isPending && (
                         <div className="flex items-center justify-end gap-1.5">
                           <button
                             type="button"
                             onClick={() => setDecisionTarget({ req, action: 'approve' })}
                             className="flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium bg-[var(--color-success-bg)] text-[var(--color-success)] hover:opacity-80 transition-opacity"
                           >
                             <Check size={11} /> Approve
                           </button>
                           <button
                             type="button"
                             onClick={() => setDecisionTarget({ req, action: 'reject' })}
                             className="flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium bg-[var(--color-error-bg)] text-[var(--color-error)] hover:opacity-80 transition-opacity"
                           >
                             <X size={11} /> Reject
                           </button>
                         </div>
                       )}
                     </td>
                   </tr>
                 );
               })
             )}
           </tbody>
         </table>
       </div>
 
       {/* Mobile card list */}
       <div className="sm:hidden space-y-2">
         {loading ? (
           Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
         ) : overrides.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16">
             <p className="text-[13px] text-[var(--color-text-secondary)]">No override requests yet.</p>
           </div>
         ) : (
           overrides.map((req) => {
             const isPending = req.status?.toUpperCase() === 'PENDING';
             return (
               <div key={req.id} className="p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
                 <div className="flex items-start justify-between gap-2">
                   <div>
                     <p className="font-medium text-[var(--color-text-primary)] text-[13px]">{req.dealerName ?? 'Unknown dealer'}</p>
                     <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{fmtDate(req.createdAt)}</p>
                   </div>
                   <OverrideStatusBadge status={req.status} />
                 </div>
                 <div className="flex items-center gap-4 mt-2">
                   <div>
                     <p className="text-[10px] text-[var(--color-text-tertiary)]">Dispatch</p>
                     <p className="text-[13px] tabular-nums font-semibold text-[var(--color-text-primary)]">{fmtCurrency(req.dispatchAmount)}</p>
                   </div>
                   <div>
                     <p className="text-[10px] text-[var(--color-text-tertiary)]">Limit</p>
                     <p className="text-[13px] tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(req.creditLimit)}</p>
                   </div>
                 </div>
                 {isPending && (
                   <div className="flex items-center gap-2 mt-3">
                     <button
                       type="button"
                       onClick={() => setDecisionTarget({ req, action: 'approve' })}
                       className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-[12px] font-medium bg-[var(--color-success-bg)] text-[var(--color-success)]"
                     >
                       <Check size={12} /> Approve
                     </button>
                     <button
                       type="button"
                       onClick={() => setDecisionTarget({ req, action: 'reject' })}
                       className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-[12px] font-medium bg-[var(--color-error-bg)] text-[var(--color-error)]"
                     >
                       <X size={12} /> Reject
                     </button>
                   </div>
                 )}
               </div>
             );
           })
         )}
       </div>
 
       {/* Create Modal */}
       <Modal
         isOpen={createOpen}
         onClose={() => setCreateOpen(false)}
         title="New credit override request"
         description="Request to override a credit limit for dispatch"
         size="md"
       >
         <CreateOverrideForm
           onSubmit={handleCreate}
           onCancel={() => setCreateOpen(false)}
           isSubmitting={isSubmitting}
         />
       </Modal>
 
       {/* Decision Modal */}
       {decisionTarget && (
         <OverrideDecisionModal
           request={decisionTarget.req}
           action={decisionTarget.action}
           onConfirm={handleDecision}
           onCancel={() => setDecisionTarget(null)}
           isLoading={isDeciding}
         />
       )}
     </div>
   );
 }

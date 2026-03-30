 /**
  * ApprovalsPage — Admin Approvals Queue
  *
  * Displays all pending approval items grouped by type:
  *   - Credit Request   → approve (POST /sales/credit-requests/{id}/approve)
  *                         reject  (POST /sales/credit-requests/{id}/reject)
  *   - Payroll Run      → approve only (POST /payroll/runs/{id}/approve)
  *                         reject shows error toast
  *   - Credit Override  → approve (POST /credit/override-requests/{id}/approve)
  *                         reject  (POST /credit/override-requests/{id}/reject)
  *
  * Each item shows: type badge, reference, summary, status badge, created date
  * Approve shows a confirmation dialog; Reject shows a danger confirmation dialog.
  *
  * VAL-ADMIN-018 through VAL-ADMIN-022
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   CheckCircle,
   AlertCircle,
   RefreshCcw,
 } from 'lucide-react';
 
 import { clsx } from 'clsx';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Modal } from '@/components/ui/Modal';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { adminApi } from '@/lib/adminApi';
 import type { ApprovalItem, ApprovalsResponse } from '@/types';
 import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// Normalize grouped backend response into flat items array
// ─────────────────────────────────────────────────────────────────────────────

function normalizeApprovals(raw: ApprovalsResponse): ApprovalItem[] {
  const mapBucket = (items: ApprovalItem[] | undefined): ApprovalItem[] => items ?? [];
  return [
    ...mapBucket(raw.creditRequests),
    ...mapBucket(raw.payrollRuns),
    ...mapBucket(raw.periodCloseRequests),
    ...mapBucket(raw.exportRequests),
  ].filter((item) => item.status?.toUpperCase() === 'PENDING' || !item.status);
}
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Type badge helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function getTypeLabel(type: string): string {
   switch (type) {
     case 'CREDIT_REQUEST': return 'Credit Request';
     case 'CREDIT_LIMIT_OVERRIDE_REQUEST': return 'Credit Override';
     case 'PAYROLL_RUN': return 'Payroll Run';
     case 'PERIOD_CLOSE_REQUEST': return 'Period Close';
     case 'EXPORT_REQUEST': return 'Export Request';
     default: return type.replace(/_/g, ' ');
   }
 }
 
 function getTypeBadgeVariant(type: string): 'info' | 'warning' | 'success' | 'default' {
   switch (type) {
     case 'CREDIT_REQUEST': return 'info';
     case 'CREDIT_LIMIT_OVERRIDE_REQUEST': return 'success';
     case 'PAYROLL_RUN': return 'warning';
     case 'PERIOD_CLOSE_REQUEST': return 'default';
     case 'EXPORT_REQUEST': return 'default';
     default: return 'default';
   }
 }
 
 function getStatusBadgeVariant(status: string): 'success' | 'danger' | 'warning' | 'default' {
   const s = status?.toUpperCase();
   if (s === 'APPROVED' || s === 'POSTED') return 'success';
   if (s === 'REJECTED' || s === 'CANCELLED') return 'danger';
   if (s === 'PENDING') return 'warning';
   return 'default';
 }
 
 function formatDate(dateStr: string): string {
   try {
     return format(new Date(dateStr), 'd MMM yyyy, h:mm a');
   } catch {
     return dateStr;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Group items by type
 // ─────────────────────────────────────────────────────────────────────────────
 
 type GroupedApprovals = Record<string, ApprovalItem[]>;
 
 function groupByType(items: ApprovalItem[]): GroupedApprovals {
   return items.reduce<GroupedApprovals>((acc, item) => {
     const key = item.originType;
     if (!acc[key]) acc[key] = [];
     acc[key].push(item);
     return acc;
   }, {});
 }
 
 const TYPE_ORDER = ['CREDIT_REQUEST', 'CREDIT_LIMIT_OVERRIDE_REQUEST', 'PAYROLL_RUN', 'PERIOD_CLOSE_REQUEST', 'EXPORT_REQUEST'];
 
 function sortedGroupKeys(groups: GroupedApprovals): string[] {
   const known = TYPE_ORDER.filter((k) => groups[k]);
   const others = Object.keys(groups).filter((k) => !TYPE_ORDER.includes(k));
   return [...known, ...others];
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Action state
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface ActionState {
   item: ApprovalItem;
   action: 'approve' | 'reject';
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Approval item card
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface ApprovalCardProps {
   item: ApprovalItem;
   onApprove: (item: ApprovalItem) => void;
   onReject: (item: ApprovalItem) => void;
 }
 
 function ApprovalCard({ item, onApprove, onReject }: ApprovalCardProps) {
   const canReject = item.originType !== 'PAYROLL_RUN';
 
   return (
     <div
       className={clsx(
         'relative flex items-start gap-4 p-4 rounded-xl',
         'bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]',
         'transition-shadow duration-150',
       )}
     >
       {/* Left accent border */}
       <div
         className={clsx(
           'absolute left-0 top-3 bottom-3 w-[3px] rounded-full',
           item.originType === 'CREDIT_REQUEST' && 'bg-[var(--color-primary-500)]',
           item.originType === 'CREDIT_LIMIT_OVERRIDE_REQUEST' && 'bg-[var(--color-success-icon)]',
           item.originType === 'PAYROLL_RUN' && 'bg-[var(--color-warning-icon)]',
           item.originType === 'PERIOD_CLOSE_REQUEST' && 'bg-[var(--color-neutral-400)]',
           item.originType === 'EXPORT_REQUEST' && 'bg-[var(--color-neutral-400)]',
           !['CREDIT_REQUEST', 'CREDIT_LIMIT_OVERRIDE_REQUEST', 'PAYROLL_RUN', 'PERIOD_CLOSE_REQUEST', 'EXPORT_REQUEST'].includes(item.originType) && 'bg-[var(--color-neutral-400)]',
         )}
       />
 
       <div className="flex-1 min-w-0 pl-2">
         {/* Top row: reference + type badge + status */}
         <div className="flex flex-wrap items-center gap-2">
           <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums">
             {item.reference || item.publicId}
           </span>
           <Badge variant={getTypeBadgeVariant(item.originType)}>
             {getTypeLabel(item.originType)}
           </Badge>
           <Badge variant={getStatusBadgeVariant(item.status)} dot>
             {item.status}
           </Badge>
         </div>
 
         {/* Summary */}
         {item.summary && (
           <p className="mt-1 text-[13px] text-[var(--color-text-secondary)] leading-snug">
             {item.summary}
           </p>
         )}
 
         {/* Date */}
         <p className="mt-1.5 text-[11px] text-[var(--color-text-tertiary)]">
           {formatDate(item.createdAt)}
         </p>
       </div>
 
       {/* Actions */}
       <div className="shrink-0 flex items-center gap-2 pt-0.5">
         <Button
           variant="primary"
           size="sm"
           onClick={() => onApprove(item)}
         >
           Approve
         </Button>
         {canReject ? (
           <Button
             variant="ghost"
             size="sm"
             className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
             onClick={() => onReject(item)}
           >
             Reject
           </Button>
         ) : (
           <Button
             variant="ghost"
             size="sm"
             className="opacity-40 cursor-not-allowed"
             onClick={() => onReject(item)}
           >
             Reject
           </Button>
         )}
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Loading skeleton
 // ─────────────────────────────────────────────────────────────────────────────
 
 function ApprovalsLoadingSkeleton() {
   return (
     <div className="space-y-3">
       {Array.from({ length: 3 }).map((_, i) => (
         <div
           key={i}
           className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse"
         >
           <div className="flex gap-4">
             <div className="flex-1 space-y-2">
               <Skeleton width="40%" />
               <Skeleton width="70%" />
               <Skeleton width="30%" />
             </div>
             <div className="flex gap-2">
               <Skeleton width={70} height={32} />
               <Skeleton width={60} height={32} />
             </div>
           </div>
         </div>
       ))}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function ApprovalsPage() {
   const { success, error: toastError } = useToast();
   const [data, setData] = useState<ApprovalsResponse | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [pendingAction, setPendingAction] = useState<ActionState | null>(null);
   const [isActing, setIsActing] = useState(false);
   const [approveReason, setApproveReason] = useState('');
   const [approveReasonError, setApproveReasonError] = useState<string | null>(null);
   const [rejectReason, setRejectReason] = useState('');
   const [rejectReasonError, setRejectReasonError] = useState<string | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await adminApi.getApprovals();
       setData(result);
     } catch {
       setError("Couldn't load approvals. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   // ── Action handlers ────────────────────────────────────────────────────────
 
   const handleApprove = useCallback((item: ApprovalItem) => {
     setApproveReason('');
     setApproveReasonError(null);
     setPendingAction({ item, action: 'approve' });
   }, []);
 
   const handleReject = useCallback((item: ApprovalItem) => {
     if (item.originType === 'PAYROLL_RUN') {
       toastError('Payroll runs can only be approved, not rejected.');
       return;
     }
     setRejectReason('');
     setRejectReasonError(null);
     setPendingAction({ item, action: 'reject' });
   }, [toastError]);
 
   const handleConfirm = useCallback(async () => {
     if (!pendingAction) return;
     const { item, action } = pendingAction;
 
     // Validate approval reason
     if (action === 'approve') {
       if (!approveReason.trim()) {
         setApproveReasonError('Please provide a reason for approval.');
         return;
       }
     }
 
     // Validate rejection reason
     if (action === 'reject') {
       if (!rejectReason.trim()) {
         setRejectReasonError('Please provide a reason for rejection.');
         return;
       }
     }
 
     setIsActing(true);
     try {
       if (action === 'approve') {
         const reason = approveReason.trim();
         switch (item.originType) {
           case 'CREDIT_REQUEST':
             await adminApi.approveCreditRequest(item.id, { reason });
             break;
           case 'CREDIT_LIMIT_OVERRIDE_REQUEST':
             await adminApi.approveCreditOverride(item.id);
             break;
           case 'PAYROLL_RUN':
             await adminApi.approvePayroll(item.id);
             break;
           case 'PERIOD_CLOSE_REQUEST':
             await adminApi.approvePeriodClose(item.id, { note: reason });
             break;
           case 'EXPORT_REQUEST':
             await adminApi.approveExport(item.id, { reason });
             break;
           default:
             await adminApi.approveCreditRequest(item.id, { reason });
         }
         success('Approved successfully.');
       } else {
         const reason = rejectReason.trim();
         switch (item.originType) {
           case 'CREDIT_REQUEST':
             await adminApi.rejectCreditRequest(item.id, { reason });
             break;
           case 'CREDIT_LIMIT_OVERRIDE_REQUEST':
             await adminApi.rejectCreditOverride(item.id);
             break;
           case 'PERIOD_CLOSE_REQUEST':
             await adminApi.rejectPeriodClose(item.id, { note: reason });
             break;
           case 'EXPORT_REQUEST':
             await adminApi.rejectExport(item.id, { reason });
             break;
           default:
             await adminApi.rejectCreditRequest(item.id, { reason });
         }
         success('Rejected successfully.');
       }
       setPendingAction(null);
       setApproveReason('');
       setApproveReasonError(null);
       setRejectReason('');
       setRejectReasonError(null);
       // Reload to remove the acted-upon item
       await load();
     } catch (err) {
       const msg = err instanceof Error ? err.message : 'Action failed. Please try again.';
       toastError(msg);
     } finally {
       setIsActing(false);
     }
   }, [pendingAction, approveReason, rejectReason, success, toastError, load]);
 
   const handleCancel = useCallback(() => {
     if (!isActing) {
       setPendingAction(null);
       setApproveReason('');
       setApproveReasonError(null);
       setRejectReason('');
       setRejectReasonError(null);
     }
   }, [isActing]);
 
  // ── Render ─────────────────────────────────────────────────────────────────
  // Normalize grouped backend response (AdminApprovalsResponse) into flat pending items
  const pendingItems = data ? normalizeApprovals(data) : [];
  const groups = groupByType(pendingItems);
  const groupKeys = sortedGroupKeys(groups);
  const totalPending = pendingItems.length;

   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
             Approvals
           </h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
             {isLoading
               ? 'Loading pending approval items…'
               : totalPending > 0
                 ? `${totalPending} item${totalPending !== 1 ? 's' : ''} awaiting review`
                 : 'No pending items'}
           </p>
         </div>
         <Button
           variant="ghost"
           size="sm"
           onClick={load}
           disabled={isLoading}
           className="gap-1.5 shrink-0"
         >
           <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
           Refresh
         </Button>
       </div>
 
       {/* Error state */}
       {error && !isLoading && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]">
           <AlertCircle size={16} className="shrink-0 text-[var(--color-error)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
           <Button variant="ghost" size="sm" onClick={load} className="ml-auto shrink-0">
             Try again
           </Button>
         </div>
       )}
 
       {/* Loading skeleton */}
       {isLoading && <ApprovalsLoadingSkeleton />}
 
       {/* Empty state */}
       {!isLoading && !error && groupKeys.length === 0 && (
         <div className="flex flex-col items-center justify-center py-16 text-center">
           <CheckCircle size={32} className="text-[var(--color-text-tertiary)] mb-3" />
           <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
             No pending approvals
           </p>
           <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
             All items have been reviewed. Check back later.
           </p>
         </div>
       )}
 
       {/* Grouped approval items */}
       {!isLoading && !error && groupKeys.length > 0 && (
         <div className="space-y-8">
           {groupKeys.map((type) => (
             <section key={type}>
               <div className="flex items-center gap-2 mb-3">
                 <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                   {getTypeLabel(type)}
                 </h2>
                 <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded-md bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]">
                   {groups[type].length}
                 </span>
               </div>
               <div className="space-y-2">
                 {groups[type].map((item) => (
                   <ApprovalCard
                     key={`${item.originType}-${item.id}`}
                     item={item}
                     onApprove={handleApprove}
                     onReject={handleReject}
                   />
                 ))}
               </div>
             </section>
           ))}
         </div>
       )}
 
       {/* Approve dialog with required reason textarea */}
       {pendingAction && pendingAction.action === 'approve' && (
         <Modal
           isOpen
           onClose={handleCancel}
           title={`Approve ${getTypeLabel(pendingAction.item.originType)}`}
           size="sm"
           footer={
             <>
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={handleCancel}
                 disabled={isActing}
               >
                 Cancel
               </Button>
               <Button
                 variant="primary"
                 size="sm"
                 onClick={handleConfirm}
                 isLoading={isActing}
               >
                 Approve
               </Button>
             </>
           }
         >
           <div className="space-y-4">
             <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
               You are approving{' '}
               <span className="font-medium text-[var(--color-text-primary)]">
                 "{pendingAction.item.reference || pendingAction.item.publicId}"
               </span>
               . This action cannot be undone.
             </p>
             <div className="space-y-1.5">
               <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
                 Reason for approval <span className="text-[var(--color-error)]">*</span>
               </label>
               <textarea
                 value={approveReason}
                 onChange={(e) => {
                   setApproveReason(e.target.value);
                   if (e.target.value.trim()) setApproveReasonError(null);
                 }}
                 placeholder="Enter approval reason..."
                 rows={4}
                 disabled={isActing}
                 className={clsx(
                   'w-full rounded-lg border px-3 py-2',
                   'text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
                   'placeholder:text-[var(--color-text-tertiary)] resize-none',
                   'focus:outline-none focus:ring-1',
                   approveReasonError
                     ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
                     : 'border-[var(--color-border-default)] focus:ring-[var(--color-neutral-900)]',
                   isActing && 'opacity-60 cursor-not-allowed',
                 )}
               />
               {approveReasonError && (
                 <p className="text-[11px] text-[var(--color-error)]">{approveReasonError}</p>
               )}
             </div>
           </div>
         </Modal>
       )}
 
       {/* Reject dialog with required reason textarea */}
       {pendingAction && pendingAction.action === 'reject' && (
         <Modal
           isOpen
           onClose={handleCancel}
           title={`Reject ${getTypeLabel(pendingAction.item.originType)}`}
           size="sm"
           footer={
             <>
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={handleCancel}
                 disabled={isActing}
               >
                 Cancel
               </Button>
               <Button
                 size="sm"
                 onClick={handleConfirm}
                 isLoading={isActing}
                 className="bg-[var(--color-error)] hover:bg-[var(--color-error-hover)] text-[var(--color-text-inverse)]"
               >
                 Reject
               </Button>
             </>
           }
         >
           <div className="space-y-4">
             <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
               You are rejecting{' '}
               <span className="font-medium text-[var(--color-text-primary)]">
                 "{pendingAction.item.reference || pendingAction.item.publicId}"
               </span>
               . This will permanently decline the request.
             </p>
             <div className="space-y-1.5">
               <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
                 Reason for rejection <span className="text-[var(--color-error)]">*</span>
               </label>
               <textarea
                 value={rejectReason}
                 onChange={(e) => {
                   setRejectReason(e.target.value);
                   if (e.target.value.trim()) setRejectReasonError(null);
                 }}
                 placeholder="Explain why this request is being rejected..."
                 rows={4}
                 disabled={isActing}
                 className={clsx(
                   'w-full rounded-lg border px-3 py-2',
                   'text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
                   'placeholder:text-[var(--color-text-tertiary)] resize-none',
                   'focus:outline-none focus:ring-1',
                   rejectReasonError
                     ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
                     : 'border-[var(--color-border-default)] focus:ring-[var(--color-neutral-900)]',
                   isActing && 'opacity-60 cursor-not-allowed',
                 )}
               />
               {rejectReasonError && (
                 <p className="text-[11px] text-[var(--color-error)]">{rejectReasonError}</p>
               )}
             </div>
           </div>
         </Modal>
       )}
     </div>
   );
 }

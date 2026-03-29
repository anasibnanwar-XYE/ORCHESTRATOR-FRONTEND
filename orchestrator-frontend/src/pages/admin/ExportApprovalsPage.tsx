 /**
  * ExportApprovalsPage — Export Approval Gate
  *
  * Lists all pending data-export requests.
  * Each row shows: requester email, export type, requested date, status badge.
  *
  * Approve → PUT /admin/exports/{requestId}/approve  (triggers export generation)
  * Reject  → PUT /admin/exports/{requestId}/reject   (sends denial notification)
  * Both require confirmation dialogs.
  *
  * VAL-ADMIN-023, VAL-ADMIN-024
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
 } from 'lucide-react';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { adminApi } from '@/lib/adminApi';
 import type { ApprovalItem } from '@/types';
 import { format } from 'date-fns';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatDate(dateStr: string): string {
   try {
     return format(new Date(dateStr), 'd MMM yyyy, h:mm a');
   } catch {
     return dateStr;
   }
 }
 
 function getStatusBadgeVariant(status: string): 'success' | 'danger' | 'warning' | 'default' {
   switch (status?.toUpperCase()) {
     case 'APPROVED': return 'success';
     case 'REJECTED': return 'danger';
     case 'PENDING': return 'warning';
     default: return 'default';
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Action state
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface ActionState {
   item: ApprovalItem;
   action: 'approve' | 'reject';
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Loading skeleton
 // ─────────────────────────────────────────────────────────────────────────────
 
 function ExportLoadingSkeleton() {
   return (
     <div className="space-y-2 p-4">
       {Array.from({ length: 3 }).map((_, i) => (
         <div
           key={i}
           className="flex items-center gap-4 py-3 border-b border-[var(--color-border-subtle)] animate-pulse"
         >
           <Skeleton width="20%" />
           <Skeleton width="15%" />
           <Skeleton width="25%" />
           <Skeleton width="10%" />
           <Skeleton width={60} height={28} />
           <Skeleton width={55} height={28} />
         </div>
       ))}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function ExportApprovalsPage() {
   const { success, error: toastError } = useToast();
   const [exports, setExports] = useState<ApprovalItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [pendingAction, setPendingAction] = useState<ActionState | null>(null);
   const [isActing, setIsActing] = useState(false);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       // Export approvals come from /admin/approvals → exportRequests array
       // There is no /admin/exports/pending endpoint
       const data = await adminApi.getApprovals();
       setExports(data.exportRequests ?? []);
     } catch {
       setError("Couldn't load export requests. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   // ── Action handlers ────────────────────────────────────────────────────────
 
   const handleApprove = useCallback((item: ApprovalItem) => {
     setPendingAction({ item, action: 'approve' });
   }, []);
 
   const handleReject = useCallback((item: ApprovalItem) => {
     setPendingAction({ item, action: 'reject' });
   }, []);
 
   const handleConfirm = useCallback(async () => {
     if (!pendingAction) return;
     const { item, action } = pendingAction;
     setIsActing(true);
     try {
       if (action === 'approve') {
         await adminApi.approveExport(item.id);
         success('Export approved. Generation has started.');
       } else {
         await adminApi.rejectExport(item.id, {});
         success('Export request denied. Requester has been notified.');
       }
       setPendingAction(null);
       await load();
     } catch (err) {
       const msg = err instanceof Error ? err.message : 'Action failed. Please try again.';
       toastError(msg);
     } finally {
       setIsActing(false);
     }
   }, [pendingAction, success, toastError, load]);
 
   const handleCancel = useCallback(() => {
     if (!isActing) setPendingAction(null);
   }, [isActing]);
 
   // ── Table columns ──────────────────────────────────────────────────────────
 
   const columns: Column<ApprovalItem>[] = [
     {
       id: 'requester',
       header: 'Requester',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-primary)]">
           {row.requesterEmail ?? row.reference}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.requesterEmail ?? row.reference,
     },
     {
       id: 'reportType',
       header: 'Export Type',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-primary)]">
           {row.reportType ?? row.summary}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.reportType ?? row.summary,
     },
     {
       id: 'requestedAt',
       header: 'Requested',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)] tabular-nums">
           {formatDate(row.createdAt)}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => new Date(row.createdAt).getTime(),
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={getStatusBadgeVariant(row.status)} dot>
           {row.status}
         </Badge>
       ),
     },
   ];
 
   // ── Render ─────────────────────────────────────────────────────────────────
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
             Export Approvals
           </h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
             {isLoading
               ? 'Loading pending export requests…'
               : exports.length > 0
                 ? `${exports.length} pending export request${exports.length !== 1 ? 's' : ''}`
                 : 'No pending export requests'}
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
       {isLoading && <ExportLoadingSkeleton />}
 
       {/* Data table */}
       {!isLoading && !error && (
         <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
           <DataTable
             columns={columns}
             data={exports}
             keyExtractor={(row) => String(row.id)}
             searchable
             searchPlaceholder="Search by requester or type…"
             searchFilter={(row, q) =>
               (row.requesterEmail ?? '').toLowerCase().includes(q) ||
               (row.reportType ?? row.summary ?? '').toLowerCase().includes(q) ||
               (row.reference ?? '').toLowerCase().includes(q)
             }
             emptyMessage="No pending export requests"
             rowActions={(row) => (
               <div className="flex items-center gap-1.5">
                 <Button
                   variant="primary"
                   size="sm"
                   onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
                 >
                   Approve
                 </Button>
                 <Button
                   variant="ghost"
                   size="sm"
                   className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                   onClick={(e) => { e.stopPropagation(); handleReject(row); }}
                 >
                   Reject
                 </Button>
               </div>
             )}
             mobileCardRenderer={(row) => (
               <div className="space-y-2">
                 <div className="flex items-center justify-between gap-2">
                   <span className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                     {row.requesterEmail ?? row.reference}
                   </span>
                   <Badge variant={getStatusBadgeVariant(row.status)} dot>
                     {row.status}
                   </Badge>
                 </div>
                 <p className="text-[12px] text-[var(--color-text-secondary)]">{row.reportType ?? row.summary}</p>
                 <p className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                   {formatDate(row.createdAt)}
                 </p>
                 <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--color-border-subtle)]">
                   <Button
                     variant="primary"
                     size="sm"
                     onClick={() => handleApprove(row)}
                   >
                     Approve
                   </Button>
                   <Button
                     variant="ghost"
                     size="sm"
                     className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                     onClick={() => handleReject(row)}
                   >
                     Reject
                   </Button>
                 </div>
               </div>
             )}
           />
         </div>
       )}
 
       {/* Confirmation dialog */}
       {pendingAction && (
         <ConfirmDialog
           isOpen
           title={
             pendingAction.action === 'approve'
               ? 'Approve Export Request'
               : 'Reject Export Request'
           }
           message={
             pendingAction.action === 'approve'
               ? `Approve the export of "${pendingAction.item.reportType ?? pendingAction.item.summary}" requested by ${pendingAction.item.requesterEmail ?? pendingAction.item.reference}? Export generation will begin immediately.`
               : `Reject the export request for "${pendingAction.item.reportType ?? pendingAction.item.summary}" by ${pendingAction.item.requesterEmail ?? pendingAction.item.reference}? They will receive a denial notification.`
           }
           confirmLabel={pendingAction.action === 'approve' ? 'Approve' : 'Reject'}
           variant={pendingAction.action === 'reject' ? 'danger' : 'default'}
           isLoading={isActing}
           onConfirm={handleConfirm}
           onCancel={handleCancel}
         />
       )}
     </div>
   );
 }

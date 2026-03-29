 /**
  * LeaveRequestsPage
  *
  * Leave request management:
  *  - List all leave requests with status filter
  *  - Submit leave request form (employee, type, date range, reason)
  *  - Approve / reject by manager with optional reason
  *  - Leave type policies display
  *  - Employee leave balances lookup
  *
  * API:
  *  GET    /api/v1/hr/leave-requests
  *  POST   /api/v1/hr/leave-requests
  *  PATCH  /api/v1/hr/leave-requests/{id}/status
  *  GET    /api/v1/hr/leave-types
  *  GET    /api/v1/hr/employees/{employeeId}/leave-balances
  */
 
 import { useEffect, useState, useCallback, useMemo } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Plus,
   MoreHorizontal,
 } from 'lucide-react';
 import { format, differenceInCalendarDays, parseISO } from 'date-fns';
  import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { Tabs } from '@/components/ui/Tabs';
 import { DropdownMenu } from '@/components/ui/DropdownMenu';
 import { useToast } from '@/components/ui/Toast';
 import {
   hrApi,
   type LeaveRequestDto,
   type LeaveRequestStatus,
   type LeaveTypePolicyDto,
   type EmployeeDto,
 } from '@/lib/hrApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
   const map: Record<LeaveRequestStatus, { variant: 'success' | 'warning' | 'danger' | 'default' | 'info'; label: string }> = {
     PENDING: { variant: 'warning', label: 'Pending' },
     APPROVED: { variant: 'success', label: 'Approved' },
     REJECTED: { variant: 'danger', label: 'Rejected' },
     CANCELLED: { variant: 'default', label: 'Cancelled' },
   };
   const m = map[status] ?? { variant: 'default' as const, label: status };
   return (
     <Badge variant={m.variant} dot>
       {m.label}
     </Badge>
   );
 }
 
 function formatDate(d: string): string {
   try {
     return format(parseISO(d), 'dd MMM yyyy');
   } catch {
     return d;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Submit Leave Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface SubmitLeaveFormProps {
   employees: EmployeeDto[];
   leaveTypes: LeaveTypePolicyDto[];
   onSave: (data: {
     employeeId: number;
     leaveType: string;
     startDate: string;
     endDate: string;
     reason: string;
   }) => Promise<void>;
   onClose: () => void;
   isSaving: boolean;
 }
 
 interface SubmitLeaveFormState {
   employeeId: string;
   leaveType: string;
   startDate: string;
   endDate: string;
   reason: string;
 }
 
 interface SubmitLeaveFormErrors {
   employeeId?: string;
   leaveType?: string;
   startDate?: string;
   endDate?: string;
 }
 
 function SubmitLeaveForm({
   employees,
   leaveTypes,
   onSave,
   onClose,
   isSaving,
 }: SubmitLeaveFormProps) {
   const [form, setForm] = useState<SubmitLeaveFormState>({
     employeeId: '',
     leaveType: '',
     startDate: '',
     endDate: '',
     reason: '',
   });
   const [errors, setErrors] = useState<SubmitLeaveFormErrors>({});
   const [balances, setBalances] = useState<{ leaveType: string; remaining: number }[]>([]);
 
   // Load balances when employee selected
   useEffect(() => {
     if (!form.employeeId) {
       setBalances([]);
       return;
     }
     hrApi
       .getLeaveBalances(Number(form.employeeId))
       .then((data) =>
         setBalances(
           (data ?? []).map((b) => ({ leaveType: b.leaveType, remaining: b.remaining }))
         )
       )
       .catch(() => setBalances([]));
   }, [form.employeeId]);
 
   const totalDays = useMemo(() => {
     if (!form.startDate || !form.endDate) return 0;
     try {
       const diff = differenceInCalendarDays(parseISO(form.endDate), parseISO(form.startDate));
       return diff < 0 ? 0 : diff + 1;
     } catch {
       return 0;
     }
   }, [form.startDate, form.endDate]);
 
   function set(field: keyof SubmitLeaveFormState, value: string) {
     setForm((prev) => ({ ...prev, [field]: value }));
     setErrors((prev) => ({ ...prev, [field]: undefined }));
   }
 
   function validate(): boolean {
     const errs: SubmitLeaveFormErrors = {};
     if (!form.employeeId) errs.employeeId = 'Employee is required';
     if (!form.leaveType) errs.leaveType = 'Leave type is required';
     if (!form.startDate) errs.startDate = 'Start date is required';
     if (!form.endDate) errs.endDate = 'End date is required';
     else if (form.startDate && form.endDate && form.endDate < form.startDate) {
       errs.endDate = 'End date must be on or after start date';
     }
     setErrors(errs);
     return Object.keys(errs).length === 0;
   }
 
   async function handleSubmit() {
     if (!validate()) return;
     await onSave({
       employeeId: Number(form.employeeId),
       leaveType: form.leaveType,
       startDate: form.startDate,
       endDate: form.endDate,
       reason: form.reason.trim(),
     });
   }
 
   const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
   const selectedBalance = balances.find((b) => b.leaveType === form.leaveType);
 
   return (
     <div className="space-y-3">
       <Select
         label="Employee"
         value={form.employeeId}
         onChange={(e) => set('employeeId', e.target.value)}
         error={errors.employeeId}
         options={[
           { value: '', label: 'Select employee...' },
           ...activeEmployees.map((e) => ({
             value: String(e.id),
             label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
           })),
         ]}
         required
       />
 
       <Select
         label="Leave Type"
         value={form.leaveType}
         onChange={(e) => set('leaveType', e.target.value)}
         error={errors.leaveType}
         options={[
           { value: '', label: 'Select leave type...' },
           ...leaveTypes
             .filter((t) => t.active)
             .map((t) => ({ value: t.leaveType, label: t.leaveType })),
         ]}
         required
       />
 
       {selectedBalance && (
         <p className="text-[12px] text-[var(--color-text-tertiary)]">
           Available balance:{' '}
           <span className="font-semibold text-[var(--color-text-primary)]">
             {selectedBalance.remaining} days
           </span>
         </p>
       )}
 
       <div className="grid grid-cols-2 gap-3">
         <Input
           label="Start Date"
           type="date"
           value={form.startDate}
           onChange={(e) => set('startDate', e.target.value)}
           error={errors.startDate}
           required
         />
         <Input
           label="End Date"
           type="date"
           value={form.endDate}
           onChange={(e) => set('endDate', e.target.value)}
           error={errors.endDate}
           required
         />
       </div>
 
       {totalDays > 0 && (
         <p className="text-[12px] text-[var(--color-text-tertiary)]">
           Total:{' '}
           <span className="font-semibold text-[var(--color-text-primary)]">
             {totalDays} {totalDays === 1 ? 'day' : 'days'}
           </span>
         </p>
       )}
 
       <div>
         <label className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
           Reason (optional)
         </label>
         <textarea
           value={form.reason}
           onChange={(e) => set('reason', e.target.value)}
           rows={3}
           placeholder="Brief reason for leave..."
           className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)] resize-none"
         />
       </div>
 
       <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
         <Button variant="ghost" onClick={onClose} disabled={isSaving}>
           Cancel
         </Button>
        <Button onClick={() => { void handleSubmit(); }} isLoading={isSaving}>
           Submit Request
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Decision modal (approve / reject)
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface DecisionModalProps {
   request: LeaveRequestDto;
   action: 'APPROVED' | 'REJECTED';
   onConfirm: (reason: string) => Promise<void>;
   onClose: () => void;
   isSaving: boolean;
 }
 
 function DecisionModal({ request, action, onConfirm, onClose, isSaving }: DecisionModalProps) {
   const [reason, setReason] = useState('');
 
   return (
     <div className="space-y-3">
       <div className="rounded-lg bg-[var(--color-surface-secondary)] p-3 text-[13px]">
         <p className="font-medium text-[var(--color-text-primary)]">{request.employeeName}</p>
         <p className="text-[var(--color-text-secondary)]">
           {request.leaveType} — {formatDate(request.startDate)} to {formatDate(request.endDate)} (
           {request.totalDays} {request.totalDays === 1 ? 'day' : 'days'})
         </p>
         {request.reason && (
           <p className="mt-1 text-[var(--color-text-tertiary)] italic">{request.reason}</p>
         )}
       </div>
 
       <div>
         <label className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
           {action === 'REJECTED' ? 'Rejection reason (optional)' : 'Note (optional)'}
         </label>
         <textarea
           value={reason}
           onChange={(e) => setReason(e.target.value)}
           rows={2}
           placeholder={action === 'REJECTED' ? 'Reason for rejection...' : 'Any note...'}
           className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)] resize-none"
         />
       </div>
 
       <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
         <Button variant="ghost" onClick={onClose} disabled={isSaving}>
           Cancel
         </Button>
         <Button
           variant={action === 'REJECTED' ? 'danger' : 'primary'}
          onClick={() => { void onConfirm(reason); }}
          isLoading={isSaving}
         >
           {action === 'APPROVED' ? 'Approve' : 'Reject'}
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function LeaveRequestsPage() {
   const { success: toastSuccess, error: toastError } = useToast();
   const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
   const [employees, setEmployees] = useState<EmployeeDto[]>([]);
   const [leaveTypes, setLeaveTypes] = useState<LeaveTypePolicyDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const [statusFilter, setStatusFilter] = useState<'ALL' | LeaveRequestStatus>('ALL');
   const [submitOpen, setSubmitOpen] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
 
   const [decisionModal, setDecisionModal] = useState<{
     request: LeaveRequestDto;
     action: 'APPROVED' | 'REJECTED';
   } | null>(null);
   const [isDeciding, setIsDeciding] = useState(false);
 
   const loadData = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const [reqs, emps, types] = await Promise.all([
         hrApi.getLeaveRequests(),
         hrApi.getEmployees(),
         hrApi.getLeaveTypes(),
       ]);
       setRequests(reqs ?? []);
       setEmployees(emps ?? []);
       setLeaveTypes(types ?? []);
     } catch {
       setError('Failed to load leave requests.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => {
     void loadData();
   }, [loadData]);
 
   const filtered = useMemo(
     () =>
       statusFilter === 'ALL'
         ? requests
         : requests.filter((r) => r.status === statusFilter),
     [requests, statusFilter]
   );
 
   async function handleSubmit(data: {
     employeeId: number;
     leaveType: string;
     startDate: string;
     endDate: string;
     reason: string;
   }) {
     setIsSaving(true);
     try {
       await hrApi.createLeaveRequest({
         employeeId: data.employeeId,
         leaveType: data.leaveType,
         startDate: data.startDate,
         endDate: data.endDate,
         reason: data.reason || undefined,
       });
       toastSuccess('Leave request submitted');
       setSubmitOpen(false);
       await loadData();
     } catch (err: unknown) {
       const msg = err instanceof Error ? err.message : 'Failed to submit leave request';
       toastError(msg);
     } finally {
       setIsSaving(false);
     }
   }
 
   async function handleDecision(reason: string) {
     if (!decisionModal) return;
     setIsDeciding(true);
     try {
       await hrApi.updateLeaveStatus(decisionModal.request.id, {
         status: decisionModal.action,
         decisionReason: reason || undefined,
       });
       toastSuccess(`Leave request ${decisionModal.action === 'APPROVED' ? 'approved' : 'rejected'}`);
       setDecisionModal(null);
       await loadData();
     } catch (err: unknown) {
       const msg = err instanceof Error ? err.message : 'Failed to update leave status';
       toastError(msg);
     } finally {
       setIsDeciding(false);
     }
   }
 
   const columns: Column<LeaveRequestDto>[] = [
     {
       id: 'employee',
       header: 'Employee',
       accessor: (r) => (
         <div>
           <p className="font-medium text-[var(--color-text-primary)]">{r.employeeName}</p>
           <p className="text-[11px] text-[var(--color-text-tertiary)]">{r.employeeCode}</p>
         </div>
       ),
     },
     {
       id: 'leaveType',
       header: 'Type',
       accessor: (r) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">{r.leaveType}</span>
       ),
     },
     {
       id: 'dates',
       header: 'Date Range',
       accessor: (r) => (
         <div>
           <p className="text-[13px] text-[var(--color-text-primary)]">
             {formatDate(r.startDate)} — {formatDate(r.endDate)}
           </p>
           <p className="text-[11px] text-[var(--color-text-tertiary)]">
             {r.totalDays} {r.totalDays === 1 ? 'day' : 'days'}
           </p>
         </div>
       ),
     },
     {
       id: 'reason',
       header: 'Reason',
       accessor: (r) => (
         <span className="text-[13px] text-[var(--color-text-secondary)] line-clamp-1">
           {r.reason ?? '—'}
         </span>
       ),
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (r) => <LeaveStatusBadge status={r.status} />,
     },
     {
       id: 'actions',
       header: '',
       width: '48px',
       accessor: (r) => {
         const isPending = r.status === 'PENDING';
         if (!isPending) return null;
         return (
           <DropdownMenu
             trigger={
               <button
                 className="p-1.5 rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]"
                 aria-label="Actions"
               >
                 <MoreHorizontal size={14} />
               </button>
             }
             items={[
               { label: 'Approve', value: 'approve' },
               { label: 'Reject', value: 'reject', destructive: true },
             ]}
             onSelect={(value) => {
               if (value === 'approve') setDecisionModal({ request: r, action: 'APPROVED' });
               else if (value === 'reject') setDecisionModal({ request: r, action: 'REJECTED' });
             }}
           />
         );
       },
     },
   ];
 
   if (loading) {
     return (
       <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
         <AlertCircle size={32} className="text-[var(--color-danger-text)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => { void loadData(); }} leftIcon={<RefreshCcw size={13} />}>
           Retry
         </Button>
       </div>
     );
   }
 
   const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
 
   return (
     <div className="space-y-4">
       <PageHeader
         title="Leave Requests"
        description={pendingCount > 0 ? `${pendingCount} pending approval` : 'All leave requests'}
         actions={
          <Button leftIcon={<Plus size={14} />} onClick={() => setSubmitOpen(true)}>
             New Request
           </Button>
         }
       />
 
       {/* Status filter */}
       <Tabs
         tabs={[
           { label: 'All', value: 'ALL', count: requests.length },
           {
             label: 'Pending',
             value: 'PENDING',
             count: requests.filter((r) => r.status === 'PENDING').length,
           },
           {
             label: 'Approved',
             value: 'APPROVED',
             count: requests.filter((r) => r.status === 'APPROVED').length,
           },
           {
             label: 'Rejected',
             value: 'REJECTED',
             count: requests.filter((r) => r.status === 'REJECTED').length,
           },
         ]}
         active={statusFilter}
         onChange={(v) => setStatusFilter(v as 'ALL' | LeaveRequestStatus)}
         variant="pill"
         size="sm"
       />
 
       <DataTable
         data={filtered}
         columns={columns}
         keyExtractor={(r) => String(r.id)}
         emptyMessage={
           statusFilter === 'PENDING'
             ? 'No pending leave requests.'
             : 'No leave requests found.'
         }
       />
 
       {/* Submit Request Modal */}
       <Modal
        isOpen={submitOpen}
        onClose={() => { if (!isSaving) setSubmitOpen(false); }}
         title="New Leave Request"
         size="md"
       >
         <SubmitLeaveForm
           employees={employees}
           leaveTypes={leaveTypes}
           onSave={handleSubmit}
           onClose={() => setSubmitOpen(false)}
           isSaving={isSaving}
         />
       </Modal>
 
       {/* Approve / Reject Modal */}
       {decisionModal && (
         <Modal
          isOpen={!!decisionModal}
          onClose={() => { if (!isDeciding) setDecisionModal(null); }}
           title={decisionModal.action === 'APPROVED' ? 'Approve Leave' : 'Reject Leave'}
           size="sm"
         >
           <DecisionModal
             request={decisionModal.request}
             action={decisionModal.action}
             onConfirm={handleDecision}
             onClose={() => setDecisionModal(null)}
             isSaving={isDeciding}
           />
         </Modal>
       )}
     </div>
   );
 }

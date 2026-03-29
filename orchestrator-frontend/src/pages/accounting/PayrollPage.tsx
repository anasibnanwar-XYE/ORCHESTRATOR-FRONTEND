 /**
  * PayrollPage
  *
  * Full payroll lifecycle management:
  *  - List all payroll runs (filter by type: Monthly / Weekly)
  *  - Create run (select type + period)
  *  - Calculate: DRAFT → CALCULATED (computes gross/deductions/net per employee)
  *  - Review line-item breakdowns (PF, ESI, TDS, PT per employee)
  *  - Approve: CALCULATED → APPROVED (locks calculations)
  *  - Post: APPROVED → POSTED (generates salary journal entries)
  *  - Mark Paid: POSTED → PAID (records payment date/method)
  *  - Summary views (weekly, monthly)
  *
  * API:
  *  GET  /api/v1/payroll/runs
  *  POST /api/v1/payroll/runs
  *  POST /api/v1/payroll/runs/monthly
  *  POST /api/v1/payroll/runs/weekly
  *  GET  /api/v1/payroll/runs/{id}
  *  GET  /api/v1/payroll/runs/{id}/lines
  *  POST /api/v1/payroll/runs/{id}/calculate
  *  POST /api/v1/payroll/runs/{id}/approve
  *  POST /api/v1/payroll/runs/{id}/post
  *  POST /api/v1/payroll/runs/{id}/mark-paid
  *  GET  /api/v1/payroll/summary/current-month
  *  GET  /api/v1/payroll/summary/current-week
  */
 
 import { useEffect, useState, useCallback, useMemo } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Plus,
    Calculator,
   CheckCircle,
   FileText,
   CreditCard,
   ChevronDown,
   ChevronRight,
 } from 'lucide-react';
 import { format, parseISO } from 'date-fns';
 import { clsx } from 'clsx';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Tabs } from '@/components/ui/Tabs';
  import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { useToast } from '@/components/ui/Toast';
 import {
   hrApi,
   type PayrollRunDto,
   type PayrollRunLineDto,
   type PayrollRunStatus,
   type PayrollRunType,
   type MonthlyPaySummaryDto,
   type WeeklyPaySummaryDto,
   type EmployeeMonthlyPayDto,
 } from '@/lib/hrApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 0,
   }).format(amount);
 }
 
 function formatDate(d: string): string {
   try {
     return format(parseISO(d), 'dd MMM yyyy');
   } catch {
     return d;
   }
 }
 
 const STATUS_ORDER: PayrollRunStatus[] = ['DRAFT', 'CALCULATED', 'APPROVED', 'POSTED', 'PAID'];
 
 function runStatusVariant(
   status: PayrollRunStatus
 ): 'default' | 'warning' | 'info' | 'success' | 'danger' {
   switch (status) {
     case 'DRAFT': return 'default';
     case 'CALCULATED': return 'warning';
     case 'APPROVED': return 'info';
     case 'POSTED': return 'info';
     case 'PAID': return 'success';
     default: return 'default';
   }
 }
 
 function runStatusLabel(status: PayrollRunStatus): string {
   switch (status) {
     case 'DRAFT': return 'Draft';
     case 'CALCULATED': return 'Calculated';
     case 'APPROVED': return 'Approved';
     case 'POSTED': return 'Posted';
     case 'PAID': return 'Paid';
     default: return status;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Lifecycle stepper
 // ─────────────────────────────────────────────────────────────────────────────
 
 function LifecycleStepper({ status }: { status: PayrollRunStatus }) {
   const steps = STATUS_ORDER;
   const currentIndex = steps.indexOf(status);
   return (
     <div className="flex items-center gap-0">
       {steps.map((step, i) => {
         const done = i < currentIndex;
         const active = i === currentIndex;
         return (
           <div key={step} className="flex items-center">
             <div
               className={clsx(
                 'h-1.5 w-1.5 rounded-full transition-colors',
                 done || active
                   ? 'bg-[var(--color-neutral-900)]'
                   : 'bg-[var(--color-border-default)]'
               )}
             />
             {i < steps.length - 1 && (
               <div
                 className={clsx(
                   'h-px w-6 transition-colors',
                   done ? 'bg-[var(--color-neutral-900)]' : 'bg-[var(--color-border-default)]'
                 )}
               />
             )}
           </div>
         );
       })}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Create Run Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface CreateRunFormProps {
   onSave: (type: PayrollRunType, year?: number, month?: number, weekEndingDate?: string) => Promise<void>;
   onClose: () => void;
   isSaving: boolean;
 }
 
 function CreateRunForm({ onSave, onClose, isSaving }: CreateRunFormProps) {
   const [runType, setRunType] = useState<PayrollRunType>('MONTHLY');
   const [year, setYear] = useState(new Date().getFullYear());
   const [month, setMonth] = useState(new Date().getMonth() + 1);
   const [weekEndingDate, setWeekEndingDate] = useState('');
 
   const MONTH_OPTIONS = [
     { value: '1', label: 'January' }, { value: '2', label: 'February' },
     { value: '3', label: 'March' }, { value: '4', label: 'April' },
     { value: '5', label: 'May' }, { value: '6', label: 'June' },
     { value: '7', label: 'July' }, { value: '8', label: 'August' },
     { value: '9', label: 'September' }, { value: '10', label: 'October' },
     { value: '11', label: 'November' }, { value: '12', label: 'December' },
   ];
 
   async function handleSubmit() {
     if (runType === 'MONTHLY') {
       await onSave('MONTHLY', year, month);
     } else {
       if (!weekEndingDate) return;
       await onSave('WEEKLY', undefined, undefined, weekEndingDate);
     }
   }
 
   return (
     <div className="space-y-3">
       <Select
         label="Payroll Type"
         value={runType}
         onChange={(e) => setRunType(e.target.value as PayrollRunType)}
         options={[
           { value: 'MONTHLY', label: 'Monthly (Staff)' },
           { value: 'WEEKLY', label: 'Weekly (Labour)' },
         ]}
       />
 
       {runType === 'MONTHLY' ? (
         <div className="grid grid-cols-2 gap-3">
           <Select
             label="Month"
             value={String(month)}
             onChange={(e) => setMonth(Number(e.target.value))}
             options={MONTH_OPTIONS}
           />
           <Select
             label="Year"
             value={String(year)}
             onChange={(e) => setYear(Number(e.target.value))}
             options={Array.from({ length: 3 }, (_, i) => {
               const y = new Date().getFullYear() - 1 + i;
               return { value: String(y), label: String(y) };
             })}
           />
         </div>
       ) : (
         <Input
           label="Week Ending Date"
           type="date"
           value={weekEndingDate}
           onChange={(e) => setWeekEndingDate(e.target.value)}
           required
         />
       )}
 
       <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
         <Button variant="ghost" onClick={onClose} disabled={isSaving}>
           Cancel
         </Button>
        <Button onClick={() => { void handleSubmit(); }} isLoading={isSaving} leftIcon={<Plus size={13} />}>
           Create Run
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Payroll Run Detail (lines breakdown)
 // ─────────────────────────────────────────────────────────────────────────────
 
 function PayrollRunDetail({
   run,
   onAction,
 }: {
   run: PayrollRunDto;
   onAction: () => void;
 }) {
   const { success: toastSuccess, error: toastError } = useToast();
   const [lines, setLines] = useState<PayrollRunLineDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [expandedLine, setExpandedLine] = useState<number | null>(null);
 
   // Mark paid modal
   const [markPaidOpen, setMarkPaidOpen] = useState(false);
   const [paymentRef, setPaymentRef] = useState('');
   const [isProcessing, setIsProcessing] = useState(false);
 
   const [confirmAction, setConfirmAction] = useState<{
     label: string;
     message: string;
     fn: () => Promise<void>;
   } | null>(null);
 
   useEffect(() => {
     hrApi
       .getPayrollRunLines(run.id)
       .then((data) => setLines(data ?? []))
       .catch(() => setLines([]))
       .finally(() => setLoading(false));
   }, [run.id]);
 
   async function doAction(fn: () => Promise<PayrollRunDto>, label: string) {
     setIsProcessing(true);
     try {
       await fn();
       toastSuccess(`${label} successful`);
       onAction();
     } catch (err: unknown) {
       const msg = err instanceof Error ? err.message : `Failed to ${label.toLowerCase()}`;
       toastError(msg);
     } finally {
       setIsProcessing(false);
     }
   }
 
   async function handleMarkPaid() {
     setIsProcessing(true);
     try {
       await hrApi.markPayrollRunPaid(run.id, paymentRef || undefined);
       toastSuccess('Payroll marked as paid');
       setMarkPaidOpen(false);
       onAction();
     } catch (err: unknown) {
       const msg = err instanceof Error ? err.message : 'Failed to mark as paid';
       toastError(msg);
     } finally {
       setIsProcessing(false);
     }
   }
 
   return (
     <div className="space-y-4">
       {/* Run summary header */}
       <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] p-4">
         <div className="flex items-start justify-between gap-4">
           <div>
             <div className="flex items-center gap-2 mb-1">
               <p className="font-semibold text-[var(--color-text-primary)]">{run.runNumber}</p>
               <Badge variant={runStatusVariant(run.status)}>{runStatusLabel(run.status)}</Badge>
             </div>
             <p className="text-[12px] text-[var(--color-text-tertiary)]">
               {run.runType} · {formatDate(run.periodStart)} — {formatDate(run.periodEnd)}
             </p>
             <div className="mt-2">
               <LifecycleStepper status={run.status} />
             </div>
           </div>
 
           {/* Action buttons based on status */}
           <div className="flex items-center gap-2 shrink-0">
             {run.status === 'DRAFT' && (
               <Button
                 size="sm"
                leftIcon={<Calculator size={13} />}
                isLoading={isProcessing}
                 onClick={() =>
                   setConfirmAction({
                     label: 'Calculate',
                     message: 'This will compute gross pay, deductions, and net pay for all employees in this run. Continue?',
                     fn: () => doAction(() => hrApi.calculatePayrollRun(run.id), 'Calculate'),
                   })
                 }
               >
                 Calculate
               </Button>
             )}
             {run.status === 'CALCULATED' && (
               <Button
                 size="sm"
                leftIcon={<CheckCircle size={13} />}
                isLoading={isProcessing}
                 onClick={() =>
                   setConfirmAction({
                     label: 'Approve',
                     message: 'Approving locks all calculations. Employees cannot be added/removed after approval. Continue?',
                     fn: () => doAction(() => hrApi.approvePayrollRun(run.id), 'Approve'),
                   })
                 }
               >
                 Approve
               </Button>
             )}
             {run.status === 'APPROVED' && (
               <Button
                 size="sm"
                leftIcon={<FileText size={13} />}
                isLoading={isProcessing}
                 onClick={() =>
                   setConfirmAction({
                     label: 'Post',
                     message: 'Posting will generate salary journal entries (debit Salary Expense, credit Salary Payable). This cannot be undone. Continue?',
                     fn: () => doAction(() => hrApi.postPayrollRun(run.id), 'Post'),
                   })
                 }
               >
                 Post
               </Button>
             )}
             {run.status === 'POSTED' && (
               <Button
                 size="sm"
                variant="secondary"
                leftIcon={<CreditCard size={13} />}
                isLoading={isProcessing}
                 onClick={() => setMarkPaidOpen(true)}
               >
                 Mark Paid
               </Button>
             )}
           </div>
         </div>
 
         {/* Totals */}
         <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
           {[
             { label: 'Gross Pay', value: run.totalBasePay + run.totalOvertimePay },
             { label: 'Deductions', value: run.totalDeductions },
             { label: 'Net Pay', value: run.totalNetPay },
             { label: 'Employees', value: lines.length, isCount: true },
           ].map((c) => (
             <div key={c.label} className="rounded-lg bg-[var(--color-surface-secondary)] p-3">
               <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                 {c.label}
               </p>
               <p className="text-[15px] font-semibold tabular-nums mt-0.5">
                 {c.isCount ? String(c.value) : formatINR(c.value)}
               </p>
             </div>
           ))}
         </div>
 
         {run.journalEntryId && (
           <p className="mt-3 text-[12px] text-[var(--color-text-tertiary)]">
             Journal Entry #{run.journalEntryId}
           </p>
         )}
       </div>
 
       {/* Employee line items */}
       {loading ? (
         <Skeleton className="h-48 w-full" />
       ) : lines.length === 0 ? (
         <p className="text-center py-8 text-[13px] text-[var(--color-text-tertiary)]">
           No employee lines yet. Calculate the run to generate breakdowns.
         </p>
       ) : (
         <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
           <div className="px-4 py-2.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
             <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
               Employee Breakdown
             </p>
           </div>
           <div className="divide-y divide-[var(--color-border-subtle)]">
             {lines.map((line) => {
               const isExpanded = expandedLine === line.id;
               return (
                 <div key={line.id}>
                   <button
                     type="button"
                     className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-secondary)] transition-colors text-left"
                     onClick={() => setExpandedLine(isExpanded ? null : line.id)}
                   >
                     {isExpanded ? (
                       <ChevronDown size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
                     ) : (
                       <ChevronRight size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
                     )}
                     <div className="flex-1 min-w-0">
                       <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {line.employeeName}
                       </p>
                       <p className="text-[11px] text-[var(--color-text-tertiary)]">
                         {line.employeeCode} · {line.presentDays}d present
                       </p>
                     </div>
                     <div className="flex items-center gap-6 shrink-0 text-right">
                       <div>
                         <p className="text-[11px] text-[var(--color-text-tertiary)]">Gross</p>
                         <p className="tabular-nums text-[13px] font-medium">
                           {formatINR(line.grossPay)}
                         </p>
                       </div>
                       <div>
                         <p className="text-[11px] text-[var(--color-text-tertiary)]">Deductions</p>
                         <p className="tabular-nums text-[13px] text-red-500 font-medium">
                           −{formatINR(line.totalDeductions)}
                         </p>
                       </div>
                       <div>
                         <p className="text-[11px] text-[var(--color-text-tertiary)]">Net</p>
                         <p className="tabular-nums text-[13px] font-semibold text-[var(--color-text-primary)]">
                           {formatINR(line.netPay)}
                         </p>
                       </div>
                     </div>
                   </button>
 
                   {isExpanded && (
                     <div className="px-10 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {/* Earnings */}
                       <div>
                         <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                           Earnings
                         </p>
                         <div className="space-y-1 text-[12px]">
                           {[
                             { label: 'Basic', value: line.basicSalaryComponent },
                             { label: 'HRA', value: line.hraComponent },
                             { label: 'DA', value: line.daComponent },
                             { label: 'Special Allowance', value: line.specialAllowanceComponent },
                             ...(line.overtimePay > 0
                               ? [{ label: 'Overtime', value: line.overtimePay }]
                               : []),
                             ...(line.holidayPay > 0
                               ? [{ label: 'Holiday Pay', value: line.holidayPay }]
                               : []),
                           ].map((row) => (
                             <div key={row.label} className="flex justify-between">
                               <span className="text-[var(--color-text-secondary)]">
                                 {row.label}
                               </span>
                               <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                                 {formatINR(row.value)}
                               </span>
                             </div>
                           ))}
                           <div className="flex justify-between border-t border-[var(--color-border-subtle)] pt-1 font-semibold">
                             <span>Gross Pay</span>
                             <span className="tabular-nums">{formatINR(line.grossPay)}</span>
                           </div>
                         </div>
                       </div>
 
                       {/* Deductions */}
                       <div>
                         <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                           Deductions
                         </p>
                         <div className="space-y-1 text-[12px]">
                           {[
                             { label: 'PF (Employee)', value: line.pfDeduction },
                             { label: 'ESI (Employee)', value: line.esiDeduction },
                             { label: 'TDS', value: line.taxDeduction },
                             { label: 'Professional Tax', value: line.professionalTaxDeduction },
                             ...(line.loanDeduction > 0
                               ? [{ label: 'Loan Recovery', value: line.loanDeduction }]
                               : []),
                             ...(line.leaveWithoutPayDeduction > 0
                               ? [{ label: 'LWP', value: line.leaveWithoutPayDeduction }]
                               : []),
                             ...(line.otherDeductions > 0
                               ? [{ label: 'Other', value: line.otherDeductions }]
                               : []),
                           ]
                             .filter((r) => r.value > 0)
                             .map((row) => (
                               <div key={row.label} className="flex justify-between">
                                 <span className="text-[var(--color-text-secondary)]">
                                   {row.label}
                                 </span>
                                 <span className="tabular-nums text-red-500">
                                   −{formatINR(row.value)}
                                 </span>
                               </div>
                             ))}
                           <div className="flex justify-between border-t border-[var(--color-border-subtle)] pt-1 font-semibold">
                             <span>Net Pay</span>
                             <span className="tabular-nums">{formatINR(line.netPay)}</span>
                           </div>
                         </div>
                       </div>
 
                       {/* Attendance */}
                       <div>
                         <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                           Attendance
                         </p>
                         <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                           <span className="text-green-600 font-medium">{line.presentDays}d present</span>
                           <span className="text-red-400">{line.absentDays}d absent</span>
                           <span className="text-yellow-600">{line.halfDays}d half</span>
                           <span className="text-blue-500">{line.leaveDays}d leave</span>
                           {line.overtimeHours > 0 && (
                             <span className="text-[var(--color-text-secondary)]">
                               {line.overtimeHours}h OT
                             </span>
                           )}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
         </div>
       )}
 
       {/* Mark Paid Modal */}
       <Modal
        isOpen={markPaidOpen}
        onClose={() => { if (!isProcessing) setMarkPaidOpen(false); }}
         title="Mark as Paid"
         size="sm"
       >
         <div className="space-y-3">
           <p className="text-[13px] text-[var(--color-text-secondary)]">
             Total net payout: <span className="font-semibold">{formatINR(run.totalNetPay)}</span>
           </p>
           <Input
             label="Payment Reference (optional)"
             value={paymentRef}
             onChange={(e) => setPaymentRef(e.target.value)}
             placeholder="e.g. NEFT/UTR number"
           />
           <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
             <Button
               variant="ghost"
               onClick={() => setMarkPaidOpen(false)}
               disabled={isProcessing}
             >
               Cancel
             </Button>
             <Button
              variant="secondary"
              leftIcon={<CreditCard size={13} />}
              onClick={() => { void handleMarkPaid(); }}
              isLoading={isProcessing}
             >
               Confirm Payment
             </Button>
           </div>
         </div>
       </Modal>
 
       {/* Confirm action dialog */}
       <ConfirmDialog
        isOpen={!!confirmAction}
         title={confirmAction?.label ?? ''}
         message={confirmAction?.message ?? ''}
         confirmLabel={confirmAction?.label ?? 'Confirm'}
        onConfirm={() => {
          if (!confirmAction) return;
          const fn = confirmAction.fn;
          void fn().then(() => setConfirmAction(null));
        }}
         onCancel={() => setConfirmAction(null)}
         isLoading={isProcessing}
       />
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Summary tab
 // ─────────────────────────────────────────────────────────────────────────────
 
 function SummaryTab() {
   const today = new Date();
   const [monthlySummary, setMonthlySummary] = useState<MonthlyPaySummaryDto | null>(null);
   const [weeklySummary, setWeeklySummary] = useState<WeeklyPaySummaryDto | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const loadSummaries = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const [monthly, weekly] = await Promise.allSettled([
         hrApi.getCurrentMonthSummary(),
         hrApi.getCurrentWeekSummary(),
       ]);
       if (monthly.status === 'fulfilled') setMonthlySummary(monthly.value);
       if (weekly.status === 'fulfilled') setWeeklySummary(weekly.value);
     } catch {
       setError('Failed to load payroll summaries.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => {
     void loadSummaries();
   }, [loadSummaries]);
 
   if (loading) return <Skeleton className="h-48 w-full" />;
   if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
         <AlertCircle size={28} className="text-[var(--color-danger-text)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => { void loadSummaries(); }} leftIcon={<RefreshCcw size={13} />}>
           Retry
         </Button>
       </div>
     );
   }
 
   return (
     <div className="space-y-5">
       {/* Current Month */}
       <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] p-4">
         <div className="flex items-center justify-between mb-3">
           <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
             Current Month — {format(today, 'MMMM yyyy')}
           </p>
         </div>
         {monthlySummary ? (
           <>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
               {[
                 { label: 'Gross Pay', value: monthlySummary.totalGrossPay },
                 { label: 'Deductions', value: monthlySummary.totalDeductions },
                 { label: 'Net Pay', value: monthlySummary.totalNetPay },
                 { label: 'Employees', value: monthlySummary.employeeCount, isCount: true },
               ].map((c) => (
                 <div key={c.label} className="rounded-lg bg-[var(--color-surface-secondary)] p-3">
                   <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                     {c.label}
                   </p>
                   <p className="text-[15px] font-semibold tabular-nums mt-0.5">
                     {c.isCount ? String(c.value) : formatINR(c.value)}
                   </p>
                 </div>
               ))}
             </div>
             {(monthlySummary.employees ?? []).length > 0 && (() => {
               const monthlyEmpColumns: Column<EmployeeMonthlyPayDto>[] = [
                 {
                   id: 'name',
                   header: 'Employee',
                   accessor: (e) => (
                     <span className="text-[var(--color-text-primary)]">{e.employeeName}</span>
                   ),
                 },
                 {
                   id: 'gross',
                   header: 'Gross',
                   accessor: (e) => (
                     <span className="tabular-nums">{formatINR(e.grossPay)}</span>
                   ),
                   align: 'right',
                   hideOnMobile: true,
                 },
                 {
                   id: 'pf',
                   header: 'PF',
                   accessor: (e) => (
                     <span className="tabular-nums text-red-400">−{formatINR(e.pfDeduction)}</span>
                   ),
                   align: 'right',
                   hideOnMobile: true,
                 },
                 {
                   id: 'net',
                   header: 'Net',
                   accessor: (e) => (
                     <span className="tabular-nums font-medium">{formatINR(e.netPay)}</span>
                   ),
                   align: 'right',
                 },
               ];
               return (
                 <DataTable
                   columns={monthlyEmpColumns}
                   data={monthlySummary.employees ?? []}
                   keyExtractor={(e) => e.employeeId}
                   pageSize={50}
                   pageSizeOptions={[50]}
                   emptyMessage="No employee data."
                   mobileCardRenderer={(e) => (
                     <div className="p-3 flex items-center justify-between">
                       <span className="text-[13px] text-[var(--color-text-primary)]">{e.employeeName}</span>
                       <div className="text-right">
                         <p className="text-[12px] tabular-nums font-medium">{formatINR(e.netPay)}</p>
                         <p className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums">Gross: {formatINR(e.grossPay)}</p>
                       </div>
                     </div>
                   )}
                 />
               );
             })()}
           </>
         ) : (
           <p className="text-[13px] text-[var(--color-text-tertiary)]">
             No monthly payroll data available yet.
           </p>
         )}
       </div>
 
       {/* Current Week */}
       <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] p-4">
         <p className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">
           Current Week
         </p>
         {weeklySummary ? (
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
             {[
               { label: 'Gross Pay', value: weeklySummary.totalGrossPay },
               { label: 'Deductions', value: weeklySummary.totalDeductions },
               { label: 'Net Pay', value: weeklySummary.totalNetPay },
               { label: 'Employees', value: weeklySummary.employeeCount, isCount: true },
             ].map((c) => (
               <div key={c.label} className="rounded-lg bg-[var(--color-surface-secondary)] p-3">
                 <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                   {c.label}
                 </p>
                 <p className="text-[15px] font-semibold tabular-nums mt-0.5">
                   {c.isCount ? String(c.value) : formatINR(c.value)}
                 </p>
               </div>
             ))}
           </div>
         ) : (
           <p className="text-[13px] text-[var(--color-text-tertiary)]">
             No weekly payroll data available yet.
           </p>
         )}
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function PayrollPage() {
   const { success: toastSuccess, error: toastError } = useToast();
   const [runs, setRuns] = useState<PayrollRunDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [tab, setTab] = useState<'runs' | 'summary'>('runs');
   const [typeFilter, setTypeFilter] = useState<'ALL' | PayrollRunType>('ALL');
   const [createOpen, setCreateOpen] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [selectedRun, setSelectedRun] = useState<PayrollRunDto | null>(null);
 
   const loadRuns = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const data = await hrApi.getPayrollRuns();
       setRuns(data ?? []);
     } catch {
       setError('Failed to load payroll runs.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => {
     void loadRuns();
   }, [loadRuns]);
 
   const filtered = useMemo(
     () =>
       typeFilter === 'ALL' ? runs : runs.filter((r) => r.runType === typeFilter),
     [runs, typeFilter]
   );
 
   async function handleCreate(
     type: PayrollRunType,
     year?: number,
     month?: number,
     weekEndingDate?: string
   ) {
     setIsCreating(true);
     try {
       if (type === 'MONTHLY' && year && month) {
         await hrApi.createMonthlyPayrollRun(year, month);
       } else if (type === 'WEEKLY' && weekEndingDate) {
         await hrApi.createWeeklyPayrollRun(weekEndingDate);
       }
       toastSuccess('Payroll run created');
       setCreateOpen(false);
       await loadRuns();
     } catch (err: unknown) {
       const msg = err instanceof Error ? err.message : 'Failed to create payroll run';
       toastError(msg);
     } finally {
       setIsCreating(false);
     }
   }
 
   // Refresh selected run after an action
   async function handleRunAction() {
     if (!selectedRun) return;
     try {
       const updated = await hrApi.getPayrollRun(selectedRun.id);
       setSelectedRun(updated);
       await loadRuns();
     } catch {
       // silently refresh list
       await loadRuns();
     }
   }
 
   if (loading && !selectedRun) {
     return (
       <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
       </div>
     );
   }
 
   if (error && !selectedRun) {
     return (
       <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
         <AlertCircle size={32} className="text-[var(--color-danger-text)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => { void loadRuns(); }} leftIcon={<RefreshCcw size={13} />}>
           Retry
         </Button>
       </div>
     );
   }
 
   // Run detail view
   if (selectedRun) {
     return (
       <div className="space-y-4">
         <div className="flex items-center gap-2">
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setSelectedRun(null)}
            leftIcon={<ChevronRight size={13} className="rotate-180" />}
           >
             Back
           </Button>
           <p className="text-[13px] text-[var(--color-text-tertiary)]">
             Payroll / {selectedRun.runNumber}
           </p>
         </div>
         <PayrollRunDetail run={selectedRun} onAction={handleRunAction} />
       </div>
     );
   }
 
   return (
     <div className="space-y-4">
       <PageHeader
         title="Payroll"
        description={`${runs.filter((r) => r.status !== 'PAID').length} active runs`}
         actions={
          <Button leftIcon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
             New Run
           </Button>
         }
       />
 
       <Tabs
         tabs={[
           { label: 'Runs', value: 'runs' },
           { label: 'Summary', value: 'summary' },
         ]}
         active={tab}
         onChange={(v) => setTab(v as 'runs' | 'summary')}
       />
 
       {tab === 'summary' ? (
         <SummaryTab />
       ) : (
         <>
           {/* Type filter */}
           <Tabs
             tabs={[
               { label: 'All', value: 'ALL', count: runs.length },
               {
                 label: 'Monthly',
                 value: 'MONTHLY',
                 count: runs.filter((r) => r.runType === 'MONTHLY').length,
               },
               {
                 label: 'Weekly',
                 value: 'WEEKLY',
                 count: runs.filter((r) => r.runType === 'WEEKLY').length,
               },
             ]}
             active={typeFilter}
             onChange={(v) => setTypeFilter(v as 'ALL' | PayrollRunType)}
             variant="pill"
             size="sm"
           />
 
           {filtered.length === 0 ? (
             <div className="flex items-center justify-center py-16 text-[13px] text-[var(--color-text-tertiary)]">
               No payroll runs found. Create a new run to get started.
             </div>
           ) : (
             <div className="space-y-2">
               {filtered.map((run) => (
                 <button
                   key={run.id}
                   type="button"
                   onClick={() => setSelectedRun(run)}
                   className="w-full flex items-center gap-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] p-4 hover:bg-[var(--color-surface-secondary)] transition-colors text-left"
                 >
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-0.5">
                       <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {run.runNumber}
                       </p>
                       <Badge variant={runStatusVariant(run.status)} dot>
                         {runStatusLabel(run.status)}
                       </Badge>
                       <Badge variant={run.runType === 'MONTHLY' ? 'info' : 'warning'}>
                         {run.runType}
                       </Badge>
                     </div>
                     <p className="text-[12px] text-[var(--color-text-tertiary)]">
                       {formatDate(run.periodStart)} — {formatDate(run.periodEnd)}
                     </p>
                     <div className="mt-2">
                       <LifecycleStepper status={run.status} />
                     </div>
                   </div>
                   <div className="shrink-0 text-right">
                     <p className="text-[11px] text-[var(--color-text-tertiary)]">Net Pay</p>
                     <p className="tabular-nums text-[15px] font-semibold text-[var(--color-text-primary)]">
                       {formatINR(run.totalNetPay)}
                     </p>
                   </div>
                   <ChevronRight size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
                 </button>
               ))}
             </div>
           )}
         </>
       )}
 
       {/* Create Run Modal */}
       <Modal
        isOpen={createOpen}
        onClose={() => { if (!isCreating) setCreateOpen(false); }}
         title="New Payroll Run"
         size="sm"
       >
         <CreateRunForm
           onSave={handleCreate}
           onClose={() => setCreateOpen(false)}
           isSaving={isCreating}
         />
       </Modal>
     </div>
   );
 }

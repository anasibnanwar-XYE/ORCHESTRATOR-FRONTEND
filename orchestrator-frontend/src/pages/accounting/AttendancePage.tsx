 /**
  * AttendancePage
  *
  * Attendance management:
  *  - Daily register: list all employees for a date with status
  *  - Mark single employee attendance (Present/Absent/Half-Day/Leave)
  *  - Bulk mark multiple employees for a date
  *  - Employee calendar view (month grid per employee)
  *  - Monthly summary report (totals per employee)
  *
  * API:
  *  GET    /api/v1/hr/attendance/today
  *  GET    /api/v1/hr/attendance/date/{date}
  *  GET    /api/v1/hr/attendance/summary
  *  GET    /api/v1/hr/attendance/summary/monthly
  *  GET    /api/v1/hr/attendance/employee/{employeeId}
  *  POST   /api/v1/hr/attendance/mark/{employeeId}
  *  POST   /api/v1/hr/attendance/bulk-mark
  */
 
 import { useEffect, useState, useCallback, useMemo } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   ChevronLeft,
   ChevronRight,
   Check,
   Users,
   CalendarDays,
   BarChart2,
 } from 'lucide-react';
 import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';
 import { clsx } from 'clsx';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Select } from '@/components/ui/Select';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { Tabs } from '@/components/ui/Tabs';
 import { useToast } from '@/components/ui/Toast';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import {
   hrApi,
   type AttendanceDto,
   type AttendanceSummaryDto,
   type MonthlyAttendanceSummaryDto,
   type AttendanceStatus,
   type EmployeeDto,
 } from '@/lib/hrApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
   { value: 'PRESENT', label: 'Present' },
   { value: 'ABSENT', label: 'Absent' },
   { value: 'HALF_DAY', label: 'Half Day' },
   { value: 'LEAVE', label: 'On Leave' },
   { value: 'HOLIDAY', label: 'Holiday' },
   { value: 'WEEKEND', label: 'Weekend' },
 ];
 
 function statusVariant(
   status: AttendanceStatus
 ): 'success' | 'danger' | 'warning' | 'info' | 'default' {
   switch (status) {
     case 'PRESENT': return 'success';
     case 'ABSENT': return 'danger';
     case 'HALF_DAY': return 'warning';
     case 'LEAVE': return 'info';
     case 'HOLIDAY': return 'info';
     case 'WEEKEND': return 'default';
     default: return 'default';
   }
 }
 
 function statusLabel(status: AttendanceStatus): string {
   switch (status) {
     case 'PRESENT': return 'Present';
     case 'ABSENT': return 'Absent';
     case 'HALF_DAY': return 'Half Day';
     case 'LEAVE': return 'On Leave';
     case 'HOLIDAY': return 'Holiday';
     case 'WEEKEND': return 'Weekend';
     default: return status;
   }
 }
 
 function calendarDotColor(status: AttendanceStatus | null): string {
   switch (status) {
     case 'PRESENT': return 'bg-green-500';
     case 'ABSENT': return 'bg-red-400';
     case 'HALF_DAY': return 'bg-yellow-400';
     case 'LEAVE': return 'bg-blue-400';
     case 'HOLIDAY': return 'bg-purple-400';
     case 'WEEKEND': return 'bg-[var(--color-border-default)]';
     default: return 'bg-[var(--color-border-subtle)]';
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Daily Register tab
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface MarkModalState {
   employee: AttendanceDto | null;
   status: AttendanceStatus;
   remarks: string;
 }
 
 function DailyRegisterTab({ employees }: { employees: EmployeeDto[] }) {
   const { success: toastSuccess, error: toastError } = useToast();
   const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
   const [attendance, setAttendance] = useState<AttendanceDto[]>([]);
   const [summary, setSummary] = useState<AttendanceSummaryDto | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Single mark modal
   const [markModal, setMarkModal] = useState<MarkModalState | null>(null);
   const [isSaving, setIsSaving] = useState(false);
 
   // Bulk mark
   const [bulkMode, setBulkMode] = useState(false);
   const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
   const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('PRESENT');
   const [isBulkSaving, setIsBulkSaving] = useState(false);
 
   const loadAttendance = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
       const [att, sum] = await Promise.all([
         isToday ? hrApi.getAttendanceToday() : hrApi.getAttendanceByDate(selectedDate),
         isToday ? hrApi.getAttendanceSummary() : Promise.resolve(null),
       ]);
       setAttendance(att ?? []);
       setSummary(sum);
     } catch {
       setError('Failed to load attendance data.');
     } finally {
       setLoading(false);
     }
   }, [selectedDate]);
 
   useEffect(() => {
     void loadAttendance();
   }, [loadAttendance]);
 
   const attendanceMap = useMemo(
     () => new Map(attendance.map((a) => [a.employeeId, a])),
     [attendance]
   );
 
   async function handleMark() {
     if (!markModal?.employee) return;
     setIsSaving(true);
     try {
       await hrApi.markAttendance(markModal.employee.employeeId, {
         status: markModal.status,
         date: selectedDate,
         remarks: markModal.remarks || undefined,
       });
       toastSuccess('Attendance marked');
       setMarkModal(null);
       await loadAttendance();
     } catch (err: unknown) {
       const msg = err instanceof Error ? err.message : 'Failed to mark attendance';
       toastError(msg);
     } finally {
       setIsSaving(false);
     }
   }
 
   async function handleBulkMark() {
     if (bulkSelected.size === 0) return;
     setIsBulkSaving(true);
     try {
       await hrApi.bulkMarkAttendance({
         employeeIds: Array.from(bulkSelected),
         date: selectedDate,
         status: bulkStatus,
       });
       toastSuccess(`Marked ${bulkSelected.size} employees as ${statusLabel(bulkStatus)}`);
       setBulkMode(false);
       setBulkSelected(new Set());
       await loadAttendance();
     } catch (err: unknown) {
       const msg = err instanceof Error ? err.message : 'Failed to bulk mark attendance';
       toastError(msg);
     } finally {
       setIsBulkSaving(false);
     }
   }
 
   function toggleBulkSelect(id: number) {
     setBulkSelected((prev) => {
       const next = new Set(prev);
       if (next.has(id)) next.delete(id);
       else next.add(id);
       return next;
     });
   }
 
   function selectAll() {
     setBulkSelected(new Set(employees.map((e) => e.id)));
   }
 
   const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
 
   return (
     <div className="space-y-4">
       {/* Controls */}
       <div className="flex flex-wrap items-center gap-2">
         <input
           type="date"
           value={selectedDate}
           onChange={(e) => setSelectedDate(e.target.value)}
           className="h-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] px-3 text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]"
         />
         <Button
          variant={bulkMode ? 'secondary' : 'ghost'}
           size="sm"
          leftIcon={<Users size={13} />}
           onClick={() => {
             setBulkMode(!bulkMode);
             setBulkSelected(new Set());
           }}
         >
           {bulkMode ? 'Exit Bulk' : 'Bulk Mark'}
         </Button>
         {bulkMode && (
           <>
             <Button variant="ghost" size="sm" onClick={selectAll}>
               Select All
             </Button>
             <Select
               value={bulkStatus}
               onChange={(e) => setBulkStatus(e.target.value as AttendanceStatus)}
               options={STATUS_OPTIONS}
              selectSize="sm"
             />
             <Button
               size="sm"
              onClick={() => { void handleBulkMark(); }}
              isLoading={isBulkSaving}
               disabled={bulkSelected.size === 0}
              leftIcon={<Check size={13} />}
             >
               Mark {bulkSelected.size > 0 ? `(${bulkSelected.size})` : ''}
             </Button>
           </>
         )}
       </div>
 
       {/* Summary cards (today only) */}
       {summary && (
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
           {[
             { label: 'Present', value: summary.present, color: 'text-green-600' },
             { label: 'Absent', value: summary.absent, color: 'text-red-500' },
             { label: 'Half Day', value: summary.halfDay, color: 'text-yellow-600' },
             { label: 'On Leave', value: summary.onLeave, color: 'text-blue-500' },
           ].map((c) => (
             <div
               key={c.label}
               className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] p-3"
             >
               <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                 {c.label}
               </p>
               <p className={clsx('text-2xl font-semibold tabular-nums mt-1', c.color)}>
                 {c.value}
               </p>
             </div>
           ))}
         </div>
       )}
 
       {loading ? (
         <Skeleton className="h-64 w-full" />
       ) : error ? (
         <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
           <AlertCircle size={28} className="text-[var(--color-danger-text)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => { void loadAttendance(); }} leftIcon={<RefreshCcw size={13} />}>
             Retry
           </Button>
         </div>
       ) : (() => {
         const registerColumns: Column<EmployeeDto>[] = [
           ...(bulkMode ? [{
             id: 'select',
             header: '',
             accessor: (emp: EmployeeDto) => (
               <input
                 type="checkbox"
                 checked={bulkSelected.has(emp.id)}
                 onChange={() => toggleBulkSelect(emp.id)}
                 className="h-4 w-4 rounded border-[var(--color-border-default)]"
               />
             ),
             width: '40px',
           } as Column<EmployeeDto>] : []),
           {
             id: 'employee',
             header: 'Employee',
             accessor: (emp) => (
               <div className={clsx(bulkMode && bulkSelected.has(emp.id) && 'text-[var(--color-text-primary)]')}>
                 <p className="font-medium text-[var(--color-text-primary)]">
                   {emp.firstName} {emp.lastName}
                 </p>
                 <p className="text-[11px] text-[var(--color-text-tertiary)]">{emp.employeeCode}</p>
               </div>
             ),
           },
           {
             id: 'department',
             header: 'Department',
             accessor: (emp) => (
               <span className="text-[var(--color-text-secondary)]">{emp.department ?? '—'}</span>
             ),
             hideOnMobile: true,
           },
           {
             id: 'status',
             header: 'Status',
             accessor: (emp) => {
               const att = attendanceMap.get(emp.id);
               return att ? (
                 <Badge variant={statusVariant(att.status)}>{statusLabel(att.status)}</Badge>
               ) : (
                 <span className="text-[12px] text-[var(--color-text-tertiary)]">Not marked</span>
               );
             },
           },
           {
             id: 'remarks',
             header: 'Remarks',
             accessor: (emp) => {
               const att = attendanceMap.get(emp.id);
               return (
                 <span className="text-[var(--color-text-secondary)] text-[12px]">{att?.remarks ?? '—'}</span>
               );
             },
             hideOnMobile: true,
           },
           {
             id: 'actions',
             header: '',
             accessor: (emp) => {
               const att = attendanceMap.get(emp.id);
               return !bulkMode ? (
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() =>
                     setMarkModal({
                       employee: att ?? {
                         id: 0,
                         employeeId: emp.id,
                         employeeCode: emp.employeeCode,
                         employeeName: `${emp.firstName} ${emp.lastName}`,
                         date: selectedDate,
                         status: 'PRESENT',
                       },
                       status: att?.status ?? 'PRESENT',
                       remarks: att?.remarks ?? '',
                     })
                   }
                 >
                   Mark
                 </Button>
               ) : null;
             },
             width: '80px',
           },
         ];
         return (
           <DataTable
             columns={registerColumns}
             data={activeEmployees}
             keyExtractor={(emp) => emp.id}
             pageSize={50}
             pageSizeOptions={[50]}
             emptyMessage="No active employees found."
             mobileCardRenderer={(emp) => {
               const att = attendanceMap.get(emp.id);
               return (
                 <div className="p-3">
                   <div className="flex items-center justify-between mb-1">
                     <div>
                       <p className="font-medium text-[13px] text-[var(--color-text-primary)]">
                         {emp.firstName} {emp.lastName}
                       </p>
                       <p className="text-[11px] text-[var(--color-text-tertiary)]">{emp.employeeCode}</p>
                     </div>
                     <div className="flex items-center gap-2">
                       {att ? (
                         <Badge variant={statusVariant(att.status)}>{statusLabel(att.status)}</Badge>
                       ) : (
                         <span className="text-[12px] text-[var(--color-text-tertiary)]">Not marked</span>
                       )}
                       {!bulkMode && (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() =>
                             setMarkModal({
                               employee: att ?? {
                                 id: 0,
                                 employeeId: emp.id,
                                 employeeCode: emp.employeeCode,
                                 employeeName: `${emp.firstName} ${emp.lastName}`,
                                 date: selectedDate,
                                 status: 'PRESENT',
                               },
                               status: att?.status ?? 'PRESENT',
                               remarks: att?.remarks ?? '',
                             })
                           }
                         >
                           Mark
                         </Button>
                       )}
                     </div>
                   </div>
                 </div>
               );
             }}
           />
         );
       })()}
 
       {/* Single Mark Modal */}
       {markModal && (
         <Modal
        isOpen={!!markModal}
        onClose={() => { if (!isSaving) setMarkModal(null); }}
           title={`Mark Attendance — ${markModal.employee?.employeeName}`}
           size="sm"
         >
           <div className="space-y-3">
             <Select
               label="Status"
               value={markModal.status}
            onChange={(e) =>
              setMarkModal((prev) =>
                prev ? { ...prev, status: e.target.value as AttendanceStatus } : prev
              )
            }
               options={STATUS_OPTIONS}
             />
             <div>
               <label className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
                 Remarks (optional)
               </label>
               <textarea
                 value={markModal.remarks}
                 onChange={(e) =>
                   setMarkModal((prev) =>
                     prev ? { ...prev, remarks: e.target.value } : prev
                   )
                 }
                 rows={2}
                 placeholder="Any notes..."
                 className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)] resize-none"
               />
             </div>
             <div className="flex justify-end gap-2 pt-1 border-t border-[var(--color-border-subtle)]">
               <Button variant="ghost" onClick={() => setMarkModal(null)} disabled={isSaving}>
                 Cancel
               </Button>
            <Button onClick={() => { void handleMark(); }} isLoading={isSaving}>
                 Save
               </Button>
             </div>
           </div>
         </Modal>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Calendar view tab (per employee)
 // ─────────────────────────────────────────────────────────────────────────────
 
 function CalendarTab({ employees }: { employees: EmployeeDto[] }) {
   const [selectedEmployee, setSelectedEmployee] = useState<number | null>(
     employees.find((e) => e.status === 'ACTIVE')?.id ?? null
   );
   const [viewMonth, setViewMonth] = useState(new Date());
   const [attendance, setAttendance] = useState<AttendanceDto[]>([]);
   const [loading, setLoading] = useState(false);
 
   useEffect(() => {
     if (!selectedEmployee) return;
     const start = format(startOfMonth(viewMonth), 'yyyy-MM-dd');
     const end = format(endOfMonth(viewMonth), 'yyyy-MM-dd');
     setLoading(true);
     hrApi
       .getEmployeeAttendance(selectedEmployee, start, end)
       .then((data) => setAttendance(data ?? []))
       .catch(() => setAttendance([]))
       .finally(() => setLoading(false));
   }, [selectedEmployee, viewMonth]);
 
   const attMap = useMemo(
     () => new Map(attendance.map((a) => [a.date, a])),
     [attendance]
   );
 
   const days = useMemo(() => {
     const start = startOfMonth(viewMonth);
     const end = endOfMonth(viewMonth);
     return eachDayOfInterval({ start, end });
   }, [viewMonth]);
 
   const firstDayOfWeek = useMemo(() => getDay(startOfMonth(viewMonth)), [viewMonth]);
 
   const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
 
   return (
     <div className="space-y-4">
       <div className="flex flex-wrap items-center gap-3">
         <Select
           label=""
           value={selectedEmployee ? String(selectedEmployee) : ''}
           onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null)}
           options={[
             { value: '', label: 'Select employee...' },
             ...activeEmployees.map((e) => ({
               value: String(e.id),
               label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
             })),
           ]}
           className="min-w-[240px]"
         />
         <div className="flex items-center gap-1">
           <button
             type="button"
             onClick={() => setViewMonth((m) => subMonths(m, 1))}
             className="p-1.5 rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"
           >
             <ChevronLeft size={14} />
           </button>
           <span className="text-[13px] font-medium min-w-[120px] text-center">
             {format(viewMonth, 'MMMM yyyy')}
           </span>
           <button
             type="button"
             onClick={() => setViewMonth((m) => addMonths(m, 1))}
             className="p-1.5 rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"
           >
             <ChevronRight size={14} />
           </button>
         </div>
       </div>
 
       {!selectedEmployee ? (
         <div className="flex items-center justify-center py-16 text-[13px] text-[var(--color-text-tertiary)]">
           Select an employee to view their attendance calendar.
         </div>
       ) : loading ? (
         <Skeleton className="h-56 w-full" />
       ) : (
         <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] p-4">
           {/* Day headers */}
           <div className="grid grid-cols-7 mb-1">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
               <div
                 key={d}
                 className="text-center text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] py-1"
               >
                 {d}
               </div>
             ))}
           </div>
 
           {/* Calendar grid */}
           <div className="grid grid-cols-7 gap-1">
             {/* Empty cells before first day */}
             {Array.from({ length: firstDayOfWeek }).map((_, i) => (
               <div key={`empty-${i}`} />
             ))}
             {days.map((day) => {
               const dateStr = format(day, 'yyyy-MM-dd');
               const att = attMap.get(dateStr);
               const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
               return (
                 <div
                   key={dateStr}
                   className={clsx(
                     'aspect-square flex flex-col items-center justify-center rounded-lg text-[12px] font-medium',
                     isToday ? 'ring-2 ring-[var(--color-neutral-900)]' : '',
                     att ? 'bg-[var(--color-surface-secondary)]' : ''
                   )}
                 >
                   <span
                     className={clsx(
                       isToday
                         ? 'text-[var(--color-text-primary)] font-semibold'
                         : 'text-[var(--color-text-secondary)]'
                     )}
                   >
                     {format(day, 'd')}
                   </span>
                   {att && (
                     <span
                       className={clsx(
                         'mt-0.5 h-1.5 w-1.5 rounded-full',
                         calendarDotColor(att.status)
                       )}
                     />
                   )}
                 </div>
               );
             })}
           </div>
 
           {/* Legend */}
           <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
             {STATUS_OPTIONS.slice(0, 4).map((s) => (
               <div key={s.value} className="flex items-center gap-1.5">
                 <span className={clsx('h-2 w-2 rounded-full', calendarDotColor(s.value))} />
                 <span className="text-[11px] text-[var(--color-text-secondary)]">{s.label}</span>
               </div>
             ))}
           </div>
         </div>
       )}
 
       {/* Monthly stats if employee selected */}
       {selectedEmployee && attendance.length > 0 && (
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
           {[
             {
               label: 'Present',
               value: attendance.filter((a) => a.status === 'PRESENT').length,
             },
             {
               label: 'Absent',
               value: attendance.filter((a) => a.status === 'ABSENT').length,
             },
             {
               label: 'Half Day',
               value: attendance.filter((a) => a.status === 'HALF_DAY').length,
             },
             {
               label: 'On Leave',
               value: attendance.filter((a) => a.status === 'LEAVE').length,
             },
           ].map((c) => (
             <div
               key={c.label}
               className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] p-3"
             >
               <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                 {c.label}
               </p>
               <p className="text-xl font-semibold tabular-nums mt-1">{c.value}</p>
             </div>
           ))}
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Monthly Summary tab
 // ─────────────────────────────────────────────────────────────────────────────
 
 function MonthlySummaryTab() {
   const today = new Date();
   const [year, setYear] = useState(today.getFullYear());
   const [month, setMonth] = useState(today.getMonth() + 1);
   const [summaries, setSummaries] = useState<MonthlyAttendanceSummaryDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const loadSummary = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const data = await hrApi.getMonthlyAttendanceSummary(year, month);
       setSummaries(data ?? []);
     } catch {
       setError('Failed to load monthly summary.');
     } finally {
       setLoading(false);
     }
   }, [year, month]);
 
   useEffect(() => {
     void loadSummary();
   }, [loadSummary]);
 
   const MONTH_OPTIONS = [
     { value: '1', label: 'January' },
     { value: '2', label: 'February' },
     { value: '3', label: 'March' },
     { value: '4', label: 'April' },
     { value: '5', label: 'May' },
     { value: '6', label: 'June' },
     { value: '7', label: 'July' },
     { value: '8', label: 'August' },
     { value: '9', label: 'September' },
     { value: '10', label: 'October' },
     { value: '11', label: 'November' },
     { value: '12', label: 'December' },
   ];
 
   return (
     <div className="space-y-4">
       <div className="flex flex-wrap items-center gap-3">
         <Select
           label=""
           value={String(month)}
           onChange={(e) => setMonth(Number(e.target.value))}
           options={MONTH_OPTIONS}
         />
         <Select
           label=""
           value={String(year)}
           onChange={(e) => setYear(Number(e.target.value))}
           options={Array.from({ length: 5 }, (_, i) => {
             const y = today.getFullYear() - 2 + i;
             return { value: String(y), label: String(y) };
           })}
         />
        <Button variant="ghost" size="sm" onClick={() => { void loadSummary(); }} leftIcon={<RefreshCcw size={13} />}>
           Refresh
         </Button>
       </div>
 
       {loading ? (
         <Skeleton className="h-64 w-full" />
       ) : error ? (
         <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
           <AlertCircle size={28} className="text-[var(--color-danger-text)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => { void loadSummary(); }} leftIcon={<RefreshCcw size={13} />}>
             Retry
           </Button>
         </div>
       ) : summaries.length === 0 ? (
         <div className="flex items-center justify-center py-16 text-[13px] text-[var(--color-text-tertiary)]">
           No attendance data for {MONTH_OPTIONS.find((m) => m.value === String(month))?.label}{' '}
           {year}.
         </div>
       ) : (() => {
         const summaryColumns: Column<MonthlyAttendanceSummaryDto>[] = [
           {
             id: 'employee',
             header: 'Employee',
             accessor: (s) => (
               <div>
                 <p className="font-medium text-[var(--color-text-primary)]">{s.employeeName}</p>
                 <p className="text-[11px] text-[var(--color-text-tertiary)]">{s.employeeCode}</p>
               </div>
             ),
           },
           {
             id: 'present',
             header: 'Present',
             accessor: (s) => (
               <span className="tabular-nums text-green-600 font-medium">{s.presentDays}</span>
             ),
             align: 'center',
           },
           {
             id: 'absent',
             header: 'Absent',
             accessor: (s) => (
               <span className="tabular-nums text-red-500 font-medium">{s.absentDays}</span>
             ),
             align: 'center',
             hideOnMobile: true,
           },
           {
             id: 'halfDay',
             header: 'Half Day',
             accessor: (s) => (
               <span className="tabular-nums text-yellow-600 font-medium">{s.halfDays}</span>
             ),
             align: 'center',
             hideOnMobile: true,
           },
           {
             id: 'leave',
             header: 'Leave',
             accessor: (s) => (
               <span className="tabular-nums text-blue-500 font-medium">{s.leaveDays}</span>
             ),
             align: 'center',
             hideOnMobile: true,
           },
           {
             id: 'holidays',
             header: 'Holidays',
             accessor: (s) => (
               <span className="tabular-nums text-[var(--color-text-secondary)]">{s.holidayDays}</span>
             ),
             align: 'center',
             hideOnMobile: true,
           },
           {
             id: 'ot',
             header: 'OT Hours',
             accessor: (s) => (
               <span className="tabular-nums text-[var(--color-text-secondary)]">{s.overtimeHours?.toFixed(1) ?? '0.0'}h</span>
             ),
             align: 'right',
             hideOnMobile: true,
           },
         ];
         return (
           <DataTable
             columns={summaryColumns}
             data={summaries}
             keyExtractor={(s) => s.employeeId}
             pageSize={50}
             pageSizeOptions={[50]}
             emptyMessage="No attendance data."
             mobileCardRenderer={(s) => (
               <div className="p-3 flex items-center justify-between">
                 <div>
                   <p className="font-medium text-[13px] text-[var(--color-text-primary)]">{s.employeeName}</p>
                   <p className="text-[11px] text-[var(--color-text-tertiary)]">{s.employeeCode}</p>
                 </div>
                 <div className="flex items-center gap-3 text-[12px]">
                   <span className="text-green-600 font-medium">{s.presentDays}P</span>
                   <span className="text-red-500 font-medium">{s.absentDays}A</span>
                   <span className="text-blue-500 font-medium">{s.leaveDays}L</span>
                 </div>
               </div>
             )}
           />
         );
       })()}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function AttendancePage() {
   const [tab, setTab] = useState<'register' | 'calendar' | 'summary'>('register');
   const [employees, setEmployees] = useState<EmployeeDto[]>([]);
   const [empLoading, setEmpLoading] = useState(true);
 
   useEffect(() => {
     hrApi
       .getEmployees()
       .then((data) => setEmployees(data ?? []))
       .catch(() => setEmployees([]))
       .finally(() => setEmpLoading(false));
   }, []);
 
   const tabs = [
     { label: 'Daily Register', value: 'register', icon: <Users size={13} /> },
     { label: 'Employee Calendar', value: 'calendar', icon: <CalendarDays size={13} /> },
     { label: 'Monthly Summary', value: 'summary', icon: <BarChart2 size={13} /> },
   ];
 
   return (
     <div className="space-y-4">
      <PageHeader title="Attendance" description="Track daily attendance and monthly summaries" />
 
       <Tabs
         tabs={tabs.map(({ label, value }) => ({ label, value }))}
         active={tab}
         onChange={(v) => setTab(v as 'register' | 'calendar' | 'summary')}
       />
 
       {empLoading ? (
         <Skeleton className="h-64 w-full" />
       ) : (
         <>
           {tab === 'register' && <DailyRegisterTab employees={employees} />}
           {tab === 'calendar' && <CalendarTab employees={employees} />}
           {tab === 'summary' && <MonthlySummaryTab />}
         </>
       )}
     </div>
   );
 }

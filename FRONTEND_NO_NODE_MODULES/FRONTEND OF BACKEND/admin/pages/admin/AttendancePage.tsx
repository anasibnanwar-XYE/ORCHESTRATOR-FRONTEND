import { useState, useEffect } from 'react';
import {
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UserGroupIcon,
    MagnifyingGlassIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
    getTodayAttendance,
    getAttendanceByDate,
    getTodayAttendanceSummary,
    getEmployeeAttendanceHistory,
    markEmployeeAttendance,
    bulkMarkAttendance,
    listEmployees,
    type AttendanceDto,
    type AttendanceSummaryDto,
    type MarkAttendanceRequest,
    type BulkMarkAttendanceRequest,
    type EmployeeDto,
} from '../../lib/adminApi';

export default function AttendancePage() {
    const { session } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<AttendanceDto[]>([]);
    const [summary, setSummary] = useState<AttendanceSummaryDto | null>(null);
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Mark attendance modal state
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDto | null>(null);
    const [markFormData, setMarkFormData] = useState<MarkAttendanceRequest>({
        date: selectedDate,
        status: 'PRESENT',
    });

    // Bulk mark state
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
    const [bulkFormData, setBulkFormData] = useState<BulkMarkAttendanceRequest>({
        employeeIds: [],
        date: selectedDate,
        status: 'PRESENT',
    });

    useEffect(() => {
        if (session) {
            loadEmployees();
            loadAttendance();
            loadSummary();
        }
    }, [session, selectedDate]);

    const loadEmployees = async () => {
        try {
            const data = await listEmployees(session);
            setEmployees(data as any);
        } catch (err) {
            console.error('Failed to load employees', err);
        }
    };

    const loadAttendance = async () => {
        try {
            setLoading(true);
            setError(null);
            const today = new Date().toISOString().split('T')[0];
            const data = selectedDate === today
                ? await getTodayAttendance(session)
                : await getAttendanceByDate(selectedDate, session);
            setAttendance(data as any);
        } catch (err) {
            console.error('Failed to load attendance', err);
            setError('Failed to load attendance');
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            if (selectedDate === today) {
                const data = await getTodayAttendanceSummary(session);
                setSummary(data as any);
            } else {
                // For other dates, calculate summary from attendance list
                // This will be recalculated when attendance changes
            }
        } catch (err) {
            console.error('Failed to load summary', err);
        }
    };

    // Calculate summary for non-today dates from attendance state
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate !== today && employees.length > 0) {
            const calculatedSummary: AttendanceSummaryDto = {
                date: selectedDate,
                totalEmployees: employees.length,
                present: attendance.filter(a => a.status === 'PRESENT').length,
                absent: attendance.filter(a => a.status === 'ABSENT').length,
                halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
                onLeave: attendance.filter(a => a.status === 'LEAVE').length,
                notMarked: employees.length - attendance.length,
            };
            setSummary(calculatedSummary);
        }
    }, [attendance, employees, selectedDate]);

    const handleMarkAttendance = async () => {
        if (!selectedEmployee) return;
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await markEmployeeAttendance(selectedEmployee.id || 0, markFormData, session);
            setSuccess(`Attendance marked for ${selectedEmployee.firstName} ${selectedEmployee.lastName}`);
            setShowMarkModal(false);
            setSelectedEmployee(null);
            loadAttendance();
            loadSummary();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkMarkAttendance = async () => {
        if (selectedEmployeeIds.length === 0) {
            setError('Please select at least one employee');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await bulkMarkAttendance({
                ...bulkFormData,
                employeeIds: selectedEmployeeIds,
            }, session);
            setSuccess(`Attendance marked for ${selectedEmployeeIds.length} employee(s)`);
            setShowBulkModal(false);
            setSelectedEmployeeIds([]);
            loadAttendance();
            loadSummary();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'ABSENT':
                return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
            case 'HALF_DAY':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'LEAVE':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PRESENT':
                return <CheckCircleIcon className="h-5 w-5" />;
            case 'ABSENT':
                return <XCircleIcon className="h-5 w-5" />;
            case 'HALF_DAY':
                return <ClockIcon className="h-5 w-5" />;
            case 'LEAVE':
                return <CalendarIcon className="h-5 w-5" />;
            default:
                return null;
        }
    };

    // Create a map of employee ID to attendance for quick lookup
    const attendanceMap = new Map<number, AttendanceDto>();
    attendance.forEach(a => {
        if (a.employeeId !== undefined) {
            attendanceMap.set(a.employeeId, a);
        }
    });

    // Get employees not yet marked
    const unmarkedEmployees = employees.filter(emp => emp.id !== undefined && !attendanceMap.has(emp.id));

    return (
        <div className="space-y-6">
            {/* ... (Header, Alerts, Summary Cards unchanged) ... */}

            {/* Attendance Table */}
            <div className="rounded-lg border border-border bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-highlight border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-secondary">Employee</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-secondary">Type</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-secondary">Status</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-secondary">Check In</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-secondary">Check Out</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-secondary">Hours</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-secondary">Remarks</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-secondary">
                                        Loading attendance...
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-secondary">
                                        No employees found
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {employees.map((employee) => {
                                        const att = employee.id ? attendanceMap.get(employee.id) : undefined;
                                        return (
                                            <tr key={employee.id} className="hover:bg-surface-highlight">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-primary">
                                                        {employee.firstName} {employee.lastName}
                                                    </div>
                                                    <div className="text-sm text-secondary">{employee.email}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                                        {(employee as any).employeeType || employee.role || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {att ? (
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(att.status || 'PRESENT')}`}>
                                                            {getStatusIcon(att.status || 'PRESENT')}
                                                            {att.status}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                            Not Marked
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-secondary">
                                                    {att?.checkInTime ? String(att.checkInTime) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-secondary">
                                                    {att?.checkOutTime ? String(att.checkOutTime) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-secondary">
                                                    {att ? (
                                                        <div>
                                                            {att.regularHours !== undefined && <div>Regular: {att.regularHours}h</div>}
                                                            {att.overtimeHours !== undefined && <div>OT: {att.overtimeHours}h</div>}
                                                            {att.doubleOvertimeHours !== undefined && <div>2xOT: {att.doubleOvertimeHours}h</div>}
                                                            {att.regularHours === undefined && att.overtimeHours === undefined && att.doubleOvertimeHours === undefined && '-'}
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-secondary">
                                                    {att?.remarks || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedEmployee(employee);
                                                            setMarkFormData({
                                                                date: selectedDate,
                                                                status: att?.status as any || 'PRESENT',
                                                                checkInTime: String(att?.checkInTime || '') as any,
                                                                checkOutTime: String(att?.checkOutTime || '') as any,
                                                                regularHours: att?.regularHours,
                                                                overtimeHours: att?.overtimeHours,
                                                                doubleOvertimeHours: att?.doubleOvertimeHours,
                                                                remarks: att?.remarks,
                                                            });
                                                            setShowMarkModal(true);
                                                        }}
                                                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                                                    >
                                                        {att ? 'Edit' : 'Mark'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mark Attendance Modal */}
            {showMarkModal && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl ring-1 ring-border">
                        <h2 className="text-lg font-semibold text-primary">
                            Mark Attendance - {selectedEmployee.firstName} {selectedEmployee.lastName}
                        </h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleMarkAttendance();
                            }}
                            className="mt-4 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-secondary">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    value={markFormData.date || selectedDate}
                                    onChange={(e) => setMarkFormData({ ...markFormData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary">Status *</label>
                                <select
                                    required
                                    className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    value={markFormData.status}
                                    onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value as any })}
                                >
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                    <option value="HALF_DAY">Half Day</option>
                                    <option value="LEAVE">Leave</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary">Check In Time</label>
                                    <input
                                        type="time"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={String(markFormData.checkInTime || '')}
                                        onChange={(e) => setMarkFormData({ ...markFormData, checkInTime: e.target.value as any })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary">Check Out Time</label>
                                    <input
                                        type="time"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={String(markFormData.checkOutTime || '')}
                                        onChange={(e) => setMarkFormData({ ...markFormData, checkOutTime: e.target.value as any })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary">Regular Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={markFormData.regularHours || ''}
                                        onChange={(e) => setMarkFormData({ ...markFormData, regularHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary">OT Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={markFormData.overtimeHours || ''}
                                        onChange={(e) => setMarkFormData({ ...markFormData, overtimeHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary">2x OT Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={markFormData.doubleOvertimeHours || ''}
                                        onChange={(e) => setMarkFormData({ ...markFormData, doubleOvertimeHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary">Remarks</label>
                                <textarea
                                    rows={3}
                                    className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    value={markFormData.remarks || ''}
                                    onChange={(e) => setMarkFormData({ ...markFormData, remarks: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMarkModal(false);
                                        setSelectedEmployee(null);
                                    }}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Mark Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-xl ring-1 ring-border my-8 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold text-primary mb-4">Bulk Mark Attendance</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleBulkMarkAttendance();
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Select Employees</label>
                                <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-surface-highlight p-2">
                                    {employees.map((employee) => (
                                        <label
                                            key={employee.id}
                                            className="flex items-center gap-2 p-2 hover:bg-surface rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployeeIds.includes(employee.id || 0)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedEmployeeIds([...selectedEmployeeIds, employee.id || 0]);
                                                    } else {
                                                        setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== (employee.id || 0)));
                                                    }
                                                }}
                                                className="rounded border-border text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-sm text-primary">
                                                {employee.firstName} {employee.lastName} ({(employee as any).employeeType})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-2 text-sm text-secondary">
                                    {selectedEmployeeIds.length} employee(s) selected
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    value={bulkFormData.date}
                                    onChange={(e) => setBulkFormData({ ...bulkFormData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary">Status *</label>
                                <select
                                    required
                                    className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    value={bulkFormData.status}
                                    onChange={(e) => setBulkFormData({ ...bulkFormData, status: e.target.value as any })}
                                >
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                    <option value="HALF_DAY">Half Day</option>
                                    <option value="LEAVE">Leave</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary">Check In Time</label>
                                    <input
                                        type="time"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={String(bulkFormData.checkInTime || '')}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, checkInTime: e.target.value as any })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary">Check Out Time</label>
                                    <input
                                        type="time"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={String(bulkFormData.checkOutTime || '')}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, checkOutTime: e.target.value as any })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary">Regular Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={bulkFormData.regularHours || ''}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, regularHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary">OT Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={bulkFormData.overtimeHours || ''}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, overtimeHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBulkModal(false);
                                        setSelectedEmployeeIds([]);
                                    }}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || selectedEmployeeIds.length === 0}
                                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : `Mark ${selectedEmployeeIds.length} Employee(s)`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


import { useState, useEffect } from 'react';
import {
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    X,
} from 'lucide-react';
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
import { ResponsiveModal } from '../../design-system';

// ── Helpers ───────────────────────────────────────────────────────────────────

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

/** Local form state uses strings for time fields (HTML time input compatibility). */
interface AttendanceFormState {
    date: string;
    status: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    regularHours?: number;
    overtimeHours?: number;
    doubleOvertimeHours?: number;
    remarks?: string;
}

interface BulkAttendanceFormState {
    employeeIds: number[];
    date: string;
    status: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    regularHours?: number;
    overtimeHours?: number;
}

/** Convert "HH:MM" string to LocalTime object expected by the API. */
function parseTimeString(t: string | undefined): import('../../lib/client/models/LocalTime').LocalTime | undefined {
    if (!t) return undefined;
    const [h, m] = t.split(':').map(Number);
    return { hour: h, minute: m || 0, second: 0, nano: 0 };
}

const STATUS_CLASSES: Record<string, string> = {
    PRESENT: 'bg-status-success-bg text-status-success-text',
    ABSENT: 'bg-status-error-bg text-status-error-text',
    HALF_DAY: 'bg-status-warning-bg text-status-warning-text',
    LEAVE: 'bg-status-info-bg text-status-info-text',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status] ?? 'bg-surface-highlight text-secondary'}`}>
            {status === 'PRESENT' && <CheckCircle className="h-3.5 w-3.5" />}
            {status === 'ABSENT' && <XCircle className="h-3.5 w-3.5" />}
            {status === 'HALF_DAY' && <Clock className="h-3.5 w-3.5" />}
            {status === 'LEAVE' && <Calendar className="h-3.5 w-3.5" />}
            {status}
        </span>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AttendancePage() {
    const { session } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<AttendanceDto[]>([]);
    const [summary, setSummary] = useState<AttendanceSummaryDto | null>(null);
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Mark attendance modal
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDto | null>(null);
    const [markFormData, setMarkFormData] = useState<AttendanceFormState>({
        date: selectedDate,
        status: 'PRESENT',
    });

    // Bulk mark state
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
    const [bulkFormData, setBulkFormData] = useState<BulkAttendanceFormState>({
        employeeIds: [],
        date: selectedDate,
        status: 'PRESENT',
    });

    // History state — maps employeeId → history records
    const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
    const [historyMap, setHistoryMap] = useState<Record<number, AttendanceDto[]>>({});
    const [historyLoading, setHistoryLoading] = useState<Record<number, boolean>>({});
    const [historyError, setHistoryError] = useState<Record<number, string>>({});

    // ── Load data

    useEffect(() => {
        if (session) {
            loadEmployees();
            loadAttendance();
            loadSummary();
        }
    }, [session, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadEmployees = async () => {
        try {
            const data = await listEmployees(session);
            setEmployees(data as EmployeeDto[]);
        } catch {
            // Non-critical; attendance table will still show what we have
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
            setAttendance(data as AttendanceDto[]);
        } catch (err) {
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
                setSummary(data as AttendanceSummaryDto);
            }
        } catch {
            // Summary is supplementary; silently ignore
        }
    };

    // Recalculate summary for non-today dates
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate !== today && employees.length > 0) {
            const calculatedSummary: AttendanceSummaryDto = {
                date: selectedDate,
                totalEmployees: employees.length,
                present: attendance.filter((a) => a.status === 'PRESENT').length,
                absent: attendance.filter((a) => a.status === 'ABSENT').length,
                halfDay: attendance.filter((a) => a.status === 'HALF_DAY').length,
                onLeave: attendance.filter((a) => a.status === 'LEAVE').length,
                notMarked: employees.length - attendance.length,
            };
            setSummary(calculatedSummary);
        }
    }, [attendance, employees, selectedDate]);

    // ── History toggle

    const toggleHistory = async (employee: EmployeeDto) => {
        const id = employee.id;
        if (!id) return;

        if (expandedEmployee === id) {
            setExpandedEmployee(null);
            return;
        }

        setExpandedEmployee(id);

        // Already loaded
        if (historyMap[id]) return;

        setHistoryLoading((prev) => ({ ...prev, [id]: true }));
        setHistoryError((prev) => { const next = { ...prev }; delete next[id]; return next; });

        try {
            const data = await getEmployeeAttendanceHistory(id, undefined, undefined, session);
            setHistoryMap((prev) => ({ ...prev, [id]: data as AttendanceDto[] }));
        } catch (err) {
            setHistoryError((prev) => ({ ...prev, [id]: err instanceof Error ? err.message : 'Failed to load history' }));
        } finally {
            setHistoryLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    // ── Attendance actions

    const handleMarkAttendance = async () => {
        if (!selectedEmployee) return;
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const payload: MarkAttendanceRequest = {
                date: markFormData.date,
                status: markFormData.status,
                checkInTime: parseTimeString(markFormData.checkInTime),
                checkOutTime: parseTimeString(markFormData.checkOutTime),
                regularHours: markFormData.regularHours,
                overtimeHours: markFormData.overtimeHours,
                doubleOvertimeHours: markFormData.doubleOvertimeHours,
                remarks: markFormData.remarks,
            };
            await markEmployeeAttendance(selectedEmployee.id || 0, payload, session);
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
            const bulkPayload: BulkMarkAttendanceRequest = {
                employeeIds: selectedEmployeeIds,
                date: bulkFormData.date,
                status: bulkFormData.status,
                checkInTime: parseTimeString(bulkFormData.checkInTime),
                checkOutTime: parseTimeString(bulkFormData.checkOutTime),
                regularHours: bulkFormData.regularHours,
                overtimeHours: bulkFormData.overtimeHours,
            };
            await bulkMarkAttendance(bulkPayload, session);
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

    // ── Build lookup map

    const attendanceMap = new Map<number, AttendanceDto>();
    attendance.forEach((a) => {
        if (a.employeeId !== undefined) attendanceMap.set(a.employeeId, a);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Attendance</h1>
                    <p className="text-sm text-secondary">Track daily attendance and view history</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button
                        onClick={() => {
                            setShowBulkModal(true);
                            setBulkFormData({ employeeIds: [], date: selectedDate, status: 'PRESENT' });
                            setSelectedEmployeeIds([]);
                        }}
                        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-surface-highlight"
                    >
                        Bulk Mark
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="flex items-center justify-between rounded-lg border border-transparent bg-status-error-bg p-3 text-sm text-status-error-text">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
                </div>
            )}
            {success && (
                <div className="flex items-center justify-between rounded-lg border border-transparent bg-status-success-bg p-3 text-sm text-status-success-text">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)}><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                    {[
                        { label: 'Total', value: summary.totalEmployees, cls: 'bg-surface border-border' },
                        { label: 'Present', value: summary.present, cls: 'bg-status-success-bg border-transparent text-status-success-text' },
                        { label: 'Absent', value: summary.absent, cls: 'bg-status-error-bg border-transparent text-status-error-text' },
                        { label: 'Half Day', value: summary.halfDay, cls: 'bg-status-warning-bg border-transparent text-status-warning-text' },
                        { label: 'On Leave', value: summary.onLeave, cls: 'bg-status-info-bg border-transparent text-status-info-text' },
                        { label: 'Not Marked', value: summary.notMarked, cls: 'bg-surface-highlight border-border text-secondary' },
                    ].map((card) => (
                        <div key={card.label} className={`rounded-lg border p-4 ${card.cls}`}>
                            <p className="text-xs font-medium">{card.label}</p>
                            <p className="mt-1 text-2xl font-bold">{card.value ?? 0}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Attendance Table */}
            <div className="rounded-lg border border-border bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-border bg-surface-highlight">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Employee</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Type</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-secondary">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-secondary">Check In</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-secondary">Check Out</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">Hours</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Remarks</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-secondary">Actions</th>
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
                                employees.map((employee) => {
                                    const att = employee.id ? attendanceMap.get(employee.id) : undefined;
                                    const isExpanded = expandedEmployee === employee.id;
                                    const history = employee.id ? historyMap[employee.id] : undefined;
                                    const isLoadingHistory = employee.id ? historyLoading[employee.id] : false;
                                    const histErr = employee.id ? historyError[employee.id] : undefined;

                                    return (
                                        <>
                                            <tr key={employee.id} className="hover:bg-surface-highlight">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-primary">
                                                        {employee.firstName} {employee.lastName}
                                                    </div>
                                                    <div className="text-xs text-secondary">{employee.email}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-surface-highlight text-secondary">
                                                        {(employee as Record<string, unknown>).employeeType as string || employee.role || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {att ? (
                                                        <StatusBadge status={att.status || 'PRESENT'} />
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-surface-highlight text-secondary">
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
                                                        <div className="space-y-0.5">
                                                            {att.regularHours !== undefined && <div>Reg: {att.regularHours}h</div>}
                                                            {att.overtimeHours !== undefined && <div>OT: {att.overtimeHours}h</div>}
                                                            {att.doubleOvertimeHours !== undefined && <div>2xOT: {att.doubleOvertimeHours}h</div>}
                                                            {att.regularHours === undefined && att.overtimeHours === undefined && att.doubleOvertimeHours === undefined && '-'}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-secondary">
                                                    {att?.remarks || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEmployee(employee);
                                                                setMarkFormData({
                                                                    date: selectedDate,
                                                                    status: (att?.status as AttendanceStatus) || 'PRESENT',
                                                                    checkInTime: att?.checkInTime ? String(att.checkInTime) : undefined,
                                                                    checkOutTime: att?.checkOutTime ? String(att.checkOutTime) : undefined,
                                                                    regularHours: att?.regularHours,
                                                                    overtimeHours: att?.overtimeHours,
                                                                    doubleOvertimeHours: att?.doubleOvertimeHours,
                                                                    remarks: att?.remarks,
                                                                });
                                                                setShowMarkModal(true);
                                                            }}
                                                            className="text-xs font-medium text-brand-600 hover:text-brand-700"
                                                        >
                                                            {att ? 'Edit' : 'Mark'}
                                                        </button>
                                                        <button
                                                            onClick={() => toggleHistory(employee)}
                                                            className="flex items-center gap-0.5 text-xs text-secondary hover:text-primary"
                                                            title="View history"
                                                        >
                                                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                            History
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* History expansion row */}
                                            {isExpanded && (
                                                <tr key={`history-${employee.id}`}>
                                                    <td colSpan={8} className="bg-surface-highlight px-6 py-4">
                                                        <div className="space-y-3">
                                                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                                                                Attendance History — Last 30 Days
                                                            </p>
                                                            {isLoadingHistory ? (
                                                                <p className="text-sm text-secondary">Loading history...</p>
                                                            ) : histErr ? (
                                                                <p className="text-sm text-status-error-text">{histErr}</p>
                                                            ) : !history || history.length === 0 ? (
                                                                <p className="text-sm text-secondary">No attendance records found.</p>
                                                            ) : (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-border">
                                                                                <th className="py-2 pr-4 text-left text-xs font-medium text-secondary">Date</th>
                                                                                <th className="py-2 pr-4 text-center text-xs font-medium text-secondary">Status</th>
                                                                                <th className="py-2 pr-4 text-center text-xs font-medium text-secondary">Check In</th>
                                                                                <th className="py-2 pr-4 text-center text-xs font-medium text-secondary">Check Out</th>
                                                                                <th className="py-2 text-right text-xs font-medium text-secondary">Hours</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-border">
                                                                            {history.map((rec, idx) => (
                                                                                <tr key={idx} className="text-secondary">
                                                                                    <td className="py-1.5 pr-4 text-primary">{rec.date}</td>
                                                                                    <td className="py-1.5 pr-4 text-center">
                                                                                        <StatusBadge status={rec.status || 'PRESENT'} />
                                                                                    </td>
                                                                                    <td className="py-1.5 pr-4 text-center">{rec.checkInTime ? String(rec.checkInTime) : '-'}</td>
                                                                                    <td className="py-1.5 pr-4 text-center">{rec.checkOutTime ? String(rec.checkOutTime) : '-'}</td>
                                                                                    <td className="py-1.5 text-right">
                                                                                        {rec.regularHours !== undefined ? `${rec.regularHours}h` : '-'}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mark Attendance Modal */}
            <ResponsiveModal
                isOpen={showMarkModal && !!selectedEmployee}
                onClose={() => { setShowMarkModal(false); setSelectedEmployee(null); }}
                title={selectedEmployee ? `Mark Attendance — ${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Mark Attendance'}
                size="md"
            >
                <form
                    onSubmit={(e) => { e.preventDefault(); handleMarkAttendance(); }}
                    className="space-y-4"
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
                            onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value as AttendanceStatus })}
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
                                value={markFormData.checkInTime ? String(markFormData.checkInTime) : ''}
                                onChange={(e) => setMarkFormData({ ...markFormData, checkInTime: e.target.value || undefined })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary">Check Out Time</label>
                            <input
                                type="time"
                                className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                value={markFormData.checkOutTime ? String(markFormData.checkOutTime) : ''}
                                onChange={(e) => setMarkFormData({ ...markFormData, checkOutTime: e.target.value || undefined })}
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
                                value={markFormData.regularHours ?? ''}
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
                                value={markFormData.overtimeHours ?? ''}
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
                                value={markFormData.doubleOvertimeHours ?? ''}
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
                    <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <button
                            type="button"
                            onClick={() => { setShowMarkModal(false); setSelectedEmployee(null); }}
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
            </ResponsiveModal>

            {/* Bulk Mark Modal */}
            <ResponsiveModal
                isOpen={showBulkModal}
                onClose={() => { setShowBulkModal(false); setSelectedEmployeeIds([]); }}
                title="Bulk Mark Attendance"
                size="md"
            >
                <form
                    onSubmit={(e) => { e.preventDefault(); handleBulkMarkAttendance(); }}
                    className="space-y-4"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium text-secondary">Select Employees</label>
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-surface-highlight p-2">
                            {employees.map((employee) => (
                                <label
                                    key={employee.id}
                                            className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-surface"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployeeIds.includes(employee.id || 0)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedEmployeeIds([...selectedEmployeeIds, employee.id || 0]);
                                                    } else {
                                                        setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => id !== (employee.id || 0)));
                                                    }
                                                }}
                                                className="rounded border-border text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-sm text-primary">
                                                {employee.firstName} {employee.lastName} ({(employee as Record<string, unknown>).employeeType as string || employee.role || 'STAFF'})
                                            </span>
                                </label>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-secondary">{selectedEmployeeIds.length} employee(s) selected</p>
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
                            onChange={(e) => setBulkFormData({ ...bulkFormData, status: e.target.value as AttendanceStatus })}
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
                                value={bulkFormData.checkInTime ? String(bulkFormData.checkInTime) : ''}
                                onChange={(e) => setBulkFormData({ ...bulkFormData, checkInTime: e.target.value || undefined })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary">Check Out Time</label>
                            <input
                                type="time"
                                className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                value={bulkFormData.checkOutTime ? String(bulkFormData.checkOutTime) : ''}
                                onChange={(e) => setBulkFormData({ ...bulkFormData, checkOutTime: e.target.value || undefined })}
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
                                value={bulkFormData.regularHours ?? ''}
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
                                value={bulkFormData.overtimeHours ?? ''}
                                onChange={(e) => setBulkFormData({ ...bulkFormData, overtimeHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <button
                            type="button"
                            onClick={() => { setShowBulkModal(false); setSelectedEmployeeIds([]); }}
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
            </ResponsiveModal>
        </div>
    );
}

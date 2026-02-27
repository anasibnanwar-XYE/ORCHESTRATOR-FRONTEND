import { useState, useEffect, useMemo } from 'react';
import {
    BanknotesIcon,
    CalendarIcon,
    UserGroupIcon,
    CheckCircleIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    EyeIcon,
    PlayIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
    // markSelfAttendance removed - endpoint does not exist
    markEmployeeAttendance,
    bulkMarkAttendance,
    // searchLabourers removed - endpoint does not exist
    previewWeeklyPayroll,
    previewMonthlyPayroll,
    runWeeklyPayroll,
    runMonthlyPayroll,
    // recordAdvancePayment removed - endpoint does not exist
    listEmployees,
    type MarkAttendanceRequest,
    type BulkMarkAttendanceRequest,
    type PayrollPreviewDto,
    type EmployeeDto
} from '../../lib/adminApi';
import clsx from 'clsx';

type TabType = 'attendance' | 'preview' | 'history';

export default function PayrollPage() {
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('attendance');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Attendance state
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceStatus, setAttendanceStatus] = useState<'PRESENT' | 'ABSENT' | 'HALF_DAY'>('PRESENT');
    const [attendanceRemarks, setAttendanceRemarks] = useState('');
    // labourerSearch and labourerResults removed - searchLabourers endpoint does not exist
    const [selectedLabourers, setSelectedLabourers] = useState<number[]>([]);
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);

    // Payroll preview state
    const [previewType, setPreviewType] = useState<'weekly' | 'monthly'>('weekly');
    const [weekStartDate, setWeekStartDate] = useState(() => {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (today.getDay() + 6) % 7);
        return monday.toISOString().split('T')[0];
    });
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [preview, setPreview] = useState<PayrollPreviewDto | null>(null);

    // Advance payment state removed - recordAdvancePayment endpoint does not exist

    useEffect(() => {
        if (session) {
            loadEmployees();
        }
    }, [session]);

    const loadEmployees = async () => {
        try {
            const data = await listEmployees(session);
            setEmployees(data as EmployeeDto[]);
        } catch (err) {
            console.error('Failed to load employees', err);
        }
    };

    // handleSearchLabourers removed - searchLabourers endpoint does not exist
    // handleMarkSelfAttendance removed - markSelfAttendance endpoint does not exist

    const handleMarkEmployeeAttendance = async (employeeId: number) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await markEmployeeAttendance(employeeId, {
                date: attendanceDate,
                status: attendanceStatus,
                remarks: attendanceRemarks || undefined,
            }, session);
            setSuccess(`Attendance marked for employee`);
            setAttendanceRemarks('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkMarkAttendance = async () => {
        if (selectedLabourers.length === 0) {
            setError('Please select at least one labourer');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await bulkMarkAttendance({
                employeeIds: selectedLabourers,
                date: attendanceDate,
                status: attendanceStatus,
                remarks: attendanceRemarks || undefined,
            }, session);
            setSuccess(`Attendance marked for ${selectedLabourers.length} labourer(s)`);
            setSelectedLabourers([]);
            setAttendanceRemarks('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };


    const handlePreviewPayroll = async () => {
        try {
            setLoading(true);
            setError(null);
            setPreview(null);
            const data = previewType === 'weekly'
                ? await previewWeeklyPayroll(weekStartDate, session)
                : await previewMonthlyPayroll(month, session);
            setPreview(data as PayrollPreviewDto);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load payroll preview');
        } finally {
            setLoading(false);
        }
    };

    const handleRunPayroll = async () => {
        if (!preview) {
            setError('Please preview payroll first');
            return;
        }
        if (!confirm(`Are you sure you want to run ${previewType} payroll? This will create journal entries.`)) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const payload = previewType === 'weekly'
                ? { weekStartDate, confirm: true }
                : { month, confirm: true };
            await (previewType === 'weekly' ? runWeeklyPayroll : runMonthlyPayroll)(payload, session);
            setSuccess(`${previewType === 'weekly' ? 'Weekly' : 'Monthly'} payroll executed successfully`);
            setPreview(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to run payroll');
        } finally {
            setLoading(false);
        }
    };



    const labourers = useMemo(() => {
        return employees.filter(e => e.role?.toLowerCase().includes('labour') || e.role?.toLowerCase().includes('worker'));
    }, [employees]);

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-200 pb-4 sm:pb-6 dark:border-zinc-800">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Payroll Management</h1>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                        Manage attendance, preview and execute payroll
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="rounded-lg bg-rose-50 p-3 sm:p-4 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg bg-emerald-50 p-3 sm:p-4 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                    {success}
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
                {(['attendance', 'preview', 'history'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                            "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors touch-manipulation",
                            activeTab === tab
                                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                        )}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <div className="space-y-4 sm:space-y-6">

                    {/* Mark Labourer Attendance */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                            <UserGroupIcon className="h-5 w-5" />
                            Mark Labourer Attendance
                        </h2>

                        {/* Search Labourers - REMOVED */}

                        {/* Selected Labourers */}
                        {selectedLabourers.length > 0 && (
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {selectedLabourers.map((id) => {
                                        const emp = employees.find(e => e.id === id);
                                        return emp ? (
                                            <span
                                                key={id}
                                                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                                            >
                                                {emp.firstName} {emp.lastName}
                                                <button
                                                    onClick={() => setSelectedLabourers(selectedLabourers.filter(i => i !== id))}
                                                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Attendance Form for Labourers */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full h-9 sm:h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
                                <select
                                    className="w-full h-9 sm:h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                                    value={attendanceStatus}
                                    onChange={(e) => setAttendanceStatus(e.target.value as any)}
                                >
                                    <option value="PRESENT">Present</option>
                                    <option value="HALF_DAY">Half Day</option>
                                    <option value="ABSENT">Absent</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Remarks</label>
                                <input
                                    type="text"
                                    className="w-full h-9 sm:h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                                    placeholder="Optional remarks"
                                    value={attendanceRemarks}
                                    onChange={(e) => setAttendanceRemarks(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={handleBulkMarkAttendance}
                                disabled={loading || selectedLabourers.length === 0}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 touch-manipulation disabled:opacity-50"
                            >
                                <CheckCircleIcon className="h-4 w-4" />
                                Mark Selected ({selectedLabourers.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
                <div className="space-y-4 sm:space-y-6">
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                            <EyeIcon className="h-5 w-5" />
                            Payroll Preview
                        </h2>

                        <div className="grid gap-4 sm:grid-cols-2 mb-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
                                <select
                                    className="w-full h-9 sm:h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                                    value={previewType}
                                    onChange={(e) => setPreviewType(e.target.value as any)}
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            {previewType === 'weekly' ? (
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Week Start (Monday)</label>
                                    <input
                                        type="date"
                                        className="w-full h-9 sm:h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                                        value={weekStartDate}
                                        onChange={(e) => setWeekStartDate(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Month</label>
                                    <input
                                        type="month"
                                        className="w-full h-9 sm:h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handlePreviewPayroll}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 touch-manipulation disabled:opacity-50"
                        >
                            <EyeIcon className="h-4 w-4" />
                            Preview Payroll
                        </button>

                        {preview && (
                            <div className="mt-6 space-y-4">
                                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                                    <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                                        <div>Period: {preview.period.from} to {preview.period.to}</div>
                                        <div>Calculated at: {new Date(preview.calculatedAt).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Desktop: Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                            <tr>
                                                <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Employee</th>
                                                <th className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Days</th>
                                                <th className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Gross</th>
                                                <th className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Advance</th>
                                                <th className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Net Pay</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {preview.employees.map((emp) => (
                                                <tr key={emp.employeeId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                                    <td className="px-3 sm:px-4 py-2">
                                                        <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">{emp.employeeName}</div>
                                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{emp.employeeCode}</div>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm">
                                                        {emp.daysPresent} full + {emp.daysHalf} half
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 text-right font-mono text-xs sm:text-sm">₹ {emp.grossPay.toLocaleString()}</td>
                                                    <td className="px-3 sm:px-4 py-2 text-right font-mono text-xs sm:text-sm">₹ {emp.advanceDeducted.toLocaleString()}</td>
                                                    <td className="px-3 sm:px-4 py-2 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">₹ {emp.netPay.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-zinc-50 dark:bg-zinc-800/50 font-bold border-t-2 border-zinc-200 dark:border-zinc-700">
                                            <tr>
                                                <td colSpan={4} className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm">Grand Total</td>
                                                <td className="px-3 sm:px-4 py-2 text-right font-mono text-sm sm:text-lg">₹ {preview.grandTotal.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Mobile: Card View */}
                                <div className="lg:hidden space-y-3">
                                    {preview.employees.map((emp) => (
                                        <div key={emp.employeeId} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                                            <div className="mb-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                                                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{emp.employeeName}</div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{emp.employeeCode}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Days Worked</span>
                                                    <span className="text-xs text-zinc-900 dark:text-zinc-100">{emp.daysPresent} full + {emp.daysHalf} half</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Gross Pay</span>
                                                    <span className="text-xs font-mono text-zinc-900 dark:text-zinc-100">₹ {emp.grossPay.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Advance Deducted</span>
                                                    <span className="text-xs font-mono text-zinc-900 dark:text-zinc-100">₹ {emp.advanceDeducted.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Net Pay</span>
                                                    <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">₹ {emp.netPay.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Grand Total Card */}
                                    <div className="rounded-lg border-2 border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Grand Total</div>
                                        <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">₹ {preview.grandTotal.toLocaleString()}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRunPayroll}
                                    disabled={loading}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 touch-manipulation disabled:opacity-50"
                                >
                                    <PlayIcon className="h-4 w-4" />
                                    Run {previewType === 'weekly' ? 'Weekly' : 'Monthly'} Payroll
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Payroll History</h2>
                    <div className="text-center py-12 text-sm text-zinc-500 dark:text-zinc-400">
                        Payroll history will be displayed here
                    </div>
                </div>
            )}


        </div>
    );
}

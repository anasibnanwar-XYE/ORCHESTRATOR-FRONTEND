import { useState, useEffect } from 'react';
import {
    Plus,
    User,
    Search,
    X,
    Pencil,
    Trash2,
    CheckCircle,
    XCircle,
    ClipboardList,
    Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    listEmployees,
    createEmployee,
    updateEmployee,
    listLeaveRequests,
    createLeaveRequest,
    updateLeaveRequestStatus,
    type EmployeeDto,
    type EmployeeRequest,
    type LeaveRequestDto,
    type LeaveRequestRequest,
} from '../../lib/adminApi';
import { apiRequest } from '../../lib/api';
import { ResponsiveModal } from '../../design-system';

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'employees' | 'leave';

interface ConfirmState {
    open: boolean;
    title: string;
    message: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
    if (!state.open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl ring-1 ring-border">
                <h3 className="text-base font-semibold text-primary">{state.title}</h3>
                <p className="mt-2 text-sm text-secondary">{state.message}</p>
                <div className="mt-5 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => { state.onConfirm(); onClose(); }}
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                            state.variant === 'danger'
                                ? 'bg-status-error-text hover:opacity-90'
                                : 'bg-brand-600 hover:bg-brand-700'
                        }`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        ACTIVE: 'bg-status-success-bg text-status-success-text',
        INACTIVE: 'bg-surface-highlight text-tertiary',
        APPROVED: 'bg-status-success-bg text-status-success-text',
        REJECTED: 'bg-status-error-bg text-status-error-text',
        PENDING: 'bg-status-warning-bg text-status-warning-text',
        LEAVE: 'bg-status-info-bg text-status-info-text',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-surface-highlight text-secondary'}`}>
            {status}
        </span>
    );
}

// ── Employee Form ─────────────────────────────────────────────────────────────

const emptyEmployee = (): EmployeeRequest => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    hiredDate: new Date().toISOString().split('T')[0],
    employeeType: 'STAFF',
    paymentSchedule: 'MONTHLY',
});

function EmployeeForm({
    formData,
    onChange,
    onSubmit,
    onCancel,
    submitLabel,
    error,
}: {
    formData: EmployeeRequest;
    onChange: (data: EmployeeRequest) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
    error: string | null;
}) {
    const field = (label: string, field: keyof EmployeeRequest, type = 'text', required = false) => (
        <div>
            <label className="block text-sm font-medium text-secondary">
                {label}{required && ' *'}
            </label>
            <input
                type={type}
                required={required}
                className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={(formData[field] as string) || ''}
                onChange={(e) => onChange({ ...formData, [field]: e.target.value })}
            />
        </div>
    );

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {error && (
                <div className="rounded-lg border border-transparent bg-status-error-bg p-3 text-sm text-status-error-text">
                    {error}
                </div>
            )}

            {/* Basic Information */}
            <div>
                <h3 className="mb-3 border-b border-border pb-2 text-sm font-semibold text-primary">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    {field('First Name', 'firstName', 'text', true)}
                    {field('Last Name', 'lastName', 'text', true)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    {field('Email', 'email', 'email', true)}
                    {field('Phone', 'phone', 'tel')}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    {field('Role / Job Title', 'role', 'text', true)}
                    {field('Hired Date', 'hiredDate', 'date', true)}
                </div>
            </div>

            {/* Payroll Information */}
            <div>
                <h3 className="mb-3 border-b border-border pb-2 text-sm font-semibold text-primary">Payroll Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary">Employee Type *</label>
                        <select
                            required
                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={formData.employeeType}
                            onChange={(e) => onChange({ ...formData, employeeType: e.target.value as 'STAFF' | 'LABOUR' })}
                        >
                            <option value="STAFF">Staff</option>
                            <option value="LABOUR">Labour</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary">Payment Schedule</label>
                        <select
                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={formData.paymentSchedule || 'MONTHLY'}
                            onChange={(e) => onChange({ ...formData, paymentSchedule: e.target.value as 'MONTHLY' | 'WEEKLY' })}
                        >
                            <option value="MONTHLY">Monthly</option>
                            <option value="WEEKLY">Weekly</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary">Monthly Salary (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={formData.monthlySalary || ''}
                            onChange={(e) => onChange({ ...formData, monthlySalary: e.target.value ? parseFloat(e.target.value) : undefined })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary">Daily Rate (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={formData.dailyWage || ''}
                            onChange={(e) => onChange({ ...formData, dailyWage: e.target.value ? parseFloat(e.target.value) : undefined })}
                        />
                    </div>
                </div>
            </div>

            {/* Bank Details */}
            <div>
                <h3 className="mb-3 border-b border-border pb-2 text-sm font-semibold text-primary">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary">Bank Account Number</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={formData.bankAccountNumber || ''}
                            onChange={(e) => onChange({ ...formData, bankAccountNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary">Bank Name</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={formData.bankName || ''}
                            onChange={(e) => onChange({ ...formData, bankName: e.target.value })}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-secondary">IFSC Code</label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        value={formData.ifscCode || ''}
                        onChange={(e) => onChange({ ...formData, ifscCode: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
    const { session } = useAuth();

    // ── Tab
    const [activeTab, setActiveTab] = useState<Tab>('employees');

    // ── Employees state
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [empError, setEmpError] = useState<string | null>(null);

    // ── Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createFormData, setCreateFormData] = useState<EmployeeRequest>(emptyEmployee());
    const [createError, setCreateError] = useState<string | null>(null);

    // ── Edit modal
    const [editEmployee, setEditEmployee] = useState<EmployeeDto | null>(null);
    const [editFormData, setEditFormData] = useState<EmployeeRequest>(emptyEmployee());
    const [editError, setEditError] = useState<string | null>(null);

    // ── Confirm dialog
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        open: false,
        title: '',
        message: '',
        onConfirm: () => undefined,
    });

    // ── Leave requests state
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
    const [loadingLeave, setLoadingLeave] = useState(false);
    const [leaveError, setLeaveError] = useState<string | null>(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveFormData, setLeaveFormData] = useState<LeaveRequestRequest>({
        employeeId: undefined,
        leaveType: 'ANNUAL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
    });
    const [leaveFormError, setLeaveFormError] = useState<string | null>(null);
    const [leaveActionError, setLeaveActionError] = useState<string | null>(null);

    // ── Load data

    const normalizeOptional = (value?: string) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : undefined;
    };

    const buildEmployeePayload = (value: EmployeeRequest): EmployeeRequest => ({
        ...value,
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim(),
        phone: normalizeOptional(value.phone),
        role: normalizeOptional(value.role),
        bankAccountNumber: normalizeOptional(value.bankAccountNumber),
        bankName: normalizeOptional(value.bankName),
        ifscCode: normalizeOptional(value.ifscCode),
        employeeType: normalizeOptional(value.employeeType),
        paymentSchedule: normalizeOptional(value.paymentSchedule),
    });

    const loadEmployees = async () => {
        try {
            setLoadingEmployees(true);
            setEmpError(null);
            const data = await listEmployees(session);
            setEmployees(data as EmployeeDto[]);
        } catch (err) {
            setEmpError(err instanceof Error ? err.message : 'Failed to load employees');
        } finally {
            setLoadingEmployees(false);
        }
    };

    const loadLeaveRequests = async () => {
        try {
            setLoadingLeave(true);
            setLeaveError(null);
            const data = await listLeaveRequests(session);
            setLeaveRequests(data as LeaveRequestDto[]);
        } catch (err) {
            setLeaveError(err instanceof Error ? err.message : 'Failed to load leave requests');
        } finally {
            setLoadingLeave(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (activeTab === 'leave') {
            loadLeaveRequests();
        }
    }, [activeTab, session]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handlers

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setCreateError(null);
            await createEmployee(buildEmployeePayload(createFormData), session);
            setShowCreateModal(false);
            setCreateFormData(emptyEmployee());
            loadEmployees();
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Failed to create employee');
        }
    };

    const openEditModal = (employee: EmployeeDto) => {
        setEditEmployee(employee);
        // EmployeeDto only exposes base fields; extended fields come from server response
        // We cast to unknown first to safely access extra properties without `as any`
        const ext = employee as Record<string, unknown>;
        setEditFormData({
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            email: employee.email || '',
            phone: typeof ext.phone === 'string' ? ext.phone : '',
            role: employee.role || '',
            hiredDate: employee.hiredDate || new Date().toISOString().split('T')[0],
            employeeType: (typeof ext.employeeType === 'string' ? ext.employeeType : 'STAFF') as 'STAFF' | 'LABOUR',
            paymentSchedule: (typeof ext.paymentSchedule === 'string' ? ext.paymentSchedule : 'MONTHLY') as 'MONTHLY' | 'WEEKLY',
            monthlySalary: typeof ext.monthlySalary === 'number' ? ext.monthlySalary : undefined,
            dailyWage: typeof ext.dailyWage === 'number' ? ext.dailyWage : undefined,
            bankAccountNumber: typeof ext.bankAccountNumber === 'string' ? ext.bankAccountNumber : undefined,
            bankName: typeof ext.bankName === 'string' ? ext.bankName : undefined,
            ifscCode: typeof ext.ifscCode === 'string' ? ext.ifscCode : undefined,
        });
        setEditError(null);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editEmployee?.id) return;
        try {
            setEditError(null);
            await updateEmployee(editEmployee.id, buildEmployeePayload(editFormData), session);
            setEditEmployee(null);
            loadEmployees();
        } catch (err) {
            setEditError(err instanceof Error ? err.message : 'Failed to update employee');
        }
    };

    const handleDelete = (employee: EmployeeDto) => {
        setConfirmState({
            open: true,
            title: 'Delete Employee',
            message: `Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    setEmpError(null);
                    await apiRequest(`/api/v1/hr/employees/${employee.id}`, { method: 'DELETE' }, session);
                    loadEmployees();
                } catch (err) {
                    setEmpError(err instanceof Error ? err.message : 'Failed to delete employee');
                }
            },
        });
    };

    const handleLeaveStatusUpdate = async (id: number, newStatus: 'APPROVED' | 'REJECTED') => {
        try {
            setLeaveActionError(null);
            await updateLeaveRequestStatus(id, newStatus, session);
            loadLeaveRequests();
        } catch (err) {
            setLeaveActionError(err instanceof Error ? err.message : `Failed to ${newStatus.toLowerCase()} leave request`);
        }
    };

    const handleCreateLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLeaveFormError(null);
            await createLeaveRequest(leaveFormData, session);
            setShowLeaveModal(false);
            setLeaveFormData({
                employeeId: undefined,
                leaveType: 'ANNUAL',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                reason: '',
            });
            loadLeaveRequests();
        } catch (err) {
            setLeaveFormError(err instanceof Error ? err.message : 'Failed to create leave request');
        }
    };

    const filteredEmployees = employees.filter((emp) =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (emp.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Employee Directory</h1>
                    <p className="text-sm text-secondary">Manage HR records, personnel, and leave requests</p>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="border-b border-border">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                            activeTab === 'employees'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-secondary hover:text-primary'
                        }`}
                    >
                        <Users className="h-4 w-4" />
                        Employees
                    </button>
                    <button
                        onClick={() => setActiveTab('leave')}
                        className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                            activeTab === 'leave'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-secondary hover:text-primary'
                        }`}
                    >
                        <ClipboardList className="h-4 w-4" />
                        Leave Requests
                    </button>
                </nav>
            </div>

            {/* ── Employees Tab ── */}
            {activeTab === 'employees' && (
                <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                className="h-10 rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => { setShowCreateModal(true); setCreateError(null); setCreateFormData(emptyEmployee()); }}
                            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add Employee
                        </button>
                    </div>

                    {empError && (
                        <div className="rounded-lg border border-transparent bg-status-error-bg p-3 text-sm text-status-error-text">
                            {empError}
                        </div>
                    )}

                    <div id="employees-list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {loadingEmployees ? (
                            <div className="col-span-full p-6 text-center text-secondary">Loading employees...</div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="col-span-full p-6 text-center text-secondary">No employees found</div>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <div key={employee.id} className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
                                    {/* Actions */}
                                    <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                            onClick={() => openEditModal(employee)}
                                            className="rounded-lg p-1.5 text-secondary hover:bg-surface-highlight hover:text-primary"
                                            title="Edit employee"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(employee)}
                                            className="rounded-lg p-1.5 text-secondary hover:bg-status-error-bg hover:text-status-error-text"
                                            title="Delete employee"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-highlight text-secondary">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="truncate font-semibold text-primary">
                                                {employee.firstName} {employee.lastName}
                                            </h3>
                                            <p className="truncate text-sm text-secondary">{employee.role}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Email</span>
                                            <span className="max-w-[60%] truncate text-right font-medium text-primary">{employee.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Status</span>
                                            <StatusBadge status={employee.status || 'ACTIVE'} />
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Joined</span>
                                            <span className="font-medium text-primary">{employee.hiredDate}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* ── Leave Requests Tab ── */}
            {activeTab === 'leave' && (
                <>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-secondary">{leaveRequests.length} leave request(s)</p>
                        <button
                            onClick={() => { setShowLeaveModal(true); setLeaveFormError(null); }}
                            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                        >
                            <Plus className="h-4 w-4" />
                            New Leave Request
                        </button>
                    </div>

                    {leaveError && (
                        <div className="rounded-lg border border-transparent bg-status-error-bg p-3 text-sm text-status-error-text">
                            {leaveError}
                        </div>
                    )}
                    {leaveActionError && (
                        <div className="rounded-lg border border-transparent bg-status-error-bg p-3 text-sm text-status-error-text">
                            {leaveActionError}
                        </div>
                    )}

                    <div className="rounded-lg border border-border bg-surface shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border bg-surface-highlight">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Employee</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">From</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">To</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-secondary">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loadingLeave ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-secondary">
                                                Loading leave requests...
                                            </td>
                                        </tr>
                                    ) : leaveRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-secondary">
                                                No leave requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        leaveRequests.map((lr) => (
                                            <tr key={lr.id} className="hover:bg-surface-highlight">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-primary">{lr.employeeName || `Employee #${lr.employeeId}`}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-secondary">{lr.leaveType}</td>
                                                <td className="px-4 py-3 text-sm text-secondary">{lr.startDate}</td>
                                                <td className="px-4 py-3 text-sm text-secondary">{lr.endDate}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <StatusBadge status={lr.status || 'PENDING'} />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {lr.status === 'PENDING' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => lr.id && handleLeaveStatusUpdate(lr.id, 'APPROVED')}
                                                                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-status-success-text hover:bg-status-success-bg"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => lr.id && handleLeaveStatusUpdate(lr.id, 'REJECTED')}
                                                                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-status-error-text hover:bg-status-error-bg"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── Create Employee Modal ── */}
            <ResponsiveModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Add New Employee"
                size="lg"
            >
                <EmployeeForm
                    formData={createFormData}
                    onChange={setCreateFormData}
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreateModal(false)}
                    submitLabel="Create Employee"
                    error={createError}
                />
            </ResponsiveModal>

            {/* ── Edit Employee Modal ── */}
            <ResponsiveModal
                isOpen={!!editEmployee}
                onClose={() => setEditEmployee(null)}
                title={editEmployee ? `Edit: ${editEmployee.firstName} ${editEmployee.lastName}` : 'Edit Employee'}
                size="lg"
            >
                <EmployeeForm
                    formData={editFormData}
                    onChange={setEditFormData}
                    onSubmit={handleEdit}
                    onCancel={() => setEditEmployee(null)}
                    submitLabel="Save Changes"
                    error={editError}
                />
            </ResponsiveModal>

            {/* ── Create Leave Request Modal ── */}
            <ResponsiveModal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                title="New Leave Request"
                size="md"
            >
                <form onSubmit={handleCreateLeave} className="space-y-4">
                    {leaveFormError && (
                        <div className="rounded-lg border border-transparent bg-status-error-bg p-3 text-sm text-status-error-text">
                            {leaveFormError}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-secondary">Employee *</label>
                        <select
                            required
                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={leaveFormData.employeeId ?? ''}
                            onChange={(e) => setLeaveFormData({ ...leaveFormData, employeeId: e.target.value ? Number(e.target.value) : undefined })}
                        >
                            <option value="">Select employee...</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary">Leave Type *</label>
                        <select
                            required
                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={leaveFormData.leaveType}
                            onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value })}
                        >
                            <option value="ANNUAL">Annual</option>
                            <option value="SICK">Sick</option>
                            <option value="CASUAL">Casual</option>
                            <option value="MATERNITY">Maternity</option>
                            <option value="PATERNITY">Paternity</option>
                            <option value="UNPAID">Unpaid</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary">Start Date *</label>
                            <input
                                type="date"
                                required
                                className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                value={leaveFormData.startDate}
                                onChange={(e) => setLeaveFormData({ ...leaveFormData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary">End Date *</label>
                            <input
                                type="date"
                                required
                                className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                value={leaveFormData.endDate}
                                onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary">Reason</label>
                        <textarea
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={leaveFormData.reason || ''}
                            onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <button
                            type="button"
                            onClick={() => setShowLeaveModal(false)}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </ResponsiveModal>

            {/* ── Confirm Dialog ── */}
            <ConfirmDialog
                state={confirmState}
                onClose={() => setConfirmState((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}

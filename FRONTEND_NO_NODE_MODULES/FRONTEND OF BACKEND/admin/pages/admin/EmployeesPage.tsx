import { useState, useEffect } from 'react';
import { PlusIcon, UserIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { listEmployees, createEmployee, type EmployeeDto, type EmployeeRequest } from '../../lib/adminApi';

export default function EmployeesPage() {
    const { session } = useAuth();
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<EmployeeRequest>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        hiredDate: new Date().toISOString().split('T')[0],
        employeeType: 'STAFF',
        paymentSchedule: 'MONTHLY',
    });
    const [error, setError] = useState<string | null>(null);

    const normalizeOptional = (value?: string) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : undefined;
    };

    const buildEmployeePayload = (value: EmployeeRequest): EmployeeRequest => {
        return {
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
        };
    };

    useEffect(() => {
        loadEmployees();
    }, [session]);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await listEmployees(session);
            setEmployees(data as EmployeeDto[]);
        } catch (err) {
            console.error('Failed to load employees', err);
            setError(err instanceof Error ? err.message : 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            await createEmployee(buildEmployeePayload(formData), session);
            setShowModal(false);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: '',
                hiredDate: new Date().toISOString().split('T')[0],
                employeeType: 'STAFF',
                paymentSchedule: 'MONTHLY',
            });
            loadEmployees();
        } catch (err) {
            console.error('Failed to create employee', err);
            setError(err instanceof Error ? err.message : 'Failed to create employee');
        }
    };

    const filteredEmployees = employees.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (emp.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Employee Directory</h1>
                    <p className="text-sm text-secondary">Manage HR records and personnel</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="h-10 rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        id="employees-add-btn"
                        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Employee
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                </div>
            )}

            <div id="employees-list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loading ? (
                    <div className="col-span-full p-6 text-center text-secondary">Loading employees...</div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="col-span-full p-6 text-center text-secondary">No employees found</div>
                ) : (
                    filteredEmployees.map((employee) => (
                        <div key={employee.id} className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-highlight text-secondary group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-900/20 dark:group-hover:text-brand-400">
                                    <UserIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-primary">{employee.firstName} {employee.lastName}</h3>
                                    <p className="text-sm text-secondary">{employee.role}</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-secondary">Email</span>
                                    <span className="font-medium text-primary">{employee.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Status</span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${employee.status === 'ACTIVE'
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                        }`}>
                                        {employee.status}
                                    </span>
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

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-3xl rounded-2xl bg-surface p-6 shadow-xl ring-1 ring-border my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-primary">Add New Employee</h2>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-1 text-secondary hover:bg-surface-highlight hover:text-primary transition-colors"
                                aria-label="Close"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary mb-3 pb-2 border-b border-border">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Last Name *</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Phone</label>
                                        <input
                                            type="tel"
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Role / Job Title *</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Hired Date *</label>
                                        <input
                                            type="date"
                                            required
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.hiredDate}
                                            onChange={(e) => setFormData({ ...formData, hiredDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payroll Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary mb-3 pb-2 border-b border-border">Payroll Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Employee Type *</label>
                                        <select
                                            required
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.employeeType}
                                            onChange={(e) => setFormData({ ...formData, employeeType: e.target.value as 'STAFF' | 'LABOUR' })}
                                        >
                                            <option value="STAFF">Staff</option>
                                            <option value="LABOUR">Labour</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Payment Schedule</label>
                                        <select
                                            required
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.paymentSchedule || 'MONTHLY'}
                                            onChange={(e) => setFormData({ ...formData, paymentSchedule: e.target.value as 'MONTHLY' | 'WEEKLY' })}
                                        >
                                            <option value="MONTHLY">Monthly</option>
                                            <option value="WEEKLY">Weekly</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Monthly Salary (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.monthlySalary || ''}
                                            onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value ? parseFloat(e.target.value) : undefined } as any)}
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
                                            onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Working Days/Month</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="31"
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.workingDaysPerMonth || ''}
                                            onChange={(e) => setFormData({ ...formData, workingDaysPerMonth: e.target.value ? parseInt(e.target.value) : undefined })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Weekly Off Days</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="7"
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.weeklyOffDays || ''}
                                            onChange={(e) => setFormData({ ...formData, weeklyOffDays: e.target.value ? parseInt(e.target.value) : undefined })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Standard Hours/Day</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max="24"
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.standardHoursPerDay || ''}
                                            onChange={(e) => setFormData({ ...formData, standardHoursPerDay: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Overtime Rate Multiplier</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.overtimeRateMultiplier || ''}
                                            onChange={(e) => setFormData({ ...formData, overtimeRateMultiplier: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Double OT Rate Multiplier</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.doubleOtRateMultiplier || ''}
                                            onChange={(e) => setFormData({ ...formData, doubleOtRateMultiplier: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary mb-3 pb-2 border-b border-border">Bank Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Bank Account Number</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.bankAccountNumber || ''}
                                            onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary">Bank Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            value={formData.bankName || ''}
                                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-secondary">IFSC Code</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        value={formData.ifscCode || ''}
                                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                                >
                                    Create Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

 /**
  * EmployeesPage
  *
  * Employee management with:
  *  - DataTable with search (name, ID, dept, designation, salary)
  *  - Create form with duplicate employee code prevention
  *  - Edit employee details including salary & tax
  *  - Deactivate employee with confirmation
  *
  * API:
  *  GET    /api/v1/hr/employees
  *  POST   /api/v1/hr/employees
  *  PUT    /api/v1/hr/employees/{id}
  *  DELETE /api/v1/hr/employees/{id}
  *  GET    /api/v1/hr/salary-structures
  *  POST   /api/v1/hr/salary-structures
  */
 
 import { useEffect, useState, useCallback, useMemo } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Plus,
   MoreHorizontal,
 } from 'lucide-react';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { DropdownMenu } from '@/components/ui/DropdownMenu';
 import { Tabs } from '@/components/ui/Tabs';
 import { useToast } from '@/components/ui/Toast';
 import {
   hrApi,
   type EmployeeDto,
   type EmployeeRequest,
   type SalaryStructureTemplateDto,
   type EmployeeType,
   type PaymentSchedule,
   type TaxRegime,
   type EmployeeStatus,
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
 
 function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
   return (
     <Badge variant={status === 'ACTIVE' ? 'success' : 'default'} dot>
       {status === 'ACTIVE' ? 'Active' : 'Inactive'}
     </Badge>
   );
 }
 
 function EmployeeTypeBadge({ type }: { type: EmployeeType }) {
   return (
     <Badge variant={type === 'STAFF' ? 'info' : 'warning'}>
       {type === 'STAFF' ? 'Staff' : 'Labour'}
     </Badge>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Form types
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface EmployeeFormState {
   firstName: string;
   lastName: string;
   email: string;
   phone: string;
   department: string;
   designation: string;
   employeeCode: string;
   employeeType: EmployeeType;
   paymentSchedule: PaymentSchedule;
   dateOfJoining: string;
   monthlySalary: string;
   dailyWage: string;
   workingDaysPerMonth: string;
   salaryStructureTemplateId: string;
   pfNumber: string;
   esiNumber: string;
   panNumber: string;
   taxRegime: TaxRegime;
   bankAccountName: string;
   bankAccountNumber: string;
   bankIfsc: string;
   bankBranch: string;
 }
 
 interface EmployeeFormErrors {
   firstName?: string;
   lastName?: string;
   email?: string;
   employeeCode?: string;
   monthlySalary?: string;
   dailyWage?: string;
   panNumber?: string;
 }
 
 const EMPTY_FORM: EmployeeFormState = {
   firstName: '',
   lastName: '',
   email: '',
   phone: '',
   department: '',
   designation: '',
   employeeCode: '',
   employeeType: 'STAFF',
   paymentSchedule: 'MONTHLY',
   dateOfJoining: '',
   monthlySalary: '',
   dailyWage: '',
   workingDaysPerMonth: '26',
   salaryStructureTemplateId: '',
   pfNumber: '',
   esiNumber: '',
   panNumber: '',
   taxRegime: 'NEW',
   bankAccountName: '',
   bankAccountNumber: '',
   bankIfsc: '',
   bankBranch: '',
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Employee Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface EmployeeFormProps {
   initial?: EmployeeDto | null;
   salaryStructures: SalaryStructureTemplateDto[];
   existingCodes: string[];
   onSave: (data: EmployeeRequest) => Promise<void>;
   onClose: () => void;
   isSaving: boolean;
 }
 
 function EmployeeForm({
   initial,
   salaryStructures,
   existingCodes,
   onSave,
   onClose,
   isSaving,
 }: EmployeeFormProps) {
   const [form, setForm] = useState<EmployeeFormState>(() =>
     initial
       ? {
           firstName: initial.firstName,
           lastName: initial.lastName,
           email: initial.email,
           phone: initial.phone ?? '',
           department: initial.department ?? '',
           designation: initial.designation ?? '',
           employeeCode: initial.employeeCode,
           employeeType: initial.employeeType,
           paymentSchedule: initial.paymentSchedule,
           dateOfJoining: initial.dateOfJoining ?? '',
           monthlySalary: initial.monthlySalary ? String(initial.monthlySalary) : '',
           dailyWage: initial.dailyWage ? String(initial.dailyWage) : '',
           workingDaysPerMonth: initial.workingDaysPerMonth
             ? String(initial.workingDaysPerMonth)
             : '26',
           salaryStructureTemplateId: initial.salaryStructureTemplateId
             ? String(initial.salaryStructureTemplateId)
             : '',
           pfNumber: initial.pfNumber ?? '',
           esiNumber: initial.esiNumber ?? '',
           panNumber: initial.panNumber ?? '',
           taxRegime: initial.taxRegime ?? 'NEW',
           bankAccountName: initial.bankAccountName ?? '',
           bankAccountNumber: '',
           bankIfsc: initial.bankIfsc ?? '',
           bankBranch: initial.bankBranch ?? '',
         }
       : EMPTY_FORM
   );
   const [errors, setErrors] = useState<EmployeeFormErrors>({});
   const [formTab, setFormTab] = useState<'basic' | 'payroll' | 'statutory'>('basic');
 
   function set(field: keyof EmployeeFormState, value: string) {
     setForm((prev) => ({ ...prev, [field]: value }));
     setErrors((prev) => ({ ...prev, [field]: undefined }));
   }
 
   function validate(): boolean {
     const errs: EmployeeFormErrors = {};
     if (!form.firstName.trim()) errs.firstName = 'First name is required';
     if (!form.lastName.trim()) errs.lastName = 'Last name is required';
     if (!form.email.trim()) errs.email = 'Email is required';
     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
     if (!initial && !form.employeeCode.trim()) errs.employeeCode = 'Employee ID is required';
     if (!initial && form.employeeCode.trim()) {
       if (existingCodes.includes(form.employeeCode.trim().toUpperCase())) {
         errs.employeeCode = 'Employee ID already exists';
       }
     }
     if (form.employeeType === 'STAFF' && !form.monthlySalary && !form.salaryStructureTemplateId) {
       errs.monthlySalary = 'Monthly salary or salary template is required for staff';
     }
     if (form.employeeType === 'LABOUR' && !form.dailyWage) {
       errs.dailyWage = 'Daily wage is required for labour';
     }
     if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber)) {
       errs.panNumber = 'PAN must match format: AAAAA0000A';
     }
     setErrors(errs);
     return Object.keys(errs).length === 0;
   }
 
   async function handleSubmit() {
     if (!validate()) return;
     const payload: EmployeeRequest = {
       firstName: form.firstName.trim(),
       lastName: form.lastName.trim(),
       email: form.email.trim(),
       phone: form.phone.trim() || undefined,
       department: form.department.trim() || undefined,
       designation: form.designation.trim() || undefined,
       employeeCode: form.employeeCode.trim() || undefined,
       employeeType: form.employeeType,
       paymentSchedule: form.paymentSchedule,
       dateOfJoining: form.dateOfJoining || undefined,
       monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : undefined,
       dailyWage: form.dailyWage ? Number(form.dailyWage) : undefined,
       workingDaysPerMonth: form.workingDaysPerMonth
         ? Number(form.workingDaysPerMonth)
         : undefined,
       salaryStructureTemplateId: form.salaryStructureTemplateId
         ? Number(form.salaryStructureTemplateId)
         : undefined,
       pfNumber: form.pfNumber.trim() || undefined,
       esiNumber: form.esiNumber.trim() || undefined,
       panNumber: form.panNumber.trim() || undefined,
       taxRegime: form.taxRegime,
       bankAccountName: form.bankAccountName.trim() || undefined,
       bankAccountNumber: form.bankAccountNumber.trim() || undefined,
       bankIfsc: form.bankIfsc.trim() || undefined,
       bankBranch: form.bankBranch.trim() || undefined,
     };
     await onSave(payload);
   }
 
   const formTabs = [
     { label: 'Basic Info', value: 'basic' },
     { label: 'Payroll', value: 'payroll' },
     { label: 'Statutory & Bank', value: 'statutory' },
   ];
 
   return (
     <div className="space-y-4">
      <Tabs
         tabs={formTabs}
         active={formTab}
         onChange={(v) => setFormTab(v as 'basic' | 'payroll' | 'statutory')}
         variant="pill"
         size="sm"
       />
 
       {formTab === 'basic' && (
         <div className="space-y-3">
           <div className="grid grid-cols-2 gap-3">
             <Input
               label="First Name"
               value={form.firstName}
               onChange={(e) => set('firstName', e.target.value)}
               error={errors.firstName}
               placeholder="First name"
               required
             />
             <Input
               label="Last Name"
               value={form.lastName}
               onChange={(e) => set('lastName', e.target.value)}
               error={errors.lastName}
               placeholder="Last name"
               required
             />
           </div>
           <Input
             label="Email"
             type="email"
             value={form.email}
             onChange={(e) => set('email', e.target.value)}
             error={errors.email}
             placeholder="employee@company.com"
             required
           />
           <div className="grid grid-cols-2 gap-3">
             <Input
               label="Employee ID"
               value={form.employeeCode}
               onChange={(e) => set('employeeCode', e.target.value.toUpperCase())}
               error={errors.employeeCode}
               placeholder="EMP001"
               disabled={!!initial}
             />
             <Input
               label="Phone"
               value={form.phone}
               onChange={(e) => set('phone', e.target.value)}
               placeholder="+91 98765 43210"
             />
           </div>
           <div className="grid grid-cols-2 gap-3">
             <Input
               label="Department"
               value={form.department}
               onChange={(e) => set('department', e.target.value)}
               placeholder="e.g. Sales"
             />
             <Input
               label="Designation"
               value={form.designation}
               onChange={(e) => set('designation', e.target.value)}
               placeholder="e.g. Manager"
             />
           </div>
           <div className="grid grid-cols-2 gap-3">
             <Select
               label="Employee Type"
               value={form.employeeType}
               onChange={(e) => set('employeeType', e.target.value)}
               options={[
                 { value: 'STAFF', label: 'Staff (Salaried)' },
                 { value: 'LABOUR', label: 'Labour (Daily Wage)' },
               ]}
             />
             <Input
               label="Date of Joining"
               type="date"
               value={form.dateOfJoining}
               onChange={(e) => set('dateOfJoining', e.target.value)}
             />
           </div>
         </div>
       )}
 
       {formTab === 'payroll' && (
         <div className="space-y-3">
           <Select
             label="Payment Schedule"
             value={form.paymentSchedule}
             onChange={(e) => set('paymentSchedule', e.target.value)}
             options={[
               { value: 'MONTHLY', label: 'Monthly' },
               { value: 'WEEKLY', label: 'Weekly' },
             ]}
           />
 
           {form.employeeType === 'STAFF' ? (
             <>
               <Select
                 label="Salary Structure Template"
                 value={form.salaryStructureTemplateId}
                 onChange={(e) => set('salaryStructureTemplateId', e.target.value)}
                 options={[
                   { value: '', label: 'Select template (optional)' },
                   ...salaryStructures
                     .filter((s) => s.active)
                     .map((s) => ({
                       value: String(s.id),
                       label: `${s.code} — ${s.name} (${formatINR(s.totalEarnings)}/mo)`,
                     })),
                 ]}
               />
               <div className="grid grid-cols-2 gap-3">
                 <Input
                   label="Monthly Salary (₹)"
                   type="number"
                   value={form.monthlySalary}
                   onChange={(e) => set('monthlySalary', e.target.value)}
                   error={errors.monthlySalary}
                   placeholder="e.g. 50000"
                 />
                 <Input
                   label="Working Days / Month"
                   type="number"
                   value={form.workingDaysPerMonth}
                   onChange={(e) => set('workingDaysPerMonth', e.target.value)}
                   placeholder="26"
                 />
               </div>
             </>
           ) : (
             <Input
               label="Daily Wage (₹)"
               type="number"
               value={form.dailyWage}
               onChange={(e) => set('dailyWage', e.target.value)}
               error={errors.dailyWage}
               placeholder="e.g. 700"
             />
           )}
 
           <Select
             label="Tax Regime"
             value={form.taxRegime}
             onChange={(e) => set('taxRegime', e.target.value)}
             options={[
               { value: 'NEW', label: 'New Regime (default)' },
               { value: 'OLD', label: 'Old Regime' },
             ]}
           />
         </div>
       )}
 
       {formTab === 'statutory' && (
         <div className="space-y-3">
           <div className="grid grid-cols-2 gap-3">
             <Input
               label="PF Number"
               value={form.pfNumber}
               onChange={(e) => set('pfNumber', e.target.value)}
               placeholder="PF account number"
             />
             <Input
               label="ESI Number"
               value={form.esiNumber}
               onChange={(e) => set('esiNumber', e.target.value)}
               placeholder="ESI registration number"
             />
           </div>
           <Input
             label="PAN Number"
             value={form.panNumber}
             onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
             error={errors.panNumber}
             placeholder="ABCDE1234F"
           />
           <div className="border-t border-[var(--color-border-subtle)] pt-3">
             <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
               Bank Details
             </p>
             <div className="space-y-3">
               <Input
                 label="Account Holder Name"
                 value={form.bankAccountName}
                 onChange={(e) => set('bankAccountName', e.target.value)}
                 placeholder="As per bank records"
               />
               <div className="grid grid-cols-2 gap-3">
                 <Input
                   label="Account Number"
                   value={form.bankAccountNumber}
                   onChange={(e) => set('bankAccountNumber', e.target.value)}
                   placeholder="Account number"
                 />
                 <Input
                   label="IFSC Code"
                   value={form.bankIfsc}
                   onChange={(e) => set('bankIfsc', e.target.value.toUpperCase())}
                   placeholder="e.g. SBIN0001234"
                 />
               </div>
               <Input
                 label="Branch"
                 value={form.bankBranch}
                 onChange={(e) => set('bankBranch', e.target.value)}
                 placeholder="Branch name"
               />
             </div>
           </div>
         </div>
       )}
 
       <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
         <Button variant="ghost" onClick={onClose} disabled={isSaving}>
           Cancel
         </Button>
        <Button onClick={handleSubmit} isLoading={isSaving}>
           {initial ? 'Save Changes' : 'Create Employee'}
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function EmployeesPage() {
   const { success: toastSuccess, error: toastError } = useToast();
   const [employees, setEmployees] = useState<EmployeeDto[]>([]);
   const [salaryStructures, setSalaryStructures] = useState<SalaryStructureTemplateDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const [search, setSearch] = useState('');
   const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
   const [typeFilter, setTypeFilter] = useState<'ALL' | 'STAFF' | 'LABOUR'>('ALL');
 
   const [modalOpen, setModalOpen] = useState(false);
   const [editing, setEditing] = useState<EmployeeDto | null>(null);
   const [isSaving, setIsSaving] = useState(false);
 
   const [confirmDeactivate, setConfirmDeactivate] = useState<EmployeeDto | null>(null);
   const [isDeactivating, setIsDeactivating] = useState(false);
 
   const loadData = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const [emps, structs] = await Promise.all([
         hrApi.getEmployees(),
         hrApi.getSalaryStructures(),
       ]);
       setEmployees(emps ?? []);
       setSalaryStructures(structs ?? []);
     } catch {
       setError('Failed to load employees. Please try again.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => {
     void loadData();
   }, [loadData]);
 
   const existingCodes = useMemo(
     () => employees.map((e) => e.employeeCode.toUpperCase()),
     [employees]
   );
 
   const filtered = useMemo(() => {
     const q = search.toLowerCase();
     return employees.filter((e) => {
       const matchesSearch =
         !q ||
         `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
         e.employeeCode.toLowerCase().includes(q) ||
         (e.department ?? '').toLowerCase().includes(q) ||
         (e.designation ?? '').toLowerCase().includes(q) ||
         String(e.monthlySalary ?? e.dailyWage ?? '').includes(q);
       const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
       const matchesType = typeFilter === 'ALL' || e.employeeType === typeFilter;
       return matchesSearch && matchesStatus && matchesType;
     });
   }, [employees, search, statusFilter, typeFilter]);
 
   async function handleSave(data: EmployeeRequest) {
     setIsSaving(true);
     try {
       if (editing) {
         await hrApi.updateEmployee(editing.id, data);
         toastSuccess('Employee updated');
       } else {
         await hrApi.createEmployee(data);
         toastSuccess('Employee created');
       }
       setModalOpen(false);
       setEditing(null);
       await loadData();
     } catch (err: unknown) {
       const msg =
         err instanceof Error ? err.message : 'Failed to save employee';
       toastError(msg);
     } finally {
       setIsSaving(false);
     }
   }
 
   async function handleDeactivate() {
     if (!confirmDeactivate) return;
     setIsDeactivating(true);
     try {
       await hrApi.deleteEmployee(confirmDeactivate.id);
       toastSuccess('Employee deactivated');
       setConfirmDeactivate(null);
       await loadData();
     } catch (err: unknown) {
       const msg =
         err instanceof Error ? err.message : 'Failed to deactivate employee';
       toastError(msg);
     } finally {
       setIsDeactivating(false);
     }
   }
 
   const columns: Column<EmployeeDto>[] = [
     {
       id: 'employeeCode',
       header: 'ID',
       width: '90px',
       accessor: (e) => (
         <span className="font-mono text-[12px] text-[var(--color-text-secondary)]">
           {e.employeeCode}
         </span>
       ),
     },
     {
       id: 'name',
       header: 'Name',
       accessor: (e) => (
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
             {e.firstName} {e.lastName}
           </p>
           <p className="text-[11px] text-[var(--color-text-tertiary)]">{e.email}</p>
         </div>
       ),
     },
     {
       id: 'department',
       header: 'Department',
       accessor: (e) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {e.department ?? '—'}
         </span>
       ),
     },
     {
       id: 'designation',
       header: 'Designation',
       accessor: (e) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {e.designation ?? '—'}
         </span>
       ),
     },
     {
       id: 'employeeType',
       header: 'Type',
       accessor: (e) => <EmployeeTypeBadge type={e.employeeType} />,
     },
     {
       id: 'salary',
       header: 'Salary / Wage',
       align: 'right',
       accessor: (e) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-secondary)]">
           {e.monthlySalary
             ? `${formatINR(e.monthlySalary)}/mo`
             : e.dailyWage
             ? `${formatINR(e.dailyWage)}/day`
             : '—'}
         </span>
       ),
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (e) => <EmployeeStatusBadge status={e.status} />,
     },
     {
       id: 'actions',
       header: '',
       width: '48px',
       accessor: (e) => (
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
             { label: 'Edit', value: 'edit' },
             ...(e.status === 'ACTIVE'
               ? [{ label: 'Deactivate', value: 'deactivate', destructive: true as const }]
               : []),
           ]}
           onSelect={(value) => {
             if (value === 'edit') {
               setEditing(e);
               setModalOpen(true);
             } else if (value === 'deactivate') {
               setConfirmDeactivate(e);
             }
           }}
         />
       ),
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
 
   return (
     <div className="space-y-4">
       <PageHeader
        title="Employees"
        description={`${employees.filter((e) => e.status === 'ACTIVE').length} active employees`}
        actions={
           <Button
            leftIcon={<Plus size={14} />}
             onClick={() => {
               setEditing(null);
               setModalOpen(true);
             }}
           >
             New Employee
           </Button>
         }
       />
 
       {/* Filters */}
       <div className="flex flex-wrap items-center gap-2">
         <input
           type="search"
           value={search}
           onChange={(e) => setSearch(e.target.value)}
           placeholder="Search by name, ID, department, designation..."
           className="h-8 min-w-[240px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] px-3 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]"
         />
         <Tabs
           tabs={[
             { label: 'All', value: 'ALL', count: employees.length },
             {
               label: 'Active',
               value: 'ACTIVE',
               count: employees.filter((e) => e.status === 'ACTIVE').length,
             },
             {
               label: 'Inactive',
               value: 'INACTIVE',
               count: employees.filter((e) => e.status === 'INACTIVE').length,
             },
           ]}
           active={statusFilter}
           onChange={(v) => setStatusFilter(v as 'ALL' | 'ACTIVE' | 'INACTIVE')}
           variant="pill"
           size="sm"
         />
         <Tabs
           tabs={[
             { label: 'All Types', value: 'ALL' },
             { label: 'Staff', value: 'STAFF' },
             { label: 'Labour', value: 'LABOUR' },
           ]}
           active={typeFilter}
           onChange={(v) => setTypeFilter(v as 'ALL' | 'STAFF' | 'LABOUR')}
           variant="pill"
           size="sm"
         />
       </div>
 
       <DataTable
         data={filtered}
         columns={columns}
         keyExtractor={(e) => String(e.id)}
         emptyMessage="No employees found. Add your first employee to get started."
       />
 
       {/* Create / Edit Modal */}
       <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (!isSaving) {
            setModalOpen(false);
            setEditing(null);
          }
        }}
         title={editing ? `Edit — ${editing.firstName} ${editing.lastName}` : 'New Employee'}
         size="lg"
       >
         <EmployeeForm
           initial={editing}
           salaryStructures={salaryStructures}
           existingCodes={existingCodes}
           onSave={handleSave}
           onClose={() => {
             setModalOpen(false);
             setEditing(null);
           }}
           isSaving={isSaving}
         />
       </Modal>
 
       {/* Deactivate Confirmation */}
       <ConfirmDialog
        isOpen={!!confirmDeactivate}
         title="Deactivate Employee"
         message={
           confirmDeactivate
             ? `Are you sure you want to deactivate ${confirmDeactivate.firstName} ${confirmDeactivate.lastName}? This action cannot be undone.`
             : ''
         }
         confirmLabel="Deactivate"
         variant="danger"
        onConfirm={() => { void handleDeactivate(); }}
         onCancel={() => setConfirmDeactivate(null)}
         isLoading={isDeactivating}
       />
     </div>
   );
 }

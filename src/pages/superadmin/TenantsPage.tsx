 /**
  * TenantsPage
  *
  * Full tenant management for superadmin:
  *  - Paginated DataTable with search by name/code
  *  - Status filter dropdown (all / active / suspended / deactivated)
  *  - Onboard new tenant: 2-step form (company details + admin user)
  *  - Update tenant: pre-populated form
  *  - Lifecycle actions with confirmation dialogs:
  *      Activate (from deactivated/new), Suspend (warning), Deactivate (danger)
  *  - Admin password reset form
  *  - Support warning form (severity + message)
  */
 
 import { useCallback, useEffect, useMemo, useState } from 'react';
 import {
   Building2,
   Plus,
   Search,
   RefreshCw,
   MoreHorizontal,
   AlertCircle,
   ChevronLeft,
   ChevronRight,
   ChevronDown,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { DropdownMenu } from '@/components/ui/DropdownMenu';
 import { useToast } from '@/components/ui/Toast';
 import { superadminTenantsApi } from '@/lib/superadminApi';
 import type {
   Tenant,
   TenantOnboardRequest,
   TenantUpdateRequest,
   SupportWarningRequest,
   AdminPasswordResetRequest,
 } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'NEW';
 
 function getStatus(tenant: Tenant): TenantStatus {
   if (tenant.status) return tenant.status;
   if (!tenant.isActive) return 'SUSPENDED';
   return 'ACTIVE';
 }
 
 function formatDate(iso: string): string {
   return new Date(iso).toLocaleDateString('en-IN', {
     day: 'numeric',
     month: 'short',
     year: 'numeric',
   });
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Status Badge
 // ─────────────────────────────────────────────────────────────────────────────
 
 function StatusBadge({ status }: { status: TenantStatus }) {
   const map: Record<TenantStatus, { label: string; className: string }> = {
     ACTIVE: {
       label: 'Active',
       className: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
     },
     SUSPENDED: {
       label: 'Suspended',
       className: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
     },
     DEACTIVATED: {
       label: 'Deactivated',
       className: 'text-[var(--color-error)] bg-[var(--color-error-bg)]',
     },
     NEW: {
       label: 'New',
       className: 'text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)]',
     },
   };
   const config = map[status];
   return (
     <span
       className={clsx(
         'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
         config.className,
       )}
     >
       {config.label}
     </span>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Step 1: Company Details Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface CompanyDetailsFormData {
   name: string;
   code: string;
   address: string;
   phone: string;
   email: string;
   gstNumber: string;
   timezone: string;
   defaultGstRate: string;
 }
 
 const emptyCompanyForm: CompanyDetailsFormData = {
   name: '',
   code: '',
   address: '',
   phone: '',
   email: '',
   gstNumber: '',
   timezone: 'Asia/Kolkata',
   defaultGstRate: '18',
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Step 2: Admin User Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface AdminUserFormData {
   adminEmail: string;
   adminDisplayName: string;
   adminPassword: string;
 }
 
 const emptyAdminForm: AdminUserFormData = {
   adminEmail: '',
   adminDisplayName: '',
   adminPassword: '',
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Onboard Tenant Modal (multi-step)
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface OnboardModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: (tenant: Tenant) => void;
 }
 
 function OnboardTenantModal({ isOpen, onClose, onSuccess }: OnboardModalProps) {
   const { toast } = useToast();
   const [step, setStep] = useState<1 | 2>(1);
   const [companyData, setCompanyData] = useState<CompanyDetailsFormData>(emptyCompanyForm);
   const [adminData, setAdminData] = useState<AdminUserFormData>(emptyAdminForm);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [errors, setErrors] = useState<Record<string, string>>({});
 
   const resetForm = () => {
     setStep(1);
     setCompanyData(emptyCompanyForm);
     setAdminData(emptyAdminForm);
     setErrors({});
   };
 
   const handleClose = () => {
     resetForm();
     onClose();
   };
 
   const validateStep1 = () => {
     const errs: Record<string, string> = {};
     if (!companyData.name.trim()) errs.name = 'Company name is required';
     if (!companyData.code.trim()) errs.code = 'Company code is required';
     if (companyData.code && !/^[A-Z0-9_]{2,12}$/.test(companyData.code))
       errs.code = 'Code must be 2–12 uppercase letters/numbers/underscores';
     if (companyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email))
       errs.email = 'Enter a valid email address';
     return errs;
   };
 
   const validateStep2 = () => {
     const errs: Record<string, string> = {};
     if (!adminData.adminEmail.trim()) errs.adminEmail = 'Admin email is required';
     if (adminData.adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.adminEmail))
       errs.adminEmail = 'Enter a valid email address';
     if (!adminData.adminDisplayName.trim()) errs.adminDisplayName = 'Display name is required';
     if (!adminData.adminPassword.trim()) errs.adminPassword = 'Temporary password is required';
     if (adminData.adminPassword && adminData.adminPassword.length < 8)
       errs.adminPassword = 'Password must be at least 8 characters';
     return errs;
   };
 
   const handleNext = () => {
     const errs = validateStep1();
     setErrors(errs);
     if (Object.keys(errs).length === 0) setStep(2);
   };
 
   const handleSubmit = async () => {
     const errs = validateStep2();
     setErrors(errs);
     if (Object.keys(errs).length > 0) return;
 
     setIsSubmitting(true);
     try {
       const payload: TenantOnboardRequest = {
         name: companyData.name,
         code: companyData.code.toUpperCase(),
         address: companyData.address || undefined,
         phone: companyData.phone || undefined,
         email: companyData.email || undefined,
         gstNumber: companyData.gstNumber || undefined,
         timezone: companyData.timezone || 'Asia/Kolkata',
         defaultGstRate: companyData.defaultGstRate
           ? parseFloat(companyData.defaultGstRate)
           : undefined,
         adminEmail: adminData.adminEmail,
         adminDisplayName: adminData.adminDisplayName,
         adminPassword: adminData.adminPassword,
       };
       const tenant = await superadminTenantsApi.onboardTenant(payload);
       toast({
         title: 'Tenant onboarded',
         description: `Tenant ID: ${tenant.id} — Admin: ${adminData.adminEmail}`,
         type: 'success',
       });
       handleClose();
       onSuccess(tenant);
     } catch (err) {
       toast({
         title: 'Onboarding failed',
         description: err instanceof Error ? err.message : 'Please try again',
         type: 'error',
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <Modal
       isOpen={isOpen}
       onClose={handleClose}
       title={step === 1 ? 'Onboard Tenant — Company Details' : 'Onboard Tenant — Admin User'}
       description={`Step ${step} of 2`}
       size="lg"
       footer={
         <>
           {step === 1 ? (
             <Button variant="secondary" size="sm" onClick={handleClose}>
               Cancel
             </Button>
           ) : (
             <Button
               variant="secondary"
               size="sm"
               onClick={() => { setStep(1); setErrors({}); }}
               leftIcon={<ChevronLeft size={14} />}
             >
               Back
             </Button>
           )}
           {step === 1 ? (
             <Button
               variant="primary"
               size="sm"
               onClick={handleNext}
               rightIcon={<ChevronRight size={14} />}
             >
               Continue
             </Button>
           ) : (
             <Button
               variant="primary"
               size="sm"
               onClick={handleSubmit}
               isLoading={isSubmitting}
             >
               Onboard Tenant
             </Button>
           )}
         </>
       }
     >
       {step === 1 ? (
         <div className="space-y-4">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="sm:col-span-2">
               <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                 Company Name <span className="text-[var(--color-error)]">*</span>
               </label>
               <Input
                 value={companyData.name}
                 onChange={(e) => setCompanyData((p) => ({ ...p, name: e.target.value }))}
                 placeholder="Acme Industries Pvt. Ltd."
                 error={errors.name}
               />
             </div>
             <div>
               <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                 Company Code <span className="text-[var(--color-error)]">*</span>
               </label>
               <Input
                 value={companyData.code}
                 onChange={(e) =>
                   setCompanyData((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                 }
                 placeholder="ACME"
                 error={errors.code}
               />
               <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                 2–12 uppercase letters / numbers / underscores
               </p>
             </div>
             <div>
               <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                 GST Number
               </label>
               <Input
                 value={companyData.gstNumber}
                 onChange={(e) => setCompanyData((p) => ({ ...p, gstNumber: e.target.value }))}
                 placeholder="22AAAAA0000A1Z5"
               />
             </div>
             <div>
               <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                 Contact Email
               </label>
               <Input
                 type="email"
                 value={companyData.email}
                 onChange={(e) => setCompanyData((p) => ({ ...p, email: e.target.value }))}
                 placeholder="contact@company.com"
                 error={errors.email}
               />
             </div>
             <div>
               <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                 Phone
               </label>
               <Input
                 value={companyData.phone}
                 onChange={(e) => setCompanyData((p) => ({ ...p, phone: e.target.value }))}
                 placeholder="+91 98765 43210"
               />
             </div>
             <div className="sm:col-span-2">
               <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                 Address
               </label>
               <Input
                 value={companyData.address}
                 onChange={(e) => setCompanyData((p) => ({ ...p, address: e.target.value }))}
                 placeholder="123 Business Park, Mumbai"
               />
             </div>
           </div>
         </div>
       ) : (
         <div className="space-y-4">
           <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] text-[12px] text-[var(--color-text-secondary)]">
             Setting up initial admin user for <strong>{companyData.name}</strong>{' '}
             (<code className="font-mono">{companyData.code}</code>).
           </div>
           <div>
             <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
               Admin Email <span className="text-[var(--color-error)]">*</span>
             </label>
             <Input
               type="email"
               value={adminData.adminEmail}
               onChange={(e) => setAdminData((p) => ({ ...p, adminEmail: e.target.value }))}
               placeholder="admin@company.com"
               error={errors.adminEmail}
             />
           </div>
           <div>
             <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
               Display Name <span className="text-[var(--color-error)]">*</span>
             </label>
             <Input
               value={adminData.adminDisplayName}
               onChange={(e) => setAdminData((p) => ({ ...p, adminDisplayName: e.target.value }))}
               placeholder="Ravi Kumar"
               error={errors.adminDisplayName}
             />
           </div>
           <div>
             <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
               Temporary Password <span className="text-[var(--color-error)]">*</span>
             </label>
             <Input
               type="password"
               value={adminData.adminPassword}
               onChange={(e) => setAdminData((p) => ({ ...p, adminPassword: e.target.value }))}
               placeholder="Minimum 8 characters"
               error={errors.adminPassword}
             />
             <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
               Admin will be prompted to change this on first login.
             </p>
           </div>
         </div>
       )}
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Edit Tenant Modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface EditTenantModalProps {
   tenant: Tenant | null;
   onClose: () => void;
   onSuccess: () => void;
 }
 
 function EditTenantModal({ tenant, onClose, onSuccess }: EditTenantModalProps) {
   const { toast } = useToast();
   const [form, setForm] = useState<TenantUpdateRequest>({});
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   useEffect(() => {
     if (tenant) {
       setForm({
         name: tenant.name,
         address: tenant.address ?? '',
         phone: tenant.phone ?? '',
         email: tenant.email ?? '',
         gstNumber: tenant.gstNumber ?? '',
         timezone: tenant.timezone ?? 'Asia/Kolkata',
         defaultGstRate: tenant.defaultGstRate,
       });
     }
   }, [tenant]);
 
   const handleSubmit = async () => {
     if (!tenant) return;
     if (!form.name?.trim()) {
       toast({ title: 'Company name is required', type: 'error' });
       return;
     }
     setIsSubmitting(true);
     try {
       await superadminTenantsApi.updateTenant(tenant.id, form);
       toast({ title: 'Tenant updated', type: 'success' });
       onClose();
       onSuccess();
     } catch (err) {
       toast({
         title: 'Update failed',
         description: err instanceof Error ? err.message : 'Please try again',
         type: 'error',
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <Modal
       isOpen={!!tenant}
       onClose={onClose}
       title="Edit Tenant"
       description={tenant ? `${tenant.code} · ID ${tenant.id}` : undefined}
       size="lg"
       footer={
         <>
           <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
           <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
             Save Changes
           </Button>
         </>
       }
     >
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div className="sm:col-span-2">
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             Company Name <span className="text-[var(--color-error)]">*</span>
           </label>
           <Input
             value={form.name ?? ''}
             onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
             placeholder="Company name"
           />
         </div>
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             Contact Email
           </label>
           <Input
             type="email"
             value={form.email ?? ''}
             onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
             placeholder="contact@company.com"
           />
         </div>
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             Phone
           </label>
           <Input
             value={form.phone ?? ''}
             onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
             placeholder="+91 98765 43210"
           />
         </div>
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             GST Number
           </label>
           <Input
             value={form.gstNumber ?? ''}
             onChange={(e) => setForm((p) => ({ ...p, gstNumber: e.target.value }))}
             placeholder="22AAAAA0000A1Z5"
           />
         </div>
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             Timezone
           </label>
           <Input
             value={form.timezone ?? 'Asia/Kolkata'}
             onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
             placeholder="Asia/Kolkata"
           />
         </div>
         <div className="sm:col-span-2">
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             Address
           </label>
           <Input
             value={form.address ?? ''}
             onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
             placeholder="123 Business Park"
           />
         </div>
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Admin Password Reset Modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface AdminPasswordResetModalProps {
   tenant: Tenant | null;
   onClose: () => void;
 }
 
 function AdminPasswordResetModal({ tenant, onClose }: AdminPasswordResetModalProps) {
   const { toast } = useToast();
   const [form, setForm] = useState<AdminPasswordResetRequest>({ adminEmail: '', newPassword: '' });
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   useEffect(() => {
     if (tenant) {
       setForm({ adminEmail: tenant.email ?? '', newPassword: '' });
     }
   }, [tenant]);
 
   const handleSubmit = async () => {
     if (!tenant) return;
     if (!form.adminEmail?.trim()) {
       toast({ title: 'Admin email is required', type: 'error' });
       return;
     }
     setIsSubmitting(true);
     try {
       await superadminTenantsApi.resetAdminPassword(tenant.id, form);
       toast({
         title: 'Password reset',
         description: `Admin at ${form.adminEmail} will receive login instructions.`,
         type: 'success',
       });
       onClose();
     } catch (err) {
       toast({
         title: 'Reset failed',
         description: err instanceof Error ? err.message : 'Please try again',
         type: 'error',
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <Modal
       isOpen={!!tenant}
       onClose={onClose}
       title="Reset Admin Password"
       description={tenant ? `Tenant: ${tenant.name}` : undefined}
       size="md"
       footer={
         <>
           <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
           <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
             Reset Password
           </Button>
         </>
       }
     >
       <div className="space-y-4">
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             Admin Email <span className="text-[var(--color-error)]">*</span>
           </label>
           <Input
             type="email"
             value={form.adminEmail}
             onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
             placeholder="admin@tenant.com"
           />
         </div>
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             New Temporary Password
           </label>
           <Input
             type="password"
             value={form.newPassword ?? ''}
             onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
             placeholder="Leave blank to auto-generate"
           />
           <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
             Admin will be required to change this on next login.
           </p>
         </div>
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Support Warning Modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface SupportWarningModalProps {
   tenant: Tenant | null;
   onClose: () => void;
 }
 
 function SupportWarningModal({ tenant, onClose }: SupportWarningModalProps) {
   const { toast } = useToast();
   const [form, setForm] = useState<SupportWarningRequest>({ severity: 'INFO', message: '' });
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const handleSubmit = async () => {
     if (!tenant) return;
     if (!form.message.trim()) {
       toast({ title: 'Message is required', type: 'error' });
       return;
     }
     setIsSubmitting(true);
     try {
       await superadminTenantsApi.sendSupportWarning(tenant.id, form);
       toast({
         title: 'Warning sent',
         description: `Support warning delivered to ${tenant.name}.`,
         type: 'success',
       });
       setForm({ severity: 'INFO', message: '' });
       onClose();
     } catch (err) {
       toast({
         title: 'Failed to send warning',
         description: err instanceof Error ? err.message : 'Please try again',
         type: 'error',
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <Modal
       isOpen={!!tenant}
       onClose={onClose}
       title="Send Support Warning"
       description={tenant ? `To: ${tenant.name}` : undefined}
       size="md"
       footer={
         <>
           <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
           <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
             Send Warning
           </Button>
         </>
       }
     >
       <div className="space-y-4">
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             Severity
           </label>
           <Select
             value={form.severity}
             onChange={(e) =>
               setForm((p) => ({
                 ...p,
                 severity: e.target.value as SupportWarningRequest['severity'],
               }))
             }
             options={[
               { value: 'INFO', label: 'Info' },
               { value: 'WARNING', label: 'Warning' },
               { value: 'CRITICAL', label: 'Critical' },
             ]}
           />
         </div>
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
             Message <span className="text-[var(--color-error)]">*</span>
           </label>
           <textarea
             value={form.message}
             onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
             placeholder="Describe the issue or warning for this tenant…"
             rows={4}
             className={clsx(
               'w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]',
               'px-3 py-2.5 text-[13px] text-[var(--color-text-primary)] outline-none resize-none',
               'placeholder:text-[var(--color-text-placeholder)]',
               'focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
               'transition-colors duration-150',
             )}
           />
         </div>
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main TenantsPage
 // ─────────────────────────────────────────────────────────────────────────────
 
 const PAGE_SIZE = 20;
 
 export function TenantsPage() {
   // List state
   const [tenants, setTenants] = useState<Tenant[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [search, setSearch] = useState('');
   const [statusFilter, setStatusFilter] = useState('');
   const [page, setPage] = useState(0);
 
   // Modal states
   const [onboardOpen, setOnboardOpen] = useState(false);
   const [editTenant, setEditTenant] = useState<Tenant | null>(null);
   const [resetPasswordTenant, setResetPasswordTenant] = useState<Tenant | null>(null);
   const [warningTenant, setWarningTenant] = useState<Tenant | null>(null);
 
   // Lifecycle confirm states
   const [activateTarget, setActivateTarget] = useState<Tenant | null>(null);
   const [suspendTarget, setSuspendTarget] = useState<Tenant | null>(null);
   const [deactivateTarget, setDeactivateTarget] = useState<Tenant | null>(null);
   const [lifecycleLoading, setLifecycleLoading] = useState(false);
 
   const { toast } = useToast();
 
   const loadTenants = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await superadminTenantsApi.listTenants({
         search: search || undefined,
         status: statusFilter || undefined,
         page,
         size: PAGE_SIZE,
       });
       setTenants(Array.isArray(data) ? data : []);
     } catch {
       setError("Couldn't load tenants. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, [search, statusFilter, page]);
 
   useEffect(() => {
     void loadTenants();
   }, [loadTenants]);
 
   // Local filter (client-side fallback) — used when server filtering isn't available
   const filteredTenants = useMemo(() => {
     let list = tenants;
     if (search.trim()) {
       const q = search.toLowerCase();
       list = list.filter(
         (t) =>
           t.name.toLowerCase().includes(q) ||
           t.code.toLowerCase().includes(q),
       );
     }
     if (statusFilter) {
       list = list.filter((t) => getStatus(t) === statusFilter);
     }
     return list;
   }, [tenants, search, statusFilter]);
 
   // ── Lifecycle Actions ──
 
   const handleActivate = async () => {
     if (!activateTarget) return;
     setLifecycleLoading(true);
     try {
       await superadminTenantsApi.activateTenant(activateTarget.id);
       toast({ title: 'Tenant activated', type: 'success' });
       setActivateTarget(null);
       await loadTenants();
     } catch (err) {
       toast({
         title: 'Activation failed',
         description: err instanceof Error ? err.message : 'Please try again',
         type: 'error',
       });
     } finally {
       setLifecycleLoading(false);
     }
   };
 
   const handleSuspend = async () => {
     if (!suspendTarget) return;
     setLifecycleLoading(true);
     try {
       await superadminTenantsApi.suspendTenant(suspendTarget.id);
       toast({ title: 'Tenant suspended', type: 'success' });
       setSuspendTarget(null);
       await loadTenants();
     } catch (err) {
       toast({
         title: 'Suspend failed',
         description: err instanceof Error ? err.message : 'Please try again',
         type: 'error',
       });
     } finally {
       setLifecycleLoading(false);
     }
   };
 
   const handleDeactivate = async () => {
     if (!deactivateTarget) return;
     setLifecycleLoading(true);
     try {
       await superadminTenantsApi.deactivateTenant(deactivateTarget.id);
       toast({ title: 'Tenant deactivated', type: 'success' });
       setDeactivateTarget(null);
       await loadTenants();
     } catch (err) {
       toast({
         title: 'Deactivation failed',
         description: err instanceof Error ? err.message : 'Please try again',
         type: 'error',
       });
     } finally {
       setLifecycleLoading(false);
     }
   };
 
   // ── Row Actions ──
 
   function getTenantActions(tenant: Tenant) {
     const status = getStatus(tenant);
    const items: Array<{ label: string; value: string; destructive?: boolean }> = [];
 
    items.push({ label: 'Edit details', value: 'edit' });
 
     if (status === 'DEACTIVATED' || status === 'NEW') {
      items.push({ label: 'Activate', value: 'activate' });
     }
 
     if (status === 'ACTIVE') {
      items.push({ label: 'Suspend', value: 'suspend' });
     }
 
     if (status === 'SUSPENDED') {
      items.push({ label: 'Activate', value: 'activate' });
      items.push({ label: 'Deactivate', value: 'deactivate', destructive: true });
     }
 
    items.push({ label: 'Reset admin password', value: 'reset-password' });
    items.push({ label: 'Send support warning', value: 'send-warning' });
 
    return items;
  }
 
  function handleTenantAction(value: string, tenant: Tenant) {
    if (value === 'edit') setEditTenant(tenant);
    else if (value === 'activate') setActivateTarget(tenant);
    else if (value === 'suspend') setSuspendTarget(tenant);
    else if (value === 'deactivate') setDeactivateTarget(tenant);
    else if (value === 'reset-password') setResetPasswordTenant(tenant);
    else if (value === 'send-warning') setWarningTenant(tenant);
   }
 
   // ── Render ──
 
   return (
     <div className="space-y-6">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Tenants</h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             {isLoading ? 'Loading…' : `${tenants.length} registered tenant${tenants.length !== 1 ? 's' : ''}`}
           </p>
         </div>
         <div className="flex items-center gap-2 shrink-0">
           <Button
             variant="secondary"
             size="sm"
             onClick={() => void loadTenants()}
             leftIcon={<RefreshCw size={13} />}
           >
             <span className="hidden sm:inline">Refresh</span>
           </Button>
           <Button
             variant="primary"
             size="sm"
             onClick={() => setOnboardOpen(true)}
             leftIcon={<Plus size={13} />}
           >
             Onboard Tenant
           </Button>
         </div>
       </div>
 
       {/* ── Filters ─────────────────────────────────────────────────── */}
       <div className="flex flex-col sm:flex-row gap-2">
         <div className="relative flex-1 max-w-sm">
           <Search
             size={14}
             className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
           />
           <input
             type="text"
             value={search}
             onChange={(e) => { setSearch(e.target.value); setPage(0); }}
             placeholder="Search by name or code…"
             className={clsx(
               'w-full pl-9 pr-3 h-9 rounded-lg border border-[var(--color-border-default)]',
               'bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)]',
               'placeholder:text-[var(--color-text-placeholder)] outline-none',
               'focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
               'transition-colors duration-150',
             )}
           />
         </div>
         <Select
           value={statusFilter}
           onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
           options={[
             { value: '', label: 'All statuses' },
             { value: 'ACTIVE', label: 'Active' },
             { value: 'SUSPENDED', label: 'Suspended' },
             { value: 'DEACTIVATED', label: 'Deactivated' },
             { value: 'NEW', label: 'New' },
           ]}
         />
       </div>
 
       {/* ── Error ───────────────────────────────────────────────────── */}
       {error && (
         <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={14} className="shrink-0" />
           <span className="flex-1">{error}</span>
           <button
             type="button"
             onClick={() => void loadTenants()}
             className="text-[12px] font-medium underline underline-offset-2 hover:no-underline shrink-0"
           >
             Retry
           </button>
         </div>
       )}
 
       {/* ── Loading ─────────────────────────────────────────────────── */}
       {isLoading && (
         <div className="space-y-2">
           {Array.from({ length: 5 }).map((_, i) => (
             <div
               key={i}
               className="h-14 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse"
             />
           ))}
         </div>
       )}
 
       {/* ── Empty ───────────────────────────────────────────────────── */}
       {!isLoading && filteredTenants.length === 0 && !error && (
         <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
           <Building2 size={32} className="text-[var(--color-text-tertiary)] mb-3 opacity-40" />
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
             {search || statusFilter ? 'No tenants match your filters' : 'No tenants registered'}
           </p>
           <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
             {search || statusFilter
               ? 'Try adjusting your search or filter.'
               : 'Onboard your first tenant to get started.'}
           </p>
           {!search && !statusFilter && (
             <Button
               variant="primary"
               size="sm"
               className="mt-4"
               onClick={() => setOnboardOpen(true)}
               leftIcon={<Plus size={13} />}
             >
               Onboard Tenant
             </Button>
           )}
         </div>
       )}
 
       {/* ── Desktop Table ───────────────────────────────────────────── */}
       {!isLoading && filteredTenants.length > 0 && (
         <>
           <div className="hidden sm:block overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
             <table className="min-w-full divide-y divide-[var(--color-border-subtle)]">
               <thead>
                 <tr className="bg-[var(--color-surface-secondary)]">
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                     Tenant
                   </th>
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                     Code
                   </th>
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                     Contact
                   </th>
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                     Status
                   </th>
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                     Registered
                   </th>
                   <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                     Actions
                   </th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--color-border-subtle)]">
                 {filteredTenants.map((tenant) => {
                   const status = getStatus(tenant);
                   const actions = getTenantActions(tenant);
                   return (
                     <tr
                       key={tenant.id}
                       className="hover:bg-[var(--color-surface-secondary)] transition-colors"
                     >
                       {/* Tenant name + ID */}
                       <td className="px-4 py-3">
                         <div className="flex items-center gap-2.5">
                           <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-tertiary)] text-[11px] font-bold text-[var(--color-text-tertiary)]">
                             {tenant.name.slice(0, 2).toUpperCase()}
                           </div>
                           <div className="min-w-0">
                             <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                               {tenant.name}
                             </p>
                             <p className="text-[11px] text-[var(--color-text-tertiary)]">
                               ID: {tenant.id}
                             </p>
                           </div>
                         </div>
                       </td>
                       {/* Code */}
                       <td className="px-4 py-3">
                         <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[11px] font-mono font-semibold text-[var(--color-text-secondary)]">
                           {tenant.code}
                         </span>
                       </td>
                       {/* Contact */}
                       <td className="px-4 py-3">
                         <p className="text-[12px] text-[var(--color-text-secondary)] truncate max-w-[160px]">
                           {tenant.email ?? '—'}
                         </p>
                       </td>
                       {/* Status */}
                       <td className="px-4 py-3">
                         <StatusBadge status={status} />
                       </td>
                       {/* Date */}
                       <td className="px-4 py-3">
                         <p className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                           {formatDate(tenant.createdAt)}
                         </p>
                       </td>
                       {/* Actions */}
                       <td className="px-4 py-3 text-right">
                         <DropdownMenu
                           trigger={
                             <button
                               type="button"
                               className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                             >
                               <MoreHorizontal size={14} />
                               <ChevronDown size={11} />
                             </button>
                           }
                          items={actions}
                          onSelect={(v) => handleTenantAction(v, tenant)}
                         />
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
 
           {/* ── Mobile Cards ──────────────────────────────────────────── */}
           <div className="sm:hidden space-y-2">
             {filteredTenants.map((tenant) => {
               const status = getStatus(tenant);
               const actions = getTenantActions(tenant);
               return (
                 <div
                   key={tenant.id}
                   className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]"
                 >
                   <div className="flex items-start justify-between gap-2">
                     <div className="flex items-center gap-2.5 min-w-0">
                       <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-tertiary)] text-[11px] font-bold text-[var(--color-text-tertiary)]">
                         {tenant.name.slice(0, 2).toUpperCase()}
                       </div>
                       <div className="min-w-0">
                         <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                           {tenant.name}
                         </p>
                         <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-[var(--color-text-tertiary)]">
                             {tenant.code}
                           </span>
                           <StatusBadge status={status} />
                         </div>
                       </div>
                     </div>
                     <DropdownMenu
                       trigger={
                         <button
                           type="button"
                           className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                         >
                           <MoreHorizontal size={14} />
                         </button>
                       }
                      items={actions}
                      onSelect={(v) => handleTenantAction(v, tenant)}
                     />
                   </div>
                   <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] grid grid-cols-2 gap-2">
                     <div>
                       <p className="text-[10px] text-[var(--color-text-tertiary)]">Contact</p>
                       <p className="text-[12px] text-[var(--color-text-secondary)] truncate">
                         {tenant.email ?? '—'}
                       </p>
                     </div>
                     <div>
                       <p className="text-[10px] text-[var(--color-text-tertiary)]">Registered</p>
                       <p className="text-[12px] text-[var(--color-text-secondary)] tabular-nums">
                         {formatDate(tenant.createdAt)}
                       </p>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
 
           {/* ── Pagination ────────────────────────────────────────────── */}
           <div className="flex items-center justify-between gap-4 pt-2">
             <p className="text-[12px] text-[var(--color-text-tertiary)]">
               Showing {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''}
             </p>
             <div className="flex items-center gap-1">
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={() => setPage((p) => Math.max(0, p - 1))}
                 disabled={page === 0}
                 leftIcon={<ChevronLeft size={13} />}
               >
                 Prev
               </Button>
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={() => setPage((p) => p + 1)}
                 disabled={filteredTenants.length < PAGE_SIZE}
                 rightIcon={<ChevronRight size={13} />}
               >
                 Next
               </Button>
             </div>
           </div>
         </>
       )}
 
       {/* ── Modals ──────────────────────────────────────────────────── */}
       <OnboardTenantModal
         isOpen={onboardOpen}
         onClose={() => setOnboardOpen(false)}
         onSuccess={() => void loadTenants()}
       />
 
       <EditTenantModal
         tenant={editTenant}
         onClose={() => setEditTenant(null)}
         onSuccess={() => void loadTenants()}
       />
 
       <AdminPasswordResetModal
         tenant={resetPasswordTenant}
         onClose={() => setResetPasswordTenant(null)}
       />
 
       <SupportWarningModal
         tenant={warningTenant}
         onClose={() => setWarningTenant(null)}
       />
 
       {/* ── Lifecycle Confirm Dialogs ─────────────────────────────── */}
       <ConfirmDialog
         isOpen={!!activateTarget}
         title="Activate Tenant"
         message={`Activate "${activateTarget?.name}"? This will restore full access for all tenant users.`}
         confirmLabel="Activate"
         variant="default"
         isLoading={lifecycleLoading}
         onConfirm={handleActivate}
         onCancel={() => setActivateTarget(null)}
       />
 
       <ConfirmDialog
         isOpen={!!suspendTarget}
         title="Suspend Tenant"
         message={`Suspend "${suspendTarget?.name}"? All tenant users will immediately lose access until the tenant is reactivated.`}
         confirmLabel="Suspend"
         variant="warning"
         isLoading={lifecycleLoading}
         onConfirm={handleSuspend}
         onCancel={() => setSuspendTarget(null)}
       />
 
       <ConfirmDialog
         isOpen={!!deactivateTarget}
         title="Deactivate Tenant"
         message={`Permanently deactivate "${deactivateTarget?.name}"? This will revoke all user access. Tenant data is retained but the account will be closed. This action is difficult to reverse.`}
         confirmLabel="Deactivate"
         variant="danger"
         isLoading={lifecycleLoading}
         onConfirm={handleDeactivate}
         onCancel={() => setDeactivateTarget(null)}
       />
     </div>
   );
 }

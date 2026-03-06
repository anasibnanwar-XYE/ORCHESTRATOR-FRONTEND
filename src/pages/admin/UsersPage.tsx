 /**
  * UsersPage — User Management for the Admin portal
  *
  * Features:
  *  - Paginated DataTable with search/filter (email, display name, role, status)
  *  - Create user form modal (email, displayName, roles multi-select, companies multi-select)
  *  - Update user form modal
  *  - View/detail modal (read-only) shown on row click or View action
  *  - Delete with ConfirmDialog danger variant
  *  - Suspend/unsuspend toggle with confirmation
  *  - Force-disable MFA action with confirmation
  */
 
 import { useEffect, useState, useCallback, useReducer } from 'react';
 import {
   Plus,
   MoreHorizontal,
   AlertCircle,
   RefreshCcw,
  Shield,
   Building2,
   Mail,
   User,
   CheckCircle,
   XCircle,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Modal } from '@/components/ui/Modal';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { Badge } from '@/components/ui/Badge';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { DropdownMenu } from '@/components/ui/DropdownMenu';
 import { useToast } from '@/components/ui/Toast';
 import { adminApi } from '@/lib/adminApi';
 import type { Role, Company, CreateUserRequest, UpdateUserRequest } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface AdminUser {
   id: number;
   publicId?: string;
   email: string;
   displayName: string;
   roles: string[];
   mfaEnabled: boolean;
   enabled: boolean;
   companies: string[];
   createdAt?: string;
   lastLogin?: string;
 }
 
 interface UserFormData {
   email: string;
   displayName: string;
   roles: string[];
   companyIds: number[];
 }
 
 const initialForm: UserFormData = {
   email: '',
   displayName: '',
   roles: [],
   companyIds: [],
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatRole(role: string): string {
   return role
     .replace(/^ROLE_/i, '')
     .replace(/_/g, ' ')
     .toLowerCase()
     .replace(/\b\w/g, (c) => c.toUpperCase());
 }
 
 function formatDate(iso?: string): string {
   if (!iso) return '—';
   try {
     return new Date(iso).toLocaleString('en-IN', {
       day: '2-digit',
       month: 'short',
       year: 'numeric',
       hour: '2-digit',
       minute: '2-digit',
     });
   } catch {
     return iso;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Multi-select for roles / companies
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface MultiSelectProps {
   label: string;
   options: { value: string; label: string }[];
   value: string[];
   onChange: (val: string[]) => void;
 }
 
 function MultiSelect({ label, options, value, onChange }: MultiSelectProps) {
   const toggle = (v: string) => {
     if (value.includes(v)) {
       onChange(value.filter((x) => x !== v));
     } else {
       onChange([...value, v]);
     }
   };
 
   return (
     <div className="space-y-1.5">
       <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
         {label}
       </label>
       <div className="border border-[var(--color-border-default)] rounded-lg overflow-hidden max-h-40 overflow-y-auto">
         {options.length === 0 ? (
           <p className="px-3 py-2 text-[12px] text-[var(--color-text-tertiary)]">No options available</p>
         ) : (
           options.map((opt) => (
             <label
               key={opt.value}
               className={clsx(
                 'flex items-center gap-2.5 px-3 py-2 cursor-pointer',
                 'hover:bg-[var(--color-surface-secondary)] transition-colors',
                 'border-b border-[var(--color-border-subtle)] last:border-b-0',
               )}
             >
               <input
                 type="checkbox"
                 checked={value.includes(opt.value)}
                 onChange={() => toggle(opt.value)}
                 className="h-3.5 w-3.5 accent-[var(--color-neutral-900)]"
               />
               <span className="text-[13px] text-[var(--color-text-primary)]">{opt.label}</span>
             </label>
           ))
         )}
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // User Detail Modal (read-only)
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface UserDetailModalProps {
   user: AdminUser | null;
   onClose: () => void;
   onEdit: (user: AdminUser) => void;
 }
 
 function UserDetailField({
   icon,
   label,
   value,
 }: {
   icon: React.ReactNode;
   label: string;
   value: React.ReactNode;
 }) {
   return (
     <div className="flex items-start gap-3">
       <div className="mt-0.5 h-7 w-7 flex items-center justify-center rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] shrink-0">
         {icon}
       </div>
       <div className="flex-1 min-w-0">
         <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-0.5">
           {label}
         </p>
         <div className="text-[13px] text-[var(--color-text-primary)]">{value}</div>
       </div>
     </div>
   );
 }
 
 function UserDetailModal({ user, onClose, onEdit }: UserDetailModalProps) {
   if (!user) return null;
 
   return (
     <Modal
       isOpen={user !== null}
       onClose={onClose}
       title="User Details"
       size="md"
       footer={
         <>
           <Button variant="secondary" size="sm" onClick={onClose}>
             Close
           </Button>
           <Button
             size="sm"
             onClick={() => {
               onClose();
               onEdit(user);
             }}
           >
             Edit User
           </Button>
         </>
       }
     >
       <div className="space-y-4">
         {/* Avatar / name row */}
         <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-subtle)]">
           <div className="h-10 w-10 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center text-[14px] font-semibold text-[var(--color-text-secondary)] shrink-0">
             {user.displayName.charAt(0).toUpperCase()}
           </div>
           <div className="flex-1 min-w-0">
             <p className="font-semibold text-[15px] text-[var(--color-text-primary)] truncate">
               {user.displayName}
             </p>
             <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{user.email}</p>
           </div>
           <Badge variant={user.enabled ? 'success' : 'danger'} dot>
             {user.enabled ? 'Active' : 'Suspended'}
           </Badge>
         </div>
 
         <UserDetailField
           icon={<Mail size={13} />}
           label="Email"
           value={<span className="break-all">{user.email}</span>}
         />
 
         <UserDetailField
           icon={<User size={13} />}
           label="Display Name"
           value={user.displayName}
         />
 
         <UserDetailField
           icon={<Shield size={13} />}
           label="Roles"
           value={
             user.roles.length === 0 ? (
               <span className="text-[var(--color-text-tertiary)]">No roles assigned</span>
             ) : (
               <div className="flex flex-wrap gap-1 mt-0.5">
                 {user.roles.map((r) => (
                   <span
                     key={r}
                     className="inline-block px-2 py-0.5 text-[11px] rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]"
                   >
                     {formatRole(r)}
                   </span>
                 ))}
               </div>
             )
           }
         />
 
         <UserDetailField
           icon={<Building2 size={13} />}
           label="Companies"
           value={
             user.companies.length === 0 ? (
               <span className="text-[var(--color-text-tertiary)]">No companies assigned</span>
             ) : (
               <div className="flex flex-wrap gap-1 mt-0.5">
                 {user.companies.map((c) => (
                   <span
                     key={c}
                     className="inline-block px-2 py-0.5 text-[11px] rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]"
                   >
                     {c}
                   </span>
                 ))}
               </div>
             )
           }
         />
 
         <UserDetailField
           icon={user.mfaEnabled ? <CheckCircle size={13} /> : <XCircle size={13} />}
           label="MFA Status"
           value={
             <span
               className={
                 user.mfaEnabled
                   ? 'text-[var(--color-success)]'
                   : 'text-[var(--color-text-tertiary)]'
               }
             >
               {user.mfaEnabled ? 'Enabled' : 'Not enabled'}
             </span>
           }
         />
 
         {(user.createdAt || user.lastLogin) && (
           <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border-subtle)]">
             {user.createdAt && (
               <div>
                 <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-0.5">
                   Created
                 </p>
                 <p className="text-[12px] text-[var(--color-text-secondary)]">
                   {formatDate(user.createdAt)}
                 </p>
               </div>
             )}
             {user.lastLogin && (
               <div>
                 <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-0.5">
                   Last Login
                 </p>
                 <p className="text-[12px] text-[var(--color-text-secondary)]">
                   {formatDate(user.lastLogin)}
                 </p>
               </div>
             )}
           </div>
         )}
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // User Form Modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface UserFormModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSubmit: (data: UserFormData) => Promise<void>;
   roles: Role[];
   companies: Company[];
   initialData?: UserFormData;
   title: string;
   submitLabel: string;
 }
 
 function UserFormModal({
   isOpen,
   onClose,
   onSubmit,
   roles,
   companies,
   initialData,
   title,
   submitLabel,
 }: UserFormModalProps) {
   const [form, setForm] = useState<UserFormData>(initialData ?? initialForm);
   const [errors, setErrors] = useState<Partial<UserFormData & { email: string; displayName: string }>>({});
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   // Reset form when modal opens/closes
   useEffect(() => {
     if (isOpen) {
       setForm(initialData ?? initialForm);
       setErrors({});
     }
   }, [isOpen, initialData]);
 
   const validate = (): boolean => {
     const newErrors: typeof errors = {};
     if (!form.email.trim()) newErrors.email = 'Email is required';
     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
       newErrors.email = 'Enter a valid email address';
     if (!form.displayName.trim()) newErrors.displayName = 'Display name is required';
     setErrors(newErrors);
     return Object.keys(newErrors).length === 0;
   };
 
   const handleSubmit = async () => {
     if (!validate()) return;
     setIsSubmitting(true);
     try {
       await onSubmit(form);
       onClose();
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const roleOptions = roles.map((r) => ({ value: r.key, label: r.name || formatRole(r.key) }));
   const companyOptions = companies.map((c) => ({
     value: String(c.id),
     label: c.name,
   }));
 
   return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       title={title}
       size="md"
       footer={
         <>
           <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
             Cancel
           </Button>
           <Button size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
             {submitLabel}
           </Button>
         </>
       }
     >
       <div className="space-y-4">
         <Input
           label="Email"
           type="email"
           value={form.email}
           onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
           error={errors.email}
           placeholder="user@example.com"
           autoComplete="off"
         />
         <Input
           label="Display Name"
           value={form.displayName}
           onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
           error={errors.displayName}
           placeholder="Jane Smith"
           autoComplete="off"
         />
         <MultiSelect
           label="Roles"
           options={roleOptions}
           value={form.roles}
           onChange={(newRoles) => setForm((f) => ({ ...f, roles: newRoles }))}
         />
         <MultiSelect
           label="Companies"
           options={companyOptions}
           value={form.companyIds.map(String)}
           onChange={(ids) => setForm((f) => ({ ...f, companyIds: ids.map(Number) }))}
         />
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Dialog state reducer
 // ─────────────────────────────────────────────────────────────────────────────
 
 type DialogType = 'delete' | 'suspend' | 'unsuspend' | 'disable-mfa' | null;
 
 interface DialogState {
   type: DialogType;
   user: AdminUser | null;
   isLoading: boolean;
 }
 
 type DialogAction =
   | { type: 'open'; dialogType: DialogType; user: AdminUser }
   | { type: 'close' }
   | { type: 'setLoading'; isLoading: boolean };
 
 function dialogReducer(state: DialogState, action: DialogAction): DialogState {
   switch (action.type) {
     case 'open':
       return { type: action.dialogType, user: action.user, isLoading: false };
     case 'close':
       return { type: null, user: null, isLoading: false };
     case 'setLoading':
       return { ...state, isLoading: action.isLoading };
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Row Actions Dropdown
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface RowActionsProps {
   user: AdminUser;
   onView: (user: AdminUser) => void;
   onEdit: (user: AdminUser) => void;
   onDelete: (user: AdminUser) => void;
   onSuspend: (user: AdminUser) => void;
   onDisableMfa: (user: AdminUser) => void;
 }
 
 function RowActions({ user, onView, onEdit, onDelete, onSuspend, onDisableMfa }: RowActionsProps) {
   const items: { label: string; value: string; destructive?: boolean }[] = [
     { label: 'View', value: 'view' },
     { label: 'Edit', value: 'edit' },
     { label: user.enabled ? 'Suspend' : 'Unsuspend', value: 'suspend' },
     ...(user.mfaEnabled ? [{ label: 'Disable MFA', value: 'disable-mfa' }] : []),
     { label: 'Delete', value: 'delete', destructive: true },
   ];
 
   const handleSelect = (value: string) => {
     if (value === 'view') onView(user);
     else if (value === 'edit') onEdit(user);
     else if (value === 'suspend') onSuspend(user);
     else if (value === 'disable-mfa') onDisableMfa(user);
     else if (value === 'delete') onDelete(user);
   };
 
   return (
     <DropdownMenu
       trigger={
         <button
           type="button"
           className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
         >
           <MoreHorizontal size={14} />
         </button>
       }
       items={items}
       onSelect={handleSelect}
     />
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function UsersPage() {
   const { success, error: toastError } = useToast();
 
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [roles, setRoles] = useState<Role[]>([]);
   const [companies, setCompanies] = useState<Company[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);
 
   // Modal state
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
   const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
 
   // Confirm dialog state
   const [dialog, dispatchDialog] = useReducer(dialogReducer, {
     type: null,
     user: null,
     isLoading: false,
   });
 
   // ─── Load data ────────────────────────────────────────────────────────────
 
   const loadData = useCallback(async () => {
     setIsLoading(true);
     setLoadError(null);
     try {
       const [usersData, rolesData, companiesData] = await Promise.all([
         adminApi.getUsers(),
         adminApi.getRoles(),
         adminApi.getCompanies(),
       ]);
       setUsers(usersData as unknown as AdminUser[]);
       setRoles(rolesData);
       setCompanies(companiesData);
     } catch {
       setLoadError('Unable to load users. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadData();
   }, [loadData]);
 
   // ─── Create User ──────────────────────────────────────────────────────────
 
   const handleCreateUser = async (data: UserFormData) => {
     const payload: CreateUserRequest = {
       email: data.email,
       displayName: data.displayName,
       roles: data.roles,
       companyIds: data.companyIds,
     };
     try {
       await adminApi.createUser(payload);
       success('User created', `${data.displayName} has been added.`);
       await loadData();
     } catch (err) {
       toastError('Failed to create user', err instanceof Error ? err.message : 'Please try again.');
       throw err;
     }
   };
 
   // ─── Update User ──────────────────────────────────────────────────────────
 
   const handleUpdateUser = async (data: UserFormData) => {
     if (!editingUser) return;
     const payload: UpdateUserRequest = {
       displayName: data.displayName,
       roles: data.roles,
       companyIds: data.companyIds,
     };
     try {
       await adminApi.updateUser(editingUser.id, payload);
       success('User updated', `${data.displayName} has been updated.`);
       await loadData();
     } catch (err) {
       toastError('Failed to update user', err instanceof Error ? err.message : 'Please try again.');
       throw err;
     }
   };
 
   // ─── Delete User ──────────────────────────────────────────────────────────
 
   const handleConfirmDelete = async () => {
     if (!dialog.user) return;
     dispatchDialog({ type: 'setLoading', isLoading: true });
     try {
       await adminApi.deleteUser(dialog.user.id);
       success('User deleted', `${dialog.user.displayName} has been removed.`);
       dispatchDialog({ type: 'close' });
       await loadData();
     } catch (err) {
       toastError('Failed to delete user', err instanceof Error ? err.message : 'Please try again.');
       dispatchDialog({ type: 'setLoading', isLoading: false });
     }
   };
 
   // ─── Suspend / Unsuspend ──────────────────────────────────────────────────
 
   const handleConfirmSuspend = async () => {
     if (!dialog.user) return;
     dispatchDialog({ type: 'setLoading', isLoading: true });
     try {
       if (dialog.user.enabled) {
         await adminApi.suspendUser(dialog.user.id);
         success('User suspended', `${dialog.user.displayName} has been suspended.`);
       } else {
         await adminApi.unsuspendUser(dialog.user.id);
         success('User unsuspended', `${dialog.user.displayName} is active again.`);
       }
       dispatchDialog({ type: 'close' });
       await loadData();
     } catch (err) {
       toastError('Action failed', err instanceof Error ? err.message : 'Please try again.');
       dispatchDialog({ type: 'setLoading', isLoading: false });
     }
   };
 
   // ─── Disable MFA ──────────────────────────────────────────────────────────
 
   const handleConfirmDisableMfa = async () => {
     if (!dialog.user) return;
     dispatchDialog({ type: 'setLoading', isLoading: true });
     try {
       await adminApi.disableUserMfa(dialog.user.id);
       success('MFA disabled', `MFA has been removed for ${dialog.user.displayName}.`);
       dispatchDialog({ type: 'close' });
       await loadData();
     } catch (err) {
       toastError('Failed to disable MFA', err instanceof Error ? err.message : 'Please try again.');
       dispatchDialog({ type: 'setLoading', isLoading: false });
     }
   };
 
   // ─── Table columns ────────────────────────────────────────────────────────
 
   const columns: Column<AdminUser>[] = [
     {
       id: 'user',
       header: 'User',
       accessor: (row) => (
         <div>
           <p className="font-medium text-[var(--color-text-primary)] leading-tight">
             {row.displayName}
           </p>
           <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{row.email}</p>
         </div>
       ),
       sortable: true,
       sortAccessor: (row) => row.displayName,
     },
     {
       id: 'email',
       header: 'Email',
       accessor: (row) => (
         <span className="text-[var(--color-text-secondary)]">{row.email}</span>
       ),
       hideOnMobile: true,
       sortable: true,
       sortAccessor: (row) => row.email,
     },
     {
       id: 'roles',
       header: 'Role',
       accessor: (row) => (
         <div className="flex flex-wrap gap-1">
           {row.roles.slice(0, 2).map((r) => (
             <span
               key={r}
               className="inline-block px-1.5 py-0.5 text-[11px] rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]"
             >
               {formatRole(r)}
             </span>
           ))}
           {row.roles.length > 2 && (
             <span className="inline-block px-1.5 py-0.5 text-[11px] rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]">
               +{row.roles.length - 2}
             </span>
           )}
         </div>
       ),
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={row.enabled ? 'success' : 'danger'} dot>
           {row.enabled ? 'Active' : 'Suspended'}
         </Badge>
       ),
       sortable: true,
       sortAccessor: (row) => (row.enabled ? 'Active' : 'Suspended'),
     },
   ];
 
   // ─── Edit form initial data ────────────────────────────────────────────────
 
   const editingForm: UserFormData | undefined = editingUser
     ? {
         email: editingUser.email,
         displayName: editingUser.displayName,
         roles: editingUser.roles,
         companyIds: companies
           .filter((c) => editingUser.companies.includes(c.code))
           .map((c) => c.id),
       }
     : undefined;
 
   // ─── Dialog config ────────────────────────────────────────────────────────
 
   const dialogConfig = {
     delete: {
       title: 'Delete user',
       message: `Are you sure you want to permanently delete ${dialog.user?.displayName ?? 'this user'}? This cannot be undone.`,
       confirmLabel: 'Delete',
       variant: 'danger' as const,
       onConfirm: handleConfirmDelete,
     },
     suspend: {
       title: 'Suspend user',
       message: `Suspend ${dialog.user?.displayName ?? 'this user'}? They will no longer be able to log in.`,
       confirmLabel: 'Suspend',
       variant: 'warning' as const,
       onConfirm: handleConfirmSuspend,
     },
     unsuspend: {
       title: 'Unsuspend user',
       message: `Restore access for ${dialog.user?.displayName ?? 'this user'}?`,
       confirmLabel: 'Unsuspend',
       variant: 'default' as const,
       onConfirm: handleConfirmSuspend,
     },
     'disable-mfa': {
       title: 'Disable MFA',
       message: `Remove multi-factor authentication for ${dialog.user?.displayName ?? 'this user'}? This reduces account security.`,
       confirmLabel: 'Disable MFA',
       variant: 'warning' as const,
       onConfirm: handleConfirmDisableMfa,
     },
   } as const;
 
   const activeDialog = dialog.type ? dialogConfig[dialog.type] : null;
 
   return (
     <div className="space-y-4">
       {/* ── Page Header ─────────────────────────────────────────────── */}
       <div className="flex items-center justify-between gap-4">
         <div>
           <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
             User Management
           </h1>
           <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
             Manage system users, roles, and access control
           </p>
         </div>
         <Button size="sm" leftIcon={<Plus />} onClick={() => setShowCreateModal(true)}>
           Add User
         </Button>
       </div>
 
       {/* ── Error State ─────────────────────────────────────────────── */}
       {loadError && (
         <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={15} className="shrink-0" />
           <span className="flex-1">{loadError}</span>
           <button
             type="button"
             onClick={loadData}
             className="flex items-center gap-1.5 text-[12px] font-medium underline underline-offset-2 hover:no-underline"
           >
             <RefreshCcw size={12} />
             Retry
           </button>
         </div>
       )}
 
       {/* ── Users Table ─────────────────────────────────────────────── */}
       <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
         <DataTable<AdminUser>
           columns={columns}
           data={users}
           keyExtractor={(u) => u.id}
           searchable
           searchPlaceholder="Search by name or email..."
           searchFilter={(row, q) =>
             row.displayName.toLowerCase().includes(q) ||
             row.email.toLowerCase().includes(q) ||
             row.roles.some((r) => formatRole(r).toLowerCase().includes(q)) ||
             (row.enabled ? 'active' : 'suspended').includes(q)
           }
           isLoading={isLoading}
           emptyMessage="No users yet. Create the first user to get started."
           onRowClick={(row) => setViewingUser(row)}
           rowActions={(row) => (
             <RowActions
               user={row}
               onView={(u) => setViewingUser(u)}
               onEdit={(u) => setEditingUser(u)}
               onDelete={(u) => dispatchDialog({ type: 'open', dialogType: 'delete', user: u })}
               onSuspend={(u) =>
                 dispatchDialog({
                   type: 'open',
                   dialogType: u.enabled ? 'suspend' : 'unsuspend',
                   user: u,
                 })
               }
               onDisableMfa={(u) =>
                 dispatchDialog({ type: 'open', dialogType: 'disable-mfa', user: u })
               }
             />
           )}
         />
       </div>
 
       {/* ── User Detail Modal ────────────────────────────────────────── */}
       <UserDetailModal
         user={viewingUser}
         onClose={() => setViewingUser(null)}
         onEdit={(u) => setEditingUser(u)}
       />
 
       {/* ── Create User Modal ────────────────────────────────────────── */}
       <UserFormModal
         isOpen={showCreateModal}
         onClose={() => setShowCreateModal(false)}
         onSubmit={handleCreateUser}
         roles={roles}
         companies={companies}
         title="Create User"
         submitLabel="Create User"
       />
 
       {/* ── Edit User Modal ──────────────────────────────────────────── */}
       <UserFormModal
         isOpen={editingUser !== null}
         onClose={() => setEditingUser(null)}
         onSubmit={handleUpdateUser}
         roles={roles}
         companies={companies}
         initialData={editingForm}
         title="Edit User"
         submitLabel="Save Changes"
       />
 
       {/* ── Confirm Dialogs ──────────────────────────────────────────── */}
       {activeDialog && (
         <ConfirmDialog
           isOpen
           title={activeDialog.title}
           message={activeDialog.message}
           confirmLabel={activeDialog.confirmLabel}
           variant={activeDialog.variant}
           isLoading={dialog.isLoading}
           onConfirm={activeDialog.onConfirm}
           onCancel={() => dispatchDialog({ type: 'close' })}
         />
       )}
     </div>
   );
 }

 /**
  * RolesPage — Role Management for the Admin portal
  *
  * Features:
  *  - DataTable listing roles with key, name, permissions count, system badge
  *  - Create role form with name, key, description, permissions checklist (tags)
  *  - Role detail drawer showing full permissions list
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   Plus,
   AlertCircle,
   RefreshCcw,
   Lock,
   ChevronRight,
   X,
   Check,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Modal } from '@/components/ui/Modal';
 import { Badge } from '@/components/ui/Badge';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { adminApi } from '@/lib/adminApi';
 import type { Role, CreateRoleRequest } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 const COMMON_PERMISSIONS = [
   'USERS_READ', 'USERS_WRITE',
   'COMPANIES_READ', 'COMPANIES_WRITE',
   'ROLES_READ', 'ROLES_WRITE',
   'SETTINGS_READ', 'SETTINGS_WRITE',
   'ACCOUNTING_READ', 'ACCOUNTING_WRITE',
   'APPROVALS_READ', 'APPROVALS_WRITE',
   'REPORTS_READ',
 ];
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Permission Checklist component
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface PermissionsChecklistProps {
   selected: string[];
   onChange: (selected: string[]) => void;
   customInput: string;
   onCustomInputChange: (val: string) => void;
   onAddCustom: () => void;
 }
 
 function PermissionsChecklist({
   selected,
   onChange,
   customInput,
   onCustomInputChange,
   onAddCustom,
 }: PermissionsChecklistProps) {
   const toggle = (perm: string) => {
     if (selected.includes(perm)) {
       onChange(selected.filter((p) => p !== perm));
     } else {
       onChange([...selected, perm]);
     }
   };
 
   const allPerms = [...new Set([...COMMON_PERMISSIONS, ...selected])];
 
   return (
     <div className="space-y-2">
       <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
         Permissions
       </label>
       <div className="border border-[var(--color-border-default)] rounded-lg overflow-hidden">
         <div className="max-h-44 overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
           {allPerms.map((perm) => {
             const isChecked = selected.includes(perm);
             return (
               <button
                 key={perm}
                 type="button"
                 onClick={() => toggle(perm)}
                 className={clsx(
                   'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                   'hover:bg-[var(--color-surface-secondary)]',
                 )}
               >
                 <span
                   className={clsx(
                     'h-4 w-4 rounded flex items-center justify-center shrink-0 transition-colors border',
                     isChecked
                       ? 'bg-[var(--color-neutral-900)] border-[var(--color-neutral-900)]'
                       : 'border-[var(--color-border-default)]',
                   )}
                 >
                   {isChecked && <Check size={10} className="text-white" />}
                 </span>
                 <span className="text-[12px] font-mono text-[var(--color-text-primary)]">
                   {perm}
                 </span>
               </button>
             );
           })}
         </div>
       </div>
       {/* Custom permission input */}
       <div className="flex gap-2">
         <input
           type="text"
           value={customInput}
           onChange={(e) => onCustomInputChange(e.target.value.toUpperCase())}
           onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddCustom(); } }}
           placeholder="Custom permission (e.g. REPORTS_EXPORT)"
           className={clsx(
             'flex-1 h-9 rounded-lg border border-[var(--color-border-default)] px-3',
             'text-[12px] font-mono text-[var(--color-text-primary)]',
             'bg-[var(--color-surface-primary)] placeholder:text-[var(--color-text-tertiary)]',
             'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
           )}
         />
         <Button size="sm" variant="secondary" type="button" onClick={onAddCustom} className="h-9">
           Add
         </Button>
       </div>
       <p className="text-[11px] text-[var(--color-text-tertiary)]">
         {selected.length} permission{selected.length !== 1 ? 's' : ''} selected
       </p>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Role Detail Drawer (side panel)
 // ─────────────────────────────────────────────────────────────────────────────
 
 function RoleDetailPanel({ role, onClose }: { role: Role; onClose: () => void }) {
   return (
     <div className="fixed inset-0 z-50 flex justify-end">
       <div
         className="absolute inset-0 bg-[var(--color-overlay)]"
         onClick={onClose}
       />
       <div
         className={clsx(
           'relative w-full max-w-md bg-[var(--color-surface-primary)]',
           'border-l border-[var(--color-border-default)] flex flex-col',
         )}
         style={{ animation: 'slideInRight 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
       >
         {/* Header */}
         <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-default)]">
           <div>
             <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
               {role.name}
             </h2>
             <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5 font-mono">{role.key}</p>
           </div>
           <div className="flex items-center gap-2">
             {role.isSystem && (
               <Badge variant="default">
                 <Lock size={10} className="mr-1" />
                 System
               </Badge>
             )}
             <button
               onClick={onClose}
               className="h-7 w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors"
               aria-label="Close"
             >
               <X size={15} />
             </button>
           </div>
         </div>
 
         {/* Content */}
         <div className="flex-1 overflow-y-auto p-5 space-y-5">
           {role.description && (
             <div>
               <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
                 Description
               </p>
               <p className="text-[13px] text-[var(--color-text-secondary)]">{role.description}</p>
             </div>
           )}
 
           <div>
             <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
               Permissions ({role.permissions.length})
             </p>
             {role.permissions.length === 0 ? (
               <p className="text-[13px] text-[var(--color-text-tertiary)]">No permissions assigned.</p>
             ) : (
               <div className="flex flex-wrap gap-1.5">
                 {role.permissions.map((perm) => (
                   <span
                     key={perm}
                     className={clsx(
                       'inline-flex items-center px-2 py-1 rounded-md',
                       'text-[11px] font-mono font-medium',
                       'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
                     )}
                   >
                     {perm}
                   </span>
                 ))}
               </div>
             )}
           </div>
 
           <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
             <div>
               <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
                 Created
               </p>
               <p className="text-[12px] text-[var(--color-text-secondary)]">
                 {new Date(role.createdAt).toLocaleDateString('en-IN')}
               </p>
             </div>
             <div>
               <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
                 Updated
               </p>
               <p className="text-[12px] text-[var(--color-text-secondary)]">
                 {new Date(role.updatedAt).toLocaleDateString('en-IN')}
               </p>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // RolesPage
 // ─────────────────────────────────────────────────────────────────────────────
 
 const initialForm: CreateRoleRequest = {
   key: '',
   name: '',
   description: '',
   permissions: [],
 };
 
 export function RolesPage() {
  const { success, error: toastError } = useToast();
   const [roles, setRoles] = useState<Role[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Create modal
   const [showCreate, setShowCreate] = useState(false);
   const [form, setForm] = useState<CreateRoleRequest>({ ...initialForm });
   const [customPermInput, setCustomPermInput] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [formError, setFormError] = useState<string | null>(null);
 
   // Detail panel
   const [selectedRole, setSelectedRole] = useState<Role | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await adminApi.getRoles();
       setRoles(data);
     } catch {
       setError("Couldn't load roles. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const handleAddCustomPerm = () => {
     const trimmed = customPermInput.trim();
     if (!trimmed) return;
     if (!form.permissions.includes(trimmed)) {
       setForm((f) => ({ ...f, permissions: [...f.permissions, trimmed] }));
     }
     setCustomPermInput('');
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!form.name.trim() || !form.key.trim()) return;
     setIsSubmitting(true);
     setFormError(null);
     try {
       await adminApi.createRole(form);
      success('Role created', `"${form.name}" has been added.`);
       setShowCreate(false);
       setForm({ ...initialForm });
       load();
     } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create role';
      setFormError(msg);
      toastError('Failed to create role', msg);
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const closeCreate = () => {
     setShowCreate(false);
     setForm({ ...initialForm });
     setCustomPermInput('');
     setFormError(null);
   };
 
   const columns: Column<Role>[] = [
     {
       id: 'name',
       header: 'Role',
       accessor: (r) => (
         <div className="flex items-center gap-2">
           <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{r.name}</span>
           {r.isSystem && (
             <Badge variant="default" className="text-[10px]">
               <Lock size={9} className="mr-1" />
               System
             </Badge>
           )}
         </div>
       ),
     },
     {
       id: 'key',
       header: 'Key',
       accessor: (r) => (
         <span className="text-[12px] font-mono text-[var(--color-text-tertiary)]">{r.key}</span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'permissions',
       header: 'Permissions',
       accessor: (r) => (
         <span className="text-[13px] tabular-nums text-[var(--color-text-secondary)]">
           {r.permissions.length}
         </span>
       ),
       align: 'center',
     },
     {
       id: 'description',
       header: 'Description',
       accessor: (r) => (
         <span className="text-[12px] text-[var(--color-text-tertiary)] line-clamp-1">
           {r.description ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
   ];
 
   if (isLoading) {
     return (
       <div className="space-y-5">
         <div className="flex items-center justify-between">
           <div>
             <Skeleton width={180} height={22} />
             <Skeleton width={260} height={14} className="mt-1.5" />
           </div>
           <Skeleton width={100} height={34} />
         </div>
         <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="px-4 py-3 border-b border-[var(--color-border-subtle)] last:border-0 animate-pulse">
               <Skeleton width="40%" />
             </div>
           ))}
         </div>
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-20 gap-3">
         <AlertCircle size={24} className="text-[var(--color-error)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
         <Button size="sm" variant="secondary" onClick={load}>
           <RefreshCcw size={14} className="mr-1.5" /> Retry
         </Button>
       </div>
     );
   }
 
   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-center justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
             Role Management
           </h1>
           <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
             {roles.length} role{roles.length !== 1 ? 's' : ''} configured
           </p>
         </div>
         <Button onClick={() => { setFormError(null); setShowCreate(true); }}>
           <Plus size={15} className="mr-1.5" /> New Role
         </Button>
       </div>
 
       {/* DataTable */}
       <DataTable
         columns={columns}
         data={roles}
         keyExtractor={(r) => r.key}
         searchable
         searchPlaceholder="Search roles..."
         searchFilter={(r, q) =>
           r.name.toLowerCase().includes(q.toLowerCase()) ||
           r.key.toLowerCase().includes(q.toLowerCase())
         }
         onRowClick={(r) => setSelectedRole(r)}
         emptyMessage="No roles configured yet"
         rowActions={(r) => (
           <button
             onClick={(e) => { e.stopPropagation(); setSelectedRole(r); }}
             className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
             aria-label="View role details"
           >
             <ChevronRight size={14} />
           </button>
         )}
       />
 
       {/* Create Role Modal */}
       <Modal
         isOpen={showCreate}
         onClose={closeCreate}
         title="Create Role"
         description="Define a new role with a set of permissions."
         size="md"
         footer={
           <>
             <Button variant="secondary" onClick={closeCreate} disabled={isSubmitting}>
               Cancel
             </Button>
             <Button
               type="submit"
               form="create-role-form"
               disabled={isSubmitting || !form.name.trim() || !form.key.trim()}
             >
               {isSubmitting ? 'Creating...' : 'Create Role'}
             </Button>
           </>
         }
       >
         <form id="create-role-form" onSubmit={handleSubmit} className="space-y-4">
           <Input
             label="Role Name"
             required
             value={form.name}
             onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
             placeholder="e.g. Accounts Manager"
           />
           <Input
             label="Role Key"
             required
             value={form.key}
             onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
             placeholder="e.g. ROLE_ACCOUNTS_MANAGER"
           />
           <div className="space-y-1.5">
             <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
               Description
             </label>
             <textarea
               value={form.description ?? ''}
               onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
               placeholder="Briefly describe this role's responsibilities..."
               rows={2}
               className={clsx(
                 'w-full rounded-lg border border-[var(--color-border-default)] px-3 py-2',
                 'text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
                 'placeholder:text-[var(--color-text-tertiary)] resize-none',
                 'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
               )}
             />
           </div>
           <PermissionsChecklist
             selected={form.permissions}
             onChange={(perms) => setForm((f) => ({ ...f, permissions: perms }))}
             customInput={customPermInput}
             onCustomInputChange={setCustomPermInput}
             onAddCustom={handleAddCustomPerm}
           />
           {formError && (
             <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)]">
               <AlertCircle size={14} />
               <p className="text-[12px]">{formError}</p>
             </div>
           )}
         </form>
       </Modal>
 
       {/* Role Detail Panel */}
       {selectedRole && (
         <RoleDetailPanel role={selectedRole} onClose={() => setSelectedRole(null)} />
       )}
     </div>
   );
 }

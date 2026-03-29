 /**
  * PlatformRolesPage
  *
  * Platform-level role management for superadmin.
  *
  * Features:
  *  - List all platform roles with key, name, permissions count, system badge
  *  - Expand/view role to see full permissions list
  *  - Create new platform role
  *
  * Data source:
  *  - superadminRolesApi.listRoles() → GET /api/v1/admin/roles
  *  - superadminRolesApi.createRole() → POST /api/v1/admin/roles
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import {
   Shield,
   Plus,
   RefreshCw,
   AlertCircle,
   ChevronDown,
   ChevronRight,
   Lock,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { useToast } from '@/components/ui/Toast';
 import { superadminRolesApi } from '@/lib/superadminApi';
 import type { Role, CreateRoleRequest } from '@/types';
 
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize a permission item to a string.
 * The API may return either a plain string or an object { id, code, description }.
 */
function permToString(perm: unknown): string {
  if (typeof perm === 'string') return perm;
  if (perm && typeof perm === 'object') {
    const p = perm as Record<string, unknown>;
    if (typeof p.code === 'string') return p.code;
    if (typeof p.name === 'string') return p.name;
    if (typeof p.description === 'string') return p.description;
    if (typeof p.id === 'string') return p.id;
    if (typeof p.id === 'number') return String(p.id);
  }
  return String(perm);
}

function permKey(perm: unknown, index: number): string {
  const str = permToString(perm);
  return str || String(index);
}

 // ─────────────────────────────────────────────────────────────────────────────
 // Create Role Modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 const COMMON_PERMISSIONS = [
   'TENANT_VIEW',
   'TENANT_MANAGE',
   'USER_VIEW',
   'USER_MANAGE',
   'ROLE_VIEW',
   'ROLE_MANAGE',
   'AUDIT_VIEW',
   'TICKET_VIEW',
   'TICKET_RESPOND',
   'SETTINGS_VIEW',
   'SETTINGS_MANAGE',
 ];
 
 interface CreateRoleModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
 }
 
 function CreateRoleModal({ isOpen, onClose, onSuccess }: CreateRoleModalProps) {
   const { toast } = useToast();
   const [form, setForm] = useState<CreateRoleRequest>({
     key: '',
     name: '',
     description: '',
     permissions: [],
   });
   const [customPermission, setCustomPermission] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [errors, setErrors] = useState<Record<string, string>>({});
 
   const reset = () => {
     setForm({ key: '', name: '', description: '', permissions: [] });
     setCustomPermission('');
     setErrors({});
   };
 
   const handleClose = () => { reset(); onClose(); };
 
   const togglePermission = (perm: string) => {
     setForm((p) => ({
       ...p,
       permissions: p.permissions.includes(perm)
         ? p.permissions.filter((x) => x !== perm)
         : [...p.permissions, perm],
     }));
   };
 
   const addCustomPermission = () => {
     const trimmed = customPermission.trim().toUpperCase().replace(/\s+/g, '_');
     if (trimmed && !form.permissions.includes(trimmed)) {
       setForm((p) => ({ ...p, permissions: [...p.permissions, trimmed] }));
     }
     setCustomPermission('');
   };
 
   const validate = () => {
     const errs: Record<string, string> = {};
     if (!form.key.trim()) errs.key = 'Role key is required';
     if (!/^[A-Z][A-Z0-9_]*$/.test(form.key))
       errs.key = 'Key must start with uppercase letter and contain only letters, digits, underscores';
     if (!form.name.trim()) errs.name = 'Role name is required';
     return errs;
   };
 
   const handleSubmit = async () => {
     const errs = validate();
     setErrors(errs);
     if (Object.keys(errs).length > 0) return;
     setIsSubmitting(true);
     try {
       await superadminRolesApi.createRole(form);
       toast({ title: 'Role created', type: 'success' });
       handleClose();
       onSuccess();
     } catch (err) {
       toast({
         title: 'Failed to create role',
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
       title="Create Platform Role"
       size="lg"
       footer={
         <>
           <Button variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
           <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
             Create Role
           </Button>
         </>
       }
     >
       <div className="space-y-4">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div>
             <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
               Role Key <span className="text-[var(--color-error)]">*</span>
             </label>
             <Input
               value={form.key}
               onChange={(e) => setForm((p) => ({ ...p, key: e.target.value.toUpperCase() }))}
               placeholder="ROLE_SUPPORT"
               error={errors.key}
             />
             <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
               Unique identifier (e.g. ROLE_SUPPORT)
             </p>
           </div>
           <div>
             <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
               Display Name <span className="text-[var(--color-error)]">*</span>
             </label>
             <Input
               value={form.name}
               onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
               placeholder="Support Agent"
               error={errors.name}
             />
           </div>
           <div className="sm:col-span-2">
             <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
               Description
             </label>
             <Input
               value={form.description ?? ''}
               onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
               placeholder="What this role can do…"
             />
           </div>
         </div>
 
         {/* Permissions */}
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
             Permissions
           </label>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
             {COMMON_PERMISSIONS.map((perm) => (
               <label
                 key={perm}
                 className={clsx(
                   'flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none',
                   'border text-[12px] font-mono transition-colors',
                   form.permissions.includes(perm)
                     ? 'border-[var(--color-neutral-900)] bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)]'
                     : 'border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]',
                 )}
               >
                 <input
                   type="checkbox"
                   className="sr-only"
                   checked={form.permissions.includes(perm)}
                   onChange={() => togglePermission(perm)}
                 />
                 {perm}
               </label>
             ))}
           </div>
 
           {/* Custom permissions */}
           {form.permissions.filter((p) => !COMMON_PERMISSIONS.includes(p)).length > 0 && (
             <div className="mb-3 flex flex-wrap gap-1.5">
               {form.permissions
                 .filter((p) => !COMMON_PERMISSIONS.includes(p))
                 .map((perm) => (
                   <span
                     key={perm}
                     className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-surface-tertiary)] text-[11px] font-mono text-[var(--color-text-secondary)]"
                   >
                     {perm}
                     <button
                       type="button"
                       onClick={() => togglePermission(perm)}
                       className="opacity-60 hover:opacity-100 ml-0.5"
                       aria-label={`Remove ${perm}`}
                     >
                       ×
                     </button>
                   </span>
                 ))}
             </div>
           )}
 
           <div className="flex gap-2">
             <Input
               value={customPermission}
               onChange={(e) => setCustomPermission(e.target.value)}
               placeholder="Custom permission (e.g. REPORTS_EXPORT)"
               onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomPermission(); } }}
             />
             <Button variant="secondary" size="sm" onClick={addCustomPermission}>Add</Button>
           </div>
         </div>
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Role Row (expandable)
 // ─────────────────────────────────────────────────────────────────────────────
 
 function RoleRow({ role }: { role: Role }) {
   const [expanded, setExpanded] = useState(false);
 
   return (
     <>
       <tr
         className="hover:bg-[var(--color-surface-secondary)] cursor-pointer transition-colors"
         onClick={() => setExpanded((e) => !e)}
       >
         <td className="px-4 py-3">
           <div className="flex items-center gap-2.5">
             <div className="shrink-0 text-[var(--color-text-tertiary)] opacity-60">
               <Shield size={14} />
             </div>
             <div>
               <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{role.name}</p>
               <p className="text-[11px] font-mono text-[var(--color-text-tertiary)]">{role.key}</p>
             </div>
           </div>
         </td>
         <td className="px-4 py-3">
           <p className="text-[12px] text-[var(--color-text-secondary)] truncate max-w-[200px]">
             {role.description || '—'}
           </p>
         </td>
         <td className="px-4 py-3">
           <span className="text-[12px] tabular-nums text-[var(--color-text-secondary)]">
             {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
           </span>
         </td>
         <td className="px-4 py-3">
           {role.isSystem && (
             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface-tertiary)] text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
               <Lock size={9} />
               System
             </span>
           )}
         </td>
         <td className="px-4 py-3 text-right">
           <button
             type="button"
             className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
             aria-label={expanded ? 'Collapse' : 'Expand'}
           >
             {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
           </button>
         </td>
       </tr>
       {expanded && (
         <tr>
           <td
             colSpan={5}
             className="px-4 pb-4 pt-0 bg-[var(--color-surface-secondary)]"
           >
             <div className="pt-2">
               <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
                 Permissions
               </p>
               {role.permissions.length === 0 ? (
                 <p className="text-[12px] text-[var(--color-text-tertiary)]">No permissions assigned.</p>
               ) : (
                 <div className="flex flex-wrap gap-1.5">
                   {role.permissions.map((perm, i) => (
                     <span
                       key={permKey(perm, i)}
                       className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[11px] font-mono text-[var(--color-text-secondary)]"
                     >
                       {permToString(perm)}
                     </span>
                   ))}
                 </div>
               )}
             </div>
           </td>
         </tr>
       )}
     </>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function PlatformRolesPage() {
   const [roles, setRoles] = useState<Role[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [createOpen, setCreateOpen] = useState(false);
 
   const loadRoles = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await superadminRolesApi.listRoles();
       setRoles(data);
     } catch {
       setError("Couldn't load platform roles. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     void loadRoles();
   }, [loadRoles]);
 
   return (
     <div className="space-y-6">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Platform Roles</h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             {isLoading ? 'Loading…' : `${roles.length} role${roles.length !== 1 ? 's' : ''} defined`}
           </p>
         </div>
         <div className="flex items-center gap-2 shrink-0">
           <Button
             variant="secondary"
             size="sm"
             onClick={() => void loadRoles()}
             leftIcon={<RefreshCw size={13} />}
           >
             <span className="hidden sm:inline">Refresh</span>
           </Button>
           <Button
             variant="primary"
             size="sm"
             onClick={() => setCreateOpen(true)}
             leftIcon={<Plus size={13} />}
           >
             Create Role
           </Button>
         </div>
       </div>
 
       {/* ── Error ───────────────────────────────────────────────────── */}
       {error && (
         <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={14} className="shrink-0" />
           <span className="flex-1">{error}</span>
           <button
             type="button"
             onClick={() => void loadRoles()}
             className="text-[12px] font-medium underline underline-offset-2 hover:no-underline shrink-0"
           >
             Retry
           </button>
         </div>
       )}
 
       {/* ── Loading ─────────────────────────────────────────────────── */}
       {isLoading && (
         <div className="space-y-2">
           {Array.from({ length: 4 }).map((_, i) => (
             <div
               key={i}
               className="h-14 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse"
             />
           ))}
         </div>
       )}
 
       {/* ── Empty ───────────────────────────────────────────────────── */}
       {!isLoading && roles.length === 0 && !error && (
         <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
           <Shield size={32} className="text-[var(--color-text-tertiary)] mb-3 opacity-40" />
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">No roles defined</p>
           <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
             Create your first platform role to get started.
           </p>
           <Button
             variant="primary"
             size="sm"
             className="mt-4"
             onClick={() => setCreateOpen(true)}
             leftIcon={<Plus size={13} />}
           >
             Create Role
           </Button>
         </div>
       )}
 
       {/* ── Roles Table ─────────────────────────────────────────────── */}
       {!isLoading && roles.length > 0 && (
         <div className="overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
           <table className="min-w-full divide-y divide-[var(--color-border-subtle)]">
             <thead>
               <tr className="bg-[var(--color-surface-secondary)]">
                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Role</th>
                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] hidden sm:table-cell">Description</th>
                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Permissions</th>
                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Type</th>
                 <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[var(--color-border-subtle)]">
               {roles.map((role) => (
                 <RoleRow key={role.key} role={role} />
               ))}
             </tbody>
           </table>
         </div>
       )}
 
       {/* ── Create Role Modal ───────────────────────────────────────── */}
       <CreateRoleModal
         isOpen={createOpen}
         onClose={() => setCreateOpen(false)}
         onSuccess={() => void loadRoles()}
       />
     </div>
   );
 }

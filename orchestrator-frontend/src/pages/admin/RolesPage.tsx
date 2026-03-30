 /**
  * RolesPage — Role Management for the Admin portal (read-only)
  *
  * Roles are viewable by tenant admins. Role creation requires ROLE_SUPER_ADMIN
  * per the backend contract (POST /api/v1/admin/roles). Tenant admins can only
  * read and inspect existing roles.
  *
  * Features:
  *  - DataTable listing roles with key, name, permissions count, system badge
  *  - Role detail drawer showing full permissions list
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Lock,
   ChevronRight,
   X,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useAuth } from '@/context/AuthContext';
 import { adminApi } from '@/lib/adminApi';
 import type { Role } from '@/types';
 
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

 // (No write helpers needed: role creation is superadmin-only per backend contract)
 
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
                 {role.permissions.map((perm, i) => (
                   <span
                     key={permKey(perm, i)}
                     className={clsx(
                       'inline-flex items-center px-2 py-1 rounded-md',
                       'text-[11px] font-mono font-medium',
                       'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
                     )}
                   >
                     {permToString(perm)}
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
 
 export function RolesPage() {
   const { user: currentUser } = useAuth();
   const [roles, setRoles] = useState<Role[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Determine if the current user is a SUPER_ADMIN
   const isSuperAdmin = currentUser?.roles?.includes('ROLE_SUPER_ADMIN') ?? false;

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
 
   // Filter out ROLE_SUPER_ADMIN for non-superadmin users (tenant admin should not see it)
   const visibleRoles = isSuperAdmin
     ? roles
     : roles.filter((r) => r.key !== 'ROLE_SUPER_ADMIN');

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
       <PageHeader
         title="Role Management"
         description={`${visibleRoles.length} role${visibleRoles.length !== 1 ? 's' : ''} configured`}
       />

       {/* Read-only notice */}
       <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] text-[13px] text-[var(--color-text-secondary)]">
         <Lock size={14} className="shrink-0 text-[var(--color-text-tertiary)]" />
         <span>Role creation is managed by platform administrators. Contact your platform team to add new roles.</span>
       </div>
 
       {/* DataTable */}
       <DataTable
         columns={columns}
         data={visibleRoles}
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
 
       {/* Role Detail Panel */}
       {selectedRole && (
         <RoleDetailPanel role={selectedRole} onClose={() => setSelectedRole(null)} />
       )}
     </div>
   );
 }

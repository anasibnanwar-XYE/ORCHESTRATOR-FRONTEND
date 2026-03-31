 /**
  * OperationsControlPage
  *
  * Operations control center with:
  *  - Maintenance Mode toggle (with confirmation)
  *  - Feature Flags (list of toggleable flags with confirmation)
  *  - Cache Purge action (with confirmation)
  *
  * Data sources:
  *  - GET  /api/v1/admin/operations/status
  *  - POST /api/v1/admin/operations/maintenance
  *  - PATCH /api/v1/admin/operations/flags/{key}
  *  - POST /api/v1/admin/operations/cache/purge
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   Flag,
   Wrench,
   Trash2,
   RefreshCcw,
   AlertCircle,
 
 
   Database,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
import { Switch } from '@/components/ui/Switch';
 import { Button } from '@/components/ui/Button';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { Badge } from '@/components/ui/Badge';
 import { useToast } from '@/components/ui/Toast';
 import type { OperationsStatus, FeatureFlag } from '@/types';

 // NOTE: operationsControlApi was removed from adminApi.ts (fully stubbed/mocked, not in backend spec).
 // This page is kept as a file but removed from routing. Inline stubs preserve compilability.
 const operationsControlApi = {
   async getStatus(): Promise<OperationsStatus> {
     return { maintenanceMode: false, featureFlags: [], cacheLastPurged: null };
   },
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async setMaintenanceMode(_enabled: boolean): Promise<OperationsStatus> {
     return { maintenanceMode: false, featureFlags: [], cacheLastPurged: null };
   },
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async toggleFeatureFlag(_key: string, _enabled: boolean): Promise<OperationsStatus> {
     return { maintenanceMode: false, featureFlags: [], cacheLastPurged: null };
   },
   async purgeCache(): Promise<OperationsStatus> {
     return { maintenanceMode: false, featureFlags: [], cacheLastPurged: null };
   },
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function OperationsControlPage() {
   const { toast } = useToast();
   const [status, setStatus] = useState<OperationsStatus | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Maintenance mode confirmation
   const [maintenanceConfirm, setMaintenanceConfirm] = useState<boolean | null>(null);
   const [maintenanceSaving, setMaintenanceSaving] = useState(false);
 
   // Feature flag confirmation
   const [flagConfirm, setFlagConfirm] = useState<{ key: string; label: string; enabled: boolean } | null>(null);
   const [flagSaving, setFlagSaving] = useState<string | null>(null);
 
   // Cache purge confirmation
   const [cacheConfirm, setCacheConfirm] = useState(false);
   const [cachePurging, setCachePurging] = useState(false);
 
   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const result = await operationsControlApi.getStatus();
       setStatus(result);
     } catch {
       setError('Failed to load operations status.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => { void load(); }, [load]);
 
   // ── Maintenance mode ──
   const handleMaintenanceToggle = (enabled: boolean) => {
     setMaintenanceConfirm(enabled);
   };
 
   const confirmMaintenanceToggle = async () => {
     if (maintenanceConfirm === null) return;
     setMaintenanceSaving(true);
     try {
       const nextStatus = await operationsControlApi.setMaintenanceMode(maintenanceConfirm);
       setStatus(nextStatus);
     } catch {
       toast({ title: 'Failed to update maintenance mode', type: 'error' });
     } finally {
       setMaintenanceSaving(false);
       setMaintenanceConfirm(null);
     }
   };
 
   // ── Feature flags ──
   const handleFlagToggle = (flag: FeatureFlag) => {
     setFlagConfirm({ key: flag.key, label: flag.label, enabled: !flag.enabled });
   };
 
   const confirmFlagToggle = async () => {
     if (!flagConfirm) return;
     setFlagSaving(flagConfirm.key);
     try {
       const nextStatus = await operationsControlApi.toggleFeatureFlag(
         flagConfirm.key,
         flagConfirm.enabled
       );
       setStatus(nextStatus);
     } catch {
       toast({ title: 'Failed to update feature flag', type: 'error' });
     } finally {
       setFlagSaving(null);
       setFlagConfirm(null);
     }
   };
 
   // ── Cache purge ──
   const handleCachePurge = () => {
     setCacheConfirm(true);
   };
 
   const confirmCachePurge = async () => {
     setCachePurging(true);
     try {
       const nextStatus = await operationsControlApi.purgeCache();
       setStatus(nextStatus);
     } catch {
       toast({ title: 'Failed to purge cache', type: 'error' });
     } finally {
       setCachePurging(false);
       setCacheConfirm(false);
     }
   };
 
   if (loading) {
     return (
       <div className="space-y-8">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Operations Control</h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             Feature flags, maintenance mode, and cache management.
           </p>
         </div>
         <div className="animate-pulse space-y-4">
           <div className="h-20 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl" />
           <div className="h-48 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl" />
           <div className="h-16 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl" />
         </div>
       </div>
     );
   }
 
   if (error || !status) {
     return (
       <div className="space-y-6">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Operations Control</h1>
         </div>
         <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={16} className="shrink-0" />
           <span>{error || 'Failed to load operations status.'}</span>
           <button type="button" onClick={load} className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80">
             <RefreshCcw size={13} /> Retry
           </button>
         </div>
       </div>
     );
   }
 
   return (
     <div className="space-y-8">
       {/* Header */}
       <div>
         <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Operations Control</h1>
         <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
           Feature flags, maintenance mode, and cache management.
         </p>
       </div>
 
       {/* Maintenance Mode */}
       <section>
         <div className="flex items-center gap-2 mb-4">
           <Wrench size={15} className="text-[var(--color-text-tertiary)]" />
           <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">Maintenance Mode</h2>
         </div>
         <div className={clsx(
           'flex items-center justify-between px-4 py-4',
           'bg-[var(--color-surface-primary)] border rounded-xl',
           status.maintenanceMode
             ? 'border-[var(--color-warning)] bg-[var(--color-warning-bg)]'
             : 'border-[var(--color-border-default)]',
         )}>
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Maintenance Mode</p>
             <p className={clsx(
               'text-[12px] mt-0.5',
               status.maintenanceMode
                 ? 'text-[var(--color-warning)]'
                 : 'text-[var(--color-text-tertiary)]',
             )}>
               {status.maintenanceMode
                 ? 'System is under maintenance — users cannot log in'
                 : 'System is operational'}
             </p>
           </div>
           <div className="flex items-center gap-3">
             {status.maintenanceMode && (
               <Badge variant="warning">Active</Badge>
             )}
             <Switch
               checked={status.maintenanceMode}
               onChange={handleMaintenanceToggle}
               disabled={maintenanceSaving}
             />
           </div>
         </div>
       </section>
 
       {/* Feature Flags */}
       <section>
         <div className="flex items-center gap-2 mb-4">
           <Flag size={15} className="text-[var(--color-text-tertiary)]" />
           <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">Feature Flags</h2>
         </div>
         {status.featureFlags.length === 0 ? (
           <div className="text-center py-8 text-[13px] text-[var(--color-text-tertiary)]">
             No feature flags configured.
           </div>
         ) : (
           <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
             {status.featureFlags.map((flag) => (
               <div key={flag.key} className="flex items-center justify-between px-4 py-3.5 gap-4">
                 <div className="min-w-0">
                   <div className="flex items-center gap-2">
                     <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{flag.label}</p>
                     <Badge variant={flag.enabled ? 'success' : 'default'}>
                       {flag.enabled ? 'On' : 'Off'}
                     </Badge>
                   </div>
                   {flag.description && (
                     <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">{flag.description}</p>
                   )}
                   <code className="text-[11px] font-mono text-[var(--color-text-tertiary)]">{flag.key}</code>
                 </div>
                 <Switch
                   checked={flag.enabled}
                   onChange={() => handleFlagToggle(flag)}
                   disabled={flagSaving === flag.key}
                 />
               </div>
             ))}
           </div>
         )}
       </section>
 
       {/* Cache Management */}
       <section>
         <div className="flex items-center gap-2 mb-4">
           <Database size={15} className="text-[var(--color-text-tertiary)]" />
           <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">Cache Management</h2>
         </div>
         <div className="flex items-center justify-between px-4 py-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Purge Cache</p>
             <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
               {status.cacheLastPurged
                 ? `Last purged ${format(new Date(status.cacheLastPurged), 'd MMM yyyy, HH:mm')}`
                 : 'Clear all cached data to force fresh retrieval'}
             </p>
           </div>
           <Button
             variant="secondary"
            
             onClick={handleCachePurge}
            isLoading={cachePurging}
            leftIcon={<Trash2 size={14} />}
           >
             Purge Cache
           </Button>
         </div>
       </section>
 
       {/* Maintenance Mode Confirm */}
       <ConfirmDialog
         isOpen={maintenanceConfirm !== null}
        onCancel={() => setMaintenanceConfirm(null)}
         onConfirm={confirmMaintenanceToggle}
         title={maintenanceConfirm ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode'}
        message={
           maintenanceConfirm
             ? 'This will prevent all users from logging in. Make sure any pending operations are complete before proceeding.'
             : 'This will re-enable user access to the system.'
         }
         confirmLabel={maintenanceConfirm ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode'}
         variant={maintenanceConfirm ? 'danger' : 'default'}
        isLoading={maintenanceSaving}
       />
 
       {/* Feature Flag Confirm */}
       <ConfirmDialog
         isOpen={flagConfirm !== null}
        onCancel={() => setFlagConfirm(null)}
         onConfirm={confirmFlagToggle}
         title={flagConfirm?.enabled ? `Enable ${flagConfirm?.label}` : `Disable ${flagConfirm?.label}`}
        message={`Are you sure you want to ${flagConfirm?.enabled ? 'enable' : 'disable'} the "${flagConfirm?.label}" feature flag?`}
         confirmLabel={flagConfirm?.enabled ? 'Enable' : 'Disable'}
         variant="default"
        isLoading={flagSaving !== null}
       />
 
       {/* Cache Purge Confirm */}
       <ConfirmDialog
         isOpen={cacheConfirm}
        onCancel={() => setCacheConfirm(false)}
         onConfirm={confirmCachePurge}
         title="Purge Cache"
        message="This will clear all cached data. Active sessions may experience briefly slower responses while cache rebuilds."
         confirmLabel="Purge Cache"
         variant="danger"
        isLoading={cachePurging}
       />
     </div>
   );
 }

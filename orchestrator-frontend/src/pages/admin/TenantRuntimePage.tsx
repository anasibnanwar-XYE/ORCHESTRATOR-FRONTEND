 /**
  * TenantRuntimePage
  *
  * Tenant runtime metrics and security policy view for tenant-admins.
  *
  * Sections:
  *  1. Runtime Metrics: API calls, storage, active sessions (readable by all admins)
  *  2. Security Policy: read-only display — tenant admins cannot mutate policy.
  *     PUT /api/v1/admin/tenant-runtime/policy is superadmin-only per the backend contract.
  *
  * Data sources:
  *  - GET /api/v1/admin/tenant-runtime/metrics  → TenantRuntimeMetrics (read-only for tenant-admin)
  *  - getPolicy() stub                          → TenantPolicy defaults (read-only display)
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   Activity,
   Server,
   HardDrive,
   Users,
   RefreshCcw,
   AlertCircle,
   Lock,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { tenantApi } from '@/lib/adminApi';
 import type { TenantRuntimeMetrics, TenantPolicy } from '@/types';

 // NOTE: tenantApi.getPolicy was removed (fully stubbed, not in backend spec).
 // This page is kept as a file but removed from routing. Inline default preserves compilability.
 const DEFAULT_TENANT_POLICY: TenantPolicy = {
   sessionTimeoutMinutes: 60,
   passwordMinLength: 10,
   passwordRequireUppercase: true,
   passwordRequireNumbers: true,
   passwordRequireSymbols: true,
   maxLoginAttempts: 5,
   mfaRequired: false,
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatNumber(n: number): string {
   return new Intl.NumberFormat('en-IN').format(n);
 }
 
 function formatMb(n: number): string {
   if (n >= 1024) return `${(n / 1024).toFixed(1)} GB`;
   return `${n} MB`;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Metric Card
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface MetricCardProps {
   label: string;
   value: string | number;
   sublabel?: string;
   icon: React.ReactNode;
   usage?: number; // 0-100 percent bar
   accent?: 'default' | 'success' | 'warning' | 'error';
 }
 
 function MetricCard({ label, value, sublabel, icon, usage, accent = 'default' }: MetricCardProps) {
   const accentMap = {
     default: 'text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)]',
     success: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
     warning: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
     error: 'text-[var(--color-error)] bg-[var(--color-error-bg)]',
   };
   const barAccent = {
     default: 'bg-[var(--color-neutral-900)]',
     success: 'bg-[var(--color-success)]',
     warning: 'bg-[var(--color-warning)]',
     error: 'bg-[var(--color-error)]',
   };
 
   return (
     <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
       <div className="flex items-center gap-3 mb-3">
         <span className={clsx('p-2 rounded-lg', accentMap[accent])}>{icon}</span>
         <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
           {label}
         </span>
       </div>
       <p className="text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</p>
       {sublabel && (
         <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">{sublabel}</p>
       )}
       {usage !== undefined && (
         <div className="mt-3 h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
           <div
             className={clsx('h-full rounded-full transition-all duration-500', barAccent[accent])}
             style={{ width: `${Math.min(usage, 100)}%` }}
           />
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Runtime Metrics Section
 // ─────────────────────────────────────────────────────────────────────────────
 
 function MetricsSection() {
   const [data, setData] = useState<TenantRuntimeMetrics | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const result = await tenantApi.getRuntimeMetrics();
       setData(result);
     } catch {
       setError('Failed to load runtime metrics.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => { void load(); }, [load]);
 
   if (loading) {
     return (
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         {Array.from({ length: 3 }).map((_, i) => (
           <div key={i} className="p-4 animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
             <Skeleton width={32} height={32} className="rounded-lg mb-3" />
             <Skeleton width="60%" height={28} />
             <Skeleton width="40%" height={12} className="mt-2" />
           </div>
         ))}
       </div>
     );
   }
 
   if (error || !data) {
     return (
       <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
         <AlertCircle size={16} className="shrink-0" />
         <span>{error || 'Failed to load runtime metrics.'}</span>
         <button type="button" onClick={load} className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80">
           <RefreshCcw size={13} /> Retry
         </button>
       </div>
     );
   }
 
   const apiUsagePct = data.apiCallsLimit
     ? (data.apiCalls / data.apiCallsLimit) * 100
     : undefined;
   const storageUsagePct = data.storageLimit
     ? (data.storageUsedMb / data.storageLimit) * 100
     : undefined;
 
   return (
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
       <MetricCard
         label="API Calls"
         value={formatNumber(data.apiCalls)}
         sublabel={data.apiCallsLimit ? `of ${formatNumber(data.apiCallsLimit)} allowed` : data.period}
         icon={<Activity size={16} />}
         usage={apiUsagePct}
         accent={apiUsagePct !== undefined && apiUsagePct > 85 ? 'warning' : 'default'}
       />
       <MetricCard
         label="Storage Used"
         value={formatMb(data.storageUsedMb)}
         sublabel={data.storageLimit ? `of ${formatMb(data.storageLimit)} total` : undefined}
         icon={<HardDrive size={16} />}
         usage={storageUsagePct}
         accent={storageUsagePct !== undefined && storageUsagePct > 85 ? 'warning' : 'default'}
       />
       <MetricCard
         label="Active Sessions"
         value={formatNumber(data.activeSessions)}
         sublabel="Currently active"
         icon={<Users size={16} />}
         accent="default"
       />
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Policy Section
 // ─────────────────────────────────────────────────────────────────────────────
 
 /**
  * PolicySection — read-only display of security policy defaults.
  * Tenant admins can view but not modify policy.
  * Policy mutation requires ROLE_SUPER_ADMIN (PUT /api/v1/admin/tenant-runtime/policy).
  */
 function PolicySection() {
   const [policy, setPolicy] = useState<TenantPolicy | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       setPolicy({ ...DEFAULT_TENANT_POLICY });
     } catch {
       setError('Failed to load security policy.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => { void load(); }, [load]);
 
   if (loading) {
     return (
       <div className="p-4 animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl space-y-4">
         {Array.from({ length: 5 }).map((_, i) => (
           <div key={i} className="flex items-center justify-between">
             <Skeleton width="40%" height={14} />
             <Skeleton width={80} height={14} />
           </div>
         ))}
       </div>
     );
   }
 
   if (error || !policy) {
     return (
       <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
         <AlertCircle size={16} className="shrink-0" />
         <span>{error || 'Failed to load policy.'}</span>
         <button type="button" onClick={load} className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80">
           <RefreshCcw size={13} /> Retry
         </button>
       </div>
     );
   }
 
   return (
     <div className="space-y-3">
       {/* Read-only notice */}
       <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] text-[13px] text-[var(--color-text-secondary)]">
         <Lock size={14} className="shrink-0 text-[var(--color-text-tertiary)]" />
         <span>Security policy is managed by platform administrators and cannot be changed here.</span>
       </div>

       <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
         <div className="flex items-center justify-between px-4 py-3.5 gap-4">
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Session Timeout</p>
             <p className="text-[12px] text-[var(--color-text-tertiary)]">Inactive session expires after this many minutes</p>
           </div>
           <span className="text-[13px] tabular-nums text-[var(--color-text-secondary)]">
             {policy.sessionTimeoutMinutes} min
           </span>
         </div>

         <div className="flex items-center justify-between px-4 py-3.5 gap-4">
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Password Minimum Length</p>
             <p className="text-[12px] text-[var(--color-text-tertiary)]">Minimum number of characters required</p>
           </div>
           <span className="text-[13px] tabular-nums text-[var(--color-text-secondary)]">
             {policy.passwordMinLength}
           </span>
         </div>

         <div className="flex items-center justify-between px-4 py-3.5 gap-4">
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Max Login Attempts</p>
             <p className="text-[12px] text-[var(--color-text-tertiary)]">Account locked after this many failed attempts</p>
           </div>
           <span className="text-[13px] tabular-nums text-[var(--color-text-secondary)]">
             {policy.maxLoginAttempts}
           </span>
         </div>

         <div className="flex items-center justify-between px-4 py-3.5 gap-4">
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Password Complexity</p>
             <p className="text-[12px] text-[var(--color-text-tertiary)]">Required character types</p>
           </div>
           <span className="text-[12px] text-[var(--color-text-secondary)]">
             {[
               policy.passwordRequireUppercase && 'Uppercase',
               policy.passwordRequireNumbers && 'Numbers',
               policy.passwordRequireSymbols && 'Symbols',
             ].filter(Boolean).join(', ') || 'None'}
           </span>
         </div>

         {policy.mfaRequired !== undefined && (
           <div className="flex items-center justify-between px-4 py-3.5 gap-4">
             <div>
               <p className="text-[13px] font-medium text-[var(--color-text-primary)]">MFA Required for All Users</p>
               <p className="text-[12px] text-[var(--color-text-tertiary)]">All users must enable two-factor authentication</p>
             </div>
             <span className={`text-[12px] font-medium ${policy.mfaRequired ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'}`}>
               {policy.mfaRequired ? 'Enabled' : 'Disabled'}
             </span>
           </div>
         )}
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function TenantRuntimePage() {
   return (
     <div className="space-y-8">
       {/* Header */}
       <div>
         <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Tenant Runtime</h1>
         <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
           Usage metrics and security policy configuration for this tenant.
         </p>
       </div>
 
       {/* Runtime Metrics */}
       <section>
         <div className="flex items-center gap-2 mb-4">
           <Server size={15} className="text-[var(--color-text-tertiary)]" />
           <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">Runtime Metrics</h2>
         </div>
         <MetricsSection />
       </section>
 
       {/* Security Policy */}
       <section>
         <div className="flex items-center gap-2 mb-4">
           <Lock size={15} className="text-[var(--color-text-tertiary)]" />
           <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">Security Policy</h2>
         </div>
         <PolicySection />
       </section>
     </div>
   );
 }

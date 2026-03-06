 /**
  * SuperadminRuntimePage
  *
  * Platform runtime metrics and security policy view for superadmin.
  *
  * Sections:
  *  1. Runtime Metrics: API calls, storage, active sessions
  *  2. Security Policy: Session timeout, password complexity, MFA
  *
  * Data sources:
  *  - GET /api/v1/admin/settings/runtime  → TenantRuntimeMetrics
  *  - GET /api/v1/admin/settings/policy   → TenantPolicy
  *  - PUT /api/v1/admin/settings/policy   → Update policy
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   Activity,
   Server,
   HardDrive,
   Users,
   RefreshCcw,
   AlertCircle,
   Save,
   Lock,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Button } from '@/components/ui/Button';
 import { Switch } from '@/components/ui/Switch';
 import { Input } from '@/components/ui/Input';
 import { useToast } from '@/components/ui/Toast';
 import { superadminRuntimeApi } from '@/lib/superadminApi';
 import type { TenantRuntimeMetrics, TenantPolicy } from '@/types';
 
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
       const result = await superadminRuntimeApi.getRuntimeMetrics();
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
 
 function PolicySection() {
   const { toast } = useToast();
   const [policy, setPolicy] = useState<TenantPolicy | null>(null);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [draft, setDraft] = useState<Partial<TenantPolicy>>({});
 
   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const result = await superadminRuntimeApi.getPolicy();
       setPolicy(result);
       setDraft(result);
     } catch {
       setError('Failed to load security policy.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => { void load(); }, [load]);
 
   const handleSave = async () => {
     if (!draft) return;
     setSaving(true);
     try {
       const result = await superadminRuntimeApi.updatePolicy(draft);
       setPolicy(result);
       setDraft(result);
     } catch {
       toast({ title: 'Failed to update policy', type: 'error' });
     } finally {
       setSaving(false);
     }
   };
 
   if (loading) {
     return (
       <div className="p-4 animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl space-y-4">
         {Array.from({ length: 5 }).map((_, i) => (
           <div key={i} className="flex items-center justify-between">
             <Skeleton width="40%" height={14} />
             <Skeleton width={40} height={22} className="rounded-full" />
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
     <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
       {/* Session timeout */}
       <div className="flex items-center justify-between px-4 py-3.5 gap-4">
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Session Timeout</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)]">Inactive session expires after this many minutes</p>
         </div>
         <div className="shrink-0 w-24">
           <Input
             type="number"
             value={String(draft.sessionTimeoutMinutes ?? policy.sessionTimeoutMinutes)}
             onChange={(e) => setDraft({ ...draft, sessionTimeoutMinutes: Number(e.target.value) })}
             min="5"
             max="480"
           />
         </div>
       </div>
 
       {/* Password min length */}
       <div className="flex items-center justify-between px-4 py-3.5 gap-4">
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Password Minimum Length</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)]">Minimum number of characters required</p>
         </div>
         <div className="shrink-0 w-24">
           <Input
             type="number"
             value={String(draft.passwordMinLength ?? policy.passwordMinLength)}
             onChange={(e) => setDraft({ ...draft, passwordMinLength: Number(e.target.value) })}
             min="6"
             max="32"
           />
         </div>
       </div>
 
       {/* Max login attempts */}
       <div className="flex items-center justify-between px-4 py-3.5 gap-4">
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Max Login Attempts</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)]">Account locked after this many failed attempts</p>
         </div>
         <div className="shrink-0 w-24">
           <Input
             type="number"
             value={String(draft.maxLoginAttempts ?? policy.maxLoginAttempts)}
             onChange={(e) => setDraft({ ...draft, maxLoginAttempts: Number(e.target.value) })}
             min="3"
             max="10"
           />
         </div>
       </div>
 
       {/* Password requires uppercase */}
       <div className="flex items-center justify-between px-4 py-3.5 gap-4">
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Require Uppercase Letter</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)]">Password must contain at least one uppercase character</p>
         </div>
         <Switch
           checked={draft.passwordRequireUppercase ?? policy.passwordRequireUppercase}
           onChange={(v) => setDraft({ ...draft, passwordRequireUppercase: v })}
         />
       </div>
 
       {/* Password requires numbers */}
       <div className="flex items-center justify-between px-4 py-3.5 gap-4">
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Require Numeric Character</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)]">Password must contain at least one number</p>
         </div>
         <Switch
           checked={draft.passwordRequireNumbers ?? policy.passwordRequireNumbers}
           onChange={(v) => setDraft({ ...draft, passwordRequireNumbers: v })}
         />
       </div>
 
       {/* Password requires symbols */}
       <div className="flex items-center justify-between px-4 py-3.5 gap-4">
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Require Symbol</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)]">Password must contain at least one special character</p>
         </div>
         <Switch
           checked={draft.passwordRequireSymbols ?? policy.passwordRequireSymbols}
           onChange={(v) => setDraft({ ...draft, passwordRequireSymbols: v })}
         />
       </div>
 
       {/* MFA required */}
       {draft.mfaRequired !== undefined && (
         <div className="flex items-center justify-between px-4 py-3.5 gap-4">
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Require MFA for All Users</p>
             <p className="text-[12px] text-[var(--color-text-tertiary)]">All users must enable two-factor authentication</p>
           </div>
           <Switch
             checked={draft.mfaRequired ?? false}
             onChange={(v) => setDraft({ ...draft, mfaRequired: v })}
           />
         </div>
       )}
 
       {/* Save */}
       <div className="flex justify-end px-4 py-3.5">
         <Button
           variant="primary"
           size="sm"
           onClick={handleSave}
           isLoading={saving}
           leftIcon={<Save size={14} />}
         >
           Save Policy
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function SuperadminRuntimePage() {
   return (
     <div className="space-y-8">
       {/* Header */}
       <div>
         <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Platform Runtime</h1>
         <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
           Platform-wide usage metrics and security policy configuration.
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

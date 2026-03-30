 /**
  * SettingsPage — System Settings for the Admin portal (read-only)
  *
  * Displays global settings for informational purposes.
  * PUT /api/v1/admin/settings requires ROLE_SUPER_ADMIN per the backend contract
  * (global-security-settings-authorization). Tenant admins cannot persist mutations
  * through this surface.
  *
  * Sections:
  *  1. General — company name, timezone, date format, currency
  *  2. Approvals — auto-approval threshold, period lock
  *  3. Email — SMTP host, port, username, from email/name
  *  4. Advanced — export approval toggle, CORS allowed origins
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Lock,
 } from 'lucide-react';
 import { Button } from '@/components/ui/Button';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { adminApi } from '@/lib/adminApi';
 import type { ExtendedAdminSettings } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface SettingsSectionProps {
   title: string;
   description?: string;
   children: React.ReactNode;
 }
 
 function SettingsSection({ title, description, children }: SettingsSectionProps) {
   return (
     <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
       <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
         <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
         {description && (
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">{description}</p>
         )}
       </div>
       <div className="p-5 space-y-4">{children}</div>
     </div>
   );
 }
 
 
 // ─────────────────────────────────────────────────────────────────────────────
 // SettingsPage
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function SettingsPage() {
   const [settings, setSettings] = useState<ExtendedAdminSettings | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await adminApi.getSettings();
       setSettings(data as ExtendedAdminSettings);
     } catch {
       setError("Couldn't load settings. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   if (isLoading) {
     return (
       <div className="space-y-5">
         <div className="flex items-center justify-between">
           <div>
             <Skeleton width={200} height={22} />
             <Skeleton width={280} height={14} className="mt-1.5" />
           </div>
           <Skeleton width={120} height={34} />
         </div>
         {[1, 2, 3, 4].map((i) => (
           <div key={i} className="rounded-xl border border-[var(--color-border-default)] animate-pulse">
             <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
               <Skeleton width="30%" />
             </div>
             <div className="p-5 space-y-3">
               <Skeleton />
               <Skeleton width="70%" />
             </div>
           </div>
         ))}
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
 
   // Read-only display helper
   const s = settings;

   return (
     <div className="space-y-5">
       {/* Header */}
       <PageHeader
         title="System Settings"
         description="System-wide configuration for this organisation"
       />

       {/* Read-only notice */}
       <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] text-[13px] text-[var(--color-text-secondary)]">
         <Lock size={14} className="shrink-0 text-[var(--color-text-tertiary)]" />
         <span>Global settings are managed by platform administrators. Contact your platform team to change these values.</span>
       </div>
 
       {/* General */}
       <SettingsSection title="General" description="Basic company and locale settings">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="space-y-1.5">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Company Name</p>
             <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.companyName ?? '—'}</p>
           </div>
           <div className="space-y-1.5">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Currency</p>
             <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.currency ?? '—'}</p>
           </div>
           <div className="space-y-1.5">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Timezone</p>
             <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.timezone ?? '—'}</p>
           </div>
           <div className="space-y-1.5">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Date Format</p>
             <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.dateFormat ?? '—'}</p>
           </div>
         </div>
       </SettingsSection>
 
       {/* Approvals */}
       <SettingsSection title="Approvals" description="Approval workflows and period locking">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="space-y-1.5">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Auto-Approval Threshold</p>
             <p className="text-[13px] text-[var(--color-text-secondary)]">
               {s?.autoApproveThreshold !== undefined ? `INR ${s.autoApproveThreshold}` : '—'}
             </p>
           </div>
         </div>
         <div className="space-y-3 pt-1">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Period Lock</p>
               <p className="text-[12px] text-[var(--color-text-tertiary)]">Prevent posting to closed accounting periods</p>
             </div>
             <span className={`text-[12px] font-medium ${s?.periodLockEnabled ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'}`}>
               {s?.periodLockEnabled ? 'Enabled' : 'Disabled'}
             </span>
           </div>
           <div className="flex items-center justify-between">
             <div>
               <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Export Approval Required</p>
               <p className="text-[12px] text-[var(--color-text-tertiary)]">Require admin approval before data exports are generated</p>
             </div>
             <span className={`text-[12px] font-medium ${s?.exportApprovalRequired ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'}`}>
               {s?.exportApprovalRequired ? 'Enabled' : 'Disabled'}
             </span>
           </div>
         </div>
       </SettingsSection>
 
       {/* Email / SMTP */}
       <SettingsSection title="Email" description="Outbound mail server configuration">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="space-y-1.5">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">SMTP Host</p>
             <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.smtpHost || '—'}</p>
           </div>
           <div className="space-y-1.5">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">SMTP Port</p>
             <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.smtpPort ?? '—'}</p>
           </div>
           <div className="space-y-1.5">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">From Email</p>
             <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.smtpFromEmail || '—'}</p>
           </div>
           <div className="space-y-1.5">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">From Name</p>
             <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.smtpFromName || '—'}</p>
           </div>
         </div>
         <div className="flex items-center justify-between pt-1">
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Email Notifications</p>
             <p className="text-[12px] text-[var(--color-text-tertiary)]">Transactional and alert emails to users</p>
           </div>
           <span className={`text-[12px] font-medium ${s?.emailNotifications ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'}`}>
             {s?.emailNotifications ? 'Enabled' : 'Disabled'}
           </span>
         </div>
       </SettingsSection>
 
       {/* Advanced */}
       <SettingsSection title="Advanced" description="CORS and integration settings">
         <div className="space-y-1.5">
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">CORS Allowed Origins</p>
           <p className="text-[13px] text-[var(--color-text-secondary)] break-all">
             {s?.corsAllowedOrigins || '—'}
           </p>
         </div>
       </SettingsSection>
     </div>
   );
 }

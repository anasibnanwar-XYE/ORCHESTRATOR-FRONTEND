 /**
  * SettingsPage — System Settings for the Admin portal
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
   Save,
   Check,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Switch } from '@/components/ui/Switch';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { adminApi } from '@/lib/adminApi';
 import type { ExtendedAdminSettings } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 const TIMEZONES = [
   'Asia/Kolkata', 'UTC', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
   'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles',
   'Australia/Sydney', 'Africa/Johannesburg',
 ];
 
 const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'];
 const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
 
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
 
 interface SelectFieldProps {
   label: string;
   value: string;
   options: string[];
   onChange: (val: string) => void;
 }
 
 function SelectField({ label, value, options, onChange }: SelectFieldProps) {
   return (
     <div className="space-y-1.5">
       <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
         {label}
       </label>
       <select
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className={clsx(
           'w-full h-9 rounded-lg border border-[var(--color-border-default)] px-3',
           'text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
           'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
         )}
       >
         {options.map((opt) => (
           <option key={opt} value={opt}>{opt}</option>
         ))}
       </select>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // SettingsPage
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function SettingsPage() {
  const { success, error: toastError } = useToast();
   const [settings, setSettings] = useState<ExtendedAdminSettings | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [savedPulse, setSavedPulse] = useState(false);
 
   // Local form state (mirrors settings)
   const [form, setForm] = useState<ExtendedAdminSettings>({
     companyName: '',
     timezone: 'Asia/Kolkata',
     dateFormat: 'DD/MM/YYYY',
     currency: 'INR',
     emailNotifications: true,
     autoApproveThreshold: undefined,
     periodLockEnabled: false,
     exportApprovalRequired: false,
     corsAllowedOrigins: '',
     smtpHost: '',
     smtpPort: 587,
     smtpUsername: '',
     smtpFromEmail: '',
     smtpFromName: '',
   });
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await adminApi.getSettings();
       const ext = data as ExtendedAdminSettings;
       setSettings(ext);
       setForm({
         companyName: ext.companyName ?? '',
         timezone: ext.timezone ?? 'Asia/Kolkata',
         dateFormat: ext.dateFormat ?? 'DD/MM/YYYY',
         currency: ext.currency ?? 'INR',
         emailNotifications: ext.emailNotifications ?? true,
         autoApproveThreshold: ext.autoApproveThreshold,
         periodLockEnabled: ext.periodLockEnabled ?? false,
         exportApprovalRequired: ext.exportApprovalRequired ?? false,
         corsAllowedOrigins: ext.corsAllowedOrigins ?? '',
         smtpHost: ext.smtpHost ?? '',
         smtpPort: ext.smtpPort ?? 587,
         smtpUsername: ext.smtpUsername ?? '',
         smtpFromEmail: ext.smtpFromEmail ?? '',
         smtpFromName: ext.smtpFromName ?? '',
       });
     } catch {
       setError("Couldn't load settings. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const handleSave = async () => {
     setIsSaving(true);
     try {
       const updated = await adminApi.updateSettings(form);
       setSettings(updated as ExtendedAdminSettings);
       setSavedPulse(true);
       setTimeout(() => setSavedPulse(false), 2000);
      success('Settings saved', 'Your changes have been saved.');
     } catch (err) {
      toastError('Failed to save', err instanceof Error ? err.message : 'Failed to save settings');
     } finally {
       setIsSaving(false);
     }
   };
 
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
 
   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-center justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
             System Settings
           </h1>
           <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
             Configure system-wide behaviour and integrations
           </p>
         </div>
         <Button onClick={handleSave} disabled={isSaving}>
           {savedPulse ? (
             <>
               <Check size={14} className="mr-1.5" /> Saved
             </>
           ) : (
             <>
               <Save size={14} className="mr-1.5" />
               {isSaving ? 'Saving...' : 'Save Settings'}
             </>
           )}
         </Button>
       </div>
 
       {/* General */}
       <SettingsSection title="General" description="Basic company and locale settings">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Input
             label="Company Name"
             value={form.companyName}
             onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
             placeholder="Orchestrator ERP"
           />
           <SelectField
             label="Currency"
             value={form.currency}
             options={CURRENCIES}
             onChange={(v) => setForm((f) => ({ ...f, currency: v }))}
           />
           <SelectField
             label="Timezone"
             value={form.timezone}
             options={TIMEZONES}
             onChange={(v) => setForm((f) => ({ ...f, timezone: v }))}
           />
           <SelectField
             label="Date Format"
             value={form.dateFormat}
             options={DATE_FORMATS}
             onChange={(v) => setForm((f) => ({ ...f, dateFormat: v }))}
           />
         </div>
       </SettingsSection>
 
       {/* Approvals */}
       <SettingsSection title="Approvals" description="Control approval workflows and period locking">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Input
             label="Auto-Approval Threshold (INR)"
             type="number"
             value={form.autoApproveThreshold !== undefined ? String(form.autoApproveThreshold) : ''}
             onChange={(e) =>
               setForm((f) => ({
                 ...f,
                 autoApproveThreshold: e.target.value ? Number(e.target.value) : undefined,
               }))
             }
             placeholder="e.g. 50000"
           />
         </div>
         <div className="space-y-3 pt-1">
           <Switch
             checked={form.periodLockEnabled ?? false}
             onChange={(v) => setForm((f) => ({ ...f, periodLockEnabled: v }))}
             label="Period Lock"
             description="Prevent posting to closed accounting periods"
           />
           <Switch
             checked={form.exportApprovalRequired ?? false}
             onChange={(v) => setForm((f) => ({ ...f, exportApprovalRequired: v }))}
             label="Export Approval Required"
             description="Require admin approval before data exports are generated"
           />
         </div>
       </SettingsSection>
 
       {/* Email / SMTP */}
       <SettingsSection title="Email" description="Configure outbound mail server (SMTP)">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Input
             label="SMTP Host"
             value={form.smtpHost ?? ''}
             onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
             placeholder="smtp.example.com"
           />
           <Input
             label="SMTP Port"
             type="number"
             value={form.smtpPort !== undefined ? String(form.smtpPort) : ''}
             onChange={(e) =>
               setForm((f) => ({ ...f, smtpPort: e.target.value ? Number(e.target.value) : undefined }))
             }
             placeholder="587"
           />
           <Input
             label="SMTP Username"
             value={form.smtpUsername ?? ''}
             onChange={(e) => setForm((f) => ({ ...f, smtpUsername: e.target.value }))}
             placeholder="notifications@example.com"
           />
           <Input
             label="From Email"
             type="email"
             value={form.smtpFromEmail ?? ''}
             onChange={(e) => setForm((f) => ({ ...f, smtpFromEmail: e.target.value }))}
             placeholder="noreply@example.com"
           />
           <Input
             label="From Name"
             value={form.smtpFromName ?? ''}
             onChange={(e) => setForm((f) => ({ ...f, smtpFromName: e.target.value }))}
             placeholder="Orchestrator ERP"
           />
         </div>
         <div className="pt-1">
           <Switch
             checked={form.emailNotifications}
             onChange={(v) => setForm((f) => ({ ...f, emailNotifications: v }))}
             label="Email Notifications"
             description="Send transactional and alert emails to users"
           />
         </div>
       </SettingsSection>
 
       {/* Advanced */}
       <SettingsSection title="Advanced" description="CORS and integration settings">
         <Input
           label="CORS Allowed Origins"
           value={form.corsAllowedOrigins ?? ''}
           onChange={(e) => setForm((f) => ({ ...f, corsAllowedOrigins: e.target.value }))}
           placeholder="https://app.example.com, https://portal.example.com"
         />
         <p className="text-[11px] text-[var(--color-text-tertiary)]">
           Comma-separated list of origins allowed to access the API.
         </p>
       </SettingsSection>
 
       {/* Last saved note */}
       {settings && (
         <p className="text-[11px] text-[var(--color-text-tertiary)] text-right">
           Last updated: {new Date(settings.companyName ? Date.now() : Date.now()).toLocaleDateString('en-IN')}
         </p>
       )}
     </div>
   );
 }

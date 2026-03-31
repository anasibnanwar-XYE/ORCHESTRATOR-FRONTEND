/**
 * SettingsPage — System Settings for the Admin portal (read-only)
 *
 * Displays global settings for informational purposes.
 * PUT /api/v1/admin/settings requires ROLE_SUPER_ADMIN per the backend contract
 * (global-security-settings-authorization). Tenant admins cannot persist mutations
 * through this surface.
 *
 * Sections:
 *  1. General — company name, timezone (from GET /api/v1/companies)
 *  2. Approvals — auto-approval, period lock, export approval
 *  3. Email — mail enabled, from address, base URL, credentials/reset flags
 *  4. Advanced — allowed origins, platform auth code
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
import { useAuth } from '@/context/AuthContext';
import type { SystemSettings, Company } from '@/types';

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

/** Display a boolean setting as Enabled / Disabled text */
function BooleanField({
  label,
  description,
  value,
}: {
  label: string;
  description?: string;
  value: boolean | undefined;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{label}</p>
        {description && (
          <p className="text-[12px] text-[var(--color-text-tertiary)]">{description}</p>
        )}
      </div>
      <span
        className={`text-[12px] font-medium ${
          value ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'
        }`}
      >
        {value ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// SettingsPage
// ─────────────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { session } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [settingsData, companies] = await Promise.all([
        adminApi.getSettings(),
        adminApi.getCompanies().catch(() => [] as Company[]),
      ]);
      setSettings(settingsData);
      // Find the current company by code, or fall back to first
      const code = session?.companyCode;
      const current = (code ? companies.find((c) => c.code === code) : null) ?? companies[0] ?? null;
      setCompany(current);
    } catch {
      setError("Couldn't load settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.companyCode]);

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

      {/* General — sourced from GET /api/v1/companies */}
      <SettingsSection title="General" description="Company information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Company Name</p>
            <p className="text-[13px] text-[var(--color-text-secondary)]">{company?.name ?? '—'}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Company Code</p>
            <p className="text-[13px] text-[var(--color-text-secondary)]">{company?.code ?? '—'}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Timezone</p>
            <p className="text-[13px] text-[var(--color-text-secondary)]">{company?.timezone ?? '—'}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Platform Auth Code</p>
            <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.platformAuthCode ?? '—'}</p>
          </div>
        </div>
      </SettingsSection>

      {/* Approvals */}
      <SettingsSection title="Approvals" description="Approval workflows and period locking">
        <div className="space-y-3">
          <BooleanField
            label="Auto-Approval"
            description="Automatically approve requests that meet criteria"
            value={s?.autoApprovalEnabled}
          />
          <BooleanField
            label="Period Lock"
            description="Prevent posting to closed accounting periods"
            value={s?.periodLockEnforced}
          />
          <BooleanField
            label="Export Approval Required"
            description="Require admin approval before data exports are generated"
            value={s?.exportApprovalRequired}
          />
        </div>
      </SettingsSection>

      {/* Email */}
      <SettingsSection title="Email" description="Outbound mail configuration">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">From Address</p>
            <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.mailFromAddress || '—'}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Base URL</p>
            <p className="text-[13px] text-[var(--color-text-secondary)]">{s?.mailBaseUrl || '—'}</p>
          </div>
        </div>
        <div className="space-y-3 pt-1">
          <BooleanField
            label="Mail Enabled"
            description="Transactional and alert emails to users"
            value={s?.mailEnabled}
          />
          <BooleanField
            label="Send Credentials"
            description="Email new account credentials to users on creation"
            value={s?.sendCredentials}
          />
          <BooleanField
            label="Send Password Reset"
            description="Email password reset links to users"
            value={s?.sendPasswordReset}
          />
        </div>
      </SettingsSection>

      {/* Advanced */}
      <SettingsSection title="Advanced" description="CORS and integration settings">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Allowed Origins</p>
          <p className="text-[13px] text-[var(--color-text-secondary)] break-all">
            {s?.allowedOrigins?.length ? s.allowedOrigins.join(', ') : '—'}
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}

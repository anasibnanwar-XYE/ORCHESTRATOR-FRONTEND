import { Switch } from '@headlessui/react';
import { FormEvent, useMemo, useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../lib/api';
import { logAuthContext, verifyAdminContext, getCurrentUserProfile } from '../lib/authDebug';
import { changePassword } from '../lib/profileApi';
import { getAdminSettings, updateAdminSettings, sendAdminNotification, type AdminSettings, type AdminNotifyRequest } from '../lib/adminApi';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveCard, ResponsiveButton, ResponsiveModal, FormInput, FormTextarea } from '../design-system';
import { Info } from 'lucide-react';

/** Inline badge shown next to toggles that have no backend support yet. */
function NotConfigurableBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-highlight px-2 py-0.5 text-[11px] font-medium text-tertiary">
      <Info className="h-3 w-3" />
      Not configurable in this version
    </span>
  );
}

type PasswordStatus = { state: 'idle' | 'loading' | 'success' | 'error'; message?: string };

export default function SettingsPage() {
  const { session, user } = useAuth();
  // These local states are retained for UI display only; the values have no backend support yet.
  const [notificationsEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [justInTimeProvisioning] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus>({ state: 'idle' });
  const [authDebugInfo, setAuthDebugInfo] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [adminSettingsLoading, setAdminSettingsLoading] = useState(false);
  const [adminSettingsError, setAdminSettingsError] = useState<string | null>(null);
  const [adminSettingsSaving, setAdminSettingsSaving] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyForm, setNotifyForm] = useState<AdminNotifyRequest>({ to: '', subject: '', body: '' });
  const [notifySending, setNotifySending] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.some(r => r.toLowerCase().includes('admin'));

  const passwordMismatch = useMemo(
    () => passwordForm.newPassword.length > 0 && passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword,
    [passwordForm]
  );

  useEffect(() => {
    if (isAdmin && session) {
      loadAdminSettings();
    }
  }, [isAdmin, session]);

  const loadAdminSettings = async () => {
    if (!session) return;
    setAdminSettingsLoading(true);
    setAdminSettingsError(null);
    try {
      const settings = await getAdminSettings(session);
      setAdminSettings(settings as AdminSettings);
    } catch (err) {
      setAdminSettingsError(err instanceof Error ? err.message : 'Failed to load admin settings');
    } finally {
      setAdminSettingsLoading(false);
    }
  };

  const handleAdminSettingsUpdate = async (updates: Partial<AdminSettings>) => {
    if (!session || !adminSettings) return;
    setAdminSettingsSaving(true);
    setAdminSettingsError(null);
    try {
      const updated = await updateAdminSettings(updates, session);
      setAdminSettings(updated as AdminSettings);
    } catch (err) {
      setAdminSettingsError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setAdminSettingsSaving(false);
    }
  };

  const handleSendNotification = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!notifyForm.to || !notifyForm.subject || !notifyForm.body) {
      setNotifyError('All fields are required');
      return;
    }
    setNotifySending(true);
    setNotifyError(null);
    setNotifySuccess(false);
    try {
      await sendAdminNotification(notifyForm, session);
      setNotifySuccess(true);
      setNotifyForm({ to: '', subject: '', body: '' });
      setTimeout(() => {
        setNotifyModalOpen(false);
        setNotifySuccess(false);
      }, 2000);
    } catch (err) {
      setNotifyError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setNotifySending(false);
    }
  };

  const handleDebugAuth = async () => {
    if (!session) return;
    setDebugLoading(true);
    try {
      await logAuthContext(session);
      const verification = await verifyAdminContext(session);
      const profile = await getCurrentUserProfile(session);
      setAuthDebugInfo({
        verification,
        profile,
        session: {
          companyCode: session.companyCode,
          displayName: session.displayName,
          hasToken: !!session.accessToken,
        },
      });
    } catch (error) {
      setAuthDebugInfo({
        error: error instanceof Error ? error.message : 'Failed to debug auth context',
      });
    } finally {
      setDebugLoading(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordMismatch) {
      setPasswordStatus({ state: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordStatus({ state: 'error', message: 'Please fill in all password fields.' });
      return;
    }
    if (passwordForm.newPassword.length < 10) {
      setPasswordStatus({ state: 'error', message: 'Password must be at least 10 characters long.' });
      return;
    }
    if (!session) {
      setPasswordStatus({ state: 'error', message: 'Session unavailable. Please sign in again.' });
      return;
    }
    setPasswordStatus({ state: 'loading' });
    try {
      await changePassword(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        },
        session
      );
      setPasswordStatus({ state: 'success', message: 'Password updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message =
        (error instanceof Error && error.message) || "We couldn't update your password right now. Please try again.";
      setPasswordStatus({ state: 'error', message });
    }
  };

  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6 sm:space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-tertiary">Configuration</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-primary truncate">Settings</h2>
        <p className="text-sm text-secondary">Manage authentication, notifications, and system configuration.</p>
      </header>

      <ResponsiveGrid cols={{ mobile: 1, desktop: 2 }}>
        <ResponsiveCard title="Authentication" subtitle="Security posture">
          <div className="space-y-5 text-sm text-secondary">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary">Session timeout</p>
                <p className="text-xs text-tertiary">Current: {sessionTimeout} minutes</p>
                <NotConfigurableBadge />
              </div>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                disabled
                className="w-full sm:w-auto rounded-lg border border-border bg-background px-4 py-2 text-sm text-primary opacity-50 cursor-not-allowed touch-manipulation"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary">Just-in-time provisioning</p>
                <p className="text-xs text-tertiary">Auto-create users after SSO</p>
                <NotConfigurableBadge />
              </div>
              <Switch
                checked={justInTimeProvisioning}
                onChange={() => undefined}
                disabled
                className={clsx(
                  'inline-flex h-7 w-14 items-center rounded-full border transition opacity-50 cursor-not-allowed',
                  justInTimeProvisioning ? 'border-action-bg bg-action-bg' : 'border-border bg-surface-highlight'
                )}
              >
                <span className="sr-only">Toggle JIT</span>
                <span className={clsx('inline-block h-6 w-6 rounded-full bg-action-text shadow transition', justInTimeProvisioning ? 'translate-x-7' : 'translate-x-1')} />
              </Switch>
            </div>
            <div className="rounded-lg border border-border bg-surface-highlight p-4 text-xs text-secondary">
              <p className="font-medium text-primary">Guardrails</p>
              <p className="mt-2">
                Persist via <code className="text-primary">/api/v1/admin/users</code> and <code className="text-primary">/api/v1/admin/users/{'{id}'}</code>.
              </p>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard title="Alerts & escalations" subtitle="Notifications">
          <div className="space-y-5 text-sm text-secondary">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary">Realtime alerts</p>
                <p className="text-xs text-tertiary">Push escalations when service health degrades.</p>
                <NotConfigurableBadge />
              </div>
              <Switch
                checked={notificationsEnabled}
                onChange={() => undefined}
                disabled
                className={clsx(
                  'inline-flex h-7 w-14 items-center rounded-full border transition opacity-50 cursor-not-allowed',
                  notificationsEnabled ? 'border-action-bg bg-action-bg' : 'border-border bg-surface-highlight'
                )}
              >
                <span className="sr-only">Toggle alerts</span>
                <span className={clsx('inline-block h-6 w-6 rounded-full bg-action-text shadow transition', notificationsEnabled ? 'translate-x-7' : 'translate-x-1')} />
              </Switch>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-tertiary">Delivery channels</p>
              <div className="mt-2 rounded-lg border border-border bg-surface-highlight p-3 text-xs text-tertiary">
                <NotConfigurableBadge />
                <p className="mt-2">Delivery channel preferences (Email, Slack, PagerDuty) are not configurable in this version.</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-highlight p-4 text-xs text-secondary">
              <p className="font-medium text-primary">Subscription tips</p>
              <p className="mt-2">Persist preferences via <code className="text-primary">/api/v1/admin/users/{'{id}'}</code>.</p>
            </div>
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      <ResponsiveGrid cols={{ mobile: 1, desktop: 2 }}>
        <ResponsiveCard title="Change password" subtitle="Account security">
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <FormInput
              label="CURRENT PASSWORD"
              type="password"
              required
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="••••••••"
            />
            <FormInput
              label="NEW PASSWORD"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Use at least 10 characters"
              error={passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 10 ? 'Password must be at least 10 characters long' : undefined}
            />
            <FormInput
              label="CONFIRM PASSWORD"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Repeat new password"
              error={passwordMismatch ? 'Passwords do not match.' : undefined}
            />

            <ResponsiveButton
              type="submit"
              disabled={passwordStatus.state === 'loading'}
              fullWidth
            >
              {passwordStatus.state === 'loading' ? 'Updating...' : 'Update password'}
            </ResponsiveButton>
            
            {passwordStatus.state !== 'idle' && passwordStatus.message && (
              <p
                className={clsx(
                  'rounded-lg px-4 py-3 text-xs font-medium border border-transparent',
                  passwordStatus.state === 'success'
                    ? 'bg-status-success-bg text-status-success-text'
                    : 'bg-status-error-bg text-status-error-text'
                )}
              >
                {passwordStatus.message}
              </p>
            )}
            <p className="text-xs text-tertiary">
              Requests are routed to <code className="text-primary">{getApiUrl('/api/v1/auth/password/change')}</code>.
            </p>
          </form>
        </ResponsiveCard>

        {isAdmin && (
          <ResponsiveCard title="Authentication Context" subtitle="Debug Tools">
            <div className="space-y-4 text-sm text-secondary">
              <p className="text-xs text-tertiary">
                Verify your token context, roles, and company assignments. Use this to debug admin API call failures.
              </p>
              <ResponsiveButton
                type="button"
                variant="secondary"
                onClick={handleDebugAuth}
                disabled={debugLoading || !session}
                fullWidth
              >
                {debugLoading ? 'Checking...' : 'Verify Admin Context'}
              </ResponsiveButton>

              {authDebugInfo && (
                <div className="space-y-3 rounded-lg border border-border bg-surface-highlight p-4 text-xs">
                  {authDebugInfo.error ? (
                    <div className="text-status-error-text">{authDebugInfo.error}</div>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold text-primary mb-2">Token Verification:</p>
                        <div className={clsx(
                          'rounded-lg border p-3 border-transparent',
                          authDebugInfo.verification?.isValid
                            ? 'bg-status-success-bg text-status-success-text'
                            : 'bg-status-error-bg text-status-error-text'
                        )}>
                          <p className="font-medium">
                            {authDebugInfo.verification?.isValid ? 'Valid' : 'Invalid'}
                          </p>
                          <p className="mt-1">Has Admin Role: {authDebugInfo.verification?.hasAdminRole ? 'Yes' : 'No'}</p>
                          <p>Has Company Access: {authDebugInfo.verification?.hasCompanyAccess ? 'Yes' : 'No'}</p>
                          {authDebugInfo.verification?.errors?.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Issues:</p>
                              {authDebugInfo.verification.errors.map((err: string, idx: number) => (
                                <p key={idx} className="text-xs">• {err}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold text-primary mb-2">User Profile (/api/v1/auth/me):</p>
                        <div className="rounded-lg border border-border bg-background p-3 space-y-1 font-mono text-xs">
                          <p className="text-primary">Email: {authDebugInfo.profile?.email}</p>
                          <p className="text-primary">Company ID: {authDebugInfo.profile?.companyId || 'N/A'}</p>
                          <p className="text-primary">Roles: {authDebugInfo.profile?.roles?.join(', ') || 'None'}</p>
                          <p className="text-primary">Permissions: {authDebugInfo.profile?.permissions?.join(', ') || 'None'}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold text-primary mb-2">Session:</p>
                        <div className="rounded-lg border border-border bg-background p-3 space-y-1 font-mono text-xs">
                          <p className="text-primary">Company Code: {authDebugInfo.session?.companyCode || 'N/A'}</p>
                          <p className="text-primary">Display Name: {authDebugInfo.session?.displayName || 'N/A'}</p>
                          <p className="text-primary">Has Token: {authDebugInfo.session?.hasToken ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      <p className="text-xs text-tertiary pt-2 border-t border-border">
                        Check the browser console for detailed debug logs.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </ResponsiveCard>
        )}
      </ResponsiveGrid>

      {isAdmin && (
        <section className="space-y-6">
          <ResponsiveCard
            title="Admin Settings"
            subtitle="Runtime Configuration"
            actions={
              <ResponsiveButton
                size="sm"
                onClick={() => setNotifyModalOpen(true)}
              >
                Send Notification
              </ResponsiveButton>
            }
          >
            {adminSettingsLoading ? (
              <div className="py-8 text-center text-sm text-tertiary">Loading settings...</div>
            ) : adminSettingsError ? (
              <div className="rounded-lg border border-transparent bg-status-error-bg p-4 text-sm text-status-error-text">
                {adminSettingsError}
              </div>
            ) : adminSettings ? (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary">Security & Access</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary">Order Auto-Approval</p>
                          <p className="text-xs text-tertiary">Automatically approve orders without manual review</p>
                        </div>
                        <Switch
                          checked={adminSettings.autoApprovalEnabled ?? false}
                          onChange={(checked) => handleAdminSettingsUpdate({ autoApprovalEnabled: checked })}
                          disabled={adminSettingsSaving}
                          className={clsx(
                            'inline-flex h-7 w-14 items-center rounded-full border transition',
                            adminSettings.autoApprovalEnabled
                              ? 'border-action-bg bg-action-bg'
                              : 'border-border bg-surface-highlight'
                          )}
                        >
                          <span className={clsx('inline-block h-6 w-6 rounded-full bg-action-text shadow transition', adminSettings.autoApprovalEnabled ? 'translate-x-7' : 'translate-x-1')} />
                        </Switch>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary">Period Lock Enforcement</p>
                          <p className="text-xs text-tertiary">Enforce accounting period locks</p>
                        </div>
                        <Switch
                          checked={adminSettings.periodLockEnforced ?? false}
                          onChange={(checked) => handleAdminSettingsUpdate({ periodLockEnforced: checked })}
                          disabled={adminSettingsSaving}
                          className={clsx(
                            'inline-flex h-7 w-14 items-center rounded-full border transition',
                            adminSettings.periodLockEnforced
                              ? 'border-action-bg bg-action-bg'
                              : 'border-border bg-surface-highlight'
                          )}
                        >
                          <span className={clsx('inline-block h-6 w-6 rounded-full bg-action-text shadow transition', adminSettings.periodLockEnforced ? 'translate-x-7' : 'translate-x-1')} />
                        </Switch>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary">Email Configuration</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary">Email Enabled</p>
                          <p className="text-xs text-tertiary">Enable email notifications</p>
                        </div>
                        <Switch
                          checked={adminSettings.mailEnabled ?? false}
                          onChange={(checked) => handleAdminSettingsUpdate({ mailEnabled: checked })}
                          disabled={adminSettingsSaving}
                          className={clsx(
                            'inline-flex h-7 w-14 items-center rounded-full border transition',
                            adminSettings.mailEnabled
                              ? 'border-action-bg bg-action-bg'
                              : 'border-border bg-surface-highlight'
                          )}
                        >
                          <span className={clsx('inline-block h-6 w-6 rounded-full bg-action-text shadow transition', adminSettings.mailEnabled ? 'translate-x-7' : 'translate-x-1')} />
                        </Switch>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary">Send Credentials</p>
                          <p className="text-xs text-tertiary">Send credentials via email</p>
                        </div>
                        <Switch
                          checked={adminSettings.sendCredentials ?? false}
                          onChange={(checked) => handleAdminSettingsUpdate({ sendCredentials: checked })}
                          disabled={adminSettingsSaving}
                          className={clsx(
                            'inline-flex h-7 w-14 items-center rounded-full border transition',
                            adminSettings.sendCredentials
                              ? 'border-action-bg bg-action-bg'
                              : 'border-border bg-surface-highlight'
                          )}
                        >
                          <span className={clsx('inline-block h-6 w-6 rounded-full bg-action-text shadow transition', adminSettings.sendCredentials ? 'translate-x-7' : 'translate-x-1')} />
                        </Switch>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary">Send Password Reset</p>
                          <p className="text-xs text-tertiary">Send password reset emails</p>
                        </div>
                        <Switch
                          checked={adminSettings.sendPasswordReset ?? false}
                          onChange={(checked) => handleAdminSettingsUpdate({ sendPasswordReset: checked })}
                          disabled={adminSettingsSaving}
                          className={clsx(
                            'inline-flex h-7 w-14 items-center rounded-full border transition',
                            adminSettings.sendPasswordReset
                              ? 'border-action-bg bg-action-bg'
                              : 'border-border bg-surface-highlight'
                          )}
                        >
                          <span className={clsx('inline-block h-6 w-6 rounded-full bg-action-text shadow transition', adminSettings.sendPasswordReset ? 'translate-x-7' : 'translate-x-1')} />
                        </Switch>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border pt-6">
                  <h4 className="text-sm font-semibold text-primary">Email Settings</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="From Address"
                      type="email"
                      value={adminSettings.mailFromAddress || ''}
                      onChange={(e) => handleAdminSettingsUpdate({ mailFromAddress: e.target.value })}
                      disabled={adminSettingsSaving}
                      placeholder="noreply@example.com"
                    />
                    <FormInput
                      label="Base URL"
                      type="url"
                      defaultValue={adminSettings.mailBaseUrl || ''}
                      onBlur={(e) => handleAdminSettingsUpdate({ mailBaseUrl: e.target.value })}
                      disabled={adminSettingsSaving}
                      placeholder="https://app.example.com"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-border pt-6">
                  <h4 className="text-sm font-semibold text-primary">CORS Configuration</h4>
                  <FormInput
                    label="Allowed Origins (comma-separated)"
                    type="text"
                    defaultValue={adminSettings.allowedOrigins?.join(', ') || ''}
                    onBlur={(e) => {
                      const origins = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      handleAdminSettingsUpdate({ allowedOrigins: origins });
                    }}
                    disabled={adminSettingsSaving}
                    placeholder="https://app.example.com, https://admin.example.com"
                  />
                </div>

                {adminSettingsSaving && (
                  <div className="text-xs text-tertiary">Saving...</div>
                )}
              </div>
            ) : null}
          </ResponsiveCard>
        </section>
      )}

      {/* Notification Modal */}
      <ResponsiveModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        title="Send Notification"
        size="md"
        footer={
           <>
              <ResponsiveButton
                variant="secondary"
                onClick={() => setNotifyModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </ResponsiveButton>
              <ResponsiveButton
                type="submit"
                disabled={notifySending}
                className="flex-1"
                onClick={handleSendNotification}
              >
                {notifySending ? 'Sending...' : 'Send'}
              </ResponsiveButton>
           </>
        }
      >
            <form onSubmit={handleSendNotification} className="space-y-4">
              {notifyError && (
                <div className="rounded-lg border border-transparent bg-status-error-bg p-3 text-sm text-status-error-text">
                  {notifyError}
                </div>
              )}
              {notifySuccess && (
                <div className="rounded-lg border border-transparent bg-status-success-bg p-3 text-sm text-status-success-text">
                  Notification sent successfully!
                </div>
              )}

              <FormInput
                label="To"
                type="email"
                required
                value={notifyForm.to}
                onChange={(e) => setNotifyForm({ ...notifyForm, to: e.target.value })}
                placeholder="recipient@example.com"
              />

              <FormInput
                label="Subject"
                type="text"
                required
                value={notifyForm.subject}
                onChange={(e) => setNotifyForm({ ...notifyForm, subject: e.target.value })}
                placeholder="Email subject"
              />

              <FormTextarea
                label="Body"
                required
                rows={6}
                value={notifyForm.body}
                onChange={(e) => setNotifyForm({ ...notifyForm, body: e.target.value })}
                placeholder="Email body content"
              />
            </form>
      </ResponsiveModal>

    </ResponsiveContainer>
  );
}

import { useEffect, useState } from 'react';
import { AcademicCapIcon, ClockIcon, FingerPrintIcon, MapPinIcon, ArrowDownTrayIcon, KeyIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import QRCode from 'qrcode';
import type { AuthenticatedUser } from '../types/auth';
import { type ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, changePassword, getCurrentUserProfile, type ProfileResponse, type UpdateProfileRequest, type ChangePasswordRequest, type MeResponse } from '../lib/profileApi';
import { setup as mfaSetup, activate as mfaActivate, disable as mfaDisable, type MfaSetupResponse } from '../lib/mfaApi';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveCard, ResponsiveButton, ResponsiveModal, PageHeader, FormInput } from '../design-system';
import { Badge } from '../components/ui/Badge'; // Keeping Badge for now as it's not in design-system yet

interface ProfilePageProps {
  user: AuthenticatedUser;
}

interface AuditEntry {
  id: string;
  action: string;
  channel: string;
  occurredAt: string;
}

interface ConnectedSystem {
  id: string;
  name: string;
  detail?: string;
  status?: string;
}

interface ProfileDetails extends ProfileResponse {
  title?: string;
  department?: string;
  location?: string;
  timezone?: string;
  lastLoginAt?: string;
  lastPasswordChangeAt?: string;
  roles?: string[];
  permissions?: string[];
  auditTrail?: AuditEntry[];
  systems?: ConnectedSystem[];
  recoveryCodes?: string[];
}

// MfaSetupResponse imported from mfaApi (generated model: { secret?, qrUri?, recoveryCodes? })
// Legacy field names (otpauthUri, otpAuthUri, manualKey) handled as fallbacks in consuming code

const interpretError = (error: unknown, fallback: string) => {
  if (!error || !(error instanceof Error)) {
    return fallback;
  }
  const status = (error as ApiError).status;
  const message = error.message?.trim() ?? '';
  const lower = message.toLowerCase();
  if (status === 401 || lower.includes('unauthorized') || lower.includes('unauthorised')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 400 || status === 422) {
    return 'We could not validate that request. Check the details and try again.';
  }
  if (typeof status === 'number' && status >= 500) {
    return "We're seeing an internal issue. Please try again shortly.";
  }
  return message || fallback;
};

const formatTimestamp = (value?: string) => {
  if (!value) return 'Not captured yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export default function ProfilePage({ user }: ProfilePageProps) {
  const { session } = useAuth();
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // MFA State
  const [showMfa, setShowMfa] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [enableLoading, setEnableLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupNotice, setSetupNotice] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  // Track whether MFA was successfully activated during this setup flow
  const [mfaActivatedThisSession, setMfaActivatedThisSession] = useState(false);

  const [showDisableMfa, setShowDisableMfa] = useState(false);
  const [disableMfaCode, setDisableMfaCode] = useState('');
  const [disableMfaRecoveryCode, setDisableMfaRecoveryCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [basicInfo, setBasicInfo] = useState<MeResponse | null>(null);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({
    displayName: '',
    preferredName: '',
    jobTitle: '',
    profilePictureUrl: '',
    phoneSecondary: '',
    secondaryEmail: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(null);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState<string | null>(null);

  const roles = basicInfo?.roles?.length ? basicInfo.roles : (profileDetails?.roles?.length ? profileDetails.roles! : user.roles);
  const permissions = basicInfo?.permissions?.length ? basicInfo.permissions : (profileDetails?.permissions?.length ? profileDetails.permissions! : user.permissions);
  const mfaEnabled = basicInfo?.mfaEnabled ?? (profileDetails?.mfaEnabled ?? user.mfaEnabled);
  const location = profileDetails?.location ?? 'Not provided';
  const timezone = profileDetails?.timezone ?? 'Not provided';
  const lastLogin = profileDetails?.lastLoginAt ? formatTimestamp(profileDetails.lastLoginAt) : 'Not captured yet';
  const lastPasswordChange = profileDetails?.lastPasswordChangeAt ? formatTimestamp(profileDetails.lastPasswordChangeAt) : 'Not captured yet';
  const auditTrail = profileDetails?.auditTrail ?? [];
  const systems = profileDetails?.systems ?? [];
  const hasCodes = recoveryCodes.length > 0;

  const isAdmin = roles.includes('admin') || roles.includes('ROLE_ADMIN') || permissions.includes('admin') || permissions.includes('*');

  // Restore pending MFA setup from sessionStorage (survives mobile app switching)
  useEffect(() => {
    if (!showMfa) {
      const pendingSecret = sessionStorage.getItem('mfa_pending_secret');
      const pendingUri = sessionStorage.getItem('mfa_pending_uri');
      const pendingCodes = sessionStorage.getItem('mfa_pending_codes');

      if (pendingSecret && pendingUri) {
        setSecret(pendingSecret);
        QRCode.toDataURL(pendingUri).then(setQrDataUrl);
        if (pendingCodes) {
          try {
            setRecoveryCodes(JSON.parse(pendingCodes));
          } catch (e) { /* ignore */ }
        }
        setShowMfa(true);
      }
    }
  }, []);

  const clearPendingMfa = () => {
    sessionStorage.removeItem('mfa_pending_secret');
    sessionStorage.removeItem('mfa_pending_uri');
    sessionStorage.removeItem('mfa_pending_codes');
  };

  const downloadCodes = (codes: string[], prefix: string) => {
    if (!codes.length) return;
    const blob = new Blob([codes.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${prefix}-recovery-codes.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!session) {
      return;
    }
    let cancelled = false;
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const basicInfoData = await getCurrentUserProfile(session);
        if (cancelled) return;
        setBasicInfo(basicInfoData);

        const data = await getProfile(session);
        if (cancelled) return;
        setProfileDetails({
          ...data,
          roles: basicInfoData.roles,
          permissions: basicInfoData.permissions,
        });
        
        setProfileForm({
          displayName: data.displayName || '',
          preferredName: data.preferredName || '',
          jobTitle: data.jobTitle || '',
          profilePictureUrl: data.profilePictureUrl || '',
          phoneSecondary: data.phoneSecondary || '',
          secondaryEmail: data.secondaryEmail || '',
        });
        if (Array.isArray((data as any).recoveryCodes)) {
          setRecoveryCodes((data as any).recoveryCodes);
        }
      } catch (error) {
        if (!cancelled) {
          setProfileError(interpretError(error, 'Unable to load profile details right now.'));
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [session, user.permissions, user.roles]);

  const handleStartEditProfile = () => {
    if (profileDetails) {
      setProfileForm({
        displayName: profileDetails.displayName || '',
        preferredName: profileDetails.preferredName || '',
        jobTitle: profileDetails.jobTitle || '',
        profilePictureUrl: profileDetails.profilePictureUrl || '',
        phoneSecondary: profileDetails.phoneSecondary || '',
        secondaryEmail: profileDetails.secondaryEmail || '',
      });
      setIsEditingProfile(true);
      setProfileUpdateError(null);
      setProfileUpdateSuccess(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setProfileUpdateError('Session unavailable. Please sign in again.');
      return;
    }
    if (!profileForm.displayName || profileForm.displayName.trim() === '') {
      setProfileUpdateError('Display name is required.');
      return;
    }
    setProfileSaving(true);
    setProfileUpdateError(null);
    setProfileUpdateSuccess(null);
    try {
      const updated = await updateProfile(profileForm, session);
      setProfileDetails((current) => (current ? { ...current, ...updated } : null));
      setIsEditingProfile(false);
      setProfileUpdateSuccess('Profile updated successfully.');
      setTimeout(() => setProfileUpdateSuccess(null), 3000);
    } catch (error) {
      setProfileUpdateError(interpretError(error, 'Failed to update profile. Please try again.'));
    } finally {
      setProfileSaving(false);
    }
  };

  const startMfaSetup = async () => {
    if (mfaEnabled) {
      setShowResetConfirm(true);
      return;
    }
    await doMfaSetup();
  };

  const doMfaSetup = async () => {
    setShowResetConfirm(false);
    setMfaActivatedThisSession(false);
    if (!session) {
      setSetupError('Session unavailable. Please sign in again.');
      return;
    }
    setSetupLoading(true);
    setSetupError(null);
    setSetupNotice(null);
    try {
      const payload = await mfaSetup();
      const uri = payload.qrUri ?? '';
      const manualKey = payload.secret ?? '';
      if (!uri || !manualKey) {
        throw new Error('The server did not return a valid MFA setup payload.');
      }
      
      // Persist in sessionStorage for mobile app switching (cleared on tab close)
      sessionStorage.setItem('mfa_pending_secret', manualKey);
      sessionStorage.setItem('mfa_pending_uri', uri);
      if (payload.recoveryCodes) {
        sessionStorage.setItem('mfa_pending_codes', JSON.stringify(payload.recoveryCodes));
      }

      const dataUrl = await QRCode.toDataURL(uri);
      setQrDataUrl(dataUrl);
      setSecret(manualKey);
      setRecoveryCodes(payload.recoveryCodes ?? []);
      setShowMfa(true);
    } catch (error) {
      setSetupError(interpretError(error, 'Failed to start MFA setup.'));
    } finally {
      setSetupLoading(false);
    }
  };

  const enableMfa = async () => {
    if (!session) {
      setSetupError('Session unavailable. Please sign in again.');
      return;
    }
    if (!verifyCode.trim()) {
      setSetupError('Enter the 6-digit code from your authenticator.');
      return;
    }
    setEnableLoading(true);
    setSetupError(null);
    try {
      await mfaActivate(verifyCode.trim());
      
      clearPendingMfa(); // Success! Clear storage
      setMfaActivatedThisSession(true);
      
      setShowMfa(false);
      setQrDataUrl(null);
      setSecret(null);
      setVerifyCode('');
      setProfileDetails((current) => (current ? { ...current, mfaEnabled: true } : current));
      setSetupNotice('Multi-factor authentication is now enabled.');
    } catch (error) {
      setSetupError(interpretError(error, 'Verification failed. Please try again.'));
    } finally {
      setEnableLoading(false);
    }
  };

  const disableMfa = async () => {
    if (!session) {
      setSetupError('Session unavailable. Please sign in again.');
      return;
    }
    if (!disableMfaCode.trim() && !disableMfaRecoveryCode.trim()) {
      setSetupError('Enter either the 6-digit code from your authenticator or a recovery code.');
      return;
    }
    setDisableLoading(true);
    setSetupError(null);
    try {
      await mfaDisable({
        code: disableMfaCode.trim() || undefined,
        recoveryCode: disableMfaRecoveryCode.trim() || undefined,
      });
      setShowDisableMfa(false);
      setDisableMfaCode('');
      setDisableMfaRecoveryCode('');
      setProfileDetails((current) => (current ? { ...current, mfaEnabled: false } : current));
      setBasicInfo((current) => (current ? { ...current, mfaEnabled: false } : current));
      setSetupNotice('Multi-factor authentication has been disabled.');
    } catch (error) {
      setSetupError(interpretError(error, 'Verification failed. Please check your code and try again.'));
    } finally {
      setDisableLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!session) {
      setPasswordError('Session unavailable. Please sign in again.');
      return;
    }
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 10) {
      setPasswordError('New password must be at least 10 characters long.');
      return;
    }
    setPasswordChanging(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await changePassword(passwordForm, session);
      setPasswordSuccess('Password changed successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (error) {
      setPasswordError(interpretError(error, 'Failed to change password. Please check your current password and try again.'));
    } finally {
      setPasswordChanging(false);
    }
  };

  return (
    <ResponsiveContainer maxWidth="full" className="space-y-10">
      <PageHeader
        title={profileDetails?.displayName || user.displayName}
        subtitle={user.email}
        eyebrow="Profile"
        actions={
          <ResponsiveButton onClick={handleStartEditProfile}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </ResponsiveButton>
        }
      />

      {profileUpdateSuccess && (
        <div className="rounded-2xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {profileUpdateSuccess}
        </div>
      )}

      {profileUpdateError && (
        <div className="rounded-2xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {profileUpdateError}
        </div>
      )}

      {profileError && (
        <p className="rounded-2xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {profileError}
        </p>
      )}

      <ResponsiveGrid cols={{ mobile: 1, desktop: 5 }} gap="lg">
        <div className="space-y-6 lg:col-span-3">
          <ResponsiveCard
            title="Enterprise entitlements"
            subtitle="Access footprint"
            actions={<AcademicCapIcon className="h-6 w-6 text-tertiary" />}
          >
              {profileLoading ? (
                <div className="space-y-3">
                  <div className="h-4 w-1/2 animate-pulse rounded-full bg-surface-highlight" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-surface-highlight" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm">
                  <div className="rounded-2xl border border-border bg-surface-highlight p-4">
                    <p className="text-xs uppercase tracking-widest text-secondary">Roles</p>
                    <p className="mt-2 text-primary truncate" title={roles.join(', ')}>{roles.length ? roles.join(', ') : 'No roles assigned'}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface-highlight p-4">
                    <p className="text-xs uppercase tracking-widest text-secondary">Permissions</p>
                    <p className="mt-2 text-primary truncate" title={permissions.join(', ')}>{permissions.length ? permissions.join(', ') : 'No permissions'}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface-highlight p-4">
                    <p className="text-xs uppercase tracking-widest text-secondary">Password Changed</p>
                    <p className="mt-2 text-primary truncate">{lastPasswordChange}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                  <MapPinIcon className="h-5 w-5 text-tertiary" />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-secondary">Operating region</p>
                    <p className="mt-1 text-primary">{location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                  <ClockIcon className="h-5 w-5 text-tertiary" />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-secondary">Local timezone</p>
                    <p className="mt-1 text-primary">{timezone}</p>
                    <p className="text-xs text-secondary">Last login: {lastLogin}</p>
                  </div>
                </div>
              </div>
          </ResponsiveCard>

          {/* Password Change Section */}
          <ResponsiveCard
            title="Password"
            subtitle="Security"
            actions={<KeyIcon className="h-6 w-6 text-tertiary" />}
          >
              <p className="text-sm text-secondary mb-4">
                Change your account password. Use a strong password with at least 10 characters.
              </p>
              <ResponsiveButton variant="secondary" onClick={() => {
                setShowPasswordChange(true);
                setPasswordError(null);
                setPasswordSuccess(null);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}>
                Change Password
              </ResponsiveButton>
          </ResponsiveCard>

          {isAdmin && (
            <ResponsiveCard
              title="Audit trail"
              subtitle="Recent account activity"
              actions={<FingerPrintIcon className="h-6 w-6 text-tertiary" />}
            >
                {profileLoading ? (
                  <p className="text-sm text-secondary">Loading activity...</p>
                ) : auditTrail.length ? (
                  <ul className="space-y-4 text-sm text-secondary">
                    {auditTrail.map((entry) => (
                      <li key={entry.id} className="rounded-2xl border border-border bg-surface-highlight px-4 py-3">
                        <p className="font-medium text-primary">{entry.action}</p>
                        <p className="text-xs text-tertiary">{entry.channel}</p>
                        <p className="text-xs text-tertiary">{formatTimestamp(entry.occurredAt)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-tertiary">No recent activity recorded.</p>
                )}
            </ResponsiveCard>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <ResponsiveCard
            title="Multi-factor authentication"
            subtitle="Adaptive security"
            actions={<FingerPrintIcon className="h-6 w-6 text-tertiary" />}
          >
              <p className="text-sm text-secondary mb-4">
                {mfaEnabled ? 'MFA is active for this account. Reset to issue a new secret and recovery set.' : 'Protect your account with an authenticator app or hardware key.'}
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-secondary">Status</span>
                <Badge variant={mfaEnabled ? 'success' : 'error'}>
                  {mfaEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex flex-col gap-3">
                {mfaEnabled ? (
                  <>
                    <ResponsiveButton variant="outline" fullWidth onClick={startMfaSetup} disabled={setupLoading}>
                      {setupLoading ? 'Preparing setup...' : 'Reset MFA'}
                    </ResponsiveButton>
                    <ResponsiveButton variant="danger" fullWidth onClick={() => {
                      setShowDisableMfa(true);
                      setSetupError(null);
                      setDisableMfaCode('');
                      setDisableMfaRecoveryCode('');
                    }} disabled={disableLoading}>
                      Turn Off MFA
                    </ResponsiveButton>
                  </>
                ) : (
                  <ResponsiveButton fullWidth onClick={startMfaSetup} disabled={setupLoading}>
                    {setupLoading ? 'Preparing setup...' : 'Set up MFA'}
                  </ResponsiveButton>
                )}
              </div>
              {setupNotice && (
                <p className="mt-4 rounded-2xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
                  {setupNotice}
                </p>
              )}
              {setupError && (
                <p className="mt-4 rounded-2xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
                  {setupError}
                </p>
              )}
          </ResponsiveCard>

          {/* Connected Systems */}
          {isAdmin && (
            <ResponsiveCard
              title="Downstream services"
              subtitle="Connected systems"
              actions={<AcademicCapIcon className="h-6 w-6 text-tertiary" />}
            >
                {profileLoading ? (
                  <p className="text-sm text-secondary">Loading system links...</p>
                ) : systems.length ? (
                  <ul className="space-y-3 text-sm text-secondary">
                    {systems.map((system) => (
                      <li key={system.id} className="rounded-2xl border border-border bg-surface-highlight px-4 py-3">
                        <p className="font-medium text-primary">{system.name}</p>
                        {system.detail && <p className="text-xs text-tertiary">{system.detail}</p>}
                        {system.status && <p className="text-xs text-tertiary">Status: {system.status}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-tertiary">No connected systems.</p>
                )}
            </ResponsiveCard>
          )}

          {hasCodes && !showMfa && mfaEnabled && (
            <ResponsiveCard padding="md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-secondary">Recovery codes</p>
                    <p className="text-sm text-secondary">Store these offline. Download anytime.</p>
                  </div>
                  <ResponsiveButton
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCodes(recoveryCodes, user.email.replace(/[@.]/g, '-'))}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Download
                  </ResponsiveButton>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-secondary">
                  {recoveryCodes.map((code) => (
                    <span key={`summary-${code}`} className="rounded-xl border border-border bg-surface-highlight px-3 py-2 text-center">
                      {code}
                    </span>
                  ))}
                </div>
            </ResponsiveCard>
          )}
        </div>
      </ResponsiveGrid>

      {/* Edit Profile Modal */}
      <ResponsiveModal
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        title="Edit Profile"
        size="md"
        footer={
          <>
            <ResponsiveButton variant="secondary" onClick={() => setIsEditingProfile(false)}>Cancel</ResponsiveButton>
            <ResponsiveButton onClick={handleSaveProfile as any} disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </ResponsiveButton>
          </>
        }
      >
        <form id="edit-profile-form" onSubmit={handleSaveProfile} className="space-y-4">
          <FormInput
            label="Display Name"
            required
            value={profileForm.displayName}
            onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
          />
          <FormInput
            label="Job Title"
            value={profileForm.jobTitle}
            onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
          />
          <FormInput
            label="Secondary Email"
            type="email"
            value={profileForm.secondaryEmail}
            onChange={(e) => setProfileForm({ ...profileForm, secondaryEmail: e.target.value })}
          />
          <FormInput
            label="Secondary Phone"
            type="tel"
            value={profileForm.phoneSecondary}
            onChange={(e) => setProfileForm({ ...profileForm, phoneSecondary: e.target.value })}
          />
        </form>
      </ResponsiveModal>

      {/* Change Password Modal */}
      <ResponsiveModal
        isOpen={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        title="Change Password"
        size="md"
        footer={
          <>
            <ResponsiveButton variant="secondary" onClick={() => setShowPasswordChange(false)}>Cancel</ResponsiveButton>
            <ResponsiveButton onClick={handlePasswordChange} disabled={passwordChanging || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}>
              {passwordChanging ? 'Changing...' : 'Change Password'}
            </ResponsiveButton>
          </>
        }
      >
        <div className="space-y-4">
          {passwordSuccess && (
            <div className="rounded-xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
              {passwordError}
            </div>
          )}

          <FormInput
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="Enter current password"
          />
          <FormInput
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="Enter new password (min 10 chars)"
          />
          <FormInput
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
          />
        </div>
      </ResponsiveModal>

      {/* Disable MFA Modal */}
      <ResponsiveModal
        isOpen={showDisableMfa}
        onClose={() => setShowDisableMfa(false)}
        title="Turn Off MFA"
        size="md"
        footer={
          <>
            <ResponsiveButton variant="secondary" onClick={() => setShowDisableMfa(false)}>Cancel</ResponsiveButton>
            <ResponsiveButton variant="danger" onClick={disableMfa} disabled={disableLoading}>
              {disableLoading ? 'Disabling...' : 'Turn Off MFA'}
            </ResponsiveButton>
          </>
        }
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-error-bg">
            <KeyIcon className="h-6 w-6 text-status-error-text" />
          </div>
          <p className="mt-2 text-sm text-secondary">
            Enter your authenticator code or recovery code to disable multi-factor authentication
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); disableMfa(); }}>
          <FormInput
            label="AUTHENTICATOR CODE"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={disableMfaCode}
            onChange={(e) => setDisableMfaCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
            placeholder="000000"
            className="text-center font-mono tracking-widest text-lg"
          />
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs font-medium uppercase tracking-wider text-tertiary">Or</span>
            </div>
          </div>

          <FormInput
            label="RECOVERY CODE"
            type="text"
            value={disableMfaRecoveryCode}
            onChange={(e) => setDisableMfaRecoveryCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14))}
            placeholder="ABCD-EFGH-IJKL"
            className="font-mono tracking-wider"
          />
        </form>
      </ResponsiveModal>

      {/* MFA Setup Modal */}
      <ResponsiveModal
        isOpen={showMfa}
        onClose={() => {
          setShowMfa(false);
          // If MFA was not activated during this setup flow, discard recovery codes
          if (!mfaActivatedThisSession) {
            setRecoveryCodes([]);
            setQrDataUrl(null);
            setSecret(null);
            setVerifyCode('');
            clearPendingMfa();
          }
        }}
        title="Set up MFA"
        size="md"
        footer={
          <>
            <ResponsiveButton variant="secondary" onClick={() => {
              setShowMfa(false);
              setVerifyCode('');
              setSetupError(null);
              clearPendingMfa();
              // If MFA was not activated during this setup flow, discard recovery codes
              if (!mfaActivatedThisSession) {
                setRecoveryCodes([]);
                setQrDataUrl(null);
                setSecret(null);
              }
            }}>Cancel</ResponsiveButton>
            <ResponsiveButton onClick={enableMfa} disabled={enableLoading || verifyCode.length !== 6}>
              {enableLoading ? 'Verifying...' : 'Enable MFA'}
            </ResponsiveButton>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-secondary text-center">Scan QR code or use manual key.</p>
            {qrDataUrl ? (
              <div className="p-4 bg-white rounded-xl border border-border"><img src={qrDataUrl} alt="QR" className="max-w-[12rem] w-full aspect-square" /></div>
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-dashed border-border text-tertiary">Generating...</div>
            )}
            
            {secret && (
              <div className="w-full space-y-2">
                <p className="text-xs uppercase tracking-widest text-secondary text-center">Manual Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-surface-highlight rounded-lg text-sm font-mono text-primary text-center break-all">{secret}</code>
                  <ResponsiveButton size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(secret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}>
                    {copiedSecret ? <><CheckIcon className="h-4 w-4 mr-1" /> Copied</> : 'Copy'}
                  </ResponsiveButton>
                </div>
              </div>
            )}
          </div>

          <FormInput
            label="Verify Code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
            placeholder="000000"
            className="text-center font-mono text-lg tracking-widest"
          />

          {setupError && (
            <p className="text-sm text-status-error-text text-center">{setupError}</p>
          )}
        </div>
      </ResponsiveModal>

      {/* MFA Reset Confirmation Modal */}
      <ResponsiveModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset MFA"
        size="sm"
        footer={
          <>
            <ResponsiveButton variant="secondary" onClick={() => setShowResetConfirm(false)}>Cancel</ResponsiveButton>
            <ResponsiveButton variant="danger" onClick={doMfaSetup}>
              Reset MFA
            </ResponsiveButton>
          </>
        }
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-warning-bg">
            <KeyIcon className="h-6 w-6 text-status-warning-text" />
          </div>
          <p className="text-sm text-secondary">
            Resetting MFA will invalidate your current authenticator pairing and recovery codes. You will need to set up a new authenticator.
          </p>
        </div>
      </ResponsiveModal>
    </ResponsiveContainer>
  );
}
/**
 * ProfilePage
 *
 * Features:
 *  - View and update profile fields (displayName, preferredName, jobTitle, email)
 *  - MFA setup: shows QR code (from qrUri), manual secret, and one-time recovery codes
 *    with required acknowledgement before the setup flow can be dismissed
 *  - MFA activate: enters TOTP code to confirm enrollment
 *  - MFA disable: supports both TOTP code and recovery code paths
 */

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Camera, ShieldCheck, ShieldOff, User as UserIcon, KeyRound, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/authApi';
import { resolveError } from '@/lib/error-resolver';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import type { MfaSetupResponse, Profile } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// MFA setup sub-section
// ─────────────────────────────────────────────────────────────────────────────

interface MfaSetupSectionProps {
  mfaEnabled: boolean;
  onMfaToggled: () => void;
}

function MfaSetupSection({ mfaEnabled, onMfaToggled }: MfaSetupSectionProps) {
  const toast = useToast();

  // Setup flow state
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [activationCode, setActivationCode] = useState('');
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [isActivateLoading, setIsActivateLoading] = useState(false);
  // Tracks whether user has acknowledged seeing the recovery codes
  const [recoveryCodesAcknowledged, setRecoveryCodesAcknowledged] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const activationInputRef = useRef<HTMLInputElement>(null);

  // Disable flow state
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableRecoveryCode, setDisableRecoveryCode] = useState('');
  const [useDisableRecovery, setUseDisableRecovery] = useState(false);
  const [isDisableLoading, setIsDisableLoading] = useState(false);
  const disableCodeInputRef = useRef<HTMLInputElement>(null);
  const disableRecoveryInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the active disable input when dialog opens
  useEffect(() => {
    if (showDisableDialog) {
      setTimeout(() => {
        const ref = useDisableRecovery ? disableRecoveryInputRef : disableCodeInputRef;
        ref.current?.focus();
      }, 50);
    }
  }, [showDisableDialog, useDisableRecovery]);

  const handleGenerateQr = async () => {
    setIsSetupLoading(true);
    try {
      const data = await authApi.setupMfa();
      setSetupData(data);
      setRecoveryCodesAcknowledged(false);
      setTimeout(() => activationInputRef.current?.focus(), 100);
    } catch (error) {
      const resolved = resolveError(error);
      toast.error(resolved.type === 'message' ? resolved.message : 'Failed to set up MFA');
    } finally {
      setIsSetupLoading(false);
    }
  };

  const handleActivate = async (e: FormEvent) => {
    e.preventDefault();
    if (!activationCode || isActivateLoading) return;
    // Recovery codes must be acknowledged before activation can proceed
    if (!recoveryCodesAcknowledged) {
      toast.error('Please save your recovery codes before activating MFA');
      return;
    }

    setIsActivateLoading(true);
    try {
      await authApi.activateMfa(activationCode);
      toast.success('MFA enabled', 'Two-factor authentication is now active.');
      setSetupData(null);
      setActivationCode('');
      setRecoveryCodesAcknowledged(false);
      onMfaToggled();
    } catch (error) {
      const resolved = resolveError(error);
      toast.error(resolved.type === 'message' ? resolved.message : 'Invalid code — check your authenticator and try again');
    } finally {
      setIsActivateLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret).then(() => {
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }).catch(() => {
      // Clipboard unavailable — user can select and copy manually
    });
  };

  const handleDisable = async () => {
    setIsDisableLoading(true);
    try {
      const request = useDisableRecovery
        ? { recoveryCode: disableRecoveryCode.trim() }
        : { code: disableCode };
      await authApi.disableMfa(request);
      toast.success('MFA disabled', 'Two-factor authentication has been turned off.');
      setShowDisableDialog(false);
      setDisableCode('');
      setDisableRecoveryCode('');
      setUseDisableRecovery(false);
      onMfaToggled();
    } catch (error) {
      const resolved = resolveError(error);
      toast.error(resolved.type === 'message' ? resolved.message : 'Failed to disable MFA — check your code and try again');
    } finally {
      setIsDisableLoading(false);
    }
  };

  const handleCloseDisableDialog = () => {
    if (isDisableLoading) return;
    setShowDisableDialog(false);
    setDisableCode('');
    setDisableRecoveryCode('');
    setUseDisableRecovery(false);
  };

  if (mfaEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)]">
          <div className="h-9 w-9 rounded-lg bg-[#10b981]/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={17} className="text-[#10b981]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              MFA is enabled
            </p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Your account is protected with two-factor authentication.
            </p>
          </div>
          <Badge variant="success" dot>Active</Badge>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ShieldOff />}
          onClick={() => setShowDisableDialog(true)}
        >
          Disable MFA
        </Button>

        {/* MFA disable dialog — code or recovery code */}
        {showDisableDialog && (
          <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
              onClick={handleCloseDisableDialog}
              style={{ animation: 'fadeIn 200ms ease-out forwards' }}
            />
            <div
              className="relative w-full max-w-sm bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] p-6"
              style={{
                boxShadow: '0 24px 80px -16px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.05)',
                animation: 'slideUp 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
              }}
            >
              <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                Disable two-factor authentication
              </h3>
              <p className="mt-2 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                Turning off MFA reduces your account security. Enter your current code to confirm.
              </p>

              {/* Toggle between TOTP and recovery code */}
              <div className="mt-4 space-y-3">
                {!useDisableRecovery ? (
                  <div>
                    <label
                      htmlFor="mfa-disable-code"
                      className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5"
                    >
                      Authenticator code
                    </label>
                    <input
                      ref={disableCodeInputRef}
                      id="mfa-disable-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={disableCode}
                      onChange={(e) =>
                        setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      disabled={isDisableLoading}
                      placeholder="000000"
                      className={clsx(
                        'w-full h-11 text-center text-[18px] font-mono tracking-[0.3em]',
                        'bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]',
                        'rounded-lg focus:outline-none focus:border-[var(--color-neutral-300)]',
                        'transition-all text-[var(--color-text-primary)]',
                        'placeholder:text-[var(--color-text-tertiary)]',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      data-testid="mfa-disable-code-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && disableCode.length === 6 && !isDisableLoading) {
                          void handleDisable();
                        }
                      }}
                    />
                    <p className="mt-1.5 text-[11px] text-[var(--color-text-tertiary)]">
                      Open your authenticator app and enter the current 6-digit code
                    </p>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="mfa-disable-recovery"
                      className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5"
                    >
                      Recovery code
                    </label>
                    <input
                      ref={disableRecoveryInputRef}
                      id="mfa-disable-recovery"
                      type="text"
                      autoComplete="off"
                      value={disableRecoveryCode}
                      onChange={(e) => setDisableRecoveryCode(e.target.value)}
                      disabled={isDisableLoading}
                      placeholder="xxxx-xxxx-xxxx"
                      className={clsx(
                        'w-full h-11 text-center text-[14px] font-mono tracking-wider',
                        'bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]',
                        'rounded-lg focus:outline-none focus:border-[var(--color-neutral-300)]',
                        'transition-all text-[var(--color-text-primary)]',
                        'placeholder:text-[var(--color-text-tertiary)]',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      data-testid="mfa-disable-recovery-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && disableRecoveryCode.trim() && !isDisableLoading) {
                          void handleDisable();
                        }
                      }}
                    />
                    <p className="mt-1.5 text-[11px] text-[var(--color-text-tertiary)]">
                      Each recovery code can only be used once
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setUseDisableRecovery((v) => !v);
                    setDisableCode('');
                    setDisableRecoveryCode('');
                    setTimeout(() => {
                      const ref = !useDisableRecovery ? disableRecoveryInputRef : disableCodeInputRef;
                      ref.current?.focus();
                    }, 50);
                  }}
                  disabled={isDisableLoading}
                  className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors disabled:opacity-50"
                >
                  {useDisableRecovery ? 'Use authenticator code instead' : 'Use a recovery code instead'}
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseDisableDialog}
                  disabled={isDisableLoading}
                  className="btn-secondary h-9 px-4 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep MFA enabled
                </button>
                <button
                  type="button"
                  onClick={() => { void handleDisable(); }}
                  disabled={
                    (useDisableRecovery ? !disableRecoveryCode.trim() : disableCode.length < 6) ||
                    isDisableLoading
                  }
                  className={clsx(
                    'h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-150',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300 active:scale-[0.98]',
                    ((useDisableRecovery ? !disableRecoveryCode.trim() : disableCode.length < 6) || isDisableLoading) &&
                      'opacity-60 pointer-events-none'
                  )}
                >
                  {isDisableLoading ? 'Disabling…' : 'Disable MFA'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)]">
        <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center shrink-0">
          <ShieldOff size={17} className="text-[var(--color-text-tertiary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
            MFA is not enabled
          </p>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            Enable two-factor authentication to improve your account security.
          </p>
        </div>
        <Badge variant="default">Disabled</Badge>
      </div>

      {!setupData ? (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ShieldCheck />}
          isLoading={isSetupLoading}
          onClick={handleGenerateQr}
        >
          Set up MFA
        </Button>
      ) : (
        <div className="space-y-4 p-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
            Scan with your authenticator app
          </p>

          {/* QR code rendered from otpauth:// URI */}
          <div className="flex justify-center">
            <div
              className="p-3 bg-white rounded-lg border border-[var(--color-border-default)] shadow-sm"
              data-testid="mfa-qr-code"
            >
              <QRCodeSVG
                value={setupData.qrUri}
                size={160}
                level="M"
              />
            </div>
          </div>

          {/* Manual entry secret */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
              Manual entry key
            </p>
            <div className="flex items-center gap-2">
              <p
                className="flex-1 font-mono text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded px-3 py-2 tracking-widest select-all min-w-0 break-all"
                data-testid="mfa-secret"
              >
                {setupData.secret}
              </p>
              <button
                type="button"
                onClick={handleCopySecret}
                className="shrink-0 h-9 w-9 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                aria-label="Copy secret"
              >
                {secretCopied ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Recovery codes — must acknowledge before activation */}
          <div>
            <p className="text-[12px] font-medium text-[var(--color-text-primary)] mb-1.5">
              Recovery codes
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)] mb-2">
              Save these backup codes somewhere safe. Each can only be used once.
            </p>
            <div
              className="grid grid-cols-2 gap-1 p-3 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]"
              data-testid="mfa-recovery-codes"
            >
              {setupData.recoveryCodes.map((c) => (
                <p key={c} className="font-mono text-[12px] text-[var(--color-text-primary)] tracking-wider">
                  {c}
                </p>
              ))}
            </div>

            {/* Required acknowledgement before activation */}
            <label className="mt-3 flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recoveryCodesAcknowledged}
                onChange={(e) => setRecoveryCodesAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-default)] accent-[var(--color-neutral-600)]"
                data-testid="mfa-recovery-ack-checkbox"
              />
              <span className="text-[12px] text-[var(--color-text-secondary)]">
                I have saved my recovery codes in a safe place
              </span>
            </label>
          </div>

          {/* Activation form */}
          <form onSubmit={handleActivate} className="space-y-3">
            <div>
              <label
                htmlFor="mfa-activate-code"
                className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                Enter verification code to activate
              </label>
              <input
                ref={activationInputRef}
                id="mfa-activate-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                value={activationCode}
                onChange={(e) =>
                  setActivationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                disabled={isActivateLoading}
                placeholder="000000"
                className="w-full h-9 px-3 text-center text-[16px] font-mono tracking-[0.3em] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-neutral-300)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                isLoading={isActivateLoading}
                disabled={activationCode.length < 6 || !recoveryCodesAcknowledged}
                title={!recoveryCodesAcknowledged ? 'Save your recovery codes first' : undefined}
              >
                Activate MFA
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSetupData(null);
                  setActivationCode('');
                  setRecoveryCodesAcknowledged(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ProfilePage
// ─────────────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    authApi
      .getProfile()
      .then((u) => {
        setProfile(u);
      })
      .catch(() => {
        toast.error('Failed to load profile');
      })
      .finally(() => setIsProfileLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile || isSaving) return;

    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        displayName: profile.displayName,
        preferredName: profile.preferredName,
        jobTitle: profile.jobTitle,
      });
      // Sync displayName back into the auth session user
      if (user) {
        updateUser({ ...user, displayName: updated.displayName });
      }
      toast.success('Profile updated');
    } catch (error) {
      const resolved = resolveError(error);
      toast.error(resolved.type === 'message' ? resolved.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMfaToggled = () => {
    // Refresh profile to reflect new mfaEnabled state
    authApi
      .getProfile()
      .then((p) => {
        setProfile(p);
        if (user) {
          updateUser({ ...user, mfaEnabled: p.mfaEnabled });
        }
      })
      .catch(() => {
        /* silent */
      });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
          Profile
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          Manage your account details and security settings
        </p>
      </div>

      {/* Profile section */}
      <section className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center">
            <UserIcon size={16} className="text-[var(--color-text-secondary)]" />
          </div>
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Personal information
          </h2>
        </div>

        {isProfileLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ) : profile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Display name"
              value={profile.displayName}
              onChange={(e) =>
                setProfile((prev) => prev ? { ...prev, displayName: e.target.value } : prev)
              }
              disabled={isSaving}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Preferred name"
                value={profile.preferredName ?? ''}
                onChange={(e) =>
                  setProfile((prev) => prev ? { ...prev, preferredName: e.target.value } : prev)
                }
                disabled={isSaving}
              />
              <Input
                label="Job title"
                value={profile.jobTitle ?? ''}
                onChange={(e) =>
                  setProfile((prev) => prev ? { ...prev, jobTitle: e.target.value } : prev)
                }
                disabled={isSaving}
              />
            </div>

            {/* Read-only fields */}
            {user && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                    Email
                  </p>
                  <p className="text-[13px] text-[var(--color-text-secondary)] font-medium">
                    {profile.email}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                    Roles
                  </p>
                  <p className="text-[13px] text-[var(--color-text-secondary)] font-medium">
                    {user.roles.join(', ')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" isLoading={isSaving}>
                Save changes
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            Could not load profile data.
          </p>
        )}
      </section>

      {/* MFA section */}
      <section className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center">
            <KeyRound size={16} className="text-[var(--color-text-secondary)]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              Two-factor authentication
            </h2>
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
              Add an extra layer of security to your account
            </p>
          </div>
        </div>

        {user ? (
          <MfaSetupSection
            mfaEnabled={profile?.mfaEnabled ?? user.mfaEnabled}
            onMfaToggled={handleMfaToggled}
          />
        ) : (
          <Skeleton className="h-16 w-full rounded-lg" />
        )}
      </section>

      {/* Password section */}
      <section className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center">
            <Camera size={16} className="text-[var(--color-text-secondary)]" />
          </div>
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Password
          </h2>
        </div>
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-4">
          To change your password, use the forgotten password flow — a secure
          reset link will be sent to your email.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => (window.location.href = '/forgot-password')}
        >
          Reset password
        </Button>
      </section>
    </div>
  );
}

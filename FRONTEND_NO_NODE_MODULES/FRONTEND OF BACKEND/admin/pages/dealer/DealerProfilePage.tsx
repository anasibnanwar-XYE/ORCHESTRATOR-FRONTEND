import { useEffect, useState } from 'react';
import { UserCircleIcon, KeyIcon, ShieldCheckIcon, BellIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { AuthenticatedUser } from '../../types/auth';
import { apiData, type ApiError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface DealerProfilePageProps {
  user: AuthenticatedUser;
}

interface DealerProfileDetails {
  dealerCode?: string;
  businessName?: string;
  contactPhone?: string;
  gstNumber?: string;
  lastPasswordChangeAt?: string;
  mfaEnabled: boolean;
}

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
  if (!value) return 'Not changed yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export default function DealerProfilePage({ user }: DealerProfilePageProps) {
  const { session } = useAuth();
  const [profileDetails, setProfileDetails] = useState<DealerProfileDetails | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const dealerCode = profileDetails?.dealerCode ?? 'DLR-XXXX';
  const businessName = profileDetails?.businessName ?? user.displayName;
  const mfaEnabled = profileDetails?.mfaEnabled ?? user.mfaEnabled;
  const lastPasswordChange = profileDetails?.lastPasswordChangeAt ? formatTimestamp(profileDetails.lastPasswordChangeAt) : 'Not changed yet';

  useEffect(() => {
    if (!session) {
      return;
    }
    let cancelled = false;
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const { getProfile } = await import('../../lib/profileApi');
        const data = await getProfile(session);
        if (cancelled) return;
        setProfileDetails(data);
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
  }, [session]);

  const handlePasswordChange = async () => {
    if (!session) {
      setPasswordError('Session unavailable. Please sign in again.');
      return;
    }

    // Validation
    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 10) {
      setPasswordError('Password must be at least 10 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const { changePassword } = await import('../../lib/profileApi');
      await changePassword(
        {
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        },
        session
      );

      setPasswordSuccess('Password changed successfully. Please use your new password on next login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);

      // Update last password change time
      setProfileDetails((current) =>
        current ? { ...current, lastPasswordChangeAt: new Date().toISOString() } : current
      );
    } catch (error) {
      setPasswordError(interpretError(error, 'Failed to change password. Please verify your current password and try again.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-primary">Profile & Settings</h1>
        <p className="mt-1 text-sm text-secondary">
          Manage your dealer account information and security settings
        </p>
      </div>

      {profileError && (
        <div className="rounded-2xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {profileError}
        </div>
      )}

      {passwordSuccess && (
        <div className="rounded-2xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {passwordSuccess}
        </div>
      )}

      {/* Basic Information */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="h-6 w-6 text-brand-500" />
          <h2 className="text-lg font-semibold text-primary">Basic Information</h2>
        </div>

        {profileLoading ? (
          <div className="mt-6 space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-surface-highlight" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-surface-highlight" />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Dealer Name
              </p>
              <p className="mt-1 text-sm text-primary">{businessName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Dealer Code
              </p>
              <p className="mt-1 text-sm font-mono font-semibold text-brand-600 dark:text-brand-400">
                {dealerCode}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Email Address
              </p>
              <p className="mt-1 text-sm text-primary">{user.email}</p>
            </div>
            {profileDetails?.contactPhone && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Contact Phone
                </p>
                <p className="mt-1 text-sm text-primary">{profileDetails.contactPhone}</p>
              </div>
            )}
            {profileDetails?.gstNumber && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  GST Number
                </p>
                <p className="mt-1 text-sm font-mono text-primary">{profileDetails.gstNumber}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Management */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <KeyIcon className="h-6 w-6 text-brand-500" />
          <h2 className="text-lg font-semibold text-primary">Password Management</h2>
        </div>

        <div className="mt-4 text-sm text-secondary">
          <p className="text-xs font-semibold uppercase tracking-wider text-tertiary">
            Last Password Change
          </p>
          <p className="mt-1 text-primary">{lastPasswordChange}</p>
        </div>

        {!showPasswordChange ? (
            <button
              type="button"
              onClick={() => {
                setShowPasswordChange(true);
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
              className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-400 touch-manipulation"
            >
              <KeyIcon className="h-4 w-4 flex-shrink-0" />
              <span>Change Password</span>
            </button>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={clsx(
                  'mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-primary transition focus:border-border-highlight focus:outline-none focus:ring-2 focus:ring-brand-400',
                  'dark:placeholder:text-tertiary'
                )}
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-secondary">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={clsx(
                  'mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-primary transition focus:border-border-highlight focus:outline-none focus:ring-2 focus:ring-brand-400',
                  'dark:placeholder:text-tertiary'
                )}
                placeholder="Enter new password (min 10 characters)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={clsx(
                  'mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-primary transition focus:border-border-highlight focus:outline-none focus:ring-2 focus:ring-brand-400',
                  'dark:placeholder:text-tertiary'
                )}
                placeholder="Confirm new password"
              />
            </div>

            {passwordError && (
              <div className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-status-error-text">
                {passwordError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className={clsx(
                  'w-full sm:flex-1 rounded-xl bg-brand-500 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white shadow transition touch-manipulation',
                  'enabled:hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {passwordLoading ? 'Changing Password...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChange(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError(null);
                }}
                disabled={passwordLoading}
                className="w-full sm:flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 sm:py-2 text-sm font-semibold text-primary hover:bg-surface-highlight dark:bg-surface dark:hover:bg-surface-highlight touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-6 w-6 text-brand-500" />
          <h2 className="text-lg font-semibold text-primary">Security Settings</h2>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">
              Multi-Factor Authentication
            </p>
            <p className="mt-1 text-xs text-secondary">
              {mfaEnabled ? 'MFA is enabled for your account' : 'Contact admin to enable MFA'}
            </p>
          </div>
          <div className={clsx(
            'rounded-full px-3 py-1 text-xs font-semibold',
            mfaEnabled
              ? 'bg-status-success-bg text-status-success-text'
              : 'bg-surface-highlight text-secondary'
          )}>
            {mfaEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <BellIcon className="h-6 w-6 text-brand-500" />
          <h2 className="text-lg font-semibold text-primary">Notification Preferences</h2>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <p className="text-secondary">
            Email notifications are sent for:
          </p>
          <ul className="space-y-2 text-primary">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Order status updates
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Payment confirmations
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              New promotions and offers
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Important account updates
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

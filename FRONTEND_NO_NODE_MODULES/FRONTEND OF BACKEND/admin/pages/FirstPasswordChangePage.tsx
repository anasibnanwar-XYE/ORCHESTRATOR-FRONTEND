import { FormEvent, useState } from 'react';
import { MoonIcon, SunIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { changePassword as apiChangePassword, login as apiLogin, extractAuthError } from '../lib/authApi';
import { OpenAPI } from '../lib/client/core/OpenAPI';
import type { LoginCredentials } from '../types/auth';

interface FirstPasswordChangePageProps {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  baseCredentials: Pick<LoginCredentials, 'email' | 'password' | 'companyCode'>;
  tempToken: string;
  onPasswordChanged: (newTokens: { accessToken: string; refreshToken: string }) => Promise<void>;
}

export default function FirstPasswordChangePage({
  theme,
  onThemeChange,
  baseCredentials,
  tempToken,
  onPasswordChanged,
}: FirstPasswordChangePageProps) {
  // Pre-fill current password with the temp password from credentials (for first-login users)
  const [currentPassword, setCurrentPassword] = useState(baseCredentials.password || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState({ current: false, new: false, confirm: false });
  const isDark = theme === 'dark';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Validation - current password is optional when mustChangePassword is true (backend skips check)
    // But we still send it if provided
    if (!newPassword || !confirmPassword) {
      setError('New password and confirmation are required');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters long');
      setLoading(false);
      return;
    }

    try {
      // Temporarily set the temp token so the generated client can authenticate the request
      const prevToken = OpenAPI.TOKEN;
      OpenAPI.TOKEN = tempToken;

      try {
        // Step 1: Change the password via the generated client
        await apiChangePassword({
          currentPassword: currentPassword || baseCredentials.password || '',
          newPassword,
          confirmPassword,
        });
      } finally {
        // Restore previous token regardless of outcome
        OpenAPI.TOKEN = prevToken;
      }

      // Step 2: Re-authenticate with the new password to get fresh tokens
      const authData = await apiLogin({
        email: baseCredentials.email,
        password: newPassword,
        companyCode: baseCredentials.companyCode,
      });

      if (!authData.accessToken || !authData.refreshToken) {
        throw new Error('Password changed successfully, but re-authentication failed. Please login again.');
      }

      // Step 3: Hand tokens to App.tsx to finalize the session
      await onPasswordChanged({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      });
    } catch (err) {
      setError(extractAuthError(err, 'Failed to change password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={clsx('min-h-screen w-full transition-colors duration-300', isDark ? 'dark' : 'light')}
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Change Your Password
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              You must change your password before continuing. Please choose a new password.
            </p>
          </div>

          {/* Password Change Card */}
          <div 
            className={clsx(
              'rounded-2xl border p-8 shadow-sm transition-all',
              isDark ? 'shadow-black/20' : 'shadow-zinc-200/50'
            )}
            style={isDark 
              ? { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }
              : { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }
            }
          >
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="currentPassword" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Current Password <span className="text-zinc-500 dark:text-zinc-500">(Optional - pre-filled)</span>
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={passwordVisible.current ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={clsx(
                      'block w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 pr-10',
                      isDark 
                        ? 'border-[var(--border-primary)] text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-700' 
                        : 'border-zinc-300 bg-white text-zinc-900 focus:border-zinc-400 focus:ring-zinc-200'
                    )}
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                    placeholder="Current password (optional for first login)"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible({ ...passwordVisible, current: !passwordVisible.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {passwordVisible.current ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={passwordVisible.new ? 'text' : 'password'}
                    required
                    minLength={10}
                    autoComplete="new-password"
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={clsx(
                      'block w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 pr-10',
                      isDark 
                        ? 'border-[var(--border-primary)] text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-700' 
                        : 'border-zinc-300 bg-white text-zinc-900 focus:border-zinc-400 focus:ring-zinc-200'
                    )}
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                    placeholder="Enter new password (min 10 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible({ ...passwordVisible, new: !passwordVisible.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {passwordVisible.new ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Password must be at least 10 characters long
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={passwordVisible.confirm ? 'text' : 'password'}
                    required
                    minLength={10}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={clsx(
                      'block w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 pr-10',
                      isDark 
                        ? 'border-[var(--border-primary)] text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-700' 
                        : 'border-zinc-300 bg-white text-zinc-900 focus:border-zinc-400 focus:ring-zinc-200'
                    )}
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible({ ...passwordVisible, confirm: !passwordVisible.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {passwordVisible.confirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  'relative flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70',
                  isDark 
                    ? 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] focus:ring-zinc-700 focus:ring-offset-[var(--bg-primary)]' 
                    : 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] focus:ring-zinc-900'
                )}
              >
                {loading && (
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {loading ? 'Updating Password...' : 'Update Password & Continue'}
              </button>
            </form>

            {error && (
              <div className={clsx(
                'mt-6 rounded-lg p-3 text-xs font-medium',
                'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
              )}>
                {error}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-center gap-4 text-zinc-500">
            <button
              type="button"
              onClick={() => onThemeChange(isDark ? 'light' : 'dark')}
              className="flex items-center gap-2 text-xs hover:text-zinc-900 dark:hover:text-zinc-300"
            >
              {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

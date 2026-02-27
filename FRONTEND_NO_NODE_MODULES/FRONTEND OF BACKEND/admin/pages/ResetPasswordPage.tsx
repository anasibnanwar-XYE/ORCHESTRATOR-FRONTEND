import { FormEvent, useState, useEffect } from 'react';
import { Moon, Sun, Eye, EyeOff, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { resetPassword as apiResetPassword, extractAuthError } from '../lib/authApi';

interface ResetPasswordPageProps {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  onBack?: () => void;
  /** Navigate to the forgot-password page so the user can request a new link */
  onForgotPassword?: () => void;
}

export default function ResetPasswordPage({ theme, onThemeChange, onBack, onForgotPassword }: ResetPasswordPageProps) {
  // Get token from URL query parameter (works outside router context)
  const getTokenFromUrl = () => {
    if (typeof window === 'undefined') return null;
    try {
      // Safely parse the URL to avoid decodeURI errors
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      const token = params.get('token');
      // If token exists, ensure it's properly decoded
      if (token) {
        try {
          // Try to decode if it's encoded, but don't fail if it's already decoded
          return decodeURIComponent(token);
        } catch {
          // If decode fails, return the token as-is (might already be decoded)
          return token;
        }
      }
      return null;
    } catch {
      // If URL parsing fails, try a simpler approach
      try {
        const search = window.location.search;
        if (!search) return null;
        const match = search.match(/[?&]token=([^&]+)/);
        if (match && match[1]) {
          try {
            return decodeURIComponent(match[1]);
          } catch {
            return match[1];
          }
        }
      } catch {
        // Last resort: return null
      }
      return null;
    }
  };

  const [token] = useState<string | null>(getTokenFromUrl());

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState({ new: false, confirm: false });
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!token) {
      setError('Invalid or missing reset token');
      setLoading(false);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
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
      await apiResetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      // Success - show message and navigate back after delay
      setSuccess(true);
      setTimeout(() => {
        if (onBack) {
          onBack();
        }
      }, 2000);
    } catch (err) {
      setError(extractAuthError(err, 'Failed to reset password. The token may be invalid or expired.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        className={clsx('min-h-screen w-full transition-colors duration-300 bg-background', isDark ? 'dark' : 'light')}
      >
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm transition-all text-center">
              <h2 className="text-xl font-semibold text-primary">Invalid Reset Link</h2>
              <p className="mt-2 text-sm text-secondary">
                The password reset link is invalid or missing. Please request a new one.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onBack) onBack();
                }}
                className="mt-6 w-full rounded-lg bg-[var(--action-primary-bg)] px-4 py-2.5 text-sm font-medium text-[var(--action-primary-text)] shadow-sm transition-all hover:bg-[var(--action-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--action-primary-bg)]/30"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx('min-h-screen w-full transition-colors duration-300 bg-background', isDark ? 'dark' : 'light')}
    >
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-primary">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Enter your new password below
            </p>
          </div>

          {/* Reset Password Card */}
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm transition-all">
            {success ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg">
                  <CheckCircle className="h-6 w-6 text-status-success-text" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    Password Reset Successful
                  </h3>
                  <p className="mt-2 text-sm text-secondary">
                    Your password has been reset. Redirecting to login...
                  </p>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="block text-xs font-medium text-secondary">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={passwordVisible.new ? 'text' : 'password'}
                      required
                      minLength={10}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-primary outline-none transition-all placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
                      placeholder="Enter new password (min 10 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible({ ...passwordVisible, new: !passwordVisible.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
                    >
                      {passwordVisible.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-tertiary">
                    Password must be at least 10 characters long
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-secondary">
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
                      className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-primary outline-none transition-all placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible({ ...passwordVisible, confirm: !passwordVisible.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
                    >
                      {passwordVisible.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex w-full items-center justify-center rounded-lg bg-[var(--action-primary-bg)] px-4 py-2.5 text-sm font-medium text-[var(--action-primary-text)] shadow-sm transition-all hover:bg-[var(--action-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--action-primary-bg)]/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading && (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}

            {error && (
              <div className="mt-6 rounded-lg bg-status-error-bg p-3 text-xs font-medium text-status-error-text">
                <p>{error}</p>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="mt-2 inline-flex items-center text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    Request a new link
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-center gap-4 text-secondary">
            <button
              type="button"
              onClick={() => onThemeChange(isDark ? 'light' : 'dark')}
              className="flex items-center gap-2 text-xs hover:text-primary transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

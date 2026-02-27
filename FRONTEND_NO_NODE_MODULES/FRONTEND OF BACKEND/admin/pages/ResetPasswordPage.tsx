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
    } catch (err) {
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
  
  const [token, setToken] = useState<string | null>(getTokenFromUrl());
  
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

      // Success - show message and redirect to login
      setSuccess(true);
      setTimeout(() => {
        if (onBack) {
          onBack();
        } else {
          window.location.href = '/login';
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
        className={clsx('min-h-screen w-full transition-colors duration-300', isDark ? 'dark' : 'light')}
      style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div 
              className={clsx(
                'rounded-2xl border p-8 shadow-sm transition-all text-center',
                isDark ? 'shadow-black/20' : 'shadow-zinc-200/50'
              )}
               style={isDark 
                 ? { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)' }
                 : { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }
               }
            >
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Invalid Reset Link</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                The password reset link is invalid or missing. Please request a new one.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    window.location.href = '/login';
                  }
                }}
                   className={clsx(
                     'mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                     isDark 
                       ? 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] focus:ring-zinc-700 focus:ring-offset-[var(--bg-primary)]' 
                       : 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] focus:ring-zinc-900'
                   )}
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
      className={clsx('min-h-screen w-full transition-colors duration-300', isDark ? 'dark' : 'light')}
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Enter your new password below
            </p>
          </div>

          {/* Reset Password Card */}
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
            {success ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Password Reset Successful
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Your password has been reset. Redirecting to login...
                  </p>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
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
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Password must be at least 10 characters long
                    </p>
                    <button
                      type="button"
                      onClick={() => setPasswordVisible({ ...passwordVisible, new: !passwordVisible.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {passwordVisible.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible({ ...passwordVisible, confirm: !passwordVisible.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {passwordVisible.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}

            {error && (
              <div className={clsx(
                'mt-6 rounded-lg p-3 text-xs font-medium',
                'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
              )}>
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
          <div className="flex items-center justify-center gap-4 text-zinc-500">
            <button
              type="button"
              onClick={() => onThemeChange(isDark ? 'light' : 'dark')}
              className="flex items-center gap-2 text-xs hover:text-zinc-900 dark:hover:text-zinc-300"
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

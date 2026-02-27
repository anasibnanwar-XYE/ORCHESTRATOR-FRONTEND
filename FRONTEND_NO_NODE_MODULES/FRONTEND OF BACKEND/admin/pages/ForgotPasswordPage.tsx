import { FormEvent, useState } from 'react';
import { Moon, Sun, Mail, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { forgotPassword as apiForgotPassword, forgotPasswordSuperadmin as apiForgotPasswordSuperadmin, extractAuthError } from '../lib/authApi';

interface ForgotPasswordPageProps {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  onBack: () => void;
  /** When true, calls the superadmin-specific forgot endpoint */
  isSuperadmin?: boolean;
}

export default function ForgotPasswordPage({ theme, onThemeChange, onBack, isSuperadmin = false }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSuperadminMode, setIsSuperadminMode] = useState(isSuperadmin);
  const isDark = theme === 'dark';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      if (isSuperadminMode) {
        await apiForgotPasswordSuperadmin(email.trim());
      } else {
        await apiForgotPassword(email.trim());
      }
      setSuccess(true);
    } catch (err) {
      // For forgot-password, ALWAYS show the generic success state to avoid
      // leaking account existence. Only surface errors for network/5xx failures.
      const errorMsg = extractAuthError(err, '');
      const is5xx = err && typeof err === 'object' && 'status' in err && (err as any).status >= 500;
      if (is5xx) {
        setError(errorMsg || 'Server error. Please try again later.');
      } else {
        // Non-5xx errors (404, 400, etc.) — still show success to prevent enumeration
        setSuccess(true);
      }
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
              <Mail className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Forgot Password
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Forgot Password Card */}
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
                  <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Check Your Email
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    If the email exists, a reset link has been sent.
                  </p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    Check your inbox and click the link to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onBack}
                   className={clsx(
                     'w-full rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                     isDark 
                       ? 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] focus:ring-zinc-700 focus:ring-offset-[var(--bg-primary)]' 
                       : 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] focus:ring-zinc-900'
                   )}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={clsx(
                      'block w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2',
                      isDark 
                        ? 'border-[var(--border-primary)] text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-700' 
                        : 'border-zinc-300 bg-white text-zinc-900 focus:border-zinc-400 focus:ring-zinc-200'
                    )}
                     style={{ backgroundColor: 'var(--bg-primary)' }}
                    placeholder="name@company.com"
                  />
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <input
                    id="superadmin-checkbox"
                    type="checkbox"
                    checked={isSuperadminMode}
                    onChange={(e) => setIsSuperadminMode(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-[var(--action-primary-bg)] focus:ring-[var(--action-primary-bg)] dark:border-zinc-600 dark:bg-zinc-800"
                  />
                  <label htmlFor="superadmin-checkbox" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    I am a Superadmin
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                   className={clsx(
                     'w-full rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
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
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  className="flex w-full items-center justify-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </button>
              </form>
            )}

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
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

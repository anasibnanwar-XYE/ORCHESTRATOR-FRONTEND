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
      const is5xx = err && typeof err === 'object' && 'status' in err && (err as { status: number }).status >= 500;
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
      className={clsx('min-h-screen w-full transition-colors duration-300 bg-background', isDark ? 'dark' : 'light')}
    >
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-highlight border border-border">
              <Mail className="h-8 w-8 text-secondary" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-primary">
              Forgot Password
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Forgot Password Card */}
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm transition-all">
            {success ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg">
                  <Mail className="h-6 w-6 text-status-success-text" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    Check Your Email
                  </h3>
                  <p className="mt-2 text-sm text-secondary">
                    If the email exists, a reset link has been sent.
                  </p>
                  <p className="mt-2 text-xs text-tertiary">
                    Check your inbox and click the link to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full rounded-lg bg-[var(--action-primary-bg)] px-4 py-2.5 text-sm font-medium text-[var(--action-primary-text)] shadow-sm transition-all hover:bg-[var(--action-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--action-primary-bg)]/30"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-secondary">
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition-all placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <input
                    id="superadmin-checkbox"
                    type="checkbox"
                    checked={isSuperadminMode}
                    onChange={(e) => setIsSuperadminMode(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-[var(--action-primary-bg)] focus:ring-[var(--action-primary-bg)]"
                  />
                  <label htmlFor="superadmin-checkbox" className="text-sm font-medium text-secondary cursor-pointer">
                    I am a Superadmin
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-lg bg-[var(--action-primary-bg)] px-4 py-2.5 text-sm font-medium text-[var(--action-primary-text)] shadow-sm transition-all hover:bg-[var(--action-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--action-primary-bg)]/30 disabled:cursor-not-allowed disabled:opacity-70"
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
                  className="flex w-full items-center justify-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </button>
              </form>
            )}

            {error && (
              <div className="mt-6 rounded-lg bg-status-error-bg p-3 text-xs font-medium text-status-error-text">
                {error}
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

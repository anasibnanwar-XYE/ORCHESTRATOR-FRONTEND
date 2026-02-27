import { FormEvent, useEffect, useState } from 'react';
import { MoonIcon, SunIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, CheckCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { AuthSuccess, LoginCredentials } from '../types/auth';
import { extractAuthError } from '../lib/authApi';

interface LoginPageProps {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  authenticate: (credentials: LoginCredentials) => Promise<AuthSuccess>;
  onAuthenticated: (result: AuthSuccess, credentials: LoginCredentials) => Promise<void>;
  onOpenAccessibility?: () => void;
  onForgotPassword?: () => void;
}

interface LoginFeedback {
  state: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

const initialForm: LoginCredentials = {
  email: '',
  password: '',
  companyCode: 'BBP',
  mfaCode: '',
  recoveryCode: '',
};

export default function LoginPage({ theme, onThemeChange, authenticate, onAuthenticated, onOpenAccessibility, onForgotPassword }: LoginPageProps) {
  const [form, setForm] = useState<LoginCredentials>(initialForm);
  const [feedback, setFeedback] = useState<LoginFeedback>({ state: 'idle' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bbp-orchestrator-remembered');
      if (saved) {
        const { email, companyCode } = JSON.parse(saved);
        setForm(prev => ({
          ...prev,
          email: email || prev.email,
          companyCode: companyCode || prev.companyCode,
        }));
        setRememberMe(true);
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback({ state: 'loading' });
    try {
      const payload: LoginCredentials = {
        email: form.email,
        password: form.password,
        companyCode: form.companyCode,
        mfaCode: form.mfaCode?.trim() || undefined,
        recoveryCode: form.recoveryCode?.trim() || undefined,
      };
      const result = await authenticate(payload);
      // Persist remember-me preference BEFORE any redirects (including mustChangePassword)
      if (rememberMe) {
        localStorage.setItem('bbp-orchestrator-remembered', JSON.stringify({
          email: payload.email,
          companyCode: payload.companyCode,
        }));
        localStorage.setItem('bbp-orchestrator-remember-session', 'true');
      } else {
        localStorage.removeItem('bbp-orchestrator-remembered');
        localStorage.removeItem('bbp-orchestrator-remember-session');
      }
      // Don't call onAuthenticated if password change is required - the step is already set
      if (result.mustChangePassword) {
        return;
      }
      await onAuthenticated(result, payload);
      setFeedback({ state: 'success', message: `Welcome back${result.displayName ? `, ${result.displayName}` : ''}!` });
    } catch (error) {
      // Password change is handled via App.tsx step management
      if (error instanceof Error && error.message.includes('Password change required')) {
        return;
      }
      // Network connectivity errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setFeedback({
          state: 'error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        });
        return;
      }
      // Backend errors — extractAuthError provides status-specific messages
      // (401 → invalid credentials, 403 → access denied, 404 → account not found,
      //  429 → rate limited, 500+ → server error)
      setFeedback({
        state: 'error',
        message: extractAuthError(error, 'Unable to sign in. Please check your credentials and try again.'),
      });
    }
  };

  const handleChange = (field: keyof LoginCredentials, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <div 
      className={clsx('min-h-screen w-full transition-colors duration-300', isDark ? 'dark' : 'light')}
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Header Logo */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              ORCHESTRATOR ERP
            </h2>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
              by SKEINA
            </p>
          </div>

          {/* Login Card */}
          <div 
            className={clsx(
              'rounded-2xl border p-8 shadow-sm transition-all',
              isDark 
                ? 'border-[var(--border-primary)] shadow-black/20' 
                : 'border-zinc-200 bg-white shadow-zinc-200/50'
            )}
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
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
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
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

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                     className={clsx(
                        'block w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 pr-10',
                        isDark 
                          ? 'border-[var(--border-primary)] text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-700' 
                          : 'border-zinc-300 bg-white text-zinc-900 focus:border-zinc-400 focus:ring-zinc-200'
                      )}
                      style={{ backgroundColor: 'var(--bg-primary)' }}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {passwordVisible ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

              <div className="space-y-1.5">
                <label htmlFor="companyCode" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Company Code
                </label>
                <input
                  id="companyCode"
                  type="text"
                  required
                  value={form.companyCode}
                  onChange={(e) => handleChange('companyCode', e.target.value)}
                  className={clsx(
                    'block w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 uppercase tracking-wider font-mono',
                    isDark
                      ? 'border-[var(--border-primary)] text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-700'
                      : 'border-zinc-300 bg-white text-zinc-900 focus:border-zinc-400 focus:ring-zinc-200'
                  )}
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                  placeholder="Company code"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-start gap-3 cursor-pointer select-none group"
                >
                  <div className="pt-px">
                    <div
                      className={clsx(
                        'h-[18px] w-[18px] rounded-[5px] border flex items-center justify-center transition-all duration-200 ease-out',
                        rememberMe
                          ? 'border-[var(--action-primary-bg)] bg-[var(--action-primary-bg)]'
                          : isDark
                            ? 'border-zinc-600 bg-transparent group-hover:border-zinc-400'
                            : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                      )}
                    >
                      <CheckIcon
                        className={clsx(
                          'h-3 w-3 transition-all duration-200 ease-out text-[var(--action-primary-text)]',
                          rememberMe ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        )}
                        strokeWidth={3}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={clsx(
                      'text-xs font-medium leading-tight transition-colors',
                      isDark ? 'text-zinc-300 group-hover:text-zinc-100' : 'text-zinc-700 group-hover:text-zinc-900'
                    )}>
                      Remember me
                    </span>
                    <span className={clsx(
                      'text-[10px] leading-tight mt-0.5',
                      isDark ? 'text-zinc-500' : 'text-zinc-400'
                    )}>
                      Stay signed in for 30 days
                    </span>
                  </div>
                </button>
              </div>

              <button
                type="submit"
                disabled={feedback.state === 'loading'}
                className={clsx(
                  'relative flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70',
                  isDark 
                     ? 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] focus:ring-zinc-700 focus:ring-offset-[var(--bg-primary)]' 
                     : 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] focus:ring-zinc-900'
                )}
              >
                {feedback.state === 'loading' && (
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {feedback.state === 'loading' ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (onForgotPassword) {
                      onForgotPassword();
                    }
                  }}
                  className={clsx(
                    'text-xs underline transition-colors',
                    isDark 
                      ? 'text-zinc-300 hover:text-zinc-100' 
                      : 'text-zinc-600 hover:text-zinc-900'
                  )}
                >
                  Forgot Password?
                </button>
              </div>
            </form>

            {feedback.message && (
              <div className={clsx(
                'mt-6 flex items-start gap-2.5 rounded-lg p-3 text-xs font-medium',
                feedback.state === 'success'
                  ? 'bg-status-success-bg text-status-success-text'
                  : 'bg-status-error-bg text-status-error-text'
              )}>
                {feedback.state === 'success'
                  ? <CheckCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  : <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                }
                <span>{feedback.message}</span>
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
            {onOpenAccessibility && (
              <>
                <span className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />
                <button
                  type="button"
                  onClick={onOpenAccessibility}
                  className="text-xs hover:text-zinc-900 dark:hover:text-zinc-300"
                >
                  Accessibility
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import { Moon, Sun, Eye, EyeOff, AlertTriangle, CheckCircle, Check } from 'lucide-react';
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
      className={clsx('min-h-screen w-full transition-colors duration-300 bg-background', isDark ? 'dark' : 'light')}
    >
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Header Logo */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-primary">
              ORCHESTRATOR ERP
            </h2>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-secondary">
              by SKEINA
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm transition-all">
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
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition-all placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-secondary">
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
                    className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-primary outline-none transition-all placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
                  >
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="companyCode" className="block text-xs font-medium text-secondary">
                  Company Code
                </label>
                <input
                  id="companyCode"
                  type="text"
                  required
                  value={form.companyCode}
                  onChange={(e) => handleChange('companyCode', e.target.value)}
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition-all placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20 uppercase tracking-wider font-mono"
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
                          : 'border-border bg-transparent group-hover:border-secondary'
                      )}
                    >
                      <Check
                        className={clsx(
                          'h-3 w-3 transition-all duration-200 ease-out text-[var(--action-primary-text)]',
                          rememberMe ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        )}
                        strokeWidth={3}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium leading-tight text-secondary group-hover:text-primary transition-colors">
                      Remember me
                    </span>
                    <span className="text-[10px] leading-tight mt-0.5 text-tertiary">
                      Stay signed in for 30 days
                    </span>
                  </div>
                </button>
              </div>

              <button
                type="submit"
                disabled={feedback.state === 'loading'}
                className="relative flex w-full items-center justify-center rounded-lg bg-[var(--action-primary-bg)] px-4 py-2.5 text-sm font-medium text-[var(--action-primary-text)] shadow-sm transition-all hover:bg-[var(--action-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--action-primary-bg)]/30 disabled:cursor-not-allowed disabled:opacity-70"
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
                  className="text-xs text-secondary underline transition-colors hover:text-primary"
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
                  ? <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                }
                <span>{feedback.message}</span>
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
            {onOpenAccessibility && (
              <>
                <span className="h-3 w-px bg-border" />
                <button
                  type="button"
                  onClick={onOpenAccessibility}
                  className="text-xs hover:text-primary transition-colors"
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

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Moon, Sun, ShieldCheck, Key, Lock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { LoginCredentials } from '../types/auth';

const MFA_STORAGE_KEY = 'bbp-orchestrator-mfa-pending';

interface MfaPageProps {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  baseCredentials: Pick<LoginCredentials, 'email' | 'password' | 'companyCode'>;
  onVerify: (mfaCode?: string, recoveryCode?: string) => Promise<void>;
  onBack: () => void;
}

export default function MfaPage({ theme, onThemeChange, baseCredentials, onVerify, onBack }: MfaPageProps) {
  const [mfaCode, setMfaCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = theme === 'dark';
  const formRef = useRef<HTMLFormElement>(null);

  // Persist non-sensitive context in sessionStorage for mobile app switching.
  // Password is intentionally excluded — if the browser kills the tab, the user re-enters it.
  useEffect(() => {
    if (baseCredentials.email && baseCredentials.companyCode) {
      try {
        sessionStorage.setItem(MFA_STORAGE_KEY, JSON.stringify({
          email: baseCredentials.email,
          companyCode: baseCredentials.companyCode,
          ts: Date.now(),
        }));
      } catch {
        // sessionStorage unavailable — state persists in React memory during normal app switching
      }
    }
  }, [baseCredentials]);

  // Auto-submit when exactly 6 digits are entered
  useEffect(() => {
    if (mfaCode.length === 6 && !loading && !error) {
      formRef.current?.requestSubmit();
    }
  }, [mfaCode, loading, error]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await onVerify(mfaCode.trim() || undefined, recoveryCode.trim() || undefined);
      sessionStorage.removeItem(MFA_STORAGE_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx('min-h-screen w-full transition-colors duration-500 bg-background', isDark ? 'dark' : 'light')}>
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="mx-auto relative">
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-surface border border-border shadow-sm mx-auto">
                <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-secondary" />
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-xs font-bold tracking-[0.2em] text-tertiary uppercase">
                ORCHESTRATOR ERP
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                Verify Your Identity
              </h1>
              <p className="mt-2 text-sm sm:text-base text-secondary leading-relaxed">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-border bg-surface shadow-sm transition-all duration-300 overflow-hidden">
            <div className="p-5 sm:p-6 md:p-8">
              {/* Account Context */}
              <div className="mb-6 rounded-xl border border-border bg-background px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-highlight">
                    <Lock className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-1 text-primary">
                      Verification Required
                    </p>
                    <div className="space-y-0.5 text-xs">
                      <p className="truncate text-secondary">
                        <span className="font-medium">Account:</span> {baseCredentials.email}
                      </p>
                      <p className="truncate text-secondary">
                        <span className="font-medium">Company:</span> {baseCredentials.companyCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
                {/* Authenticator Code */}
                <div className="space-y-2">
                  <label htmlFor="mfaCode" className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Key className="h-4 w-4" />
                    Authenticator Code
                  </label>
                  <input
                    id="mfaCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required={!recoveryCode}
                    autoComplete="one-time-code"
                    autoFocus
                    value={mfaCode}
                    onChange={(event) => {
                      const value = event.target.value.replace(/[^\d]/g, '').slice(0, 6);
                      setMfaCode(value);
                      setError(null);
                    }}
                    className={clsx(
                      'block w-full rounded-xl border-2 px-3 sm:px-4 py-3 sm:py-4 text-center text-xl sm:text-2xl font-mono tracking-[0.3em] sm:tracking-[0.5em] outline-none transition-all duration-200 focus:ring-4 focus:ring-offset-0 bg-background text-primary placeholder:text-tertiary',
                      error
                        ? 'border-status-error-text/50 bg-status-error-bg focus:border-status-error-text focus:ring-status-error-bg'
                        : 'border-border focus:border-[var(--border-focus)] focus:ring-[var(--border-focus)]/20'
                    )}
                    placeholder="000000"
                  />
                  <p className="text-xs text-tertiary">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                </div>

                {/* Divider */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-surface px-4 text-xs font-medium uppercase tracking-wider text-tertiary">
                      Or
                    </span>
                  </div>
                </div>

                {/* Recovery Code */}
                <div className="space-y-2">
                  <label htmlFor="recoveryCode" className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Key className="h-4 w-4 rotate-90" />
                    Recovery Code
                  </label>
                  <input
                    id="recoveryCode"
                    type="text"
                    required={!mfaCode}
                    autoComplete="off"
                    value={recoveryCode}
                    onChange={(event) => {
                      const value = event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14);
                      setRecoveryCode(value);
                      setError(null);
                    }}
                    className={clsx(
                      'block w-full rounded-xl border-2 px-3 sm:px-4 py-3 text-sm font-mono tracking-wider outline-none transition-all duration-200 focus:ring-4 focus:ring-offset-0 bg-background text-primary placeholder:text-tertiary',
                      error
                        ? 'border-status-error-text/50 bg-status-error-bg focus:border-status-error-text focus:ring-status-error-bg'
                        : 'border-border focus:border-[var(--border-focus)] focus:ring-[var(--border-focus)]/20'
                    )}
                    placeholder="ABCD-EFGH-IJKL"
                  />
                  <p className="text-xs text-tertiary">
                    Use a recovery code if you can't access your authenticator
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || (!mfaCode && !recoveryCode)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--action-primary-bg)] px-4 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-[var(--action-primary-text)] shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[var(--action-primary-bg)]/30 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] hover:bg-[var(--action-primary-hover)]"
                >
                  {loading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      <span>Verify &amp; Continue</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-xl border-2 border-status-error-text/30 bg-status-error-bg px-4 py-3 text-sm font-medium text-status-error-text">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Back */}
              <button
                type="button"
                onClick={onBack}
                className="mt-4 w-full rounded-xl border-2 border-border px-4 py-2.5 sm:py-3 text-sm font-semibold text-secondary transition-all duration-200 active:scale-[0.98] hover:border-border hover:text-primary hover:bg-surface-highlight"
              >
                &larr; Back to Login
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => onThemeChange(isDark ? 'light' : 'dark')}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-secondary transition-all duration-200 hover:text-primary hover:bg-surface-highlight"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

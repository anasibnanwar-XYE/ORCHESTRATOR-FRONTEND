import { FormEvent, useEffect, useRef, useState } from 'react';
import { MoonIcon, SunIcon, ShieldCheckIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';
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
    <div className={clsx('min-h-screen w-full transition-colors duration-500', isDark ? 'dark' : 'light')}>
      {/* Background */}
      <div className={clsx('fixed inset-0 z-0', isDark ? 'bg-zinc-950' : 'bg-zinc-50')}>
        {isDark ? (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="mx-auto relative">
              <div className={clsx(
                'relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl shadow-lg mx-auto',
                isDark
                  ? 'bg-gradient-to-br from-brand-600/20 to-purple-600/20 border border-brand-500/30'
                  : 'bg-gradient-to-br from-brand-100 to-purple-100 border border-brand-200/50'
              )}>
                <ShieldCheckIcon className={clsx(
                  'h-8 w-8 sm:h-10 sm:w-10',
                  isDark ? 'text-brand-400' : 'text-brand-600'
                )} />
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="font-brand text-xs font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                ORCHESTRATOR <span className="normal-case">ERP</span>
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Verify Your Identity
              </h1>
              <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </div>

          {/* Card */}
          <div className={clsx(
            'rounded-2xl sm:rounded-3xl border shadow-xl transition-all duration-300 overflow-hidden',
            isDark
              ? 'border-zinc-800/50 bg-zinc-900/90 shadow-zinc-950/50'
              : 'border-zinc-200/80 bg-white/95 shadow-zinc-200/30'
          )}>
            <div className="p-5 sm:p-6 md:p-8">
              {/* Account Context */}
              <div className={clsx(
                'mb-6 rounded-xl border px-4 py-3 sm:px-5 sm:py-4',
                isDark
                  ? 'border-brand-500/20 bg-brand-500/5'
                  : 'border-brand-200/50 bg-brand-50/60'
              )}>
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    isDark ? 'bg-brand-500/20' : 'bg-brand-100'
                  )}>
                    <LockClosedIcon className={clsx('h-5 w-5', isDark ? 'text-brand-400' : 'text-brand-600')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm font-semibold mb-1', isDark ? 'text-brand-300' : 'text-brand-700')}>
                      Verification Required
                    </p>
                    <div className="space-y-0.5 text-xs">
                      <p className={clsx('truncate', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                        <span className="font-medium">Account:</span> {baseCredentials.email}
                      </p>
                      <p className={clsx('truncate', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                        <span className="font-medium">Company:</span> {baseCredentials.companyCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
                {/* Authenticator Code */}
                <div className="space-y-2">
                  <label htmlFor="mfaCode" className={clsx(
                    'flex items-center gap-2 text-sm font-semibold',
                    isDark ? 'text-zinc-200' : 'text-zinc-700'
                  )}>
                    <KeyIcon className="h-4 w-4" />
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
                      'block w-full rounded-xl border-2 px-3 sm:px-4 py-3 sm:py-4 text-center text-xl sm:text-2xl font-mono tracking-[0.3em] sm:tracking-[0.5em] outline-none transition-all duration-200 focus:ring-4 focus:ring-offset-0',
                      error
                        ? isDark
                          ? 'border-rose-500/50 bg-rose-950/20 text-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
                        : isDark
                          ? 'border-zinc-700/50 bg-zinc-950/50 text-white focus:border-brand-500 focus:ring-brand-500/20'
                          : 'border-zinc-300 bg-white text-zinc-900 shadow-sm focus:border-brand-500 focus:ring-brand-500/20'
                    )}
                    placeholder="000000"
                  />
                  <p className={clsx('text-xs', isDark ? 'text-zinc-400' : 'text-zinc-500')}>
                    Open your authenticator app and enter the 6-digit code
                  </p>
                </div>

                {/* Divider */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className={clsx('w-full border-t', isDark ? 'border-zinc-800' : 'border-zinc-200')} />
                  </div>
                  <div className="relative flex justify-center">
                    <span className={clsx(
                      'px-4 text-xs font-medium uppercase tracking-wider',
                      isDark ? 'bg-zinc-900/90 text-zinc-500' : 'bg-white/95 text-zinc-400'
                    )}>
                      Or
                    </span>
                  </div>
                </div>

                {/* Recovery Code */}
                <div className="space-y-2">
                  <label htmlFor="recoveryCode" className={clsx(
                    'flex items-center gap-2 text-sm font-semibold',
                    isDark ? 'text-zinc-200' : 'text-zinc-700'
                  )}>
                    <KeyIcon className="h-4 w-4 rotate-90" />
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
                      'block w-full rounded-xl border-2 px-3 sm:px-4 py-3 text-sm font-mono tracking-wider outline-none transition-all duration-200 focus:ring-4 focus:ring-offset-0',
                      error
                        ? isDark
                          ? 'border-rose-500/50 bg-rose-950/20 text-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
                        : isDark
                          ? 'border-zinc-700/50 bg-zinc-950/50 text-white focus:border-brand-500 focus:ring-brand-500/20'
                          : 'border-zinc-300 bg-white text-zinc-900 shadow-sm focus:border-brand-500 focus:ring-brand-500/20'
                    )}
                    placeholder="ABCD-EFGH-IJKL"
                  />
                  <p className={clsx('text-xs', isDark ? 'text-zinc-400' : 'text-zinc-500')}>
                    Use a recovery code if you can't access your authenticator
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || (!mfaCode && !recoveryCode)}
                  className={clsx(
                    'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]',
                    isDark
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 focus:ring-brand-500/30 shadow-brand-500/20'
                      : 'bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 focus:ring-zinc-900/20 shadow-zinc-900/20'
                  )}
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
                      <ShieldCheckIcon className="h-5 w-5" />
                      <span>Verify & Continue</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error */}
              {error && (
                <div className={clsx(
                  'mt-4 rounded-xl border-2 px-4 py-3 text-sm font-medium',
                  isDark
                    ? 'border-rose-500/30 bg-rose-950/40 text-rose-300'
                    : 'border-rose-300 bg-rose-50 text-rose-800'
                )}>
                  <div className="flex items-start gap-2">
                    <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Back */}
              <button
                type="button"
                onClick={onBack}
                className={clsx(
                  'mt-4 w-full rounded-xl border-2 px-4 py-2.5 sm:py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98]',
                  isDark
                    ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-800/50'
                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-50'
                )}
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
              className={clsx(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              )}
            >
              {isDark ? (
                <>
                  <SunIcon className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <MoonIcon className="h-4 w-4" />
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

import { FormEvent, useMemo, useState } from 'react';
import { Switch } from '@headlessui/react';
import { MoonIcon, SunIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081';
const SHOW_DEBUG = (import.meta.env.VITE_SHOW_DEBUG ?? 'false').toLowerCase() === 'true';

interface LoginForm {
  email: string;
  password: string;
  companyCode: string;
  rememberMe: boolean;
  mfaCode?: string;
  recoveryCode?: string;
}

interface AuthResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  companyCode: string;
  displayName: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  timestamp?: string;
}

interface MfaChallengeResponse {
  required: boolean;
}

type LoginState = 'idle' | 'loading' | 'success' | 'error' | 'info';
type Step = 'login' | 'mfa';

interface LoginFeedback {
  state: LoginState;
  message?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isAuthResponse = (value: unknown): value is AuthResponse =>
  isRecord(value) &&
  typeof value.accessToken === 'string' &&
  typeof value.refreshToken === 'string' &&
  typeof value.tokenType === 'string' &&
  typeof value.companyCode === 'string' &&
  typeof value.displayName === 'string' &&
  typeof value.expiresIn === 'number';

const isApiResponse = <T,>(value: unknown): value is ApiResponse<T> =>
  isRecord(value) && typeof value.success === 'boolean';

const isMfaChallenge = (value: unknown): value is ApiResponse<MfaChallengeResponse> => {
  if (!isApiResponse<MfaChallengeResponse>(value)) {
    return false;
  }
  const data = value.data;
  return isRecord(data) && data.required === true;
};

const extractErrorMessage = (value: unknown) => {
  if (isApiResponse(value) && typeof value.message === 'string' && value.message.length > 0) {
    return value.message;
  }
  if (isRecord(value)) {
    if (typeof value.message === 'string' && value.message.length > 0) {
      return value.message;
    }
    if (typeof value.detail === 'string' && value.detail.length > 0) {
      return value.detail;
    }
    if (typeof value.error === 'string' && value.error.length > 0) {
      return value.error;
    }
  }
  return undefined;
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [step, setStep] = useState<Step>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    companyCode: '',
    rememberMe: false,
    mfaCode: '',
    recoveryCode: '',
  });
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [feedback, setFeedback] = useState<LoginFeedback>({ state: 'idle' });

  const backgroundClass = useMemo(
    () =>
      darkMode
        ? 'from-zinc-950 via-zinc-900 to-zinc-950 bg-grid-dark'
        : 'bg-zinc-50',
    [darkMode]
  );

  const submitToApi = async (payload: Partial<LoginForm>) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: response.ok, status: response.status, body: json } as const;
  };

  const normalize = (s: unknown) => String(s ?? '').toLowerCase();

  const friendlyErrorMessage = (status: number, body: unknown, currentStep: Step) => {
    const code = isRecord(body) ? normalize((body as any).code) : '';
    const msg = isRecord(body) ? normalize((body as any).message) : '';
    const contains = (needle: string) => code.includes(needle) || msg.includes(needle);

    if (currentStep === 'mfa') {
      if (status === 400 || status === 401 || contains('mfa') || contains('code')) {
        return 'That verification code is incorrect or expired. Enter the 6‑digit code from your authenticator app or use a recovery code.';
      }
    }

    if (status === 401 || contains('bad_credentials') || contains('invalid_credentials') || /bad\s*credentials/.test(msg)) {
      return "We couldn't sign you in. Check your email, password, and company code, then try again.";
    }
    if (status === 403 || contains('forbidden') || contains('disabled') || contains('locked')) {
      return 'Your account is locked or disabled. Contact your administrator if you believe this is a mistake.';
    }
    if (status === 404 && (contains('company') || contains('tenant') || msg.includes('company'))) {
      return "That company code wasn't recognized. Verify the code and try again.";
    }
    if (status === 429 || contains('too_many') || contains('rate')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (status === 400 || status === 422) {
      return 'Some details look incomplete or invalid. Review the form and try again.';
    }
    if (status >= 500) {
      return "We're having trouble on our side. Please try again in a few minutes.";
    }
    return 'Unable to authenticate. Please try again or contact support if the issue persists.';
  };

  const handleMfaChallenge = () => {
    setSession(null);
    setStep('mfa');
    setFeedback({
      state: 'info',
      message: 'Multi-factor authentication required. Provide your authenticator code or a recovery code to continue.',
    });
  };

  const isMfaHint = (value: unknown) => {
    if (!isRecord(value)) return false;
    const code = String(value.code ?? value.message ?? '').toLowerCase();
    return (
      value.requiresMfa === true ||
      value.mfaRequired === true ||
      value.next === 'mfa' ||
      value.status === 'MFA_REQUIRED' ||
      value.status === 'PENDING_MFA' ||
      code.includes('mfa')
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFeedback({ state: 'loading' });
    setSession(null);

    const basePayload = {
      email: form.email.trim(),
      password: form.password,
      companyCode: form.companyCode.trim(),
      rememberMe: form.rememberMe,
    };

    const payload =
      step === 'login'
        ? basePayload
        : {
            ...basePayload,
            mfaCode: form.mfaCode?.trim() || undefined,
            recoveryCode: form.recoveryCode?.trim() || undefined,
          };

    try {
      const { ok, status, body } = await submitToApi(payload);

      if (ok && isAuthResponse(body)) {
        setFeedback({ state: 'success', message: `Welcome back, ${body.displayName || form.email}.` });
        setSession(SHOW_DEBUG ? body : null);
        setStep('login');
        setForm((prev) => ({ ...prev, mfaCode: '', recoveryCode: '' }));
        return;
      }

      if (status === 428 || isMfaChallenge(body) || isMfaHint(body)) {
        handleMfaChallenge();
        return;
      }

      const message = friendlyErrorMessage(status, body, step);
      throw new Error(message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to reach the server. Check your connection and try again.';
      setFeedback({ state: 'error', message });
    }
  };

  const handleChange = (field: keyof LoginForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isLoading = feedback.state === 'loading';

  return (
    <div className={clsx('min-h-screen w-full transition-colors duration-300', darkMode ? 'dark' : 'light')}>
      <div className={clsx('relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br', backgroundClass)}>
        {darkMode && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-spectrum opacity-40 blur-3xl" aria-hidden="true" />
            <div className="absolute inset-0 bg-[length:32px_32px]" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" aria-hidden="true" />
          </>
        )}

        <div className="relative z-10 flex w-full max-w-6xl flex-col gap-8 sm:gap-12 px-4 sm:px-6 py-8 sm:py-10 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-4 sm:space-y-6 text-primary min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-400">Enterprise Portal</p>
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold truncate">Orchestrator Control Suite</h1>
                <p className="mt-1 sm:mt-3 max-w-xl text-sm sm:text-base text-secondary">
                  Command the full spectrum of enterprise operations with precision. Securely authenticate to orchestrate inventory, sales, and workforce insights.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-sm text-secondary">
              <Switch
                checked={!darkMode}
                onChange={() => setDarkMode((prev) => !prev)}
                className={clsx(
                  'relative inline-flex h-10 w-20 items-center rounded-full border-transparent transition',
                  darkMode ? 'bg-zinc-800/80' : 'bg-white/70 shadow-lg'
                )}
              >
                <span className="sr-only">Toggle theme</span>
                <span
                  className={clsx(
                    'pointer-events-none inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-gradient-to-br text-primary transition',
                    darkMode
                      ? 'translate-x-1 from-zinc-600 to-zinc-900 text-zinc-100'
                      : 'translate-x-11 from-white to-zinc-200 text-zinc-900'
                  )}
                >
                  {darkMode ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                </span>
              </Switch>
              <span>{darkMode ? 'Dark mode' : 'Light mode'}</span>
            </div>
          </div>

          <div className="flex w-full max-w-md flex-1">
            <div className={clsx('w-full rounded-3xl border p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-xl transition flex flex-col min-w-0', darkMode ? 'border-white/10 bg-zinc-900/70' : 'border-zinc-200 bg-white/80 text-primary')}>
              <header className="mb-6 sm:mb-8 text-center">
                {step === 'login' ? (
                  <>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary">Sign in to Orchestrator</h2>
                    <p className="mt-1 sm:mt-2 text-sm text-secondary">
                      Use your credentials to unlock orchestration.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary">Multi‑factor verification</h2>
                    <p className="mt-1 sm:mt-2 text-sm text-secondary">
                      Enter your authenticator code or a recovery code to continue.
                    </p>
                  </>
                )}
              </header>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {step === 'login' ? (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-primary">
                        Work email
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) => handleChange('email', event.target.value)}
                        className={clsx(
                          'w-full rounded-xl border px-4 py-3 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500',
                          darkMode
                            ? 'border-white/10 bg-zinc-950/60 text-white placeholder:text-tertiary'
                            : 'border-zinc-200 bg-white text-primary placeholder:text-tertiary'
                        )}
                        placeholder="you@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-primary">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={form.password}
                          onChange={(event) => handleChange('password', event.target.value)}
                          className={clsx(
                            'w-full rounded-xl border px-4 py-3 pr-12 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-400',
                            darkMode
                              ? 'border-white/10 bg-zinc-950/60 text-white placeholder:text-tertiary'
                              : 'border-zinc-200 bg-white text-primary placeholder:text-tertiary'
                          )}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className={clsx(
                            'absolute inset-y-0 right-3 my-auto inline-flex h-8 w-8 items-center justify-center rounded-full transition',
                            darkMode ? 'text-tertiary hover:text-white' : 'text-tertiary hover:text-zinc-700'
                          )}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="companyCode" className="text-sm font-medium text-primary">
                        Company code
                      </label>
                      <input
                        id="companyCode"
                        type="text"
                        required
                        value={form.companyCode}
                        onChange={(event) => handleChange('companyCode', event.target.value)}
                        className={clsx(
                          'w-full rounded-xl border px-4 py-3 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 uppercase tracking-[0.2em]',
                          darkMode
                            ? 'border-white/10 bg-zinc-950/60 text-white placeholder:text-tertiary'
                            : 'border-zinc-200 bg-white text-primary placeholder:text-tertiary'
                        )}
                        placeholder="BGP-001"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-3 cursor-pointer group select-none">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={form.rememberMe}
                            onChange={(e) => handleChange('rememberMe', e.target.checked)}
                            className="peer sr-only"
                          />
                          <div
                            className={clsx(
                              'relative h-5 w-5 rounded-sm border transition-all duration-300 ease-out flex items-center justify-center',
                              'peer-focus-visible:ring-2 peer-focus-visible:ring-sky-500/50 peer-focus-visible:ring-offset-2',
                              darkMode
                                ? 'border-zinc-700 bg-zinc-950 peer-focus-visible:ring-offset-zinc-950 peer-checked:border-brand-500 group-hover:border-zinc-500'
                                : 'border-zinc-300 bg-zinc-50 peer-focus-visible:ring-offset-white peer-checked:border-brand-600 group-hover:border-zinc-400'
                            )}
                          >
                            <div className={clsx(
                              'h-2.5 w-2.5 rounded-[1px] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                              form.rememberMe ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
                              darkMode ? 'bg-brand-500' : 'bg-brand-600'
                            )} />
                          </div>
                        </div>
                        <span className={clsx(
                          "text-[11px] font-bold uppercase tracking-[0.15em] transition-colors",
                          darkMode ? "text-zinc-400 group-hover:text-zinc-200" : "text-zinc-500 group-hover:text-zinc-800"
                        )}>
                          Remember Me
                        </span>
                      </label>

                      <a
                        href="#"
                        className={clsx(
                          'text-[11px] font-bold uppercase tracking-[0.15em] transition-colors',
                          darkMode
                            ? 'text-brand-500 hover:text-brand-400'
                            : 'text-brand-600 hover:text-brand-500'
                        )}
                      >
                        Recovery
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="mfaCode" className="text-sm text-primary">
                        Authenticator code (TOTP)
                      </label>
                      <input
                        id="mfaCode"
                        type="text"
                        inputMode="numeric"
                        value={form.mfaCode}
                        onChange={(event) => handleChange('mfaCode', event.target.value)}
                        className={clsx(
                          'w-full rounded-xl border px-4 py-3 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500',
                          darkMode
                            ? 'border-white/10 bg-zinc-950/60 text-white placeholder:text-tertiary'
                            : 'border-zinc-200 bg-white text-primary placeholder:text-tertiary'
                        )}
                        placeholder="123 456"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="recoveryCode" className="text-sm text-primary">
                        Or use a recovery code
                      </label>
                      <input
                        id="recoveryCode"
                        type="text"
                        value={form.recoveryCode}
                        onChange={(event) => handleChange('recoveryCode', event.target.value)}
                        className={clsx(
                          'w-full rounded-xl border px-4 py-3 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 tracking-[0.2em]',
                          darkMode
                            ? 'border-white/10 bg-zinc-950/60 text-white placeholder:text-tertiary'
                            : 'border-zinc-200 bg-white text-primary placeholder:text-tertiary'
                        )}
                        placeholder="ABCD-EFGH-IJKL"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={clsx(
                    'group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-brand-500 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900',
                    'enabled:hover:bg-brand-400 disabled:opacity-70 disabled:cursor-not-allowed',
                    darkMode ? 'focus:ring-brand-300' : 'focus:ring-brand-500 focus:ring-offset-white'
                  )}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-brand-400 via-sky-400 to-brand-500 opacity-0 transition group-hover:opacity-100" />
                  <span className="relative flex items-center gap-2">
                    {isLoading && (
                      <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {isLoading ? (step === 'login' ? 'Authenticating…' : 'Verifying…') : step === 'login' ? 'Login' : 'Verify'}
                  </span>
                </button>
              </form>

              {feedback.state !== 'idle' && feedback.message && (
                <p
                  className={clsx(
                    'mt-6 rounded-2xl px-4 py-3 text-sm font-medium',
                    feedback.state === 'success'
                      ? (darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-primary')
                      : feedback.state === 'error'
                        ? (darkMode ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-primary')
                        : (darkMode ? 'bg-sky-500/10 text-sky-100' : 'bg-sky-50 text-primary')
                  )}
                >
                  {feedback.message}
                </p>
              )}
              {SHOW_DEBUG && session && (
                <div
                  className={clsx(
                    'mt-6 space-y-4 rounded-2xl border px-5 py-4 text-xs',
                    darkMode ? 'border-white/10 bg-zinc-950/60 text-tertiary' : 'border-zinc-200 bg-white/80 text-tertiary'
                  )}
                >
                  <div className="text-sm font-semibold">Session issued</div>
                  <dl className="space-y-3 text-left">
                    <div>
                      <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-tertiary">Company</dt>
                      <dd className={clsx('mt-1 font-mono text-sm', darkMode ? 'text-white' : 'text-primary')}>
                        {session.companyCode}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-tertiary">Access token</dt>
                      <dd
                        className={clsx(
                          'mt-1 rounded-xl px-3 py-2 font-mono text-[0.72rem] leading-relaxed break-all',
                          darkMode ? 'bg-zinc-900/40 text-emerald-200' : 'bg-zinc-100 text-emerald-700'
                        )}
                      >
                        {session.accessToken}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-tertiary">Refresh token</dt>
                      <dd
                        className={clsx(
                          'mt-1 rounded-xl px-3 py-2 font-mono text-[0.72rem] leading-relaxed break-all',
                          darkMode ? 'bg-zinc-900/40 text-sky-200' : 'bg-zinc-100 text-sky-700'
                        )}
                      >
                        {session.refreshToken}
                      </dd>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[0.75rem]">
                      <div>
                        <dt className="text-[0.6rem] uppercase tracking-[0.3em] text-tertiary">Token type</dt>
                        <dd className={clsx('mt-1 font-semibold', darkMode ? 'text-white' : 'text-primary')}>
                          {session.tokenType}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[0.6rem] uppercase tracking-[0.3em] text-tertiary">Expires in</dt>
                        <dd className="mt-1 font-semibold">
                          {Number.isFinite(session.expiresIn) ? `${session.expiresIn} seconds` : 'unknown'}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>
              )}

              <footer className="mt-8 sm:mt-10 space-y-2 text-center text-xs text-tertiary">
                <p>Powered by the Orchestrator platform.</p>
                <p>Need help? Contact the Enterprise Automation team.</p>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

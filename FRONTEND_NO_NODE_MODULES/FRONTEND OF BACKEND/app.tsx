import { FormEvent, useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  requiresMfa?: boolean;
  recoveryCodesRemaining?: number;
};
type LoginError = {
  message: string;
  code?: string;
};
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081';
function usePrefersDarkMode() {
  const prefersDark = useMemo(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  }, []);
  const [theme, setTheme] = useState<'dark' | 'light'>(prefersDark ? 'dark' : 'light');
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);
  return [theme, setTheme] as const;
}
function App() {
  const [theme, setTheme] = usePrefersDarkMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  function usePrefersDarkMode() {
    const prefersDark = useMemo(() => {
      if (typeof window === 'undefined') {
        return true;
      }
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    }, []);
    const [theme, setTheme] = useState<'dark' | 'light'>(prefersDark ? 'dark' : 'light');
    useEffect(() => {
      if (typeof window === 'undefined') {
        return;
      }
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (event: MediaQueryListEvent) => {
        setTheme(event.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }, []);
    return [theme, setTheme] as const;
  }
  function App() {
    const [theme, setTheme] = usePrefersDarkMode();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState<LoginError | null>(null);
    const [loginSuccess, setLoginSuccess] = useState<LoginResponse | null>(null);
    useEffect(() => {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
      setLoginError(null);
      setLoginSuccess(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            password,
            mfaCode: mfaCode || undefined,
            recoveryCode: recoveryCode || undefined,
            rememberMe
          })
        });

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as
            | { message?: string; code?: string }
            | null;
          throw {
            message: errorBody?.message ?? 'Unable to sign in. Check your credentials and try again.',
            code: errorBody?.code
          } satisfies LoginError;
        }

        const data = (await response.json()) as LoginResponse;
        setLoginSuccess(data);
      } catch (err) {
        const error = err as LoginError;
        setLoginError({
          message: error.message ?? 'Unexpected error',
          code: error.code
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-background text-primary transition-colors duration-300">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          <header className="flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 self-center lg:self-start px-4 py-1.5 rounded-full bg-surface-highlight border border-border text-xs font-medium uppercase tracking-wider text-secondary shadow-sm">
              Enterprise-grade Access
            </div>
            <div className="space-y-4">
              <span className="text-sm font-semibold tracking-widest text-brand-500 uppercase">Orchestrator for Big Bright Paints</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primary">
                Big Bright Paints
              </h1>
              <p className="text-lg text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Securely coordinate finance, operations, and field teams in one enterprise suite.
              </p>
            </div>

            <div className="hidden lg:flex flex-col gap-6 mt-8 p-8 rounded-3xl bg-surface/50 border border-border backdrop-blur-sm">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">Operational Insights</h3>
                <p className="text-secondary leading-relaxed">
                  Orchestrator synchronizes production runs, inventory, and financial postings in real time. Automated approvals keep every plant aligned with headquarters.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">Security Posture</h3>
                <ul className="space-y-2 text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Role-based access with fine-grained scopes.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Device trust policies and session isolation.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Audit-grade logging for SOC 2 compliance.
                  </li>
                </ul>
              </div>
            </div>
          </header>

          <main className="w-full max-w-md mx-auto lg:mx-0 lg:w-full">
            <section className="relative overflow-hidden rounded-3xl bg-surface border border-border shadow-2xl p-8 sm:p-10 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none" />

              <div className="relative flex justify-between items-start gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary">Welcome back</h2>
                  <p className="mt-2 text-sm text-secondary">Sign in with your corporate credentials.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2.5 rounded-full bg-surface-highlight border border-border text-primary hover:bg-border transition-colors"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
              </div>

              <form className="relative space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-primary">Work Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@bbp.dev"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-primary">Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="mfa" className="block text-sm font-medium text-primary">MFA Code</label>
                    <input
                      id="mfa"
                      inputMode="numeric"
                      pattern="\\d{6}"
                      placeholder="123456"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      value={mfaCode}
                      onChange={(event) => setMfaCode(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="recovery" className="block text-sm font-medium text-primary">Recovery Code</label>
                    <input
                      id="recovery"
                      placeholder="Optional"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      value={recoveryCode}
                      onChange={(event) => setRecoveryCode(event.target.value)}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-brand-600 focus:ring-brand-500 bg-background"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span className="text-sm text-secondary group-hover:text-primary transition-colors">Remember this device</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-lg shadow-brand-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                >
                  {loading ? 'Authenticating…' : 'Sign In'}
                </button>

                {loginError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    <strong className="block font-semibold mb-1">Sign-in failed</strong>
                    <span>{loginError.message}</span>
                    {loginError.code && <div className="mt-1 text-xs opacity-75">Error code: {loginError.code}</div>}
                  </div>
                )}

                {loginSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
                    <strong className="block font-semibold mb-1">Access granted</strong>
                    <span>Your session token has been issued.</span>
                    {loginSuccess.requiresMfa && (
                      <div className="mt-1 text-xs opacity-75">
                        Multi-factor verification still required. Recovery codes remaining: {loginSuccess.recoveryCodesRemaining ?? '—'}
                      </div>
                    )}
                  </div>
                )}
              </form>

              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-xs text-secondary">
                  Need help? Contact <a href="mailto:identity@bbp.dev" className="text-brand-500 hover:text-brand-600 font-medium">identity@bbp.dev</a>
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }
  export default App;

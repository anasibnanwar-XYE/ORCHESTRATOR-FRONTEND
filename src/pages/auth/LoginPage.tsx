import { type FormEvent, useCallback, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth, MFA_SESSION_KEY, type MfaPendingState } from '@/context/AuthContext';
import { resolveError } from '@/lib/error-resolver';
import { isApiError } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { resolvePortalAccess, resolvePostLoginDestination } from '@/lib/portal-routing';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const toast = useToast();

  const from = (location.state as { from?: string } | null)?.from ?? null;

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [lockoutState, setLockoutState]           = useState<string | null>(null);
  const [runtimeDenialState, setRuntimeDenialState] = useState<string | null>(null);

  const formWrapRef = useRef<HTMLDivElement>(null);

  const triggerShake = useCallback(() => {
    formWrapRef.current?.classList.remove('o-shake');
    void formWrapRef.current?.offsetWidth;
    formWrapRef.current?.classList.add('o-shake');
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setLockoutState(null);
    setRuntimeDenialState(null);
    setIsLoading(true);

    try {
      const result = await signIn({ email, password, companyCode });

      if (result.requiresMfa) {
        const pendingState: MfaPendingState = {
          email, password, companyCode,
          ...(from ? { intendedDestination: from } : {}),
        };
        try { sessionStorage.setItem(MFA_SESSION_KEY, JSON.stringify(pendingState)); } catch { /* unavailable */ }
        navigate('/mfa', { state: pendingState });
        return;
      }

      if (result.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      const access = resolvePortalAccess(result.user);
      const destination = resolvePostLoginDestination(access, from);
      navigate(destination, { replace: true });
    } catch (error) {
      const is428 = isApiError(error) && error.response?.status === 428;
      const resolved = is428 ? { type: 'mfa_redirect' as const } : resolveError(error);

      if (resolved.type === 'mfa_redirect') {
        const pendingState: MfaPendingState = {
          email, password, companyCode,
          ...(from ? { intendedDestination: from } : {}),
        };
        try { sessionStorage.setItem(MFA_SESSION_KEY, JSON.stringify(pendingState)); } catch { /* unavailable */ }
        navigate('/mfa', { state: pendingState });
        return;
      }

      if (resolved.type === 'lockout') { setLockoutState(resolved.message); return; }
      if (resolved.type === 'runtime_denial') { setRuntimeDenialState(resolved.message); return; }

      triggerShake();
      toast.error(resolved.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div ref={formWrapRef}>
        <header style={{ marginBottom: 30 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#171717', fontFamily: 'inherit' }}>
            Sign in
          </h2>
          <p style={{ width: 300, margin: '4px 0 0', color: '#737373', fontSize: 13, fontFamily: 'inherit' }}>
            Enter your credentials to access the admin portal
          </p>
        </header>

        {lockoutState && (
          <div role="alert" data-testid="lockout-banner" style={{ marginBottom: 20, padding: '10px 12px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>
            <p style={{ margin: 0, fontWeight: 500 }}>Account locked</p>
            <p style={{ margin: '2px 0 0', fontSize: 12 }}>{lockoutState}</p>
          </div>
        )}

        {runtimeDenialState && (
          <div role="alert" data-testid="runtime-denial-banner" style={{ marginBottom: 20, padding: '10px 12px', borderRadius: 8, background: '#f5f5f5', border: '1px solid #e5e5e5', fontSize: 13, color: '#525252' }}>
            {runtimeDenialState}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: 17 }}>
          <label style={{ display: 'grid', gap: 8, color: '#171717', fontWeight: 500, fontSize: 13, fontFamily: 'inherit' }}>
            <span>Email</span>
            <input
              type="email"
              className="lp-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              required
              disabled={isLoading || !!lockoutState}
            />
          </label>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
              <span style={{ color: '#171717', fontWeight: 500, fontSize: 13 }}>Password</span>
              <Link
                to="/forgot-password"
                className="lp-forgot"
                style={{ fontSize: 12, fontWeight: 400, color: '#737373', textDecoration: 'none', transition: 'color 180ms ease' }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="lp-input"
                style={{ paddingRight: 36 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={isLoading || !!lockoutState}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#737373', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <label style={{ display: 'grid', gap: 8, color: '#171717', fontWeight: 500, fontSize: 13, fontFamily: 'inherit' }}>
            <span>Company code</span>
            <input
              type="text"
              className="lp-input lp-input-mono"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
              placeholder="e.g. ACME"
              autoComplete="organization"
              required
              disabled={isLoading || !!lockoutState}
            />
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#525252', fontSize: 12, fontWeight: 400, cursor: 'pointer', marginTop: -2, fontFamily: 'inherit' }}>
            <input type="checkbox" style={{ width: 14, height: 14, margin: 0, borderRadius: 3, accentColor: '#171717' }} />
            <span>Remember me</span>
          </label>

          <button type="submit" className="lp-btn" disabled={isLoading || !!lockoutState}>
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}

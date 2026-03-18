/**
 * LoginPage
 *
 * Features:
 *  - Email / password / companyCode form bound to backend LoginRequest contract
 *  - Submit button with loading state
 *  - Shake animation on error
 *  - Distinct UX for invalid credentials, lockout, and runtime denial states
 *  - MFA redirect: stores original credentials (email+password+companyCode) in
 *    sessionStorage for the canonical re-login approach on MfaPage
 *  - mustChangePassword redirect
 */

import { type FormEvent, useCallback, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, MFA_SESSION_KEY, type MfaPendingState } from '@/context/AuthContext';
import { resolveError } from '@/lib/error-resolver';
import { isApiError } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrchestratorLogo } from '@/components/ui/OrchestratorLogo';
import { resolvePortalAccess, resolvePostLoginDestination } from '@/lib/portal-routing';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const toast = useToast();

  /**
   * Intended destination: the protected deep link the user was trying to reach
   * before being redirected to /login. Restored after successful login or MFA.
   */
  const from = (location.state as { from?: string } | null)?.from ?? null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  /**
   * lockoutState — set when auth returns AUTH_005.
   * Shows a distinct lockout banner and disables the submit button.
   */
  const [lockoutState, setLockoutState] = useState<string | null>(null);

  /**
   * runtimeDenialState — set when a tenant runtime denial is returned.
   * Shows a stable, non-credential message without the shake animation.
   */
  const [runtimeDenialState, setRuntimeDenialState] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    // Clear any previous denial states on a new attempt
    setLockoutState(null);
    setRuntimeDenialState(null);

    setIsLoading(true);

    try {
      const result = await signIn({ email, password, companyCode });

      if (result.requiresMfa) {
        // Per backend contract, MFA verification re-submits POST /auth/login with
        // original credentials + mfaCode or recoveryCode. Store credentials in
        // sessionStorage for mobile-resilient state (app switch to authenticator).
        // intendedDestination preserves the original protected deep link through
        // the MFA corridor so MfaPage can restore it after successful verification.
        const pendingState: MfaPendingState = {
          email,
          password,
          companyCode,
          ...(from ? { intendedDestination: from } : {}),
        };
        try {
          sessionStorage.setItem(MFA_SESSION_KEY, JSON.stringify(pendingState));
        } catch {
          // sessionStorage unavailable — pass via navigate state only
        }
        navigate('/mfa', { state: pendingState });
        return;
      }

      if (result.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      // Successful login — restore the intended destination when accessible,
      // otherwise fall back to role-based post-login routing.
      const access = resolvePortalAccess(result.user);
      const destination = resolvePostLoginDestination(access, from);
      navigate(destination, { replace: true });
    } catch (error) {
      // Primary MFA detection: HTTP 428 status code (not relying on AUTH_007 code alone)
      const is428 = isApiError(error) && error.response?.status === 428;
      const resolved = is428 ? { type: 'mfa_redirect' as const } : resolveError(error);

      if (resolved.type === 'mfa_redirect') {
        // Store original credentials for the canonical re-login MFA verification.
        // intendedDestination preserves the original protected deep link through
        // the MFA corridor so MfaPage can restore it after successful verification.
        const pendingState: MfaPendingState = {
          email,
          password,
          companyCode,
          ...(from ? { intendedDestination: from } : {}),
        };
        try {
          sessionStorage.setItem(MFA_SESSION_KEY, JSON.stringify(pendingState));
        } catch {
          // sessionStorage unavailable — pass via navigate state only
        }
        navigate('/mfa', { state: pendingState });
        return;
      }

      if (resolved.type === 'lockout') {
        // Distinct lockout state — do NOT shake or show as a credential error
        setLockoutState(resolved.message);
        return;
      }

      if (resolved.type === 'runtime_denial') {
        // Runtime denial (tenant hold/block/rate limit) — stable non-credential UX
        setRuntimeDenialState(resolved.message);
        return;
      }

      // Generic credential failure — shake and toast
      triggerShake();
      toast.error(resolved.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <OrchestratorLogo size={36} variant="full" className="text-[var(--color-text-primary)]" />
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] font-medium">
            Orchestrator ERP
          </p>
        </div>

        {/* Card */}
        <div
          className={clsx(
            'bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)]',
            'shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-8',
            shaking && 'o-shake'
          )}
        >
          <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)] mb-6">
            Sign in to your account
          </h1>

          {/* Lockout state — distinct, blocks retry */}
          {lockoutState && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-800"
              data-testid="lockout-banner"
            >
              <p className="font-medium">Account locked</p>
              <p className="mt-0.5 text-[12px]">{lockoutState}</p>
            </div>
          )}

          {/* Runtime denial state — stable, non-credential */}
          {runtimeDenialState && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] text-[13px] text-[var(--color-text-secondary)]"
              data-testid="runtime-denial-banner"
            >
              {runtimeDenialState}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              leftIcon={<Mail />}
              autoComplete="email"
              autoFocus
              required
              disabled={isLoading || !!lockoutState}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={<Lock />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors pointer-events-auto"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                autoComplete="current-password"
                required
                disabled={isLoading || !!lockoutState}
              />
            </div>

            <Input
              label="Company code"
              type="text"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
              placeholder="e.g. ACME"
              leftIcon={<Building2 />}
              autoComplete="organization"
              required
              disabled={isLoading || !!lockoutState}
              className="uppercase tracking-widest font-mono"
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={isLoading || !!lockoutState}
              className="mt-2"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

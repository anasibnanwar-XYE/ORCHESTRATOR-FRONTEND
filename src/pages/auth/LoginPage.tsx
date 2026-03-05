/**
 * LoginPage
 *
 * Features:
 *  - Email / password / companyCode form
 *  - Submit button with loading state
 *  - o-shake animation on error
 *  - Toast error notifications with user-friendly messages
 *  - Handles 428 MFA redirect (stores tempToken in sessionStorage)
 *  - Handles mustChangePassword flag
 */

import { type FormEvent, useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, MFA_SESSION_KEY } from '@/context/AuthContext';
import { resolveError } from '@/lib/error-resolver';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrchestratorLogo } from '@/components/ui/OrchestratorLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await signIn({ email, password, companyCode });

      if (result.requiresMfa && result.tempToken) {
        // Store minimal state in sessionStorage for mobile resilience
        try {
          sessionStorage.setItem(
            MFA_SESSION_KEY,
            JSON.stringify({
              tempToken: result.tempToken,
              email,
              companyCode,
            })
          );
        } catch {
          // sessionStorage unavailable — pass via state
        }
        navigate('/mfa', {
          state: {
            tempToken: result.tempToken,
            email,
            companyCode,
          },
        });
        return;
      }

      if (result.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      // Successful login — navigate to portal or hub
      navigate('/hub', { replace: true });
    } catch (error) {
      const resolved = resolveError(error);

      if (resolved.type === 'mfa_redirect') {
        // 428 response with AUTH_007 — should not normally reach here
        // since requiresMfa is in the response body, but handle defensively
        navigate('/mfa', { state: { email, companyCode } });
        return;
      }

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
              disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
              className="uppercase tracking-widest font-mono"
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
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

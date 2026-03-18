/**
 * MfaPage
 *
 * MFA challenge screen. Re-submits POST /auth/login with the original credentials
 * plus mfaCode or recoveryCode — per the backend contract, no separate /auth/mfa/verify
 * endpoint is used.
 *
 * Features:
 *  - TOTP (6-digit) and recovery code modes
 *  - Mobile-resilient state: original credentials (email, password, companyCode) stored
 *    in sessionStorage so switching to authenticator app and back preserves state
 *  - Input cleared and re-focused on invalid code
 *  - Error toast on failure
 *  - Redirect to /login when no valid pending state
 */

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth, MFA_SESSION_KEY, type MfaPendingState } from '@/context/AuthContext';
import { resolveError } from '@/lib/error-resolver';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { OrchestratorLogo } from '@/components/ui/OrchestratorLogo';
import { resolvePortalAccess, resolvePostLoginDestination } from '@/lib/portal-routing';

export function MfaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMfa } = useAuth();
  const toast = useToast();

  const codeInputRef = useRef<HTMLInputElement>(null);
  const recoveryInputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Recover pending state: try location.state first, then sessionStorage.
  // Pending state holds the original login credentials needed for the canonical
  // re-login approach (email + password + companyCode + mfaCode/recoveryCode).
  const [pendingState] = useState<MfaPendingState | null>(() => {
    const fromState = location.state as MfaPendingState | null;
    // Accept location state when it has the required credential fields
    if (fromState?.email && fromState?.password && fromState?.companyCode) {
      return fromState;
    }

    try {
      const raw = sessionStorage.getItem(MFA_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MfaPendingState;
        if (parsed?.email && parsed?.password && parsed?.companyCode) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Redirect to login if no valid pending state (direct navigation or state expired)
  useEffect(() => {
    if (!pendingState?.email || !pendingState?.password || !pendingState?.companyCode) {
      navigate('/login', { replace: true });
    }
  }, [pendingState, navigate]);

  // Auto-focus on mount and when returning from the authenticator app
  useEffect(() => {
    const ref = useRecoveryCode ? recoveryInputRef : codeInputRef;
    ref.current?.focus();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const activeRef = useRecoveryCode ? recoveryInputRef : codeInputRef;
        activeRef.current?.focus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [useRecoveryCode]);

  // Auto-submit when 6 TOTP digits entered
  useEffect(() => {
    if (!useRecoveryCode && code.length === 6 && pendingState && !isLoading) {
      void handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleVerify = async () => {
    if (!pendingState || isLoading) return;
    if (!useRecoveryCode && code.length < 6) return;
    if (useRecoveryCode && !recoveryCode.trim()) return;

    setIsLoading(true);

    try {
      const credentials = useRecoveryCode
        ? { email: pendingState.email, password: pendingState.password, companyCode: pendingState.companyCode, recoveryCode: recoveryCode.trim() }
        : { email: pendingState.email, password: pendingState.password, companyCode: pendingState.companyCode, mfaCode: code };

      const result = await verifyMfa(credentials);

      if (result.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      // Restore the intended destination when accessible, otherwise fall back
      // to role-based post-login routing. intendedDestination was preserved by
      // LoginPage through the login-to-MFA corridor.
      const access = resolvePortalAccess(result.user);
      const destination = resolvePostLoginDestination(access, pendingState.intendedDestination);
      navigate(destination, { replace: true });
    } catch (error) {
      const resolved = resolveError(error);
      const msg = resolved.type === 'message' ? resolved.message : 'Verification failed. Please try again.';
      toast.error(msg);

      // Clear the code fields and re-focus for retry
      setCode('');
      setRecoveryCode('');
      setTimeout(() => {
        const ref = useRecoveryCode ? recoveryInputRef : codeInputRef;
        ref.current?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
  };

  const handleToggleMode = () => {
    setCode('');
    setRecoveryCode('');
    setUseRecoveryCode((v) => !v);
  };

  if (!pendingState?.email) {
    return null; // redirect in effect
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <OrchestratorLogo size={36} variant="full" className="text-[var(--color-text-primary)]" />
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-[var(--color-surface-tertiary)] flex items-center justify-center mb-3">
              <ShieldCheck size={22} className="text-[var(--color-text-secondary)]" />
            </div>
            <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
              Two-factor verification
            </h1>
            <p className="mt-1.5 text-[13px] text-[var(--color-text-secondary)] text-center">
              {useRecoveryCode
                ? 'Enter one of your recovery codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
            {pendingState.email && (
              <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
                for <span className="font-medium">{pendingState.email}</span>
              </p>
            )}
          </div>

          {/* TOTP mode */}
          {!useRecoveryCode && (
            <div className="mb-6">
              <label
                htmlFor="mfa-code"
                className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5 text-center"
              >
                Verification code
              </label>
              <input
                ref={codeInputRef}
                id="mfa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                disabled={isLoading}
                placeholder="000000"
                className="w-full h-14 text-center text-[24px] font-mono tracking-[0.4em] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-neutral-300)] focus:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                aria-label="6-digit verification code"
              />
              <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)] text-center">
                Open your authenticator app to find the 6-digit code
              </p>
            </div>
          )}

          {/* Recovery code mode */}
          {useRecoveryCode && (
            <div className="mb-6">
              <label
                htmlFor="mfa-recovery-code"
                className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5 text-center"
              >
                Recovery code
              </label>
              <input
                ref={recoveryInputRef}
                id="mfa-recovery-code"
                type="text"
                autoComplete="off"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                disabled={isLoading}
                placeholder="xxxx-xxxx-xxxx"
                className="w-full h-11 text-center text-[15px] font-mono tracking-wider bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-neutral-300)] focus:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                aria-label="Recovery code"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && recoveryCode.trim() && !isLoading) {
                    void handleVerify();
                  }
                }}
              />
              <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)] text-center">
                Each recovery code can only be used once
              </p>
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={useRecoveryCode ? !recoveryCode.trim() : code.length < 6}
            onClick={() => { void handleVerify(); }}
          >
            {isLoading ? 'Verifying…' : 'Verify'}
          </Button>

          {/* Toggle between TOTP and recovery code */}
          <button
            type="button"
            onClick={handleToggleMode}
            className="mt-3 w-full text-center text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            disabled={isLoading}
          >
            {useRecoveryCode ? 'Use authenticator app instead' : 'Use a recovery code instead'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-2 w-full text-center text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

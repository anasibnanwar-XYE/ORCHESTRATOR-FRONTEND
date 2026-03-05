/**
 * MfaPage
 *
 * Features:
 *  - 6-digit code input with auto-focus
 *  - Mobile-resilient state: tempToken stored in sessionStorage so switching to
 *    authenticator app and back preserves state
 *  - Input cleared and re-focused on invalid code
 *  - Error toast on failure
 */

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth, MFA_SESSION_KEY, type MfaPendingState } from '@/context/AuthContext';
import { resolveError } from '@/lib/error-resolver';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { OrchestratorLogo } from '@/components/ui/OrchestratorLogo';

export function MfaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMfa } = useAuth();
  const toast = useToast();

  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Recover state: try location.state first, then sessionStorage
  const [pendingState] = useState<MfaPendingState | null>(() => {
    const fromState = location.state as MfaPendingState | null;
    if (fromState?.tempToken) return fromState;

    try {
      const raw = sessionStorage.getItem(MFA_SESSION_KEY);
      if (raw) return JSON.parse(raw) as MfaPendingState;
    } catch {
      // ignore
    }
    return null;
  });

  // Redirect to login if no pending state
  useEffect(() => {
    if (!pendingState?.tempToken) {
      navigate('/login', { replace: true });
    }
  }, [pendingState, navigate]);

  // Auto-focus on mount and whenever the page becomes visible again (mobile app switch)
  useEffect(() => {
    inputRef.current?.focus();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        inputRef.current?.focus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && pendingState?.tempToken && !isLoading) {
      void handleVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleVerify = async (submittedCode: string) => {
    if (!pendingState?.tempToken || isLoading) return;
    setIsLoading(true);

    try {
      const result = await verifyMfa(submittedCode, pendingState.tempToken);

      if (result.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      navigate('/hub', { replace: true });
    } catch (error) {
      const resolved = resolveError(error);
      toast.error(resolved.type === 'message' ? resolved.message : 'Verification failed');

      // Clear input and re-focus for retry
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
  };

  if (!pendingState?.tempToken) {
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
              Enter the 6-digit code from your authenticator app
            </p>
            {pendingState.email && (
              <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
                for <span className="font-medium">{pendingState.email}</span>
              </p>
            )}
          </div>

          {/* 6-digit input */}
          <div className="mb-6">
            <label
              htmlFor="mfa-code"
              className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5 text-center"
            >
              Verification code
            </label>
            <input
              ref={inputRef}
              id="mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="000000"
              className="w-full h-14 text-center text-[24px] font-mono tracking-[0.4em] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-neutral-300)] focus:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              aria-label="6-digit verification code"
            />
            <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)] text-center">
              Open your authenticator app to find the 6-digit code
            </p>
          </div>

          <Button
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={code.length < 6}
            onClick={() => handleVerify(code)}
          >
            {isLoading ? 'Verifying…' : 'Verify'}
          </Button>

          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 w-full text-center text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

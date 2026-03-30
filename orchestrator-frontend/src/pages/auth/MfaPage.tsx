import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth, MFA_SESSION_KEY, type MfaPendingState } from '@/context/AuthContext';
import { resolveError } from '@/lib/error-resolver';
import { useToast } from '@/components/ui/Toast';
import { resolvePortalAccess, resolvePostLoginDestination } from '@/lib/portal-routing';
import { AuthLayout } from './AuthLayout';

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
    <AuthLayout>
      <div>
        <header style={{ marginBottom: 'clamp(20px, 2.08vw, 30px)' }}>
          <h2 className="lp-form-title">Two-factor verification</h2>
          <p className="lp-form-subtitle">
            {useRecoveryCode
              ? 'Enter one of your recovery codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 'clamp(0.6875rem, 0.83vw, 0.75rem)', color: '#a3a3a3' }}>
            for <span style={{ fontWeight: 500, color: '#737373' }}>{pendingState.email}</span>
          </p>
        </header>

        <div className="lp-form-grid">
          {!useRecoveryCode ? (
            <div className="lp-label">
              <label htmlFor="mfa-code">Verification code</label>
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
                className="lp-input"
                style={{
                  textAlign: 'center',
                  fontSize: 'clamp(1.25rem, 1.53vw, 1.375rem)',
                  fontFamily: 'ui-monospace, monospace',
                  letterSpacing: '0.4em',
                  height: 'clamp(48px, 3.89vw, 56px)',
                }}
                aria-label="6-digit verification code"
              />
              <p style={{ margin: 0, fontSize: 'clamp(0.6875rem, 0.76vw, 0.6875rem)', color: '#a3a3a3' }}>
                Open your authenticator app to find the 6-digit code
              </p>
            </div>
          ) : (
            <div className="lp-label">
              <label htmlFor="mfa-recovery-code">Recovery code</label>
              <input
                ref={recoveryInputRef}
                id="mfa-recovery-code"
                type="text"
                autoComplete="off"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                disabled={isLoading}
                placeholder="xxxx-xxxx-xxxx"
                className="lp-input"
                style={{ textAlign: 'center', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em' }}
                aria-label="Recovery code"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && recoveryCode.trim() && !isLoading) {
                    void handleVerify();
                  }
                }}
              />
              <p style={{ margin: 0, fontSize: 'clamp(0.6875rem, 0.76vw, 0.6875rem)', color: '#a3a3a3' }}>
                Each recovery code can only be used once
              </p>
            </div>
          )}

          <button
            type="button"
            className="lp-btn"
            disabled={useRecoveryCode ? !recoveryCode.trim() : code.length < 6}
            onClick={() => { void handleVerify(); }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>

          <button type="button" className="lp-btn-ghost" onClick={handleToggleMode} disabled={isLoading}>
            {useRecoveryCode ? 'Use authenticator app instead' : 'Use a recovery code instead'}
          </button>

          <button
            type="button"
            className="lp-btn-ghost"
            onClick={() => navigate('/login', { replace: true })}
            style={{ marginTop: -8 }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

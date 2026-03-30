/**
 * ResetPasswordPage
 *
 * Features:
 *  - Extracts token from URL query string (?token=...)
 *  - Password change with real-time rule indicators
 *  - Redirects to /login with success toast on completion
 *  - Redirects to /forgot-password if no token present
 */

import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Check, X, ArrowLeft, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { authApi } from '@/lib/authApi';
import { resolveError } from '@/lib/error-resolver';
import { useToast } from '@/components/ui/Toast';
import { PASSWORD_RULES, checkPasswordRules, isPasswordValid } from '@/utils/passwordRules';
import { AuthLayout } from './AuthLayout';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  /**
   * Non-null when the reset token itself is invalid, expired, already-used, or superseded.
   * Shown as an inline recovery banner (with a link to /forgot-password) rather than a toast,
   * so the user understands they need to request a new link.
   */
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const ruleStatus = checkPasswordRules(newPassword);
  const allRulesPass = isPasswordValid(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesPass && passwordsMatch && !!token && !isLoading;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setTokenError(null);
    try {
      await authApi.resetPassword({ token, newPassword, confirmPassword });

      toast.success(
        'Password reset',
        'Your password has been updated. Please sign in.'
      );
      navigate('/login', { replace: true });
    } catch (error) {
      const resolved = resolveError(error);
      const message =
        resolved.type === 'message' ? resolved.message : 'Failed to reset password';

      // Distinguish between token-related errors (invalid/expired/used/superseded link)
      // and password-policy errors (user needs to fix their password input).
      // Token errors show as an inline recovery banner so the user knows to request a new link.
      // Password-policy errors (contain "password" or "policy") show as a toast for correction.
      const isPasswordPolicyError =
        message.toLowerCase().includes('password') ||
        message.toLowerCase().includes('policy');

      if (isPasswordPolicyError) {
        toast.error(message);
      } else {
        // Token is invalid, expired, already-used, or superseded — show inline recovery banner.
        setTokenError(
          'This reset link is no longer valid. Please request a new one.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  const backLink = (
    <Link
      to="/login"
      className="lp-forgot"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginTop: 'clamp(12px, 1.11vw, 16px)' }}
    >
      <ArrowLeft size={12} />
      Back to sign in
    </Link>
  );

  return (
    <AuthLayout>
      {tokenError ? (
        <div>
          <h2 className="lp-form-title">Reset link invalid</h2>
          <p className="lp-form-subtitle" style={{ lineHeight: 1.6, marginTop: 'clamp(3px, 0.28vw, 4px)' }}>
            {tokenError}
          </p>
          <Link
            to="/forgot-password"
            className="lp-btn"
            data-testid="request-new-link"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', marginTop: 'clamp(16px, 1.67vw, 24px)' }}
          >
            Request a new reset link
          </Link>
          {backLink}
        </div>
      ) : (
        <div>
          <header style={{ marginBottom: 'clamp(20px, 2.08vw, 30px)' }}>
            <h2 className="lp-form-title">Create a new password</h2>
            <p className="lp-form-subtitle">Choose a strong password for your account.</p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="lp-form-grid">
            <label className="lp-label">
              <span>New password</span>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Create a strong password"
                className="lp-input"
              />
            </label>

            {newPassword.length > 0 && (
              <div
                style={{ borderRadius: 8, border: '1px solid #e5e5e5', background: '#f5f5f5', padding: 'clamp(8px, 0.69vw, 10px) clamp(10px, 0.83vw, 12px)', display: 'grid', gap: 6 }}
                role="list"
                aria-label="Password requirements"
              >
                {PASSWORD_RULES.map((rule) => {
                  const passed = ruleStatus[rule.id] ?? false;
                  return (
                    <div key={rule.id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className={clsx(
                          'shrink-0 h-4 w-4 rounded-full flex items-center justify-center',
                          passed ? 'bg-[var(--color-success-icon)] text-white' : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
                        )}
                        aria-hidden="true"
                      >
                        {passed ? <Check size={10} strokeWidth={3} /> : <X size={9} strokeWidth={2.5} />}
                      </span>
                      <span
                        className={clsx('text-[12px]', passed ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-tertiary)]')}
                        data-testid={`rule-${rule.id}`}
                        style={{ fontSize: 'clamp(0.6875rem, 0.83vw, 0.75rem)' }}
                      >
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="lp-label">
              <span>Confirm password</span>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Re-enter your password"
                className="lp-input"
                style={confirmPassword.length > 0 && !passwordsMatch ? { borderColor: '#fca5a5' } : undefined}
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p style={{ margin: 0, fontSize: 'clamp(0.625rem, 0.76vw, 0.6875rem)', color: '#dc2626' }}>Passwords do not match</p>
              )}
            </div>

            <button type="submit" className="lp-btn" disabled={!canSubmit}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </form>

          {backLink}
        </div>
      )}
    </AuthLayout>
  );
}

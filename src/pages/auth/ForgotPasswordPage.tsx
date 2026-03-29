import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/authApi';
import { isApiError } from '@/lib/api';
import { AuthLayout } from './AuthLayout';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [retryableFailure, setRetryableFailure] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading || !email.trim()) return;

    setIsLoading(true);
    setRetryableFailure(false);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSubmitted(true);
    } catch (error) {
      const isPersistenceFailure =
        (error instanceof Error && error.name === 'ForgotPasswordPersistenceError') ||
        (isApiError(error) && (error.response?.status ?? 0) >= 500);

      if (isPersistenceFailure) {
        setRetryableFailure(true);
      } else {
        setSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const backLink = (
    <Link
      to="/login"
      className="lp-forgot"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#737373', textDecoration: 'none', transition: 'color 180ms ease', marginTop: 16 }}
    >
      <ArrowLeft size={12} />
      Back to sign in
    </Link>
  );

  return (
    <AuthLayout>
      {submitted ? (
        /* ── Confirmation state ── */
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#171717', fontFamily: 'inherit' }}>
            Check your email
          </h2>
          <p style={{ margin: '4px 0 0', color: '#737373', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6 }}>
            If an account with that address exists, we've sent a link to reset
            your password. Check your inbox and spam folder.
          </p>
          {backLink}
        </div>
      ) : retryableFailure ? (
        /* ── Retryable failure state ── */
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#171717', fontFamily: 'inherit' }}>
            Something went wrong
          </h2>
          <p style={{ margin: '4px 0 0', color: '#737373', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6 }}>
            We were unable to send the reset link right now. Please try again in a moment.
          </p>
          <button
            type="button"
            className="lp-btn"
            style={{ marginTop: 24 }}
            onClick={() => setRetryableFailure(false)}
          >
            Try again
          </button>
          {backLink}
        </div>
      ) : (
        /* ── Form state ── */
        <div>
          <header style={{ marginBottom: 30 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#171717', fontFamily: 'inherit' }}>
              Reset your password
            </h2>
            <p style={{ width: 300, margin: '4px 0 0', color: '#737373', fontSize: 13, fontFamily: 'inherit' }}>
              Enter your work email and we'll send you a reset link if an account exists.
            </p>
          </header>

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
                disabled={isLoading}
              />
            </label>

            <button type="submit" className="lp-btn" disabled={isLoading || !email.trim()}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          {backLink}
        </div>
      )}
    </AuthLayout>
  );
}

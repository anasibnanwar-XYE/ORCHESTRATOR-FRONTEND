import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/authApi';
import { isApiError } from '@/lib/api';
import { AuthLayout } from './AuthLayout';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [retryableFailure, setRetryableFailure] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading || !email.trim() || !companyCode.trim()) return;

    setIsLoading(true);
    setRetryableFailure(false);
    try {
      await authApi.forgotPassword({ email: email.trim(), companyCode: companyCode.trim() });
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
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginTop: 'clamp(12px, 1.11vw, 16px)' }}
    >
      <ArrowLeft size={12} />
      Back to sign in
    </Link>
  );

  return (
    <AuthLayout>
      {submitted ? (
        <div>
          <h2 className="lp-form-title">Check your email</h2>
          <p className="lp-form-subtitle" style={{ lineHeight: 1.6, marginTop: 'clamp(3px, 0.28vw, 4px)' }}>
            If an account with that address exists, we've sent a link to reset
            your password. Check your inbox and spam folder.
          </p>
          {backLink}
        </div>
      ) : retryableFailure ? (
        <div>
          <h2 className="lp-form-title">Something went wrong</h2>
          <p className="lp-form-subtitle" style={{ lineHeight: 1.6, marginTop: 'clamp(3px, 0.28vw, 4px)' }}>
            We were unable to send the reset link right now. Please try again in a moment.
          </p>
          <button
            type="button"
            className="lp-btn"
            style={{ marginTop: 'clamp(16px, 1.67vw, 24px)' }}
            onClick={() => setRetryableFailure(false)}
          >
            Try again
          </button>
          {backLink}
        </div>
      ) : (
        <div>
          <header style={{ marginBottom: 'clamp(20px, 2.08vw, 30px)' }}>
            <h2 className="lp-form-title">Reset your password</h2>
            <p className="lp-form-subtitle">
              Enter your work email and we'll send you a reset link if an account exists.
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="lp-form-grid">
            <label className="lp-label">
              <span>Work email</span>
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

            <label className="lp-label">
              <span>Company code</span>
              <input
                type="text"
                className="lp-input"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                placeholder="ACME"
                autoComplete="organization"
                required
                disabled={isLoading}
              />
            </label>

            <button type="submit" className="lp-btn" disabled={isLoading || !email.trim() || !companyCode.trim()}>
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

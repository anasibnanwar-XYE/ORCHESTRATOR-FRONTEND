/**
 * ForgotPasswordPage
 *
 * Features:
 *  - Email input
 *  - Deliberately vague confirmation to prevent email enumeration
 *  - Same message shown regardless of whether the email exists
 */

import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/authApi';
import { isApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrchestratorLogo } from '@/components/ui/OrchestratorLogo';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  /** True when the backend returned a controlled persistence failure (not an account-existence signal). */
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
      // Distinguish controlled server-side persistence failures from all other errors:
      //   - Persistence failure (backend could not store/send the reset link): show retryable state.
      //   - Any other error (network, masked account-not-found, 4xx): show the same confirmation
      //     to prevent email enumeration attacks.
      const isPersistenceFailure =
        (error instanceof Error && error.name === 'ForgotPasswordPersistenceError') ||
        (isApiError(error) && (error.response?.status ?? 0) >= 500);

      if (isPersistenceFailure) {
        setRetryableFailure(true);
      } else {
        // Intentionally show same confirmation for any other error (enum prevention)
        setSubmitted(true);
      }
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
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-8">
          {submitted ? (
            /* ── Confirmation state ── */
            <div className="text-center">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-surface-tertiary)] flex items-center justify-center mx-auto mb-4">
                <Mail size={22} className="text-[var(--color-text-secondary)]" />
              </div>
              <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)] mb-2">
                Check your email
              </h1>
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                If an account with that address exists, we've sent a link to reset
                your password. Check your inbox and spam folder.
              </p>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <ArrowLeft size={13} />
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : retryableFailure ? (
            /* ── Retryable failure state ── */
            /* Shown when the backend reported a controlled persistence failure (reset link not stored/sent).
               This is NOT the same as the normal confirmation — we must prompt the user to retry
               rather than implying an email was sent when it wasn't. */
            <div className="text-center">
              <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)] mb-2">
                Something went wrong
              </h1>
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-6">
                We were unable to send the reset link right now. Please try again in a moment.
              </p>
              <Button
                type="button"
                fullWidth
                size="lg"
                onClick={() => {
                  setRetryableFailure(false);
                }}
              >
                Try again
              </Button>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  <ArrowLeft size={12} />
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-6">
                <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
                  Reset your password
                </h1>
                <p className="mt-1.5 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                  Enter your work email and we'll send you a reset link if an
                  account exists.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  disabled={!email.trim()}
                >
                  Send reset link
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  <ArrowLeft size={12} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

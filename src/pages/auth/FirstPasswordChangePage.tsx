/**
 * FirstPasswordChangePage
 *
 * Features:
 *  - Full-screen gate when mustChangePassword=true
 *  - Blocks ALL navigation until password is successfully changed
 *  - Real-time password rule indicators (5 rules)
 *  - Submit disabled until all rules pass
 */

import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/authApi';
import { resolveError } from '@/lib/error-resolver';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { OrchestratorLogo } from '@/components/ui/OrchestratorLogo';
import { PASSWORD_RULES, checkPasswordRules, isPasswordValid } from '@/utils/passwordRules';

export function FirstPasswordChangePage() {
  const navigate = useNavigate();
  const { session, updateUser, signOut } = useAuth();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Navigate away if we shouldn't be here
  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  const ruleStatus = checkPasswordRules(newPassword);
  const allRulesPass = isPasswordValid(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesPass && passwordsMatch && !isLoading;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || !session) return;

    setIsLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: '',        // backend skips current-password check on mustChangePassword
        newPassword,
        confirmPassword,
      });

      toast.success('Password updated', 'You can now access your portal.');

      // Refresh user data to clear mustChangePassword flag
      const user = await authApi.me();
      updateUser(user);

      navigate('/hub', { replace: true });
    } catch (error) {
      const resolved = resolveError(error);
      toast.error(
        resolved.type === 'message' ? resolved.message : 'Failed to update password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <OrchestratorLogo size={36} variant="full" className="text-[var(--color-text-primary)]" />
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-8">
          <div className="mb-6">
            <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
              Set your password
            </h1>
            <p className="mt-1.5 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              Your account requires a password change before you can continue.
              Please choose a strong password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* New password */}
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="block text-[13px] font-medium text-[var(--color-text-primary)]"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Create a strong password"
                className="w-full h-9 px-3 text-[13px] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-neutral-300)] focus:shadow-sm transition-all disabled:opacity-50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              />
            </div>

            {/* Password rules */}
            {newPassword.length > 0 && (
              <div
                className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] p-3 space-y-1.5"
                role="list"
                aria-label="Password requirements"
              >
                {PASSWORD_RULES.map((rule) => {
                  const passed = ruleStatus[rule.id] ?? false;
                  return (
                    <div
                      key={rule.id}
                      role="listitem"
                      className="flex items-center gap-2"
                    >
                      <span
                        className={clsx(
                          'shrink-0 h-4 w-4 rounded-full flex items-center justify-center',
                          passed
                            ? 'bg-[#10b981] text-white'
                            : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
                        )}
                        aria-hidden="true"
                      >
                        {passed ? <Check size={10} strokeWidth={3} /> : <X size={9} strokeWidth={2.5} />}
                      </span>
                      <span
                        className={clsx(
                          'text-[12px]',
                          passed
                            ? 'text-[var(--color-text-secondary)]'
                            : 'text-[var(--color-text-tertiary)]'
                        )}
                        data-testid={`rule-${rule.id}`}
                        aria-label={`${rule.label}: ${passed ? 'passed' : 'not met'}`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block text-[13px] font-medium text-[var(--color-text-primary)]"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Re-enter your password"
                className={clsx(
                  'w-full h-9 px-3 text-[13px] bg-[var(--color-surface-primary)] border rounded-lg focus:outline-none focus:shadow-sm transition-all disabled:opacity-50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
                  confirmPassword.length > 0 && !passwordsMatch
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-[var(--color-border-default)] focus:border-[var(--color-neutral-300)]'
                )}
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[11px] text-red-600">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={!canSubmit}
              isLoading={isLoading}
            >
              {isLoading ? 'Updating…' : 'Set password and continue'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => signOut()}
              className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Sign out instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

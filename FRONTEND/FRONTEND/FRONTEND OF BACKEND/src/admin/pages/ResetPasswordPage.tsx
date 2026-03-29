import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '../lib/authApi';
import { useToast, ToastContainer } from '../components/ui/Toast';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const { toasts, addToast, removeToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      addToast({
        type: 'error',
        title: 'Invalid reset link',
        message: 'The password reset token is missing or invalid.',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Passwords do not match',
        message: 'Please ensure both passwords are identical.',
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      addToast({
        type: 'error',
        title: 'Password too short',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setIsSuccess(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Reset failed',
        message: error instanceof Error ? error.message : 'Please try again or request a new link.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)] p-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              Invalid Reset Link
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              The password reset link is invalid or has expired. Please request a new password reset link.
            </p>
            
            <button
              onClick={() => navigate('/forgot-password')}
              className="btn-primary w-full"
            >
              Request new link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)] p-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-status-success-bg)] flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-[var(--color-status-success-text)]" />
            </div>
            
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              Password reset successful
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)] p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/forgot-password')}
          className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Request new link
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Reset Password
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            Enter your new password below
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-[var(--color-text-primary)]"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-tertiary)]" />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="input pl-10 pr-10"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[var(--color-text-primary)]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-tertiary)]" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input pl-10 pr-10"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

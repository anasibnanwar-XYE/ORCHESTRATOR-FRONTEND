import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '../lib/authApi';
import { useToast, ToastContainer } from '../components/ui/Toast';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSuperadmin) {
        await authApi.forgotPasswordSuperadmin({ email });
      } else {
        await authApi.forgotPassword({ email });
      }
      setIsSuccess(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Request failed',
        message: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)] p-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-status-success-bg)] flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-[var(--color-status-success-text)]" />
            </div>
            
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              Check your email
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              If an account exists for {email}, you will receive a password reset link shortly.
            </p>
            
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Back to login
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
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Forgot Password
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--color-text-primary)]"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-tertiary)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] cursor-pointer hover:bg-[var(--color-surface-secondary)] transition-colors">
              <input
                type="checkbox"
                checked={isSuperadmin}
                onChange={(e) => setIsSuperadmin(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
              />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  I am a Superadmin
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Check this if you have superadmin privileges
                </p>
              </div>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

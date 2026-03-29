import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '../lib/authApi';
import { useToast, ToastContainer } from '../components/ui/Toast';
import { OrchestratorLogo } from '@/shared/components/ui/OrchestratorLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const formRef = useRef<HTMLDivElement>(null);

  const shakeForm = () => {
    formRef.current?.classList.remove('o-shake');
    void formRef.current?.offsetWidth;
    formRef.current?.classList.add('o-shake');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authApi.login(formData);
      addToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have successfully logged in.',
      });
      navigate('/');
    } catch (error) {
      shakeForm();
      addToast({
        type: 'error',
        title: 'Login failed',
        message: error instanceof Error ? error.message : 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)] p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-9">
          <div className="flex justify-center mb-4">
            <OrchestratorLogo size={36} variant="mark" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Orchestrator ERP
          </h1>
          <p className="text-[13px] text-[var(--color-text-tertiary)] mt-1.5">
            Sign in to your account
          </p>
        </div>

        <div ref={formRef} className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-medium text-[var(--color-text-primary)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[13px] font-medium text-[var(--color-text-primary)]">
                  Password
                </label>
                <a href="/forgot-password" className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pr-10"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-[var(--color-border-strong)] accent-[var(--color-primary-600)]"
              />
              <label htmlFor="remember" className="text-[12px] text-[var(--color-text-secondary)] select-none cursor-pointer">
                Remember me
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--color-text-tertiary)] mt-6">
          Orchestrator ERP
        </p>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

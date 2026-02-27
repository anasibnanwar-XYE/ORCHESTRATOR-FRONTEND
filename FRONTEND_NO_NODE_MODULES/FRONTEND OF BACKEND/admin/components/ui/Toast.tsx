import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Auto-dismiss duration in ms. 0 = persistent. Default 4000. */
  duration?: number;
}

// ---------------------------------------------------------------------------
// Context — provides `addToast` globally without prop-drilling
// ---------------------------------------------------------------------------

interface ToastContextValue {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to show toasts from any component.
 *
 * Usage:
 * ```tsx
 * const { addToast } = useToast();
 * addToast({ variant: 'success', title: 'Saved!' });
 * ```
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback: log to console if ToastProvider is missing (never crash the app)
    return {
      addToast: (t) => {
        // eslint-disable-next-line no-console
        console.warn('[Toast] ToastProvider not mounted.', t.title);
      },
    };
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

const variantConfig: Record<ToastVariant, {
  icon: typeof CheckCircle;
  containerClass: string;
  iconClass: string;
}> = {
  success: {
    icon: CheckCircle,
    containerClass: 'border-emerald-200 bg-[var(--status-success-bg)] dark:border-emerald-800/40',
    iconClass: 'text-[var(--status-success-text)]',
  },
  error: {
    icon: AlertCircle,
    containerClass: 'border-red-200 bg-[var(--status-error-bg)] dark:border-red-800/40',
    iconClass: 'text-[var(--status-error-text)]',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-amber-200 bg-[var(--status-warning-bg)] dark:border-amber-800/40',
    iconClass: 'text-[var(--status-warning-text)]',
  },
  info: {
    icon: Info,
    containerClass: 'border-blue-200 bg-[var(--status-info-bg)] dark:border-blue-800/40',
    iconClass: 'text-[var(--status-info-text)]',
  },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    if (duration <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="alert"
      className={clsx(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
        'animate-in slide-in-from-top-2 fade-in duration-200',
        config.containerClass,
      )}
    >
      <Icon className={clsx('mt-0.5 h-5 w-5 flex-shrink-0', config.iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 rounded p-0.5 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider + container
// ---------------------------------------------------------------------------

let toastCounter = 0;

/**
 * Mount once at the app root. Provides `useToast()` to all descendants.
 *
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container — fixed top-right */}
      {toasts.length > 0 && (
        <div
          className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

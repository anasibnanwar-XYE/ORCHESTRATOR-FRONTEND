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
  /**
   * Auto-dismiss duration in ms. 0 = persistent. Default 5000.
   */
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
    // Fallback: silently warn if ToastProvider is missing (never crash the app)
    return {
      addToast: (_t) => {
        // intentionally silent — ToastProvider not mounted
      },
    };
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Variant configuration — semantic tokens only, no hardcoded colours
// ---------------------------------------------------------------------------

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle; containerClass: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle,
    containerClass: 'border-transparent bg-status-success-bg',
    iconClass: 'text-status-success-text',
  },
  error: {
    icon: AlertCircle,
    containerClass: 'border-transparent bg-status-error-bg',
    iconClass: 'text-status-error-text',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-transparent bg-status-warning-bg',
    iconClass: 'text-status-warning-text',
  },
  info: {
    icon: Info,
    containerClass: 'border-transparent bg-status-info-bg',
    iconClass: 'text-status-info-text',
  },
};

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  // Auto-dismiss — default 5 seconds
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={clsx(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
        'animate-in slide-in-from-top-2 fade-in duration-200',
        config.containerClass,
      )}
    >
      <Icon className={clsx('mt-0.5 h-5 w-5 flex-shrink-0', config.iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-secondary">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 rounded p-0.5 text-tertiary transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-1"
        aria-label="Dismiss notification"
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
 * Stack appears top-right on desktop, bottom-center on mobile.
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

      {/* Toast container — top-right on desktop, bottom on mobile */}
      {toasts.length > 0 && (
        <div
          className={clsx(
            'fixed z-[100] flex flex-col gap-2 pointer-events-none',
            // Mobile: bottom-center
            'bottom-4 left-4 right-4',
            // Desktop: top-right
            'sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto sm:w-80',
          )}
          aria-live="polite"
          aria-atomic="false"
          aria-label="Notifications"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

import { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clearExternalToast, setExternalToast } from './toast-bridge';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<ToastData, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const icons = {
  success: <CheckCircle2 size={16} className="text-[var(--color-success-icon)]" />,
  error: <AlertCircle size={16} className="text-[var(--color-error)]" />,
  warning: <AlertTriangle size={16} className="text-[var(--color-warning-icon)]" />,
  info: <Info size={16} className="text-[var(--color-neutral-800)]" />,
};

function ToastItem({ data, onDismiss }: { data: ToastData; onDismiss: (id: string) => void }) {
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter');
  const timerRef = useRef<{ start: number; remaining: number } | undefined>(undefined);
  const rafRef = useRef<number | undefined>(undefined);
  const pausedRef = useRef(false);
  const duration = data.duration ?? 4500;
  const isPersistent = !isFinite(duration);

  useEffect(() => {
    requestAnimationFrame(() => setPhase('idle'));
  }, []);

  useEffect(() => {
    // Persistent toasts (Infinity duration) never auto-dismiss
    if (isPersistent) return;

    timerRef.current = { start: Date.now(), remaining: duration };

    const tick = () => {
      if (!timerRef.current) return;
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = Date.now() - timerRef.current.start;

      if (elapsed >= timerRef.current.remaining) {
        setPhase('exit');
        setTimeout(() => onDismiss(data.id), 350);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [data.id, duration, isPersistent, onDismiss]);

  const handleDismiss = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPhase('exit');
    setTimeout(() => onDismiss(data.id), 350);
  };

  return (
    <div
      role={data.type === 'error' || data.type === 'warning' ? 'alert' : 'status'}
      aria-live={data.type === 'error' || data.type === 'warning' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={() => {
        pausedRef.current = true;
        if (timerRef.current) {
          // Capture how much time has elapsed so far
          const elapsed = Date.now() - timerRef.current.start;
          timerRef.current.remaining = timerRef.current.remaining - elapsed;
        }
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
        if (timerRef.current) {
          // Resume: reset start so the remaining time counts from now
          timerRef.current.start = Date.now();
        }
      }}
      className={clsx(
        'group relative w-[340px] max-w-[calc(100vw-32px)]',
        'flex items-start gap-3 p-4',
        'bg-[var(--color-surface-primary)]',
        'border border-[var(--color-border-default)]',
        'rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
        'will-change-transform',
      )}
      style={{
        transform: phase === 'enter'
          ? 'translateY(-8px) scale(0.95)'
          : phase === 'exit'
            ? 'translateX(20px) scale(0.95)'
            : 'translateY(0) scale(1)',
        opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
        transition: phase === 'exit'
          ? 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          : 'all 400ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div className="shrink-0 pt-0.5">{icons[data.type]}</div>

      <div className="flex-1 min-w-0 pr-6">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)] leading-tight">
          {data.title}
        </p>
        {data.description && (
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1 leading-relaxed line-clamp-2">
            {data.description}
          </p>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className={clsx(
          'absolute top-3 right-3 p-1.5 rounded-lg',
          'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-surface-tertiary)] transition-colors',
          isPersistent
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 focus:opacity-100',
        )}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  useEffect(() => {
    setExternalToast(addToast);

    return () => {
      clearExternalToast(addToast);
    };
  }, [addToast]);

  const ctx = useMemo<ToastContextValue>(() => ({
    toast: addToast,
    dismiss,
    success: (title, description) => addToast({ type: 'success', title, description }),
    error: (title, description) => addToast({ type: 'error', title, description, duration: Infinity }),
    warning: (title, description) => addToast({ type: 'warning', title, description, duration: Infinity }),
    info: (title, description) => addToast({ type: 'info', title, description }),
  }), [addToast, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed top-6 right-6 z-[var(--z-toast,9990)] flex flex-col gap-3 pointer-events-none items-end">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem data={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

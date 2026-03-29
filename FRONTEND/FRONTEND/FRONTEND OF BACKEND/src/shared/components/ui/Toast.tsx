import { useState, useEffect, useCallback, createContext, useContext, useRef, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

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

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const icons = {
  success: <CheckCircle2 size={16} className="text-[#10b981]" />,
  error: <AlertCircle size={16} className="text-[#ef4444]" />,
  warning: <AlertTriangle size={16} className="text-[#f59e0b]" />,
  info: <Info size={16} className="text-[var(--color-neutral-800)]" />,
};

function ToastItem({ data, onDismiss }: { data: ToastData; onDismiss: (id: string) => void }) {
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter');
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<{ start: number; remaining: number }>();
  const rafRef = useRef<number>();
  const duration = data.duration ?? 4500;

  useEffect(() => {
    requestAnimationFrame(() => setPhase('idle'));
  }, []);

  useEffect(() => {
    timerRef.current = { start: Date.now(), remaining: duration };

    const tick = () => {
      if (!timerRef.current) return;
      if (paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = Date.now() - timerRef.current.start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);

      if (pct <= 0) {
        setPhase('exit');
        setTimeout(() => onDismiss(data.id), 350);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [data.id, duration, onDismiss, paused]);

  const handleDismiss = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPhase('exit');
    setTimeout(() => onDismiss(data.id), 350);
  };

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        if (timerRef.current) {
          const elapsed = duration - timerRef.current.remaining;
          timerRef.current.start = Date.now() - elapsed;
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
          ? 'translateY(16px) scale(0.95)'
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
          'opacity-0 group-hover:opacity-100 focus:opacity-100',
        )}
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

  const ctx: ToastContextValue = {
    toast: addToast,
    dismiss,
    success: (title, description) => addToast({ type: 'success', title, description }),
    error: (title, description) => addToast({ type: 'error', title, description }),
    warning: (title, description) => addToast({ type: 'warning', title, description }),
    info: (title, description) => addToast({ type: 'info', title, description }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-6 right-6 z-[var(--z-toast,9990)] flex flex-col gap-3 pointer-events-none items-end">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem data={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

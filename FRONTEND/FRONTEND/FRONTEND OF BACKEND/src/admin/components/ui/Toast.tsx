import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { Toast } from '@/shared/types';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const accentColors: Record<string, string> = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#171717',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 5000;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(onRemove, 300);
  }, [onRemove]);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct <= 0) { dismiss(); return; }
      rafId = requestAnimationFrame(tick);
    };
    let rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [duration, dismiss]);

  const accent = accentColors[toast.type] || accentColors.info;

  return (
    <div
      role="alert"
      onClick={dismiss}
      className={`
        group relative cursor-pointer select-none
        w-[380px] max-w-[calc(100vw-32px)]
        px-4 py-3.5
        bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl
        border border-[var(--color-border-default)]/50
        rounded-2xl
        ${exiting ? 'animate-glass-out' : 'animate-glass-in'}
      `}
      style={{
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.10), 0 2px 8px -2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full"
        style={{ backgroundColor: accent }}
      />

      <div className="pl-2.5 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--color-text-primary)] leading-snug">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        className="absolute top-3 right-3 h-5 w-5 flex items-center justify-center rounded-full text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-neutral-100)] transition-all duration-200"
      >
        <X size={10} strokeWidth={2.5} />
      </button>

      {/* Progress */}
      <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] rounded-full overflow-hidden bg-[var(--color-neutral-100)]">
        <div
          className="h-full rounded-full transition-[width] duration-75 linear"
          style={{ width: `${progress}%`, backgroundColor: accent, opacity: 0.4 }}
        />
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[var(--z-toast)] flex flex-col-reverse gap-2.5 pointer-events-none">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            transform: `scale(${1 - (toasts.length - 1 - i) * 0.025})`,
            transition: 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <ToastItem toast={toast} onRemove={() => onRemove(toast.id)} />
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

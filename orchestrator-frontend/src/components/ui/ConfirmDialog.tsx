import { useEffect, useRef, useId } from 'react';
import { clsx } from 'clsx';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const msgId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    // Move focus to the confirm/action button on open
    const confirmBtn = dialog.querySelector<HTMLElement>('button:last-of-type');
    confirmBtn?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.closest('[hidden]'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px]"
        onClick={onCancel}
        style={{ animation: 'fadeIn 200ms ease-out forwards' }}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={msgId}
        className="relative w-full max-w-sm bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] p-6"
        style={{
          boxShadow: 'var(--shadow-modal)',
          animation: 'slideUp 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        <h3 id={titleId} className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p id={msgId} className="mt-2 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="btn-secondary h-9 px-4 text-[13px]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              variant === 'danger'
                ? 'bg-[var(--color-error)] text-[var(--color-text-inverse)] hover:bg-[var(--color-error-hover)] focus-visible:ring-[var(--color-error-ring)] active:scale-[0.98]'
                : variant === 'warning'
                  ? 'bg-[var(--color-warning)] text-[var(--color-text-inverse)] hover:bg-[var(--color-warning-hover)] focus-visible:ring-[var(--color-warning-ring)] active:scale-[0.98]'
                  : 'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)] hover:bg-[var(--color-neutral-800)] focus-visible:ring-[var(--color-neutral-300)] active:scale-[0.98]',
              isLoading && 'opacity-60 pointer-events-none',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

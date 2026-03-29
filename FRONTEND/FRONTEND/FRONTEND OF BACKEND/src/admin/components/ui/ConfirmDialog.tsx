import { AlertTriangle, X } from 'lucide-react';
import type { ConfirmDialogProps } from '@/shared/types';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-[var(--color-status-error-text)]',
      iconBg: 'bg-[var(--color-status-error-bg)]',
      confirmButton: 'btn-danger',
    },
    warning: {
      icon: 'text-[var(--color-status-warning-text)]',
      iconBg: 'bg-[var(--color-status-warning-bg)]',
      confirmButton: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning-text)] hover:bg-[var(--color-status-warning-border)]',
    },
    info: {
      icon: 'text-[var(--color-status-info-text)]',
      iconBg: 'bg-[var(--color-status-info-bg)]',
      confirmButton: 'btn-primary',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-[var(--radius-xl)] bg-[var(--color-surface-primary)] p-6 shadow-[var(--shadow-xl)] animate-slide-up">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`rounded-full p-3 ${styles.iconBg}`}>
            <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {title}
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={styles.confirmButton}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

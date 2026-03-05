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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onCancel}
        style={{ animation: 'fadeIn 200ms ease-out forwards' }}
      />
      <div
        className="relative w-full max-w-sm bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] p-6"
        style={{
          boxShadow: '0 24px 80px -16px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.05)',
          animation: 'slideUp 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
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
                ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300 active:scale-[0.98]'
                : variant === 'warning'
                  ? 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-300 active:scale-[0.98]'
                  : 'bg-[var(--color-neutral-900)] text-white hover:bg-[var(--color-neutral-800)] focus-visible:ring-[var(--color-neutral-300)] active:scale-[0.98]',
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

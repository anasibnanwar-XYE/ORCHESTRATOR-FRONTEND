import React from 'react';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import clsx from 'clsx';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  /** Additional content rendered below the description */
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual style — 'danger' uses red confirm button */
  variant?: 'default' | 'danger' | 'info';
  /** Disable confirm button while async operation runs */
  loading?: boolean;
}

/**
 * Confirm/cancel dialog wrapping ResponsiveModal.
 * Replaces all `window.confirm()` / `alert()` usage across the codebase.
 *
 * Usage:
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showDelete}
 *   onClose={() => setShowDelete(false)}
 *   onConfirm={handleDelete}
 *   title="Delete User"
 *   description="This action cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    if (!loading) onClose();
  };

  const Icon = variant === 'danger' ? Trash2 : variant === 'info' ? Info : AlertTriangle;

  const iconContainerClass = clsx(
    'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
    variant === 'danger' && 'bg-[var(--status-error-bg)]',
    variant === 'info' && 'bg-[var(--status-info-bg)]',
    variant === 'default' && 'bg-[var(--status-warning-bg)]',
  );

  const iconClass = clsx(
    'h-6 w-6',
    variant === 'danger' && 'text-[var(--status-error-text)]',
    variant === 'info' && 'text-[var(--status-info-text)]',
    variant === 'default' && 'text-[var(--status-warning-text)]',
  );

  const confirmBtnClass = clsx(
    'w-full sm:w-auto rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      : 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] focus:ring-[var(--border-focus)]',
  );

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <div className="text-center sm:text-left">
        <div className={iconContainerClass}>
          <Icon className={iconClass} />
        </div>

        <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h3>

        {description && (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {description}
          </p>
        )}

        {children && <div className="mt-3">{children}</div>}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:w-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--bg-surface-highlight)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className={confirmBtnClass}
        >
          {loading && (
            <svg className="mr-2 inline h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {confirmLabel}
        </button>
      </div>
    </ResponsiveModal>
  );
}

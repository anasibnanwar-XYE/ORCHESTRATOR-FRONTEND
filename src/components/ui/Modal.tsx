import { useEffect, useRef, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Focus trap: keep focus inside the modal while it is open
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;

    // Move focus into the dialog on open
    const firstFocusable = dialog.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px]"
        onClick={onClose}
        style={{ animation: 'fadeIn 200ms ease-out forwards' }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={clsx(
          'relative w-full max-h-[90vh] flex flex-col overflow-hidden bg-[var(--color-surface-primary)]',
          'rounded-t-2xl sm:rounded-2xl border border-[var(--color-border-default)]',
          'mx-0 sm:mx-auto',
          sizeStyles[size],
        )}
        style={{
          boxShadow: 'var(--shadow-modal)',
          animation: 'slideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-5 pt-5 pb-0 shrink-0">
            <div>
              {title && <h2 id={titleId} className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>}
              {description && <p id={descId} className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 h-9 w-9 sm:h-7 sm:w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div className="p-5 overflow-y-auto flex-1 overscroll-contain">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--color-border-subtle)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

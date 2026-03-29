import { useState, useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from './ConfirmDialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isDirty?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, description, children, footer, size = 'md', isDirty = false }: ModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  };

  const forceClose = () => {
    setShowConfirm(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => { 
      if (e.key === 'Escape' && !showConfirm) {
        handleCloseAttempt();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handleEsc); };
  }, [isOpen, showConfirm, isDirty]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
          onClick={handleCloseAttempt}
          style={{ animation: 'fadeIn 200ms ease-out forwards' }}
        />
        <div
          className={clsx(
            'relative w-full bg-[var(--color-surface-primary)]',
            'rounded-2xl border border-[var(--color-border-default)]',
            sizeStyles[size],
          )}
          style={{
            boxShadow: '0 24px 80px -16px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.05)',
            animation: 'slideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
          }}
        >
          {(title || description) && (
            <div className="flex items-start justify-between px-5 pt-5 pb-0">
              <div>
                {title && <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>}
                {description && <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">{description}</p>}
              </div>
              <button
                onClick={handleCloseAttempt}
                className="shrink-0 h-7 w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          )}
          <div className="p-5">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--color-border-subtle)]">
              {footer}
            </div>
          )}
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={showConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        variant="danger"
        onConfirm={forceClose}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

import { useState, useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from './ConfirmDialog';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isDirty?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Drawer({ isOpen, onClose, title, description, children, footer, side = 'right', size = 'md', isDirty = false }: DrawerProps) {
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
      <div className="fixed inset-0 z-[var(--z-modal)]">
        <div
          className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
          onClick={handleCloseAttempt}
          style={{ animation: 'fadeIn 200ms ease-out forwards' }}
        />
        <div
          className={clsx(
            'absolute top-0 bottom-0 w-full bg-[var(--color-surface-primary)]',
            'border-l border-[var(--color-border-default)]',
            'flex flex-col',
            sizeStyles[size],
            side === 'right' ? 'right-0' : 'left-0',
          )}
          style={{
            boxShadow: side === 'right'
              ? '-12px 0 48px -16px rgba(0,0,0,0.08)'
              : '12px 0 48px -16px rgba(0,0,0,0.08)',
            animation: `${side === 'right' ? 'slideInRight' : 'slideInLeft'} 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          }}
        >
          {(title || description) && (
            <div className="flex items-start justify-between p-5 border-b border-[var(--color-border-subtle)]">
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
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
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

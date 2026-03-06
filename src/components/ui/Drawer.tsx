import { useEffect, useRef, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Drawer({ isOpen, onClose, title, description, children, footer, side = 'right', size = 'md' }: DrawerProps) {
  const titleId = useId();
  const descId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);

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

  // Focus trap: keep focus inside the drawer while open
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const firstFocusable = drawer.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
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
    <div className="fixed inset-0 z-[var(--z-modal)]" role="presentation">
      <div
        className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px]"
        onClick={onClose}
        style={{ animation: 'fadeIn 200ms ease-out forwards' }}
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={clsx(
          'absolute top-0 bottom-0 w-full bg-[var(--color-surface-primary)]',
          'border-l border-[var(--color-border-default)]',
          'flex flex-col',
          sizeStyles[size],
          side === 'right' ? 'right-0' : 'left-0',
        )}
        style={{
          boxShadow: side === 'right'
            ? 'var(--shadow-drawer-right)'
            : 'var(--shadow-drawer-left)',
          animation: `${side === 'right' ? 'slideInRight' : 'slideInLeft'} 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        }}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-5 border-b border-[var(--color-border-subtle)]">
            <div>
              {title && <h2 id={titleId} className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>}
              {description && <p id={descId} className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 h-9 w-9 sm:h-7 sm:w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors"
              aria-label="Close panel"
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
  );
}

import {
  useEffect,
  useState,
  useCallback,
  type ReactNode,
  cloneElement,
  isValidElement,
  type ReactElement,
} from 'react';
import { clsx } from 'clsx';

export interface ActionSheetItem {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  items: ActionSheetItem[];
  onSelect: (id: string) => void;
  cancelLabel?: string;
}

/**
 * ActionSheet — contextual action menu.
 * On mobile: iOS-style bottom action sheet.
 * On desktop: small centered dropdown-style menu.
 */
export function ActionSheet({
  isOpen,
  onClose,
  title,
  items,
  onSelect,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      handleClose();
    },
    [onSelect, handleClose],
  );

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)]">
      <div
        className={clsx(
          'absolute inset-0 bg-black/30 backdrop-blur-[2px]',
          isClosing
            ? 'animate-[fadeOut_200ms_ease-out_forwards]'
            : 'animate-[fadeIn_200ms_ease-out_forwards]',
        )}
        onClick={handleClose}
      />

      {/* Desktop: dropdown-style menu */}
      <div className="hidden sm:flex items-center justify-center h-full p-4">
        <div
          className={clsx(
            'w-full max-w-xs bg-[var(--color-surface-primary)]',
            'rounded-xl border border-[var(--color-border-default)]',
            'overflow-hidden',
            isClosing
              ? 'animate-[slideDown_200ms_ease-in_forwards]'
              : 'animate-[slideUp_300ms_cubic-bezier(0.22,1,0.36,1)_forwards]',
          )}
          style={{ boxShadow: 'var(--shadow-modal)' }}
        >
          {title && (
            <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
              <p className="text-[12px] font-medium text-[var(--color-text-tertiary)] text-center">
                {title}
              </p>
            </div>
          )}
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && handleSelect(item.id)}
                disabled={item.disabled}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-2.5',
                  'text-left transition-colors duration-100',
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[var(--color-surface-tertiary)] active:bg-[var(--color-neutral-100)]',
                  item.variant === 'danger' && !item.disabled && 'text-red-600',
                )}
              >
                {item.icon &&
                  isValidElement(item.icon) &&
                  cloneElement(
                    item.icon as ReactElement<{ size?: number; className?: string }>,
                    { size: 16, className: 'shrink-0' },
                  )}
                <div className="min-w-0">
                  <span className="text-[13px] font-medium">{item.label}</span>
                  {item.description && (
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: iOS-style bottom action sheet */}
      <div
        className={clsx(
          'sm:hidden absolute bottom-0 left-0 right-0 px-3',
          'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
          isClosing
            ? 'animate-[sheetSlideDown_200ms_ease-in_forwards]'
            : 'animate-[sheetSlideUp_350ms_cubic-bezier(0.22,1,0.36,1)_forwards]',
        )}
      >
        {/* Action group */}
        <div className="bg-[var(--color-surface-primary)] rounded-2xl overflow-hidden border border-[var(--color-border-default)]">
          {title && (
            <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
              <p className="text-[12px] font-medium text-[var(--color-text-tertiary)] text-center">
                {title}
              </p>
            </div>
          )}
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && handleSelect(item.id)}
              disabled={item.disabled}
              className={clsx(
                'w-full flex items-center justify-center gap-2.5 px-4 py-3.5',
                'transition-colors duration-100',
                'active:bg-[var(--color-surface-tertiary)]',
                item.disabled && 'opacity-40',
                item.variant === 'danger'
                  ? 'text-red-600'
                  : 'text-[var(--color-text-primary)]',
                i < items.length - 1 && 'border-b border-[var(--color-border-subtle)]',
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {item.icon &&
                isValidElement(item.icon) &&
                cloneElement(item.icon as ReactElement<{ size?: number }>, { size: 18 })}
              <span className="text-[15px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <button
          onClick={handleClose}
          className={clsx(
            'w-full mt-2 py-3.5 bg-[var(--color-surface-primary)]',
            'rounded-2xl border border-[var(--color-border-default)]',
            'text-[15px] font-semibold text-[var(--color-text-primary)]',
            'active:bg-[var(--color-surface-tertiary)]',
            'transition-colors duration-100',
          )}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

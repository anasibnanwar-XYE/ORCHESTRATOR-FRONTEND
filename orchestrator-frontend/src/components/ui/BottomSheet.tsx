import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Height snap points as viewport percentages */
  snapPoints?: number[];
  /** Whether the sheet can be dismissed by dragging down */
  dismissible?: boolean;
  /** On desktop, render as a centered modal instead */
  desktopMode?: 'modal' | 'sheet';
}

/**
 * BottomSheet — mobile-first overlay.
 * On small screens: slides up from the bottom with drag-to-dismiss support.
 * On desktop (sm+): renders as a centered modal when desktopMode="modal".
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  snapPoints = [50, 90],
  dismissible = true,
  desktopMode = 'modal',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, currentY: 0, isDragging: false });
  const [translateY, setTranslateY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setTranslateY(0);
      onClose();
    }, 250);
  }, [onClose]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!dismissible) return;
      dragRef.current.startY = e.touches[0].clientY;
      dragRef.current.isDragging = true;
    },
    [dismissible],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging) return;
    const deltaY = e.touches[0].clientY - dragRef.current.startY;
    if (deltaY > 0) {
      setTranslateY(deltaY);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    if (translateY > 100) {
      handleClose();
    } else {
      setTranslateY(0);
    }
  }, [translateY, handleClose]);

  if (!isOpen && !isClosing) return null;

  const maxHeight = `${snapPoints[snapPoints.length - 1]}vh`;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)]">
      {/* Backdrop */}
      <div
        className={clsx(
          'absolute inset-0 bg-black/30 backdrop-blur-[2px]',
          isClosing
            ? 'animate-[fadeOut_250ms_ease-out_forwards]'
            : 'animate-[fadeIn_200ms_ease-out_forwards]',
        )}
        onClick={dismissible ? handleClose : undefined}
      />

      {/* Desktop: centered modal */}
      {desktopMode === 'modal' && (
        <div className="hidden sm:flex items-center justify-center h-full p-4">
          <div
            className={clsx(
              'relative w-full max-w-lg bg-[var(--color-surface-primary)]',
              'rounded-2xl border border-[var(--color-border-default)]',
              'flex flex-col max-h-[80vh]',
              isClosing
                ? 'animate-[slideDown_250ms_ease-in_forwards]'
                : 'animate-[slideUp_400ms_cubic-bezier(0.22,1,0.36,1)_forwards]',
            )}
            style={{
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            {(title || description) && (
              <div className="flex items-start justify-between px-5 pt-5 pb-0 shrink-0">
                <div>
                  {title && (
                    <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="shrink-0 h-7 w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--color-border-subtle)] shrink-0">
                {footer}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile: bottom sheet */}
      <div
        ref={sheetRef}
        className={clsx(
          desktopMode === 'modal' ? 'sm:hidden' : '',
          'absolute bottom-0 left-0 right-0',
          'bg-[var(--color-surface-primary)]',
          'rounded-t-2xl border-t border-x border-[var(--color-border-default)]',
          'flex flex-col',
          'pb-[env(safe-area-inset-bottom)]',
          isClosing
            ? 'animate-[sheetSlideDown_250ms_ease-in_forwards]'
            : 'animate-[sheetSlideUp_400ms_cubic-bezier(0.22,1,0.36,1)_forwards]',
        )}
        style={{
          maxHeight,
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: dragRef.current.isDragging
            ? 'none'
            : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 -12px 48px -16px rgba(0,0,0,0.12)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-9 h-1 rounded-full bg-[var(--color-neutral-300)]" />
        </div>

        {(title || description) && (
          <div className="flex items-start justify-between px-5 pt-1 pb-3 shrink-0">
            <div>
              {title && (
                <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="shrink-0 h-7 w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-3">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border-subtle)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

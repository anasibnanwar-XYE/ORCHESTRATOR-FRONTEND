import React, { useEffect } from 'react';
import clsx from 'clsx';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  mobileFullscreen?: boolean;
}

/**
 * Responsive modal that adapts to screen size
 * Mobile: Full screen or bottom sheet
 * Desktop: Centered modal
 */
export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
  mobileFullscreen = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getSizeClasses = () => {
    if (mobileFullscreen) {
      return 'w-full h-full max-w-full max-h-full rounded-none';
    }
    
    return clsx(
      'w-full mx-4', // Mobile: full width with margins
      'sm:mx-auto',  // Desktop: centered
      {
        'sm:max-w-sm': size === 'sm',
        'sm:max-w-md': size === 'md',
        'sm:max-w-lg': size === 'lg',
        'sm:max-w-xl': size === 'xl',
        'sm:max-w-full': size === 'full',
      }
    );
  };

  const modalPadding = mobileFullscreen ? 'p-0' : 'p-4 sm:p-6';
  const headerPadding = mobileFullscreen ? 'p-4' : 'p-4 sm:p-6';
  const contentPadding = mobileFullscreen ? 'p-4' : 'p-4 sm:p-6';
  const footerPadding = mobileFullscreen ? 'p-4' : 'p-4 sm:p-6';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity backdrop-blur-sm" />

      {/* Modal Container */}
      <div className={clsx("flex min-h-full", mobileFullscreen ? "p-0" : "items-end justify-center p-4 sm:items-center sm:p-0")}>
        <div
          className={clsx(
            "relative",
            modalPadding,
            "bg-white dark:bg-[var(--bg-surface)]",
            mobileFullscreen ? "rounded-none" : "rounded-t-lg sm:rounded-lg",
            "shadow-xl dark:shadow-2xl",
            "border border-[var(--border-primary)]",
            "transform transition-all",
            getSizeClasses(),
            className
          )}
          onClick={(e) => e.stopPropagation()}
          style={mobileFullscreen ? { minHeight: '100vh' } : {}}
        >
          {/* Header */}
          {title && (
            <div className={clsx("flex items-center justify-between border-b border-[var(--border-primary)]", headerPadding)}>
              <h3
                id="modal-title"
                className={clsx("font-semibold text-[var(--text-primary)]", mobileFullscreen ? 'text-xl' : 'text-lg sm:text-xl')}
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:hover:text-white"
                aria-label="Close"
              >
                <svg
                  className={clsx("text-[var(--text-primary)]", mobileFullscreen ? 'w-8 h-8' : 'w-6 h-6')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className={clsx(mobileFullscreen ? 'max-h-[calc(100vh-120px)]' : 'max-h-[calc(100vh-200px)]', "overflow-y-auto", contentPadding)}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={clsx("border-t border-[var(--border-primary)] flex", mobileFullscreen ? 'flex-col gap-3' : 'flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3', footerPadding)}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


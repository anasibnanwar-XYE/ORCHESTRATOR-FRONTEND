import { type ReactNode, cloneElement, isValidElement, type ReactElement } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FABProps {
  icon: ReactNode;
  label?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-center';
  /** Extra bottom offset to clear BottomNav */
  clearBottomNav?: boolean;
  className?: string;
}

/**
 * FAB — Floating Action Button.
 * Fixed-position primary action button for mobile surfaces.
 * Use clearBottomNav to offset above a BottomNav component.
 */
export function FAB({
  icon,
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  position = 'bottom-right',
  clearBottomNav = false,
  className,
}: FABProps) {
  const iconSize = size === 'lg' ? 22 : 18;

  return (
    <button
      onClick={onClick}
      className={twMerge(
        clsx(
          'fixed z-[var(--z-sticky)]',
          'inline-flex items-center justify-center gap-2',
          'font-medium shadow-lg',
          'transition-all duration-200 ease-out',
          'active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',

          // Variant
          variant === 'primary'
            ? 'bg-[var(--color-neutral-900)] text-white hover:bg-[var(--color-neutral-800)] focus-visible:ring-[var(--color-neutral-900)]'
            : clsx(
                'bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]',
                'border border-[var(--color-border-default)]',
                'hover:bg-[var(--color-surface-tertiary)]',
                'focus-visible:ring-[var(--color-neutral-300)]',
              ),

          // Size
          label
            ? size === 'lg'
              ? 'h-14 px-6 rounded-2xl text-[15px]'
              : 'h-12 px-5 rounded-xl text-[13px]'
            : size === 'lg'
              ? 'h-14 w-14 rounded-2xl'
              : 'h-12 w-12 rounded-xl',

          // Position
          position === 'bottom-right' && 'right-4 sm:right-6',
          position === 'bottom-center' && 'left-1/2 -translate-x-1/2',

          // Bottom offset
          clearBottomNav
            ? 'bottom-[calc(4rem+env(safe-area-inset-bottom))] sm:bottom-6'
            : 'bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6',
        ),
        className,
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {isValidElement(icon) &&
        cloneElement(icon as ReactElement<{ size?: number; className?: string }>, {
          size: iconSize,
          className: 'shrink-0',
        })}
      {label && <span>{label}</span>}
    </button>
  );
}

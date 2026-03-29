import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)]',
  success: 'text-[var(--color-status-success-text)] bg-[var(--color-status-success-bg)]',
  warning: 'text-[var(--color-status-warning-text)] bg-[var(--color-status-warning-bg)]',
  danger: 'text-[var(--color-status-error-text)] bg-[var(--color-status-error-bg)]',
  info: 'text-[var(--color-status-info-text)] bg-[var(--color-status-info-bg)]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-neutral-400)]',
  success: 'bg-[var(--color-success-icon)]',
  warning: 'bg-[var(--color-warning-icon)]',
  danger: 'bg-[var(--color-error)]',
  info: 'bg-[var(--color-primary-500)]',
};

export function Badge({
  variant = 'default',
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2 py-0.5',
          'text-xs font-medium rounded-md',
          variantStyles[variant],
        ),
        className,
      )}
    >
      {dot && (
        <span className={clsx('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

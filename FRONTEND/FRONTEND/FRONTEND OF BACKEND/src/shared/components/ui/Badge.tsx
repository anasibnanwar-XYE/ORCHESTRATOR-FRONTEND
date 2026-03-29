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
  success: 'text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)]',
  warning: 'text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)]',
  danger: 'text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)]',
  info: 'text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-neutral-400)]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
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

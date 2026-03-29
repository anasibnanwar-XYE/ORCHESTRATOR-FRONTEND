import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface KBDProps {
  children: ReactNode;
  className?: string;
}

export function KBD({ children, className }: KBDProps) {
  return (
    <kbd className={clsx(
      'inline-flex items-center justify-center h-5 min-w-[20px] px-1.5',
      'text-[10px] font-medium',
      'text-[var(--color-text-tertiary)]',
      'bg-[var(--color-surface-tertiary)] border border-[var(--color-border-default)]',
      'rounded shadow-[0_1px_0_var(--color-border-strong)]',
      'select-none',
      className,
    )}>
      {children}
    </kbd>
  );
}

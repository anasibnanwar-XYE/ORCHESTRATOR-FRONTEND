import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface TopBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function TopBar({ left, center, right, className }: TopBarProps) {
  return (
    <header
      className={clsx(
        'h-14 shrink-0 flex items-center justify-between gap-4 px-5',
        'bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)]',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {left}
      </div>
      {center && (
        <div className="flex-1 flex justify-center max-w-md">
          {center}
        </div>
      )}
      <div className="flex items-center gap-2 shrink-0">
        {right}
      </div>
    </header>
  );
}

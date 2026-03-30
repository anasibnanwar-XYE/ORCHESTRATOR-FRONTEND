import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; label?: string };
  className?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, change, className, icon }: StatCardProps) {
  const isPositive = change && change.value >= 0;

  return (
    <div className={clsx(
      'p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
      className,
    )}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
          {label}
        </p>
        {icon && <div className="text-[var(--color-text-tertiary)]">{icon}</div>}
      </div>
      <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1.5 tabular-nums tracking-tight">
        {value}
      </p>
      {change && (
        <p className="mt-1.5 text-[11px] tabular-nums">
          <span className={isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>
            {isPositive ? '+' : ''}{change.value}%
          </span>
          {change.label && (
            <span className="text-[var(--color-text-tertiary)] ml-1">{change.label}</span>
          )}
        </p>
      )}
    </div>
  );
}

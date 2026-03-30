import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; label?: string };
  className?: string;
  icon?: ReactNode;
  /** Optional detail text shown below the value (e.g. "Last updated 3 hours ago") */
  detail?: string;
  /** Optional sparkline ReactNode displayed in the header area next to the label */
  sparkline?: ReactNode;
}

export function StatCard({ label, value, change, className, icon, detail, sparkline }: StatCardProps) {
  const isPositive = change && change.value >= 0;

  return (
    <div className={clsx(
      'p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
      className,
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className={clsx(
          'font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]',
          sparkline ? 'text-[10px] tracking-[0.1em] leading-snug' : 'text-[11px]',
        )}>
          {label}
        </p>
        {sparkline ?? (icon ? <div className="text-[var(--color-text-tertiary)]">{icon}</div> : null)}
      </div>
      {sparkline && <div className="mb-0.5" />}
      <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1.5 tabular-nums tracking-tight">
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)] truncate">
          {detail}
        </p>
      )}
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

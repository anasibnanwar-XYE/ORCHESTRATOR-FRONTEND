import { clsx } from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; label?: string };
  className?: string;
}

export function StatCard({ label, value, change, className }: StatCardProps) {
  const isPositive = change && change.value >= 0;

  return (
    <div className={clsx(
      'p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
      className,
    )}>
      <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1.5 tabular-nums tracking-tight">
        {value}
      </p>
      {change && (
        <p className="mt-1.5 text-[11px] tabular-nums">
          <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
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

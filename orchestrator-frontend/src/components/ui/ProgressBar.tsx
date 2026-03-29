import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, size = 'sm', label, showValue, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx('space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">{label}</span>
          )}
          {showValue && (
            <span className="text-[11px] tabular-nums font-medium text-[var(--color-text-secondary)]">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div className={clsx(
        'w-full bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
      )}>
        <div
          className="h-full bg-[var(--color-neutral-900)] rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

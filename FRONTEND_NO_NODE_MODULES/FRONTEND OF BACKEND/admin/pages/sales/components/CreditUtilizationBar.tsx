import clsx from 'clsx';

interface CreditUtilizationBarProps {
  percent: number;
  isOverLimit?: boolean;
  isNearLimit?: boolean;
  compact?: boolean;
}

export function CreditUtilizationBar({
  percent,
  isOverLimit = false,
  isNearLimit = false,
  compact = false,
}: CreditUtilizationBarProps) {
  const barColor = isOverLimit
    ? 'bg-status-error-bg'
    : isNearLimit
    ? 'bg-status-warning-bg'
    : 'bg-status-success-bg';

  const barHeight = compact ? 'h-1.5' : 'h-2';

  return (
    <div className="space-y-1">
      <div className={clsx('w-full rounded-full bg-surface-highlight overflow-hidden', barHeight)}>
        <div
          className={clsx('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {!compact && (
        <p className="text-xs text-tertiary">
          {isOverLimit && '⚠️ Over credit limit'}
          {isNearLimit && !isOverLimit && '⚠️ Approaching limit'}
          {!isOverLimit && !isNearLimit && `${percent}% utilized`}
        </p>
      )}
    </div>
  );
}

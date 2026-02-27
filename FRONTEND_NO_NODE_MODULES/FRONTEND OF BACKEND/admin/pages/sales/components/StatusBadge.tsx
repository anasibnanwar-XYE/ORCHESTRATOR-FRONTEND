import clsx from 'clsx';

type DealerStatus = 'active' | 'suspended' | 'on-hold' | 'pending';

interface StatusBadgeProps {
  status: DealerStatus;
  size?: 'sm' | 'md';
}

const statusConfig = {
  active: {
    bg: 'bg-status-success-bg',
    text: 'text-status-success-text',
    label: 'Active',
  },
  suspended: {
    bg: 'bg-status-error-bg',
    text: 'text-status-error-text',
    label: 'Suspended',
  },
  'on-hold': {
    bg: 'bg-status-warning-bg',
    text: 'text-status-warning-text',
    label: 'On hold',
  },
  pending: {
    bg: 'bg-surface-highlight',
    text: 'text-secondary',
    label: 'Pending',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}

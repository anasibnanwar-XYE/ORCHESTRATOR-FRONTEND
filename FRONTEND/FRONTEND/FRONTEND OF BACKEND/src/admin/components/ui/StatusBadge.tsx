import { CheckCircle, XCircle, Clock, AlertCircle, type LucideIcon } from 'lucide-react';

type StatusType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'pending' 
  | 'active' 
  | 'inactive' 
  | 'approved' 
  | 'rejected'
  | 'draft'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { 
  bg: string; 
  text: string; 
  border: string;
  icon: LucideIcon | null;
}> = {
  success: {
    bg: 'bg-[var(--color-status-success-bg)]',
    text: 'text-[var(--color-status-success-text)]',
    border: 'border-[var(--color-status-success-border)]',
    icon: CheckCircle,
  },
  active: {
    bg: 'bg-[var(--color-status-success-bg)]',
    text: 'text-[var(--color-status-success-text)]',
    border: 'border-[var(--color-status-success-border)]',
    icon: CheckCircle,
  },
  approved: {
    bg: 'bg-[var(--color-status-success-bg)]',
    text: 'text-[var(--color-status-success-text)]',
    border: 'border-[var(--color-status-success-border)]',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-[var(--color-status-error-bg)]',
    text: 'text-[var(--color-status-error-text)]',
    border: 'border-[var(--color-status-error-border)]',
    icon: XCircle,
  },
  rejected: {
    bg: 'bg-[var(--color-status-error-bg)]',
    text: 'text-[var(--color-status-error-text)]',
    border: 'border-[var(--color-status-error-border)]',
    icon: XCircle,
  },
  inactive: {
    bg: 'bg-[var(--color-status-error-bg)]',
    text: 'text-[var(--color-status-error-text)]',
    border: 'border-[var(--color-status-error-border)]',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-[var(--color-status-warning-bg)]',
    text: 'text-[var(--color-status-warning-text)]',
    border: 'border-[var(--color-status-warning-border)]',
    icon: AlertCircle,
  },
  pending: {
    bg: 'bg-[var(--color-status-pending-bg)]',
    text: 'text-[var(--color-status-pending-text)]',
    border: 'border-[var(--color-status-pending-border)]',
    icon: Clock,
  },
  draft: {
    bg: 'bg-[var(--color-status-pending-bg)]',
    text: 'text-[var(--color-status-pending-text)]',
    border: 'border-[var(--color-status-pending-border)]',
    icon: Clock,
  },
  info: {
    bg: 'bg-[var(--color-status-info-bg)]',
    text: 'text-[var(--color-status-info-text)]',
    border: 'border-[var(--color-status-info-border)]',
    icon: AlertCircle,
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || statusConfig.info;
  const Icon = config.icon;
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {displayLabel}
    </span>
  );
}

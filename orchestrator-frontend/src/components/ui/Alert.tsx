import { type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AlertProps {
  title: string;
  description?: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  icon?: boolean;
  onClose?: () => void;
  className?: string;
  action?: ReactNode;
}

const variantStyles = {
  info: 'bg-[var(--color-status-info-bg)] border-[var(--color-status-info-border)] text-[var(--color-status-info-text)] [&_svg]:text-[var(--color-info)]',
  success: 'bg-[var(--color-status-success-bg)] border-[var(--color-status-success-border)] text-[var(--color-status-success-text)] [&_svg]:text-[var(--color-success-icon)]',
  warning: 'bg-[var(--color-status-warning-bg)] border-[var(--color-status-warning-border)] text-[var(--color-status-warning-text)] [&_svg]:text-[var(--color-warning-icon)]',
  danger: 'bg-[var(--color-status-error-bg)] border-[var(--color-status-error-border)] text-[var(--color-status-error-text)] [&_svg]:text-[var(--color-error-icon)]',
};

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

export function Alert({
  title,
  description,
  variant = 'info',
  icon = true,
  onClose,
  action,
  className,
}: AlertProps) {
  const Icon = icons[variant];

  return (
    <div
      className={twMerge(
        clsx(
          'relative flex items-start gap-3 p-4 border rounded-xl shadow-sm text-[13px]',
          variantStyles[variant],
        ),
        className,
      )}
    >
      {icon && <Icon size={18} className="shrink-0 mt-0.5" />}

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold mb-0.5">{title}</h4>
        {description && (
          <div className="opacity-90 leading-relaxed text-[12px]">{description}</div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 -m-1 opacity-60 hover:opacity-100 transition-opacity rounded-md hover:bg-black/5"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

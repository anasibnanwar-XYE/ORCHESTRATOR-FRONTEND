import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={clsx('space-y-3', className)}>
      {breadcrumb}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-xl font-semibold text-[var(--color-text-primary)] tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

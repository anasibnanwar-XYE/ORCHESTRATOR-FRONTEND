import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-6 ${className}`}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-secondary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-primary truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-secondary truncate">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

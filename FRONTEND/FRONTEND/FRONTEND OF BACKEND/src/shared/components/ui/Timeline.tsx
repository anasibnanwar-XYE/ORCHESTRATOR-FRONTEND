import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TimelineItemProps {
  id: string;
  title: string;
  description?: string;
  time?: string;
  icon?: ReactNode;
  status?: 'default' | 'success' | 'warning' | 'danger';
}

export interface TimelineProps {
  items: TimelineItemProps[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  const statusColors = {
    default: 'bg-[var(--color-surface-secondary)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    warning: 'bg-amber-50 border-amber-200 text-amber-600',
    danger: 'bg-red-50 border-red-200 text-red-600',
  };

  return (
    <div className={twMerge('space-y-0 text-[13px]', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const colorClass = statusColors[item.status || 'default'];

        return (
          <div key={item.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-3 top-8 bottom-[-8px] w-px bg-[var(--color-border-default)]" />
            )}
            
            {/* Icon/Dot */}
            <div className="relative z-10 flex flex-col items-center shrink-0">
              <div className={clsx('w-6 h-6 rounded-full border flex items-center justify-center bg-[var(--color-surface-primary)]', colorClass)}>
                {item.icon ? (
                  <div className="scale-75">{item.icon}</div>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="pb-8 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-1 mt-0.5">
                <span className="font-medium text-[var(--color-text-primary)]">{item.title}</span>
                {item.time && (
                  <span className="text-[11px] text-[var(--color-text-tertiary)] shrink-0">{item.time}</span>
                )}
              </div>
              {item.description && (
                <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

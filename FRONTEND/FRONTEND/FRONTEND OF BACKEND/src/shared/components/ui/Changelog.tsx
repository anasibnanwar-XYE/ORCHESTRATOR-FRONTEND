import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ChangelogItem {
  version: string;
  date: string;
  title?: string;
  changes: {
    type: 'feature' | 'fix' | 'improvement' | 'deprecation';
    description: ReactNode;
  }[];
}

export interface ChangelogProps {
  items: ChangelogItem[];
  className?: string;
}

const typeStyles = {
  feature: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  fix: 'bg-red-50 text-red-600 border-red-200',
  improvement: 'bg-blue-50 text-blue-600 border-blue-200',
  deprecation: 'bg-amber-50 text-amber-600 border-amber-200',
};

const typeLabels = {
  feature: 'New',
  fix: 'Fix',
  improvement: 'Improved',
  deprecation: 'Deprecated',
};

export function Changelog({ items, className }: ChangelogProps) {
  return (
    <div className={twMerge('space-y-8', className)}>
      {items.map((item, index) => (
        <div key={item.version} className="relative">
          {index !== items.length - 1 && (
            <div className="absolute left-3 top-8 bottom-[-32px] w-px bg-[var(--color-border-subtle)] hidden sm:block" />
          )}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            {/* Version & Date Column */}
            <div className="sm:w-32 shrink-0 pt-1">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-6 h-6 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] items-center justify-center relative z-10 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral-400)]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                    {item.version}
                  </h3>
                  <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
                    {item.date}
                  </p>
                </div>
              </div>
            </div>

            {/* Changes Column */}
            <div className="flex-1 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-5 shadow-sm">
              {item.title && (
                <h4 className="text-[14px] font-medium text-[var(--color-text-primary)] mb-4">
                  {item.title}
                </h4>
              )}
              <ul className="space-y-3">
                {item.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={clsx(
                      'shrink-0 inline-flex items-center justify-center px-1.5 h-5 text-[10px] font-medium uppercase tracking-wide border rounded mt-0.5 min-w-[60px]',
                      typeStyles[change.type]
                    )}>
                      {typeLabels[change.type]}
                    </span>
                    <span className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                      {change.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

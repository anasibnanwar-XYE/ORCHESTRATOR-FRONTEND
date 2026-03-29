import { clsx } from 'clsx';

interface Tab {
  label: string;
  value: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
  variant?: 'underline' | 'pill';
  size?: 'sm' | 'md';
  className?: string;
}

export function Tabs({ tabs, active, onChange, variant = 'underline', size = 'md', className }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={clsx('inline-flex items-center gap-1 p-0.5 bg-[var(--color-surface-tertiary)] rounded-lg', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={clsx(
              'px-3 rounded-md transition-all duration-150',
              size === 'sm' ? 'h-7 text-[12px]' : 'h-8 text-[13px]',
              'font-medium',
              active === tab.value
                ? 'bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10px] tabular-nums opacity-60">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center gap-0 border-b border-[var(--color-border-default)]', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'px-4 transition-all duration-150',
            size === 'sm' ? 'pb-2.5 text-[12px]' : 'pb-3 text-[13px]',
            'font-medium -mb-px border-b-2',
            active === tab.value
              ? 'border-[var(--color-neutral-900)] text-[var(--color-text-primary)]'
              : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx(
              'ml-1.5 text-[10px] tabular-nums',
              active === tab.value ? 'opacity-50' : 'opacity-40',
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

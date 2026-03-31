import { clsx } from 'clsx';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={clsx('flex items-center gap-1', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.label} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-[11px] text-[var(--color-text-tertiary)] shrink-0 select-none" aria-hidden="true">/</span>
            )}
            {isLast ? (
              <span className="text-[12px] font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}

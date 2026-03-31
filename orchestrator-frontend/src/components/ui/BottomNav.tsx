import { type ReactNode, type ReactElement, cloneElement, isValidElement } from 'react';
import { clsx } from 'clsx';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number | string;
  href?: string;
}

interface BottomNavProps {
  items: BottomNavItem[];
  activeId: string;
  onNavigate: (id: string, href?: string) => void;
  className?: string;
}

/**
 * BottomNav — fixed bottom navigation for mobile.
 * Auto-hides on screens wider than 640px (sm breakpoint).
 * Pair with MobileAppShell to ensure the main content area
 * gets bottom padding to avoid overlap.
 */
export function BottomNav({ items, activeId, onNavigate, className }: BottomNavProps) {
  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-[var(--z-sticky)]',
        'bg-[var(--color-surface-primary)]/95 backdrop-blur-xl',
        'border-t border-[var(--color-border-default)]',
        'pb-[env(safe-area-inset-bottom)] sm:hidden',
        className,
      )}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id, item.href)}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5',
                'flex-1 h-full min-w-0',
                'transition-colors duration-150',
                'active:scale-95 active:opacity-70',
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="relative">
                {isValidElement(item.icon) &&
                  cloneElement(
                    item.icon as ReactElement<{ size?: number; className?: string }>,
                    {
                      size: 20,
                      className: clsx(
                        'transition-colors duration-150',
                        isActive
                          ? 'text-[var(--color-neutral-900)]'
                          : 'text-[var(--color-text-tertiary)]',
                      ),
                    },
                  )}
                {item.badge !== undefined && (
                  <span
                    className={clsx(
                      'absolute -top-1 -right-2 min-w-[16px] h-4 px-1',
                      'flex items-center justify-center',
                      'text-[9px] font-bold text-white tabular-nums',
                      'bg-[var(--color-error)] rounded-full',
                    )}
                  >
                    {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  'text-[10px] font-medium leading-tight truncate max-w-full',
                  'transition-colors duration-150',
                  isActive
                    ? 'text-[var(--color-neutral-900)]'
                    : 'text-[var(--color-text-tertiary)]',
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

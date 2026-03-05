import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { OrchestratorLogo } from './OrchestratorLogo';

interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: string | number;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
  activeId: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({
  groups,
  activeId,
  onNavigate,
  onLogout,
  collapsed = false,
  className,
}: SidebarProps) {
  return (
    <aside
      className={clsx(
        'h-screen flex flex-col bg-[var(--color-surface-primary)] border-r border-[var(--color-border-default)]',
        collapsed ? 'w-16' : 'w-[220px]',
        'transition-[width] duration-200 ease-out',
        className,
      )}
    >
      {/* Brand */}
      <div className={clsx(
        'shrink-0 border-b border-[var(--color-border-subtle)]',
        collapsed ? 'px-3 py-4 flex justify-center' : 'px-5 py-5',
      )}>
        {collapsed ? (
          <OrchestratorLogo size={24} variant="mark" />
        ) : (
          <OrchestratorLogo size={22} variant="full" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 no-scrollbar">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.title && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.href)}
                    className={clsx(
                      'w-full flex items-center justify-between rounded-lg transition-all duration-150',
                      collapsed ? 'h-9 justify-center' : 'h-8 px-3',
                      isActive
                        ? 'bg-[var(--color-neutral-900)] text-white'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {collapsed ? (
                      <span className="text-[11px] font-semibold">{item.label.charAt(0)}</span>
                    ) : (
                      <>
                        <span className="text-[13px] font-medium truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className={clsx(
                            'text-[10px] font-semibold tabular-nums rounded-full px-1.5 py-px',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]',
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--color-border-subtle)] p-2">
        <button
          onClick={onLogout}
          className={clsx(
            'w-full rounded-lg text-[13px] font-medium text-[var(--color-text-tertiary)] hover:text-red-600 hover:bg-red-50 transition-colors',
            collapsed ? 'h-9 flex items-center justify-center' : 'h-8 px-3 text-left',
          )}
        >
          {collapsed ? '←' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

/**
 * Mobile sidebar wrapper with overlay
 */
export function MobileSidebar({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] lg:hidden">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ animation: 'slideInLeft 250ms cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
      >
        {children}
      </div>
    </div>
  );
}

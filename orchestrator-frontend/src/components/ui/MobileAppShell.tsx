import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { OrchestratorLogo } from './OrchestratorLogo';

interface MobileAppShellProps {
  children: ReactNode;
  /** Top bar content — left side (shown after the menu button) */
  topBarLeft?: ReactNode;
  /** Top bar content — right side */
  topBarRight?: ReactNode;
  /** Sidebar content rendered inside the mobile drawer */
  sidebar?: ReactNode;
  /** Bottom nav component (e.g. <BottomNav />) */
  bottomNav?: ReactNode;
  /** Whether to show the logo in the top bar */
  showLogo?: boolean;
  /** Page title shown in top bar */
  title?: string;
  className?: string;
}

/**
 * MobileAppShell — responsive shell wrapper.
 *
 * Provides:
 * - A sticky top bar with a hamburger menu trigger (hidden on sm+)
 * - A slide-in sidebar overlay for mobile navigation
 * - A main content area with optional bottom-nav padding
 * - A slot for a BottomNav component
 *
 * Usage:
 * ```tsx
 * <MobileAppShell
 *   title="Dashboard"
 *   sidebar={<MySidebarContent />}
 *   topBarRight={<ProfileMenu />}
 *   bottomNav={<BottomNav items={...} />}
 * >
 *   <PageContent />
 * </MobileAppShell>
 * ```
 */
export function MobileAppShell({
  children,
  topBarLeft,
  topBarRight,
  sidebar,
  bottomNav,
  showLogo = true,
  title,
  className,
}: MobileAppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={clsx('min-h-screen flex flex-col bg-[var(--color-surface-secondary)]', className)}>
      {/* Sticky top bar */}
      <header
        className={clsx(
          'sticky top-0 z-[var(--z-sticky)]',
          'flex items-center justify-between gap-3',
          'h-12 sm:h-14 px-3 sm:px-5',
          'bg-[var(--color-surface-primary)]/95 backdrop-blur-xl',
          'border-b border-[var(--color-border-default)]',
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {sidebar && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={clsx(
                'h-9 w-9 flex items-center justify-center rounded-lg sm:hidden',
                'text-[var(--color-text-secondary)]',
                'hover:bg-[var(--color-surface-tertiary)]',
                'active:bg-[var(--color-neutral-100)]',
                'transition-colors duration-150',
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          )}
          {showLogo && (
            <div className="hidden sm:block">
              <OrchestratorLogo size={20} variant="full" />
            </div>
          )}
          {showLogo && (
            <div className="sm:hidden">
              <OrchestratorLogo size={20} variant="mark" />
            </div>
          )}
          {title && (
            <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate">
              {title}
            </h1>
          )}
          {topBarLeft}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">{topBarRight}</div>
      </header>

      {/* Content area */}
      <main
        className={clsx(
          'flex-1',
          bottomNav && 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] sm:pb-0',
        )}
      >
        {children}
      </main>

      {/* Mobile sidebar overlay */}
      {sidebar && isSidebarOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] sm:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setIsSidebarOpen(false)}
            style={{ animation: 'fadeIn 200ms ease-out forwards' }}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw]"
            style={{ animation: 'slideInLeft 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
          >
            <div className="h-full bg-[var(--color-surface-primary)] border-r border-[var(--color-border-default)] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 h-12 border-b border-[var(--color-border-subtle)] shrink-0">
                <OrchestratorLogo size={20} variant="full" />
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">{sidebar}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav slot */}
      {bottomNav}
    </div>
  );
}

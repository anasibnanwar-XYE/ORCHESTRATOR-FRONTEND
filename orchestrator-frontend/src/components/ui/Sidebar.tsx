import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, LogOut, PanelLeft, PanelLeftClose, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { OrchestratorLogo } from './OrchestratorLogo';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SidebarNavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string | number;
  end?: boolean;
}

export interface SidebarNavGroup {
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarProps {
  portalName: string;
  groups: SidebarNavGroup[];
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  showBackToHub?: boolean;
  onBackToHub?: () => void;
  footerSlot?: ReactNode;
  onSignOut: () => void;
  onNavClick?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
  /* ── Shell ── */
  .sb {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-surface-primary);
    border-right: 1px solid var(--color-border-default);
    /* No will-change — it creates GPU compositing layers that clip fixed backdrops */
    transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    /* iOS safe area — sidebar sits on the left edge where notch/dynamic island can be */
    padding-left: env(safe-area-inset-left, 0px);
  }
  .sb.sb-x { width: 220px; }
  .sb.sb-c { width: 52px; }

  /* ── Header ── */
  .sb-header {
    flex-shrink: 0;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px 0 14px;
    border-bottom: 1px solid var(--color-border-subtle);
    gap: 6px;
  }
  .sb.sb-c .sb-header {
    padding: 0 8px;
    justify-content: space-between;
  }

  .sb-logo-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }
  .sb.sb-c .sb-logo-block { display: none; }

  /* The mark shown only when collapsed */
  .sb-mark-only { display: none; }
  .sb.sb-c .sb-mark-only { display: flex; align-items: center; }

  .sb-portal-tag {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-text-tertiary);
    white-space: nowrap;
    margin-top: 1px;
  }

  /* ── Collapse toggle ── */
  .sb-toggle {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: color 140ms ease, background 140ms ease;
  }
  .sb-toggle:hover {
    color: var(--color-text-primary);
    background: var(--color-surface-tertiary);
  }

  /* ── Scrollable nav ── */
  .sb-nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 6px;
    scrollbar-width: none;
  }
  .sb-nav::-webkit-scrollbar { display: none; }

  /* ── Back to hub ── */
  .sb-back {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 28px;
    padding: 0 8px;
    margin-bottom: 6px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--color-text-tertiary);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    transition: color 140ms ease, background 140ms ease;
  }
  .sb-back:hover { color: var(--color-text-secondary); background: var(--color-surface-tertiary); }
  .sb.sb-c .sb-back { justify-content: center; padding: 0; gap: 0; }

  .sb-back-text {
    transition: opacity 160ms ease;
    white-space: nowrap;
    overflow: hidden;
  }
  .sb.sb-c .sb-back-text { opacity: 0; width: 0; }

  /* ── Nav group ── */
  .sb-group + .sb-group {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid var(--color-border-subtle);
  }

  .sb-group-label {
    padding: 0 10px;
    margin-bottom: 3px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    opacity: 1;
    max-height: 20px;
    transition: opacity 160ms ease, max-height 160ms ease, margin 160ms ease;
  }
  .sb.sb-c .sb-group-label {
    opacity: 0;
    max-height: 0;
    margin-bottom: 0;
    pointer-events: none;
  }

  /* ── Nav item ── */
  .sb-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    height: 34px;
    padding: 0 10px;
    margin-bottom: 1px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--color-text-secondary);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    transition: background 130ms ease, color 130ms ease;
  }
  .sb-item:hover {
    background: var(--color-surface-tertiary);
    color: var(--color-text-primary);
  }
  .sb-item.on {
    background: var(--color-neutral-900);
    color: #fff;
  }
  .dark .sb-item.on {
    background: rgba(255,255,255,0.1);
    color: var(--color-text-primary);
  }
  /* Collapsed: icon centered */
  .sb.sb-c .sb-item {
    padding: 0;
    justify-content: center;
    gap: 0;
  }

  /* ── Icon ── */
  .sb-icon {
    flex-shrink: 0;
    opacity: 0.5;
    transition: opacity 130ms ease;
    color: inherit;
  }
  .sb-item:hover .sb-icon { opacity: 0.75; }
  .sb-item.on .sb-icon { opacity: 0.9; }

  /* ── Label ── */
  .sb-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    opacity: 1;
    transition: opacity 160ms ease;
  }
  .sb.sb-c .sb-label { opacity: 0; width: 0; flex: 0; }

  /* ── Badge ── */
  .sb-badge {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 999px;
    line-height: 1.5;
    transition: opacity 160ms ease;
  }
  .sb-badge-off { background: var(--color-surface-tertiary); color: var(--color-text-tertiary); }
  .sb-badge-on  { background: rgba(255,255,255,0.2); color: #fff; }
  .sb.sb-c .sb-badge { opacity: 0; width: 0; padding: 0; overflow: hidden; }

  /* ── Tooltip (collapsed mode only) ── */
  .sb.sb-c .sb-item::after,
  .sb.sb-c .sb-back::after,
  .sb.sb-c .sb-signout::after {
    content: attr(data-tip);
    position: fixed;
    left: 60px;
    background: #171717;
    color: #fff;
    font-size: 11.5px;
    font-weight: 500;
    padding: 5px 10px;
    border-radius: 7px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 120ms ease, transform 120ms ease;
    z-index: 9999;
    box-shadow: 0 4px 16px rgba(0,0,0,0.16);
    font-family: inherit;
  }
  .sb.sb-c .sb-item:hover::after,
  .sb.sb-c .sb-back:hover::after,
  .sb.sb-c .sb-signout:hover::after {
    opacity: 1;
    transform: translateX(0);
  }

  /* ── Footer ── */
  .sb-footer {
    flex-shrink: 0;
    padding: 6px;
    border-top: 1px solid var(--color-border-subtle);
  }

  .sb-signout {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    height: 34px;
    padding: 0 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-tertiary);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    transition: color 130ms ease, background 130ms ease;
  }
  .sb-signout:hover { color: var(--color-error); background: var(--color-error-bg); }
  .sb.sb-c .sb-signout { justify-content: center; padding: 0; gap: 0; }

  .sb-signout-label {
    opacity: 1;
    transition: opacity 160ms ease;
    overflow: hidden;
  }
  .sb.sb-c .sb-signout-label { opacity: 0; width: 0; }

  /* ── Mobile overlay ── */
  @keyframes sb-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes sb-slide-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }

  .sb-overlay-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    animation: sb-fade-in 200ms ease forwards;
    z-index: 299;
  }
  .sb-overlay-panel {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    /* Extend past notch on left-side iOS */
    padding-bottom: env(safe-area-inset-bottom, 0px);
    animation: sb-slide-in 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    z-index: 300;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar({
  portalName,
  groups,
  collapsed,
  onCollapsedChange,
  showBackToHub,
  onBackToHub,
  footerSlot,
  onSignOut,
  onNavClick,
}: SidebarProps) {
  const shell = clsx('sb', collapsed ? 'sb-c' : 'sb-x');

  return (
    <>
      <style>{STYLES}</style>
      <aside className={shell}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="sb-header">
          {/* Expanded: full logo + portal tag */}
          <div className="sb-logo-block">
            <OrchestratorLogo size={15} variant="full" />
            <span className="sb-portal-tag">{portalName}</span>
          </div>

          {/* Collapsed: mark only */}
          <div className="sb-mark-only">
            <OrchestratorLogo size={16} variant="mark" />
          </div>

          <button
            className="sb-toggle"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <PanelLeft size={14} strokeWidth={1.75} />
              : <PanelLeftClose size={14} strokeWidth={1.75} />}
          </button>
        </div>

        {/* ── Nav ────────────────────────────────────────── */}
        <nav className="sb-nav" aria-label={`${portalName} navigation`}>

          {showBackToHub && (
            <button
              className="sb-back"
              data-tip="All portals"
              onClick={() => { onNavClick?.(); onBackToHub?.(); }}
            >
              <ChevronLeft size={13} strokeWidth={1.75} style={{ flexShrink: 0, opacity: 0.55 }} />
              <span className="sb-back-text">All portals</span>
            </button>
          )}

          {groups.map((group, gi) => (
            <div key={gi} className="sb-group">
              {group.label && (
                <p className="sb-group-label">{group.label}</p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end={item.end}
                  onClick={onNavClick}
                  data-tip={item.label}
                  aria-label={item.label}
                  className={({ isActive }) => clsx('sb-item', isActive && 'on')}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className="sb-icon"
                        size={15}
                        strokeWidth={1.75}
                      />
                      <span className="sb-label">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className={clsx('sb-badge', isActive ? 'sb-badge-on' : 'sb-badge-off')}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="sb-footer">
          {footerSlot}
          <button
            className="sb-signout"
            data-tip="Sign out"
            onClick={onSignOut}
          >
            <LogOut className="sb-icon" size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span className="sb-signout-label">Sign out</span>
          </button>
        </div>

      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile drawer — portalled to document.body to avoid stacking context issues
// ─────────────────────────────────────────────────────────────────────────────

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

  return createPortal(
    <>
      <style>{STYLES}</style>
      <div className="sb-overlay-backdrop" onClick={onClose} />
      <div className="sb-overlay-panel">{children}</div>
    </>,
    document.body
  );
}

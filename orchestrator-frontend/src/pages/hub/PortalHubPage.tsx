/**
 * PortalHubPage — portal selector for multi-portal users.
 *
 * Shown when a user has access to more than one portal (e.g. ROLE_ADMIN
 * who inherits admin + accounting + sales + factory portals).
 * Single-portal users skip this page entirely — App.tsx redirects them.
 *
 * Layout: greeting + responsive grid of portal cards.
 * Each card: portal name, icon, description, click navigates to portal.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  BookOpen,
  TrendingUp,
  Factory,
  Store,
  Shield,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { ProfileMenu } from '@/components/ui/ProfileMenu';
import { OrchestratorLogo } from '@/components/ui/OrchestratorLogo';
import {
  resolvePortalAccess,
  getAccessiblePortals,
  type PortalDescriptor,
} from '@/lib/portal-routing';

// ─────────────────────────────────────────────────────────────────────────────
// Icon map
// ─────────────────────────────────────────────────────────────────────────────

const PORTAL_ICONS: Record<string, LucideIcon> = {
  LayoutGrid,
  BookOpen,
  TrendingUp,
  Factory,
  Store,
  Shield,
};

// ─────────────────────────────────────────────────────────────────────────────
// Portal card
// ─────────────────────────────────────────────────────────────────────────────

function PortalCard({ portal, onClick }: { portal: PortalDescriptor; onClick: () => void }) {
  const Icon: LucideIcon | undefined = PORTAL_ICONS[portal.iconName];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left w-full bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-5 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] active:scale-[0.99]"
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center mb-4 transition-colors duration-150 group-hover:bg-[var(--color-neutral-100)]">
        {Icon ? (
          <Icon size={17} className="text-[var(--color-text-secondary)]" />
        ) : null}
      </div>

      {/* Content */}
      <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1">
        {portal.label}
      </h3>
      <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
        {portal.description}
      </p>

      {/* Subtle "Open" cue on hover */}
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">Open</span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function PortalHubPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toggle, isDark } = useTheme();

  const access = useMemo(() => resolvePortalAccess(user), [user]);
  const portals = useMemo(() => getAccessiblePortals(access), [access]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)]">
      {/* Minimal top bar */}
      <header className="sticky top-0 z-10 h-12 flex items-center justify-between px-5 bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)]">
        <OrchestratorLogo size={18} variant="full" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user && (
            <ProfileMenu
              user={{
                displayName: user.displayName,
                email: user.email,
                role: user.roles[0] ?? '',
              }}
              onLogout={signOut}
              onProfile={() => navigate('/profile')}
            />
          )}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-5 py-12">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-[22px] font-semibold text-[var(--color-text-primary)] tracking-tight mb-1">
            {user?.displayName ? `Welcome back, ${user.displayName}` : 'Welcome back'}
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Select a portal to continue.
          </p>
        </div>

        {/* Portal grid */}
        {portals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {portals.map((portal) => (
              <PortalCard
                key={portal.key}
                portal={portal}
                onClick={() => navigate(portal.path)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              You do not have access to any portals. Contact your administrator.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

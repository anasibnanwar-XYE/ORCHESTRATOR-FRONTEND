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
  ArrowRight,
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

const PORTAL_ICONS: Record<string, LucideIcon> = {
  LayoutGrid,
  BookOpen,
  TrendingUp,
  Factory,
  Store,
  Shield,
};

function PortalCard({ portal, onClick }: { portal: PortalDescriptor; onClick: () => void }) {
  const Icon: LucideIcon | undefined = PORTAL_ICONS[portal.iconName];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left w-full bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] active:scale-[0.99]"
      style={{ padding: 'clamp(18px, 1.67vw, 24px)' }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-lg bg-[#171717] dark:bg-[var(--color-surface-tertiary)] transition-all duration-150 group-hover:bg-[#262626] dark:group-hover:bg-[var(--color-border-default)]"
        style={{
          width: 'clamp(36px, 2.78vw, 40px)',
          height: 'clamp(36px, 2.78vw, 40px)',
          marginBottom: 'clamp(14px, 1.25vw, 18px)',
        }}
      >
        {Icon && (
          <Icon
            className="text-white dark:text-[var(--color-text-primary)]"
            style={{ width: 'clamp(16px, 1.25vw, 18px)', height: 'clamp(16px, 1.25vw, 18px)' }}
          />
        )}
      </div>

      {/* Label */}
      <h3
        className="font-semibold text-[var(--color-text-primary)] tracking-tight"
        style={{
          margin: '0 0 clamp(3px, 0.35vw, 5px)',
          fontSize: 'clamp(0.875rem, 1.04vw, 0.9375rem)',
        }}
      >
        {portal.label}
      </h3>

      {/* Description */}
      <p
        className="text-[var(--color-text-tertiary)] leading-relaxed"
        style={{
          margin: 0,
          fontSize: 'clamp(0.6875rem, 0.83vw, 0.75rem)',
          paddingRight: 'clamp(16px, 1.67vw, 24px)',
        }}
      >
        {portal.description}
      </p>

      {/* Arrow — slides in on hover */}
      <div
        className="absolute opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-0 group-hover:translate-x-1"
        style={{ bottom: 'clamp(18px, 1.67vw, 24px)', right: 'clamp(18px, 1.67vw, 24px)' }}
      >
        <ArrowRight
          className="text-[var(--color-text-tertiary)]"
          style={{ width: 'clamp(13px, 1vw, 15px)', height: 'clamp(13px, 1vw, 15px)' }}
        />
      </div>
    </button>
  );
}

export function PortalHubPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toggle, isDark } = useTheme();

  const access = useMemo(() => resolvePortalAccess(user), [user]);
  const portals = useMemo(() => getAccessiblePortals(access), [access]);

  const firstName = user?.displayName?.split(' ')[0] ?? null;

  return (
    <div className="bg-[var(--color-surface-secondary)]" style={{ minHeight: '100dvh', fontFamily: 'inherit' }}>

      {/* Top bar */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)]"
        style={{
          height: 'clamp(44px, 3.33vw, 48px)',
          paddingLeft: 'max(clamp(16px, 2.08vw, 30px), env(safe-area-inset-left))',
          paddingRight: 'max(clamp(16px, 2.08vw, 30px), env(safe-area-inset-right))',
        }}
      >
        <OrchestratorLogo size="clamp(18px, 1.67vw, 22px)" variant="full" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            className="flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            style={{ width: 32, height: 32 }}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
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

      {/* Page content */}
      <main
        className="mx-auto w-full"
        style={{
          maxWidth: 'min(960px, 100%)',
          padding: `clamp(32px, 6vh, 80px) max(clamp(16px, 2.78vw, 40px), env(safe-area-inset-left)) max(clamp(40px, 6vh, 64px), env(safe-area-inset-bottom))`,
        }}
      >
        {/* Greeting */}
        <div style={{ marginBottom: 'clamp(28px, 3.33vw, 48px)' }}>
          <h1
            className="font-semibold text-[var(--color-text-primary)] tracking-tight"
            style={{
              margin: '0 0 clamp(3px, 0.35vw, 5px)',
              fontSize: 'clamp(1.25rem, 1.94vw, 1.75rem)',
              lineHeight: 1.2,
            }}
          >
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
          <p
            className="text-[var(--color-text-tertiary)]"
            style={{ margin: 0, fontSize: 'clamp(0.75rem, 0.9vw, 0.875rem)' }}
          >
            Choose a workspace to continue.
          </p>
        </div>

        {/* Divider */}
        <div
          className="border-t border-[var(--color-border-default)]"
          style={{ marginBottom: 'clamp(20px, 2.22vw, 32px)' }}
        />

        {/* Portal grid */}
        {portals.length > 0 ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 'clamp(10px, 1.11vw, 16px)' }}
          >
            {portals.map((portal) => (
              <PortalCard
                key={portal.key}
                portal={portal}
                onClick={() => navigate(portal.path)}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: 'clamp(48px, 6.67vw, 96px) 0' }}
          >
            <div
              className="flex items-center justify-center rounded-xl bg-[var(--color-surface-tertiary)]"
              style={{ width: 48, height: 48, marginBottom: 16 }}
            >
              <Shield size={20} className="text-[var(--color-text-tertiary)]" />
            </div>
            <p
              className="font-medium text-[var(--color-text-primary)]"
              style={{ margin: '0 0 4px', fontSize: 'clamp(0.875rem, 1vw, 0.9375rem)' }}
            >
              No portals available
            </p>
            <p
              className="text-[var(--color-text-tertiary)]"
              style={{ margin: 0, fontSize: 'clamp(0.75rem, 0.83vw, 0.8125rem)' }}
            >
              Contact your administrator to request access.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

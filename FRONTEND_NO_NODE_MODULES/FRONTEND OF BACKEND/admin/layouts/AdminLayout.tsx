import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Moon,
  Sun,
  Menu as MenuIcon,
  X,
  ChevronLeft,
  HelpCircle
} from 'lucide-react';
import TutorialGuide from '../components/TutorialGuide';
import { getStepsForPath } from '../lib/tutorialSteps';
import UserMenuDropdown from '../components/layout/UserMenuDropdown';
import SidebarUserFooter from '../components/layout/SidebarUserFooter';
import clsx from 'clsx';
import type { AuthenticatedUser } from '../types/auth';
import { resolvePortalAccess, shouldShowPortalSelection } from '../types/portal-routing';

interface AdminLayoutProps {
  user: AuthenticatedUser;
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
}

const navigation = [
  { name: 'Dashboard', to: '/dashboard', end: true },
  { name: 'Operations', to: '/operations' },
  { name: 'Approvals', to: '/approvals' },
  { name: 'User management', to: '/users' },
  { name: 'Role management', to: '/roles' },
  { name: 'Companies', to: '/companies' },
  { name: 'Employees', to: '/hr/employees' },
  { name: 'Attendance', to: '/hr/attendance' },
  { name: 'Payroll', to: '/hr/payroll' },
  { name: 'Settings', to: '/settings' },
  { name: 'Profile', to: '/profile' },
];

export default function AdminLayout({ user, onSignOut, theme, onThemeChange }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const portalAccess = resolvePortalAccess(user);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const tutorialSteps = getStepsForPath(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border bg-surface transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <span className="text-lg font-semibold tracking-tight text-primary">Admin</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-secondary hover:text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
            {/* Back to Portal Selection */}
            {shouldShowPortalSelection(portalAccess) && (
              <>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate('/portals');
                  }}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary transition hover:bg-surface-highlight hover:text-primary"
                >
                  <ChevronLeft className="h-4 w-4 text-tertiary group-hover:text-secondary" />
                  Back to Portals
                </button>

                <div className="my-4 h-px bg-border" />
              </>
            )}

            <div className="space-y-0.5">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : undefined}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-surface-highlight text-primary shadow-sm ring-1 ring-border'
                        : 'text-secondary hover:bg-surface-highlight/50 hover:text-primary'
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* User Info Footer */}
          <SidebarUserFooter
            displayName={user.displayName}
            email={user.email}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            <button
              type="button"
              className="text-secondary hover:text-primary lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-primary tracking-tight hidden sm:block">
                {navigation.find((n) => n.to === location.pathname)?.name ?? 'Dashboard'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="theme-toggle"
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className={clsx(
                'rounded-full p-2 transition-all hover:bg-surface-highlight',
                theme === 'dark' ? 'text-yellow-400' : 'text-secondary'
              )}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className="rounded-full p-2 text-secondary transition-colors hover:bg-surface-highlight"
              title="Start Tutorial"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            <div className="h-6 w-px bg-border" />

            <UserMenuDropdown
              displayName={user.displayName}
              email={user.email}
              profilePath="/profile"
              settingsPath="/settings"
              onSignOut={onSignOut}
            />
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-background p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
      <TutorialGuide
        steps={tutorialSteps}
        enabled={tutorialOpen}
        onExit={() => setTutorialOpen(false)}
      />
    </div>
  );
}

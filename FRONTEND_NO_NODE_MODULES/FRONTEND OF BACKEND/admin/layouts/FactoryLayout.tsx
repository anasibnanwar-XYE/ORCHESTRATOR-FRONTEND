import React, { Fragment, useState, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { resolvePortalAccess, shouldShowPortalSelection } from '../types/portal-routing';
import TutorialGuide from '../components/TutorialGuide';
import { getStepsForPath } from '../lib/tutorialSteps';
import UserMenuDropdown from '../components/layout/UserMenuDropdown';
import SidebarUserFooter from '../components/layout/SidebarUserFooter';
import { 
  ChevronLeft, Menu as MenuIcon, X, Moon, Sun, HelpCircle,
  LayoutDashboard, Factory, 
  Package, Warehouse, Settings
} from 'lucide-react';

interface FactoryLayoutProps {
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
}

export default function FactoryLayout({ theme, onThemeChange }: FactoryLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const portalAccess = resolvePortalAccess(user || null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const tutorialSteps = useMemo(() => getStepsForPath(location.pathname), [location.pathname]);

  // Simplified navigation (12 → 5 items via tab grouping)
  const navigation = [
    { name: 'Dashboard', to: '/factory', icon: LayoutDashboard, end: true },
    { name: 'Production', to: '/factory/production', icon: Factory },
    { name: 'Packing & Dispatch', to: '/factory/packing', icon: Package },
    { name: 'Inventory', to: '/factory/inventory', icon: Warehouse },
    { name: 'Configuration', to: '/factory/config', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-primary">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen">
        {/* Header */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Factory</p>
            <p className="text-base font-bold text-primary">Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {shouldShowPortalSelection(portalAccess) && (
            <>
              <button
                type="button"
                onClick={() => navigate('/portals')}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary transition hover:bg-surface-highlight hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4 text-tertiary group-hover:text-secondary" />
                Change Workspace
              </button>
              <div className="my-3 h-px bg-border" />
            </>
          )}

          <div className="space-y-0.5">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-surface-highlight text-primary shadow-sm ring-1 ring-border'
                      : 'text-secondary hover:bg-surface-highlight/50 hover:text-primary'
                  )
                }
              >
                <item.icon className="h-4 w-4 text-tertiary group-hover:text-secondary" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Footer */}
        <SidebarUserFooter
          displayName={user?.displayName ?? 'User'}
          email={user?.email ?? ''}
        />
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface/80 px-2 sm:px-4 py-3 sm:py-4 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary hover:bg-surface-highlight lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                className={clsx(
                  'rounded-full p-2 transition-colors hover:bg-surface-highlight',
                  theme === 'dark' ? 'text-yellow-400' : 'text-secondary'
                )}
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Tutorial */}
              <button
                type="button"
                onClick={() => setTutorialOpen(true)}
                className="hidden sm:inline-flex rounded-full p-2 text-secondary transition-colors hover:bg-surface-highlight"
                title="Start Tutorial"
              >
                <HelpCircle className="h-5 w-5" />
              </button>

              <div className="hidden sm:block h-6 w-px bg-border" />

              {/* User menu */}
              <UserMenuDropdown
                displayName={user?.displayName ?? 'User'}
                email={user?.email ?? ''}
                profilePath="/factory/profile"
                onSignOut={signOut}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Drawer (HeadlessUI Dialog for a11y) */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0">
            <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-300" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
              <Dialog.Panel className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-border bg-surface text-primary shadow-xl">
                <div className="flex h-16 items-center justify-between px-6 border-b border-border">
                  <span className="text-lg font-semibold tracking-tight text-primary">Factory</span>
                  <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-secondary hover:bg-surface-highlight">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex-1 px-4 py-4 overflow-y-auto">
                  {shouldShowPortalSelection(portalAccess) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarOpen(false);
                          navigate('/portals');
                        }}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary transition hover:bg-surface-highlight hover:text-primary"
                      >
                        <ChevronLeft className="h-4 w-4 text-tertiary group-hover:text-secondary" />
                        Change Workspace
                      </button>
                      <div className="my-3 h-px bg-border" />
                    </>
                  )}

                  <div className="space-y-0.5">
                    {navigation.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          clsx(
                            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                            isActive
                              ? 'bg-surface-highlight text-primary shadow-sm ring-1 ring-border'
                              : 'text-secondary hover:bg-surface-highlight/50 hover:text-primary'
                          )
                        }
                      >
                        <item.icon className="h-4 w-4 text-tertiary group-hover:text-secondary" />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                </nav>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <TutorialGuide
        steps={tutorialSteps}
        enabled={tutorialOpen}
        onExit={() => setTutorialOpen(false)}
      />
    </div>
  );
}

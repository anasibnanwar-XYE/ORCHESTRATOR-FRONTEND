import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { User, Settings, LogOut } from 'lucide-react';
import clsx from 'clsx';

interface UserMenuDropdownProps {
  displayName: string;
  email: string;
  profilePath: string;
  settingsPath?: string;
  onSignOut: () => void;
}

export default function UserMenuDropdown({
  displayName,
  email,
  profilePath,
  settingsPath,
  onSignOut,
}: UserMenuDropdownProps) {
  const navigate = useNavigate();
  const initials = displayName?.slice(0, 2).toUpperCase() ?? '';

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 rounded-full p-1 text-sm font-medium text-secondary hover:bg-surface-highlight transition-colors">
        <span className="sr-only">Open user menu</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-action-bg text-action-text text-xs font-medium shadow-sm">
          {initials}
        </div>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-border rounded-xl border border-border bg-surface p-1 shadow-lg focus:outline-none">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-primary">{displayName}</p>
            <p className="truncate text-xs text-secondary">{email}</p>
          </div>
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => navigate(profilePath)}
                  className={clsx(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    active ? 'bg-surface-highlight text-primary' : 'text-secondary'
                  )}
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
              )}
            </Menu.Item>
            {settingsPath && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => navigate(settingsPath)}
                    className={clsx(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      active ? 'bg-surface-highlight text-primary' : 'text-secondary'
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                )}
              </Menu.Item>
            )}
          </div>
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={onSignOut}
                  className={clsx(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    active ? 'bg-status-error-bg text-status-error-text' : 'text-status-error-text'
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

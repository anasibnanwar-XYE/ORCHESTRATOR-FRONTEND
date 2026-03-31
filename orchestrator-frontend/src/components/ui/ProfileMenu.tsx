import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Avatar } from './Avatar';

interface ProfileUser {
  displayName: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface ProfileMenuProps {
  user: ProfileUser;
  onLogout: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
}

export function ProfileMenu({ user, onLogout, onProfile, onSettings }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const items = [
    { label: 'Profile', onClick: onProfile },
    { label: 'Settings', onClick: onSettings },
  ].filter((item) => item.onClick);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={clsx(
          'flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-lg',
          'transition-colors duration-150',
          'hover:bg-[var(--color-surface-tertiary)]',
          isOpen && 'bg-[var(--color-surface-tertiary)]',
        )}
      >
        <Avatar src={user.avatar} displayName={user.displayName} size="sm" />
        <span className="text-[13px] font-medium text-[var(--color-text-primary)] hidden sm:block max-w-[120px] truncate">
          {user.displayName}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Profile actions"
          className="absolute right-0 top-full mt-1.5 w-52 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden z-[var(--z-dropdown)]"
          style={{
            boxShadow: 'var(--shadow-popover)',
            animation: 'o-scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
            transformOrigin: 'top right',
          }}
        >
          <div className="px-3.5 py-3 border-b border-[var(--color-border-subtle)]">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
              {user.displayName}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{user.email}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mt-1">
              {user.role}
            </p>
          </div>

          {items.length > 0 && (
            <div className="py-1">
              {items.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={() => { item.onClick?.(); setIsOpen(false); }}
                  className="w-full text-left px-3.5 py-2 text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors duration-100"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-[var(--color-border-subtle)] py-1">
            <button
              role="menuitem"
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="w-full text-left px-3.5 py-2 text-[13px] text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors duration-100"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

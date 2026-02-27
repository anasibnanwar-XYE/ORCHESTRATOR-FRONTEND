import React, { useState } from 'react';

interface ResponsiveHeaderProps {
  title?: string;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
  className?: string;
}

/**
 * Responsive header that adapts to screen size
 * Mobile: Hamburger menu + compact layout
 * Desktop: Full navigation + expanded layout
 */
export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  title,
  logo,
  actions,
  onMenuClick,
  className = '',
}) => {
  return (
    <header
      className={`
        sticky top-0 z-20
        bg-white dark:bg-[#121214]
        border-b border-zinc-200 dark:border-zinc-800
        shadow-sm dark:shadow-md
        backdrop-blur-sm bg-white/95 dark:bg-[#121214]/95
        transition-colors duration-200
        ${className}
      `}
    >
      <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Menu Button */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* Logo */}
          {logo && (
            <div className="flex-shrink-0">
              {logo}
            </div>
          )}

          {/* Title */}
          {title && (
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Actions */}
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};


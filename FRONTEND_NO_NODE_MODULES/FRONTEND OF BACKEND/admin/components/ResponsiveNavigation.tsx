import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

interface ResponsiveNavigationProps {
  items: NavItem[];
  onItemClick?: () => void;
  className?: string;
}

/**
 * Responsive navigation component
 * Mobile: Compact list
 * Desktop: Full navigation with icons
 */
export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  items,
  onItemClick,
  className = '',
}) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={`${className}`}>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={onItemClick}
              className={`
                flex items-center gap-3
                px-3 py-2 sm:px-4 sm:py-2.5
                rounded-lg
                text-sm sm:text-base
                font-medium
                transition-colors
                ${
                  isActive(item.path)
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {item.icon && (
                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6">
                  {item.icon}
                </span>
              )}
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};














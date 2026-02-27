import React from 'react';

interface ResponsiveCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

/**
 * Responsive card component with consistent styling
 * Adapts padding and layout for mobile/desktop
 */
export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = 'md',
  hover = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`
        bg-white dark:bg-[#121214]
        rounded-lg
        border border-border
        shadow-sm dark:shadow-md
        ${hover ? 'transition-all duration-200 hover:shadow-md dark:hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700' : ''}
        ${className}
      `}
    >
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className={`
          ${paddingClasses[padding]}
          ${title || subtitle ? 'pb-3 sm:pb-4' : ''}
          border-b border-border
          flex items-start sm:items-center justify-between gap-3
        `}>
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-base sm:text-lg font-semibold text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-secondary mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
};

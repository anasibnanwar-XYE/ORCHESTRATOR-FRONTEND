import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: 1 | 2;
    tablet?: 1 | 2 | 3;
    desktop?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Responsive grid that adapts column count based on screen size
 * Mobile: 1-2 columns
 * Tablet: 1-3 columns
 * Desktop: 1-6 columns
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = '',
}) => {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
  };

  const gridCols = {
    mobile: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
    },
    tablet: {
      1: 'sm:grid-cols-1',
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-3',
    },
    desktop: {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
      6: 'lg:grid-cols-6',
    },
  };

  return (
    <div
      className={`
        grid
        ${gridCols.mobile[cols.mobile || 1]}
        ${cols.tablet ? gridCols.tablet[cols.tablet] : ''}
        ${cols.desktop ? gridCols.desktop[cols.desktop] : ''}
        ${gapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};














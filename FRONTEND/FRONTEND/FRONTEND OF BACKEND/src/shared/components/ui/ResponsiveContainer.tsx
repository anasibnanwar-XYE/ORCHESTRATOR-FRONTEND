import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface ResponsiveContainerProps {
  children: ReactNode;
  /** Remove horizontal padding on mobile for edge-to-edge content */
  bleedOnMobile?: boolean;
  /** Max width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

const maxWidthStyles = {
  sm: 'max-w-xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1400px]',
  full: 'max-w-full',
};

export function ResponsiveContainer({
  children,
  bleedOnMobile = false,
  maxWidth = 'lg',
  className,
}: ResponsiveContainerProps) {
  return (
    <div
      className={clsx(
        'w-full mx-auto',
        bleedOnMobile ? 'px-0 sm:px-4 lg:px-6' : 'px-4 sm:px-5 lg:px-6',
        maxWidthStyles[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  /** Columns on mobile (default 1) */
  cols?: 1 | 2;
  /** Columns on tablet (default 2) */
  smCols?: 1 | 2 | 3;
  /** Columns on desktop (default auto based on children) */
  lgCols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'tight' | 'normal' | 'loose';
  className?: string;
}

const gapStyles = {
  tight: 'gap-2 sm:gap-3',
  normal: 'gap-3 sm:gap-4 lg:gap-5',
  loose: 'gap-4 sm:gap-6 lg:gap-8',
};

const colMap = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' };

export function ResponsiveGrid({
  children,
  cols = 1,
  smCols = 2,
  lgCols = 4,
  gap = 'normal',
  className,
}: ResponsiveGridProps) {
  return (
    <div
      className={clsx(
        'grid',
        colMap[cols],
        `sm:${colMap[smCols]}`,
        `lg:${colMap[lgCols]}`,
        gapStyles[gap],
        className,
      )}
    >
      {children}
    </div>
  );
}

interface StackProps {
  children: ReactNode;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'vertical' | 'horizontal';
  /** Stack vertically on mobile, horizontal on desktop */
  responsive?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

const stackGap = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
};

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

export function Stack({
  children,
  gap = 'md',
  direction = 'vertical',
  responsive = false,
  align = 'stretch',
  className,
}: StackProps) {
  return (
    <div
      className={clsx(
        'flex',
        responsive
          ? 'flex-col sm:flex-row'
          : direction === 'vertical'
            ? 'flex-col'
            : 'flex-row',
        stackGap[gap],
        alignMap[align],
        className,
      )}
    >
      {children}
    </div>
  );
}

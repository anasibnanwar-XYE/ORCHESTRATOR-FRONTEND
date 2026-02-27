import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        
        variant === 'default' && 
          'border-transparent bg-action-bg text-action-text hover:bg-action-hover',
          
        variant === 'secondary' && 
          'border-transparent bg-surface text-secondary hover:bg-surface-highlight',
          
        variant === 'outline' && 
          'text-primary border-border',
          
        variant === 'success' && 
          'border-transparent bg-status-success-bg text-status-success-text',
          
        variant === 'warning' && 
          'border-transparent bg-status-warning-bg text-status-warning-text',
          
        variant === 'error' && 
          'border-transparent bg-status-error-bg text-status-error-text',
          
        variant === 'info' && 
          'border-transparent bg-status-info-bg text-status-info-text',

        className
      )}
      {...props}
    />
  );
}

export { Badge };

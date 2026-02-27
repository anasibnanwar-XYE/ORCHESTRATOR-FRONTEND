import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          
          // Variants
          variant === 'default' && 
            'bg-action-bg text-action-text hover:bg-action-hover shadow-sm',
          
          variant === 'secondary' && 
            'bg-surface text-secondary hover:bg-surface-highlight border border-border',
            
          variant === 'outline' && 
            'border border-border bg-transparent hover:bg-surface-highlight text-primary',
            
          variant === 'ghost' && 
            'hover:bg-surface-highlight text-primary hover:text-primary',
            
          variant === 'destructive' && 
            'bg-status-error-bg text-status-error-text hover:bg-status-error-bg/80 border border-status-error-text/20',

          variant === 'link' && 'text-primary underline-offset-4 hover:underline',

          // Sizes
          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-9 rounded-md px-3',
          size === 'lg' && 'h-11 rounded-md px-8',
          size === 'icon' && 'h-10 w-10',
          
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

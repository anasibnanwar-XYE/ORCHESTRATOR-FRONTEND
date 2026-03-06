import { forwardRef, type ButtonHTMLAttributes, type ReactNode, cloneElement, isValidElement } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: clsx(
    'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)]',
    'hover:bg-[var(--color-neutral-800)]',
    'active:bg-[var(--color-neutral-900)]',
  ),
  secondary: clsx(
    'bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]',
    'border border-[var(--color-border-default)]',
    'hover:bg-[var(--color-surface-tertiary)] hover:border-[var(--color-border-strong)]',
    'active:bg-[var(--color-neutral-100)]',
  ),
  ghost: clsx(
    'bg-transparent text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]',
    'active:bg-[var(--color-neutral-100)]',
  ),
  danger: clsx(
    'bg-[var(--color-surface-primary)] text-[var(--color-error)]',
    'border border-[var(--color-error-border-subtle)]',
    'hover:bg-[var(--color-error-bg)] hover:border-[var(--color-error-border)]',
    'active:bg-[var(--color-error-bg-hover)]',
  ),
};

const sizeConfig: Record<ButtonSize, { button: string; icon: number }> = {
  // min-h-[44px] ensures ≥44px touch target on mobile; sm: breakpoint restores
  // the visual height for desktop layouts.
  sm: { button: 'min-h-[44px] sm:min-h-[32px] sm:h-8 px-3 text-[13px] gap-1.5 rounded-lg', icon: 14 },
  md: { button: 'min-h-[44px] sm:min-h-[36px] sm:h-9 px-3.5 text-[13px] gap-1.5 rounded-lg', icon: 15 },
  lg: { button: 'h-11 px-5 text-sm gap-2 rounded-xl', icon: 17 },
};

const iconOnlySize: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-[32px] sm:min-w-[32px] rounded-lg',
  md: 'min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-[36px] sm:min-w-[36px] rounded-lg',
  lg: 'h-11 w-11 rounded-xl',
};

function renderIcon(icon: ReactNode, size: number) {
  if (isValidElement(icon)) {
    return cloneElement(icon as React.ReactElement<{ className?: string; size?: number }>, {
      size,
      className: 'shrink-0',
    });
  }
  return icon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;
    const { icon: iconSize } = sizeConfig[size];

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center font-medium',
            'transition-colors duration-150 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)] focus-visible:ring-offset-2',
            'select-none whitespace-nowrap',
            variantStyles[variant],
            iconOnly ? iconOnlySize[size] : sizeConfig[size].button,
            fullWidth && 'w-full',
            isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          ),
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={iconSize} className="shrink-0 animate-spin" />
        ) : (
          leftIcon && renderIcon(leftIcon, iconSize)
        )}
        {!iconOnly && children}
        {!isLoading && !iconOnly && rightIcon && renderIcon(rightIcon, iconSize)}
      </button>
    );
  },
);

Button.displayName = 'Button';

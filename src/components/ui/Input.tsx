import { forwardRef, type InputHTMLAttributes, type ReactNode, cloneElement, isValidElement } from 'react';
import { AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  // On mobile (touch): use min-h-[44px] to meet touch-target requirements.
  // On desktop (sm+): let the explicit height govern.
  sm: { input: 'min-h-[44px] sm:min-h-[32px] sm:h-8 px-2.5 text-[12px]', iconPl: 'pl-8', iconSize: 13 },
  md: { input: 'min-h-[44px] sm:min-h-[36px] sm:h-9 px-3 text-[13px]', iconPl: 'pl-9', iconSize: 14 },
  lg: { input: 'h-11 px-3.5 text-sm', iconPl: 'pl-10', iconSize: 16 },
};

function renderIcon(icon: ReactNode, size: number) {
  if (isValidElement(icon)) {
    const existing = (icon.props as { className?: string }).className;
    return cloneElement(icon as React.ReactElement<{ size?: number; className?: string }>, {
      size,
      className: clsx('shrink-0', existing),
    });
  }
  return icon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const { input, iconPl, iconSize } = sizeStyles[inputSize];

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none">
              {renderIcon(leftIcon, iconSize)}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'w-full bg-[var(--color-surface-primary)]',
                'border border-[var(--color-border-default)] rounded-lg',
                'transition-all duration-150 ease-out',
                'placeholder:text-[var(--color-text-tertiary)]',
                'focus:outline-none focus:border-[var(--color-neutral-300)] focus:shadow-sm',
                input,
                leftIcon && iconPl,
                (rightIcon || error) && 'pr-9',
                error && 'border-[var(--color-error-border)] focus:border-[var(--color-error-icon)]',
                props.disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-surface-tertiary)]',
              ),
              className,
            )}
            {...props}
          />
          {error ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-error-icon)] pointer-events-none">
              <AlertCircle size={14} />
            </div>
          ) : rightIcon ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {renderIcon(rightIcon, iconSize)}
            </div>
          ) : null}
        </div>
        {error && (
          <p className="text-[11px] text-[var(--color-error)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

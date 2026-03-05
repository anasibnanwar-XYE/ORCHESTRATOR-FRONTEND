import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <label className={clsx('group flex items-start gap-2.5 cursor-pointer', className)}>
        <div className="relative shrink-0 mt-px">
          <input
            ref={ref}
            type="radio"
            className="peer sr-only"
            {...props}
          />
          <div
            className={clsx(
              'h-4 w-4 rounded-full',
              'border border-[var(--color-border-strong)]',
              'transition-all duration-150 ease-out',
              'flex items-center justify-center',
              'peer-checked:border-[var(--color-neutral-900)]',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-neutral-900)]/20 peer-focus-visible:ring-offset-1',
              'group-hover:border-[var(--color-neutral-500)]',
              'peer-disabled:opacity-40 peer-disabled:cursor-not-allowed',
            )}
          >
            <div
              className={clsx(
                'h-2 w-2 rounded-full bg-[var(--color-neutral-900)]',
                'scale-0 peer-checked:scale-100',
                'transition-transform duration-150 ease-out',
              )}
            />
          </div>
        </div>
        {(label || description) && (
          <div>
            {label && (
              <span className="text-[13px] font-medium text-[var(--color-text-primary)] leading-tight">
                {label}
              </span>
            )}
            {description && (
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-snug">{description}</p>
            )}
          </div>
        )}
      </label>
    );
  },
);

Radio.displayName = 'Radio';

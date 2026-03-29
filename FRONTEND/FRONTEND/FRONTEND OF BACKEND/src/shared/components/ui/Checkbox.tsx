import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <label className={clsx('group flex items-start gap-2.5 cursor-pointer', className)}>
        <div className="relative shrink-0 mt-px">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <div
            className={clsx(
              'h-4 w-4 rounded flex items-center justify-center',
              'border border-[var(--color-border-strong)]',
              'transition-all duration-150 ease-out',
              'peer-checked:bg-[var(--color-neutral-900)] peer-checked:border-[var(--color-neutral-900)]',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-neutral-900)]/20 peer-focus-visible:ring-offset-1',
              'group-hover:border-[var(--color-neutral-500)]',
              'peer-disabled:opacity-40 peer-disabled:cursor-not-allowed',
            )}
          >
            <Check
              size={11}
              strokeWidth={3}
              className="text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-100"
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

Checkbox.displayName = 'Checkbox';

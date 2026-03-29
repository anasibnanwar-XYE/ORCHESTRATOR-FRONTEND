import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  selectSize?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-8 px-2.5 text-[12px] pr-7',
  md: 'h-9 px-3 text-[13px] pr-9',
  lg: 'h-11 px-3.5 text-sm pr-10',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      selectSize = 'md',
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[13px] font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={twMerge(
              clsx(
                'w-full bg-[var(--color-surface-primary)] appearance-none',
                'border border-[var(--color-border-default)] rounded-lg',
                'transition-all duration-150 ease-out',
                'focus:outline-none focus:border-[var(--color-neutral-300)] focus:shadow-sm',
                sizeStyles[selectSize],
                error && 'border-red-300 focus:border-red-400',
                props.disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-surface-tertiary)]',
              ),
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]">
            {error ? (
              <AlertCircle size={14} className="text-red-400" />
            ) : (
              <ChevronDown size={14} />
            )}
          </div>
        </div>
        {error && (
          <p className="text-[11px] text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

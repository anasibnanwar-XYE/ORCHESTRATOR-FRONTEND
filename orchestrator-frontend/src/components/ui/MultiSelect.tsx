import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  label,
  error,
  hint,
  disabled,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedOptions = useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value],
  );

  const toggleOption = (optionValue: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div ref={ref} className={twMerge('space-y-1.5 relative', className)}>
      {label && (
        <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={clsx(
            'flex flex-wrap items-center min-h-[36px] py-1 px-2 gap-1.5 w-full cursor-pointer',
            'bg-[var(--color-surface-primary)] border rounded-lg text-[13px]',
            'transition-all duration-150',
            error
              ? 'border-[var(--color-error-border)] focus-within:ring-2 focus-within:ring-[var(--color-error-ring)]'
              : 'border-[var(--color-border-default)] focus-within:ring-2 focus-within:ring-[var(--color-neutral-900)]/10',
            disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-surface-tertiary)]',
            isOpen &&
              !error &&
              'ring-2 ring-[var(--color-neutral-900)]/10 border-[var(--color-neutral-400)]',
          )}
        >
          {selectedOptions.length === 0 && (
            <span className="text-[var(--color-text-tertiary)] px-1">{placeholder}</span>
          )}
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] text-[12px] rounded-md text-[var(--color-text-primary)]"
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => removeOption(opt.value, e)}
                className="hover:text-[var(--color-error)] transition-colors focus:outline-none"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <div className="ml-auto pl-1">
            {error ? (
              <AlertCircle size={14} className="text-[var(--color-error-icon)]" />
            ) : (
              <ChevronDown size={14} className="text-[var(--color-text-tertiary)]" />
            )}
          </div>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg shadow-lg z-[var(--z-dropdown)] max-h-60 overflow-y-auto no-scrollbar py-1">
            {options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => toggleOption(opt.value, e)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2 text-left text-[13px] transition-colors',
                    isSelected
                      ? 'bg-[var(--color-surface-secondary)] font-medium text-[var(--color-text-primary)]'
                      : 'hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]',
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check size={14} className="text-[var(--color-neutral-900)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-[var(--color-error)]">{error}</p>}
      {hint && !error && <p className="text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
    </div>
  );
}

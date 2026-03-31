import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, AlertCircle, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  error,
  hint,
  disabled,
  className,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const filteredOptions = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className={twMerge('space-y-1.5 relative', className)}>
      {label && (
        <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={clsx(
            'flex items-center justify-between w-full h-9 px-3 text-left',
            'bg-[var(--color-surface-primary)] border rounded-lg text-[13px]',
            'transition-all duration-150',
            error
              ? 'border-[var(--color-error-border)] focus-visible:ring-2 focus-visible:ring-[var(--color-error-ring)]'
              : 'border-[var(--color-border-default)] focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)]/10',
            disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-surface-tertiary)]',
          )}
        >
          <span
            className={clsx(
              'truncate',
              selectedOption ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]',
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center pl-2 shrink-0">
            {error ? (
              <AlertCircle size={14} className="text-[var(--color-error-icon)]" />
            ) : (
              <ChevronDown size={14} className="text-[var(--color-text-tertiary)]" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg shadow-lg z-[var(--z-dropdown)] overflow-hidden">
            <div className="p-2 border-b border-[var(--color-border-default)] flex items-center gap-2">
              <Search size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-[13px] bg-transparent focus:outline-none placeholder:text-[var(--color-text-tertiary)]"
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1 no-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-[12px] text-[var(--color-text-tertiary)] text-center">
                  No results found.
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 text-left text-[13px] rounded-md transition-colors',
                      opt.value === value
                        ? 'bg-[var(--color-surface-secondary)] font-medium'
                        : 'hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.value === value && (
                      <Check size={14} className="text-[var(--color-neutral-900)] shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-[var(--color-error)]">{error}</p>}
      {hint && !error && <p className="text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
    </div>
  );
}

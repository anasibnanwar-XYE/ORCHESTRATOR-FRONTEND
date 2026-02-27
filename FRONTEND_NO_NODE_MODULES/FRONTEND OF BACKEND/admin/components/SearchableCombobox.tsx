import { Fragment, useState, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface ComboboxOption {
  id: number | string;
  label: string;
  subLabel?: string;
  [key: string]: any;
}

interface SearchableComboboxProps<T extends ComboboxOption> {
  label?: string;
  value: T | null;
  onChange: (value: T | null) => void;
  options?: T[];
  loadOptions?: (query: string) => Promise<T[]>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  nullable?: boolean;
}

export default function SearchableCombobox<T extends ComboboxOption>({
  label,
  value,
  onChange,
  options,
  loadOptions,
  placeholder = 'Select...',
  disabled = false,
  className,
  nullable = true,
}: SearchableComboboxProps<T>) {
  const [query, setQuery] = useState('');
  const [internalOptions, setInternalOptions] = useState<T[]>(options || []);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // If static options are provided, filter them locally
  const filteredOptions =
    !loadOptions && options
      ? query === ''
        ? options
        : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase()) ||
          option.subLabel?.toLowerCase().includes(query.toLowerCase())
        )
      : internalOptions;

  // Handle async loading with debouncing
  useEffect(() => {
    if (!loadOptions) {
      if (options) setInternalOptions(options);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const searchQuery = query.trim();
        const results = await loadOptions(searchQuery);
        setInternalOptions(results);
      } catch {
        setInternalOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, loadOptions, options]);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-secondary">
          {label}
        </label>
      )}
      <Combobox value={value} onChange={onChange} disabled={disabled} nullable={nullable as any}>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg border border-border bg-surface text-left shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background text-sm">
            <Combobox.Input
              className="w-full border-none py-2.5 sm:py-2 pl-3 pr-10 text-sm leading-5 text-primary bg-transparent focus:ring-0 touch-manipulation placeholder:text-tertiary"
              displayValue={(item: T) => item?.label ?? ''}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2 touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0">
              {loading ? (
                <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin text-tertiary" />
              ) : (
                <ChevronsUpDown
                  className="h-5 w-5 sm:h-4 sm:w-4 text-tertiary"
                  aria-hidden="true"
                />
              )}
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-50 mt-1 max-h-[50vh] sm:max-h-60 w-full overflow-auto rounded-md bg-surface py-1 text-sm shadow-lg ring-1 ring-border focus:outline-none">
              {loading ? (
                <div className="relative cursor-default select-none px-4 py-2 text-secondary">
                  Searching...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="relative cursor-default select-none px-4 py-2 text-secondary">
                  {query.trim().length === 0 && !hasSearched ? 'Start typing to search...' : 'Nothing found.'}
                </div>
              ) : (
                filteredOptions.map((item) => (
                  <Combobox.Option
                    key={item.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-3 sm:py-2 pl-10 pr-4 min-h-[44px] sm:min-h-0 touch-manipulation ${active ? 'bg-action-bg text-action-text' : 'text-primary'}`
                    }
                    value={item}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex flex-col">
                          <span
                            className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                          >
                            {item.label}
                          </span>
                          {item.subLabel && (
                            <span className={`block truncate text-xs ${active ? 'text-action-text/70' : 'text-secondary'}`}>
                              {item.subLabel}
                            </span>
                          )}
                        </div>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-action-text' : 'text-primary'}`}
                          >
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}

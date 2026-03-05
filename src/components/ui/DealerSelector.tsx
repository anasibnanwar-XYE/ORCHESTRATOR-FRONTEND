import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Building2, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface Dealer {
  id: string;
  name: string;
  code: string;
  gstin?: string;
  city?: string;
  outstanding?: number;
}

interface DealerSelectorProps {
  dealers: Dealer[];
  selected?: Dealer | null;
  onSelect: (dealer: Dealer | null) => void;
  placeholder?: string;
  label?: string;
  showOutstanding?: boolean;
  error?: string;
}

export function DealerSelector({
  dealers,
  selected = null,
  onSelect,
  placeholder = 'Select dealer...',
  label,
  showOutstanding = false,
  error,
}: DealerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = dealers.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.gstin && d.gstin.toLowerCase().includes(q)) ||
      (d.city && d.city.toLowerCase().includes(q))
    );
  });

  const formatCurrency = (amount: number) =>
    '\u20B9' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0 });

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full h-9 flex items-center gap-2.5 px-3 text-left',
          'bg-[var(--color-surface-primary)]',
          'border rounded-lg transition-all duration-150 ease-out',
          isOpen
            ? 'border-[var(--color-neutral-300)] shadow-sm'
            : error
              ? 'border-[var(--color-error-border)]'
              : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]',
        )}
      >
        {selected ? (
          <>
            <div className="h-6 w-6 rounded-md bg-[var(--color-surface-tertiary)] flex items-center justify-center shrink-0">
              <Building2 size={13} className="text-[var(--color-text-tertiary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium text-[var(--color-text-primary)] truncate block">
                {selected.name}
              </span>
            </div>
            <span className="text-[11px] text-[var(--color-text-tertiary)] font-mono shrink-0">
              {selected.code}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <Building2 size={14} className="shrink-0 text-[var(--color-text-tertiary)]" />
            <span className="flex-1 text-[13px] text-[var(--color-text-tertiary)]">
              {placeholder}
            </span>
            <ChevronDown size={14} className="shrink-0 text-[var(--color-text-tertiary)]" />
          </>
        )}
      </button>

      {error && (
        <p className="mt-1 text-[11px] text-[var(--color-error)]">{error}</p>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg shadow-lg overflow-hidden z-[var(--z-dropdown)]">
          <div className="p-2 border-b border-[var(--color-border-subtle)]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, GSTIN..."
                className="w-full h-8 pl-8 pr-3 text-[13px] bg-[var(--color-surface-secondary)] border-0 rounded-md placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-300)]"
              />
            </div>
          </div>

          <div className="max-h-[240px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[var(--color-text-tertiary)]">
                No dealers found
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((dealer) => {
                  const isSelected = selected?.id === dealer.id;
                  return (
                    <button
                      key={dealer.id}
                      onClick={() => {
                        onSelect(dealer);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-3 py-2 text-left',
                        'transition-colors duration-100',
                        isSelected
                          ? 'bg-[var(--color-surface-tertiary)]'
                          : 'hover:bg-[var(--color-surface-secondary)]',
                      )}
                    >
                      <div className="h-7 w-7 rounded-md bg-[var(--color-surface-tertiary)] flex items-center justify-center shrink-0">
                        <Building2 size={13} className="text-[var(--color-text-tertiary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                            {dealer.name}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)] px-1 py-px rounded shrink-0">
                            {dealer.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-px">
                          {dealer.city && (
                            <span className="text-[11px] text-[var(--color-text-tertiary)]">
                              {dealer.city}
                            </span>
                          )}
                          {dealer.gstin && (
                            <span className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                              {dealer.gstin}
                            </span>
                          )}
                        </div>
                      </div>
                      {showOutstanding && dealer.outstanding !== undefined && (
                        <span className={clsx(
                          'text-[11px] font-mono shrink-0',
                          dealer.outstanding > 0
                            ? 'text-[var(--color-error)]'
                            : 'text-[var(--color-text-tertiary)]',
                        )}>
                          {formatCurrency(dealer.outstanding)}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={14} className="shrink-0 text-[var(--color-neutral-900)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-3 py-1.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {filtered.length} dealer{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
              <kbd className="px-1 py-px bg-[var(--color-surface-tertiary)] border border-[var(--color-border-default)] rounded text-[9px]">&uarr;&darr;</kbd>
              navigate
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

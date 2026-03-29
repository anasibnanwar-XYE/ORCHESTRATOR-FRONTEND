import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Search, X, ArrowRight, FileText, Users, Building2, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchResult {
  id: string;
  label: string;
  description?: string;
  type: 'invoice' | 'customer' | 'company' | 'general';
  href?: string;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSelect?: (result: SearchResult) => void;
  results?: SearchResult[];
  isLoading?: boolean;
  showShortcut?: boolean;
  expanded?: boolean;
}

const typeIcons: Record<string, LucideIcon> = {
  invoice: FileText,
  customer: Users,
  company: Building2,
  general: Search,
};

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  onSelect,
  results = [],
  isLoading = false,
  showShortcut = true,
  expanded = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    onSearch?.(value);
    if (value.length > 0) setIsOpen(true);
  };

  const handleSelect = (result: SearchResult) => {
    onSelect?.(result);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      handleSelect(results[activeIndex]);
    }
  };

  const showResults = isOpen && query.length > 0;

  return (
    <div ref={containerRef} className={clsx('relative', expanded ? 'w-full' : 'w-full max-w-xs')}>
      <div
        className={clsx(
          'relative flex items-center',
          'bg-[var(--color-surface-primary)]',
          'border border-[var(--color-border-default)] rounded-lg',
          'transition-all duration-150 ease-out',
          isOpen && 'border-[var(--color-neutral-300)] shadow-sm',
        )}
      >
        <Search
          size={15}
          className="absolute left-3 text-[var(--color-text-tertiary)] shrink-0 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={clsx(
            'w-full h-9 pl-9 text-[13px] bg-transparent',
            'placeholder:text-[var(--color-text-tertiary)]',
            'focus:outline-none',
            showShortcut && !query ? 'pr-16' : 'pr-9',
          )}
        />
        {showShortcut && !query && !isOpen && (
          <div className="absolute right-3 flex items-center gap-0.5 pointer-events-none">
            <kbd className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)] border border-[var(--color-border-default)] rounded">
              {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '\u2318' : 'Ctrl'}
            </kbd>
            <kbd className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)] border border-[var(--color-border-default)] rounded">
              K
            </kbd>
          </div>
        )}
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); onSearch?.(''); }}
            className="absolute right-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg shadow-lg overflow-hidden z-[var(--z-dropdown)]">
          {isLoading ? (
            <div className="px-3 py-6 text-center">
              <div className="inline-flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                <div className="h-3.5 w-3.5 border-2 border-[var(--color-border-strong)] border-t-[var(--color-neutral-900)] rounded-full animate-spin" />
                Searching...
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-[var(--color-text-tertiary)]">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="py-1">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type] || Search;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 text-left',
                      'transition-colors duration-100',
                      activeIndex === index
                        ? 'bg-[var(--color-surface-tertiary)]'
                        : 'hover:bg-[var(--color-surface-secondary)]',
                    )}
                  >
                    <Icon size={14} className="shrink-0 text-[var(--color-text-tertiary)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                        {result.label}
                      </p>
                      {result.description && (
                        <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight size={12} className="shrink-0 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command, CornerDownLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CommandPaletteItem {
  id: string;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  onSelect: () => void;
}

export interface CommandPaletteGroup {
  id: string;
  heading: string;
  items: CommandPaletteItem[];
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  groups: CommandPaletteGroup[];
  placeholder?: string;
  className?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  groups,
  placeholder = 'What do you need?',
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter items based on query
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;
    
    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase()) || 
        (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    })).filter(group => group.items.length > 0);
  }, [groups, query]);

  // Flatten for keyboard navigation
  const flatItems = useMemo(() => {
    return filteredGroups.flatMap(group => group.items);
  }, [filteredGroups]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Timeout to wait for animation/render before focusing
      setTimeout(() => inputRef.current?.focus(), 50);
      
      // Prevent body scrolling without shifting layout
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => { 
      document.body.style.overflow = ''; 
      document.body.style.paddingRight = ''; 
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    // Scroll selected item into view smoothly
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Global shortcut to open/close would go here if needed
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].onSelect();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 sm:px-6 pointer-events-auto">
      {/* Elegant minimalist backdrop */}
      <div 
        className="fixed inset-0 bg-[var(--color-surface-primary)]/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Command Modal */}
      <div 
        className={twMerge(
          'relative w-full max-w-2xl bg-[var(--color-surface-primary)] rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.08)] flex flex-col',
          'border border-[var(--color-border-subtle)] ring-1 ring-black/5',
          'animate-in fade-in zoom-in-[0.98] slide-in-from-top-4 duration-200 ease-out',
          className
        )}
      >
        {/* Clean, spacious search input */}
        <div className="flex items-center px-5 py-5 border-b border-[var(--color-border-subtle)]">
          <Search size={20} className="text-[var(--color-text-tertiary)] mr-4 shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-[18px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] placeholder:font-light focus:outline-none"
            spellCheck={false}
          />
          <div className="hidden sm:flex items-center gap-1.5 ml-3">
             <kbd className="h-6 px-2 flex items-center justify-center rounded-md text-[10px] font-medium bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] uppercase tracking-wider">ESC</kbd>
          </div>
        </div>

        {/* Results Area with refined typography and spacing */}
        <div className="flex-1 overflow-y-auto overscroll-contain max-h-[55vh] p-2 sm:p-3" ref={listRef}>
          {filteredGroups.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <p className="text-[14px] text-[var(--color-text-secondary)]">No results found for <span className="text-[var(--color-text-primary)] font-medium">"{query}"</span></p>
            </div>
          ) : (
            filteredGroups.map((group, groupIndex) => (
              <div key={group.id} className="mb-4 last:mb-1">
                <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
                  {group.heading}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const globalIndex = flatItems.findIndex(fi => fi.id === item.id);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        data-selected={isSelected}
                        onClick={() => {
                          item.onSelect();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={clsx(
                          'w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors duration-100 text-left group',
                          isSelected 
                            ? 'bg-[var(--color-surface-secondary)]' 
                            : 'hover:bg-[var(--color-surface-secondary)]/50'
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {item.icon && (
                            <div className={clsx(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-100",
                              isSelected 
                                ? 'bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-subtle)]' 
                                : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]'
                            )}>
                              {item.icon}
                            </div>
                          )}
                          <div className="min-w-0 flex flex-col justify-center">
                            <div className={clsx(
                              "text-[14px] truncate transition-colors duration-100", 
                              isSelected ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'
                            )}>
                              {item.label}
                            </div>
                            {item.subtitle && (
                              <div className={clsx(
                                "text-[12px] truncate mt-0.5 transition-colors duration-100", 
                                isSelected ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-tertiary)]'
                              )}>
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          {item.shortcut && (
                            <div className="hidden sm:flex items-center gap-1.5">
                              {item.shortcut.map((key, i) => (
                                <kbd key={i} className={clsx(
                                  'h-6 min-w-[24px] px-1.5 flex items-center justify-center rounded-md text-[11px] font-mono tracking-widest uppercase transition-colors',
                                  isSelected 
                                    ? 'bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] shadow-sm' 
                                    : 'text-[var(--color-text-tertiary)]'
                                )}>
                                  {key === 'cmd' ? <Command size={12} strokeWidth={2} /> : key}
                                </kbd>
                              ))}
                            </div>
                          )}
                          {!item.shortcut && isSelected && (
                             <CornerDownLeft size={16} className="text-[var(--color-text-tertiary)] animate-in fade-in zoom-in" strokeWidth={1.5} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Minimalist Footer */}
        <div className="hidden sm:flex items-center justify-between px-5 py-3 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="font-mono text-[12px]">↑</kbd>
                <kbd className="font-mono text-[12px]">↓</kbd>
              </span>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="font-mono text-[12px]">↵</kbd>
              <span>Open</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

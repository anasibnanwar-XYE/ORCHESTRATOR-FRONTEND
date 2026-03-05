import { useState, useRef, useEffect, useCallback, type ReactElement } from 'react';
import { clsx } from 'clsx';

interface DropdownItem {
  label: string;
  value: string;
  destructive?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactElement;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, items, onSelect, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open, close]);

  return (
    <div ref={ref} className={clsx('relative inline-flex', className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={clsx(
            'absolute z-50 mt-1.5 top-full min-w-[180px]',
            'bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]',
            'rounded-xl py-1',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          style={{
            boxShadow: '0 8px 30px -8px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.04)',
            animation: 'o-scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
            transformOrigin: align === 'right' ? 'top right' : 'top left',
          }}
        >
          {items.map((item, i) => {
            if (item.separator) {
              return <div key={i} className="my-1 h-px bg-[var(--color-border-subtle)]" />;
            }
            return (
              <button
                key={item.value}
                disabled={item.disabled}
                onClick={() => { onSelect(item.value); close(); }}
                className={clsx(
                  'w-full text-left px-3 py-2 text-[13px] transition-colors duration-100',
                  item.disabled
                    ? 'text-[var(--color-text-tertiary)] opacity-50 cursor-not-allowed'
                    : item.destructive
                      ? 'text-[var(--color-error)] hover:bg-[var(--color-error-bg)]'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

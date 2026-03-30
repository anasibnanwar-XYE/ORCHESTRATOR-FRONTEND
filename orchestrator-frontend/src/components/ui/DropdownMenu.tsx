import { useState, useRef, useEffect, useCallback, type ReactElement, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
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
  const triggerRef = useRef<HTMLDivElement>(null);
  // portalRef tracks the portal container so we can exclude it from the
  // outside-click handler — the portal is rendered to document.body and is
  // NOT a DOM descendant of ref.current, but it IS part of the dropdown.
  const portalRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const MENU_WIDTH = 188;
    const MARGIN = 8;
    const vw = window.innerWidth;
    const top = rect.bottom + 6;

    let left: number;
    if (align === 'right') {
      // Right-align with trigger, but clamp so menu never overflows the viewport
      left = rect.right - MENU_WIDTH;
      if (left < MARGIN) left = MARGIN;
      if (left + MENU_WIDTH > vw - MARGIN) left = vw - MENU_WIDTH - MARGIN;
    } else {
      left = rect.left;
      if (left + MENU_WIDTH > vw - MARGIN) left = vw - MENU_WIDTH - MARGIN;
      if (left < MARGIN) left = MARGIN;
    }

    // Use position:fixed — viewport-relative, works correctly when portalled
    setMenuStyle({ position: 'fixed', top, left, width: MENU_WIDTH });
  }, [align]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !ref.current?.contains(target) &&
        !triggerRef.current?.contains(target) &&
        !portalRef.current?.contains(target)
      ) close();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    const scrollHandler = () => { updatePosition(); };
    window.addEventListener('scroll', scrollHandler, true);
    window.addEventListener('resize', scrollHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
      window.removeEventListener('scroll', scrollHandler, true);
      window.removeEventListener('resize', scrollHandler);
    };
  }, [open, close, updatePosition]);

  return (
    <div ref={ref} className={clsx('inline-flex', className)}>
      <div ref={triggerRef} onClick={() => { updatePosition(); setOpen(!open); }}>{trigger}</div>
      {open && createPortal(
        <div
          ref={portalRef}
          className={clsx(
            'z-[9999] min-w-[180px]',
            'bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]',
            'rounded-xl py-1',
          )}
          style={{
            ...menuStyle,
            boxShadow: 'var(--shadow-dropdown)',
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
        </div>,
        document.body,
      )}
    </div>
  );
}

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AccordionItemProps {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({ items, allowMultiple = false, className }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems((prev) => 
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={twMerge('divide-y divide-[var(--color-border-default)] border border-[var(--color-border-default)] rounded-xl overflow-hidden bg-[var(--color-surface-primary)]', className)}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);
        return (
          <div key={item.id}>
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus-visible:bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                {item.title}
              </span>
              <ChevronDown 
                size={16} 
                className={clsx(
                  "text-[var(--color-text-tertiary)] transition-transform duration-200",
                  isOpen && "rotate-180"
                )} 
              />
            </button>
            <div
              className={clsx(
                "overflow-hidden transition-all duration-200 ease-in-out",
                isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="p-4 pt-0 text-[13px] text-[var(--color-text-secondary)] border-t border-[var(--color-border-subtle)] mt-1 pt-3">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

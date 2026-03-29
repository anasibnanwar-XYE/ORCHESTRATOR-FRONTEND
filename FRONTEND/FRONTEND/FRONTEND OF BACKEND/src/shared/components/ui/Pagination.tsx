import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  // Logic to generate page numbers with ellipses
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show around current page
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={twMerge('flex items-center justify-center gap-1', className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 h-9 px-3 text-[13px] font-medium rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50 disabled:pointer-events-none transition-colors border border-transparent hover:border-[var(--color-border-default)]"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:block">Previous</span>
      </button>

      <div className="flex items-center gap-1 mx-2">
        {getPageNumbers().map((pageNumber, index) => {
          if (pageNumber === '...') {
            return (
              <div key={`dots-${index}`} className="w-9 h-9 flex items-center justify-center text-[var(--color-text-tertiary)]">
                <MoreHorizontal size={16} />
              </div>
            );
          }

          const isCurrent = pageNumber === currentPage;

          return (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber as number)}
              className={clsx(
                'w-9 h-9 flex items-center justify-center text-[13px] font-medium rounded-lg transition-colors',
                isCurrent 
                  ? 'bg-[var(--color-neutral-900)] text-white shadow-sm' 
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] border border-transparent hover:border-[var(--color-border-default)]'
              )}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 h-9 px-3 text-[13px] font-medium rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50 disabled:pointer-events-none transition-colors border border-transparent hover:border-[var(--color-border-default)]"
      >
        <span className="hidden sm:block">Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

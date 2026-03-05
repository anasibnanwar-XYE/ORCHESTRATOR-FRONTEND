import { useState, useMemo, useCallback, type ReactNode } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { clsx } from 'clsx';

export interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
  mobileLabel?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
  stickyHeader?: boolean;
  toolbar?: ReactNode;
  mobileCardRenderer?: (row: T) => ReactNode;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  columnId: string | null;
  direction: SortDirection;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchFilter,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  onRowClick,
  rowActions,
  emptyMessage = 'No data found',
  isLoading = false,
  stickyHeader = true,
  toolbar,
  mobileCardRenderer,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ columnId: null, direction: null });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleSort = useCallback((columnId: string) => {
    setSort((prev) => {
      if (prev.columnId !== columnId) return { columnId, direction: 'asc' };
      if (prev.direction === 'asc') return { columnId, direction: 'desc' };
      return { columnId: null, direction: null };
    });
  }, []);

  const filteredData = useMemo(() => {
    if (!search || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, search.toLowerCase()));
  }, [data, search, searchFilter]);

  const sortedData = useMemo(() => {
    if (!sort.columnId || !sort.direction) return filteredData;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col?.sortable) return filteredData;
    const accessor = col.sortAccessor || ((row: T) => {
      const val = col.accessor(row);
      return typeof val === 'string' || typeof val === 'number' ? val : '';
    });

    return [...filteredData].sort((a, b) => {
      const aVal = accessor(a);
      const bVal = accessor(b);
      const modifier = sort.direction === 'asc' ? 1 : -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * modifier;
      }
      return String(aVal).localeCompare(String(bVal)) * modifier;
    });
  }, [filteredData, sort, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);
  const start = sortedData.length === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, sortedData.length);

  const getSortIcon = (columnId: string) => {
    if (sort.columnId !== columnId) return <ArrowUpDown size={13} className="opacity-30" />;
    if (sort.direction === 'asc') return <ArrowUp size={13} />;
    return <ArrowDown size={13} />;
  };

  return (
    <div>
      {(searchable || toolbar) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3">
          {searchable && (
            <div className="relative w-full sm:max-w-[240px]">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder}
                className={clsx(
                  'w-full h-8 pl-8 pr-3 text-[13px] bg-[var(--color-surface-secondary)]',
                  'border-0 rounded-md',
                  'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-300)]',
                  'placeholder:text-[var(--color-text-tertiary)]',
                  'transition-all duration-150 ease-out',
                )}
              />
            </div>
          )}
          {toolbar && <div className="flex items-center gap-2 shrink-0">{toolbar}</div>}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead
            className={clsx(
              stickyHeader && 'sticky top-0 z-10',
            )}
          >
            <tr className="border-b border-[var(--color-border-default)]">
              {columns.map((col) => (
                <th
                  key={col.id}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  className={clsx(
                    'px-3 py-2.5 font-medium text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]',
                    'bg-[var(--color-surface-primary)]',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    !col.align && 'text-left',
                    col.sortable && 'cursor-pointer select-none hover:text-[var(--color-text-secondary)]',
                  )}
                  onClick={col.sortable ? () => handleSort(col.id) : undefined}
                >
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1',
                      col.align === 'right' && 'flex-row-reverse',
                    )}
                  >
                    {col.header}
                    {col.sortable && getSortIcon(col.id)}
                  </span>
                </th>
              ))}
              {rowActions && (
                <th className="px-3 py-2.5 w-10 bg-[var(--color-surface-primary)]" />
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-[var(--color-border-subtle)]">
                  {columns.map((col) => (
                    <td key={col.id} className="px-3 py-3">
                      <div className="h-3.5 rounded bg-[var(--color-surface-tertiary)] animate-pulse" style={{ width: `${40 + (i * 13 + col.id.length * 7) % 40}%` }} />
                    </td>
                  ))}
                  {rowActions && <td className="px-3 py-3" />}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-3 py-10 text-center text-[13px] text-[var(--color-text-tertiary)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx(
                    'border-b border-[var(--color-border-subtle)]',
                    'transition-colors duration-100',
                    'hover:bg-[var(--color-surface-secondary)]',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={clsx(
                        'px-3 py-2.5 text-[var(--color-text-primary)]',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                      )}
                    >
                      {col.accessor(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-3 py-2.5">
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`msk-${i}`} className="p-3 rounded-lg border border-[var(--color-border-subtle)] space-y-2 animate-pulse">
                <div className="h-3.5 w-2/3 rounded bg-[var(--color-surface-tertiary)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--color-surface-tertiary)]" />
                <div className="h-3 w-1/3 rounded bg-[var(--color-surface-tertiary)]" />
              </div>
            ))}
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="px-3 py-10 text-center text-[13px] text-[var(--color-text-tertiary)]">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {paginatedData.map((row) => (
              <div
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx(
                  'p-3 rounded-lg border border-[var(--color-border-subtle)]',
                  'transition-colors duration-100',
                  'active:bg-[var(--color-surface-secondary)]',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {mobileCardRenderer ? (
                  mobileCardRenderer(row)
                ) : (
                  <div className="space-y-1.5">
                    {columns.filter((c) => !c.hideOnMobile).map((col) => (
                      <div key={col.id} className="flex items-center justify-between gap-3">
                        <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)] shrink-0">
                          {col.mobileLabel || col.header}
                        </span>
                        <span className="text-[13px] text-[var(--color-text-primary)] text-right truncate">
                          {col.accessor(row)}
                        </span>
                      </div>
                    ))}
                    {rowActions && (
                      <div className="flex justify-end pt-1 border-t border-[var(--color-border-subtle)]">
                        {rowActions(row)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && sortedData.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-[var(--color-border-default)]">
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="h-7 px-1.5 text-[11px] border border-[var(--color-border-default)] rounded-md bg-[var(--color-surface-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-300)] text-[var(--color-text-secondary)]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt} rows</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
              {start}–{end} of {sortedData.length}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

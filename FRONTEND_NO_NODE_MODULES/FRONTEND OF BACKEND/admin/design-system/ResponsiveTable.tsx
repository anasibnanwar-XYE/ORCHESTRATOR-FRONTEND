import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  mobileHidden?: boolean;
  sortable?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
}

/**
 * Responsive table that converts to cards on mobile
 * Desktop: Traditional table
 * Mobile: Card-based layout
 */
export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
}: ResponsiveTableProps<T>) {
  const visibleColumns = columns.filter(col => !col.mobileHidden);

  if (data.length === 0) {
    return (
      <div className={`text-center py-12 text-zinc-500 dark:text-zinc-400 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop: Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#121214] divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white"
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card View */}
      <div className="lg:hidden space-y-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`
              bg-white dark:bg-[#121214]
              border border-zinc-200 dark:border-zinc-800
              rounded-lg p-4
              ${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            `}
          >
            {visibleColumns.map((column) => (
              <div key={column.key} className="mb-3 last:mb-0">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {column.header}
                </div>
                <div className="text-sm text-zinc-900 dark:text-white">
                  {column.render(item)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


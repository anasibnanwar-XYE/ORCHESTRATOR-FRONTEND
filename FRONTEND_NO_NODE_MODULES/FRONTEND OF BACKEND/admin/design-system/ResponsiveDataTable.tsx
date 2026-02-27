import React, { useState } from 'react';
import { ResponsiveTable } from './ResponsiveTable';
import { ResponsiveButton } from './ResponsiveButton';

interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  mobileHidden?: boolean;
  sortable?: boolean;
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  className?: string;
}

/**
 * Enhanced responsive data table with search and pagination
 */
export function ResponsiveDataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No data available',
  searchable = false,
  searchPlaceholder = 'Search...',
  pagination = false,
  pageSize = 10,
  onRowClick,
  actions,
  className = '',
}: ResponsiveDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search
  const filteredData = searchable
    ? data.filter((item) => {
      return columns.some((col) => {
        const value = col.render(item);
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    })
    : data;

  // Paginate data
  const paginatedData = pagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  const totalPages = pagination ? Math.ceil(filteredData.length / pageSize) : 1;

  return (
    <div className={className}>
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="
              w-full sm:w-64
              px-4 py-2
              border border-zinc-300 dark:border-zinc-700
              rounded-lg
              text-sm sm:text-base
              focus:outline-none focus:ring-2 focus:ring-blue-500
              bg-white dark:bg-zinc-900
              text-zinc-900 dark:text-white
            "
          />
        </div>
      )}

      {/* Table */}
      <ResponsiveTable
        data={paginatedData}
        columns={columns}
        keyExtractor={keyExtractor}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
      />

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} results
          </div>
          <div className="flex items-center gap-2">
            <ResponsiveButton
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </ResponsiveButton>
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              Page {currentPage} of {totalPages}
            </div>
            <ResponsiveButton
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </ResponsiveButton>
          </div>
        </div>
      )}
    </div>
  );
}














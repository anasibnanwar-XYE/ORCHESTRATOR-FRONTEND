/**
 * AuditTrailPage
 *
 * Paginated, filterable audit trail with three tabs:
 *  - Business Events: BusinessAuditEventResponse (occurredAt, actorIdentifier, action, entityType, entityId, status, module)
 *    GET /api/v1/audit/business-events  (wrapped in ApiResponse<PageResponse<...>>)
 *    NOTE: May return 500 if audit private key is not configured on the backend — handled gracefully.
 *
 *  - ML Events: MlInteractionEventResponse (occurredAt, actorIdentifier, action, interactionType, status, module)
 *    GET /api/v1/audit/ml-events  (wrapped in ApiResponse<PageResponse<...>>)
 *
 *  - Accounting: AccountingAuditTrailEntryDto (timestamp, actorIdentifier, actionType, entityType, entityId, referenceNumber, ...)
 *    GET /api/v1/accounting/audit-trail  (wrapped in ApiResponse<PageResponse<...>>)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search,
  RefreshCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Activity,
  Cpu,
  ServerCrash,
  BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { auditApi } from '@/lib/adminApi';
import type { BusinessEvent, MlEvent, AccountingAuditTrailEntry, AuditEventFilters, PageResponse } from '@/types';

const PAGE_SIZE = 20;

function formatTimestamp(ts: string): string {
  try {
    return format(new Date(ts), 'd MMM yyyy, HH:mm:ss');
  } catch {
    return ts;
  }
}

/**
 * Map backend AuditActionEventStatus → badge variant.
 * Backend statuses: INFO, SUCCESS, FAILURE, WARNING (and anything else)
 */
function businessStatusVariant(s?: string): 'success' | 'danger' | 'warning' | 'default' {
  if (!s) return 'default';
  const upper = s.toUpperCase();
  if (upper === 'SUCCESS') return 'success';
  if (upper === 'FAILURE' || upper === 'ERROR') return 'danger';
  if (upper === 'WARNING') return 'warning';
  return 'default';
}

function mlStatusVariant(s?: string): 'success' | 'danger' | 'warning' | 'default' {
  if (!s) return 'default';
  const upper = s.toUpperCase();
  if (upper === 'SUCCESS') return 'success';
  if (upper === 'FAILURE' || upper === 'ERROR') return 'danger';
  if (upper === 'WARNING') return 'warning';
  return 'default';
}

interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (p: number) => void;
}

function Pagination({ page, totalPages, totalElements, size, onPageChange }: PaginationProps) {
  const from = totalElements === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
      <span className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
        {totalElements === 0 ? 'No results' : `${from}–${to} of ${totalElements}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            page === 0
              ? 'text-[var(--color-text-disabled)] cursor-not-allowed'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]',
          )}
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-[12px] tabular-nums text-[var(--color-text-tertiary)] px-1">
          {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            page >= totalPages - 1
              ? 'text-[var(--color-text-disabled)] cursor-not-allowed'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]',
          )}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Business Events Tab
// Fields: id, occurredAt, actorIdentifier, action, entityType, entityId, module, status
// ─────────────────────────────────────────────────────────────────────────────

function BusinessEventsTab() {
  const [data, setData] = useState<PageResponse<BusinessEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<AuditEventFilters>({});
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (f: AuditEventFilters = {}, p = 0) => {
    setLoading(true);
    setError(null);
    setBackendError(false);
    try {
      const result = await auditApi.getBusinessEvents({ ...f, page: p, size: PAGE_SIZE });
      setData(result);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 500) {
        // Audit service may have configuration issues on the backend
        setBackendError(true);
      } else {
        setError('Failed to load business events.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(filters, page); }, [load, filters, page]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newFilters = { ...filters, actor: value || undefined };
      setFilters(newFilters);
      setPage(0);
    }, 400);
  };

  const columns: Column<BusinessEvent>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessor: (event) => (
        <div className="flex items-center gap-1.5 text-[12px] tabular-nums text-[var(--color-text-tertiary)] whitespace-nowrap">
          <Clock size={12} className="shrink-0" />
          {formatTimestamp(event.occurredAt)}
        </div>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      accessor: (event) => (
        <div className="flex items-center gap-1.5">
          <User size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
          <span className="text-[13px] text-[var(--color-text-primary)]">
            {event.actorIdentifier || `User #${event.actorUserId ?? '—'}`}
          </span>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessor: (event) => (
        <code className="text-[12px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded">
          {event.action}
        </code>
      ),
    },
    {
      id: 'entity',
      header: 'Entity',
      accessor: (event) => (
        <span className="text-[var(--color-text-secondary)]">
          {event.entityType || '—'}
          {event.entityId && (
            <span className="ml-1 text-[var(--color-text-tertiary)]">#{event.entityId}</span>
          )}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'module',
      header: 'Module',
      accessor: (event) => (
        event.module ? (
          <Badge variant="default">{event.module}</Badge>
        ) : (
          <span className="text-[12px] text-[var(--color-text-tertiary)]">—</span>
        )
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (event) =>
        event.status && event.status !== 'INFO' ? (
          <Badge variant={businessStatusVariant(event.status)}>{event.status}</Badge>
        ) : (
          <span className="text-[12px] text-[var(--color-text-tertiary)]">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Filter by actor..."
            className={clsx(
              'w-full pl-9 pr-3 h-8 text-[13px] rounded-lg',
              'bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)]',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
              'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
            )}
          />
        </div>
        <button
          type="button"
          onClick={() => void load(filters, page)}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors"
        >
          <RefreshCcw size={13} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl h-16" />
          ))}
        </div>
      ) : backendError ? (
        <div className="text-center py-12">
          <ServerCrash size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-[14px] font-medium text-[var(--color-text-primary)] mb-1">Audit Service Unavailable</p>
          <p className="text-[13px] text-[var(--color-text-tertiary)] max-w-md mx-auto">
            The audit trail service is experiencing issues on the backend. Please try again later or contact your system administrator.
          </p>
          <button
            type="button"
            onClick={() => void load(filters, page)}
            className="mt-4 flex items-center gap-1.5 mx-auto h-8 px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors border border-[var(--color-border-default)]"
          >
            <RefreshCcw size={13} />
            Try again
          </button>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => void load(filters, page)} className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80">
            <RefreshCcw size={13} /> Retry
          </button>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="text-center py-12">
          <Activity size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-[13px] text-[var(--color-text-tertiary)]">No business events found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={data.content}
            keyExtractor={(event) => String(event.id)}
            pageSize={PAGE_SIZE}
            pageSizeOptions={[PAGE_SIZE]}
            emptyMessage="No events found."
            mobileCardRenderer={(event) => (
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <code className="text-[12px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded">
                    {event.action}
                  </code>
                  {event.status && event.status !== 'INFO' && (
                    <Badge variant={businessStatusVariant(event.status)}>{event.status}</Badge>
                  )}
                </div>
                <p className="text-[13px] text-[var(--color-text-primary)] mb-1">
                  {event.actorIdentifier || `User #${event.actorUserId ?? '—'}`}
                </p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  {event.entityType}
                  {event.entityId && ` #${event.entityId}`}
                  {' · '}
                  {formatTimestamp(event.occurredAt)}
                </p>
              </div>
            )}
          />

          <Pagination
            page={page}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            size={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ML Events Tab
// Fields: id, occurredAt, actorIdentifier, action, interactionType, module, status, payload
// ─────────────────────────────────────────────────────────────────────────────

function MlEventsTab() {
  const [data, setData] = useState<PageResponse<MlEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditApi.getMlEvents({ page: p, size: PAGE_SIZE });
      setData(result);
    } catch {
      setError('Failed to load ML events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(page); }, [load, page]);

  const columns: Column<MlEvent>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessor: (event) => (
        <div className="flex items-center gap-1.5 text-[12px] tabular-nums text-[var(--color-text-tertiary)] whitespace-nowrap">
          <Clock size={12} className="shrink-0" />
          {formatTimestamp(event.occurredAt)}
        </div>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      accessor: (event) => (
        <div className="flex items-center gap-1.5">
          <User size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
          <span className="text-[13px] text-[var(--color-text-primary)]">
            {event.actorIdentifier || `User #${event.actorUserId ?? '—'}`}
          </span>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessor: (event) => (
        <code className="text-[12px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded">
          {event.action}
        </code>
      ),
    },
    {
      id: 'interaction',
      header: 'Type',
      accessor: (event) => (
        <span className="text-[13px] text-[var(--color-text-secondary)]">
          {event.interactionType || '—'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'module',
      header: 'Module',
      accessor: (event) => (
        event.module ? (
          <Badge variant="default">{event.module}</Badge>
        ) : (
          <span className="text-[12px] text-[var(--color-text-tertiary)]">—</span>
        )
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (event) =>
        event.status ? (
          <Badge variant={mlStatusVariant(event.status)}>{event.status}</Badge>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => void load(page)}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors"
        >
          <RefreshCcw size={13} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => void load(page)} className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80">
            <RefreshCcw size={13} /> Retry
          </button>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="text-center py-12">
          <Cpu size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-[13px] text-[var(--color-text-tertiary)]">No ML events recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={data.content}
            keyExtractor={(event) => String(event.id)}
            pageSize={PAGE_SIZE}
            pageSizeOptions={[PAGE_SIZE]}
            emptyMessage="No ML events found."
            mobileCardRenderer={(event) => (
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <code className="text-[12px] font-mono text-[var(--color-text-primary)]">{event.action}</code>
                  {event.status && (
                    <Badge variant={mlStatusVariant(event.status)}>{event.status}</Badge>
                  )}
                </div>
                <p className="text-[13px] text-[var(--color-text-primary)] mb-1">
                  {event.actorIdentifier || `User #${event.actorUserId ?? '—'}`}
                </p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  {event.interactionType && `${event.interactionType} · `}
                  {formatTimestamp(event.occurredAt)}
                </p>
              </div>
            )}
          />

          <Pagination
            page={page}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            size={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Accounting Audit Trail Tab
// Fields: id, timestamp, actorIdentifier, actionType, entityType, entityId, referenceNumber, sensitiveOperation
// GET /api/v1/accounting/audit-trail
// ─────────────────────────────────────────────────────────────────────────────

function AccountingAuditTab() {
  const [data, setData] = useState<PageResponse<AccountingAuditTrailEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userFilter, setUserFilter] = useState<string | undefined>(undefined);

  const load = useCallback(async (p = 0, user?: string) => {
    setLoading(true);
    setError(null);
    setBackendError(false);
    try {
      const result = await auditApi.getAccountingAuditTrail({ page: p, size: PAGE_SIZE, user });
      setData(result);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 500 || status === 403) {
        setBackendError(true);
      } else {
        setError('Failed to load accounting audit trail.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(page, userFilter); }, [load, page, userFilter]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setUserFilter(value || undefined);
      setPage(0);
    }, 400);
  };

  const columns: Column<AccountingAuditTrailEntry>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessor: (entry) => (
        <div className="flex items-center gap-1.5 text-[12px] tabular-nums text-[var(--color-text-tertiary)] whitespace-nowrap">
          <Clock size={12} className="shrink-0" />
          {formatTimestamp(entry.timestamp)}
        </div>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      accessor: (entry) => (
        <div className="flex items-center gap-1.5">
          <User size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
          <span className="text-[13px] text-[var(--color-text-primary)]">
            {entry.actorIdentifier || `User #${entry.actorUserId ?? '—'}`}
          </span>
        </div>
      ),
    },
    {
      id: 'actionType',
      header: 'Action',
      accessor: (entry) => (
        <code className="text-[12px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded">
          {entry.actionType}
        </code>
      ),
    },
    {
      id: 'entity',
      header: 'Entity',
      accessor: (entry) => (
        <span className="text-[var(--color-text-secondary)]">
          {entry.entityType || '—'}
          {entry.entityId && (
            <span className="ml-1 text-[var(--color-text-tertiary)]">#{entry.entityId}</span>
          )}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'reference',
      header: 'Reference',
      accessor: (entry) => (
        entry.referenceNumber ? (
          <span className="text-[12px] font-mono text-[var(--color-text-secondary)]">{entry.referenceNumber}</span>
        ) : (
          <span className="text-[12px] text-[var(--color-text-tertiary)]">—</span>
        )
      ),
      hideOnMobile: true,
    },
    {
      id: 'sensitive',
      header: 'Sensitive',
      accessor: (entry) =>
        entry.sensitiveOperation ? (
          <Badge variant="warning">Sensitive</Badge>
        ) : (
          <span className="text-[12px] text-[var(--color-text-tertiary)]">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Filter by actor..."
            className={clsx(
              'w-full pl-9 pr-3 h-8 text-[13px] rounded-lg',
              'bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)]',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
              'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
            )}
          />
        </div>
        <button
          type="button"
          onClick={() => void load(page, userFilter)}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors"
        >
          <RefreshCcw size={13} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl h-16" />
          ))}
        </div>
      ) : backendError ? (
        <div className="text-center py-12">
          <ServerCrash size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-[14px] font-medium text-[var(--color-text-primary)] mb-1">Accounting Audit Service Unavailable</p>
          <p className="text-[13px] text-[var(--color-text-tertiary)] max-w-md mx-auto">
            The accounting audit trail service is experiencing issues on the backend. Please try again later or contact your system administrator.
          </p>
          <button
            type="button"
            onClick={() => void load(page, userFilter)}
            className="mt-4 flex items-center gap-1.5 mx-auto h-8 px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors border border-[var(--color-border-default)]"
          >
            <RefreshCcw size={13} />
            Try again
          </button>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => void load(page, userFilter)} className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80">
            <RefreshCcw size={13} /> Retry
          </button>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-[13px] text-[var(--color-text-tertiary)]">No accounting audit entries found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={data.content}
            keyExtractor={(entry) => String(entry.id)}
            pageSize={PAGE_SIZE}
            pageSizeOptions={[PAGE_SIZE]}
            emptyMessage="No accounting audit entries found."
            mobileCardRenderer={(entry) => (
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <code className="text-[12px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded">
                    {entry.actionType}
                  </code>
                  {entry.sensitiveOperation && (
                    <Badge variant="warning">Sensitive</Badge>
                  )}
                </div>
                <p className="text-[13px] text-[var(--color-text-primary)] mb-1">
                  {entry.actorIdentifier || `User #${entry.actorUserId ?? '—'}`}
                </p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  {entry.entityType}
                  {entry.entityId && ` #${entry.entityId}`}
                  {entry.referenceNumber && ` · ${entry.referenceNumber}`}
                  {' · '}
                  {formatTimestamp(entry.timestamp)}
                </p>
              </div>
            )}
          />

          <Pagination
            page={page}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            size={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Business Events', value: 'business' },
  { label: 'ML Events', value: 'ml' },
  { label: 'Accounting', value: 'accounting' },
];

export function AuditTrailPage() {
  const [activeTab, setActiveTab] = useState('business');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Audit Trail</h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
          Tenant-scoped log of business events, AI model interactions, and accounting operations.
        </p>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} variant="pill" />

      <div>
        {activeTab === 'business' && <BusinessEventsTab />}
        {activeTab === 'ml' && <MlEventsTab />}
        {activeTab === 'accounting' && <AccountingAuditTab />}
      </div>
    </div>
  );
}

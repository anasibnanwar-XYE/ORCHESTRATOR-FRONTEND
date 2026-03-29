/**
 * SuperadminAuditTrailPage
 *
 * Platform-level audit trail: tenant onboarding, lifecycle changes, admin actions.
 * Filterable by date range, action type, and actor.
 *
 * Data source:
 *  - superadminAuditApi.getBusinessEvents() → GET /api/v1/audit/business-events
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search,
  RefreshCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Activity,
  Filter,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { superadminAuditApi } from '@/lib/superadminApi';
import type { BusinessEvent, AuditEventFilters, PageResponse } from '@/types';

const PAGE_SIZE = 25;

const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'All action types' },
  { value: 'TENANT_CREATED', label: 'Tenant Created' },
  { value: 'TENANT_ACTIVATED', label: 'Tenant Activated' },
  { value: 'TENANT_SUSPENDED', label: 'Tenant Suspended' },
  { value: 'TENANT_DEACTIVATED', label: 'Tenant Deactivated' },
  { value: 'ADMIN_PASSWORD_RESET', label: 'Admin Password Reset' },
  { value: 'ROLE_ASSIGNED', label: 'Role Assigned' },
  { value: 'ROLE_CREATED', label: 'Role Created' },
  { value: 'SUPPORT_ACTION', label: 'Support Action' },
  { value: 'LIFECYCLE_CHANGE', label: 'Lifecycle Change' },
  { value: 'USER_LOGIN', label: 'User Login' },
  { value: 'USER_LOGOUT', label: 'User Logout' },
];

function formatTimestamp(ts: string): string {
  try {
    return format(new Date(ts), 'd MMM yyyy, HH:mm:ss');
  } catch {
    return ts;
  }
}

function severityVariant(s?: string): 'danger' | 'warning' | 'success' | 'default' {
  if (!s) return 'default';
  const upper = s.toUpperCase();
  if (upper === 'FAILURE' || upper === 'ERROR') return 'danger';
  if (upper === 'WARNING') return 'warning';
  if (upper === 'SUCCESS') return 'success';
  return 'default';
}

// ─────────────────────────────────────────────────────────────────────────────
// Business Events Table
// ─────────────────────────────────────────────────────────────────────────────

function BusinessEventsSection() {
  const [data, setData] = useState<PageResponse<BusinessEvent> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [actorFilter, setActorFilter] = useState('');
  const [actionType, setActionType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildFilters = useCallback((): AuditEventFilters => ({
    actor: actorFilter || undefined,
    action: actionType || undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    page,
    size: PAGE_SIZE,
  }), [actorFilter, actionType, dateFrom, dateTo, page]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const f = buildFilters();
      const result = await superadminAuditApi.getBusinessEvents(f);
      setData(result);
    } catch {
      setError("Couldn't load audit events. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleActorChange = (value: string) => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setActorFilter(value);
      setPage(0);
    }, 300);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2">
        {/* Row 1: search + action type */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            />
            <input
              type="text"
              placeholder="Filter by actor…"
              onChange={(e) => handleActorChange(e.target.value)}
              className={clsx(
                'w-full pl-9 pr-3 h-9 rounded-lg border border-[var(--color-border-default)]',
                'bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)]',
                'placeholder:text-[var(--color-text-placeholder)] outline-none',
                'focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
                'transition-colors duration-150',
              )}
            />
          </div>
          <div className="sm:w-52">
            <Select
              value={actionType}
              onChange={(e) => { setActionType(e.target.value); setPage(0); }}
              options={ACTION_TYPE_OPTIONS}
            />
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors shrink-0"
          >
            <RefreshCcw size={12} />
            Refresh
          </button>
        </div>

        {/* Row 2: date range */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-tertiary)] sm:w-24 shrink-0">
            <Filter size={11} />
            Date range
          </span>
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[var(--color-text-tertiary)] shrink-0 w-6">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                max={dateTo || undefined}
                className={clsx(
                  'h-9 px-2 rounded-lg border border-[var(--color-border-default)]',
                  'bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-primary)]',
                  'outline-none focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
                  'transition-colors duration-150',
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[var(--color-text-tertiary)] shrink-0 w-6">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                min={dateFrom || undefined}
                className={clsx(
                  'h-9 px-2 rounded-lg border border-[var(--color-border-default)]',
                  'bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-primary)]',
                  'outline-none focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
                  'transition-colors duration-150',
                )}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
                className="text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="text-[12px] font-medium underline underline-offset-2 hover:no-underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && data?.content.length === 0 && !error && (
        <div className="py-16 text-center">
          <Activity size={28} className="mx-auto text-[var(--color-text-tertiary)] opacity-30 mb-2" />
          <p className="text-[13px] text-[var(--color-text-tertiary)]">No audit events found</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && data && data.content.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
            <table className="min-w-full divide-y divide-[var(--color-border-subtle)]">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)]">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Timestamp</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Actor</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Action</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Resource</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {data.content.map((event) => (
                  <tr key={event.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-[var(--color-text-tertiary)] shrink-0" />
                        <span className="text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
                          {formatTimestamp(event.occurredAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-[var(--color-text-tertiary)] shrink-0" />
                        <span className="text-[12px] text-[var(--color-text-secondary)] truncate max-w-[120px]">
                          {event.actorIdentifier || `User #${event.actorUserId ?? '—'}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-mono text-[var(--color-text-primary)]">
                        {event.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-[var(--color-text-secondary)]">
                        {event.entityType || '—'}
                        {event.entityId && (
                          <span className="ml-1 text-[var(--color-text-tertiary)]">
                            #{event.entityId}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {event.status && (
                        <Badge variant={severityVariant(event.status)}>
                          {event.status}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            {data.content.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[12px] font-mono font-medium text-[var(--color-text-primary)]">
                    {event.action}
                  </span>
                  {event.status && (
                    <Badge variant={severityVariant(event.status)}>{event.status}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                  <span>{event.actorIdentifier || `User #${event.actorUserId ?? '—'}`}</span>
                  <span>{event.entityType || '—'}</span>
                  <span className="tabular-nums">{formatTimestamp(event.occurredAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <p className="text-[12px] text-[var(--color-text-tertiary)]">
              Page {data.page + 1} of {Math.max(1, data.totalPages)}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page + 1 >= data.totalPages}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function SuperadminAuditTrailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Audit Trail</h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
          Platform-level event log: tenant lifecycle, admin actions, and governance events.
        </p>
      </div>

      <BusinessEventsSection />
    </div>
  );
}

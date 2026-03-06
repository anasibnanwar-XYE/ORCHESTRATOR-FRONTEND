/**
 * SupportTicketsPage
 *
 * View all tenant-submitted support tickets across the platform.
 * Filterable by status and priority, searchable.
 * Clicking a ticket row navigates to the ticket detail view.
 *
 * Data source:
 *  - superadminTicketsApi.listTickets() → GET /api/v1/support/tickets
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { superadminTicketsApi } from '@/lib/superadminApi';
import type { SupportTicketResponse } from '@/types';

const PAGE_SIZE = 20;

type TicketStatus = SupportTicketResponse['status'];
type TicketPriority = NonNullable<SupportTicketResponse['priority']>;

function statusVariant(status: TicketStatus): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'OPEN') return 'warning';
  if (status === 'IN_PROGRESS') return 'default';
  if (status === 'RESOLVED') return 'success';
  if (status === 'CLOSED') return 'default';
  return 'default';
}

function priorityVariant(priority: TicketPriority | undefined): 'danger' | 'warning' | 'default' {
  if (priority === 'CRITICAL') return 'danger';
  if (priority === 'HIGH') return 'warning';
  return 'default';
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
}

function statusLabel(status: TicketStatus): string {
  const map: Record<TicketStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };
  return map[status] ?? status;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function SupportTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await superadminTicketsApi.listTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
      });
      setTickets(result);
    } catch {
      setError("Couldn't load support tickets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);


  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Support Tickets</h1>
          <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
            All tenant-submitted support requests across the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors shrink-0"
        >
          <RefreshCw size={12} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search tickets…"
            className={clsx(
              'w-full pl-9 pr-3 h-9 rounded-lg border border-[var(--color-border-default)]',
              'bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-placeholder)] outline-none',
              'focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
              'transition-colors duration-150',
            )}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'OPEN', label: 'Open' },
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'RESOLVED', label: 'Resolved' },
            { value: 'CLOSED', label: 'Closed' },
          ]}
        />
        <Select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
          options={[
            { value: '', label: 'All priorities' },
            { value: 'CRITICAL', label: 'Critical' },
            { value: 'HIGH', label: 'High' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
          ]}
        />
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
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

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Empty ───────────────────────────────────────────────────── */}
      {!isLoading && tickets.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
          <LifeBuoy size={32} className="text-[var(--color-text-tertiary)] mb-3 opacity-40" />
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
            {search || statusFilter || priorityFilter ? 'No tickets match your filters' : 'No support tickets'}
          </p>
          <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
            {search || statusFilter || priorityFilter
              ? 'Try adjusting your filters.'
              : 'Tenant support tickets will appear here.'}
          </p>
        </div>
      )}

      {/* ── Tickets ─────────────────────────────────────────────────── */}
      {!isLoading && tickets.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
            <table className="min-w-full divide-y divide-[var(--color-border-subtle)]">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)]">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Ticket</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Tenant</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Priority</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Status</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
                    onClick={() => navigate(`/superadmin/tickets/${ticket.publicId}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate max-w-[240px]">
                        {ticket.subject}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] font-mono mt-0.5">
                        {ticket.publicId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-[var(--color-text-secondary)]">
                        {ticket.requesterEmail ?? '—'}
                      </p>
                      <span className="text-[10px] font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-[var(--color-text-tertiary)]">
                        {ticket.companyCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={priorityVariant(ticket.priority)}>
                        {ticket.priority ?? '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(ticket.status)}>
                        {statusLabel(ticket.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                        {formatDate(ticket.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] cursor-pointer hover:bg-[var(--color-surface-secondary)] transition-colors"
                onClick={() => navigate(`/superadmin/tickets/${ticket.publicId}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/superadmin/tickets/${ticket.publicId}`); }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--color-text-tertiary)] mt-0.5">
                      {ticket.publicId}
                    </p>
                  </div>
                  <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority ?? '—'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(ticket.status)}>{statusLabel(ticket.status)}</Badge>
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">
                    {ticket.companyCode}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums ml-auto">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {tickets.length >= PAGE_SIZE && (
            <div className="flex items-center justify-between gap-4 pt-1">
              <p className="text-[12px] text-[var(--color-text-tertiary)]">
                Page {page + 1}
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
                  disabled={tickets.length < PAGE_SIZE}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

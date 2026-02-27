import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listAuditTransactions,
  getAuditTransactionDetail,
  type AuditTransactionSummary,
  type AuditTransactionDetail,
} from '../../lib/accountingApi';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Search,
  X,
  Clock,
  User,
  Hash,
  FileText,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatAmount(value?: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

function formatDateTime(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d;
  }
}

interface ExpandedDetail {
  journalEntryId: number;
  data: AuditTransactionDetail | null;
  loading: boolean;
  error: string | null;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-3 rounded bg-surface-highlight animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

function DetailPanel({ detail }: { detail: ExpandedDetail }) {
  if (detail.loading) {
    return (
      <div className="p-5 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-3 rounded bg-surface-highlight animate-pulse" style={{ width: `${40 + i * 20}%` }} />
        ))}
      </div>
    );
  }
  if (detail.error) {
    return (
      <div className="flex items-center gap-2 p-5 text-sm text-[var(--status-error-text)]">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {detail.error}
      </div>
    );
  }
  if (!detail.data) return null;

  const d = detail.data;

  return (
    <div className="px-5 py-4 space-y-5 bg-background border-t border-border">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Hash, label: 'Journal Entry ID', value: String(d.journalEntryId) },
          { icon: Clock, label: 'Date', value: formatDate(d.date) },
          { icon: User, label: 'User', value: d.user ?? '—' },
          { icon: FileText, label: 'Reference', value: d.referenceNumber ?? '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3.5 w-3.5 text-secondary" />
              <span className="text-xs text-secondary">{label}</span>
            </div>
            <p className="text-sm font-medium text-primary">{value}</p>
          </div>
        ))}
      </div>

      {d.lines && d.lines.length > 0 && (
        <div>
          <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">Journal Lines</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-highlight">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-secondary">Account</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-secondary">Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-secondary">Debit</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-secondary">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-surface-highlight transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-primary text-xs">
                        {line.accountCode ? `${line.accountCode} — ` : ''}{line.accountName ?? `Account #${line.accountId}`}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-secondary text-xs">{line.description ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-primary font-medium text-xs">
                      {line.debit != null ? formatAmount(line.debit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-primary font-medium text-xs">
                      {line.credit != null ? formatAmount(line.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {d.auditTrail && d.auditTrail.length > 0 && (
        <div>
          <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">Audit Trail</p>
          <div className="space-y-2">
            {d.auditTrail.map((event, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--action-primary-bg)]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-primary">{event.action ?? 'Action'}</span>
                    {event.performedBy && (
                      <span className="text-xs text-secondary">by {event.performedBy}</span>
                    )}
                    {event.timestamp && (
                      <span className="text-xs text-secondary ml-auto">{formatDateTime(event.timestamp)}</span>
                    )}
                  </div>
                  {event.notes && <p className="mt-0.5 text-xs text-secondary">{event.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditTransactionsPage() {
  const { session } = useAuth();

  const [transactions, setTransactions] = useState<AuditTransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [totalElements, setTotalElements] = useState<number | undefined>(undefined);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [journalIdFilter, setJournalIdFilter] = useState('');

  // Expanded detail rows
  const [expandedDetails, setExpandedDetails] = useState<Map<number, ExpandedDetail>>(new Map());

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const params: { page?: number; size?: number; journalEntryId?: number; from?: string; to?: string } = {
        page,
        size: pageSize,
      };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (journalIdFilter) params.journalEntryId = Number(journalIdFilter);

      const result = await listAuditTransactions(params, session);
      setTransactions(result.content);
      if (result.totalPages !== undefined) setTotalPages(result.totalPages);
      if (result.totalElements !== undefined) setTotalElements(result.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit transactions');
    } finally {
      setLoading(false);
    }
  }, [session, page, pageSize, fromDate, toDate, journalIdFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => {
    setPage(0);
    load();
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setJournalIdFilter('');
    setPage(0);
  };

  const toggleDetail = async (tx: AuditTransactionSummary) => {
    const id = tx.journalEntryId;

    if (expandedDetails.has(id)) {
      const next = new Map(expandedDetails);
      next.delete(id);
      setExpandedDetails(next);
      return;
    }

    const next = new Map(expandedDetails);
    next.set(id, { journalEntryId: id, data: null, loading: true, error: null });
    setExpandedDetails(next);

    try {
      const detail = await getAuditTransactionDetail(id, session);
      setExpandedDetails((prev) => {
        const m = new Map(prev);
        m.set(id, { journalEntryId: id, data: detail, loading: false, error: null });
        return m;
      });
    } catch (err) {
      setExpandedDetails((prev) => {
        const m = new Map(prev);
        m.set(id, {
          journalEntryId: id,
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load detail',
        });
        return m;
      });
    }
  };

  const hasFilters = fromDate || toDate || journalIdFilter;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-display text-primary">Audit Transactions</h1>
          <p className="mt-1 text-sm text-secondary">
            Full immutable log of all financial transactions with audit trail.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-secondary">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-secondary">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-secondary">Journal Entry ID</label>
            <input
              type="number"
              value={journalIdFilter}
              onChange={(e) => setJournalIdFilter(e.target.value)}
              placeholder="Filter by ID"
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-all"
              style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
            >
              <Search className="h-4 w-4" />
              Search
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm text-secondary hover:text-primary hover:bg-surface-highlight transition-colors"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--status-error-bg)] bg-[var(--status-error-bg)] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-error-text)]" />
          <p className="text-sm text-[var(--status-error-text)]">{error}</p>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-highlight">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Journal Entry</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Description</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">User</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && [...Array(pageSize > 10 ? 8 : pageSize)].map((_, i) => (
                <SkeletonRow key={i} cols={8} />
              ))}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-surface-highlight p-4">
                        <ShieldCheck className="h-7 w-7 text-secondary" />
                      </div>
                      <p className="text-sm font-medium text-primary">No audit transactions found</p>
                      <p className="text-xs text-secondary">
                        {hasFilters ? 'Try adjusting your filters.' : 'No transactions have been recorded yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && transactions.map((tx) => {
                const isExpanded = expandedDetails.has(tx.journalEntryId);
                const detail = expandedDetails.get(tx.journalEntryId);
                return (
                  <>
                    <tr
                      key={tx.journalEntryId}
                      className={`hover:bg-surface-highlight transition-colors cursor-pointer ${isExpanded ? 'bg-surface-highlight' : ''}`}
                      onClick={() => toggleDetail(tx)}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-secondary">
                        #{tx.journalEntryId}
                        {tx.referenceNumber && (
                          <span className="ml-1 text-primary">{tx.referenceNumber}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-secondary">
                        {tx.transactionType ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-primary tabular-nums">
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="px-5 py-3 text-secondary whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-5 py-3 text-secondary max-w-[200px] truncate">
                        {tx.description ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-secondary">
                        {tx.user ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        {tx.status ? <StatusBadge status={tx.status} /> : <span className="text-secondary text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-secondary" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-secondary" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && detail && (
                      <tr key={`${tx.journalEntryId}-detail`}>
                        <td colSpan={8} className="p-0">
                          <DetailPanel detail={detail} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading && (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3">
                <div className="h-4 w-32 rounded bg-surface-highlight animate-pulse" />
                <div className="h-3 w-48 rounded bg-surface-highlight animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-surface-highlight animate-pulse" />
              </div>
            ))}
          </>
        )}
        {!loading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-14 shadow-sm">
            <div className="rounded-full bg-surface-highlight p-4 mb-4">
              <ShieldCheck className="h-7 w-7 text-secondary" />
            </div>
            <p className="text-sm font-medium text-primary">No audit transactions found</p>
            {hasFilters && (
              <p className="mt-1 text-xs text-secondary">Try adjusting your filters.</p>
            )}
          </div>
        )}
        {!loading && transactions.map((tx) => {
          const isExpanded = expandedDetails.has(tx.journalEntryId);
          const detail = expandedDetails.get(tx.journalEntryId);
          return (
            <div key={tx.journalEntryId} className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
              <button
                type="button"
                className="w-full text-left p-4 space-y-2 hover:bg-surface-highlight transition-colors"
                onClick={() => toggleDetail(tx)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {formatAmount(tx.amount)}
                    </p>
                    <p className="mt-0.5 text-xs font-mono text-secondary">
                      #{tx.journalEntryId}
                      {tx.referenceNumber && ` · ${tx.referenceNumber}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tx.status && <StatusBadge status={tx.status} />}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-secondary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-secondary" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-secondary">
                  {tx.transactionType && <span>{tx.transactionType}</span>}
                  <span>·</span>
                  <span>{formatDate(tx.date)}</span>
                  {tx.user && (
                    <>
                      <span>·</span>
                      <span>{tx.user}</span>
                    </>
                  )}
                </div>

                {tx.description && (
                  <p className="text-xs text-secondary truncate">{tx.description}</p>
                )}
              </button>

              {isExpanded && detail && (
                <DetailPanel detail={detail} />
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {(transactions.length > 0 || page > 0) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-primary outline-none focus:border-[var(--border-focus)] transition-colors"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {totalElements !== undefined && (
              <span>
                {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary hover:bg-surface-highlight disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="px-3 text-sm text-secondary">
              Page {page + 1}{totalPages !== undefined ? ` of ${totalPages}` : ''}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={(totalPages !== undefined && page >= totalPages - 1) || transactions.length < pageSize || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary hover:bg-surface-highlight disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listAccountingPeriods,
  closeAccountingPeriod,
  lockAccountingPeriod,
  reopenAccountingPeriod,
  type AccountingPeriod,
} from '../../lib/accountingApi';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Lock, LockOpen, XCircle, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';

function normalizeDate(d: unknown): Date {
  if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
  return new Date(d as string);
}

type PeriodAction = 'close' | 'lock' | 'reopen';

interface PendingAction {
  type: PeriodAction;
  period: AccountingPeriod;
}

const ACTION_META: Record<PeriodAction, {
  title: string;
  description: (p: AccountingPeriod) => string;
  confirmLabel: string;
  variant: 'default' | 'danger';
}> = {
  close: {
    title: 'Close Accounting Period',
    description: (p) => `Close the period "${p.name}"? Journal entries will no longer be posted to this period.`,
    confirmLabel: 'Close Period',
    variant: 'danger',
  },
  lock: {
    title: 'Lock Accounting Period',
    description: (p) => `Lock the period "${p.name}"? This prevents any further modifications, including reversals.`,
    confirmLabel: 'Lock Period',
    variant: 'danger',
  },
  reopen: {
    title: 'Reopen Accounting Period',
    description: (p) => `Reopen the period "${p.name}"? Journal entries will be permitted again.`,
    confirmLabel: 'Reopen Period',
    variant: 'default',
  },
};

export default function AccountingPeriodsPage() {
  const { session } = useAuth();
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPeriods = async () => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      const data = await listAccountingPeriods(session);
      setPeriods(data);
    } catch (err) {
      setError('Failed to load accounting periods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleConfirmAction = async () => {
    if (!pendingAction || !session) return;
    setActionLoading(true);
    try {
      const { type, period } = pendingAction;
      if (type === 'close') {
        await closeAccountingPeriod(period.id, session);
        setSuccess(`Period "${period.name}" closed successfully.`);
      } else if (type === 'lock') {
        await lockAccountingPeriod(period.id, session);
        setSuccess(`Period "${period.name}" locked successfully.`);
      } else {
        await reopenAccountingPeriod(period.id, session);
        setSuccess(`Period "${period.name}" reopened successfully.`);
      }
      setPendingAction(null);
      loadPeriods();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${pendingAction.type} period`);
      setPendingAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-display text-primary">Accounting Periods</h1>
          <p className="mt-1 text-sm text-secondary">
            Manage fiscal periods — open, close, lock, or reopen as required.
          </p>
        </div>
        <button
          type="button"
          onClick={loadPeriods}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--status-error-bg)] bg-[var(--status-error-bg)] px-4 py-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-error-text)]" />
          <p className="text-sm text-[var(--status-error-text)]">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-[var(--status-success-bg)] px-4 py-3 text-sm text-[var(--status-success-text)]">
          {success}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-highlight text-secondary">
              <tr>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide">Period Name</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide">Start Date</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide">End Date</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <>
                  {[...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><div className="h-3 w-32 rounded bg-surface-highlight animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-3 w-24 rounded bg-surface-highlight animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-3 w-24 rounded bg-surface-highlight animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-5 w-16 rounded-full bg-surface-highlight animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-3 w-20 rounded bg-surface-highlight animate-pulse ml-auto" /></td>
                    </tr>
                  ))}
                </>
              )}
              {!loading && periods.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary text-sm">
                    No accounting periods found.
                  </td>
                </tr>
              )}
              {!loading && periods.map((period) => (
                <tr key={period.id} className="hover:bg-surface-highlight transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{period.name}</td>
                  <td className="px-6 py-4 text-secondary">
                    {format(normalizeDate(period.startDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-secondary">
                    {format(normalizeDate(period.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={period.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {period.status === 'OPEN' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPendingAction({ type: 'close', period })}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] hover:opacity-80 transition-opacity"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingAction({ type: 'lock', period })}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-error-bg)] text-[var(--status-error-text)] hover:opacity-80 transition-opacity"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Lock
                          </button>
                        </>
                      )}
                      {period.status === 'CLOSED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPendingAction({ type: 'lock', period })}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-error-bg)] text-[var(--status-error-text)] hover:opacity-80 transition-opacity"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Lock
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingAction({ type: 'reopen', period })}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-info-bg)] text-[var(--status-info-text)] hover:opacity-80 transition-opacity"
                          >
                            <LockOpen className="h-3.5 w-3.5" />
                            Reopen
                          </button>
                        </>
                      )}
                      {period.status === 'LOCKED' && (
                        <button
                          type="button"
                          onClick={() => setPendingAction({ type: 'reopen', period })}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-info-bg)] text-[var(--status-info-text)] hover:opacity-80 transition-opacity"
                        >
                          <LockOpen className="h-3.5 w-3.5" />
                          Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading && (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3">
                <div className="h-4 w-36 rounded bg-surface-highlight animate-pulse" />
                <div className="h-3 w-48 rounded bg-surface-highlight animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-surface-highlight animate-pulse" />
              </div>
            ))}
          </>
        )}
        {!loading && periods.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-14 shadow-sm">
            <div className="rounded-full bg-surface-highlight p-4 mb-4">
              <Calendar className="h-7 w-7 text-secondary" />
            </div>
            <p className="text-sm font-medium text-primary">No accounting periods found</p>
          </div>
        )}
        {!loading && periods.map((period) => (
          <div key={period.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-primary">{period.name}</p>
                <p className="mt-0.5 text-xs text-secondary">
                  {format(normalizeDate(period.startDate), 'MMM d, yyyy')} —{' '}
                  {format(normalizeDate(period.endDate), 'MMM d, yyyy')}
                </p>
              </div>
              <StatusBadge status={period.status} />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {period.status === 'OPEN' && (
                <>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ type: 'close', period })}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] hover:opacity-80 transition-opacity"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ type: 'lock', period })}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-error-bg)] text-[var(--status-error-text)] hover:opacity-80 transition-opacity"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Lock
                  </button>
                </>
              )}
              {period.status === 'CLOSED' && (
                <>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ type: 'lock', period })}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-error-bg)] text-[var(--status-error-text)] hover:opacity-80 transition-opacity"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Lock
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ type: 'reopen', period })}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-info-bg)] text-[var(--status-info-text)] hover:opacity-80 transition-opacity"
                  >
                    <LockOpen className="h-3.5 w-3.5" />
                    Reopen
                  </button>
                </>
              )}
              {period.status === 'LOCKED' && (
                <button
                  type="button"
                  onClick={() => setPendingAction({ type: 'reopen', period })}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-info-bg)] text-[var(--status-info-text)] hover:opacity-80 transition-opacity"
                >
                  <LockOpen className="h-3.5 w-3.5" />
                  Reopen
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {pendingAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirmAction}
          title={ACTION_META[pendingAction.type].title}
          description={ACTION_META[pendingAction.type].description(pendingAction.period)}
          confirmLabel={ACTION_META[pendingAction.type].confirmLabel}
          variant={ACTION_META[pendingAction.type].variant}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

/**
 * AccountingPeriodsPage
 *
 * Lists all accounting periods with:
 *  - Name, Start Date, End Date, Status badges (Open/Closed/Locked)
 *  - Close action (OPEN periods) with dialog requiring a note
 *  - Lock action (OPEN periods) with dialog
 *  - Reopen action (CLOSED periods, not LOCKED) with dialog requiring a reason
 *
 * API:
 *  GET  /api/v1/accounting/periods
 *  POST /api/v1/accounting/periods/{id}/close
 *  POST /api/v1/accounting/periods/{id}/lock
 *  POST /api/v1/accounting/periods/{id}/reopen
 */

import { useState, useCallback, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { RefreshCcw, AlertCircle, Lock, Unlock, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { accountingApi, type AccountingPeriodDto } from '@/lib/accountingApi';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

type PeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

function PeriodStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
    OPEN: { variant: 'success', label: 'Open' },
    CLOSED: { variant: 'warning', label: 'Closed' },
    LOCKED: { variant: 'danger', label: 'Locked' },
  };
  const { variant, label } = map[status] ?? { variant: 'default', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Action state
// ─────────────────────────────────────────────────────────────────────────────

type ActionType = 'close' | 'lock' | 'reopen' | null;

interface ActionState {
  type: ActionType;
  period: AccountingPeriodDto | null;
  note: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Period Row
// ─────────────────────────────────────────────────────────────────────────────

interface PeriodRowProps {
  period: AccountingPeriodDto;
  onClose: (p: AccountingPeriodDto) => void;
  onLock: (p: AccountingPeriodDto) => void;
  onReopen: (p: AccountingPeriodDto) => void;
}

function PeriodRow({ period, onClose, onLock, onReopen }: PeriodRowProps) {
  const status = period.status as PeriodStatus;

  return (
    <tr className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
      <td className="px-4 py-3 text-[13px] font-medium text-[var(--color-text-primary)]">
        {period.name}
      </td>
      <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)] tabular-nums">
        {formatDate(period.startDate)}
      </td>
      <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)] tabular-nums">
        {formatDate(period.endDate)}
      </td>
      <td className="px-4 py-3">
        <PeriodStatusBadge status={period.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {status === 'OPEN' && (
            <>
              <button
                type="button"
                onClick={() => onClose(period)}
                aria-label="Close period"
                className="h-7 px-2.5 rounded-md text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors border border-[var(--color-border-default)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => onLock(period)}
                aria-label="Lock period"
                className="h-7 px-2.5 rounded-md text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors border border-[var(--color-border-default)]"
              >
                <span className="flex items-center gap-1">
                  <Lock size={11} />
                  Lock
                </span>
              </button>
            </>
          )}
          {status === 'CLOSED' && (
            <button
              type="button"
              onClick={() => onReopen(period)}
              aria-label="Reopen period"
              className="h-7 px-2.5 rounded-md text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors border border-[var(--color-border-default)]"
            >
              <span className="flex items-center gap-1">
                <Unlock size={11} />
                Reopen
              </span>
            </button>
          )}
          {status === 'LOCKED' && (
            <span className="text-[11px] text-[var(--color-text-tertiary)]">Locked</span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface ActionDialogProps {
  action: ActionState;
  isLoading: boolean;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function ActionDialog({ action, isLoading, onNoteChange, onConfirm, onCancel }: ActionDialogProps) {
  if (!action.type || !action.period) return null;

  const periodName = action.period.name;

  const config: Record<NonNullable<ActionType>, {
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'default';
    noteLabel?: string;
    notePlaceholder?: string;
  }> = {
    close: {
      title: 'Close Period',
      description: `Closing "${periodName}" will prevent new postings. You can reopen it later.`,
      confirmLabel: 'Close Period',
      variant: 'warning',
      noteLabel: 'Closing note (optional)',
      notePlaceholder: 'Reason for closing this period...',
    },
    lock: {
      title: 'Lock Period',
      description: `Locking "${periodName}" will permanently prevent new postings. This cannot be undone.`,
      confirmLabel: 'Lock Period',
      variant: 'danger',
      noteLabel: 'Lock reason (optional)',
      notePlaceholder: 'Reason for locking this period...',
    },
    reopen: {
      title: 'Reopen Period',
      description: `Reopening "${periodName}" will allow new postings. Any closing journal will be automatically reversed.`,
      confirmLabel: 'Reopen Period',
      variant: 'default',
      noteLabel: 'Reopen reason',
      notePlaceholder: 'Reason for reopening...',
    },
  };

  const c = config[action.type];

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px]"
        onClick={onCancel}
        style={{ animation: 'fadeIn 200ms ease-out forwards' }}
      />
      <div
        className="relative w-full max-w-sm bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] p-5"
        style={{
          boxShadow: 'var(--shadow-modal)',
          animation: 'slideUp 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            {c.title}
          </h3>
          <button
            onClick={onCancel}
            className="h-7 w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-4">
          {c.description}
        </p>
        {c.noteLabel && (
          <div className="mb-5">
            <Input
              label={c.noteLabel}
              placeholder={c.notePlaceholder}
              value={action.note}
              onChange={(e) => onNoteChange(e.target.value)}
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="btn-secondary h-9 px-4 text-[13px]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              c.variant === 'danger'
                ? 'bg-[var(--color-error)] text-[var(--color-text-inverse)] hover:bg-[var(--color-error-hover)] focus-visible:ring-[var(--color-error-ring)]'
                : c.variant === 'warning'
                  ? 'bg-[var(--color-warning)] text-[var(--color-text-inverse)] hover:bg-[var(--color-warning-hover)] focus-visible:ring-[var(--color-warning-ring)]'
                  : 'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)] hover:bg-[var(--color-neutral-800)] focus-visible:ring-[var(--color-neutral-300)]',
              isLoading && 'opacity-60 pointer-events-none',
            )}
          >
            {isLoading ? 'Processing...' : c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function AccountingPeriodsPage() {
  const toast = useToast();

  const [periods, setPeriods] = useState<AccountingPeriodDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionState>({ type: null, period: null, note: '' });
  const [isActing, setIsActing] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPeriods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await accountingApi.getPeriods();
      const sorted = [...data].sort((a, b) => b.startDate.localeCompare(a.startDate));
      setPeriods(sorted);
    } catch {
      setError('Could not load accounting periods. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleConfirmAction = async () => {
    if (!action.type || !action.period) return;
    setIsActing(true);
    try {
      let updated: AccountingPeriodDto;
      if (action.type === 'close') {
        updated = await accountingApi.closePeriod(action.period.id, { note: action.note || undefined });
      } else if (action.type === 'lock') {
        updated = await accountingApi.lockPeriod(action.period.id, { reason: action.note || undefined });
      } else {
        updated = await accountingApi.reopenPeriod(action.period.id, { reason: action.note || undefined });
      }
      setPeriods((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      const verb = action.type === 'close' ? 'closed' : action.type === 'lock' ? 'locked' : 'reopened';
      toast.success(`Period ${verb} successfully.`);
      setAction({ type: null, period: null, note: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setIsActing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
            Accounting Periods
          </h1>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            Manage period lifecycle — open, close, and lock periods to control posting windows.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchPeriods}
          disabled={isLoading}
          leftIcon={<RefreshCcw size={14} />}
        >
          Refresh
        </Button>
      </div>

      {/* Content */}
      <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)]">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <AlertCircle size={20} className="text-[var(--color-error)] mb-3" />
            <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={fetchPeriods}>
              Try again
            </Button>
          </div>
        ) : periods.length === 0 ? (
          <div className="py-12 px-4">
            <EmptyState
              title="No periods found"
              description="Create accounting periods to track your financial activity by month."
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)]">
                    {['Period', 'Start Date', 'End Date', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <PeriodRow
                      key={period.id}
                      period={period}
                      onClose={(p) => setAction({ type: 'close', period: p, note: '' })}
                      onLock={(p) => setAction({ type: 'lock', period: p, note: '' })}
                      onReopen={(p) => setAction({ type: 'reopen', period: p, note: '' })}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
              {periods.map((period) => (
                <div key={period.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                      {period.name}
                    </span>
                    <PeriodStatusBadge status={period.status} />
                  </div>
                  <div className="text-[12px] text-[var(--color-text-secondary)] tabular-nums">
                    {formatDate(period.startDate)} – {formatDate(period.endDate)}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {(period.status as PeriodStatus) === 'OPEN' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setAction({ type: 'close', period, note: '' })}
                          aria-label="Close period"
                          className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => setAction({ type: 'lock', period, note: '' })}
                          aria-label="Lock period"
                          className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
                        >
                          Lock
                        </button>
                      </>
                    )}
                    {(period.status as PeriodStatus) === 'CLOSED' && (
                      <button
                        type="button"
                        onClick={() => setAction({ type: 'reopen', period, note: '' })}
                        aria-label="Reopen period"
                        className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action Dialog */}
      <ActionDialog
        action={action}
        isLoading={isActing}
        onNoteChange={(note) => setAction((prev) => ({ ...prev, note }))}
        onConfirm={handleConfirmAction}
        onCancel={() => setAction({ type: null, period: null, note: '' })}
      />
    </div>
  );
}

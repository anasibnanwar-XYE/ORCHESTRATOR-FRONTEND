import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Plus, X, Target, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  listSalesTargets,
  createSalesTarget,
  updateSalesTarget,
  deleteSalesTarget,
  type SalesTargetDto,
  type SalesTargetRequest,
} from '../../lib/salesApi';
import { formatDate, formatAmount } from '../../lib/formatUtils';

const fmtDate = formatDate;
const formatCurrency = formatAmount;

const progressPercent = (achieved?: number | null, target?: number | null) => {
  if (!target || target <= 0) return 0;
  return Math.min(Math.round(((achieved ?? 0) / target) * 100), 100);
};

export default function SalesTargetsPage() {
  const { session } = useAuth();
  const [targets, setTargets] = useState<SalesTargetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTargetDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    setError(null);
    listSalesTargets(session)
      .then((data) => { if (active) setTargets(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Failed to load targets'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session]);

  const filteredTargets = useMemo(() => {
    if (!searchQuery) return targets;
    const q = searchQuery.toLowerCase();
    return targets.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.assignee?.toLowerCase().includes(q)
    );
  }, [targets, searchQuery]);

  const refreshTargets = useCallback(() => {
    if (!session) return;
    listSalesTargets(session)
      .then(setTargets)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to refresh'));
  }, [session]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingTarget(null);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((target: SalesTargetDto) => {
    setEditingTarget(target);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!session) return;
    try {
      await deleteSalesTarget(id, session);
      setTargets((prev) => prev.filter((t) => t.id !== id));
      showToast('success', 'Target deleted');
      setDeleteConfirm(null);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }, [session, showToast]);

  const handleFormSubmit = useCallback(async (payload: SalesTargetRequest) => {
    if (!session) return;
    setSubmitting(true);
    try {
      if (editingTarget?.id) {
        await updateSalesTarget(editingTarget.id, payload, session);
        showToast('success', 'Target updated');
      } else {
        await createSalesTarget(payload, session);
        showToast('success', 'Target created');
      }
      setFormOpen(false);
      setEditingTarget(null);
      refreshTargets();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save target');
    } finally {
      setSubmitting(false);
    }
  }, [session, editingTarget, showToast, refreshTargets]);

  if (!session) {
    return (
      <div className="rounded-2xl border border-transparent bg-status-warning-bg px-6 py-4 text-sm text-status-warning-text">
        Sign in to manage sales targets.
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2">Sales planning</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-primary truncate">Targets</h1>
            <p className="text-sm text-secondary mt-1">
              Set and track sales targets by period and assignee.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="shrink-0 flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New target</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
            {error}
          </div>
        )}
        {toast && (
          <div className={`rounded-xl border border-transparent px-4 py-3 text-sm ${toast.type === 'success' ? 'bg-status-success-bg text-status-success-text' : 'bg-status-error-bg text-status-error-text'}`}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
        <input
          type="text"
          placeholder="Search by name or assignee..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 rounded-lg border border-border bg-surface px-3 pl-10 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
        />
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-secondary">Loading targets...</p>
          </div>
        ) : filteredTargets.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-surface-highlight p-6">
            <Target className="mx-auto h-10 w-10 text-tertiary mb-3" />
            <p className="text-sm text-secondary mb-2">
              {targets.length === 0 ? 'No targets yet. Create your first target to get started.' : 'No targets match your search.'}
            </p>
            {targets.length === 0 && (
              <button
                onClick={handleOpenCreate}
                className="mt-3 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
              >
                <Plus className="h-4 w-4" />
                Create your first target
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="grid gap-4 lg:hidden">
              {filteredTargets.map((target) => {
                const pct = progressPercent(target.achievedAmount, target.targetAmount);
                return (
                  <article key={target.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-primary truncate">{target.name || '—'}</h3>
                        <p className="text-sm text-secondary">{target.assignee || 'Unassigned'}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleOpenEdit(target)} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-highlight transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(target.id ?? null)} className="p-1.5 rounded-lg text-secondary hover:text-status-error-text hover:bg-status-error-bg transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <span className="text-xs text-tertiary uppercase tracking-wider">Period</span>
                        <p className="text-secondary">{fmtDate(target.periodStart)} — {fmtDate(target.periodEnd)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-tertiary uppercase tracking-wider">Progress</span>
                        <p className="text-primary font-medium">{formatCurrency(target.achievedAmount)} / {formatCurrency(target.targetAmount)}</p>
                      </div>
                    </div>
                    <ProgressBar percent={pct} />
                  </article>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-highlight">
                      <th className="px-4 py-3 text-left font-semibold text-primary">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-primary">Assignee</th>
                      <th className="px-4 py-3 text-left font-semibold text-primary">Period</th>
                      <th className="px-4 py-3 text-right font-semibold text-primary">Target</th>
                      <th className="px-4 py-3 text-right font-semibold text-primary">Achieved</th>
                      <th className="px-4 py-3 text-left font-semibold text-primary min-w-[120px]">Progress</th>
                      <th className="px-4 py-3 text-center font-semibold text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTargets.map((target) => {
                      const pct = progressPercent(target.achievedAmount, target.targetAmount);
                      return (
                        <tr key={target.id} className="hover:bg-surface-highlight transition-colors">
                          <td className="px-4 py-3 font-medium text-primary">{target.name || '—'}</td>
                          <td className="px-4 py-3 text-secondary">{target.assignee || '—'}</td>
                          <td className="px-4 py-3 text-secondary text-xs">{fmtDate(target.periodStart)} — {fmtDate(target.periodEnd)}</td>
                          <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(target.targetAmount)}</td>
                          <td className="px-4 py-3 text-right text-primary">{formatCurrency(target.achievedAmount)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ProgressBar percent={pct} />
                              <span className="text-xs text-secondary shrink-0">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => handleOpenEdit(target)} className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-highlight transition-colors" title="Edit">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={() => setDeleteConfirm(target.id ?? null)} className="p-2 rounded-lg text-secondary hover:text-status-error-text hover:bg-status-error-bg transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <TargetFormModal
        open={formOpen}
        target={editingTarget}
        onClose={() => { setFormOpen(false); setEditingTarget(null); }}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />

      {/* Delete Confirmation */}
      {deleteConfirm != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-2">Delete target?</h3>
            <p className="text-sm text-secondary mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-10 rounded-lg bg-surface-highlight text-primary font-medium text-sm hover:opacity-80 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 h-10 rounded-lg bg-status-error-bg text-status-error-text font-medium text-sm hover:opacity-80 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Progress Bar ─────────────────────────────────────── */

function ProgressBar({ percent }: { percent: number }) {
  const color = percent >= 100 ? 'bg-status-success-text' : percent >= 60 ? 'bg-brand-400' : 'bg-status-warning-text';
  return (
    <div className="flex-1 h-2 rounded-full bg-surface-highlight overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

/* ── Target Form Modal ────────────────────────────────── */

function TargetFormModal({
  open,
  target,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  target: SalesTargetDto | null;
  onClose: () => void;
  onSubmit: (payload: SalesTargetRequest) => void;
  onSubmitting?: boolean;
  submitting: boolean;
}) {
  const [name, setName] = useState('');
  const [assignee, setAssignee] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [achievedAmount, setAchievedAmount] = useState('');

  useEffect(() => {
    if (open && target) {
      setName(target.name || '');
      setAssignee(target.assignee || '');
      setPeriodStart(target.periodStart || '');
      setPeriodEnd(target.periodEnd || '');
      setTargetAmount(target.targetAmount != null ? String(target.targetAmount) : '');
      setAchievedAmount(target.achievedAmount != null ? String(target.achievedAmount) : '');
    } else if (open && !target) {
      setName('');
      setAssignee('');
      setPeriodStart('');
      setPeriodEnd('');
      setTargetAmount('');
      setAchievedAmount('');
    }
  }, [open, target]);

  if (!open) return null;

  const isValid = name.trim() && periodStart && periodEnd && targetAmount && Number(targetAmount) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      name: name.trim(),
      periodStart,
      periodEnd,
      targetAmount: Number(targetAmount),
      achievedAmount: achievedAmount ? Number(achievedAmount) : undefined,
      assignee: assignee.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-surface shadow-lg flex flex-col">
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <h2 className="text-lg font-semibold text-primary">{target ? 'Edit Target' : 'New Target'}</h2>
            <p className="text-sm text-secondary mt-1">{target ? 'Update target details' : 'Set a new sales target'}</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-secondary hover:text-primary transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <FormField label="Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q1 2026 Revenue Target"
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
            />
          </FormField>
          <FormField label="Assignee">
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Team member or team name"
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Period start" required>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
              />
            </FormField>
            <FormField label="Period end" required>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Target amount" required>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
              />
            </FormField>
            <FormField label="Achieved amount">
              <input
                type="number"
                value={achievedAmount}
                onChange={(e) => setAchievedAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
              />
            </FormField>
          </div>
        </form>

        <div className="border-t border-border p-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-surface-highlight text-primary font-medium text-sm hover:opacity-80 transition-opacity"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
          >
            {submitting ? 'Saving...' : target ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Form Field helper ────────────────────────────────── */

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-secondary mb-1.5">
        {label}{required && <span className="text-status-error-text ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

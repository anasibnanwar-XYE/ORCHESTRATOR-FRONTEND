/**
 * SalesTargetsPage — Sales portal target management
 *
 * Features:
 *   - DataTable with name, period, target amount, achieved, progress percentage
 *   - Create form (name, period start/end, target amount, assignee)
 *   - Update target
 *   - Delete with confirmation
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  AlertCircle,
  RefreshCcw,
  Pencil,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';
import { salesApi } from '@/lib/salesApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import type { SalesTargetDto, SalesTargetRequest } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtCurrency(v?: number): string {
  if (v == null) return '—';
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy');
  } catch {
    return iso;
  }
}

function calcProgress(target?: number, achieved?: number): number {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round(((achieved ?? 0) / target) * 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ target, achieved }: { target?: number; achieved?: number }) {
  const pct = calcProgress(target, achieved);
  const color =
    pct >= 100
      ? 'bg-[var(--color-success)]'
      : pct >= 75
      ? 'bg-[var(--color-warning)]'
      : 'bg-[var(--color-neutral-500)]';

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums font-medium text-[var(--color-text-secondary)] w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────────────

interface TargetFormState {
  name: string;
  assignee: string;
  periodStart: string;
  periodEnd: string;
  targetAmount: string;
  achievedAmount: string;
  changeReason: string;
}

const emptyForm = (): TargetFormState => ({
  name: '',
  assignee: '',
  periodStart: '',
  periodEnd: '',
  targetAmount: '',
  achievedAmount: '',
  changeReason: '',
});

function toFormState(target: SalesTargetDto): TargetFormState {
  return {
    name: target.name ?? '',
    assignee: target.assignee ?? '',
    periodStart: target.periodStart ?? '',
    periodEnd: target.periodEnd ?? '',
    targetAmount: target.targetAmount != null ? String(target.targetAmount) : '',
    achievedAmount: target.achievedAmount != null ? String(target.achievedAmount) : '',
    changeReason: '',
  };
}

function validateForm(form: TargetFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.assignee.trim()) errors.assignee = 'Assignee is required';
  if (!form.periodStart) errors.periodStart = 'Period start is required';
  if (!form.periodEnd) errors.periodEnd = 'Period end is required';
  if (form.periodStart && form.periodEnd && form.periodEnd <= form.periodStart) {
    errors.periodEnd = 'Period end must be after period start';
  }
  const amt = parseFloat(form.targetAmount);
  if (isNaN(amt) || amt <= 0) errors.targetAmount = 'Enter a valid target amount';
  if (!form.changeReason.trim()) errors.changeReason = 'Reason is required';
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// SalesTargetsPage
// ─────────────────────────────────────────────────────────────────────────────

export function SalesTargetsPage() {
  const toast = useToast();
  const [targets, setTargets] = useState<SalesTargetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalesTargetDto | null>(null);
  const [form, setForm] = useState<TargetFormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<SalesTargetDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.listSalesTargets();
      setTargets(data ?? []);
    } catch {
      setError('Unable to load sales targets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(target: SalesTargetDto) {
    setEditing(target);
    setForm(toFormState(target));
    setFormErrors({});
    setModalOpen(true);
  }

  async function handleSave() {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setSaving(true);
    try {
      const req: SalesTargetRequest = {
        name: form.name.trim(),
        assignee: form.assignee.trim(),
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        targetAmount: parseFloat(form.targetAmount),
        achievedAmount: form.achievedAmount ? parseFloat(form.achievedAmount) : undefined,
        changeReason: form.changeReason.trim(),
      };
      if (editing?.id != null) {
        await salesApi.updateSalesTarget(editing.id, req);
        toast.success('Target updated');
      } else {
        await salesApi.createSalesTarget(req);
        toast.success('Target created');
      }
      setModalOpen(false);
      await load();
    } catch {
      toast.error('Failed to save target');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await salesApi.deleteSalesTarget(deleteTarget.id);
      toast.success('Target deleted');
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error('Failed to delete target');
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Sales Targets</h1>
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
            Track revenue targets and team performance.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[var(--color-neutral-900)] text-white text-[12px] font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New Target
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle size={20} className="text-[var(--color-error)]" />
            <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 px-3 h-7 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <RefreshCcw size={12} />
              Retry
            </button>
          </div>
        ) : targets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">No sales targets yet</p>
            <p className="text-[12px] text-[var(--color-text-tertiary)]">Create your first sales target to start tracking performance.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    {['Name', 'Assignee', 'Period', 'Target', 'Achieved', 'Progress', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {targets.map((t) => (
                    <tr key={t.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{t.name}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{t.assignee ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)] whitespace-nowrap">
                        {fmtDate(t.periodStart)} — {fmtDate(t.periodEnd)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(t.targetAmount)}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(t.achievedAmount)}</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <ProgressBar target={t.targetAmount} achieved={t.achievedAmount} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(t)}
                            className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
              {targets.map((t) => (
                <div key={t.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{t.name}</p>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">{t.assignee}</span>
                  </div>
                  <div className="text-[12px] text-[var(--color-text-secondary)]">
                    {fmtDate(t.periodStart)} — {fmtDate(t.periodEnd)}
                  </div>
                  <div className="flex gap-4 text-[12px] tabular-nums text-[var(--color-text-secondary)]">
                    <span>Target: {fmtCurrency(t.targetAmount)}</span>
                    <span>Achieved: {fmtCurrency(t.achievedAmount)}</span>
                  </div>
                  <ProgressBar target={t.targetAmount} achieved={t.achievedAmount} />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="flex items-center gap-1 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(t)}
                      className="flex items-center gap-1 text-[12px] text-[var(--color-error)] transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Target' : 'New Target'}
      >
        <div className="space-y-4 p-1">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            placeholder="e.g. Q1 Revenue Target"
          />
          <Input
            label="Assignee"
            value={form.assignee}
            onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
            error={formErrors.assignee}
            placeholder="e.g. sales_team"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Period Start"
              type="date"
              value={form.periodStart}
              onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
              error={formErrors.periodStart}
            />
            <Input
              label="Period End"
              type="date"
              value={form.periodEnd}
              onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
              error={formErrors.periodEnd}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Amount (₹)"
              type="number"
              min="0"
              step="1000"
              value={form.targetAmount}
              onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
              error={formErrors.targetAmount}
              placeholder="e.g. 1000000"
            />
            <Input
              label="Achieved Amount (₹)"
              type="number"
              min="0"
              step="1000"
              value={form.achievedAmount}
              onChange={(e) => setForm((f) => ({ ...f, achievedAmount: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Change Reason <span className="text-[var(--color-error)]">*</span>
            </label>
            <textarea
              value={form.changeReason}
              onChange={(e) => setForm((f) => ({ ...f, changeReason: e.target.value }))}
              placeholder="Reason for this change..."
              rows={2}
              className={clsx(
                'w-full px-3 py-2 text-[13px] rounded-lg border bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none transition-colors',
                formErrors.changeReason
                  ? 'border-[var(--color-error)]'
                  : 'border-[var(--color-border-default)] focus:border-[var(--color-neutral-900)]'
              )}
            />
            {formErrors.changeReason && (
              <p className="text-[11px] text-[var(--color-error)]">{formErrors.changeReason}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 h-8 rounded-lg text-[12px] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 h-8 rounded-lg text-[12px] font-medium bg-[var(--color-neutral-900)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Target'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Target"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}

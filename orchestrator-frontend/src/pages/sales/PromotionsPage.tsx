/**
 * PromotionsPage — Sales portal promotion management
 *
 * Features:
 *   - DataTable of promotions with active/expired distinction
 *   - Create form (name, discount type percentage/flat, discount value, start/end dates)
 *   - End-after-start date validation
 *   - Update promotion
 *   - Delete with confirmation dialog
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
import { format, isAfter, parseISO } from 'date-fns';
import { salesApi } from '@/lib/salesApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import type { PromotionDto, PromotionRequest } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy');
  } catch {
    return iso;
  }
}

function fmtDiscount(type?: string, value?: number): string {
  if (value == null) return '—';
  if (type === 'PERCENTAGE') return `${value}%`;
  return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function isExpired(endDate?: string): boolean {
  if (!endDate) return false;
  try {
    return !isAfter(parseISO(endDate), new Date());
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

function PromotionStatusBadge({ promotion }: { promotion: PromotionDto }) {
  const expired = isExpired(promotion.endDate);
  const cls = expired
    ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
    : 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
  const label = expired ? 'Expired' : 'Active';
  return (
    <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', cls)}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────────────

interface PromotionFormState {
  name: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: string;
  startDate: string;
  endDate: string;
  description: string;
}

const emptyForm = (): PromotionFormState => ({
  name: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  startDate: '',
  endDate: '',
  description: '',
});

function toFormState(promo: PromotionDto): PromotionFormState {
  return {
    name: promo.name ?? '',
    discountType: (promo.discountType === 'FLAT' ? 'FLAT' : 'PERCENTAGE') as 'PERCENTAGE' | 'FLAT',
    discountValue: promo.discountValue != null ? String(promo.discountValue) : '',
    startDate: promo.startDate ?? '',
    endDate: promo.endDate ?? '',
    description: promo.description ?? '',
  };
}

function validateForm(form: PromotionFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  const val = parseFloat(form.discountValue);
  if (isNaN(val) || val <= 0) errors.discountValue = 'Enter a valid discount value';
  if (form.discountType === 'PERCENTAGE' && val > 100) errors.discountValue = 'Percentage cannot exceed 100';
  if (!form.startDate) errors.startDate = 'Start date is required';
  if (!form.endDate) errors.endDate = 'End date is required';
  if (form.startDate && form.endDate) {
    try {
      if (!isAfter(parseISO(form.endDate), parseISO(form.startDate))) {
        errors.endDate = 'End date must be after start date';
      }
    } catch {
      errors.endDate = 'Invalid date format';
    }
  }
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// PromotionsPage
// ─────────────────────────────────────────────────────────────────────────────

export function PromotionsPage() {
  const toast = useToast();
  const [promotions, setPromotions] = useState<PromotionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromotionDto | null>(null);
  const [form, setForm] = useState<PromotionFormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<PromotionDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.listPromotions();
      setPromotions(data ?? []);
    } catch {
      setError('Unable to load promotions. Please try again.');
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

  function openEdit(promo: PromotionDto) {
    setEditing(promo);
    setForm(toFormState(promo));
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
      const req: PromotionRequest = {
        name: form.name.trim(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description.trim() || undefined,
      };
      if (editing?.id != null) {
        await salesApi.updatePromotion(editing.id, req);
        toast.success('Promotion updated');
      } else {
        await salesApi.createPromotion(req);
        toast.success('Promotion created');
      }
      setModalOpen(false);
      await load();
    } catch {
      toast.error('Failed to save promotion');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await salesApi.deletePromotion(deleteTarget.id);
      toast.success('Promotion deleted');
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error('Failed to delete promotion');
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
          <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Promotions</h1>
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
            Manage discount promotions and their active periods.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[var(--color-neutral-900)] text-white text-[12px] font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New Promotion
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
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
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">No promotions yet</p>
            <p className="text-[12px] text-[var(--color-text-tertiary)]">Create your first promotion to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    {['Name', 'Discount', 'Start Date', 'End Date', 'Status', ''].map((h) => (
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
                  {promotions.map((promo) => (
                    <tr
                      key={promo.id}
                      className={clsx(
                        'hover:bg-[var(--color-surface-secondary)] transition-colors',
                        isExpired(promo.endDate) && 'opacity-70'
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{promo.name}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">
                        {fmtDiscount(promo.discountType, promo.discountValue)}
                        <span className="ml-1 text-[10px] text-[var(--color-text-tertiary)]">
                          {promo.discountType === 'PERCENTAGE' ? 'Percentage' : 'Flat'}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtDate(promo.startDate)}</td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtDate(promo.endDate)}</td>
                      <td className="px-4 py-3">
                        <PromotionStatusBadge promotion={promo} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => openEdit(promo)}
                            className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(promo)}
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
              {promotions.map((promo) => (
                <div key={promo.id} className={clsx('p-4 space-y-2', isExpired(promo.endDate) && 'opacity-70')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{promo.name}</p>
                    <PromotionStatusBadge promotion={promo} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--color-text-secondary)]">
                    <span className="tabular-nums">{fmtDiscount(promo.discountType, promo.discountValue)}</span>
                    <span>{fmtDate(promo.startDate)} — {fmtDate(promo.endDate)}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEdit(promo)}
                      className="flex items-center gap-1 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(promo)}
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
        title={editing ? 'Edit Promotion' : 'New Promotion'}
      >
        <div className="space-y-4 p-1">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            placeholder="e.g. Summer Discount"
          />

          {/* Discount type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Discount Type
            </label>
            <div className="flex gap-2">
              {(['PERCENTAGE', 'FLAT'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, discountType: t }))}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors',
                    form.discountType === t
                      ? 'bg-[var(--color-neutral-900)] text-white border-transparent'
                      : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                  )}
                >
                  {t === 'PERCENTAGE' ? 'Percentage (%)' : 'Flat (₹)'}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={form.discountType === 'PERCENTAGE' ? 'Discount Value (%)' : 'Discount Value (₹)'}
            type="number"
            min="0"
            step={form.discountType === 'PERCENTAGE' ? '0.01' : '1'}
            value={form.discountValue}
            onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
            error={formErrors.discountValue}
            placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 500'}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              error={formErrors.startDate}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              error={formErrors.endDate}
            />
          </div>

          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional description"
          />

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
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Promotion'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Promotion"
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

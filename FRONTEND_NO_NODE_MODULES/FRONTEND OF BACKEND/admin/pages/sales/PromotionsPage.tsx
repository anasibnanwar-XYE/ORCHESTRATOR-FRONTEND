import { FormEvent, useEffect, useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { listPromotions, createPromotion, updatePromotion, deletePromotion, type PromotionDto, type PromotionRequest } from '../../lib/salesApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormTextarea } from '../../design-system/ResponsiveForm';

export default function PromotionsPage() {
  const { session } = useAuth();
  const [promotions, setPromotions] = useState<PromotionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PromotionDto | null>(null);
  const [form, setForm] = useState<PromotionRequest>({ name: '', description: '', startDate: '', endDate: '', discountPercent: 0 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listPromotions(session);
      setPromotions(list || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [session?.companyCode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updatePromotion(editing.id, { ...form, name: form.name.trim() }, session);
        setSuccess('Promotion updated successfully');
      } else {
        await createPromotion({ ...form, name: form.name.trim() }, session);
        setSuccess('Promotion created successfully');
      }
      setForm({ name: '', description: '', startDate: '', endDate: '', discountPercent: 0 });
      setEditing(null);
      setShowModal(false);
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (promotion: PromotionDto) => {
    setEditing(promotion);
    setForm({
      name: promotion.name || '',
      description: promotion.description || '',
      startDate: promotion.startDate || '',
      endDate: promotion.endDate || '',
      discountPercent: promotion.discountPercent || 0,
    });
    setShowModal(true);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await deletePromotion(id, session);
      setSuccess('Promotion deleted successfully');
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete promotion');
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-lg border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Promotions</h1>
          <p className="mt-1 text-sm text-secondary">Create and manage sales promotions</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setEditing(null);
            setForm({ name: '', description: '', startDate: '', endDate: '', discountPercent: 0 });
            setError(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          New Promotion
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-secondary">Loading promotions...</div>
        ) : promotions.length === 0 ? (
          <div className="p-8 text-center text-secondary">No promotions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-highlight text-xs uppercase text-secondary">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Start Date</th>
                  <th className="px-6 py-3 font-medium">End Date</th>
                  <th className="px-6 py-3 font-medium">Discount</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-highlight/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{p.name}</td>
                    <td className="px-6 py-4 text-primary">{p.description || '—'}</td>
                    <td className="px-6 py-4 text-primary">{p.startDate || '—'}</td>
                    <td className="px-6 py-4 text-primary">{p.endDate || '—'}</td>
                    <td className="px-6 py-4 text-primary">{typeof p.discountPercent === 'number' ? `${p.discountPercent}%` : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                           className="rounded-lg border border-border px-2 py-1.5 text-xs text-primary hover:bg-surface-highlight touch-manipulation min-h-[36px]"
                        >
                          <PencilIcon className="h-4 w-4 inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                           className="rounded-lg border border-status-error-text/30 px-2 py-1.5 text-xs text-status-error-text hover:bg-status-error-bg touch-manipulation min-h-[36px]"
                        >
                          <TrashIcon className="h-4 w-4 inline mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
          setForm({ name: '', description: '', startDate: '', endDate: '', discountPercent: 0 });
          setError(null);
        }}
        title={editing ? 'Edit Promotion' : 'New Promotion'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-border bg-surface-highlight px-4 py-2 text-sm font-medium text-primary hover:bg-surface-highlight/80 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !form.name.trim()}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {saving ? (editing ? 'Updating...' : 'Creating...') : (editing ? 'Update' : 'Create')}
            </button>
          </>
        }
      >
        <ResponsiveForm onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg border border-transparent bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
              {error}
            </div>
          )}

          <FormInput
            label="Name *"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Promotion name"
          />

          <FormTextarea
            label="Description"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput
              label="Start Date"
              type="date"
              value={form.startDate || ''}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <FormInput
              label="End Date"
              type="date"
              value={form.endDate || ''}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
            <FormInput
              label="Discount %"
              type="number"
              min="0"
              max="100"
              value={form.discountPercent || ''}
              onChange={(e) => setForm({ ...form, discountPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            />
          </div>
        </ResponsiveForm>
      </ResponsiveModal>
    </div>
  );
}


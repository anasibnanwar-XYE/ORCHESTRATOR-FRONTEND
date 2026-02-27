import { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import {
  createPackagingMapping,
  deactivatePackagingMapping,
  listPackagingMappings,
  listRawMaterials,
  updatePackagingMapping,
  type PackagingSizeMappingDto,
  type PackagingSizeMappingRequest,
  type RawMaterialDto,
} from '../../lib/factoryApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { FormInput, FormSelect, ResponsiveForm } from '../../design-system/ResponsiveForm';

const EMPTY_FORM: PackagingSizeMappingRequest = {
  packagingSize: '',
  rawMaterialId: undefined,
  unitsPerPack: undefined,
  cartonSize: undefined,
  litersPerUnit: undefined,
};

export default function PackagingMappingsPage() {
  const { session, user } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'));

  const [mappings, setMappings] = useState<PackagingSizeMappingDto[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PackagingSizeMappingDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PackagingSizeMappingRequest>(EMPTY_FORM);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [mappingsData, rawMaterialsData] = await Promise.all([
        listPackagingMappings(session),
        listRawMaterials(session),
      ]);
      setMappings(mappingsData ?? []);
      setRawMaterials(rawMaterialsData ?? []);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load packaging mappings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [session]);

  const filteredMappings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return mappings;
    return mappings.filter((mapping) => {
      const haystack = [
        mapping.packagingSize,
        mapping.rawMaterialName,
        mapping.rawMaterialSku,
        String(mapping.unitsPerPack ?? ''),
        String(mapping.cartonSize ?? ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [mappings, searchTerm]);

  const rawMaterialOptions = useMemo(
    () => [
      { value: '', label: 'Select raw material' },
      ...rawMaterials
        .slice()
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .map((rm) => ({
          value: String(rm.id),
          label: `${rm.sku ? `${rm.sku} - ` : ''}${rm.name}`,
        })),
    ],
    [rawMaterials]
  );

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
    setError(null);
  };

  const openEdit = (mapping: PackagingSizeMappingDto) => {
    setEditing(mapping);
    setFormData({
      packagingSize: mapping.packagingSize ?? '',
      rawMaterialId: mapping.rawMaterialId,
      unitsPerPack: mapping.unitsPerPack,
      cartonSize: mapping.cartonSize,
      litersPerUnit: mapping.litersPerUnit,
    });
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData(EMPTY_FORM);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!isAdmin) {
      setError('Only admins can create or update packaging mappings');
      return;
    }

    const packagingSize = formData.packagingSize?.trim();
    const rawMaterialId = Number(formData.rawMaterialId);

    if (!packagingSize || !rawMaterialId) {
      setError('Packaging size and raw material are required');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: PackagingSizeMappingRequest = {
        packagingSize,
        rawMaterialId,
        unitsPerPack: formData.unitsPerPack !== undefined ? Number(formData.unitsPerPack) : undefined,
        cartonSize: formData.cartonSize !== undefined ? Number(formData.cartonSize) : undefined,
        litersPerUnit: formData.litersPerUnit !== undefined ? Number(formData.litersPerUnit) : undefined,
      };

      if (editing?.id) {
        await updatePackagingMapping(Number(editing.id), payload, session);
        setSuccess('Packaging mapping updated');
      } else {
        await createPackagingMapping(payload, session);
        setSuccess('Packaging mapping created');
      }

      closeModal();
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save packaging mapping');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (mapping: PackagingSizeMappingDto) => {
    if (!session) return;
    if (!isAdmin) {
      setError('Only admins can deactivate packaging mappings');
      return;
    }
    if (!mapping.id) return;
    if (!confirm('Deactivate this mapping?')) return;

    setError(null);
    try {
      await deactivatePackagingMapping(Number(mapping.id), session);
      setSuccess('Packaging mapping deactivated');
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate packaging mapping');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Packaging Mappings</h1>
          <p className="mt-1 text-sm text-secondary">
            Map packaging sizes to raw material buckets for automatic packing deductions.
          </p>
          {!isAdmin && (
            <p className="mt-1 text-xs text-secondary">Read-only for factory users (admin required to edit).</p>
          )}
        </div>
        <button
          onClick={openCreate}
          disabled={!isAdmin}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <PlusIcon className="h-5 w-5" />
          New Mapping
        </button>
      </div>

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

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
        <input
          type="text"
          placeholder="Search by size, material name, or SKU..."
          className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-primary placeholder-secondary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-secondary">Loading packaging mappings...</div>
        ) : filteredMappings.length === 0 ? (
          <div className="p-8 text-center text-secondary">No packaging mappings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-highlight text-xs uppercase text-secondary">
                <tr>
                  <th className="px-6 py-3 font-medium">Packaging Size</th>
                  <th className="px-6 py-3 font-medium">Raw Material</th>
                  <th className="px-6 py-3 font-medium">Units / Pack</th>
                  <th className="px-6 py-3 font-medium">Carton Size</th>
                  <th className="px-6 py-3 font-medium">Liters / Unit</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMappings.map((mapping) => (
                  <tr key={String(mapping.id)} className="hover:bg-surface-highlight/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{mapping.packagingSize ?? '-'}</td>
                    <td className="px-6 py-4 text-primary">
                      <div className="flex flex-col">
                        <span className="font-medium">{mapping.rawMaterialName ?? '-'}</span>
                        <span className="text-xs text-secondary">{mapping.rawMaterialSku ?? ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary">{mapping.unitsPerPack ?? '-'}</td>
                    <td className="px-6 py-4 text-primary">{mapping.cartonSize ?? '-'}</td>
                    <td className="px-6 py-4 text-primary">{mapping.litersPerUnit ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={clsx(
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                          mapping.active !== false
                            ? 'bg-status-success-bg text-status-success-text'
                            : 'bg-surface-highlight text-tertiary'
                        )}
                      >
                        {mapping.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(mapping)}
                          disabled={!isAdmin}
                          className="rounded-lg border border-brand-600 px-2 py-1 text-xs text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(mapping)}
                          disabled={!isAdmin || mapping.active === false}
                          className="rounded-lg border border-status-error-text/30 px-2 py-1 text-xs text-status-error-text hover:bg-status-error-bg disabled:opacity-50"
                        >
                          Deactivate
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
        onClose={closeModal}
        title={editing ? 'Edit Packaging Mapping' : 'New Packaging Mapping'}
        size="md"
      >
        <ResponsiveForm onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Packaging Size"
            required
            value={formData.packagingSize ?? ''}
            onChange={(e) => setFormData({ ...formData, packagingSize: e.target.value })}
            placeholder="e.g. 1L, 4L, 20L"
          />

          <FormSelect
            label="Raw Material Bucket"
            required
            value={formData.rawMaterialId ? String(formData.rawMaterialId) : ''}
            onChange={(e) => setFormData({ ...formData, rawMaterialId: Number(e.target.value) || undefined })}
            options={rawMaterialOptions}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Units per Pack"
              type="number"
              min="0"
              value={formData.unitsPerPack ?? ''}
              onChange={(e) => setFormData({ ...formData, unitsPerPack: e.target.value === '' ? undefined : Number(e.target.value) })}
              placeholder="e.g. 6"
            />
            <FormInput
              label="Carton Size"
              type="number"
              min="0"
              value={formData.cartonSize ?? ''}
              onChange={(e) => setFormData({ ...formData, cartonSize: e.target.value === '' ? undefined : Number(e.target.value) })}
              placeholder="e.g. 24"
            />
          </div>

          <FormInput
            label="Liters per Unit"
            type="number"
            min="0"
            step="0.001"
            value={formData.litersPerUnit ?? ''}
            onChange={(e) => setFormData({ ...formData, litersPerUnit: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="e.g. 1.0"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-border bg-surface-highlight px-4 py-2 text-sm font-medium text-primary hover:bg-surface-highlight/80 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !isAdmin ||
                !formData.packagingSize?.trim() ||
                !Number(formData.rawMaterialId)
              }
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {submitting ? (editing ? 'Updating...' : 'Creating...') : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </ResponsiveForm>
      </ResponsiveModal>
    </div>
  );
}










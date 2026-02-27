import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Plus, Search, RefreshCw, Pencil, Trash2, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../design-system/PageHeader';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import {
  listTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from '../../lib/superadminApi';
import type { CompanyDto, CompanyRequest } from '../../lib/superadminApi';

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  variant = 'danger',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <ResponsiveModal isOpen={open} onClose={onCancel} title={title} size="sm" footer={
      <>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-highlight sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={clsx(
            'w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:w-auto',
            variant === 'danger'
              ? 'bg-status-error-bg text-status-error-text hover:opacity-80'
              : 'bg-action-primary-bg text-action-primary-text hover:bg-action-primary-hover'
          )}
        >
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </>
    }>
      <p className="text-sm text-secondary">{message}</p>
    </ResponsiveModal>
  );
}

// ─── Tenant Form ─────────────────────────────────────────────────────────────

interface TenantFormData {
  name: string;
  code: string;
  timezone: string;
  defaultGstRate: number;
}

const emptyForm: TenantFormData = {
  name: '',
  code: '',
  timezone: 'Asia/Kolkata',
  defaultGstRate: 18,
};

function TenantFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TenantFormData) => void;
  initialData: TenantFormData;
  isEdit: boolean;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<TenantFormData>(initialData);

  useEffect(() => {
    if (open) setForm(initialData);
  }, [open, initialData]);

  const handleChange = (field: keyof TenantFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = form.name.trim() && form.code.trim();

  return (
    <ResponsiveModal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Edit Tenant' : 'Register Tenant'}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-highlight sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(form)}
            disabled={!canSubmit || loading}
            className="w-full rounded-lg bg-action-primary-bg px-4 py-2.5 text-sm font-medium text-action-primary-text transition-colors hover:bg-action-primary-hover disabled:opacity-50 sm:w-auto"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Tenant' : 'Register Tenant'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-status-error-bg px-3 py-2">
            <p className="text-sm text-status-error-text">{error}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Company Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-secondary mb-1.5">
              Company Name <span className="text-status-error-text">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Acme Industries Pvt. Ltd."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
            />
          </div>

          {/* Company Code */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-secondary mb-1.5">
              Company Code <span className="text-status-error-text">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="e.g. ACME"
              disabled={isEdit}
              className={clsx(
                'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]',
                isEdit && 'opacity-60 cursor-not-allowed'
              )}
            />
            {isEdit && <p className="mt-1 text-xs text-tertiary">Company code cannot be changed.</p>}
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-secondary mb-1.5">
              Timezone
            </label>
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              placeholder="Asia/Kolkata"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
            />
          </div>

          {/* Default GST Rate */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-secondary mb-1.5">
              Default GST Rate (%)
            </label>
            <input
              type="number"
              value={form.defaultGstRate}
              onChange={(e) => handleChange('defaultGstRate', parseFloat(e.target.value) || 0)}
              placeholder="18"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
            />
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const { session } = useAuth();
  const [tenants, setTenants] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [formEdit, setFormEdit] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formInitial, setFormInitial] = useState<TenantFormData>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  // Confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<CompanyDto | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Success banner
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async (showSync = false) => {
    if (showSync) setSyncing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await listTenants(session);
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tenants;
    const q = search.toLowerCase();
    return tenants.filter((t: CompanyDto) =>
      (t.name ?? '').toLowerCase().includes(q) ||
      (t.code ?? '').toLowerCase().includes(q) ||
      String(t.id ?? '').includes(q)
    );
  }, [tenants, search]);

  // Handlers
  const handleOpenCreate = () => {
    setFormInitial(emptyForm);
    setFormEdit(false);
    setEditId(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (tenant: any) => {
    setFormInitial({
      name: tenant.name ?? '',
      code: tenant.code ?? '',
      timezone: tenant.timezone ?? 'UTC',
      defaultGstRate: tenant.defaultGstRate ?? 18,
    });
    setFormEdit(true);
    setEditId(tenant.id);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (data: TenantFormData) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const payload: CompanyRequest = {
        name: data.name,
        code: data.code,
        timezone: data.timezone || 'UTC',
        defaultGstRate: data.defaultGstRate,
      };
      if (formEdit && editId != null) {
        await updateTenant(editId, payload, session);
        setSuccess(`Tenant "${data.name}" updated.`);
      } else {
        await createTenant(payload, session);
        setSuccess(`Tenant "${data.name}" registered.`);
      }
      setFormOpen(false);
      await refresh(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Operation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRequestDelete = (tenant: CompanyDto) => {
    setConfirmTarget(tenant);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget || !confirmTarget.id) return;
    setConfirmLoading(true);
    try {
      await deleteTenant(confirmTarget.id, session);
      setSuccess(`Tenant deleted.`);
      setConfirmOpen(false);
      setConfirmTarget(null);
      await refresh(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
      setConfirmOpen(false);
    } finally {
      setConfirmLoading(false);
    }
  };

  // Auto-dismiss success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control Plane"
        title="Tenants"
        subtitle={`${tenants.length} registered ${tenants.length === 1 ? 'tenant' : 'tenants'}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refresh(true)}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-highlight disabled:opacity-50"
            >
              <RefreshCw className={clsx('h-4 w-4', syncing && 'animate-spin')} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-action-primary-bg px-3 py-2 text-sm font-medium text-action-primary-text transition-colors hover:bg-action-primary-hover"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Register Tenant</span>
            </button>
          </div>
        }
      />

      {/* Banners */}
      {success && (
        <div className="rounded-lg bg-status-success-bg px-4 py-3">
          <p className="text-sm text-status-success-text">{success}</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-status-error-bg px-4 py-3">
          <p className="text-sm text-status-error-text">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenants..."
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-surface-highlight" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-surface-highlight" />
                  <div className="h-3 w-24 rounded bg-surface-highlight" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface py-16 px-6 text-center">
          <Building2 className="h-10 w-10 text-tertiary mb-4" />
          <p className="text-sm font-medium text-primary">
            {search ? 'No tenants match your search' : 'No tenants registered'}
          </p>
          <p className="mt-1 text-xs text-secondary">
            {search ? 'Try adjusting your search terms.' : 'Register your first tenant to get started.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-action-primary-bg px-4 py-2 text-sm font-medium text-action-primary-text transition-colors hover:bg-action-primary-hover"
            >
              <Plus className="h-4 w-4" />
              Register Tenant
            </button>
          )}
        </div>
      )}

      {/* Desktop table */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="hidden lg:block overflow-hidden rounded-lg border border-border bg-surface">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-surface-highlight">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Timezone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">GST Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t: CompanyDto) => (
                  <tr key={t.id ?? t.code} className="hover:bg-surface-highlight/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-highlight text-xs font-semibold text-secondary">
                          {(t.name ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{t.name ?? '—'}</p>
                          <p className="text-xs text-tertiary">ID: {t.id ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-surface-highlight px-2.5 py-1 text-xs font-medium text-primary">
                        {t.code ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">{t.timezone ?? '—'}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-secondary truncate">{t.defaultGstRate ? `${t.defaultGstRate}%` : '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="rounded-lg p-2 text-secondary transition-colors hover:bg-surface-highlight hover:text-primary"
                          title="Edit tenant"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(t)}
                          className="rounded-lg p-2 text-secondary transition-colors hover:bg-status-error-bg hover:text-status-error-text"
                          title="Delete tenant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((t: CompanyDto) => (
              <div key={t.id ?? t.code} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-highlight text-xs font-semibold text-secondary">
                      {(t.name ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{t.name ?? '—'}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-surface-highlight px-2 py-0.5 text-xs font-medium text-primary">
                          {t.code ?? '—'}
                        </span>
                        <span className="text-xs text-tertiary">ID: {t.id ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="rounded-lg p-2 text-secondary transition-colors hover:bg-surface-highlight hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(t)}
                      className="rounded-lg p-2 text-secondary transition-colors hover:bg-status-error-bg hover:text-status-error-text"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 border-t border-border pt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-tertiary">Timezone</p>
                    <p className="text-xs text-secondary">{t.timezone ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">GST Rate</p>
                    <p className="text-xs text-secondary">{t.defaultGstRate ? `${t.defaultGstRate}%` : '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tenant Form Modal */}
      <TenantFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={formInitial}
        isEdit={formEdit}
        loading={formLoading}
        error={formError}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Tenant"
        message={`Are you sure you want to delete "${confirmTarget?.name ?? 'this tenant'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={confirmLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
      />
    </div>
  );
}

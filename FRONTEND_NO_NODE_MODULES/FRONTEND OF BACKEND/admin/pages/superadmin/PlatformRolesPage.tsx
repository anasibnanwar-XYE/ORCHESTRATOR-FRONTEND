import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Plus, Search, RefreshCw, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../design-system/PageHeader';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { listPlatformRoles, createPlatformRole, getPlatformRoleByKey } from '../../lib/superadminApi';
import type { RoleDto, CreateRoleRequest } from '../../lib/superadminApi';

// ─── Role Detail Panel ───────────────────────────────────────────────────────

function RoleDetailModal({
  open,
  onClose,
  role,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  role: any | null;
  loading: boolean;
}) {
  return (
    <ResponsiveModal isOpen={open} onClose={onClose} title="Role Details" size="md" footer={
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-highlight sm:w-auto"
      >
        Close
      </button>
    }>
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-32 rounded bg-surface-highlight" />
          <div className="h-4 w-48 rounded bg-surface-highlight" />
          <div className="h-4 w-40 rounded bg-surface-highlight" />
        </div>
      ) : role ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-secondary mb-1">Role Key</p>
            <span className="inline-flex items-center rounded-full bg-surface-highlight px-3 py-1 text-sm font-medium text-primary">
              {role.roleKey ?? role.key ?? '—'}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-secondary mb-1">Display Name</p>
            <p className="text-sm text-primary">{role.name ?? role.displayName ?? '—'}</p>
          </div>
          {role.description && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-secondary mb-1">Description</p>
              <p className="text-sm text-secondary">{role.description}</p>
            </div>
          )}
          {role.permissions && Array.isArray(role.permissions) && role.permissions.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-secondary mb-2">
                Permissions ({role.permissions.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p: any) => (
                  <span
                    key={typeof p === 'string' ? p : p.name ?? p.key}
                    className="inline-flex items-center rounded bg-surface-highlight px-2 py-0.5 text-xs text-secondary"
                  >
                    {typeof p === 'string' ? p : p.name ?? p.key ?? '—'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-secondary">No role data.</p>
      )}
    </ResponsiveModal>
  );
}

// ─── Create Role Modal ───────────────────────────────────────────────────────

function CreateRoleModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { roleKey: string; name: string; description: string }) => void;
  loading: boolean;
  error: string | null;
}) {
  const [roleKey, setRoleKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setRoleKey('');
      setName('');
      setDescription('');
    }
  }, [open]);

  const canSubmit = roleKey.trim() && name.trim();

  return (
    <ResponsiveModal isOpen={open} onClose={onClose} title="Create Platform Role" size="md" footer={
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
          onClick={() => onSubmit({ roleKey, name, description })}
          disabled={!canSubmit || loading}
          className="w-full rounded-lg bg-action-primary-bg px-4 py-2.5 text-sm font-medium text-action-primary-text transition-colors hover:bg-action-primary-hover disabled:opacity-50 sm:w-auto"
        >
          {loading ? 'Creating...' : 'Create Role'}
        </button>
      </>
    }>
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-status-error-bg px-3 py-2">
            <p className="text-sm text-status-error-text">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-secondary mb-1.5">
            Role Key <span className="text-status-error-text">*</span>
          </label>
          <input
            type="text"
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
            placeholder="e.g. ROLE_PLATFORM_VIEWER"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
          />
          <p className="mt-1 text-xs text-tertiary">Uppercase letters, numbers, and underscores only.</p>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-secondary mb-1.5">
            Display Name <span className="text-status-error-text">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Platform Viewer"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-secondary mb-1.5">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this role is used for..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] resize-none"
          />
        </div>
      </div>
    </ResponsiveModal>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PlatformRolesPage() {
  const { session } = useAuth();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRole, setDetailRole] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Success
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async (showSync = false) => {
    if (showSync) setSyncing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await listPlatformRoles(session);
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter((r: any) =>
      (r.roleKey ?? r.key ?? '').toLowerCase().includes(q) ||
      (r.name ?? r.displayName ?? '').toLowerCase().includes(q)
    );
  }, [roles, search]);

  const handleViewDetail = async (role: any) => {
    setDetailLoading(true);
    setDetailRole(role);
    setDetailOpen(true);
    try {
      const key = role.roleKey ?? role.key;
      if (key) {
        const detail = await getPlatformRoleByKey(key, session);
        setDetailRole(detail);
      }
    } catch {
      // keep the basic role info we already have
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async (data: { roleKey: string; name: string; description: string }) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const payload: CreateRoleRequest = {
        roleKey: data.roleKey,
        name: data.name,
        description: data.description || undefined,
      } as any;
      await createPlatformRole(payload, session);
      setSuccess(`Role "${data.name}" created.`);
      setCreateOpen(false);
      await refresh(true);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create role.');
    } finally {
      setCreateLoading(false);
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
        title="Platform Roles"
        subtitle={`${roles.length} defined ${roles.length === 1 ? 'role' : 'roles'}`}
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
              onClick={() => { setCreateError(null); setCreateOpen(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-action-primary-bg px-3 py-2 text-sm font-medium text-action-primary-text transition-colors hover:bg-action-primary-hover"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Role</span>
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
          placeholder="Search roles..."
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5 animate-pulse">
              <div className="h-4 w-40 rounded bg-surface-highlight mb-2" />
              <div className="h-3 w-24 rounded bg-surface-highlight" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface py-16 px-6 text-center">
          <ShieldCheck className="h-10 w-10 text-tertiary mb-4" />
          <p className="text-sm font-medium text-primary">
            {search ? 'No roles match your search' : 'No roles defined'}
          </p>
          <p className="mt-1 text-xs text-secondary">
            {search ? 'Try adjusting your search terms.' : 'Create your first platform role.'}
          </p>
        </div>
      )}

      {/* Role List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((r: any) => {
            const key = r.roleKey ?? r.key ?? r.name ?? '—';
            const displayName = r.name ?? r.displayName ?? key;
            const isExpanded = expandedRole === key;
            const permissions = r.permissions ?? [];

            return (
              <div
                key={key}
                className="rounded-lg border border-border bg-surface transition-colors hover:bg-surface-highlight/30"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-highlight">
                      <ShieldCheck className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary">{displayName}</p>
                      <span className="inline-flex items-center rounded bg-surface-highlight px-2 py-0.5 text-xs text-secondary mt-0.5">
                        {key}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleViewDetail(r)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-surface-highlight hover:text-primary"
                    >
                      Details
                    </button>
                    {permissions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedRole(isExpanded ? null : key)}
                        className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-surface-highlight"
                        title={isExpanded ? 'Collapse' : 'Expand permissions'}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded permissions */}
                {isExpanded && permissions.length > 0 && (
                  <div className="border-t border-border px-5 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-secondary mb-2">
                      Permissions ({permissions.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {permissions.map((p: any) => (
                        <span
                          key={typeof p === 'string' ? p : p.name ?? p.key}
                          className="inline-flex items-center rounded bg-surface-highlight px-2 py-0.5 text-xs text-secondary"
                        >
                          {typeof p === 'string' ? p : p.name ?? p.key ?? '—'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <RoleDetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRole(null); }}
        role={detailRole}
        loading={detailLoading}
      />

      {/* Create Modal */}
      <CreateRoleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        loading={createLoading}
        error={createError}
      />
    </div>
  );
}

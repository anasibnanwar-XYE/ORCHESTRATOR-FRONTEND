import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Shield,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  listRoles,
  createRole,
  getRoleByKey,
  type RoleDto,
  type CreateRoleRequest,
} from '../../lib/adminApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine a display variant for a role name (ROLE_ADMIN → error, etc.) */
function roleVariant(name?: string): 'error' | 'warning' | 'info' | 'neutral' {
  const lower = (name ?? '').toLowerCase();
  if (lower.includes('admin') || lower.includes('superadmin')) return 'error';
  if (lower.includes('manager') || lower.includes('supervisor')) return 'warning';
  if (lower.includes('user') || lower.includes('viewer')) return 'info';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RolesPage() {
  const { session } = useAuth();
  const { addToast } = useToast();

  // ---- Data state ----
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Expanded permissions per row ----
  const [expandedPermissions, setExpandedPermissions] = useState<Record<number, boolean>>({});

  // ---- Create modal ----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRoleRequest>({ name: '', description: '', permissions: [] });
  const [permissionInput, setPermissionInput] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ---- Edit / detail modal ----
  const [editRole, setEditRole] = useState<RoleDto | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ---- Delete confirm ----
  const [deleteTarget, setDeleteTarget] = useState<RoleDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listRoles(session);
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load roles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // ---------------------------------------------------------------------------
  // Create role
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setCreateForm({ name: '', description: '', permissions: [] });
    setPermissionInput('');
    setCreateError(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setShowCreateModal(false);
    setCreateForm({ name: '', description: '', permissions: [] });
    setPermissionInput('');
    setCreateError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    try {
      setSubmitting(true);
      setCreateError(null);
      await createRole(createForm, session);
      addToast({ variant: 'success', title: `Role "${createForm.name}" created.` });
      closeCreateModal();
      loadRoles();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create role';
      setCreateError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const addPermission = () => {
    const trimmed = permissionInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!createForm.permissions.includes(trimmed)) {
      setCreateForm((prev) => ({ ...prev, permissions: [...prev.permissions, trimmed] }));
    }
    setPermissionInput('');
  };

  const removePermission = (code: string) => {
    setCreateForm((prev) => ({
      ...prev,
      permissions: prev.permissions.filter((p) => p !== code),
    }));
  };

  const handlePermissionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPermission();
    }
  };

  // ---------------------------------------------------------------------------
  // View / edit detail
  // ---------------------------------------------------------------------------

  const openEditModal = async (role: RoleDto) => {
    setEditError(null);
    // Start with the list data; attempt to load full detail by key
    setEditRole(role);
    if (role.name) {
      setEditLoading(true);
      try {
        const detail = await getRoleByKey(role.name, session);
        setEditRole(detail ?? role);
      } catch {
        // fall back to list data silently
      } finally {
        setEditLoading(false);
      }
    }
  };

  const closeEditModal = () => {
    setEditRole(null);
    setEditError(null);
  };

  // ---------------------------------------------------------------------------
  // Delete role
  // ---------------------------------------------------------------------------

  const initiateDelete = (role: RoleDto) => {
    setDeleteTarget(role);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      // No deleteRole endpoint exists in the generated client — inform user gracefully.
      // If/when available: await deleteRole(deleteTarget.id!, session);
      addToast({
        variant: 'error',
        title: 'Delete not available',
        description: 'Role deletion is not supported by the current API version.',
      });
      setDeleteTarget(null);
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Permissions toggle
  // ---------------------------------------------------------------------------

  const togglePermissions = (roleId: number) => {
    setExpandedPermissions((prev) => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  // ---------------------------------------------------------------------------
  // Create modal footer
  // ---------------------------------------------------------------------------

  const createModalFooter = (
    <>
      <Button variant="secondary" onClick={closeCreateModal} disabled={submitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="create-role-form"
        disabled={submitting || !createForm.name.trim()}
      >
        {submitting ? 'Creating…' : 'Create Role'}
      </Button>
    </>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-tertiary">Administration</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-primary font-display sm:text-2xl">
            Role Management
          </h1>
          <p className="mt-1 text-sm text-secondary">Manage user roles and permission assignments.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={loadRoles}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-highlight disabled:opacity-50"
            aria-label="Refresh roles"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Role
          </Button>
        </div>
      </header>

      {/* Error banner */}
      {error && !loading && (
        <div className="flex items-start gap-3 rounded-lg bg-status-error-bg border border-transparent px-4 py-3 text-sm text-status-error-text">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Roles table */}
      <Card>
        <CardHeader className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-secondary" />
            <CardTitle className="text-base">Active Roles</CardTitle>
          </div>
          <p className="text-xs text-secondary">
            {loading ? 'Loading…' : `${roles.length} role${roles.length !== 1 ? 's' : ''} configured`}
          </p>
        </CardHeader>
        <div className="rounded-b-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface/50 hover:bg-surface/50">
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4].map((j) => (
                      <TableCell key={j}>
                        <div className="h-4 rounded bg-surface-highlight animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={Shield}
                      title="No roles configured"
                      description="Create your first role to start managing access."
                      action={{ label: 'Create Role', onClick: openCreateModal }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => {
                  const perms = role.permissions ?? [];
                  const isExpanded = role.id ? expandedPermissions[role.id] : false;
                  const visiblePerms = isExpanded ? perms : perms.slice(0, 3);
                  const remainder = perms.length - 3;

                  return (
                    <TableRow key={role.id}>
                      {/* Role Name */}
                      <TableCell label="Role">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary">{role.name ?? 'Unnamed'}</span>
                          <StatusBadge
                            status={role.name ?? 'unknown'}
                            variant={roleVariant(role.name)}
                            label={role.name?.replace(/^ROLE_/, '') ?? 'Role'}
                          />
                        </div>
                      </TableCell>

                      {/* Description */}
                      <TableCell label="Description" className="text-secondary max-w-xs">
                        {role.description || (
                          <span className="text-tertiary italic text-xs">No description</span>
                        )}
                      </TableCell>

                      {/* Permissions */}
                      <TableCell label="Permissions">
                        {perms.length === 0 ? (
                          <span className="text-tertiary text-xs italic">None assigned</span>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1">
                              {visiblePerms.map((p) => (
                                <Badge key={p.id} variant="info">
                                  {p.code}
                                </Badge>
                              ))}
                              {!isExpanded && remainder > 0 && (
                                <Badge variant="secondary">+{remainder} more</Badge>
                              )}
                            </div>
                            {perms.length > 3 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePermissions(role.id!);
                                }}
                                className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-primary transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    Show less <ChevronUp className="h-3 w-3" />
                                  </>
                                ) : (
                                  <>
                                    Show all <ChevronDown className="h-3 w-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell label="Actions">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(role)}
                            className="rounded-md p-1.5 text-secondary hover:text-primary hover:bg-surface-highlight transition-colors"
                            aria-label={`View details for ${role.name}`}
                            title="View details"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => initiateDelete(role)}
                            className="rounded-md p-1.5 text-secondary hover:text-status-error-text hover:bg-status-error-bg transition-colors"
                            aria-label={`Delete ${role.name}`}
                            title="Delete role"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Create Role Modal ── */}
      <ResponsiveModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Create New Role"
        size="md"
        footer={createModalFooter}
      >
        <form id="create-role-form" onSubmit={handleCreateSubmit} className="space-y-4">
          <p className="text-sm text-secondary">
            Define a new role with optional permissions. Permission codes are automatically upper-cased.
          </p>

          <Input
            label="Role Name"
            required
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="e.g. ROLE_MANAGER"
          />

          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-primary placeholder:text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-bg focus-visible:ring-offset-2 ring-offset-background transition-colors"
              rows={3}
              placeholder="Describe this role's responsibilities…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Permissions</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={permissionInput}
                onChange={(e) => setPermissionInput(e.target.value)}
                onKeyDown={handlePermissionKeyDown}
                className="flex-1 h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-primary placeholder:text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-bg focus-visible:ring-offset-2 ring-offset-background transition-colors"
                placeholder="e.g. USERS_READ"
              />
              <Button type="button" variant="outline" size="sm" onClick={addPermission} className="h-10 px-3">
                Add
              </Button>
            </div>
            <p className="mt-1 text-xs text-tertiary">Press Enter or click Add.</p>
            {createForm.permissions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {createForm.permissions.map((code) => (
                  <Badge
                    key={code}
                    variant="info"
                    className="cursor-pointer"
                    onClick={() => removePermission(code)}
                  >
                    {code}
                    <span className="ml-1 text-xs opacity-60">&times;</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {createError && (
            <div className="rounded-lg bg-status-error-bg border border-transparent px-3 py-2 text-sm text-status-error-text">
              {createError}
            </div>
          )}
        </form>
      </ResponsiveModal>

      {/* ── Role Detail / Edit Modal ── */}
      <ResponsiveModal
        isOpen={editRole !== null}
        onClose={closeEditModal}
        title={editRole?.name ?? 'Role Details'}
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeEditModal}>
            Close
          </Button>
        }
      >
        {editLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 rounded bg-surface-highlight animate-pulse" />
            ))}
          </div>
        ) : editRole ? (
          <div className="space-y-5">
            {/* Name + type badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-highlight">
                <ShieldCheck className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-base font-semibold text-primary font-display">{editRole.name}</p>
                <StatusBadge
                  status={editRole.name ?? 'unknown'}
                  variant={roleVariant(editRole.name)}
                  label={editRole.name?.replace(/^ROLE_/, '') ?? 'Role'}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-1.5">Description</p>
              <p className="text-sm text-secondary">
                {editRole.description || <span className="italic text-tertiary">No description provided.</span>}
              </p>
            </div>

            {/* Permissions */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-2">
                Permissions ({editRole.permissions?.length ?? 0})
              </p>
              {(editRole.permissions?.length ?? 0) === 0 ? (
                <p className="text-sm italic text-tertiary">No permissions assigned to this role.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {editRole.permissions?.map((p) => (
                    <Badge key={p.id} variant="info">
                      {p.code}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {editError && (
              <div className="rounded-lg bg-status-error-bg border border-transparent px-3 py-2 text-sm text-status-error-text">
                {editError}
              </div>
            )}

            {/* Info note */}
            <div className="rounded-lg border border-border bg-surface p-3 text-xs text-secondary">
              <p>
                Role permissions can be modified through the API or system administration console.
                Contact your system administrator to update role assignments.
              </p>
            </div>
          </div>
        ) : null}
      </ResponsiveModal>

      {/* ── Delete Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Role"
        description={`Are you sure you want to delete the "${deleteTarget?.name}" role? Users with this role will lose associated permissions.`}
        confirmLabel="Delete Role"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

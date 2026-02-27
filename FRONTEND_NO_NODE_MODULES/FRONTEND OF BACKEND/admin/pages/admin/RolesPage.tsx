import { useState, useEffect } from 'react';
import { PlusIcon, ChevronDownIcon, ChevronUpIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { listRoles, createRole, type RoleDto, type CreateRoleRequest } from '../../lib/adminApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';

export default function RolesPage() {
    const { session } = useAuth();
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<CreateRoleRequest>({ name: '', description: '', permissions: [] });
    const [permissionInput, setPermissionInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);

    useEffect(() => {
        loadRoles();
    }, [session]);

    const loadRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await listRoles(session);
            setRoles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load roles', err);
            setError('Failed to load roles. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const [expandedPermissions, setExpandedPermissions] = useState<Record<number, boolean>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        try {
            setSubmitting(true);
            setError(null);
            await createRole(formData, session);
            setBanner(`Role "${formData.name}" created successfully.`);
            closeModal();
            loadRoles();
        } catch (err: any) {
            const msg = err?.body?.message || err?.message || 'Failed to create role';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({ name: '', description: '', permissions: [] });
        setPermissionInput('');
        setError(null);
    };

    const togglePermissions = (roleId: number) => {
        setExpandedPermissions(prev => ({ ...prev, [roleId]: !prev[roleId] }));
    };

    const addPermission = () => {
        const trimmed = permissionInput.trim().toUpperCase();
        if (!trimmed) return;
        if (formData.permissions.includes(trimmed)) {
            setPermissionInput('');
            return;
        }
        setFormData(prev => ({ ...prev, permissions: [...prev.permissions, trimmed] }));
        setPermissionInput('');
    };

    const removePermission = (code: string) => {
        setFormData(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== code) }));
    };

    const handlePermissionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPermission();
        }
    };

    // Dismiss banner after 5 seconds
    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), 5000);
        return () => clearTimeout(t);
    }, [banner]);

    const modalFooter = (
        <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
                Cancel
            </Button>
            <Button type="submit" form="create-role-form" disabled={submitting || !formData.name.trim()}>
                {submitting ? 'Creating...' : 'Create Role'}
            </Button>
        </>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary truncate">Role Management</h1>
                    <p className="mt-1 text-sm text-secondary">Manage user roles and permissions</p>
                </div>
                <div className="flex-shrink-0">
                    <Button onClick={() => { setError(null); setShowModal(true); }}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Role
                    </Button>
                </div>
            </header>

            {/* Success banner */}
            {banner && (
                <div className="rounded-xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
                    {banner}
                </div>
            )}

            {/* Error banner (page-level) */}
            {error && !showModal && (
                <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
                    {error}
                </div>
            )}

            {/* Roles table */}
            <Card>
                <CardHeader className="border-b border-border p-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="h-5 w-5 text-secondary" />
                        <CardTitle className="text-base">Active Roles</CardTitle>
                    </div>
                    <p className="text-xs text-secondary">{loading ? 'Loading...' : `${roles.length} role${roles.length !== 1 ? 's' : ''} configured`}</p>
                </CardHeader>
                <div className="rounded-b-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-surface/50 hover:bg-surface/50">
                                <TableHead>Role Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Permissions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-secondary">Loading roles...</TableCell>
                                </TableRow>
                            ) : roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        <div className="flex flex-col items-center gap-2">
                                            <ShieldCheckIcon className="h-8 w-8 text-tertiary" />
                                            <span className="text-secondary">No roles configured yet</span>
                                            <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
                                                Create your first role
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => {
                                    const perms = role.permissions || [];
                                    const isExpanded = role.id ? expandedPermissions[role.id] : false;
                                    const visiblePerms = isExpanded ? perms : perms.slice(0, 3);
                                    const remainder = perms.length - 3;

                                    return (
                                        <TableRow key={role.id}>
                                            <TableCell label="Role" className="font-medium text-primary">{role.name ?? 'Unnamed'}</TableCell>
                                            <TableCell label="Description" className="text-secondary">{role.description || <span className="text-tertiary italic">No description</span>}</TableCell>
                                            <TableCell label="Permissions">
                                                <div className="space-y-2">
                                                    {perms.length === 0 ? (
                                                        <span className="text-tertiary text-xs italic">No permissions assigned</span>
                                                    ) : (
                                                        <>
                                                            <div className="flex flex-wrap gap-1">
                                                                {visiblePerms.map((p) => (
                                                                    <Badge key={p.id} variant="info">
                                                                        {p.code}
                                                                    </Badge>
                                                                ))}
                                                                {!isExpanded && remainder > 0 && (
                                                                    <Badge variant="secondary">
                                                                        +{remainder} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {perms.length > 3 && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); togglePermissions(role.id!); }}
                                                                    className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-primary transition-colors"
                                                                >
                                                                    {isExpanded ? (
                                                                        <>Show Less <ChevronUpIcon className="h-3 w-3" /></>
                                                                    ) : (
                                                                        <>Show All <ChevronDownIcon className="h-3 w-3" /></>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
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

            {/* Create Role Modal */}
            <ResponsiveModal
                isOpen={showModal}
                onClose={closeModal}
                title="Create New Role"
                size="md"
                footer={modalFooter}
            >
                <form id="create-role-form" onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-secondary">Define a new role with optional permissions. Permissions can be added after creation.</p>

                    <Input
                        label="Role Name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. ROLE_MANAGER"
                    />

                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-primary placeholder:text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-bg focus-visible:ring-offset-2 ring-offset-background transition-colors"
                            rows={3}
                            placeholder="Describe the role's responsibilities..."
                        />
                    </div>

                    {/* Permissions input */}
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
                        <p className="mt-1 text-xs text-tertiary">Press Enter or click Add. Permission codes are auto-uppercased.</p>
                        {formData.permissions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {formData.permissions.map((code) => (
                                    <Badge key={code} variant="info" className="cursor-pointer" onClick={() => removePermission(code)}>
                                        {code}
                                        <span className="ml-1 text-xs opacity-60">&times;</span>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Modal-scoped error */}
                    {error && showModal && (
                        <div className="rounded-lg border border-transparent bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
                            {error}
                        </div>
                    )}
                </form>
            </ResponsiveModal>
        </div>
    );
}

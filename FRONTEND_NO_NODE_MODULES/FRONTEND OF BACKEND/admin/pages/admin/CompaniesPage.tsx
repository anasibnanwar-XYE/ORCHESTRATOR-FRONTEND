import { useState, useEffect } from 'react';
import {
    PencilSquareIcon,
    BuildingOfficeIcon,
    PlusIcon,
    TrashIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
    listCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    type CompanyDto,
    type CompanyRequest,
} from '../../lib/adminApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

// ─── Timezone options ────────────────────────────────────────────
const TIMEZONE_OPTIONS = [
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Nairobi',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Europe/London',
    'Europe/Berlin',
    'Pacific/Auckland',
    'UTC',
];

// ─── Helpers ─────────────────────────────────────────────────────
const emptyForm: CompanyRequest = { name: '', code: '', timezone: 'UTC', defaultGstRate: 15 };

export default function CompaniesPage() {
    const { session } = useAuth();
    const [companies, setCompanies] = useState<CompanyDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [banner, setBanner] = useState<string | null>(null);

    // Modal state
    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState<CompanyDto | null>(null);
    const [formData, setFormData] = useState<CompanyRequest>({ ...emptyForm });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete confirmation
    const [confirmDelete, setConfirmDelete] = useState<CompanyDto | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Load companies ───────────────────────────────────────────
    useEffect(() => {
        loadCompanies();
    }, [session]);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await listCompanies(session);
            setCompanies(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load companies', err);
            setError('Failed to load companies. You may only see companies you are assigned to.');
        } finally {
            setLoading(false);
        }
    };

    // ── Banner auto-dismiss ──────────────────────────────────────
    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), 5000);
        return () => clearTimeout(t);
    }, [banner]);

    // ── Open create / edit ───────────────────────────────────────
    const openCreate = () => {
        setEditingCompany(null);
        setFormData({ ...emptyForm });
        setFormError(null);
        setShowForm(true);
    };

    const openEdit = (company: CompanyDto) => {
        setEditingCompany(company);
        setFormData({
            name: company.name ?? '',
            code: company.code ?? '',
            timezone: company.timezone ?? 'UTC',
            defaultGstRate: company.defaultGstRate ?? 15,
        });
        setFormError(null);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingCompany(null);
        setFormData({ ...emptyForm });
        setFormError(null);
    };

    // ── Submit create / update ───────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.code.trim()) return;
        try {
            setSubmitting(true);
            setFormError(null);
            if (editingCompany?.id) {
                await updateCompany(editingCompany.id, formData, session);
                setBanner(`Company "${formData.name}" updated successfully.`);
            } else {
                await createCompany(formData, session);
                setBanner(`Company "${formData.name}" created successfully.`);
            }
            closeForm();
            loadCompanies();
        } catch (err: any) {
            const msg = err?.body?.message || err?.message || 'Operation failed. Please try again.';
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete ───────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!confirmDelete?.id) return;
        try {
            setDeleting(true);
            await deleteCompany(confirmDelete.id, session);
            setBanner(`Company "${confirmDelete.name}" deleted.`);
            setConfirmDelete(null);
            loadCompanies();
        } catch (err: any) {
            const msg = err?.body?.message || err?.message || 'Failed to delete company.';
            setError(msg);
            setConfirmDelete(null);
        } finally {
            setDeleting(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────
    const isEditing = !!editingCompany;

    const formFooter = (
        <>
            <Button variant="secondary" onClick={closeForm} disabled={submitting}>
                Cancel
            </Button>
            <Button type="submit" form="company-form" disabled={submitting || !formData.name.trim() || !formData.code.trim()}>
                {submitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Company')}
            </Button>
        </>
    );

    const deleteFooter = (
        <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Company'}
            </Button>
        </>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary truncate">Company Management</h1>
                    <p className="mt-1 text-sm text-secondary">Manage companies and their configurations</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={loadCompanies} disabled={loading}>
                        <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={openCreate}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Company
                    </Button>
                </div>
            </header>

            {/* Success banner */}
            {banner && (
                <div className="rounded-xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
                    {banner}
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-3 font-bold text-status-error-text hover:opacity-70">&times;</button>
                </div>
            )}

            {/* Company grid */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    // Skeleton cards
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-border bg-surface p-6 animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="h-12 w-12 rounded-xl bg-surface-highlight" />
                                <div className="h-6 w-16 rounded-full bg-surface-highlight" />
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="h-5 w-2/3 rounded bg-surface-highlight" />
                                <div className="h-4 w-1/3 rounded bg-surface-highlight" />
                            </div>
                            <div className="mt-4 flex gap-4">
                                <div className="h-10 w-20 rounded bg-surface-highlight" />
                                <div className="h-10 w-20 rounded bg-surface-highlight" />
                            </div>
                        </div>
                    ))
                ) : companies.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 text-center">
                        <BuildingOfficeIcon className="h-12 w-12 text-tertiary" />
                        <p className="mt-4 text-sm font-medium text-primary">No companies found</p>
                        <p className="mt-1 text-xs text-secondary">
                            No companies are configured yet, or you don't have access to view them.
                        </p>
                        <Button size="sm" variant="outline" className="mt-4" onClick={openCreate}>
                            Create your first company
                        </Button>
                    </div>
                ) : (
                    companies.map((company) => (
                        <div
                            key={company.id}
                            className="group relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md"
                        >
                            {/* Top row: icon + code badge */}
                            <div className="flex items-start justify-between">
                                <div className="rounded-xl bg-surface-highlight p-3 text-secondary">
                                    <BuildingOfficeIcon className="h-6 w-6" />
                                </div>
                                <Badge variant="outline">{company.code ?? 'N/A'}</Badge>
                            </div>

                            {/* Name + ID */}
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold text-primary truncate" title={company.name ?? ''}>
                                    {company.name ?? 'Unnamed Company'}
                                </h3>
                                {company.publicId && (
                                    <p className="mt-0.5 text-xs text-tertiary font-mono truncate">{company.publicId}</p>
                                )}
                            </div>

                            {/* Metadata row */}
                            <div className="mt-4 flex items-center gap-4 text-xs text-secondary">
                                <div>
                                    <span className="block font-medium text-primary">{company.timezone ?? 'N/A'}</span>
                                    <span>Timezone</span>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div>
                                    <span className="block font-medium text-primary">{company.defaultGstRate ?? 0}%</span>
                                    <span>Tax Rate</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(company)}>
                                    <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                                    Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="text-status-error-text hover:bg-status-error-bg" onClick={() => setConfirmDelete(company)}>
                                    <TrashIcon className="h-4 w-4 mr-1.5" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Create / Edit Modal ─────────────────────────────── */}
            <ResponsiveModal
                isOpen={showForm}
                onClose={closeForm}
                title={isEditing ? 'Edit Company' : 'Create New Company'}
                size="md"
                footer={formFooter}
            >
                <form id="company-form" onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-secondary">
                        {isEditing
                            ? 'Update the company details below.'
                            : 'Fill in the details to register a new company.'}
                    </p>

                    <Input
                        label="Company Name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Acme Industries"
                    />

                    <Input
                        label="Company Code"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. ACME"
                        disabled={isEditing}
                    />
                    {isEditing && (
                        <p className="text-xs text-tertiary -mt-2">Company code cannot be changed after creation.</p>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Timezone</label>
                        <select
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-bg focus-visible:ring-offset-2 ring-offset-background transition-colors"
                        >
                            {TIMEZONE_OPTIONS.map((tz) => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Default Tax Rate (%)"
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={String(formData.defaultGstRate ?? 15)}
                        onChange={(e) => setFormData({ ...formData, defaultGstRate: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 15"
                    />

                    {formError && (
                        <div className="rounded-lg border border-transparent bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
                            {formError}
                        </div>
                    )}
                </form>
            </ResponsiveModal>

            {/* ── Delete Confirmation Modal ────────────────────────── */}
            <ResponsiveModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Delete Company"
                size="sm"
                footer={deleteFooter}
            >
                <p className="text-sm text-secondary">
                    Are you sure you want to delete <strong className="text-primary">{confirmDelete?.name}</strong> ({confirmDelete?.code})?
                    This action cannot be undone. All associated data may be affected.
                </p>
            </ResponsiveModal>
        </div>
    );
}

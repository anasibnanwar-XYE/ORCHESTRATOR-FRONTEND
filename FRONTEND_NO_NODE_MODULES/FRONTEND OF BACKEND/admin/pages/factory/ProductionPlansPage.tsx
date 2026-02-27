import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  ClipboardList,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  listProductionPlans,
  createProductionPlan,
  updateProductionPlan,
  deleteProductionPlan,
  updateProductionPlanStatus,
  type ProductionPlanDto,
  type ProductionPlanRequest,
} from '../../lib/factoryApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormSelect } from '../../design-system/ResponsiveForm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { formatDate } from '../../lib/formatUtils';

// Status transition map: current status → next allowed status
const STATUS_TRANSITIONS: Record<string, { next: string; label: string } | null> = {
  DRAFT: { next: 'APPROVED', label: 'Approve' },
  APPROVED: { next: 'IN_PROGRESS', label: 'Start' },
  IN_PROGRESS: { next: 'COMPLETED', label: 'Complete' },
  COMPLETED: null,
};

const PLAN_STATUSES = ['ALL', 'DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'];

const emptyForm: ProductionPlanRequest = {
  planNumber: '',
  productName: '',
  quantity: 0,
  plannedDate: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function ProductionPlansPage() {
  const { session } = useAuth();

  // Data state
  const [plans, setPlans] = useState<ProductionPlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create / Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlanDto | null>(null);
  const [form, setForm] = useState<ProductionPlanRequest>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirm
  const [deletingPlan, setDeletingPlan] = useState<ProductionPlanDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status transition confirm
  const [transitionPlan, setTransitionPlan] = useState<ProductionPlanDto | null>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProductionPlans(session);
      setPlans(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load production plans');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const openCreate = () => {
    setIsEdit(false);
    setEditingPlan(null);
    setForm(emptyForm);
    setFormError(null);
    setShowFormModal(true);
  };

  const openEdit = (plan: ProductionPlanDto) => {
    setIsEdit(true);
    setEditingPlan(plan);
    setForm({
      planNumber: plan.planNumber ?? '',
      productName: plan.productName ?? '',
      quantity: plan.quantity ?? 0,
      plannedDate: plan.plannedDate ?? new Date().toISOString().split('T')[0],
      notes: plan.notes ?? '',
    });
    setFormError(null);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.planNumber.trim()) {
      setFormError('Plan number is required');
      return;
    }
    if (!form.productName.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!form.quantity || form.quantity <= 0) {
      setFormError('Quantity must be greater than zero');
      return;
    }
    if (!form.plannedDate) {
      setFormError('Planned date is required');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      if (isEdit && editingPlan?.id) {
        await updateProductionPlan(editingPlan.id, form, session);
      } else {
        await createProductionPlan(form, session);
      }
      setShowFormModal(false);
      await loadPlans();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan?.id) return;
    setDeleteLoading(true);
    try {
      await deleteProductionPlan(deletingPlan.id, session);
      setDeletingPlan(null);
      await loadPlans();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
      setDeletingPlan(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusTransition = async () => {
    if (!transitionPlan?.id || !transitionPlan.status) return;
    const transition = STATUS_TRANSITIONS[transitionPlan.status];
    if (!transition) return;

    setTransitionLoading(true);
    try {
      await updateProductionPlanStatus(transitionPlan.id, transition.next, session);
      setTransitionPlan(null);
      await loadPlans();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update plan status');
      setTransitionPlan(null);
    } finally {
      setTransitionLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      !searchQuery ||
      (plan.planNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.productName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (plan.status ?? '').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Skeleton rows for loading state
  const skeletonRows = Array.from({ length: 5 }, (_, i) => i);

  const transitionForPlan = (plan: ProductionPlanDto) =>
    plan.status ? STATUS_TRANSITIONS[plan.status.toUpperCase()] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Production Plans</h1>
          <p className="mt-1 text-sm text-secondary">Manage and track production schedules</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 font-bold text-status-error-text hover:opacity-70"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
          <Input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {PLAN_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                statusFilter === status
                  ? 'bg-surface border-border text-primary font-semibold'
                  : 'bg-background border-transparent text-secondary hover:text-primary hover:border-border'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface/50 hover:bg-surface/50">
                  <TableHead>Plan #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Planned Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  skeletonRows.map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <div className="h-4 rounded bg-surface animate-pulse w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="h-8 w-8 text-tertiary opacity-50" />
                        <span>
                          {searchQuery || statusFilter !== 'ALL'
                            ? 'No plans match your filters'
                            : 'No production plans yet'}
                        </span>
                        {!searchQuery && statusFilter === 'ALL' && (
                          <Button size="sm" variant="outline" onClick={openCreate}>
                            Create your first plan
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => {
                    const transition = transitionForPlan(plan);
                    return (
                      <TableRow key={plan.id} className="hover:bg-surface/40 transition-colors">
                        <TableCell className="font-mono font-medium text-primary">
                          {plan.planNumber}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-primary">{plan.productName}</div>
                          {plan.notes && (
                            <div className="text-xs text-tertiary truncate max-w-[180px]">
                              {plan.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-primary">
                          {(plan.quantity ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-secondary">
                          {formatDate(plan.plannedDate)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={plan.status ?? 'DRAFT'} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {transition && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setTransitionPlan(plan)}
                                className="text-xs gap-1"
                              >
                                {transition.label}
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                            {(plan.status ?? 'DRAFT').toUpperCase() === 'DRAFT' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEdit(plan)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {(plan.status ?? 'DRAFT').toUpperCase() === 'DRAFT' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingPlan(plan)}
                                className="text-status-error-text hover:text-status-error-text hover:bg-status-error-bg/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          skeletonRows.map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div className="h-4 rounded bg-surface-highlight animate-pulse w-1/2" />
              <div className="h-3 rounded bg-surface-highlight animate-pulse w-3/4" />
              <div className="h-3 rounded bg-surface-highlight animate-pulse w-1/3" />
            </div>
          ))
        ) : filteredPlans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-tertiary opacity-50 mb-3" />
            <p className="text-sm text-secondary">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No plans match your filters'
                : 'No production plans yet'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <Button size="sm" variant="outline" className="mt-4" onClick={openCreate}>
                Create your first plan
              </Button>
            )}
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const transition = transitionForPlan(plan);
            const isDraft = (plan.status ?? 'DRAFT').toUpperCase() === 'DRAFT';
            return (
              <div
                key={plan.id}
                className="rounded-xl border border-border bg-surface p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold text-primary">
                      {plan.planNumber}
                    </p>
                    <p className="text-base font-medium text-primary">{plan.productName}</p>
                  </div>
                  <StatusBadge status={plan.status ?? 'DRAFT'} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-tertiary uppercase tracking-wide">Quantity</p>
                    <p className="font-medium text-primary">
                      {(plan.quantity ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary uppercase tracking-wide">Planned Date</p>
                    <p className="text-secondary">{formatDate(plan.plannedDate)}</p>
                  </div>
                </div>

                {plan.notes && (
                  <p className="text-xs text-secondary italic">{plan.notes}</p>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  {transition && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTransitionPlan(plan)}
                      className="flex-1 gap-1 text-xs"
                    >
                      {transition.label}
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                  {isDraft && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingPlan(plan)}
                        className="text-status-error-text hover:bg-status-error-bg/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      <ResponsiveModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEdit ? 'Edit Production Plan' : 'New Production Plan'}
        size="md"
      >
        <ResponsiveForm onSubmit={handleFormSubmit}>
          {formError && (
            <div className="rounded-lg bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Plan Number"
              value={form.planNumber}
              onChange={(e) => setForm({ ...form, planNumber: e.target.value })}
              placeholder="e.g. PP-2024-001"
              required
            />
            <FormInput
              label="Planned Date"
              type="date"
              value={form.plannedDate}
              onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
              required
            />
          </div>

          <FormInput
            label="Product Name"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            placeholder="e.g. Engine Oil 5W-30"
            required
          />

          <FormInput
            label="Quantity"
            type="number"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })
            }
            placeholder="e.g. 1000"
            required
          />

          <FormInput
            label="Notes (optional)"
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes..."
          />

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFormModal(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </ResponsiveForm>
      </ResponsiveModal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleDelete}
        title="Delete Production Plan"
        description={`Are you sure you want to delete plan "${deletingPlan?.planNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Status Transition Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!transitionPlan}
        onClose={() => setTransitionPlan(null)}
        onConfirm={handleStatusTransition}
        title={`${transitionPlan?.status ? STATUS_TRANSITIONS[transitionPlan.status.toUpperCase()]?.label : ''} Plan`}
        description={
          transitionPlan && transitionPlan.status
            ? `Move plan "${transitionPlan.planNumber}" from ${transitionPlan.status} to ${
                STATUS_TRANSITIONS[transitionPlan.status.toUpperCase()]?.next ?? ''
              }?`
            : ''
        }
        confirmLabel={
          transitionPlan?.status
            ? (STATUS_TRANSITIONS[transitionPlan.status.toUpperCase()]?.label ?? 'Confirm')
            : 'Confirm'
        }
        variant="default"
        loading={transitionLoading}
      />
    </div>
  );
}

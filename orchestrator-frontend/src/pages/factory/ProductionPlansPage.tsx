 /**
  * ProductionPlansPage
  *
  * CRUD for production plans with lifecycle: Draft → Scheduled → In Progress → Completed.
  * - Paginated DataTable (plan number, product, qty, planned date, status)
  * - Create form: plan number, product, quantity, date, notes
  * - Edit form (same fields)
  * - Delete (DRAFT only, with confirm dialog)
  * - Status change actions via PATCH
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
 import { format } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { Input } from '@/components/ui/Input';
 import { Modal } from '@/components/ui/Modal';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { factoryApi } from '@/lib/factoryApi';
 import type { ProductionPlanDto, ProductionPlanRequest, ProductionPlanStatus } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtDate(iso: string | undefined): string {
   if (!iso) return '—';
   try {
     return format(new Date(iso), 'dd MMM yyyy');
   } catch {
     return iso;
   }
 }
 
 const STATUS_LABELS: Record<ProductionPlanStatus, string> = {
   DRAFT: 'Draft',
   SCHEDULED: 'Scheduled',
   IN_PROGRESS: 'In Progress',
   COMPLETED: 'Completed',
   CANCELLED: 'Cancelled',
 };
 
 function statusBadgeVariant(status: ProductionPlanStatus): 'warning' | 'info' | 'success' | 'default' | 'danger' {
   switch (status) {
     case 'DRAFT':
       return 'warning';
     case 'SCHEDULED':
       return 'info';
     case 'IN_PROGRESS':
       return 'success';
     case 'COMPLETED':
       return 'default';
     case 'CANCELLED':
       return 'danger';
     default:
       return 'default';
   }
 }
 
 /** Returns valid next statuses from current status */
 function getNextStatuses(current: ProductionPlanStatus): ProductionPlanStatus[] {
   switch (current) {
     case 'DRAFT':
       return ['SCHEDULED'];
     case 'SCHEDULED':
       return ['IN_PROGRESS'];
     case 'IN_PROGRESS':
       return ['COMPLETED'];
     default:
       return [];
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Plan Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface PlanFormState {
   planNumber: string;
   productName: string;
   quantity: string;
   plannedDate: string;
   notes: string;
 }
 
 const emptyForm: PlanFormState = {
   planNumber: '',
   productName: '',
   quantity: '',
   plannedDate: '',
   notes: '',
 };
 
 interface PlanFormErrors {
   planNumber?: string;
   productName?: string;
   quantity?: string;
   plannedDate?: string;
 }
 
 function validateForm(form: PlanFormState): PlanFormErrors {
   const errors: PlanFormErrors = {};
   if (!form.planNumber.trim()) errors.planNumber = 'Plan number is required';
   if (!form.productName.trim()) errors.productName = 'Product is required';
   const qty = parseFloat(form.quantity);
   if (!form.quantity || isNaN(qty) || qty <= 0) errors.quantity = 'Enter a positive quantity';
   if (!form.plannedDate) errors.plannedDate = 'Planned date is required';
   return errors;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function ProductionPlansPage() {
   const [plans, setPlans] = useState<ProductionPlanDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Modal state
   const [showForm, setShowForm] = useState(false);
   const [editPlan, setEditPlan] = useState<ProductionPlanDto | null>(null);
   const [form, setForm] = useState<PlanFormState>(emptyForm);
   const [formErrors, setFormErrors] = useState<PlanFormErrors>({});
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);
 
   // Delete state
   const [deleteTarget, setDeleteTarget] = useState<ProductionPlanDto | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
 
   // Status transition
   const [statusTarget, setStatusTarget] = useState<ProductionPlanDto | null>(null);
   const [selectedNextStatus, setSelectedNextStatus] = useState<ProductionPlanStatus | null>(null);
   const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await factoryApi.getProductionPlans();
       setPlans(data);
     } catch {
       setError("Couldn't load production plans.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     load();
   }, [load]);
 
   // ── Form handlers ────────────────────────────────────────────────────────
 
   function openCreate() {
     setEditPlan(null);
     setForm(emptyForm);
     setFormErrors({});
     setSubmitError(null);
     setShowForm(true);
   }
 
   function openEdit(plan: ProductionPlanDto) {
     setEditPlan(plan);
     setForm({
       planNumber: plan.planNumber,
       productName: plan.productName,
       quantity: String(plan.quantity),
       plannedDate: plan.plannedDate ? plan.plannedDate.split('T')[0] : '',
       notes: plan.notes ?? '',
     });
     setFormErrors({});
     setSubmitError(null);
     setShowForm(true);
   }
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     const errors = validateForm(form);
     if (Object.keys(errors).length > 0) {
       setFormErrors(errors);
       return;
     }
     setFormErrors({});
     setIsSubmitting(true);
     setSubmitError(null);
     const payload: ProductionPlanRequest = {
       planNumber: form.planNumber.trim(),
       productName: form.productName.trim(),
       quantity: parseFloat(form.quantity),
       plannedDate: form.plannedDate,
       notes: form.notes.trim() || undefined,
     };
     try {
       if (editPlan) {
         await factoryApi.updateProductionPlan(editPlan.id, payload);
       } else {
         await factoryApi.createProductionPlan(payload);
       }
       setShowForm(false);
       load();
     } catch {
       setSubmitError(editPlan ? 'Failed to update plan.' : 'Failed to create plan.');
     } finally {
       setIsSubmitting(false);
     }
   }
 
   // ── Delete handlers ──────────────────────────────────────────────────────
 
   async function handleDelete() {
     if (!deleteTarget) return;
     setIsDeleting(true);
     try {
       await factoryApi.deleteProductionPlan(deleteTarget.id);
       setDeleteTarget(null);
       load();
     } catch {
       // keep dialog open, user can retry
     } finally {
       setIsDeleting(false);
     }
   }
 
   // ── Status transition handlers ───────────────────────────────────────────
 
   function openStatusUpdate(plan: ProductionPlanDto, status: ProductionPlanStatus) {
     setStatusTarget(plan);
     setSelectedNextStatus(status);
   }
 
   async function handleStatusUpdate() {
     if (!statusTarget || !selectedNextStatus) return;
     setIsUpdatingStatus(true);
     try {
       await factoryApi.updateProductionPlanStatus(statusTarget.id, selectedNextStatus);
       setStatusTarget(null);
       setSelectedNextStatus(null);
       load();
     } catch {
       // keep dialog open
     } finally {
       setIsUpdatingStatus(false);
     }
   }
 
   // ── Table columns ────────────────────────────────────────────────────────
 
   const columns: Column<ProductionPlanDto>[] = [
     {
       id: 'planNumber',
       header: 'Plan Number',
       accessor: (row) => (
         <span className="font-mono text-[13px] font-medium text-[var(--color-text-primary)]">
           {row.planNumber}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.planNumber,
     },
     {
       id: 'product',
       header: 'Product',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-primary)]">{row.productName}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.productName,
     },
     {
       id: 'quantity',
       header: 'Qty',
       accessor: (row) => (
         <span className="tabular-nums text-[13px]">{row.quantity.toLocaleString()}</span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'plannedDate',
       header: 'Planned Date',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {fmtDate(row.plannedDate)}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={statusBadgeVariant(row.status)}>
           {STATUS_LABELS[row.status]}
         </Badge>
       ),
     },
     {
       id: 'actions',
       header: '',
       accessor: (row) => {
         const nextStatuses = getNextStatuses(row.status);
         return (
           <div className="flex items-center gap-1 justify-end">
             {nextStatuses.map((next) => (
               <Button
                 key={next}
                 size="sm"
                 variant="secondary"
                 onClick={(e) => {
                   e.stopPropagation();
                   openStatusUpdate(row, next);
                 }}
               >
                 <ChevronRight size={12} />
                 {STATUS_LABELS[next]}
               </Button>
             ))}
             <Button
               size="sm"
               variant="ghost"
               iconOnly
               aria-label="Edit plan"
               onClick={(e) => {
                 e.stopPropagation();
                 openEdit(row);
               }}
             >
               <Pencil size={13} />
             </Button>
             {row.status === 'DRAFT' && (
               <Button
                 size="sm"
                 variant="ghost"
                 iconOnly
                 aria-label="Delete plan"
                 onClick={(e) => {
                   e.stopPropagation();
                   setDeleteTarget(row);
                 }}
               >
                 <Trash2 size={13} className="text-[var(--color-error)]" />
               </Button>
             )}
           </div>
         );
       },
       align: 'right',
     },
   ];
 
   return (
     <div className="space-y-5">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             Production Plans
           </h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             Manage production schedules through their lifecycle.
           </p>
         </div>
         <Button leftIcon={<Plus size={15} />} onClick={openCreate}>
           New Plan
         </Button>
       </div>
 
       {/* ── Error ───────────────────────────────────────────────────── */}
       {error && (
         <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] rounded-xl text-[13px] text-[var(--color-error)]">
           <span>{error}</span>
           <button type="button" onClick={load} className="font-medium underline-offset-2 hover:underline">
             Retry
           </button>
         </div>
       )}
 
       {/* ── Table ───────────────────────────────────────────────────── */}
       <DataTable
         columns={columns}
         data={plans}
         keyExtractor={(row) => row.id}
         isLoading={isLoading}
         searchable
         searchPlaceholder="Search plans..."
         searchFilter={(row, q) =>
           row.planNumber.toLowerCase().includes(q.toLowerCase()) ||
           row.productName.toLowerCase().includes(q.toLowerCase())
         }
         emptyMessage="No production plans found. Create your first plan."
         pageSize={15}
       />
 
       {/* ── Create / Edit Modal ──────────────────────────────────── */}
       <Modal
         isOpen={showForm}
         onClose={() => setShowForm(false)}
         title={editPlan ? 'Edit Production Plan' : 'New Production Plan'}
         size="md"
         footer={
           <>
             <Button variant="secondary" onClick={() => setShowForm(false)}>
               Cancel
             </Button>
             <Button
               isLoading={isSubmitting}
               onClick={(e) => {
                 e.preventDefault();
                 void handleSubmit(e as unknown as React.FormEvent);
               }}
             >
               {editPlan ? 'Update' : 'Create'}
             </Button>
           </>
         }
       >
         <form onSubmit={handleSubmit} className="space-y-4" noValidate>
           {submitError && (
             <p className="text-[12px] text-[var(--color-error)]">{submitError}</p>
           )}
           <Input
             label="Plan Number"
             value={form.planNumber}
             onChange={(e) => setForm({ ...form, planNumber: e.target.value })}
             error={formErrors.planNumber}
             placeholder="e.g. PP-2026-001"
             required
           />
           <Input
             label="Product Name"
             value={form.productName}
             onChange={(e) => setForm({ ...form, productName: e.target.value })}
             error={formErrors.productName}
             placeholder="e.g. Exterior Emulsion 20L"
             required
           />
           <Input
             label="Quantity"
             type="number"
             value={form.quantity}
             onChange={(e) => setForm({ ...form, quantity: e.target.value })}
             error={formErrors.quantity}
             placeholder="e.g. 500"
             required
             min={1}
           />
           <Input
             label="Planned Date"
             type="date"
             value={form.plannedDate}
             onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
             error={formErrors.plannedDate}
             required
           />
           <div className="space-y-1.5">
             <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
               Notes
             </label>
             <textarea
               rows={3}
               value={form.notes}
               onChange={(e) => setForm({ ...form, notes: e.target.value })}
               placeholder="Optional notes..."
               className="w-full px-3 py-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:border-[var(--color-neutral-300)]"
             />
           </div>
         </form>
       </Modal>
 
       {/* ── Delete Confirm ──────────────────────────────────────────── */}
       <ConfirmDialog
         isOpen={!!deleteTarget}
         title="Delete Production Plan"
         message={`Delete plan "${deleteTarget?.planNumber}"? This action cannot be undone.`}
         confirmLabel="Delete"
         variant="danger"
         isLoading={isDeleting}
         onConfirm={handleDelete}
         onCancel={() => setDeleteTarget(null)}
       />
 
       {/* ── Status Update Confirm ────────────────────────────────── */}
       <ConfirmDialog
         isOpen={!!statusTarget && !!selectedNextStatus}
         title="Update Plan Status"
         message={
           statusTarget && selectedNextStatus
             ? `Move plan "${statusTarget.planNumber}" from ${STATUS_LABELS[statusTarget.status]} to ${STATUS_LABELS[selectedNextStatus]}?`
             : ''
         }
         confirmLabel="Confirm"
         isLoading={isUpdatingStatus}
         onConfirm={handleStatusUpdate}
         onCancel={() => {
           setStatusTarget(null);
           setSelectedNextStatus(null);
         }}
       />
     </div>
   );
 }

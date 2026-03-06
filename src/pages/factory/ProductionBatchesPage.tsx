 /**
  * ProductionBatchesPage
  *
  * Lists production batches with create form (product selection, plan association).
  * Batch number, product, qty, status, date columns.
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import { Plus } from 'lucide-react';
 import { format } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { Modal } from '@/components/ui/Modal';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { factoryApi } from '@/lib/factoryApi';
 import type { ProductionBatchDto, ProductionBatchRequest, ProductionPlanDto } from '@/types';
 
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
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Form state
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface BatchFormState {
   batchNumber: string;
   quantityProduced: string;
   planId: string;
   loggedBy: string;
   notes: string;
 }
 
 const emptyBatchForm = (): BatchFormState => ({
   batchNumber: '',
   quantityProduced: '',
   planId: '',
   loggedBy: '',
   notes: '',
 });
 
 interface BatchFormErrors {
   batchNumber?: string;
   quantityProduced?: string;
 }
 
 function validateBatchForm(form: BatchFormState): BatchFormErrors {
   const errors: BatchFormErrors = {};
   if (!form.batchNumber.trim()) errors.batchNumber = 'Batch number is required';
   const qty = parseFloat(form.quantityProduced);
   if (!form.quantityProduced || isNaN(qty) || qty <= 0) {
     errors.quantityProduced = 'Enter a positive quantity';
   }
   return errors;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function ProductionBatchesPage() {
   const [batches, setBatches] = useState<ProductionBatchDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Create modal
   const [showCreate, setShowCreate] = useState(false);
   const [batchForm, setBatchForm] = useState<BatchFormState>(emptyBatchForm());
   const [formErrors, setFormErrors] = useState<BatchFormErrors>({});
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);
 
   // Plans for association
   const [plans, setPlans] = useState<ProductionPlanDto[]>([]);
 
   const loadBatches = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await factoryApi.getProductionBatches();
       setBatches(data);
     } catch {
       setError("Couldn't load production batches.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadBatches();
   }, [loadBatches]);
 
   // ── Open create ──────────────────────────────────────────────────────────
 
   async function openCreate() {
     setBatchForm(emptyBatchForm());
     setFormErrors({});
     setSubmitError(null);
     setShowCreate(true);
 
     if (plans.length === 0) {
       try {
         const plansData = await factoryApi.getProductionPlans();
         setPlans(plansData);
       } catch {
         // non-fatal
       }
     }
   }
 
   // ── Submit ───────────────────────────────────────────────────────────────
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     const errors = validateBatchForm(batchForm);
     if (Object.keys(errors).length > 0) {
       setFormErrors(errors);
       return;
     }
     setFormErrors({});
     setIsSubmitting(true);
     setSubmitError(null);
 
     const request: ProductionBatchRequest = {
       batchNumber: batchForm.batchNumber.trim(),
       quantityProduced: parseFloat(batchForm.quantityProduced),
       loggedBy: batchForm.loggedBy.trim() || undefined,
       notes: batchForm.notes.trim() || undefined,
     };
 
     const planId = batchForm.planId ? Number(batchForm.planId) : undefined;
 
     try {
       await factoryApi.createProductionBatch(request, planId);
       setShowCreate(false);
       loadBatches();
     } catch {
       setSubmitError('Failed to create batch. Please try again.');
     } finally {
       setIsSubmitting(false);
     }
   }
 
   // ── Table columns ────────────────────────────────────────────────────────
 
   const columns: Column<ProductionBatchDto>[] = [
     {
       id: 'batchNumber',
       header: 'Batch Number',
       accessor: (row) => (
         <span className="font-mono text-[13px] font-medium text-[var(--color-text-primary)]">
           {row.batchNumber}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.batchNumber,
     },
     {
       id: 'quantity',
       header: 'Qty Produced',
       accessor: (row) => (
         <span className="tabular-nums text-[13px]">
           {row.quantityProduced.toLocaleString()}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'loggedBy',
       header: 'Logged By',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {row.loggedBy ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'createdAt',
       header: 'Date',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {fmtDate(row.createdAt)}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'notes',
       header: 'Notes',
       accessor: (row) => (
         <span className="text-[12px] text-[var(--color-text-tertiary)] truncate max-w-[200px]">
           {row.notes ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
   ];
 
   return (
     <div className="space-y-5">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             Production Batches
           </h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             Track production batches and link them to plans.
           </p>
         </div>
         <Button leftIcon={<Plus size={15} />} onClick={openCreate}>
           New Batch
         </Button>
       </div>
 
       {error && (
         <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] rounded-xl text-[13px] text-[var(--color-error)]">
           <span>{error}</span>
           <button type="button" onClick={loadBatches} className="font-medium underline-offset-2 hover:underline">
             Retry
           </button>
         </div>
       )}
 
       <DataTable
         columns={columns}
         data={batches}
         keyExtractor={(row) => row.id}
         isLoading={isLoading}
         searchable
         searchPlaceholder="Search batches..."
         searchFilter={(row, q) =>
           row.batchNumber.toLowerCase().includes(q.toLowerCase()) ||
           (row.loggedBy ?? '').toLowerCase().includes(q.toLowerCase())
         }
         emptyMessage="No production batches found. Create your first batch."
         pageSize={15}
       />
 
       {/* ── Create Modal ─────────────────────────────────────────────── */}
       <Modal
         isOpen={showCreate}
         onClose={() => setShowCreate(false)}
         title="New Production Batch"
         size="md"
         footer={
           <>
             <Button variant="secondary" onClick={() => setShowCreate(false)}>
               Cancel
             </Button>
             <Button
               isLoading={isSubmitting}
               onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
             >
               Create Batch
             </Button>
           </>
         }
       >
         <form onSubmit={handleSubmit} className="space-y-4" noValidate>
           {submitError && (
             <p className="text-[12px] text-[var(--color-error)]">{submitError}</p>
           )}
 
           <Input
             label="Batch Number"
             value={batchForm.batchNumber}
             onChange={(e) => setBatchForm((f) => ({ ...f, batchNumber: e.target.value }))}
             error={formErrors.batchNumber}
             placeholder="e.g. BATCH-2026-001"
             required
           />
 
           <Input
             label="Quantity Produced"
             type="number"
             value={batchForm.quantityProduced}
             onChange={(e) => setBatchForm((f) => ({ ...f, quantityProduced: e.target.value }))}
             error={formErrors.quantityProduced}
             placeholder="e.g. 1000"
             required
             min={1}
           />
 
           {/* Plan association */}
           <Select
             label="Associate with Plan (optional)"
             value={batchForm.planId}
             onChange={(e) => setBatchForm((f) => ({ ...f, planId: e.target.value }))}
             options={plans.map((p) => ({
               value: String(p.id),
               label: `${p.planNumber} — ${p.productName}`,
             }))}
             placeholder="No plan selected"
           />
 
           <Input
             label="Logged By (optional)"
             value={batchForm.loggedBy}
             onChange={(e) => setBatchForm((f) => ({ ...f, loggedBy: e.target.value }))}
             placeholder="Operator name"
           />
 
           <div className="space-y-1.5">
             <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
               Notes
             </label>
             <textarea
               rows={2}
               value={batchForm.notes}
               onChange={(e) => setBatchForm((f) => ({ ...f, notes: e.target.value }))}
               placeholder="Optional notes..."
               className="w-full px-3 py-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:border-[var(--color-neutral-300)]"
             />
           </div>
         </form>
       </Modal>
     </div>
   );
 }

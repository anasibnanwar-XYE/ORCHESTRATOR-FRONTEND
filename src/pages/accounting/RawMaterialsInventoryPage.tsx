 /**
  * RawMaterialsInventoryPage
  *
  * Raw material management with:
  *  - CRUD DataTable with search
  *  - Batch tracking: view batches per material (batch number, qty, supplier, expiry)
  *  - Intake recording form: updates on-hand quantity
  *  - Stock overview: on-hand, reorder levels
  *
  * API:
  *  GET    /api/v1/accounting/raw-materials
  *  POST   /api/v1/accounting/raw-materials
  *  PUT    /api/v1/accounting/raw-materials/{id}
  *  DELETE /api/v1/accounting/raw-materials/{id}
  *  GET    /api/v1/raw-material-batches/{rawMaterialId}
  *  POST   /api/v1/raw-materials/intake
  *  GET    /api/v1/raw-materials/stock/inventory
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Plus,
   MoreHorizontal,
   ArrowDownToLine,
 } from 'lucide-react';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { DropdownMenu } from '@/components/ui/DropdownMenu';
 import { useToast } from '@/components/ui/Toast';
 import {
   inventoryApi,
   type RawMaterialDto,
   type RawMaterialRequest,
   type RawMaterialBatchDto,
   type RawMaterialIntakeRequest,
 } from '@/lib/inventoryApi';
 import { purchasingApi, type SupplierFullResponse } from '@/lib/purchasingApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 const UNIT_OPTIONS = [
   { value: 'KG', label: 'Kilogram (kg)' },
   { value: 'LITRE', label: 'Litre (L)' },
   { value: 'PIECE', label: 'Piece' },
   { value: 'GRAM', label: 'Gram (g)' },
   { value: 'METER', label: 'Meter (m)' },
 ];
 
 function formatDate(dateStr?: string): string {
   if (!dateStr) return '—';
   return new Date(dateStr).toLocaleDateString('en-IN', {
     day: '2-digit',
     month: 'short',
     year: 'numeric',
   });
 }
 
 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Raw Material Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface RMFormState {
   name: string;
   sku: string;
   unitType: string;
   reorderLevel: string;
   minStock: string;
   maxStock: string;
 }
 
 interface RMFormErrors {
   name?: string;
   unitType?: string;
   reorderLevel?: string;
   minStock?: string;
   maxStock?: string;
 }
 
 const EMPTY_RM_FORM: RMFormState = {
   name: '',
   sku: '',
   unitType: 'KG',
   reorderLevel: '0',
   minStock: '0',
   maxStock: '0',
 };
 
 interface RawMaterialFormProps {
   initial?: RawMaterialDto | null;
   onSave: (data: RawMaterialRequest) => Promise<void>;
   onClose: () => void;
   isSaving: boolean;
 }
 
 function RawMaterialForm({ initial, onSave, onClose, isSaving }: RawMaterialFormProps) {
   const [form, setForm] = useState<RMFormState>(() => {
     if (initial) {
       return {
         name: initial.name,
         sku: initial.sku ?? '',
         unitType: initial.unitType ?? initial.unit ?? 'KG',
         reorderLevel: String(initial.reorderLevel ?? 0),
         minStock: String(initial.minStock ?? 0),
         maxStock: String(initial.maxStock ?? 0),
       };
     }
     return EMPTY_RM_FORM;
   });
   const [errors, setErrors] = useState<RMFormErrors>({});
 
   const field = (key: keyof RMFormState) => ({
     value: form[key],
     onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
       setForm((f) => ({ ...f, [key]: e.target.value })),
   });
 
   const validate = (): boolean => {
     const errs: RMFormErrors = {};
     if (!form.name.trim()) errs.name = 'Name is required';
     if (!form.unitType) errs.unitType = 'Unit type is required';
     if (isNaN(parseFloat(form.reorderLevel))) errs.reorderLevel = 'Must be a number';
     if (isNaN(parseFloat(form.minStock))) errs.minStock = 'Must be a number';
     if (isNaN(parseFloat(form.maxStock))) errs.maxStock = 'Must be a number';
     setErrors(errs);
     return Object.keys(errs).length === 0;
   };
 
   const handleSubmit = async () => {
     if (!validate()) return;
     await onSave({
       name: form.name.trim(),
       sku: form.sku.trim() || undefined,
       unitType: form.unitType,
       reorderLevel: parseFloat(form.reorderLevel),
       minStock: parseFloat(form.minStock),
       maxStock: parseFloat(form.maxStock),
     });
   };
 
   return (
     <div className="space-y-4">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input label="Name *" placeholder="e.g. Titanium Dioxide" {...field('name')} error={errors.name} />
         <Input label="SKU" placeholder="e.g. RM-001" {...field('sku')} />
         <Select label="Unit *" options={UNIT_OPTIONS} {...field('unitType')} error={errors.unitType} />
         <Input label="Reorder Level *" type="number" min="0" step="0.01" {...field('reorderLevel')} error={errors.reorderLevel} />
         <Input label="Min Stock *" type="number" min="0" step="0.01" {...field('minStock')} error={errors.minStock} />
         <Input label="Max Stock *" type="number" min="0" step="0.01" {...field('maxStock')} error={errors.maxStock} />
       </div>
       <div className="flex justify-end gap-2 pt-2">
         <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
         <Button onClick={handleSubmit} isLoading={isSaving}>
           {initial ? 'Save Changes' : 'Create Material'}
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Intake Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface IntakeFormState {
   quantity: string;
   unit: string;
   costPerUnit: string;
   supplierId: string;
   batchCode: string;
   notes: string;
 }
 
 interface IntakeFormErrors {
   quantity?: string;
   unit?: string;
   costPerUnit?: string;
   supplierId?: string;
 }
 
 interface IntakeFormProps {
   material: RawMaterialDto;
   suppliers: SupplierFullResponse[];
   onSave: (data: RawMaterialIntakeRequest) => Promise<void>;
   onClose: () => void;
   isSaving: boolean;
 }
 
 function IntakeForm({ material, suppliers, onSave, onClose, isSaving }: IntakeFormProps) {
   const [form, setForm] = useState<IntakeFormState>({
     quantity: '',
     unit: material.unitType ?? material.unit ?? 'KG',
     costPerUnit: '',
     supplierId: '',
     batchCode: '',
     notes: '',
   });
   const [errors, setErrors] = useState<IntakeFormErrors>({});
 
   const field = (key: keyof IntakeFormState) => ({
     value: form[key],
     onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
       setForm((f) => ({ ...f, [key]: e.target.value })),
   });
 
   const validate = (): boolean => {
     const errs: IntakeFormErrors = {};
     if (!form.quantity || parseFloat(form.quantity) <= 0) errs.quantity = 'Quantity must be positive';
     if (!form.unit) errs.unit = 'Unit is required';
     if (!form.costPerUnit || parseFloat(form.costPerUnit) <= 0) errs.costPerUnit = 'Cost per unit must be positive';
     if (!form.supplierId) errs.supplierId = 'Supplier is required';
     setErrors(errs);
     return Object.keys(errs).length === 0;
   };
 
   const handleSubmit = async () => {
     if (!validate()) return;
     await onSave({
       rawMaterialId: material.id,
       batchCode: form.batchCode.trim() || undefined,
       quantity: parseFloat(form.quantity),
       unit: form.unit,
       costPerUnit: parseFloat(form.costPerUnit),
       supplierId: parseInt(form.supplierId, 10),
       notes: form.notes.trim() || undefined,
     });
   };
 
   return (
     <div className="space-y-4">
       <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
         <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Recording intake for</p>
         <p className="text-[14px] font-medium text-[var(--color-text-primary)] mt-0.5">{material.name}</p>
         {material.onHandQty !== undefined && (
           <p className="text-[12px] text-[var(--color-text-tertiary)]">Current stock: {material.onHandQty} {material.unit ?? material.unitType}</p>
         )}
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input label="Quantity *" type="number" min="0" step="0.01" placeholder="0.00" {...field('quantity')} error={errors.quantity} />
         <Select label="Unit *" options={UNIT_OPTIONS} {...field('unit')} error={errors.unit} />
         <Input label="Cost per Unit *" type="number" min="0" step="0.01" placeholder="0.00" {...field('costPerUnit')} error={errors.costPerUnit} />
         <Select
           label="Supplier *"
           options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
           placeholder="Select supplier"
           {...field('supplierId')}
           error={errors.supplierId}
         />
         <Input label="Batch Code" placeholder="e.g. BT-2026-001" {...field('batchCode')} />
         <Input label="Notes" placeholder="Optional notes" {...field('notes')} />
       </div>
       <div className="flex justify-end gap-2 pt-2">
         <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
         <Button leftIcon={<ArrowDownToLine size={14} />} onClick={handleSubmit} isLoading={isSaving}>
           Record Intake
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Batch drawer (inside expanded row or modal)
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface BatchesModalProps {
   material: RawMaterialDto;
   onClose: () => void;
 }
 
 function BatchesModal({ material, onClose }: BatchesModalProps) {
   const [batches, setBatches] = useState<RawMaterialBatchDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     setIsLoading(true);
     inventoryApi.getRawMaterialBatches(material.id)
       .then(setBatches)
       .catch(() => setError('Failed to load batches.'))
       .finally(() => setIsLoading(false));
   }, [material.id]);
 
   return (
     <Modal isOpen onClose={onClose} title={`Batches — ${material.name}`} description="Batch tracking and history" size="lg">
       {isLoading ? (
         <div className="space-y-2">
           {[1,2,3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
         </div>
       ) : error ? (
         <p className="text-[13px] text-[var(--color-danger-text)]">{error}</p>
       ) : batches.length === 0 ? (
         <p className="text-[13px] text-[var(--color-text-secondary)]">No batches recorded yet.</p>
       ) : (
         <div className="overflow-x-auto">
           <table className="w-full text-[13px]">
             <thead className="bg-[var(--color-surface-secondary)]">
               <tr>
                 <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Batch Code</th>
                 <th className="px-3 py-2 text-right font-medium text-[var(--color-text-secondary)]">Qty</th>
                 <th className="px-3 py-2 text-right font-medium text-[var(--color-text-secondary)]">Unit Cost</th>
                 <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Supplier</th>
                 <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Expiry</th>
                 <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Received</th>
               </tr>
             </thead>
             <tbody>
               {batches.map((b) => (
                 <tr key={b.id} className="border-t border-[var(--color-border-subtle)]">
                   <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--color-text-secondary)]">{b.batchCode ?? '—'}</td>
                   <td className="px-3 py-2.5 text-right tabular-nums">{b.quantity} {material.unitType ?? material.unit}</td>
                   <td className="px-3 py-2.5 text-right tabular-nums">{formatINR(b.costPerUnit)}</td>
                   <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{b.supplierName ?? '—'}</td>
                   <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{formatDate(b.expiryDate)}</td>
                   <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{formatDate(b.createdAt)}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function RawMaterialsInventoryPage() {
   const toast = useToast();
   const [materials, setMaterials] = useState<RawMaterialDto[]>([]);
   const [suppliers, setSuppliers] = useState<SupplierFullResponse[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const [showCreate, setShowCreate] = useState(false);
   const [editMaterial, setEditMaterial] = useState<RawMaterialDto | null>(null);
   const [isSaving, setIsSaving] = useState(false);
 
   const [intakeMaterial, setIntakeMaterial] = useState<RawMaterialDto | null>(null);
   const [isIntaking, setIsIntaking] = useState(false);
 
   const [batchMaterial, setBatchMaterial] = useState<RawMaterialDto | null>(null);
 
   const [deleteTarget, setDeleteTarget] = useState<RawMaterialDto | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [mats, sups] = await Promise.all([
         inventoryApi.getRawMaterials(),
         purchasingApi.getSuppliers(),
       ]);
       setMaterials(mats);
       setSuppliers(sups);
     } catch {
       setError('Failed to load raw materials. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const handleCreate = async (data: RawMaterialRequest) => {
     setIsSaving(true);
     try {
       await inventoryApi.createRawMaterial(data);
       toast.success('Raw material created.');
       setShowCreate(false);
       load();
     } catch {
       toast.error('Failed to create raw material.');
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleUpdate = async (data: RawMaterialRequest) => {
     if (!editMaterial) return;
     setIsSaving(true);
     try {
       await inventoryApi.updateRawMaterial(editMaterial.id, data);
       toast.success('Raw material updated.');
       setEditMaterial(null);
       load();
     } catch {
       toast.error('Failed to update raw material.');
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleDelete = async () => {
     if (!deleteTarget) return;
     setIsDeleting(true);
     try {
       await inventoryApi.deleteRawMaterial(deleteTarget.id);
       toast.success(`"${deleteTarget.name}" deleted.`);
       setDeleteTarget(null);
       load();
     } catch {
       toast.error('Failed to delete raw material. It may have associated batches.');
     } finally {
       setIsDeleting(false);
     }
   };
 
   const handleIntake = async (data: RawMaterialIntakeRequest) => {
     setIsIntaking(true);
     try {
       await inventoryApi.recordIntake(data);
       toast.success('Intake recorded. On-hand quantity updated.');
       setIntakeMaterial(null);
       load();
     } catch {
       toast.error('Failed to record intake. Please try again.');
     } finally {
       setIsIntaking(false);
     }
   };
 
   const COLUMNS: Column<RawMaterialDto>[] = [
     {
       id: 'name',
       header: 'Material',
       accessor: (row) => (
         <div>
           <p className="font-medium text-[var(--color-text-primary)]">{row.name}</p>
           {row.sku && <p className="text-[11px] font-mono text-[var(--color-text-tertiary)]">{row.sku}</p>}
         </div>
       ),
       sortable: true,
       sortAccessor: (row) => row.name,
     },
     {
       id: 'unit',
       header: 'Unit',
       accessor: (row) => <span className="text-[var(--color-text-secondary)]">{row.unitType ?? row.unit ?? '—'}</span>,
       align: 'center',
       width: '80px',
       hideOnMobile: true,
     },
     {
       id: 'onHand',
       header: 'On Hand',
       accessor: (row) => (
         <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
           {row.onHandQty !== undefined ? row.onHandQty : '—'}
         </span>
       ),
       align: 'right',
       sortable: true,
       sortAccessor: (row) => row.onHandQty ?? 0,
       width: '100px',
     },
     {
       id: 'reorderLevel',
       header: 'Reorder',
       accessor: (row) => (
         <span className="tabular-nums text-[var(--color-text-secondary)]">{row.reorderLevel ?? '—'}</span>
       ),
       align: 'right',
       hideOnMobile: true,
       width: '90px',
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => {
         const onHand = row.onHandQty ?? 0;
         const reorder = row.reorderLevel ?? 0;
         const isLow = onHand <= reorder && reorder > 0;
         return (
           <Badge variant={isLow ? 'warning' : 'success'} dot>
             {isLow ? 'Low Stock' : 'In Stock'}
           </Badge>
         );
       },
       align: 'center',
       width: '110px',
       hideOnMobile: true,
     },
     {
       id: 'actions',
       header: '',
       accessor: (row) => (
         <div className="flex items-center gap-1 justify-end">
           <button
             type="button"
             onClick={() => setIntakeMaterial(row)}
             className="flex items-center gap-1 px-2 h-7 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
             title="Record intake"
           >
             <ArrowDownToLine size={12} />
             Intake
           </button>
           <DropdownMenu
             trigger={
               <button
                 type="button"
                 className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
               >
                 <MoreHorizontal size={14} />
               </button>
             }
             items={[
               { label: 'View Batches', value: 'batches' },
               { label: 'Edit', value: 'edit' },
               { label: 'Delete', value: 'delete', destructive: true },
             ]}
             onSelect={(value) => {
               if (value === 'batches') setBatchMaterial(row);
               else if (value === 'edit') setEditMaterial(row);
               else if (value === 'delete') setDeleteTarget(row);
             }}
           />
         </div>
       ),
       align: 'right',
     },
   ];
 
   if (isLoading) {
     return (
       <div className="space-y-5">
         <Skeleton className="h-9 w-48" />
         <Skeleton className="h-64 w-full rounded-xl" />
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-16 gap-3">
         <AlertCircle size={22} className="text-[var(--color-danger-text)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
         <Button size="sm" variant="secondary" leftIcon={<RefreshCcw size={13} />} onClick={load}>
           Retry
         </Button>
       </div>
     );
   }
 
   return (
     <div className="space-y-5">
       <PageHeader
         title="Raw Materials"
         description="Manage raw material stock, batches and intake"
         actions={
           <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
             New Material
           </Button>
         }
       />
 
       <DataTable
         columns={COLUMNS}
         data={materials}
         keyExtractor={(row) => row.id}
         searchable
         searchPlaceholder="Search materials..."
         searchFilter={(row, q) =>
           row.name.toLowerCase().includes(q) ||
           (row.sku?.toLowerCase().includes(q) ?? false)
         }
         emptyMessage="No raw materials found. Create your first material to get started."
       />
 
       {/* Create Modal */}
       <Modal
         isOpen={showCreate}
         onClose={() => setShowCreate(false)}
         title="Create Raw Material"
         description="Add a new raw material to inventory"
         size="lg"
       >
         <RawMaterialForm onSave={handleCreate} onClose={() => setShowCreate(false)} isSaving={isSaving} />
       </Modal>
 
       {/* Edit Modal */}
       <Modal
         isOpen={editMaterial !== null}
         onClose={() => setEditMaterial(null)}
         title="Edit Raw Material"
         description={editMaterial?.name ?? ''}
         size="lg"
       >
         {editMaterial && (
           <RawMaterialForm initial={editMaterial} onSave={handleUpdate} onClose={() => setEditMaterial(null)} isSaving={isSaving} />
         )}
       </Modal>
 
       {/* Intake Modal */}
       <Modal
         isOpen={intakeMaterial !== null}
         onClose={() => setIntakeMaterial(null)}
         title="Record Intake"
         description="Update on-hand quantity for this material"
         size="lg"
       >
         {intakeMaterial && (
           <IntakeForm
             material={intakeMaterial}
             suppliers={suppliers}
             onSave={handleIntake}
             onClose={() => setIntakeMaterial(null)}
             isSaving={isIntaking}
           />
         )}
       </Modal>
 
       {/* Batches Modal */}
       {batchMaterial && (
         <BatchesModal material={batchMaterial} onClose={() => setBatchMaterial(null)} />
       )}
 
       {/* Delete Confirm */}
       <ConfirmDialog
         isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
         onConfirm={handleDelete}
         title="Delete Raw Material"
         message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
         confirmLabel="Delete"
         variant="danger"
         isLoading={isDeleting}
       />
     </div>
   );
 }

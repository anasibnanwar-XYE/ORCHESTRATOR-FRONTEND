 /**
  * PackagingMappingsPage
  *
  * CRUD DataTable for packaging size mappings:
  *   - product, package type, size, unit count
  *   - Create / Update / Delete (with confirm dialog)
  */

 import { useCallback, useEffect, useState } from 'react';
 import { Plus, Pencil, Trash2 } from 'lucide-react';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { Modal } from '@/components/ui/Modal';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { factoryApi } from '@/lib/factoryApi';
 import type { PackagingSizeMappingDto, PackagingSizeMappingRequest, RawMaterialDto } from '@/types';

 // ─────────────────────────────────────────────────────────────────────────────
 // Form state
 // ─────────────────────────────────────────────────────────────────────────────

 interface MappingFormState {
   packagingSize: string;
   rawMaterialId: string;
   unitsPerPack: string;
   cartonSize: string;
   litersPerUnit: string;
 }

 function emptyMappingForm(): MappingFormState {
   return {
     packagingSize: '',
     rawMaterialId: '',
     unitsPerPack: '',
     cartonSize: '',
     litersPerUnit: '',
   };
 }

 interface MappingFormErrors {
   packagingSize?: string;
 }

 function validateMappingForm(form: MappingFormState): MappingFormErrors {
   const errors: MappingFormErrors = {};
   if (!form.packagingSize.trim()) errors.packagingSize = 'Packaging size is required';
   return errors;
 }

 function formToRequest(form: MappingFormState): PackagingSizeMappingRequest {
   return {
     packagingSize: form.packagingSize.trim(),
     rawMaterialId: form.rawMaterialId ? parseInt(form.rawMaterialId) : undefined,
     unitsPerPack: form.unitsPerPack ? parseFloat(form.unitsPerPack) : undefined,
     cartonSize: form.cartonSize ? parseFloat(form.cartonSize) : undefined,
     litersPerUnit: form.litersPerUnit ? parseFloat(form.litersPerUnit) : undefined,
   };
 }

 function mappingToForm(mapping: PackagingSizeMappingDto): MappingFormState {
   return {
     packagingSize: mapping.packagingSize ?? '',
     rawMaterialId: mapping.rawMaterialId ? String(mapping.rawMaterialId) : '',
     unitsPerPack: mapping.unitsPerPack !== undefined ? String(mapping.unitsPerPack) : '',
     cartonSize: mapping.cartonSize !== undefined ? String(mapping.cartonSize) : '',
     litersPerUnit: mapping.litersPerUnit !== undefined ? String(mapping.litersPerUnit) : '',
   };
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────

 export function PackagingMappingsPage() {
   const [mappings, setMappings] = useState<PackagingSizeMappingDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Raw materials for dropdown
   const [rawMaterials, setRawMaterials] = useState<RawMaterialDto[]>([]);

   // Create / Edit modal
   const [showModal, setShowModal] = useState(false);
   const [editMapping, setEditMapping] = useState<PackagingSizeMappingDto | null>(null);
   const [form, setForm] = useState<MappingFormState>(emptyMappingForm());
   const [formErrors, setFormErrors] = useState<MappingFormErrors>({});
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);

   // Delete confirm
   const [deleteMapping, setDeleteMapping] = useState<PackagingSizeMappingDto | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);

   const loadMappings = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await factoryApi.getPackagingMappings();
       setMappings(data);
     } catch {
       setError("Couldn't load packaging mappings.");
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     void loadMappings();
   }, [loadMappings]);

   async function openCreate() {
     setEditMapping(null);
     setForm(emptyMappingForm());
     setFormErrors({});
     setSubmitError(null);
     setShowModal(true);

     if (rawMaterials.length === 0) {
       try {
         const materials = await factoryApi.getRawMaterials();
         setRawMaterials(materials);
       } catch {
         // non-fatal
       }
     }
   }

   async function openEdit(mapping: PackagingSizeMappingDto) {
     setEditMapping(mapping);
     setForm(mappingToForm(mapping));
     setFormErrors({});
     setSubmitError(null);
     setShowModal(true);

     if (rawMaterials.length === 0) {
       try {
         const materials = await factoryApi.getRawMaterials();
         setRawMaterials(materials);
       } catch {
         // non-fatal
       }
     }
   }

   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     const errors = validateMappingForm(form);
     if (Object.keys(errors).length > 0) {
       setFormErrors(errors);
       return;
     }
     setFormErrors({});
     setIsSubmitting(true);
     setSubmitError(null);

     const request = formToRequest(form);

     try {
       if (editMapping) {
         await factoryApi.updatePackagingMapping(editMapping.id, request);
       } else {
         await factoryApi.createPackagingMapping(request);
       }
       setShowModal(false);
       void loadMappings();
     } catch {
       setSubmitError(editMapping
         ? 'Failed to update mapping. Please try again.'
         : 'Failed to create mapping. Please try again.');
     } finally {
       setIsSubmitting(false);
     }
   }

   async function handleDelete() {
     if (!deleteMapping) return;
     setIsDeleting(true);
     try {
       await factoryApi.deletePackagingMapping(deleteMapping.id);
       setDeleteMapping(null);
       void loadMappings();
     } catch {
       // keep dialog open
     } finally {
       setIsDeleting(false);
     }
   }

   // ── Table columns ────────────────────────────────────────────────────────

   const columns: Column<PackagingSizeMappingDto>[] = [
     {
       id: 'packagingSize',
       header: 'Packaging Size',
       accessor: (row) => (
         <span className="font-medium text-[13px] text-[var(--color-text-primary)]">
           {row.packagingSize ?? '—'}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.packagingSize ?? '',
     },
     {
       id: 'rawMaterial',
       header: 'Raw Material',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {row.rawMaterialName ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'unitsPerPack',
       header: 'Units / Pack',
       accessor: (row) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-secondary)]">
           {row.unitsPerPack !== undefined ? row.unitsPerPack.toLocaleString() : '—'}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'cartonSize',
       header: 'Carton Size',
       accessor: (row) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-secondary)]">
           {row.cartonSize !== undefined ? row.cartonSize.toLocaleString() : '—'}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'litersPerUnit',
       header: 'Liters / Unit',
       accessor: (row) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-secondary)]">
           {row.litersPerUnit !== undefined ? row.litersPerUnit.toLocaleString() : '—'}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'active',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={row.active ? 'success' : 'danger'} dot>
           {row.active ? 'Active' : 'Inactive'}
         </Badge>
       ),
       hideOnMobile: true,
     },
     {
       id: 'actions',
       header: '',
       accessor: (row) => (
         <div className="flex items-center gap-1.5 justify-end">
           <button
             type="button"
             onClick={() => openEdit(row)}
             className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
             aria-label="Edit mapping"
           >
             <Pencil size={14} />
           </button>
           <button
             type="button"
             onClick={() => setDeleteMapping(row)}
             className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors"
             aria-label="Delete mapping"
           >
             <Trash2 size={14} />
           </button>
         </div>
       ),
       align: 'right',
     },
   ];

   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             Packaging Mappings
           </h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             Configure packaging size definitions, units per pack, and carton sizes.
           </p>
         </div>
         <Button leftIcon={<Plus size={15} />} onClick={() => void openCreate()}>
           Add Mapping
         </Button>
       </div>

       {error && (
         <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] rounded-xl text-[13px] text-[var(--color-error)]">
           <span>{error}</span>
           <button type="button" onClick={loadMappings} className="font-medium underline-offset-2 hover:underline">
             Retry
           </button>
         </div>
       )}

       <DataTable
         columns={columns}
         data={mappings}
         keyExtractor={(row) => row.id}
         isLoading={isLoading}
         searchable
         searchPlaceholder="Search mappings..."
         searchFilter={(row, q) =>
           (row.packagingSize ?? '').toLowerCase().includes(q.toLowerCase()) ||
           (row.rawMaterialName ?? '').toLowerCase().includes(q.toLowerCase())
         }
         emptyMessage="No packaging mappings found. Add your first mapping to configure package sizes."
         pageSize={20}
       />

       {/* Create / Edit Modal */}
       <Modal
         isOpen={showModal}
         onClose={() => setShowModal(false)}
         title={editMapping ? 'Edit Packaging Mapping' : 'New Packaging Mapping'}
         size="md"
         footer={
           <>
             <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
             <Button
               isLoading={isSubmitting}
               onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
             >
               {editMapping ? 'Save Changes' : 'Create Mapping'}
             </Button>
           </>
         }
       >
         <form onSubmit={handleSubmit} className="space-y-4" noValidate>
           {submitError && (
             <p className="text-[12px] text-[var(--color-error)]">{submitError}</p>
           )}

           <Input
             label="Packaging Size"
             value={form.packagingSize}
             onChange={(e) => setForm((f) => ({ ...f, packagingSize: e.target.value }))}
             error={formErrors.packagingSize}
             placeholder="e.g. 1L, 4L, 20L"
             required
           />

           <Select
             label="Raw Material (optional)"
             value={form.rawMaterialId}
             onChange={(e) => setForm((f) => ({ ...f, rawMaterialId: e.target.value }))}
             options={rawMaterials.map((m) => ({
               value: String(m.id),
               label: m.name,
             }))}
             placeholder="No material selected"
           />

           <div className="grid grid-cols-3 gap-3">
             <Input
               label="Units / Pack"
               type="number"
               value={form.unitsPerPack}
               onChange={(e) => setForm((f) => ({ ...f, unitsPerPack: e.target.value }))}
               placeholder="e.g. 12"
               min={1}
             />
             <Input
               label="Carton Size"
               type="number"
               value={form.cartonSize}
               onChange={(e) => setForm((f) => ({ ...f, cartonSize: e.target.value }))}
               placeholder="e.g. 12"
               min={1}
             />
             <Input
               label="Liters / Unit"
               type="number"
               value={form.litersPerUnit}
               onChange={(e) => setForm((f) => ({ ...f, litersPerUnit: e.target.value }))}
               placeholder="e.g. 1"
               min={0}
               step="0.001"
             />
           </div>
         </form>
       </Modal>

       {/* Delete Confirm */}
       <ConfirmDialog
         isOpen={deleteMapping !== null}
         title="Delete Mapping"
         message={`Are you sure you want to delete the packaging mapping for "${deleteMapping?.packagingSize}"? This action cannot be undone.`}
         confirmLabel="Delete"
         cancelLabel="Cancel"
         variant="danger"
         isLoading={isDeleting}
         onConfirm={handleDelete}
         onCancel={() => setDeleteMapping(null)}
       />
     </div>
   );
 }

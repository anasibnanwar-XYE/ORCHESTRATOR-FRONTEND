 /**
  * RawMaterialsPage — Factory portal raw materials inventory
  *
  * Tabs:
  *   1. Stock Overview — DataTable of all raw materials with current stock
  *   2. Batches — Batch list (batch number, supplier, received date, qty, expiry, remaining)
  *      - Record Intake: modal form to add new intake
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import { format } from 'date-fns';
 import {
   AlertCircle,
   RefreshCcw,
   Plus,
   FlaskConical,
   Layers,
   Database,
   ArrowDownToLine,
 } from 'lucide-react';
 import { Tabs } from '@/components/ui/Tabs';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Modal } from '@/components/ui/Modal';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { factoryApi } from '@/lib/factoryApi';
 import type {
   RawMaterialDto,
   InventoryStockSnapshot,
   FactoryRawMaterialBatchDto,
   RawMaterialIntakeRequest,
 } from '@/types';
 
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
 
 function fmtNum(n: number | undefined | null): string {
   if (n == null) return '—';
   return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
 }
 
 function fmtCurrency(n: number | undefined | null): string {
   if (n == null) return '—';
   return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
 }
 
 type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';
 
 function stockStatusVariant(status: string | undefined): BadgeVariant {
   switch (status) {
     case 'IN_STOCK': return 'success';
     case 'LOW_STOCK': return 'warning';
     case 'OUT_OF_STOCK': return 'danger';
     default: return 'default';
   }
 }
 
 function stockStatusLabel(status: string | undefined): string {
   switch (status) {
     case 'IN_STOCK': return 'In Stock';
     case 'LOW_STOCK': return 'Low Stock';
     case 'OUT_OF_STOCK': return 'Out of Stock';
     default: return status ?? '—';
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Intake Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface IntakeFormState {
   rawMaterialId: number;
   supplierId: number;
   quantity: string;
   unit: string;
   costPerUnit: string;
   batchCode: string;
   expiryDate: string;
   notes: string;
 }
 
 function defaultIntakeForm(materialId: number): IntakeFormState {
   return {
     rawMaterialId: materialId,
     supplierId: 0,
     quantity: '',
     unit: '',
     costPerUnit: '',
     batchCode: '',
     expiryDate: '',
     notes: '',
   };
 }
 
 function IntakeForm({
   materials,
   onSave,
   onCancel,
   saving,
 }: {
   materials: RawMaterialDto[];
   onSave: (data: RawMaterialIntakeRequest) => void;
   onCancel: () => void;
   saving: boolean;
 }) {
   const [form, setForm] = useState<IntakeFormState>(() => defaultIntakeForm(materials[0]?.id ?? 0));
   const [errors, setErrors] = useState<Partial<Record<keyof IntakeFormState, string>>>({});
 
   function validate(): boolean {
     const e: Partial<Record<keyof IntakeFormState, string>> = {};
     if (!form.rawMaterialId) e.rawMaterialId = 'Material is required';
     if (!form.supplierId) e.supplierId = 'Supplier ID is required';
     if (!form.quantity || parseFloat(form.quantity) <= 0) e.quantity = 'Quantity must be greater than 0';
     if (!form.unit.trim()) e.unit = 'Unit is required';
     if (!form.costPerUnit || parseFloat(form.costPerUnit) < 0) e.costPerUnit = 'Cost per unit is required';
     setErrors(e);
     return Object.keys(e).length === 0;
   }
 
   function handleSubmit() {
     if (!validate()) return;
     onSave({
       rawMaterialId: form.rawMaterialId,
       supplierId: form.supplierId,
       quantity: parseFloat(form.quantity),
       unit: form.unit.trim(),
       costPerUnit: parseFloat(form.costPerUnit),
       batchCode: form.batchCode.trim() || undefined,
       expiryDate: form.expiryDate || undefined,
       notes: form.notes.trim() || undefined,
     });
   }
 
   const inputClass = (field: keyof IntakeFormState) =>
     `w-full px-3 py-2 text-[13px] rounded-lg border bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none transition-colors ${errors[field] ? 'border-[var(--color-error)]' : 'border-[var(--color-border-default)] focus:border-[var(--color-neutral-900)]'}`;
 
   return (
     <div className="space-y-3 p-1">
       <div className="space-y-1.5">
         <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
           Material <span className="text-[var(--color-error)]">*</span>
         </label>
         <select
           value={form.rawMaterialId}
           onChange={e => setForm(f => ({ ...f, rawMaterialId: Number(e.target.value) }))}
           className={inputClass('rawMaterialId')}
         >
           {materials.map(m => (
             <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
           ))}
         </select>
         {errors.rawMaterialId && <p className="text-[11px] text-[var(--color-error)]">{errors.rawMaterialId}</p>}
       </div>
 
       <div className="grid grid-cols-2 gap-3">
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Supplier ID <span className="text-[var(--color-error)]">*</span>
           </label>
           <input
             type="number"
             value={form.supplierId || ''}
             onChange={e => setForm(f => ({ ...f, supplierId: Number(e.target.value) }))}
             placeholder="Supplier ID"
             className={inputClass('supplierId')}
           />
           {errors.supplierId && <p className="text-[11px] text-[var(--color-error)]">{errors.supplierId}</p>}
         </div>
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Batch Code
           </label>
           <input
             type="text"
             value={form.batchCode}
             onChange={e => setForm(f => ({ ...f, batchCode: e.target.value }))}
             placeholder="e.g. BCH-2026-001"
             className={inputClass('batchCode')}
           />
         </div>
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Quantity <span className="text-[var(--color-error)]">*</span>
           </label>
           <input
             type="number"
             value={form.quantity}
             onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
             placeholder="0"
             min="0.01"
             step="0.01"
             className={inputClass('quantity')}
           />
           {errors.quantity && <p className="text-[11px] text-[var(--color-error)]">{errors.quantity}</p>}
         </div>
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Unit <span className="text-[var(--color-error)]">*</span>
           </label>
           <input
             type="text"
             value={form.unit}
             onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
             placeholder="e.g. KG, L, Units"
             className={inputClass('unit')}
           />
           {errors.unit && <p className="text-[11px] text-[var(--color-error)]">{errors.unit}</p>}
         </div>
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Cost per Unit <span className="text-[var(--color-error)]">*</span>
           </label>
           <input
             type="number"
             value={form.costPerUnit}
             onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))}
             placeholder="0.00"
             min="0"
             step="0.01"
             className={inputClass('costPerUnit')}
           />
           {errors.costPerUnit && <p className="text-[11px] text-[var(--color-error)]">{errors.costPerUnit}</p>}
         </div>
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Expiry Date
           </label>
           <input
             type="date"
             value={form.expiryDate}
             onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
             className={inputClass('expiryDate')}
           />
         </div>
       </div>
 
       <div className="space-y-1.5">
         <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
           Notes
         </label>
         <textarea
           value={form.notes}
           onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
           placeholder="Notes about this intake..."
           rows={2}
           className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:border-[var(--color-neutral-900)] transition-colors"
         />
       </div>
 
       <div className="flex justify-end gap-2 pt-2">
         <Button variant="secondary" onClick={onCancel}>Cancel</Button>
         <Button onClick={handleSubmit} disabled={saving}>
           {saving ? 'Recording…' : 'Record Intake'}
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function RawMaterialsPage() {
   const toast = useToast();
   const [materials, setMaterials] = useState<RawMaterialDto[]>([]);
   const [stockInventory, setStockInventory] = useState<InventoryStockSnapshot[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Batch list state
   const [selectedMaterial, setSelectedMaterial] = useState<RawMaterialDto | null>(null);
   const [batches, setBatches] = useState<FactoryRawMaterialBatchDto[]>([]);
   const [batchesLoading, setBatchesLoading] = useState(false);
 
   // Intake form
   const [intakeOpen, setIntakeOpen] = useState(false);
   const [saving, setSaving] = useState(false);
 
   // Tabs
   const [activeTab, setActiveTab] = useState('overview');
 
   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const [materialsData, inventoryData] = await Promise.all([
         factoryApi.getRawMaterials(),
         factoryApi.getRawMaterialStockInventory(),
       ]);
       setMaterials(materialsData ?? []);
       setStockInventory(inventoryData ?? []);
     } catch {
       setError('Unable to load raw materials. Please try again.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => { void load(); }, [load]);
 
   async function loadBatches(material: RawMaterialDto) {
     setSelectedMaterial(material);
     setBatches([]);
     setBatchesLoading(true);
     try {
       const data = await factoryApi.getRawMaterialBatches(material.id);
       setBatches(data ?? []);
     } catch {
       toast.error('Failed to load batches');
       setSelectedMaterial(null);
     } finally {
       setBatchesLoading(false);
     }
   }
 
   async function handleIntake(data: RawMaterialIntakeRequest) {
     setSaving(true);
     try {
       await factoryApi.recordRawMaterialIntake(data);
       toast.success('Raw material intake recorded');
       setIntakeOpen(false);
       await load();
       // Reload batches if viewing a batch for the same material
       if (selectedMaterial && selectedMaterial.id === data.rawMaterialId) {
         await loadBatches(selectedMaterial);
       }
     } catch {
       toast.error('Failed to record intake');
     } finally {
       setSaving(false);
     }
   }
 
   const tabs = [
     { value: 'overview', label: 'Stock Overview' },
     { value: 'batches', label: 'Batches' },
   ];
 
   // ── Render ────────────────────────────────────────────────────────────────
 
   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Raw Materials</h1>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
             Track raw material stock, batches, and intake records.
           </p>
         </div>
         <div className="flex items-center gap-2">
           <button
             type="button"
             onClick={load}
             className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
           >
             <RefreshCcw size={13} />
             Refresh
           </button>
           <Button onClick={() => setIntakeOpen(true)} className="flex items-center gap-1.5 h-8 text-[12px]">
             <Plus size={13} />
             Record Intake
           </Button>
         </div>
       </div>
 
       {/* Tabs */}
       <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
 
       {loading ? (
         <div className="space-y-3">
           {Array.from({ length: 5 }).map((_, i) => (
             <Skeleton key={i} className="h-12 w-full rounded-lg" />
           ))}
         </div>
       ) : error ? (
         <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
           <div className="flex flex-col items-center justify-center py-12 gap-3">
             <AlertCircle size={20} className="text-[var(--color-error)]" />
             <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
             <button
               type="button"
               onClick={load}
               className="flex items-center gap-1.5 px-3 h-7 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
             >
               <RefreshCcw size={12} />
               Retry
             </button>
           </div>
         </div>
       ) : (
         <>
           {/* Stock Overview tab */}
           {activeTab === 'overview' && (
             <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
               {stockInventory.length === 0 && materials.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 gap-2">
                   <FlaskConical size={24} className="text-[var(--color-text-tertiary)]" />
                   <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                     No raw materials registered
                   </p>
                   <p className="text-[12px] text-[var(--color-text-tertiary)]">
                     Record an intake to add raw materials to inventory.
                   </p>
                 </div>
               ) : (
                 <>
                   {/* Desktop table */}
                   <div className="hidden sm:block overflow-x-auto">
                     <table className="w-full text-[12px]">
                       <thead>
                         <tr className="border-b border-[var(--color-border-subtle)]">
                           {['Material', 'SKU', 'Current Stock', 'Reorder Level', 'Status', ''].map(h => (
                             <th key={h} className="px-4 py-2.5 text-left font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px]">
                               {h}
                             </th>
                           ))}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--color-border-subtle)]">
                         {materials.map(material => {
                           const snap = stockInventory.find(s => s.sku === material.sku);
                           const currentStock = snap?.currentStock ?? material.currentStock;
                           const status = snap?.status ?? material.status;
                           return (
                             <tr key={material.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                               <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{material.name}</td>
                               <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-[11px]">{material.sku ?? '—'}</td>
                               <td className="px-4 py-3 tabular-nums font-medium text-[var(--color-text-primary)]">
                                 {fmtNum(currentStock)} {material.unitType}
                               </td>
                               <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">
                                 {fmtNum(snap?.reorderLevel ?? material.reorderLevel)} {material.unitType}
                               </td>
                               <td className="px-4 py-3">
                                 <Badge variant={stockStatusVariant(status)}>
                                   {stockStatusLabel(status)}
                                 </Badge>
                               </td>
                               <td className="px-4 py-3">
                                 <button
                                   type="button"
                                   onClick={() => { setActiveTab('batches'); void loadBatches(material); }}
                                   className="flex items-center gap-1 px-2.5 h-7 rounded-md border border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                                 >
                                   <Layers size={12} />
                                   Batches
                                 </button>
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
 
                   {/* Mobile cards */}
                   <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
                     {materials.map(material => {
                       const snap = stockInventory.find(s => s.sku === material.sku);
                       const currentStock = snap?.currentStock ?? material.currentStock;
                       const status = snap?.status ?? material.status;
                       return (
                         <div key={material.id} className="p-4 space-y-2">
                           <div className="flex items-start justify-between gap-2">
                             <div>
                               <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{material.name}</p>
                               <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{material.sku}</p>
                             </div>
                             <Badge variant={stockStatusVariant(status)}>
                               {stockStatusLabel(status)}
                             </Badge>
                           </div>
                           <div className="flex items-center gap-4 text-[12px]">
                             <span className="text-[var(--color-text-tertiary)]">
                               Stock: <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{fmtNum(currentStock)} {material.unitType}</span>
                             </span>
                           </div>
                           <button
                             type="button"
                             onClick={() => { setActiveTab('batches'); void loadBatches(material); }}
                             className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                           >
                             <Layers size={13} />
                             View Batches
                           </button>
                         </div>
                       );
                     })}
                   </div>
                 </>
               )}
             </div>
           )}
 
           {/* Batches tab */}
           {activeTab === 'batches' && (
             <div className="space-y-4">
               {/* Material selector */}
               <div className="flex items-center gap-3">
                 <label className="text-[12px] text-[var(--color-text-tertiary)] shrink-0">Material:</label>
                 <select
                   value={selectedMaterial?.id ?? ''}
                   onChange={e => {
                     const id = Number(e.target.value);
                     const m = materials.find(m => m.id === id);
                     if (m) void loadBatches(m);
                   }}
                   className="px-3 py-1.5 text-[12px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]"
                 >
                   <option value="">Select a material</option>
                   {materials.map(m => (
                     <option key={m.id} value={m.id}>{m.name}</option>
                   ))}
                 </select>
               </div>
 
               {!selectedMaterial ? (
                 <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
                   <div className="flex flex-col items-center justify-center py-12 gap-2">
                     <Database size={24} className="text-[var(--color-text-tertiary)]" />
                     <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Select a material</p>
                     <p className="text-[12px] text-[var(--color-text-tertiary)]">
                       Choose a raw material to view its batch records.
                     </p>
                   </div>
                 </div>
               ) : batchesLoading ? (
                 <div className="space-y-3">
                   {Array.from({ length: 4 }).map((_, i) => (
                     <Skeleton key={i} className="h-12 w-full rounded-lg" />
                   ))}
                 </div>
               ) : (
                 <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
                   <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between gap-3">
                     <div>
                       <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{selectedMaterial.name}</p>
                       <p className="text-[11px] text-[var(--color-text-tertiary)]">
                         {batches.length} batch{batches.length !== 1 ? 'es' : ''} on record
                       </p>
                     </div>
                     <button
                       type="button"
                       onClick={() => setIntakeOpen(true)}
                       className="flex items-center gap-1.5 px-3 h-7 rounded-lg border border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                     >
                       <ArrowDownToLine size={12} />
                       Record Intake
                     </button>
                   </div>
 
                   {batches.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-10 gap-2">
                       <Layers size={20} className="text-[var(--color-text-tertiary)]" />
                       <p className="text-[13px] font-medium text-[var(--color-text-primary)]">No batches recorded</p>
                       <p className="text-[12px] text-[var(--color-text-tertiary)]">
                         Record an intake to add a batch for {selectedMaterial.name}.
                       </p>
                     </div>
                   ) : (
                     <div className="overflow-x-auto">
                       <table className="w-full text-[12px]">
                         <thead>
                           <tr className="border-b border-[var(--color-border-subtle)]">
                             {['Batch Code', 'Supplier', 'Received Date', 'Quantity', 'Cost/Unit', 'Notes'].map(h => (
                               <th key={h} className="px-4 py-2.5 text-left font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px]">
                                 {h}
                               </th>
                             ))}
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-[var(--color-border-subtle)]">
                           {batches.map(batch => (
                             <tr key={batch.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                               <td className="px-4 py-3 font-medium text-[var(--color-text-primary)] font-mono text-[11px]">
                                 {batch.batchCode ?? `#${batch.id}`}
                               </td>
                               <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                                 {batch.supplierName ?? `ID: ${batch.supplierId}`}
                               </td>
                               <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">
                                 {fmtDate(batch.receivedAt)}
                               </td>
                               <td className="px-4 py-3 tabular-nums font-medium text-[var(--color-text-primary)]">
                                 {fmtNum(batch.quantity)} {batch.unit}
                               </td>
                               <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">
                                 {fmtCurrency(batch.costPerUnit)}
                               </td>
                               <td className="px-4 py-3 text-[var(--color-text-tertiary)]">
                                 {batch.notes ?? '—'}
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   )}
                 </div>
               )}
             </div>
           )}
         </>
       )}
 
       {/* Record Intake Modal */}
       <Modal isOpen={intakeOpen} onClose={() => setIntakeOpen(false)} title="Record Raw Material Intake">
         {materials.length > 0 ? (
           <IntakeForm
             materials={materials}
             onSave={handleIntake}
             onCancel={() => setIntakeOpen(false)}
             saving={saving}
           />
         ) : (
           <p className="p-4 text-[13px] text-[var(--color-text-secondary)]">
             No raw materials available. Please add raw materials first.
           </p>
         )}
       </Modal>
     </div>
   );
 }

 /**
  * ProductionLogsPage
  *
  * Lists production logs and allows:
  *  - Create: brand/product selectors, materials with quantities, batch size,
  *            labor/overhead costs, notes
  *  - Detail view: all materials, cost breakdown, timestamps, packing records
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import { Plus, X, ChevronRight, Beaker } from 'lucide-react';
 import { format } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { Modal } from '@/components/ui/Modal';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { factoryApi } from '@/lib/factoryApi';
 import type {
   ProductionLogDto,
   ProductionLogDetailDto,
   ProductionBrandDto,
   ProductionProductDto,
   RawMaterialDto,
   ProductionLogRequest,
   MaterialUsageRequest,
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
 
 function fmtCurrency(val: number | undefined): string {
   if (val === undefined || val === null) return '—';
   return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
 }
 
 const STATUS_LABELS: Record<string, string> = {
   READY_TO_PACK: 'Ready to Pack',
   PARTIAL_PACKED: 'Partially Packed',
   FULLY_PACKED: 'Fully Packed',
 };
 
 function statusBadgeVariant(status: string | undefined): 'success' | 'warning' | 'default' {
   switch (status) {
     case 'READY_TO_PACK':
       return 'success';
     case 'PARTIAL_PACKED':
       return 'warning';
     case 'FULLY_PACKED':
     default:
       return 'default';
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Material line type for the form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface MaterialLine {
   rawMaterialId: string;
   quantity: string;
   unitOfMeasure: string;
 }
 
 const emptyMaterialLine = (): MaterialLine => ({
   rawMaterialId: '',
   quantity: '',
   unitOfMeasure: 'kg',
 });
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Form state
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface LogFormState {
   brandId: string;
   productId: string;
   batchColour: string;
   batchSize: string;
   unitOfMeasure: string;
   producedAt: string;
   laborCost: string;
   overheadCost: string;
   notes: string;
   addToFinishedGoods: boolean;
 }
 
 const emptyLogForm = (): LogFormState => ({
   brandId: '',
   productId: '',
   batchColour: '',
   batchSize: '',
   unitOfMeasure: 'L',
   producedAt: new Date().toISOString().split('T')[0],
   laborCost: '',
   overheadCost: '',
   notes: '',
   addToFinishedGoods: true,
 });
 
 interface LogFormErrors {
   brandId?: string;
   productId?: string;
   batchSize?: string;
   materials?: string;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Detail Panel
 // ─────────────────────────────────────────────────────────────────────────────
 
 function DetailPanel({
   detail,
   isLoading,
 }: {
   detail: ProductionLogDetailDto | null;
   isLoading: boolean;
 }) {
   if (isLoading) {
     return (
       <div className="space-y-3 p-5">
         <Skeleton height={18} width="60%" />
         <Skeleton height={14} width="40%" />
         <Skeleton height={100} className="mt-3" />
       </div>
     );
   }
 
   if (!detail) {
     return (
       <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
         <Beaker size={32} className="mb-2.5 text-[var(--color-text-tertiary)] opacity-30" />
         <p className="text-[13px] text-[var(--color-text-tertiary)]">
           Select a log to view details.
         </p>
       </div>
     );
   }
 
   const totalMaterialCost =
     detail.materials?.reduce((sum, m) => sum + (m.totalCost ?? 0), 0) ?? 0;
   const totalCost =
     totalMaterialCost + (detail.laborCost ?? 0) + (detail.overheadCost ?? 0);
 
   return (
     <div className="p-5 space-y-5">
       {/* Header */}
       <div>
         <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
           Production Log
         </p>
         <h3 className="mt-0.5 text-[15px] font-semibold text-[var(--color-text-primary)]">
           {detail.productName ?? '—'}
         </h3>
         {detail.productionCode && (
           <p className="text-[12px] font-mono text-[var(--color-text-tertiary)]">
             {detail.productionCode}
           </p>
         )}
       </div>
 
       {/* Key stats */}
       <div className="grid grid-cols-2 gap-2">
         {[
           { label: 'Output', value: `${detail.mixedQuantity ?? detail.batchSize ?? '—'} ${detail.unitOfMeasure ?? ''}` },
           { label: 'Date', value: fmtDate(detail.producedAt ?? detail.createdAt) },
           { label: 'Labor Cost', value: fmtCurrency(detail.laborCost) },
           { label: 'Overhead', value: fmtCurrency(detail.overheadCost) },
         ].map(({ label, value }) => (
           <div key={label} className="rounded-lg bg-[var(--color-surface-secondary)] px-3 py-2.5">
             <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
               {label}
             </p>
             <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
               {value}
             </p>
           </div>
         ))}
       </div>
 
       {/* Status */}
       {detail.status && (
         <div className="flex items-center gap-2">
           <Badge variant={statusBadgeVariant(detail.status)}>
             {STATUS_LABELS[detail.status] ?? detail.status}
           </Badge>
         </div>
       )}
 
       {/* Materials */}
       {detail.materials && detail.materials.length > 0 && (
         <div>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
             Materials Used
           </p>
           <div className="space-y-1.5">
             {detail.materials.map((mat, idx) => (
               <div
                 key={idx}
                 className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-secondary)] rounded-lg"
               >
                 <span className="text-[13px] text-[var(--color-text-primary)] truncate">
                   {mat.materialName ?? `Material #${mat.rawMaterialId}`}
                 </span>
                 <span className="text-[12px] tabular-nums text-[var(--color-text-secondary)] shrink-0 ml-3">
                   {mat.quantity} {mat.unitOfMeasure ?? ''}
                 </span>
               </div>
             ))}
           </div>
         </div>
       )}
 
       {/* Cost summary */}
       <div className="pt-3 border-t border-[var(--color-border-subtle)]">
         <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
           Cost Summary
         </p>
         <div className="space-y-1.5 text-[13px]">
           <div className="flex justify-between">
             <span className="text-[var(--color-text-secondary)]">Materials</span>
             <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
               {fmtCurrency(totalMaterialCost)}
             </span>
           </div>
           <div className="flex justify-between">
             <span className="text-[var(--color-text-secondary)]">Labor</span>
             <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
               {fmtCurrency(detail.laborCost)}
             </span>
           </div>
           <div className="flex justify-between">
             <span className="text-[var(--color-text-secondary)]">Overhead</span>
             <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
               {fmtCurrency(detail.overheadCost)}
             </span>
           </div>
           <div className="flex justify-between pt-1.5 border-t border-[var(--color-border-subtle)]">
             <span className="font-semibold text-[var(--color-text-primary)]">Total</span>
             <span className="tabular-nums font-semibold text-[var(--color-text-primary)]">
               {fmtCurrency(totalCost)}
             </span>
           </div>
         </div>
       </div>
 
       {/* Packing records */}
       {detail.packingRecords && detail.packingRecords.length > 0 && (
         <div>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
             Packing Records
           </p>
           <div className="space-y-1.5">
             {detail.packingRecords.map((rec, idx) => (
               <div
                 key={idx}
                 className="px-3 py-2 bg-[var(--color-surface-secondary)] rounded-lg text-[12px]"
               >
                 <span className="font-medium text-[var(--color-text-primary)]">
                   {rec.sizeVariantLabel ?? rec.packagingSize ?? `Record ${idx + 1}`}
                 </span>
                 {rec.piecesCount != null && (
                   <span className="ml-2 text-[var(--color-text-secondary)]">
                     {rec.piecesCount} pcs
                   </span>
                 )}
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function ProductionLogsPage() {
   const [logs, setLogs] = useState<ProductionLogDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Detail panel
   const [selectedLog, setSelectedLog] = useState<ProductionLogDetailDto | null>(null);
   const [detailLoading, setDetailLoading] = useState(false);
 
   // Create modal
   const [showCreate, setShowCreate] = useState(false);
   const [logForm, setLogForm] = useState<LogFormState>(emptyLogForm());
   const [formErrors, setFormErrors] = useState<LogFormErrors>({});
   const [materials, setMaterials] = useState<MaterialLine[]>([emptyMaterialLine()]);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);
 
   // Reference data
   const [brands, setBrands] = useState<ProductionBrandDto[]>([]);
   const [products, setProducts] = useState<ProductionProductDto[]>([]);
   const [rawMaterials, setRawMaterials] = useState<RawMaterialDto[]>([]);
   const [refLoading, setRefLoading] = useState(false);
 
   const loadLogs = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await factoryApi.getProductionLogs();
       setLogs(data);
     } catch {
       setError("Couldn't load production logs.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadLogs();
   }, [loadLogs]);
 
   // ── Load detail ──────────────────────────────────────────────────────────
 
   async function handleSelectLog(log: ProductionLogDto) {
     if (!log.id) return;
     setDetailLoading(true);
     try {
       const detail = await factoryApi.getProductionLogDetail(log.id);
       setSelectedLog(detail);
     } catch {
       setSelectedLog(log as ProductionLogDetailDto);
     } finally {
       setDetailLoading(false);
     }
   }
 
   // ── Open create ──────────────────────────────────────────────────────────
 
   async function openCreate() {
     setLogForm(emptyLogForm());
     setMaterials([emptyMaterialLine()]);
     setFormErrors({});
     setSubmitError(null);
     setProducts([]);
     setShowCreate(true);
 
     if (brands.length === 0 || rawMaterials.length === 0) {
       setRefLoading(true);
       try {
         const [brandsData, rawData] = await Promise.all([
           factoryApi.getProductionBrands(),
           factoryApi.getRawMaterials(),
         ]);
         setBrands(brandsData);
         setRawMaterials(rawData);
       } catch {
         // non-fatal — user can still try
       } finally {
         setRefLoading(false);
       }
     }
   }
 
   async function handleBrandChange(brandId: string) {
     setLogForm((f) => ({ ...f, brandId, productId: '' }));
     setProducts([]);
     if (!brandId) return;
     try {
       const prods = await factoryApi.getBrandProducts(Number(brandId));
       setProducts(prods);
     } catch {
       // no-op
     }
   }
 
   // ── Material line helpers ────────────────────────────────────────────────
 
   function addMaterial() {
     setMaterials((prev) => [...prev, emptyMaterialLine()]);
   }
 
   function removeMaterial(idx: number) {
     setMaterials((prev) => prev.filter((_, i) => i !== idx));
   }
 
   function updateMaterial(idx: number, field: keyof MaterialLine, value: string) {
     setMaterials((prev) => {
       const copy = [...prev];
       copy[idx] = { ...copy[idx], [field]: value };
       // Auto-fill unit from raw material
       if (field === 'rawMaterialId' && value) {
         const rm = rawMaterials.find((r) => String(r.id) === value);
         if (rm?.unitType) copy[idx].unitOfMeasure = rm.unitType;
       }
       return copy;
     });
   }
 
   // ── Submit ───────────────────────────────────────────────────────────────
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     const errors: LogFormErrors = {};
     if (!logForm.brandId) errors.brandId = 'Select a brand';
     if (!logForm.productId) errors.productId = 'Select a product';
     const qty = parseFloat(logForm.batchSize);
     if (!logForm.batchSize || isNaN(qty) || qty <= 0) errors.batchSize = 'Enter a positive batch size';
     const validMaterials = materials.filter((m) => m.rawMaterialId && parseFloat(m.quantity) > 0);
     if (validMaterials.length === 0) errors.materials = 'Add at least one material usage line';
 
     if (Object.keys(errors).length > 0) {
       setFormErrors(errors);
       return;
     }
     setFormErrors({});
     setIsSubmitting(true);
     setSubmitError(null);
 
     const payload: ProductionLogRequest = {
       brandId: Number(logForm.brandId),
       productId: Number(logForm.productId),
       batchColour: logForm.batchColour || undefined,
       batchSize: qty,
       unitOfMeasure: logForm.unitOfMeasure || undefined,
       mixedQuantity: qty,
       producedAt: logForm.producedAt || undefined,
       notes: logForm.notes.trim() || undefined,
       laborCost: logForm.laborCost ? parseFloat(logForm.laborCost) : undefined,
       overheadCost: logForm.overheadCost ? parseFloat(logForm.overheadCost) : undefined,
       addToFinishedGoods: logForm.addToFinishedGoods,
       materials: validMaterials.map(
         (m): MaterialUsageRequest => ({
           rawMaterialId: Number(m.rawMaterialId),
           quantity: parseFloat(m.quantity),
           unitOfMeasure: m.unitOfMeasure || undefined,
         }),
       ),
     };
 
     try {
       await factoryApi.createProductionLog(payload);
       setShowCreate(false);
       loadLogs();
     } catch {
       setSubmitError('Failed to create production log. Please try again.');
     } finally {
       setIsSubmitting(false);
     }
   }
 
   // ── Table columns ────────────────────────────────────────────────────────
 
   const columns: Column<ProductionLogDto>[] = [
     {
       id: 'productionCode',
       header: 'Log ID',
       accessor: (row) => (
         <span className="font-mono text-[12px] text-[var(--color-text-secondary)]">
           {row.productionCode ?? `#${row.id}`}
         </span>
       ),
     },
     {
       id: 'product',
       header: 'Brand / Product',
       accessor: (row) => (
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{row.productName ?? '—'}</p>
           <p className="text-[11px] text-[var(--color-text-tertiary)]">{row.brandName ?? '—'}</p>
         </div>
       ),
       sortable: true,
       sortAccessor: (row) => row.productName ?? '',
     },
     {
       id: 'batchSize',
       header: 'Batch Size',
       accessor: (row) => (
         <span className="tabular-nums text-[13px]">
           {row.mixedQuantity ?? row.batchSize ?? '—'} {row.unitOfMeasure ?? ''}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'producedAt',
       header: 'Date',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {fmtDate(row.producedAt ?? row.createdAt)}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={statusBadgeVariant(row.status)}>
           {STATUS_LABELS[row.status ?? ''] ?? row.status ?? '—'}
         </Badge>
       ),
     },
     {
       id: 'detail',
       header: '',
       accessor: (row) => (
         <Button
           size="sm"
           variant="ghost"
           iconOnly
           aria-label="View details"
           onClick={(e) => {
             e.stopPropagation();
             void handleSelectLog(row);
           }}
         >
           <ChevronRight size={13} />
         </Button>
       ),
       align: 'right',
     },
   ];
 
   return (
     <div className="space-y-5">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             Production Logs
           </h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             Track batch output, materials used, and production costs.
           </p>
         </div>
         <Button leftIcon={<Plus size={15} />} onClick={openCreate}>
           Log Production
         </Button>
       </div>
 
       {error && (
         <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] rounded-xl text-[13px] text-[var(--color-error)]">
           <span>{error}</span>
           <button type="button" onClick={loadLogs} className="font-medium underline-offset-2 hover:underline">
             Retry
           </button>
         </div>
       )}
 
       {/* ── Main layout ─────────────────────────────────────────────── */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
         {/* Table */}
         <div className="lg:col-span-2">
           <DataTable
             columns={columns}
             data={logs}
             keyExtractor={(row) => row.id}
             isLoading={isLoading}
             searchable
             searchPlaceholder="Search logs..."
             searchFilter={(row, q) => {
               const term = q.toLowerCase();
               return (
                 (row.productionCode ?? '').toLowerCase().includes(term) ||
                 (row.productName ?? '').toLowerCase().includes(term) ||
                 (row.brandName ?? '').toLowerCase().includes(term)
               );
             }}
             onRowClick={handleSelectLog}
             emptyMessage="No production logs found. Log your first batch."
             pageSize={12}
           />
         </div>
 
         {/* Detail panel */}
         <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-auto max-h-[600px]">
           <DetailPanel detail={selectedLog} isLoading={detailLoading} />
         </div>
       </div>
 
       {/* ── Create Modal ─────────────────────────────────────────────── */}
       <Modal
         isOpen={showCreate}
         onClose={() => setShowCreate(false)}
         title="Log Production Batch"
         size="xl"
         footer={
           <>
             <Button variant="secondary" onClick={() => setShowCreate(false)}>
               Cancel
             </Button>
             <Button
               isLoading={isSubmitting}
               onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
             >
               Log Production
             </Button>
           </>
         }
       >
         <form onSubmit={handleSubmit} className="space-y-4" noValidate>
           {submitError && (
             <p className="text-[12px] text-[var(--color-error)]">{submitError}</p>
           )}
 
           {refLoading && (
             <p className="text-[12px] text-[var(--color-text-tertiary)]">Loading reference data…</p>
           )}
 
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* Brand */}
             <Select
               label="Brand"
               value={logForm.brandId}
               onChange={(e) => void handleBrandChange(e.target.value)}
               error={formErrors.brandId}
               options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
               placeholder="Select brand..."
               required
             />
 
             {/* Product */}
             <Select
               label="Product"
               value={logForm.productId}
               onChange={(e) => setLogForm((f) => ({ ...f, productId: e.target.value }))}
               error={formErrors.productId}
               options={products.map((p) => ({
                 value: String(p.id),
                 label: `${p.productName}${p.skuCode ? ` (${p.skuCode})` : ''}`,
               }))}
               placeholder="Select product..."
               disabled={!logForm.brandId || products.length === 0}
               required
             />
           </div>
 
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <Input
               label="Batch Size"
               type="number"
               value={logForm.batchSize}
               onChange={(e) => setLogForm((f) => ({ ...f, batchSize: e.target.value }))}
               error={formErrors.batchSize}
               placeholder="e.g. 1000"
               required
             />
             <Input
               label="Unit"
               value={logForm.unitOfMeasure}
               onChange={(e) => setLogForm((f) => ({ ...f, unitOfMeasure: e.target.value }))}
               placeholder="e.g. L"
             />
             <Input
               label="Production Date"
               type="date"
               value={logForm.producedAt}
               onChange={(e) => setLogForm((f) => ({ ...f, producedAt: e.target.value }))}
             />
           </div>
 
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Input
               label="Labor Cost (optional)"
               type="number"
               value={logForm.laborCost}
               onChange={(e) => setLogForm((f) => ({ ...f, laborCost: e.target.value }))}
               placeholder="₹0.00"
               min={0}
             />
             <Input
               label="Overhead Cost (optional)"
               type="number"
               value={logForm.overheadCost}
               onChange={(e) => setLogForm((f) => ({ ...f, overheadCost: e.target.value }))}
               placeholder="₹0.00"
               min={0}
             />
           </div>
 
           {/* Materials */}
           <div>
             <div className="flex items-center justify-between mb-2">
               <label className="text-[13px] font-medium text-[var(--color-text-primary)]">
                 Materials Used
               </label>
               <button
                 type="button"
                 onClick={addMaterial}
                 className="flex items-center gap-1 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
               >
                 <Plus size={13} />
                 Add Material
               </button>
             </div>
 
             {formErrors.materials && (
               <p className="text-[12px] text-[var(--color-error)] mb-2">{formErrors.materials}</p>
             )}
 
             <div className="space-y-2 max-h-[240px] overflow-y-auto">
               {materials.map((mat, idx) => (
                 <div
                   key={idx}
                   className="flex items-center gap-2 p-2.5 bg-[var(--color-surface-secondary)] rounded-lg"
                 >
                   {/* Material select */}
                   <div className="flex-1 min-w-0">
                     <select
                       value={mat.rawMaterialId}
                       onChange={(e) => updateMaterial(idx, 'rawMaterialId', e.target.value)}
                       className="w-full h-8 px-2.5 text-[12px] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg appearance-none focus:outline-none focus:border-[var(--color-neutral-300)]"
                     >
                       <option value="">Select material…</option>
                       {rawMaterials.map((rm) => (
                         <option key={rm.id} value={String(rm.id)}>
                           {rm.name}
                         </option>
                       ))}
                     </select>
                   </div>
                   {/* Quantity */}
                   <input
                     type="number"
                     value={mat.quantity}
                     onChange={(e) => updateMaterial(idx, 'quantity', e.target.value)}
                     placeholder="Qty"
                     min={0}
                     className="w-20 h-8 px-2.5 text-[12px] text-right tabular-nums bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-neutral-300)]"
                   />
                   {/* Unit */}
                   <span className="text-[11px] text-[var(--color-text-tertiary)] w-8 shrink-0">
                     {mat.unitOfMeasure}
                   </span>
                   {/* Remove */}
                   {materials.length > 1 && (
                     <button
                       type="button"
                       onClick={() => removeMaterial(idx)}
                       className="shrink-0 p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors"
                       aria-label="Remove material"
                     >
                       <X size={13} />
                     </button>
                   )}
                 </div>
               ))}
             </div>
           </div>
 
           <div className="space-y-1.5">
             <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
               Notes
             </label>
             <textarea
               rows={2}
               value={logForm.notes}
               onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))}
               placeholder="Optional notes..."
               className="w-full px-3 py-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:border-[var(--color-neutral-300)]"
             />
           </div>
 
           {/* Add to finished goods */}
           <label className="flex items-center gap-2.5 cursor-pointer">
             <input
               type="checkbox"
               checked={logForm.addToFinishedGoods}
               onChange={(e) => setLogForm((f) => ({ ...f, addToFinishedGoods: e.target.checked }))}
               className="h-4 w-4 rounded border-[var(--color-border-default)] accent-[var(--color-neutral-900)]"
             />
             <span className="text-[13px] text-[var(--color-text-primary)]">
               Add to finished goods inventory automatically
             </span>
           </label>
         </form>
       </Modal>
     </div>
   );
 }

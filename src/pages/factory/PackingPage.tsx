 /**
  * PackingPage
  *
  * Tabs:
  *   1. Packing Queue — DataTable of unpacked batches (READY_TO_PACK / PARTIAL_PACKED)
  *      - Record Packing: modal to pack lines by size
  *      - Bulk Pack: split bulk batch into size-specific packages
  *      - Complete Packing: irreversible action (ConfirmDialog)
  *   2. Packing History — paginated list of completed packing records
  *      filterable by date and production log
  */

 import { useCallback, useEffect, useReducer, useState } from 'react';
 import { format } from 'date-fns';
 import {
   PackageCheck,
   History,
   Package,
   Layers,
   Info,
 } from 'lucide-react';
 import { v4 as uuidv4 } from 'uuid';
 import { Tabs } from '@/components/ui/Tabs';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { Modal } from '@/components/ui/Modal';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { factoryApi } from '@/lib/factoryApi';
 import type {
   UnpackedBatchDto,
   PackingRequest,
   PackingLineRequest,
   ProductionLogDto,
   PackingRecordDto,
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

 function fmtNum(n: number | undefined): string {
   if (n === undefined || n === null) return '—';
   return n.toLocaleString();
 }

 type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

 function statusVariant(status: string | undefined): StatusVariant {
   switch (status) {
     case 'READY_TO_PACK': return 'info';
     case 'PARTIAL_PACKED': return 'warning';
     case 'FULLY_PACKED': return 'success';
     default: return 'default';
   }
 }

 function statusLabel(status: string | undefined): string {
   switch (status) {
     case 'READY_TO_PACK': return 'Ready to Pack';
     case 'PARTIAL_PACKED': return 'Partial';
     case 'FULLY_PACKED': return 'Fully Packed';
     default: return status ?? '—';
   }
 }

 const PACKAGE_SIZES = ['1L', '4L', '10L', '20L', '200L', 'Bulk'];

 // ─────────────────────────────────────────────────────────────────────────────
 // Record Packing Modal
 // ─────────────────────────────────────────────────────────────────────────────

 interface PackingLine {
   id: string;
   packagingSize: string;
   quantityLiters: string;
   piecesCount: string;
   boxesCount: string;
 }

 function emptyLine(): PackingLine {
   return { id: uuidv4(), packagingSize: '4L', quantityLiters: '', piecesCount: '', boxesCount: '' };
 }

 interface RecordPackingFormState {
   packedBy: string;
   packedDate: string;
   lines: PackingLine[];
 }

 function initialPackingForm(): RecordPackingFormState {
   return {
     packedBy: '',
     packedDate: format(new Date(), 'yyyy-MM-dd'),
     lines: [emptyLine()],
   };
 }

 interface RecordPackingModalProps {
   isOpen: boolean;
   batch: UnpackedBatchDto | null;
   onClose: () => void;
   onSuccess: () => void;
 }

 function RecordPackingModal({ isOpen, batch, onClose, onSuccess }: RecordPackingModalProps) {
   const [form, setForm] = useState<RecordPackingFormState>(initialPackingForm());
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
     if (isOpen) {
       setForm(initialPackingForm());
       setError(null);
     }
   }, [isOpen]);

   function updateLine(id: string, field: keyof PackingLine, value: string) {
     setForm((f) => ({
       ...f,
       lines: f.lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
     }));
   }

   function addLine() {
     setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
   }

   function removeLine(id: string) {
     setForm((f) => ({
       ...f,
       lines: f.lines.filter((l) => l.id !== id),
     }));
   }

   const remaining = batch?.remainingQuantity ?? 0;
   const totalPacked = form.lines.reduce((sum, l) => {
     const qty = parseFloat(l.quantityLiters);
     return sum + (isNaN(qty) ? 0 : qty);
   }, 0);
   const wouldOverpack = totalPacked > remaining;

   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     if (!batch) return;

     const validLines = form.lines.filter((l) => l.packagingSize && l.quantityLiters);
     if (validLines.length === 0) {
       setError('Add at least one packing line.');
       return;
     }
     if (wouldOverpack) {
       setError(`Total packed (${totalPacked.toLocaleString()} L) exceeds remaining quantity (${remaining.toLocaleString()} L).`);
       return;
     }

     const lines: PackingLineRequest[] = validLines.map((l) => ({
       packagingSize: l.packagingSize,
       quantityLiters: parseFloat(l.quantityLiters) || undefined,
       piecesCount: parseInt(l.piecesCount) || undefined,
       boxesCount: parseInt(l.boxesCount) || undefined,
     }));

     const request: PackingRequest = {
       productionLogId: batch.id,
       packedBy: form.packedBy.trim() || undefined,
       packedDate: form.packedDate || undefined,
       idempotencyKey: uuidv4(),
       lines,
     };

     setIsSubmitting(true);
     setError(null);
     try {
       await factoryApi.recordPacking(request);
       onSuccess();
       onClose();
     } catch {
       setError('Failed to record packing. Please try again.');
     } finally {
       setIsSubmitting(false);
     }
   }

   return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       title="Record Packing"
       size="lg"
       footer={
         <>
           <Button variant="secondary" onClick={onClose}>Cancel</Button>
           <Button
             isLoading={isSubmitting}
             onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
           >
             Save Packing Record
           </Button>
         </>
       }
     >
       <form onSubmit={handleSubmit} className="space-y-4" noValidate>
         {batch && (
           <div className="px-3 py-2.5 bg-[var(--color-surface-tertiary)] rounded-lg text-[12px]">
             <span className="font-medium text-[var(--color-text-primary)]">
               {batch.productionCode}
             </span>
             <span className="mx-2 text-[var(--color-text-tertiary)]">·</span>
             <span className="text-[var(--color-text-secondary)]">{batch.productName}</span>
             <span className="mx-2 text-[var(--color-text-tertiary)]">·</span>
             <span className="tabular-nums text-[var(--color-text-secondary)]">
               {fmtNum(batch.remainingQuantity)} L remaining
             </span>
           </div>
         )}

         {error && (
           <p className="text-[12px] text-[var(--color-error)]">{error}</p>
         )}

         <div className="grid grid-cols-2 gap-3">
           <Input
             label="Packed By (optional)"
             value={form.packedBy}
             onChange={(e) => setForm((f) => ({ ...f, packedBy: e.target.value }))}
             placeholder="Operator name"
           />
           <Input
             label="Packing Date"
             type="date"
             value={form.packedDate}
             onChange={(e) => setForm((f) => ({ ...f, packedDate: e.target.value }))}
           />
         </div>

         {/* Lines */}
         <div className="space-y-2">
           <div className="flex items-center justify-between">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
               Packing Lines
             </p>
             <button
               type="button"
               onClick={addLine}
               className="text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
             >
               + Add line
             </button>
           </div>

           <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
             <div className="grid grid-cols-[120px_1fr_1fr_1fr_32px] gap-0 px-3 py-2 bg-[var(--color-surface-tertiary)] border-b border-[var(--color-border-default)]">
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Size</p>
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Qty (L)</p>
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Pieces</p>
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Boxes</p>
               <p />
             </div>
             {form.lines.map((line) => (
               <div
                 key={line.id}
                 className="grid grid-cols-[120px_1fr_1fr_1fr_32px] gap-0 px-3 py-2 border-b last:border-b-0 border-[var(--color-border-subtle)] items-center"
               >
                 <select
                   value={line.packagingSize}
                   onChange={(e) => updateLine(line.id, 'packagingSize', e.target.value)}
                   className="h-8 px-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-neutral-300)] mr-2"
                 >
                   {PACKAGE_SIZES.map((s) => (
                     <option key={s} value={s}>{s}</option>
                   ))}
                 </select>
                 <input
                   type="number"
                   value={line.quantityLiters}
                   onChange={(e) => updateLine(line.id, 'quantityLiters', e.target.value)}
                   placeholder="0"
                   min={0}
                   className="h-8 px-2 mr-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[12px] text-[var(--color-text-primary)] tabular-nums focus:outline-none focus:border-[var(--color-neutral-300)] w-full"
                 />
                 <input
                   type="number"
                   value={line.piecesCount}
                   onChange={(e) => updateLine(line.id, 'piecesCount', e.target.value)}
                   placeholder="0"
                   min={0}
                   className="h-8 px-2 mr-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[12px] text-[var(--color-text-primary)] tabular-nums focus:outline-none focus:border-[var(--color-neutral-300)] w-full"
                 />
                 <input
                   type="number"
                   value={line.boxesCount}
                   onChange={(e) => updateLine(line.id, 'boxesCount', e.target.value)}
                   placeholder="0"
                   min={0}
                   className="h-8 px-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[12px] text-[var(--color-text-primary)] tabular-nums focus:outline-none focus:border-[var(--color-neutral-300)] w-full"
                 />
                 <button
                   type="button"
                   onClick={() => removeLine(line.id)}
                   disabled={form.lines.length === 1}
                   className="ml-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                   <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                     <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                   </svg>
                 </button>
               </div>
             ))}
           </div>

           {/* Running total */}
           <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-[12px] ${
             wouldOverpack
               ? 'bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] text-[var(--color-error)]'
               : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]'
           }`}>
             <span>Total packed</span>
             <span className="tabular-nums font-medium">
               {totalPacked.toLocaleString()} / {fmtNum(batch?.remainingQuantity)} L
               {wouldOverpack && ' — exceeds remaining!'}
             </span>
           </div>
         </div>
       </form>
     </Modal>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Bulk Pack Modal
 // ─────────────────────────────────────────────────────────────────────────────

 interface BulkPackLine {
   id: string;
   sizeLabel: string;
   childSkuId: string;
   quantity: string;
 }

 function emptyBulkLine(): BulkPackLine {
   return { id: uuidv4(), sizeLabel: '1L', childSkuId: '', quantity: '' };
 }

 interface BulkPackModalProps {
   isOpen: boolean;
   batch: UnpackedBatchDto | null;
   onClose: () => void;
   onSuccess: () => void;
 }

 function BulkPackModal({ isOpen, batch, onClose, onSuccess }: BulkPackModalProps) {
   const [lines, setLines] = useState<BulkPackLine[]>([emptyBulkLine()]);
   const [packedBy, setPackedBy] = useState('');
   const [notes, setNotes] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
     if (isOpen) {
       setLines([emptyBulkLine()]);
       setPackedBy('');
       setNotes('');
       setError(null);
     }
   }, [isOpen]);

   function updateLine(id: string, field: keyof BulkPackLine, value: string) {
     setLines((ls) => ls.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
   }

   function addLine() {
     setLines((ls) => [...ls, emptyBulkLine()]);
   }

   function removeLine(id: string) {
     setLines((ls) => ls.filter((l) => l.id !== id));
   }

   const batchQty = batch?.mixedQuantity ?? 0;
   const totalPacked = lines.reduce((sum, l) => {
     const qty = parseFloat(l.quantity);
     return sum + (isNaN(qty) ? 0 : qty);
   }, 0);
   const remainsPacked = Math.abs(totalPacked - batchQty) < 0.001;
   const wouldOverpack = totalPacked > batchQty;
   const isUnderpack = totalPacked < batchQty;

   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     if (!batch) return;

     if (wouldOverpack) {
       setError(`Total (${totalPacked.toLocaleString()} L) exceeds batch quantity (${batchQty.toLocaleString()} L). Overpacking is not allowed.`);
       return;
     }
     if (isUnderpack) {
       setError(`Total (${totalPacked.toLocaleString()} L) is less than batch quantity (${batchQty.toLocaleString()} L). All batch quantity must be allocated.`);
       return;
     }

     const validLines = lines.filter((l) => l.quantity && l.childSkuId);
     if (validLines.length === 0) {
       setError('Add at least one packing line with SKU and quantity.');
       return;
     }

     setIsSubmitting(true);
     setError(null);
     try {
       await factoryApi.bulkPack({
         bulkBatchId: batch.id,
         packs: validLines.map((l) => ({
           childSkuId: parseInt(l.childSkuId),
           quantity: parseFloat(l.quantity),
           sizeLabel: l.sizeLabel,
         })),
         packedBy: packedBy.trim() || undefined,
         notes: notes.trim() || undefined,
         idempotencyKey: uuidv4(),
       });
       onSuccess();
       onClose();
     } catch {
       setError('Failed to complete bulk pack. Please try again.');
     } finally {
       setIsSubmitting(false);
     }
   }

   return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       title="Bulk Pack — Split to Sizes"
       size="lg"
       footer={
         <>
           <Button variant="secondary" onClick={onClose}>Cancel</Button>
           <Button
             isLoading={isSubmitting}
             disabled={wouldOverpack || isUnderpack}
             onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
           >
             Confirm Bulk Pack
           </Button>
         </>
       }
     >
       <form onSubmit={handleSubmit} className="space-y-4" noValidate>
         {batch && (
           <div className="px-3 py-2.5 bg-[var(--color-surface-tertiary)] rounded-lg text-[12px] flex items-center gap-3">
             <Layers size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
             <div className="flex-1 min-w-0">
               <span className="font-medium text-[var(--color-text-primary)]">
                 {batch.productionCode}
               </span>
               <span className="mx-2 text-[var(--color-text-tertiary)]">·</span>
               <span className="text-[var(--color-text-secondary)]">{batch.productName}</span>
             </div>
             <span className="tabular-nums text-[var(--color-text-secondary)] shrink-0">
               Batch: <strong>{fmtNum(batch.mixedQuantity)} L</strong>
             </span>
           </div>
         )}

         {/* Info about bulk pack */}
         <div className="flex items-start gap-2 px-3 py-2.5 bg-[var(--color-surface-tertiary)] rounded-lg">
           <Info size={13} className="text-[var(--color-text-tertiary)] mt-0.5 shrink-0" />
           <p className="text-[12px] text-[var(--color-text-secondary)]">
             All quantities across sizes must exactly equal the batch quantity. Overpacking is prevented.
           </p>
         </div>

         {error && (
           <p className="text-[12px] text-[var(--color-error)]">{error}</p>
         )}

         <div className="grid grid-cols-2 gap-3">
           <Input
             label="Packed By (optional)"
             value={packedBy}
             onChange={(e) => setPackedBy(e.target.value)}
             placeholder="Operator name"
           />
           <div className="space-y-1.5">
             <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
               Notes (optional)
             </label>
             <textarea
               rows={1}
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Add notes..."
               className="w-full px-3 py-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:border-[var(--color-neutral-300)]"
             />
           </div>
         </div>

         {/* Size pack lines */}
         <div className="space-y-2">
           <div className="flex items-center justify-between">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
               Size Allocations
             </p>
             <button
               type="button"
               onClick={addLine}
               className="text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
             >
               + Add size
             </button>
           </div>

           <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
             <div className="grid grid-cols-[100px_1fr_1fr_32px] gap-0 px-3 py-2 bg-[var(--color-surface-tertiary)] border-b border-[var(--color-border-default)]">
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Size</p>
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Child SKU ID</p>
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Qty (L)</p>
               <p />
             </div>
             {lines.map((line) => (
               <div
                 key={line.id}
                 className="grid grid-cols-[100px_1fr_1fr_32px] gap-0 px-3 py-2 border-b last:border-b-0 border-[var(--color-border-subtle)] items-center"
               >
                 <select
                   value={line.sizeLabel}
                   onChange={(e) => updateLine(line.id, 'sizeLabel', e.target.value)}
                   className="h-8 px-2 mr-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-neutral-300)]"
                 >
                   {PACKAGE_SIZES.map((s) => (
                     <option key={s} value={s}>{s}</option>
                   ))}
                 </select>
                 <input
                   type="number"
                   value={line.childSkuId}
                   onChange={(e) => updateLine(line.id, 'childSkuId', e.target.value)}
                   placeholder="SKU ID"
                   min={1}
                   className="h-8 px-2 mr-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[12px] text-[var(--color-text-primary)] tabular-nums focus:outline-none focus:border-[var(--color-neutral-300)] w-full"
                 />
                 <input
                   type="number"
                   value={line.quantity}
                   onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                   placeholder="0"
                   min={0}
                   step="0.001"
                   className="h-8 px-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[12px] text-[var(--color-text-primary)] tabular-nums focus:outline-none focus:border-[var(--color-neutral-300)] w-full"
                 />
                 <button
                   type="button"
                   onClick={() => removeLine(line.id)}
                   disabled={lines.length === 1}
                   className="ml-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                   <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                     <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                   </svg>
                 </button>
               </div>
             ))}
           </div>

           {/* Running total */}
           <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-[12px] ${
             wouldOverpack
               ? 'bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] text-[var(--color-error)]'
               : remainsPacked
                 ? 'bg-[var(--color-success-bg)] border border-[var(--color-success-border-subtle)] text-[var(--color-success-text)]'
                 : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]'
           }`}>
             <span>Total across sizes</span>
             <span className="tabular-nums font-medium">
               {totalPacked.toLocaleString()} / {batchQty.toLocaleString()} L
               {wouldOverpack && ' — overpacking not allowed!'}
               {remainsPacked && ' — exact match'}
             </span>
           </div>
         </div>
       </form>
     </Modal>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Packing Queue Tab
 // ─────────────────────────────────────────────────────────────────────────────

 function PackingQueueTab() {
   const [batches, setBatches] = useState<UnpackedBatchDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Record packing modal
   const [recordBatch, setRecordBatch] = useState<UnpackedBatchDto | null>(null);
   const [showRecord, setShowRecord] = useState(false);

   // Bulk pack modal
   const [bulkBatch, setBulkBatch] = useState<UnpackedBatchDto | null>(null);
   const [showBulk, setShowBulk] = useState(false);

   // Complete packing confirm
   const [completeBatch, setCompleteBatch] = useState<UnpackedBatchDto | null>(null);
   const [showComplete, setShowComplete] = useState(false);
   const [isCompleting, setIsCompleting] = useState(false);

   const loadBatches = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await factoryApi.getUnpackedBatches();
       setBatches(data);
     } catch {
       setError("Couldn't load unpacked batches.");
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     void loadBatches();
   }, [loadBatches]);

   async function handleComplete() {
     if (!completeBatch) return;
     setIsCompleting(true);
     try {
       await factoryApi.completePacking(completeBatch.id);
       setShowComplete(false);
       setCompleteBatch(null);
       void loadBatches();
     } catch {
       // keep dialog open on error
     } finally {
       setIsCompleting(false);
     }
   }

   const columns: Column<UnpackedBatchDto>[] = [
     {
       id: 'productionCode',
       header: 'Production Code',
       accessor: (row) => (
         <span className="font-mono text-[13px] font-medium text-[var(--color-text-primary)]">
           {row.productionCode ?? '—'}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.productionCode ?? '',
     },
     {
       id: 'product',
       header: 'Product',
       accessor: (row) => (
         <div>
           <p className="text-[13px] text-[var(--color-text-primary)]">{row.productName ?? '—'}</p>
           {row.brandName && (
             <p className="text-[11px] text-[var(--color-text-tertiary)]">{row.brandName}</p>
           )}
         </div>
       ),
     },
     {
       id: 'mixed',
       header: 'Batch Qty (L)',
       accessor: (row) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-primary)]">
           {fmtNum(row.mixedQuantity)}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'packed',
       header: 'Packed (L)',
       accessor: (row) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-secondary)]">
           {fmtNum(row.packedQuantity)}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'remaining',
       header: 'Remaining (L)',
       accessor: (row) => (
         <span className={`tabular-nums text-[13px] font-medium ${
           (row.remainingQuantity ?? 0) > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'
         }`}>
           {fmtNum(row.remainingQuantity)}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={statusVariant(row.status)} dot>
           {statusLabel(row.status)}
         </Badge>
       ),
       hideOnMobile: true,
     },
     {
       id: 'producedAt',
       header: 'Date',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {fmtDate(row.producedAt)}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'actions',
       header: '',
       accessor: (row) => (
         <div className="flex items-center gap-2 justify-end">
           <button
             type="button"
             onClick={() => { setRecordBatch(row); setShowRecord(true); }}
             className="h-7 px-2.5 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
           >
             Record
           </button>
           <button
             type="button"
             onClick={() => { setBulkBatch(row); setShowBulk(true); }}
             className="h-7 px-2.5 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
           >
             Bulk Pack
           </button>
           <button
             type="button"
             onClick={() => { setCompleteBatch(row); setShowComplete(true); }}
             className="h-7 px-2.5 rounded-lg text-[12px] font-medium text-white bg-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-800)] transition-colors"
           >
             Complete
           </button>
         </div>
       ),
       align: 'right',
     },
   ];

   return (
     <div className="space-y-4">
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
         searchPlaceholder="Search by product or code..."
         searchFilter={(row, q) => {
           const query = q.toLowerCase();
           return (
             (row.productionCode ?? '').toLowerCase().includes(query) ||
             (row.productName ?? '').toLowerCase().includes(query) ||
             (row.brandName ?? '').toLowerCase().includes(query)
           );
         }}
         emptyMessage="No unpacked batches found. All production batches are packed or no batches have been created yet."
         pageSize={15}
       />

       <RecordPackingModal
         isOpen={showRecord}
         batch={recordBatch}
         onClose={() => setShowRecord(false)}
         onSuccess={loadBatches}
       />

       <BulkPackModal
         isOpen={showBulk}
         batch={bulkBatch}
         onClose={() => setShowBulk(false)}
         onSuccess={loadBatches}
       />

       <ConfirmDialog
         isOpen={showComplete}
         title="Complete Packing"
         message={`Are you sure you want to mark packing for "${completeBatch?.productionCode}" as complete? This action is irreversible and will move the batch to finished goods.`}
         confirmLabel="Complete Packing"
         cancelLabel="Cancel"
         variant="default"
         isLoading={isCompleting}
         onConfirm={handleComplete}
         onCancel={() => { setShowComplete(false); setCompleteBatch(null); }}
       />
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Packing History Tab
 // ─────────────────────────────────────────────────────────────────────────────

 type HistoryState =
   | { type: 'idle' }
   | { type: 'loading' }
   | { type: 'error'; message: string }
   | { type: 'loaded'; records: PackingRecordDto[] };

 type HistoryAction =
   | { type: 'LOADING' }
   | { type: 'SUCCESS'; records: PackingRecordDto[] }
   | { type: 'ERROR'; message: string };

 function historyReducer(_: HistoryState, action: HistoryAction): HistoryState {
   switch (action.type) {
     case 'LOADING': return { type: 'loading' };
     case 'SUCCESS': return { type: 'loaded', records: action.records };
     case 'ERROR': return { type: 'error', message: action.message };
   }
 }

 function PackingHistoryTab() {
   const [productionLogs, setProductionLogs] = useState<ProductionLogDto[]>([]);
   const [selectedLogId, setSelectedLogId] = useState('');
   const [dateFrom, setDateFrom] = useState('');
   const [dateTo, setDateTo] = useState('');
   const [historyState, dispatch] = useReducer(historyReducer, { type: 'idle' });

   // Load production logs for dropdown
   useEffect(() => {
     factoryApi.getProductionLogs()
       .then((logs) => setProductionLogs(logs))
       .catch(() => { /* non-fatal */ });
   }, []);

   async function loadHistory() {
     if (!selectedLogId) return;
     dispatch({ type: 'LOADING' });
     try {
       const records = await factoryApi.getPackingHistory(parseInt(selectedLogId));
       dispatch({ type: 'SUCCESS', records });
     } catch {
       dispatch({ type: 'ERROR', message: "Couldn't load packing history." });
     }
   }

   const records = historyState.type === 'loaded' ? historyState.records : [];

   // Filter by date if provided
   const filteredRecords = records.filter((r) => {
     if (dateFrom && r.packedDate && r.packedDate < dateFrom) return false;
     if (dateTo && r.packedDate && r.packedDate > dateTo + 'T23:59:59Z') return false;
     return true;
   });

   const historyColumns: Column<PackingRecordDto>[] = [
     {
       id: 'id',
       header: 'Record ID',
       accessor: (row) => (
         <span className="font-mono text-[12px] text-[var(--color-text-secondary)]">
           #{row.id ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'productionCode',
       header: 'Production Code',
       accessor: (row) => (
         <span className="font-mono text-[13px] font-medium text-[var(--color-text-primary)]">
           {row.productionCode ?? '—'}
         </span>
       ),
     },
     {
       id: 'product',
       header: 'Product',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {row.productName ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'sizes',
       header: 'Sizes',
       accessor: (row) => (
         <div className="flex flex-wrap gap-1">
           {(row.lines ?? []).map((line, idx) => (
             <span
               key={idx}
               className="inline-flex items-center px-1.5 py-0.5 bg-[var(--color-surface-tertiary)] rounded text-[11px] tabular-nums text-[var(--color-text-secondary)]"
             >
               {line.sizeVariantLabel ?? line.packagingSize}: {fmtNum(line.quantityLiters)}L
             </span>
           ))}
           {(!row.lines || row.lines.length === 0) && (
             <span className="text-[12px] text-[var(--color-text-tertiary)]">—</span>
           )}
         </div>
       ),
       hideOnMobile: true,
     },
     {
       id: 'packedBy',
       header: 'Operator',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {row.packedBy ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'packedDate',
       header: 'Date',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {fmtDate(row.packedDate ?? row.createdAt)}
         </span>
       ),
     },
   ];

   return (
     <div className="space-y-4">
       {/* Filters */}
       <div className="flex flex-col sm:flex-row gap-3">
         <div className="flex-1">
           <Select
             label="Select Production Log"
             value={selectedLogId}
             onChange={(e) => setSelectedLogId(e.target.value)}
             options={productionLogs.map((l) => ({
               value: String(l.id),
               label: `${l.productionCode ?? `Log #${l.id}`} — ${l.productName ?? ''}`,
             }))}
             placeholder="Select a production log..."
           />
         </div>
         <Input
           label="From Date"
           type="date"
           value={dateFrom}
           onChange={(e) => setDateFrom(e.target.value)}
           className="w-full sm:w-40"
         />
         <Input
           label="To Date"
           type="date"
           value={dateTo}
           onChange={(e) => setDateTo(e.target.value)}
           className="w-full sm:w-40"
         />
         <div className="flex items-end">
           <Button
             onClick={() => void loadHistory()}
             disabled={!selectedLogId}
             className="w-full sm:w-auto"
           >
             Load History
           </Button>
         </div>
       </div>

       {historyState.type === 'error' && (
         <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] rounded-xl text-[13px] text-[var(--color-error)]">
           <span>{historyState.message}</span>
           <button type="button" onClick={loadHistory} className="font-medium underline-offset-2 hover:underline">
             Retry
           </button>
         </div>
       )}

       {historyState.type === 'idle' ? (
         <div className="py-12 text-center">
           <Package size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)] opacity-40" />
           <p className="text-[13px] text-[var(--color-text-tertiary)]">
             Select a production log above to view its packing history.
           </p>
         </div>
       ) : (
         <DataTable
           columns={historyColumns}
           data={filteredRecords}
           keyExtractor={(row) => row.id ?? Math.random()}
           isLoading={historyState.type === 'loading'}
           emptyMessage="No packing records found for the selected criteria."
           pageSize={20}
         />
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────

 const TABS = [
   { label: 'Packing Queue', value: 'queue' },
   { label: 'Packing History', value: 'history' },
 ];

 export function PackingPage() {
   const [activeTab, setActiveTab] = useState('queue');

   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             Packing
           </h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             Manage packing operations, bulk size splits, and packing history.
           </p>
         </div>
         {activeTab === 'queue' && (
           <div className="flex items-center gap-2">
             <PackageCheck size={16} className="text-[var(--color-text-tertiary)]" />
             <span className="text-[12px] text-[var(--color-text-tertiary)]">Packing Queue</span>
           </div>
         )}
         {activeTab === 'history' && (
           <div className="flex items-center gap-2">
             <History size={16} className="text-[var(--color-text-tertiary)]" />
             <span className="text-[12px] text-[var(--color-text-tertiary)]">Packing History</span>
           </div>
         )}
       </div>

       <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

       {activeTab === 'queue' && <PackingQueueTab />}
       {activeTab === 'history' && <PackingHistoryTab />}
     </div>
   );
 }

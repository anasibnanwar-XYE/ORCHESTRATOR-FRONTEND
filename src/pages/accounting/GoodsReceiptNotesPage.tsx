 /**
  * GoodsReceiptNotesPage
  *
  * Create GRNs against approved Purchase Orders.
  * Partial receipt updates PO status to PARTIALLY_RECEIVED.
  * Full receipt updates to FULLY_RECEIVED.
  * Sends Idempotency-Key header on create.
  *
  * API:
  *  GET  /api/v1/purchasing/goods-receipts
  *  GET  /api/v1/purchasing/purchase-orders (filter by APPROVED status)
  *  POST /api/v1/purchasing/goods-receipts  (with Idempotency-Key header)
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, Plus } from 'lucide-react';
 import { format, parseISO } from 'date-fns';
  import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { useToast } from '@/components/ui/Toast';
 import {
   purchasingApi,
   type GoodsReceiptResponse,
   type GoodsReceiptStatus,
   type PurchaseOrderResponse,
   type GoodsReceiptLineRequest,
 } from '@/lib/purchasingApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }
 
 function formatDate(dateStr: string | null | undefined): string {
   if (!dateStr) return '—';
   try { return format(parseISO(dateStr), 'dd MMM yyyy'); } catch { return dateStr; }
 }
 
 function todayISO(): string {
   return new Date().toISOString().split('T')[0];
 }
 
 function generateIdempotencyKey(): string {
   return 'grn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
 }
 
 const GRN_STATUS_MAP: Record<GoodsReceiptStatus, { variant: 'success' | 'warning' | 'default' | 'info'; label: string }> = {
   PARTIAL:  { variant: 'warning', label: 'Partial' },
   RECEIVED: { variant: 'success', label: 'Received' },
   INVOICED: { variant: 'info',    label: 'Invoiced' },
 };
 
 function GRNStatusBadge({ status }: { status: GoodsReceiptStatus }) {
   const m = GRN_STATUS_MAP[status] ?? { variant: 'default' as const, label: status };
   return <Badge variant={m.variant} dot>{m.label}</Badge>;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Create GRN Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface GRNLineForm {
   rawMaterialId: string;
   rawMaterialName: string;
   batchCode: string;
   quantity: string;
   unit: string;
   costPerUnit: string;
   manufacturingDate: string;
   expiryDate: string;
   notes: string;
 }
 
 interface CreateGRNFormProps {
   approvedPOs: PurchaseOrderResponse[];
   onSaved: () => void;
   onCancel: () => void;
 }
 
 function CreateGRNForm({ approvedPOs, onSaved, onCancel }: CreateGRNFormProps) {
   const toast = useToast();
   const [poId, setPoId] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
   const [receiptDate, setReceiptDate] = useState(todayISO());
   const [memo, setMemo] = useState('');
   const [lines, setLines] = useState<GRNLineForm[]>([]);
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [isSaving, setIsSaving] = useState(false);
 
   function handlePOSelect(id: string) {
     setPoId(id);
     const po = approvedPOs.find((p) => String(p.id) === id) ?? null;
      if (po) {
       // Pre-fill lines from PO
       setLines(
         po.lines.map((l) => ({
           rawMaterialId: String(l.rawMaterialId),
           rawMaterialName: l.rawMaterialName,
           batchCode: '',
           quantity: String(l.quantity),
           unit: l.unit ?? '',
           costPerUnit: String(l.costPerUnit),
           manufacturingDate: '',
           expiryDate: '',
           notes: l.notes ?? '',
         }))
       );
     }
   }
 
   function updateLine(i: number, field: keyof GRNLineForm, value: string) {
     const next = [...lines];
     next[i] = { ...next[i], [field]: value };
     setLines(next);
   }
 
   function validate(): boolean {
     const errs: Record<string, string> = {};
     if (!poId) errs.poId = 'Select a purchase order';
     if (!receiptNumber.trim()) errs.receiptNumber = 'Receipt number is required';
     if (!receiptDate) errs.receiptDate = 'Receipt date is required';
     if (lines.length === 0) errs.lines = 'No lines to receive';
     lines.forEach((line, i) => {
       if (!line.quantity || parseFloat(line.quantity) <= 0) errs[`line_${i}_qty`] = 'Qty must be > 0';
       if (!line.costPerUnit || parseFloat(line.costPerUnit) <= 0) errs[`line_${i}_cost`] = 'Cost must be > 0';
     });
     setErrors(errs);
     return Object.keys(errs).length === 0;
   }
 
   async function handleSubmit() {
     if (!validate()) return;
     setIsSaving(true);
     const idempotencyKey = generateIdempotencyKey();
     try {
       const requestLines: GoodsReceiptLineRequest[] = lines.map((l) => ({
         rawMaterialId: parseInt(l.rawMaterialId, 10),
         batchCode: l.batchCode || undefined,
         quantity: parseFloat(l.quantity),
         unit: l.unit || undefined,
         costPerUnit: parseFloat(l.costPerUnit),
         manufacturingDate: l.manufacturingDate || undefined,
         expiryDate: l.expiryDate || undefined,
         notes: l.notes || undefined,
       }));
       await purchasingApi.createGoodsReceipt(
         {
           purchaseOrderId: parseInt(poId, 10),
           receiptNumber: receiptNumber.trim(),
           receiptDate,
           memo: memo.trim() || undefined,
           lines: requestLines,
         },
         idempotencyKey
       );
       toast.success('Goods receipt note created. Inventory updated.');
       onSaved();
     } catch {
       toast.error('Failed to create goods receipt note.');
     } finally {
       setIsSaving(false);
     }
   }
 
   const poOptions = [
     { value: '', label: 'Select approved PO…', disabled: true },
     ...approvedPOs.map((po) => ({
       value: String(po.id),
       label: `${po.orderNumber} — ${po.supplierName}`,
     })),
   ];
 
   return (
     <Modal
       isOpen
       onClose={onCancel}
       title="New Goods Receipt Note"
       description="Record received goods against an approved purchase order"
       size="xl"
       footer={
         <>
           <Button variant="secondary" onClick={onCancel}>Cancel</Button>
           <Button onClick={handleSubmit} isLoading={isSaving}>
             Record Receipt
           </Button>
         </>
       }
     >
       <div className="overflow-y-auto max-h-[65vh] space-y-4">
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
           <Select
             label="Purchase Order *"
             value={poId}
             onChange={(e) => handlePOSelect(e.target.value)}
             error={errors.poId}
             options={poOptions}
             hint="Only approved POs"
           />
           <Input
             label="Receipt Number *"
             value={receiptNumber}
             onChange={(e) => setReceiptNumber(e.target.value)}
             error={errors.receiptNumber}
           />
           <Input
             label="Receipt Date *"
             type="date"
             value={receiptDate}
             onChange={(e) => setReceiptDate(e.target.value)}
             error={errors.receiptDate}
           />
         </div>
         <Input
           label="Memo"
           value={memo}
           onChange={(e) => setMemo(e.target.value)}
         />
 
         {/* Lines */}
         {lines.length > 0 && (
           <div>
             <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
               Receipt Lines
             </p>
             {errors.lines && (
               <p className="text-[11px] text-[var(--color-error)] mb-2">{errors.lines}</p>
             )}
             <div className="space-y-2">
               {lines.map((line, i) => (
                 <div
                   key={i}
                   className="p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] space-y-2"
                 >
                   <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{line.rawMaterialName}</p>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     <Input
                       label="Qty *"
                       type="number"
                       min="0.001"
                       step="0.001"
                       value={line.quantity}
                       onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                       error={errors[`line_${i}_qty`]}
                     />
                     <Input
                       label="Unit"
                       value={line.unit}
                       onChange={(e) => updateLine(i, 'unit', e.target.value)}
                     />
                     <Input
                       label="Cost/Unit *"
                       type="number"
                       min="0.01"
                       step="0.01"
                       value={line.costPerUnit}
                       onChange={(e) => updateLine(i, 'costPerUnit', e.target.value)}
                       error={errors[`line_${i}_cost`]}
                     />
                     <Input
                       label="Batch Code"
                       value={line.batchCode}
                       onChange={(e) => updateLine(i, 'batchCode', e.target.value)}
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <Input
                       label="Mfg Date"
                       type="date"
                       value={line.manufacturingDate}
                       onChange={(e) => updateLine(i, 'manufacturingDate', e.target.value)}
                     />
                     <Input
                       label="Expiry Date"
                       type="date"
                       value={line.expiryDate}
                       onChange={(e) => updateLine(i, 'expiryDate', e.target.value)}
                     />
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )}
 
         {!poId && (
           <p className="text-[13px] text-[var(--color-text-tertiary)] text-center py-4">
             Select an approved purchase order to load line items.
           </p>
         )}
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // GRN Detail Modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 function GRNDetailModal({ grn, onClose }: { grn: GoodsReceiptResponse; onClose: () => void }) {
   return (
     <Modal isOpen onClose={onClose} title={`GRN ${grn.receiptNumber}`} description={`${grn.supplierName} · ${formatDate(grn.receiptDate)}`} size="xl">
       <div className="space-y-4">
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[var(--color-surface-secondary)] rounded-xl">
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Status</p>
             <div className="mt-0.5"><GRNStatusBadge status={grn.status} /></div>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Total</p>
             <p className="text-[13px] font-medium tabular-nums mt-0.5">{formatINR(grn.totalAmount)}</p>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">PO</p>
             <p className="text-[13px] mt-0.5">{grn.purchaseOrderNumber}</p>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Supplier</p>
             <p className="text-[13px] mt-0.5">{grn.supplierName}</p>
           </div>
         </div>
 
         <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <table className="w-full text-[13px]">
             <thead className="bg-[var(--color-surface-secondary)]">
               <tr>
                 <th className="text-left px-3 py-2 font-medium text-[var(--color-text-tertiary)]">Material</th>
                 <th className="text-right px-3 py-2 font-medium text-[var(--color-text-tertiary)]">Qty</th>
                 <th className="text-right px-3 py-2 font-medium text-[var(--color-text-tertiary)]">Unit</th>
                 <th className="text-right px-3 py-2 font-medium text-[var(--color-text-tertiary)]">Cost/Unit</th>
                 <th className="text-right px-3 py-2 font-medium text-[var(--color-text-tertiary)]">Total</th>
               </tr>
             </thead>
             <tbody>
               {grn.lines.map((line, i) => (
                 <tr key={i} className="border-t border-[var(--color-border-subtle)]">
                   <td className="px-3 py-2.5">
                     <p className="text-[var(--color-text-primary)]">{line.rawMaterialName}</p>
                     {line.batchCode && <p className="text-[11px] text-[var(--color-text-tertiary)]">Batch: {line.batchCode}</p>}
                   </td>
                   <td className="px-3 py-2.5 text-right tabular-nums">{line.quantity}</td>
                   <td className="px-3 py-2.5 text-right">{line.unit ?? '—'}</td>
                   <td className="px-3 py-2.5 text-right tabular-nums">{formatINR(line.costPerUnit)}</td>
                   <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatINR(line.lineTotal)}</td>
                 </tr>
               ))}
             </tbody>
             <tfoot className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
               <tr>
                 <td colSpan={4} className="px-3 py-2.5 text-right font-semibold">Total</td>
                 <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatINR(grn.totalAmount)}</td>
               </tr>
             </tfoot>
           </table>
         </div>
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function GoodsReceiptNotesPage() {
   const [grns, setGrns] = useState<GoodsReceiptResponse[]>([]);
   const [approvedPOs, setApprovedPOs] = useState<PurchaseOrderResponse[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [showCreate, setShowCreate] = useState(false);
   const [detailGRN, setDetailGRN] = useState<GoodsReceiptResponse | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [grnsData, posData] = await Promise.all([
         purchasingApi.getGoodsReceipts(),
         purchasingApi.getPurchaseOrders(),
       ]);
       setGrns(grnsData);
       setApprovedPOs(posData.filter((po) => po.status === 'APPROVED'));
     } catch {
       setError('Failed to load goods receipts. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const COLUMNS: Column<GoodsReceiptResponse>[] = [
     {
       id: 'receiptNumber',
       header: 'GRN #',
       accessor: (row) => (
         <span className="font-medium tabular-nums text-[var(--color-text-primary)]">{row.receiptNumber}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.receiptNumber,
     },
     {
       id: 'supplier',
       header: 'Supplier',
       accessor: (row) => <span>{row.supplierName}</span>,
       sortable: true,
       sortAccessor: (row) => row.supplierName,
     },
     {
       id: 'poNumber',
       header: 'PO',
       accessor: (row) => (
         <span className="tabular-nums text-[var(--color-text-secondary)]">{row.purchaseOrderNumber}</span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'receiptDate',
       header: 'Date',
       accessor: (row) => (
         <span className="tabular-nums text-[var(--color-text-secondary)]">{formatDate(row.receiptDate)}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.receiptDate,
       hideOnMobile: true,
     },
     {
       id: 'totalAmount',
       header: 'Total',
       accessor: (row) => (
         <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{formatINR(row.totalAmount)}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.totalAmount,
       align: 'right',
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => <GRNStatusBadge status={row.status} />,
       sortable: true,
       sortAccessor: (row) => row.status,
     },
   ];
 
   return (
     <div className="space-y-5">
       <PageHeader
         title="Goods Receipt Notes"
         description="Record goods received against approved purchase orders"
         actions={
           <Button leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
             New GRN
           </Button>
         }
       />
 
       {error && !isLoading && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)]">
           <AlertCircle size={16} className="text-[var(--color-error)] shrink-0" />
           <p className="text-[13px] text-[var(--color-error)]">{error}</p>
           <Button variant="secondary" size="sm" onClick={load} className="ml-auto shrink-0">Retry</Button>
         </div>
       )}
 
       {isLoading && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <div className="p-3 space-y-2">
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className="flex gap-3 py-2.5 border-b border-[var(--color-border-subtle)]">
                 <Skeleton className="h-4 w-28" />
                 <Skeleton className="h-4 w-36" />
                 <Skeleton className="h-4 w-20 ml-auto" />
                 <Skeleton className="h-5 w-16" />
               </div>
             ))}
           </div>
         </div>
       )}
 
       {!isLoading && !error && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <DataTable
             columns={COLUMNS}
             data={grns}
             keyExtractor={(row) => row.id}
             searchable
             searchPlaceholder="Search by GRN # or supplier..."
             searchFilter={(row, q) =>
               row.receiptNumber.toLowerCase().includes(q) ||
               row.supplierName.toLowerCase().includes(q) ||
               row.purchaseOrderNumber.toLowerCase().includes(q)
             }
             onRowClick={(row) => setDetailGRN(row)}
             emptyMessage="No goods receipts found. Create your first GRN against an approved PO."
             toolbar={
               <span className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                 {grns.length} GRN{grns.length !== 1 ? 's' : ''}
               </span>
             }
           />
         </div>
       )}
 
       {detailGRN && (
         <GRNDetailModal grn={detailGRN} onClose={() => setDetailGRN(null)} />
       )}
 
       {showCreate && (
         <CreateGRNForm
           approvedPOs={approvedPOs}
           onSaved={() => { setShowCreate(false); load(); }}
           onCancel={() => setShowCreate(false)}
         />
       )}
     </div>
   );
 }

 /**
  * PurchaseOrdersPage
  *
  * Purchase order list (DataTable) and create PO form with line items.
  * Lifecycle actions: Approve (DRAFT→APPROVED), Void (DRAFT/APPROVED→VOID),
  *                    Close (INVOICED→CLOSED).
  *
  * API:
  *  GET  /api/v1/purchasing/purchase-orders
  *  POST /api/v1/purchasing/purchase-orders
  *  POST /api/v1/purchasing/purchase-orders/{id}/approve
  *  POST /api/v1/purchasing/purchase-orders/{id}/void
  *  POST /api/v1/purchasing/purchase-orders/{id}/close
  *  GET  /api/v1/purchasing/purchase-orders/{id}/timeline
  *  GET  /api/v1/suppliers (for supplier dropdown)
  *  GET  /api/v1/inventory/raw-materials (for line item dropdown)
  */
 
import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
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
import { getRawErrorMessage, isApiError } from '@/lib/api';
 import {
   purchasingApi,
   type PurchaseOrderResponse,
   type PurchaseOrderStatus,
   type SupplierFullResponse,
   type RawMaterialDto,
   type PurchaseOrderLineRequest,
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

function getMaterialsUnavailableMessage(error: unknown): string {
  if (isApiError(error) && [403, 404].includes(error.response?.status ?? 0)) {
    return 'Raw materials are unavailable for this accounting role, so new purchase orders are temporarily disabled.';
  }

  const message = getRawErrorMessage(error);
  if (
    message &&
    message !== 'An error occurred' &&
    message !== 'An unexpected error occurred' &&
    !message.startsWith('Request failed with status code')
  ) {
    return `${message} New purchase orders are temporarily disabled until raw materials can be loaded.`;
  }

  return 'Raw materials could not be loaded, so new purchase orders are temporarily disabled.';
}
 
 type POStatusMeta = { variant: 'success' | 'warning' | 'danger' | 'default' | 'info'; label: string };
 
 const PO_STATUS_MAP: Record<PurchaseOrderStatus, POStatusMeta> = {
   DRAFT:             { variant: 'default',  label: 'Draft' },
   APPROVED:          { variant: 'info',     label: 'Approved' },
   PARTIALLY_RECEIVED:{ variant: 'warning',  label: 'Part. Received' },
   FULLY_RECEIVED:    { variant: 'warning',  label: 'Fully Received' },
   INVOICED:          { variant: 'success',  label: 'Invoiced' },
   CLOSED:            { variant: 'success',  label: 'Closed' },
   VOID:              { variant: 'danger',   label: 'Void' },
 };
 
 function POStatusBadge({ status }: { status: PurchaseOrderStatus }) {
   const m = PO_STATUS_MAP[status] ?? { variant: 'default' as const, label: status };
   return <Badge variant={m.variant} dot>{m.label}</Badge>;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Timeline drawer
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface TimelineProps {
   poId: number;
   onClose: () => void;
 }
 
 function POTimelineModal({ poId, onClose }: TimelineProps) {
   const [timeline, setTimeline] = useState<Array<{
     id: number; fromStatus?: string; toStatus: string;
     reasonCode?: string; reason?: string; changedBy: string; changedAt: string;
   }>>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     purchasingApi.getPurchaseOrderTimeline(poId)
       .then(setTimeline)
       .catch(() => {})
       .finally(() => setLoading(false));
   }, [poId]);
 
   return (
     <Modal isOpen onClose={onClose} title="Order Timeline" size="md">
       {loading ? (
         <div className="space-y-2">
           {Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} className="h-10 w-full" />
           ))}
         </div>
       ) : timeline.length === 0 ? (
         <p className="text-[13px] text-[var(--color-text-tertiary)] py-4 text-center">No timeline events yet.</p>
       ) : (
         <div className="space-y-0">
           {timeline.map((event, i) => (
             <div key={event.id} className="flex gap-3 pb-4">
               <div className="flex flex-col items-center">
                 <div className="w-2 h-2 rounded-full bg-[var(--color-neutral-400)] mt-1.5 shrink-0" />
                 {i < timeline.length - 1 && (
                   <div className="flex-1 w-px bg-[var(--color-border-subtle)] mt-1" />
                 )}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                   {event.fromStatus ? `${event.fromStatus} → ${event.toStatus}` : event.toStatus}
                 </p>
                 {event.reason && (
                   <p className="text-[12px] text-[var(--color-text-secondary)]">{event.reason}</p>
                 )}
                 <p className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                   {formatDate(event.changedAt)} · {event.changedBy}
                 </p>
               </div>
             </div>
           ))}
         </div>
       )}
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Void modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 const VOID_REASON_CODES = [
   { value: 'SUPPLIER_CANCELLED', label: 'Supplier cancelled' },
   { value: 'PRICE_CHANGE', label: 'Price change' },
   { value: 'DUPLICATE_ORDER', label: 'Duplicate order' },
   { value: 'OTHER', label: 'Other' },
 ];
 
 interface VoidModalProps {
   po: PurchaseOrderResponse | null;
   onConfirm: (reasonCode: string, reason: string) => void;
   onCancel: () => void;
   isLoading: boolean;
 }
 
 function VoidModal({ po, onConfirm, onCancel, isLoading }: VoidModalProps) {
   const [reasonCode, setReasonCode] = useState('OTHER');
   const [reason, setReason] = useState('');
 
   if (!po) return null;
 
   return (
     <Modal
       isOpen
       onClose={onCancel}
       title="Void Purchase Order"
       description={`Void ${po.orderNumber}? This action cannot be undone.`}
       size="sm"
       footer={
         <>
           <Button variant="secondary" onClick={onCancel}>Cancel</Button>
           <Button
             variant="danger"
             onClick={() => onConfirm(reasonCode, reason)}
             isLoading={isLoading}
             disabled={!reasonCode}
           >
             Void Order
           </Button>
         </>
       }
     >
       <div className="space-y-3">
         <Select
           label="Reason Code *"
           value={reasonCode}
           onChange={(e) => setReasonCode(e.target.value)}
           options={VOID_REASON_CODES}
         />
         <Input
           label="Additional Notes"
           value={reason}
           onChange={(e) => setReason(e.target.value)}
         />
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // PO Detail modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface PODetailProps {
   po: PurchaseOrderResponse;
   onClose: () => void;
   onApprove: (po: PurchaseOrderResponse) => void;
   onVoid: (po: PurchaseOrderResponse) => void;
   onClose2: (po: PurchaseOrderResponse) => void;
   onTimeline: (po: PurchaseOrderResponse) => void;
   isActioning: boolean;
 }
 
 function PODetailModal({ po, onClose, onApprove, onVoid, onClose2, onTimeline, isActioning }: PODetailProps) {
   return (
     <Modal
       isOpen
       onClose={onClose}
       title={`PO ${po.orderNumber}`}
       description={`${po.supplierName} · ${formatDate(po.orderDate)}`}
       size="xl"
       footer={
         <div className="flex items-center gap-2 w-full">
           <Button
             variant="ghost"
             size="sm"
             onClick={() => onTimeline(po)}
           >
             View Timeline
           </Button>
           <div className="flex-1" />
           {po.status === 'DRAFT' && (
             <>
               <Button variant="danger" size="sm" onClick={() => onVoid(po)} disabled={isActioning}>
                 Void
               </Button>
               <Button size="sm" onClick={() => onApprove(po)} isLoading={isActioning}>
                 Approve
               </Button>
             </>
           )}
           {po.status === 'APPROVED' && (
             <Button variant="danger" size="sm" onClick={() => onVoid(po)} disabled={isActioning}>
               Void
             </Button>
           )}
           {po.status === 'INVOICED' && (
             <Button size="sm" onClick={() => onClose2(po)} isLoading={isActioning}>
               Close Order
             </Button>
           )}
         </div>
       }
     >
       <div className="space-y-4">
         {/* Summary */}
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[var(--color-surface-secondary)] rounded-xl">
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Status</p>
             <div className="mt-0.5"><POStatusBadge status={po.status} /></div>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Total</p>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)] tabular-nums mt-0.5">
               {formatINR(po.totalAmount)}
             </p>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Order Date</p>
             <p className="text-[13px] text-[var(--color-text-primary)] mt-0.5">{formatDate(po.orderDate)}</p>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Supplier</p>
             <p className="text-[13px] text-[var(--color-text-primary)] mt-0.5">{po.supplierName}</p>
           </div>
         </div>
 
         {/* Line items */}
         <div>
           <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
             Line Items
           </p>
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
                 {po.lines.map((line, i) => (
                   <tr key={i} className="border-t border-[var(--color-border-subtle)]">
                     <td className="px-3 py-2.5 text-[var(--color-text-primary)]">{line.rawMaterialName}</td>
                     <td className="px-3 py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">{line.quantity}</td>
                     <td className="px-3 py-2.5 text-right text-[var(--color-text-secondary)]">{line.unit ?? '—'}</td>
                     <td className="px-3 py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">{formatINR(line.costPerUnit)}</td>
                     <td className="px-3 py-2.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">{formatINR(line.lineTotal)}</td>
                   </tr>
                 ))}
               </tbody>
               <tfoot className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
                 <tr>
                   <td colSpan={4} className="px-3 py-2.5 text-right text-[13px] font-semibold text-[var(--color-text-primary)]">Total</td>
                   <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-[var(--color-text-primary)]">{formatINR(po.totalAmount)}</td>
                 </tr>
               </tfoot>
             </table>
           </div>
         </div>
         {po.memo && (
           <p className="text-[13px] text-[var(--color-text-secondary)] italic">{po.memo}</p>
         )}
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Create PO Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface POLineForm {
   rawMaterialId: string;
   quantity: string;
   unit: string;
   costPerUnit: string;
   notes: string;
 }
 
 function emptyLine(): POLineForm {
   return { rawMaterialId: '', quantity: '', unit: '', costPerUnit: '', notes: '' };
 }
 
 interface CreatePOFormProps {
   suppliers: SupplierFullResponse[];
   materials: RawMaterialDto[];
  materialsBlockedMessage?: string | null;
   onSaved: () => void;
   onCancel: () => void;
 }
 
function CreatePOForm({
  suppliers,
  materials,
  materialsBlockedMessage,
  onSaved,
  onCancel,
}: CreatePOFormProps) {
   const toast = useToast();
   const [supplierId, setSupplierId] = useState('');
   const [orderNumber, setOrderNumber] = useState('');
   const [orderDate, setOrderDate] = useState(todayISO());
   const [memo, setMemo] = useState('');
   const [lines, setLines] = useState<POLineForm[]>([emptyLine()]);
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [isSaving, setIsSaving] = useState(false);
 
  const activeSuppliers = suppliers.filter((s) => s.status === 'ACTIVE');
  const creationBlockedMessage =
    materialsBlockedMessage ??
    (materials.length === 0
      ? 'Add at least one raw material in inventory before creating a purchase order.'
      : null);
 
   function addLine() {
     setLines([...lines, emptyLine()]);
   }
 
   function removeLine(i: number) {
     setLines(lines.filter((_, idx) => idx !== i));
   }
 
   function updateLine(i: number, field: keyof POLineForm, value: string) {
     const next = [...lines];
     next[i] = { ...next[i], [field]: value };
     // Auto-fill unit from material
     if (field === 'rawMaterialId' && value) {
       const mat = materials.find((m) => String(m.id) === value);
       if (mat) next[i].unit = mat.unit;
     }
     setLines(next);
   }
 
   function validate(): boolean {
     const errs: Record<string, string> = {};
    if (creationBlockedMessage) errs.lines = creationBlockedMessage;
     if (!supplierId) errs.supplierId = 'Select a supplier';
     if (!orderNumber.trim()) errs.orderNumber = 'Order number is required';
     if (!orderDate) errs.orderDate = 'Order date is required';
     if (lines.length === 0) errs.lines = 'Add at least one line item';
     const seenMaterials = new Set<string>();
     lines.forEach((line, i) => {
       if (!line.rawMaterialId) {
         errs[`line_${i}_material`] = 'Select a material';
       } else if (seenMaterials.has(line.rawMaterialId)) {
         errs[`line_${i}_material`] = 'Duplicate material — each material can appear only once';
       } else {
         seenMaterials.add(line.rawMaterialId);
       }
       if (!line.quantity || parseFloat(line.quantity) <= 0) errs[`line_${i}_qty`] = 'Qty must be > 0';
       if (!line.costPerUnit || parseFloat(line.costPerUnit) <= 0) errs[`line_${i}_cost`] = 'Cost must be > 0';
     });
     setErrors(errs);
     return Object.keys(errs).length === 0;
   }
 
   const lineTotal = lines.reduce((sum, l) => {
     const qty = parseFloat(l.quantity) || 0;
     const cost = parseFloat(l.costPerUnit) || 0;
     return sum + qty * cost;
   }, 0);
 
   async function handleSubmit() {
     if (!validate()) return;
     setIsSaving(true);
     try {
       const requestLines: PurchaseOrderLineRequest[] = lines.map((l) => ({
         rawMaterialId: parseInt(l.rawMaterialId, 10),
         quantity: parseFloat(l.quantity),
         unit: l.unit || undefined,
         costPerUnit: parseFloat(l.costPerUnit),
         notes: l.notes || undefined,
       }));
       await purchasingApi.createPurchaseOrder({
         supplierId: parseInt(supplierId, 10),
         orderNumber: orderNumber.trim(),
         orderDate,
         memo: memo.trim() || undefined,
         lines: requestLines,
       });
       toast.success('Purchase order created as Draft.');
       onSaved();
     } catch {
       toast.error('Failed to create purchase order.');
     } finally {
       setIsSaving(false);
     }
   }
 
   const materialOptions = [
     { value: '', label: 'Select material…', disabled: true },
     ...materials.map((m) => ({ value: String(m.id), label: `${m.name} (${m.unit})` })),
   ];
 
   return (
     <Modal
       isOpen
       onClose={onCancel}
       title="New Purchase Order"
       description="Creates a draft PO ready for approval"
       size="xl"
       footer={
         <>
           <Button variant="secondary" onClick={onCancel}>Cancel</Button>
           <Button onClick={handleSubmit} isLoading={isSaving}>
             Create Draft PO
           </Button>
         </>
       }
     >
       <div className="overflow-y-auto max-h-[65vh] space-y-4">
         {creationBlockedMessage && (
           <div className="rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-bg)] px-4 py-3">
             <p className="text-[12px] font-medium text-[var(--color-text-primary)]">
               {creationBlockedMessage}
             </p>
           </div>
         )}

         {/* Header fields */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
           <Select
             label="Supplier *"
             value={supplierId}
             onChange={(e) => setSupplierId(e.target.value)}
             error={errors.supplierId}
             options={[
               { value: '', label: 'Select supplier…', disabled: true },
               ...activeSuppliers.map((s) => ({ value: String(s.id), label: s.name })),
             ]}
             hint="Only active suppliers"
           />
           <Input
             label="Order Number *"
             value={orderNumber}
             onChange={(e) => setOrderNumber(e.target.value)}
             error={errors.orderNumber}
           />
           <Input
             label="Order Date *"
             type="date"
             value={orderDate}
             onChange={(e) => setOrderDate(e.target.value)}
             error={errors.orderDate}
           />
         </div>
         <Input
           label="Memo"
           value={memo}
           onChange={(e) => setMemo(e.target.value)}
         />
 
         {/* Line items */}
         <div>
           <div className="flex items-center justify-between mb-2">
             <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
               Line Items
             </p>
             <Button variant="ghost" size="sm" leftIcon={<Plus size={12} />} onClick={addLine}>
               Add Line
             </Button>
           </div>
 
           {errors.lines && (
             <p className="text-[11px] text-[var(--color-error)] mb-2">{errors.lines}</p>
           )}
 
           <div className="space-y-2">
             {lines.map((line, i) => (
               <div
                 key={i}
                 className="p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]"
               >
                 <div className="grid grid-cols-12 gap-2 items-end">
                   <div className="col-span-12 sm:col-span-4">
                     <Select
                       label={i === 0 ? 'Material *' : undefined}
                       value={line.rawMaterialId}
                       onChange={(e) => updateLine(i, 'rawMaterialId', e.target.value)}
                       error={errors[`line_${i}_material`]}
                       options={materialOptions}
                     />
                   </div>
                   <div className="col-span-4 sm:col-span-2">
                     <Input
                       label={i === 0 ? 'Qty *' : undefined}
                       type="number"
                       min="0.001"
                       step="0.001"
                       value={line.quantity}
                       onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                       error={errors[`line_${i}_qty`]}
                     />
                   </div>
                   <div className="col-span-4 sm:col-span-2">
                     <Input
                       label={i === 0 ? 'Unit' : undefined}
                       value={line.unit}
                       onChange={(e) => updateLine(i, 'unit', e.target.value)}
                     />
                   </div>
                   <div className="col-span-4 sm:col-span-3">
                     <Input
                       label={i === 0 ? 'Cost/Unit *' : undefined}
                       type="number"
                       min="0.01"
                       step="0.01"
                       value={line.costPerUnit}
                       onChange={(e) => updateLine(i, 'costPerUnit', e.target.value)}
                       error={errors[`line_${i}_cost`]}
                     />
                   </div>
                   <div className="col-span-12 sm:col-span-1 flex items-end justify-end pb-0.5">
                     {lines.length > 1 && (
                       <button
                         type="button"
                         onClick={() => removeLine(i)}
                         className="h-9 w-9 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors"
                       >
                         <Trash2 size={14} />
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             ))}
           </div>
 
           {/* Running total */}
           {lineTotal > 0 && (
             <div className="flex justify-end mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
               <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                 Estimated Total: {formatINR(lineTotal)}
               </p>
             </div>
           )}
         </div>
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function PurchaseOrdersPage() {
   const toast = useToast();
 
   const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
   const [suppliers, setSuppliers] = useState<SupplierFullResponse[]>([]);
   const [materials, setMaterials] = useState<RawMaterialDto[]>([]);
  const [materialsBlockedMessage, setMaterialsBlockedMessage] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const [showCreate, setShowCreate] = useState(false);
   const [detailPO, setDetailPO] = useState<PurchaseOrderResponse | null>(null);
   const [voidPO, setVoidPO] = useState<PurchaseOrderResponse | null>(null);
   const [timelinePO, setTimelinePO] = useState<PurchaseOrderResponse | null>(null);
   const [isActioning, setIsActioning] = useState(false);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
    setMaterialsBlockedMessage(null);
     try {
      const [ordersData, suppliersData, materialsResult] = await Promise.all([
         purchasingApi.getPurchaseOrders(),
         purchasingApi.getSuppliers(),
        purchasingApi.getRawMaterials()
          .then((data) => ({ data, error: null as unknown | null }))
          .catch((error) => ({ data: [] as RawMaterialDto[], error })),
       ]);
       setOrders(ordersData);
       setSuppliers(suppliersData);
      setMaterials(materialsResult.data);
      setMaterialsBlockedMessage(
        materialsResult.error ? getMaterialsUnavailableMessage(materialsResult.error) : null
      );
     } catch {
       setError('Failed to load purchase orders. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   async function handleApprove(po: PurchaseOrderResponse) {
     setIsActioning(true);
     try {
       await purchasingApi.approvePurchaseOrder(po.id);
       toast.success(`PO ${po.orderNumber} approved.`);
       setDetailPO(null);
       await load();
     } catch {
       toast.error('Failed to approve purchase order.');
     } finally {
       setIsActioning(false);
     }
   }
 
   async function handleVoidConfirm(reasonCode: string, reason: string) {
     if (!voidPO) return;
     setIsActioning(true);
     try {
       await purchasingApi.voidPurchaseOrder(voidPO.id, { reasonCode, reason });
       toast.success(`PO ${voidPO.orderNumber} voided.`);
       setVoidPO(null);
       setDetailPO(null);
       await load();
     } catch {
       toast.error('Failed to void purchase order.');
     } finally {
       setIsActioning(false);
     }
   }
 
   async function handleClose(po: PurchaseOrderResponse) {
     setIsActioning(true);
     try {
       await purchasingApi.closePurchaseOrder(po.id);
       toast.success(`PO ${po.orderNumber} closed.`);
       setDetailPO(null);
       await load();
     } catch {
       toast.error('Failed to close purchase order.');
     } finally {
       setIsActioning(false);
     }
   }
 
   const COLUMNS: Column<PurchaseOrderResponse>[] = [
     {
       id: 'orderNumber',
       header: 'Order #',
       accessor: (row) => (
         <span className="font-medium tabular-nums text-[var(--color-text-primary)]">{row.orderNumber}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.orderNumber,
     },
     {
       id: 'supplier',
       header: 'Supplier',
       accessor: (row) => (
         <span className="text-[var(--color-text-primary)]">{row.supplierName}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.supplierName,
     },
     {
       id: 'orderDate',
       header: 'Date',
       accessor: (row) => (
         <span className="tabular-nums text-[var(--color-text-secondary)]">{formatDate(row.orderDate)}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.orderDate,
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
       accessor: (row) => <POStatusBadge status={row.status} />,
       sortable: true,
       sortAccessor: (row) => row.status,
     },
   ];

  const createDisabledMessage =
    materialsBlockedMessage ??
    (!isLoading && !error && materials.length === 0
      ? 'Add at least one raw material in inventory before creating a purchase order.'
      : null);
 
   return (
     <div className="space-y-5">
       <PageHeader
         title="Purchase Orders"
         description="Manage procurement from suppliers"
         actions={
          <Button
            leftIcon={<Plus size={14} />}
            onClick={() => setShowCreate(true)}
            disabled={Boolean(createDisabledMessage)}
          >
             New PO
           </Button>
         }
       />

      {createDisabledMessage && !isLoading && !error && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-bg)] px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-warning-icon)]" />
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              New purchase orders are unavailable
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
              {createDisabledMessage}
            </p>
          </div>
        </div>
      )}
 
       {/* Error */}
       {error && !isLoading && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)]">
           <AlertCircle size={16} className="text-[var(--color-error)] shrink-0" />
           <p className="text-[13px] text-[var(--color-error)]">{error}</p>
           <Button variant="secondary" size="sm" onClick={load} className="ml-auto shrink-0">
             Retry
           </Button>
         </div>
       )}
 
       {/* Loading skeleton */}
       {isLoading && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <div className="p-3 space-y-2">
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className="flex gap-3 py-2.5 border-b border-[var(--color-border-subtle)]">
                 <Skeleton className="h-4 w-28" />
                 <Skeleton className="h-4 w-36" />
                 <Skeleton className="h-4 w-20 ml-auto" />
                 <Skeleton className="h-5 w-20" />
               </div>
             ))}
           </div>
         </div>
       )}
 
       {/* DataTable */}
       {!isLoading && !error && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <DataTable
             columns={COLUMNS}
             data={orders}
             keyExtractor={(row) => row.id}
             searchable
             searchPlaceholder="Search by order # or supplier..."
             searchFilter={(row, q) =>
               row.orderNumber.toLowerCase().includes(q) ||
               row.supplierName.toLowerCase().includes(q)
             }
             onRowClick={(row) => setDetailPO(row)}
             emptyMessage="No purchase orders found. Create your first PO."
             toolbar={
               <span className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                 {orders.length} order{orders.length !== 1 ? 's' : ''}
               </span>
             }
           />
         </div>
       )}
 
       {/* Detail modal */}
       {detailPO && (
         <PODetailModal
           po={detailPO}
           onClose={() => setDetailPO(null)}
           onApprove={handleApprove}
           onVoid={(po) => { setVoidPO(po); }}
           onClose2={handleClose}
           onTimeline={(po) => { setDetailPO(null); setTimelinePO(po); }}
           isActioning={isActioning}
         />
       )}
 
       {/* Void modal */}
       {voidPO && (
         <VoidModal
           po={voidPO}
           onConfirm={handleVoidConfirm}
           onCancel={() => setVoidPO(null)}
           isLoading={isActioning}
         />
       )}
 
       {/* Timeline modal */}
       {timelinePO && (
         <POTimelineModal
           poId={timelinePO.id}
           onClose={() => setTimelinePO(null)}
         />
       )}
 
       {/* Create modal */}
       {showCreate && (
         <CreatePOForm
           suppliers={suppliers}
           materials={materials}
          materialsBlockedMessage={createDisabledMessage}
           onSaved={() => { setShowCreate(false); load(); }}
           onCancel={() => setShowCreate(false)}
         />
       )}
     </div>
   );
 }

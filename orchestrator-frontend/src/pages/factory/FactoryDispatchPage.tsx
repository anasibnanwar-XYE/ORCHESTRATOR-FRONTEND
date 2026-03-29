 /**
  * FactoryDispatchPage — Factory portal dispatch management
  *
  * Tabs:
  *   1. Pending Slips — DataTable of pending dispatch slips with status badges
  *      - Confirm Dispatch: assign tracking ref, update status to Dispatched
  *      - Preview Slip: print-ready format with shipment details, product breakdown, dealer info
  *      - Cancel Backorder: reason + confirmation, returns quantities to stock
  *   2. Status History — slip status timeline
  */

 import { useCallback, useEffect, useState } from 'react';
 import { format } from 'date-fns';
 import {
   AlertCircle,
   RefreshCcw,
   Truck,
   Eye,
   XCircle,
   CheckCircle,
   Clock,
   Package,
   Printer,
 } from 'lucide-react';
 import { Tabs } from '@/components/ui/Tabs';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Modal } from '@/components/ui/Modal';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { factoryApi } from '@/lib/factoryApi';
 import type {
   PackagingSlipDto,
   DispatchPreviewDto,
   FactoryDispatchConfirmationResponse,
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

 function slipStatusVariant(status: string | undefined): BadgeVariant {
   switch (status) {
     case 'PENDING': return 'warning';
     case 'CONFIRMED': return 'info';
     case 'DISPATCHED': return 'success';
     case 'DELIVERED': return 'success';
     case 'CANCELLED': return 'danger';
     case 'BACKORDER': return 'default';
     default: return 'default';
   }
 }

 function slipStatusLabel(status: string | undefined): string {
   switch (status) {
     case 'PENDING': return 'Pending';
     case 'CONFIRMED': return 'Confirmed';
     case 'DISPATCHED': return 'Dispatched';
     case 'DELIVERED': return 'Delivered';
     case 'CANCELLED': return 'Cancelled';
     case 'BACKORDER': return 'Backorder';
     default: return status ?? '—';
   }
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Print Preview Component
 // ─────────────────────────────────────────────────────────────────────────────

 function SlipPrintPreview({ preview }: { preview: DispatchPreviewDto }) {
   return (
     <div className="space-y-4 p-1">
       {/* Header */}
       <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
         <div className="px-4 py-3 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-subtle)]">
           <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Dispatch Slip
           </p>
           <p className="text-[18px] font-semibold text-[var(--color-text-primary)] mt-0.5">
             {preview.slipNumber ?? `#${preview.packagingSlipId}`}
           </p>
         </div>
         <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
           <div>
             <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold">Order</p>
             <p className="text-[var(--color-text-primary)] font-medium">{preview.salesOrderNumber ?? '—'}</p>
           </div>
           <div>
             <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold">Dealer</p>
             <p className="text-[var(--color-text-primary)] font-medium">{preview.dealerName ?? '—'}</p>
           </div>
           <div>
             <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold">Dealer Code</p>
             <p className="text-[var(--color-text-secondary)]">{preview.dealerCode ?? '—'}</p>
           </div>
           <div>
             <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold">Date</p>
             <p className="text-[var(--color-text-secondary)]">{fmtDate(preview.createdAt)}</p>
           </div>
         </div>
       </div>

       {/* Product Breakdown */}
       <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
         <div className="px-3 py-2 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-subtle)]">
           <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Product Breakdown
           </p>
         </div>
         <table className="w-full text-[12px]">
           <thead>
             <tr className="border-b border-[var(--color-border-subtle)]">
               {['Product', 'Ordered', 'Available', 'Ship Qty', 'Unit Price', 'Line Total'].map(h => (
                 <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                   {h}
                 </th>
               ))}
             </tr>
           </thead>
           <tbody className="divide-y divide-[var(--color-border-subtle)]">
             {(preview.lines ?? []).map((line, i) => (
               <tr key={i} className={line.hasShortage ? 'bg-[var(--color-warning-bg)]' : ''}>
                 <td className="px-3 py-2">
                   <p className="font-medium text-[var(--color-text-primary)]">{line.productName ?? line.productCode ?? '—'}</p>
                   <p className="text-[10px] text-[var(--color-text-tertiary)]">{line.productCode}</p>
                 </td>
                 <td className="px-3 py-2 tabular-nums text-[var(--color-text-secondary)]">{fmtNum(line.orderedQuantity)}</td>
                 <td className="px-3 py-2 tabular-nums text-[var(--color-text-secondary)]">
                   <span className={line.hasShortage ? 'text-[var(--color-warning)]' : ''}>
                     {fmtNum(line.availableQuantity)}
                   </span>
                 </td>
                 <td className="px-3 py-2 tabular-nums font-medium text-[var(--color-text-primary)]">
                   {fmtNum(line.suggestedShipQuantity)}
                 </td>
                 <td className="px-3 py-2 tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(line.unitPrice)}</td>
                 <td className="px-3 py-2 tabular-nums font-medium text-[var(--color-text-primary)]">{fmtCurrency(line.lineTotal)}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>

       {/* GST Breakdown */}
       {preview.gstBreakdown && (
         <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <div className="px-3 py-2 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-subtle)]">
             <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
               GST Breakdown
             </p>
           </div>
           <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[12px]">
             {[
               { label: 'Taxable Amount', value: fmtCurrency(preview.gstBreakdown.taxableAmount) },
               { label: 'CGST', value: fmtCurrency(preview.gstBreakdown.cgst) },
               { label: 'SGST', value: fmtCurrency(preview.gstBreakdown.sgst) },
               { label: 'IGST', value: fmtCurrency(preview.gstBreakdown.igst) },
               { label: 'Total Tax', value: fmtCurrency(preview.gstBreakdown.totalTax) },
               { label: 'Grand Total', value: fmtCurrency(preview.gstBreakdown.grandTotal) },
             ].map(({ label, value }) => (
               <div key={label}>
                 <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold">{label}</p>
                 <p className="text-[var(--color-text-primary)] font-medium tabular-nums">{value}</p>
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Confirm Dispatch Modal
 // ─────────────────────────────────────────────────────────────────────────────

 function ConfirmDispatchModal({
   slip,
   onClose,
   onConfirmed,
 }: {
   slip: PackagingSlipDto;
   onClose: () => void;
   onConfirmed: (result: FactoryDispatchConfirmationResponse) => void;
 }) {
   const toast = useToast();
   const [confirmedBy, setConfirmedBy] = useState('');
   const [notes, setNotes] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const [result, setResult] = useState<FactoryDispatchConfirmationResponse | null>(null);

   async function handleConfirm() {
     if (!slip.id) return;
     setSubmitting(true);
     try {
       const lines = (slip.lines ?? []).map(l => ({
         lineId: l.id!,
         shippedQuantity: l.orderedQuantity ?? 0,
       }));
       const resp = await factoryApi.confirmDispatch({
         packagingSlipId: slip.id,
         confirmedBy: confirmedBy.trim() || undefined,
         notes: notes.trim() || undefined,
         lines,
       });
       setResult(resp);
       onConfirmed(resp);
       toast.success('Dispatch confirmed — tracking reference assigned');
     } catch {
       toast.error('Failed to confirm dispatch');
     } finally {
       setSubmitting(false);
     }
   }

   return (
     <div className="space-y-4 p-1">
       {result ? (
         <>
           <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-success-bg)]">
             <CheckCircle size={18} className="text-[var(--color-success)] shrink-0" />
             <div>
               <p className="text-[13px] font-medium text-[var(--color-success)]">Dispatch confirmed</p>
               {result.slipNumber && (
                 <p className="text-[12px] text-[var(--color-success)] mt-0.5">
                   Tracking ref: {result.slipNumber}
                 </p>
               )}
             </div>
           </div>
           <div className="grid grid-cols-3 gap-3 text-[12px]">
             {[
               { label: 'Ordered', value: fmtNum(result.totalOrderedAmount) },
               { label: 'Shipped', value: fmtNum(result.totalShippedAmount) },
               { label: 'Backorder', value: fmtNum(result.totalBackorderAmount) },
             ].map(({ label, value }) => (
               <div key={label} className="rounded-lg p-2.5 border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] text-center">
                 <p className="text-[16px] font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</p>
                 <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{label}</p>
               </div>
             ))}
           </div>
           <Button onClick={onClose} className="w-full">Close</Button>
         </>
       ) : (
         <>
           {/* Order Lines */}
           <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
             <div className="px-3 py-2 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-subtle)]">
               <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                 Slip Lines
               </p>
             </div>
             {(slip.lines ?? []).length === 0 ? (
               <p className="px-4 py-3 text-[12px] text-[var(--color-text-tertiary)]">No lines on this slip.</p>
             ) : (
               <table className="w-full text-[12px]">
                 <thead>
                   <tr className="border-b border-[var(--color-border-subtle)]">
                     {['Product', 'Ordered', 'Ship Qty'].map(h => (
                       <th key={h} className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                         {h}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--color-border-subtle)]">
                   {(slip.lines ?? []).map((line, i) => (
                     <tr key={i}>
                       <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                         {line.productName ?? line.productCode ?? '—'}
                       </td>
                       <td className="px-3 py-2 tabular-nums text-[var(--color-text-secondary)]">
                         {fmtNum(line.orderedQuantity)}
                       </td>
                       <td className="px-3 py-2 tabular-nums font-medium text-[var(--color-text-primary)]">
                         {fmtNum(line.orderedQuantity)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
           </div>

           <div className="space-y-1.5">
             <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
               Confirmed By
             </label>
             <input
               type="text"
               value={confirmedBy}
               onChange={e => setConfirmedBy(e.target.value)}
               placeholder="Your name or ID"
               className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-neutral-900)] transition-colors"
             />
           </div>
           <div className="space-y-1.5">
             <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
               Notes (optional)
             </label>
             <textarea
               value={notes}
               onChange={e => setNotes(e.target.value)}
               placeholder="Any notes about this dispatch..."
               rows={2}
               className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:border-[var(--color-neutral-900)] transition-colors"
             />
           </div>

           <div className="flex justify-end gap-2 pt-2">
             <Button variant="secondary" onClick={onClose}>Cancel</Button>
             <Button
               onClick={handleConfirm}
               disabled={submitting}
               className="flex items-center gap-1.5"
             >
               <Truck size={13} />
               {submitting ? 'Confirming…' : 'Confirm Dispatch'}
             </Button>
           </div>
         </>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function FactoryDispatchPage() {
   const toast = useToast();
   const [slips, setSlips] = useState<PackagingSlipDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Confirm dispatch
   const [confirmTarget, setConfirmTarget] = useState<PackagingSlipDto | null>(null);

   // Preview
   const [previewSlip, setPreviewSlip] = useState<PackagingSlipDto | null>(null);
   const [preview, setPreview] = useState<DispatchPreviewDto | null>(null);
   const [previewLoading, setPreviewLoading] = useState(false);

   // Cancel backorder
   const [cancelTarget, setCancelTarget] = useState<PackagingSlipDto | null>(null);
   const [cancelReason, setCancelReason] = useState('');
   const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
   const [cancelling, setCancelling] = useState(false);

   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const data = await factoryApi.getPendingSlips();
       setSlips(data ?? []);
     } catch {
       setError('Unable to load dispatch slips. Please try again.');
     } finally {
       setLoading(false);
     }
   }, []);

   useEffect(() => { void load(); }, [load]);

   async function openPreview(slip: PackagingSlipDto) {
     setPreviewSlip(slip);
     setPreview(null);
     setPreviewLoading(true);
     try {
       const data = await factoryApi.getDispatchPreview(slip.id);
       setPreview(data);
     } catch {
       toast.error('Failed to load slip preview');
       setPreviewSlip(null);
     } finally {
       setPreviewLoading(false);
     }
   }

   function openCancelBackorder(slip: PackagingSlipDto) {
     setCancelTarget(slip);
     setCancelReason('');
     setCancelConfirmOpen(true);
   }

   async function handleCancelBackorder() {
     if (!cancelTarget) return;
     setCancelling(true);
     try {
       await factoryApi.cancelBackorder(cancelTarget.id, cancelReason.trim() || undefined);
       toast.success('Backorder cancelled — quantities returned to available stock');
       setCancelConfirmOpen(false);
       setCancelTarget(null);
       await load();
     } catch {
       toast.error('Failed to cancel backorder');
     } finally {
       setCancelling(false);
     }
   }

   // ── Tabs config ───────────────────────────────────────────────────────────
   const tabs = [
     { value: 'pending', label: 'Pending Slips' },
     { value: 'all', label: 'All Slips' },
   ];

   const [activeTab, setActiveTab] = useState('pending');

   const filteredSlips = activeTab === 'pending'
     ? slips.filter(s => s.status === 'PENDING' || s.status === 'BACKORDER')
     : slips;

   // ── Render ────────────────────────────────────────────────────────────────

   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Dispatch</h1>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
             Manage dispatch slips, confirm shipments, and handle backorders.
           </p>
         </div>
         <button
           type="button"
           onClick={load}
           className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
         >
           <RefreshCcw size={13} />
           Refresh
         </button>
       </div>

       {/* Tabs */}
       <Tabs
         tabs={tabs}
         active={activeTab}
         onChange={setActiveTab}
       />

       {/* Table card */}
       <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
         {loading ? (
           <div className="p-4 space-y-3">
             {Array.from({ length: 5 }).map((_, i) => (
               <Skeleton key={i} className="h-12 w-full rounded-lg" />
             ))}
           </div>
         ) : error ? (
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
         ) : filteredSlips.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 gap-2">
             <Package size={24} className="text-[var(--color-text-tertiary)]" />
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
               No pending dispatch slips
             </p>
             <p className="text-[12px] text-[var(--color-text-tertiary)]">
               {activeTab === 'pending' ? 'All dispatch slips are up to date.' : 'No dispatch slips found.'}
             </p>
           </div>
         ) : (
           <>
             {/* Desktop table */}
             <div className="hidden sm:block overflow-x-auto">
               <table className="w-full text-[12px]">
                 <thead>
                   <tr className="border-b border-[var(--color-border-subtle)]">
                     {['Slip No.', 'Order', 'Dealer', 'Lines', 'Status', 'Date', ''].map(h => (
                       <th key={h} className="px-4 py-2.5 text-left font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px] whitespace-nowrap">
                         {h}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--color-border-subtle)]">
                   {filteredSlips.map(slip => (
                     <tr key={slip.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                       <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                         {slip.slipNumber ?? `#${slip.id}`}
                       </td>
                       <td className="px-4 py-3 text-[var(--color-text-secondary)]">{slip.orderNumber ?? '—'}</td>
                       <td className="px-4 py-3 text-[var(--color-text-secondary)]">{slip.dealerName ?? '—'}</td>
                       <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">
                         {slip.lines?.length ?? 0} line{(slip.lines?.length ?? 0) !== 1 ? 's' : ''}
                       </td>
                       <td className="px-4 py-3">
                         <Badge variant={slipStatusVariant(slip.status)}>
                           {slipStatusLabel(slip.status)}
                         </Badge>
                       </td>
                       <td className="px-4 py-3 tabular-nums text-[var(--color-text-tertiary)]">{fmtDate(slip.createdAt)}</td>
                       <td className="px-4 py-3">
                         <div className="flex items-center gap-1.5 justify-end">
                           <button
                             type="button"
                             onClick={() => openPreview(slip)}
                             className="flex items-center gap-1 px-2.5 h-7 rounded-md border border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                             title="Preview slip"
                           >
                             <Eye size={12} />
                             Preview
                           </button>
                           {(slip.status === 'PENDING' || slip.status === 'CONFIRMED') && (
                             <button
                               type="button"
                               onClick={() => setConfirmTarget(slip)}
                               className="flex items-center gap-1 px-2.5 h-7 rounded-md bg-[var(--color-neutral-900)] text-white text-[11px] font-medium hover:opacity-90 transition-opacity"
                             >
                               <Truck size={12} />
                               Dispatch
                             </button>
                           )}
                           {slip.status === 'BACKORDER' && (
                             <button
                               type="button"
                               onClick={() => openCancelBackorder(slip)}
                               className="flex items-center gap-1 px-2.5 h-7 rounded-md border border-[var(--color-error)] text-[var(--color-error)] text-[11px] hover:bg-[var(--color-error-bg)] transition-colors"
                             >
                               <XCircle size={12} />
                               Cancel
                             </button>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>

             {/* Mobile cards */}
             <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
               {filteredSlips.map(slip => (
                 <div key={slip.id} className="p-4 space-y-3">
                   <div className="flex items-start justify-between gap-2">
                     <div>
                       <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {slip.slipNumber ?? `#${slip.id}`}
                       </p>
                       <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                         {slip.orderNumber} · {slip.dealerName ?? '—'}
                       </p>
                     </div>
                     <Badge variant={slipStatusVariant(slip.status)}>
                       {slipStatusLabel(slip.status)}
                     </Badge>
                   </div>
                   <div className="flex items-center gap-2">
                     <button
                       type="button"
                       onClick={() => openPreview(slip)}
                       className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                     >
                       <Eye size={13} />
                       Preview
                     </button>
                     {(slip.status === 'PENDING' || slip.status === 'CONFIRMED') && (
                       <button
                         type="button"
                         onClick={() => setConfirmTarget(slip)}
                         className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-[var(--color-neutral-900)] text-white text-[12px] font-medium hover:opacity-90 transition-opacity"
                       >
                         <Truck size={13} />
                         Dispatch
                       </button>
                     )}
                     {slip.status === 'BACKORDER' && (
                       <button
                         type="button"
                         onClick={() => openCancelBackorder(slip)}
                         className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-[var(--color-error)] text-[var(--color-error)] text-[12px] hover:bg-[var(--color-error-bg)] transition-colors"
                       >
                         <XCircle size={13} />
                         Cancel Backorder
                       </button>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           </>
         )}
       </div>

       {/* Confirm Dispatch Modal */}
       <Modal
         isOpen={!!confirmTarget}
         onClose={() => setConfirmTarget(null)}
         title={`Confirm Dispatch — ${confirmTarget?.slipNumber ?? ''}`}
       >
         {confirmTarget && (
           <ConfirmDispatchModal
             slip={confirmTarget}
             onClose={() => { setConfirmTarget(null); void load(); }}
             onConfirmed={() => { void load(); }}
           />
         )}
       </Modal>

       {/* Preview Modal */}
       <Modal
         isOpen={!!previewSlip}
         onClose={() => { setPreviewSlip(null); setPreview(null); }}
         title={`Dispatch Slip Preview — ${previewSlip?.slipNumber ?? ''}`}
       >
         {previewLoading ? (
           <div className="p-4 space-y-3">
             {Array.from({ length: 4 }).map((_, i) => (
               <Skeleton key={i} className="h-10 w-full rounded-lg" />
             ))}
           </div>
         ) : preview ? (
           <div className="space-y-4">
             <SlipPrintPreview preview={preview} />
             <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-subtle)]">
               <button
                 type="button"
                 onClick={() => window.print()}
                 className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
               >
                 <Printer size={13} />
                 Print
               </button>
               <button
                 type="button"
                 onClick={() => { setPreviewSlip(null); setPreview(null); }}
                 className="px-4 h-8 rounded-lg text-[12px] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
               >
                 Close
               </button>
             </div>
           </div>
         ) : null}
       </Modal>

       {/* Cancel Backorder Confirm Dialog */}
       {cancelTarget && (
         <Modal
           isOpen={cancelConfirmOpen}
           onClose={() => { setCancelConfirmOpen(false); setCancelTarget(null); }}
           title={`Cancel Backorder — ${cancelTarget.slipNumber ?? ''}`}
         >
           <div className="space-y-4 p-1">
             <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-warning-bg)] border border-[var(--color-warning)]">
               <Clock size={16} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
               <p className="text-[12px] text-[var(--color-warning)]">
                 Cancelling this backorder will return unshipped quantities to available stock. This cannot be undone.
               </p>
             </div>
             <div className="space-y-1.5">
               <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                 Reason (optional)
               </label>
               <textarea
                 value={cancelReason}
                 onChange={e => setCancelReason(e.target.value)}
                 placeholder="Reason for cancellation..."
                 rows={3}
                 className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:border-[var(--color-neutral-900)] transition-colors"
               />
             </div>
             <div className="flex justify-end gap-2 pt-2">
               <Button variant="secondary" onClick={() => { setCancelConfirmOpen(false); setCancelTarget(null); }}>
                 Keep Backorder
               </Button>
               <button
                 type="button"
                 onClick={handleCancelBackorder}
                 disabled={cancelling}
                 className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-[12px] font-medium bg-[var(--color-error)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
               >
                 <XCircle size={13} />
                 {cancelling ? 'Cancelling…' : 'Cancel Backorder'}
               </button>
             </div>
           </div>
         </Modal>
       )}
     </div>
   );
 }

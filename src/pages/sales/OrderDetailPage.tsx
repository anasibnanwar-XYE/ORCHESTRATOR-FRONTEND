 /**
  * OrderDetailPage
  *
  * Full detail view for a single sales order.
  *
  * Sections:
  *  1. Header — order number, status badge, dealer name, totals
  *  2. Lifecycle stepper — Draft → Confirmed → Dispatched → Invoiced → Settled → Closed
  *     with current stage highlighted and timeline entries for each step
  *  3. Line items table
  *  4. GST breakdown (CGST+SGST or IGST)
  *  5. Timeline — full chronological history from /timeline endpoint
  *  6. Actions — Confirm, Cancel (with reason dialog)
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import { useNavigate, useParams } from 'react-router-dom';
 import {
   ArrowLeft,
   AlertCircle,
   RefreshCcw,
   CheckCircle2,
   Circle,
   Clock,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { salesApi } from '@/lib/salesApi';
 import { useToast } from '@/components/ui/Toast';
 import { Skeleton } from '@/components/ui/Skeleton';
 import type { SalesOrderDto, SalesOrderStatusHistoryDto } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Lifecycle stages
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface LifecycleStage {
   key: string;
   label: string;
   /** Canonical statuses that map to this stage for highlighting */
   statuses: string[];
 }
 
 const LIFECYCLE_STAGES: LifecycleStage[] = [
   { key: 'DRAFT', label: 'Draft', statuses: ['DRAFT', 'RESERVED', 'PENDING_PRODUCTION', 'PENDING_INVENTORY', 'READY_TO_SHIP', 'PROCESSING'] },
   { key: 'CONFIRMED', label: 'Confirmed', statuses: ['CONFIRMED'] },
   { key: 'DISPATCHED', label: 'Dispatched', statuses: ['DISPATCHED'] },
   { key: 'INVOICED', label: 'Invoiced', statuses: ['INVOICED'] },
   { key: 'SETTLED', label: 'Settled', statuses: ['SETTLED'] },
   { key: 'CLOSED', label: 'Closed', statuses: ['CLOSED'] },
 ];
 
 function getStageIndex(status: string): number {
   const upper = status.toUpperCase();
   const stageIdx = LIFECYCLE_STAGES.findIndex((s) => s.statuses.includes(upper));
   return stageIdx;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtCurrency(v: number) {
   return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 }
 
 function fmtDateFull(iso: string) {
   try {
     return format(new Date(iso), 'dd MMM yyyy, h:mm a');
   } catch {
     return iso;
   }
 }
 
 function fmtDate(iso: string) {
   try {
     return format(new Date(iso), 'dd MMM yyyy');
   } catch {
     return iso;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Status badge
 // ─────────────────────────────────────────────────────────────────────────────
 
 const STATUS_LABELS: Record<string, string> = {
   DRAFT: 'Draft',
   RESERVED: 'Reserved',
   PENDING_PRODUCTION: 'Pending Production',
   PENDING_INVENTORY: 'Pending Inventory',
   READY_TO_SHIP: 'Ready to Ship',
   PROCESSING: 'Processing',
   CONFIRMED: 'Confirmed',
   DISPATCHED: 'Dispatched',
   INVOICED: 'Invoiced',
   SETTLED: 'Settled',
   CLOSED: 'Closed',
   CANCELLED: 'Cancelled',
 };
 
 function StatusBadge({ status }: { status: string }) {
   const upper = status.toUpperCase();
   const cls = (() => {
     switch (upper) {
       case 'CONFIRMED':
       case 'RESERVED': return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
       case 'CANCELLED': return 'bg-[var(--color-error-bg)] text-[var(--color-error)]';
       case 'DRAFT': return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
       case 'DISPATCHED':
       case 'INVOICED': return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
       case 'SETTLED': return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
       case 'CLOSED': return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]';
       default: return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
     }
   })();
   return (
     <span className={clsx('text-[11px] font-semibold px-2 py-1 rounded-full', cls)}>
       {STATUS_LABELS[upper] ?? status}
     </span>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Cancel reason dialog (inline — same as OrdersPage)
 // ─────────────────────────────────────────────────────────────────────────────
 
 const CANCEL_REASON_CODES = [
   { value: 'CUSTOMER_REQUEST', label: 'Customer request' },
   { value: 'CREDIT_BLOCK', label: 'Credit block' },
   { value: 'PRICING_ISSUE', label: 'Pricing issue' },
   { value: 'STOCK_UNAVAILABLE', label: 'Stock unavailable' },
   { value: 'DUPLICATE_ORDER', label: 'Duplicate order' },
   { value: 'OTHER', label: 'Other' },
 ];
 
 interface CancelDialogProps {
   isOpen: boolean;
   onConfirm: (reasonCode: string, reason: string) => void;
   onCancel: () => void;
   isLoading?: boolean;
 }
 
 function CancelDialog({ isOpen, onConfirm, onCancel, isLoading }: CancelDialogProps) {
   const [reasonCode, setReasonCode] = useState('CUSTOMER_REQUEST');
   const [reason, setReason] = useState('');
 
   if (!isOpen) return null;
   return (
     <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px]" onClick={onCancel} />
       <div
         className="relative w-full max-w-sm bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] p-6"
         style={{ boxShadow: 'var(--shadow-modal)', animation: 'slideUp 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
       >
         <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Cancel order</h3>
         <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">This cannot be undone.</p>
         <div className="mt-4 space-y-3">
           <div>
             <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Reason</label>
             <select
               value={reasonCode}
               onChange={(e) => setReasonCode(e.target.value)}
               className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors"
             >
               {CANCEL_REASON_CODES.map((r) => (
                 <option key={r.value} value={r.value}>{r.label}</option>
               ))}
             </select>
           </div>
           <div>
             <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Notes</label>
             <textarea
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               rows={2}
               placeholder="Optional details..."
               className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors resize-none"
             />
           </div>
         </div>
         <div className="mt-5 flex justify-end gap-2">
           <button type="button" onClick={onCancel} className="btn-secondary h-9 px-4 text-[13px]">Keep order</button>
           <button
             type="button"
             onClick={() => onConfirm(reasonCode, reason)}
             disabled={isLoading}
             className={clsx(
               'h-9 px-4 rounded-lg text-[13px] font-medium bg-[var(--color-error)] text-white hover:bg-[var(--color-error-hover)] active:scale-[0.98] transition-all',
               isLoading && 'opacity-60 pointer-events-none',
             )}
           >
             Cancel order
           </button>
         </div>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Lifecycle Stepper
 // ─────────────────────────────────────────────────────────────────────────────
 
 function LifecycleStepper({ status, isCancelled }: { status: string; isCancelled: boolean }) {
   const currentIdx = getStageIndex(status);
 
   return (
     <div className="w-full">
       {isCancelled ? (
         <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-error-bg)]">
           <AlertCircle size={15} className="text-[var(--color-error)] shrink-0" />
           <span className="text-[13px] font-medium text-[var(--color-error)]">Order Cancelled</span>
         </div>
       ) : (
         <>
           {/* Desktop stepper */}
           <div className="hidden sm:flex items-center w-full">
             {LIFECYCLE_STAGES.map((stage, idx) => {
               const isDone = idx < currentIdx;
               const isActive = idx === currentIdx;
               return (
                 <div key={stage.key} className="flex items-center flex-1 min-w-0">
                   <div className="flex flex-col items-center min-w-0">
                     {/* Circle */}
                     <div className={clsx(
                       'h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 shrink-0',
                       isDone
                         ? 'bg-[var(--color-neutral-900)] border-[var(--color-neutral-900)]'
                         : isActive
                         ? 'bg-[var(--color-surface-primary)] border-[var(--color-neutral-900)]'
                         : 'bg-[var(--color-surface-secondary)] border-[var(--color-border-default)]',
                     )}>
                       {isDone ? (
                         <CheckCircle2 size={14} className="text-white" />
                       ) : isActive ? (
                         <Circle size={10} className="text-[var(--color-neutral-900)] fill-[var(--color-neutral-900)]" />
                       ) : (
                         <Circle size={10} className="text-[var(--color-border-default)]" />
                       )}
                     </div>
                     {/* Label */}
                     <span className={clsx(
                       'mt-1.5 text-[10px] font-medium whitespace-nowrap',
                       isDone ? 'text-[var(--color-text-secondary)]' :
                       isActive ? 'text-[var(--color-text-primary)]' :
                       'text-[var(--color-text-tertiary)]',
                     )}>
                       {stage.label}
                     </span>
                   </div>
                   {/* Connector */}
                   {idx < LIFECYCLE_STAGES.length - 1 && (
                     <div className={clsx(
                       'flex-1 h-0.5 mx-2 mb-5 transition-all duration-200',
                       isDone ? 'bg-[var(--color-neutral-900)]' : 'bg-[var(--color-border-default)]',
                     )} />
                   )}
                 </div>
               );
             })}
           </div>
           {/* Mobile stepper (vertical) */}
           <div className="sm:hidden space-y-0">
             {LIFECYCLE_STAGES.map((stage, idx) => {
               const isDone = idx < currentIdx;
               const isActive = idx === currentIdx;
               return (
                 <div key={stage.key} className="flex items-start gap-3">
                   <div className="flex flex-col items-center">
                     <div className={clsx(
                       'h-7 w-7 rounded-full flex items-center justify-center border-2 shrink-0',
                       isDone ? 'bg-[var(--color-neutral-900)] border-[var(--color-neutral-900)]' :
                       isActive ? 'bg-[var(--color-surface-primary)] border-[var(--color-neutral-900)]' :
                       'bg-[var(--color-surface-secondary)] border-[var(--color-border-default)]',
                     )}>
                       {isDone ? <CheckCircle2 size={12} className="text-white" /> :
                        isActive ? <Circle size={8} className="text-[var(--color-neutral-900)] fill-[var(--color-neutral-900)]" /> :
                        <Circle size={8} className="text-[var(--color-border-default)]" />}
                     </div>
                     {idx < LIFECYCLE_STAGES.length - 1 && (
                       <div className={clsx('w-0.5 h-5 mt-0.5', isDone ? 'bg-[var(--color-neutral-900)]' : 'bg-[var(--color-border-default)]')} />
                     )}
                   </div>
                   <p className={clsx(
                     'text-[13px] font-medium mt-0.5',
                     isActive ? 'text-[var(--color-text-primary)]' :
                     isDone ? 'text-[var(--color-text-secondary)]' :
                     'text-[var(--color-text-tertiary)]',
                   )}>
                     {stage.label}
                   </p>
                 </div>
               );
             })}
           </div>
         </>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function OrderDetailPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
  const { success, error: toastError } = useToast();
 
   const [order, setOrder] = useState<SalesOrderDto | null>(null);
   const [timeline, setTimeline] = useState<SalesOrderStatusHistoryDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [isActionLoading, setIsActionLoading] = useState(false);
 
   const loadOrder = useCallback(async () => {
     if (!id) return;
     setIsLoading(true);
     setError(null);
     try {
      const [timelineResult] = await Promise.all([
         salesApi.getOrderTimeline(Number(id)),
       ]);
      const orderData = await salesApi.getOrder(Number(id));
       if (!orderData) {
         setError('Order not found');
         return;
       }
      setOrder(orderData);
       setTimeline(timelineResult);
     } catch {
       setError("Couldn't load order details.");
     } finally {
       setIsLoading(false);
     }
   }, [id]);
 
   useEffect(() => {
     loadOrder();
   }, [loadOrder]);
 
   const handleConfirm = useCallback(async () => {
     if (!order) return;
     setIsActionLoading(true);
     try {
       const updated = await salesApi.confirmOrder(order.id);
       setOrder(updated);
      success(`Order ${order.orderNumber} confirmed`);
       loadOrder();
     } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to confirm');
     } finally {
       setIsActionLoading(false);
     }
  }, [order, loadOrder, success, toastError]);
 
   const handleCancel = useCallback(async (reasonCode: string, reason: string) => {
     if (!order) return;
     setIsActionLoading(true);
     try {
       const updated = await salesApi.cancelOrder(order.id, { reasonCode, reason });
       setOrder(updated);
       setCancelOpen(false);
      success(`Order ${order.orderNumber} cancelled`);
       loadOrder();
     } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to cancel');
     } finally {
       setIsActionLoading(false);
     }
  }, [order, loadOrder, success, toastError]);
 
   if (isLoading) {
     return (
       <div className="space-y-6">
         <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
           <ArrowLeft size={14} />
           Back to orders
         </button>
         <div className="space-y-4">
           <Skeleton height={32} width="40%" />
           <Skeleton height={20} width="25%" />
           <div className="p-4 border border-[var(--color-border-default)] rounded-xl">
             <Skeleton height={40} />
           </div>
         </div>
       </div>
     );
   }
 
   if (error || !order) {
     return (
       <div className="space-y-4">
         <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
           <ArrowLeft size={14} />
           Back to orders
         </button>
         <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={15} className="shrink-0" />
           <span className="flex-1">{error ?? 'Order not found'}</span>
           <button type="button" onClick={loadOrder} className="flex items-center gap-1.5 text-[12px] font-medium underline underline-offset-2">
             <RefreshCcw size={12} /> Retry
           </button>
         </div>
       </div>
     );
   }
 
   const isCancelled = order.status.toUpperCase() === 'CANCELLED';
  // Action gating: only show actions valid for the current lifecycle stage
  // Draft: Edit, Delete, Confirm
  // Confirmed: Cancel (if not dispatched)
  // Ready to Ship / Dispatched / Invoiced / Settled / Closed: no edit/delete/confirm
  const canConfirm = order.status.toUpperCase() === 'DRAFT';
  const canCancel = ['DRAFT', 'CONFIRMED'].includes(order.status.toUpperCase());
 
   // GST breakdown
   const subtotal = order.subtotalAmount ?? order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
   const gstTotal = order.gstTotal ?? (order.totalAmount - subtotal);
   const cgst = order.items.reduce((s, i) => s + (i.cgstAmount ?? 0), 0);
   const sgst = order.items.reduce((s, i) => s + (i.sgstAmount ?? 0), 0);
   const igst = order.items.reduce((s, i) => s + (i.igstAmount ?? 0), 0);
   const hasGstBreakdown = cgst > 0 || sgst > 0 || igst > 0;
 
   return (
     <div className="space-y-5">
       {/* Back */}
       <button
         type="button"
         onClick={() => navigate(-1)}
         className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
       >
         <ArrowLeft size={14} />
         Back to orders
       </button>
 
       {/* ── Header ───────────────────────────────────────────────── */}
       <div className="flex items-start justify-between gap-4 flex-wrap">
         <div>
           <div className="flex items-center gap-2.5 flex-wrap">
             <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
               {order.orderNumber}
             </h1>
             <StatusBadge status={order.status} />
           </div>
           <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
             {order.dealerName ?? 'Unknown Dealer'} · Created {fmtDate(order.createdAt)}
           </p>
         </div>
         <div className="text-right">
           <p className="text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">
             {fmtCurrency(order.totalAmount)}
           </p>
           <p className="text-[11px] text-[var(--color-text-tertiary)] mt-px">Grand Total</p>
         </div>
       </div>
 
       {/* ── Lifecycle Stepper ─────────────────────────────────────── */}
       <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-5">
         <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4">
           Order Lifecycle
         </p>
         <LifecycleStepper status={order.status} isCancelled={isCancelled} />
       </div>
 
       {/* ── Line Items ───────────────────────────────────────────── */}
       {order.items.length > 0 && (
         <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
           <p className="px-4 py-3 border-b border-[var(--color-border-subtle)] text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
             Line Items
           </p>
           {/* Desktop */}
           <div className="hidden sm:block overflow-x-auto">
             <table className="w-full text-[13px]">
               <thead>
                 <tr className="border-b border-[var(--color-border-subtle)]">
                   {['Product', 'Description', 'Qty', 'Unit Price', 'GST%', 'Line Total'].map((h) => (
                     <th
                       key={h}
                       className={clsx(
                         'px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]',
                         ['Qty', 'Unit Price', 'GST%', 'Line Total'].includes(h) ? 'text-right' : 'text-left',
                       )}
                     >
                       {h}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {order.items.map((item, idx) => {
                   const lineTotal = item.lineTotal ?? (item.quantity * item.unitPrice * (1 + (item.gstRate ?? 0) / 100));
                   return (
                     <tr key={idx} className="border-b border-[var(--color-border-subtle)] last:border-0">
                       <td className="px-3 py-2.5 font-medium text-[var(--color-text-primary)]">{item.productCode}</td>
                       <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{item.description ?? '—'}</td>
                       <td className="px-3 py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">{item.quantity}</td>
                       <td className="px-3 py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">{fmtCurrency(item.unitPrice)}</td>
                       <td className="px-3 py-2.5 text-right tabular-nums text-[var(--color-text-tertiary)]">{item.gstRate ?? 0}%</td>
                       <td className="px-3 py-2.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">{fmtCurrency(lineTotal)}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
           {/* Mobile */}
           <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
             {order.items.map((item, idx) => {
               const lineTotal = item.lineTotal ?? (item.quantity * item.unitPrice * (1 + (item.gstRate ?? 0) / 100));
               return (
                 <div key={idx} className="p-3 space-y-1.5">
                   <div className="flex items-center justify-between">
                     <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{item.productCode}</span>
                     <span className="text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">{fmtCurrency(lineTotal)}</span>
                   </div>
                   {item.description && <p className="text-[11px] text-[var(--color-text-tertiary)]">{item.description}</p>}
                   <p className="text-[11px] text-[var(--color-text-tertiary)]">
                     {item.quantity} × {fmtCurrency(item.unitPrice)} · GST {item.gstRate ?? 0}%
                   </p>
                 </div>
               );
             })}
           </div>
 
           {/* GST Summary */}
           <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
             <div className="max-w-[260px] ml-auto space-y-1.5">
               <div className="flex justify-between text-[12px]">
                 <span className="text-[var(--color-text-tertiary)]">Subtotal</span>
                 <span className="tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(subtotal)}</span>
               </div>
               {hasGstBreakdown ? (
                 <>
                   {cgst > 0 && (
                     <div className="flex justify-between text-[12px]">
                       <span className="text-[var(--color-text-tertiary)]">CGST</span>
                       <span className="tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(cgst)}</span>
                     </div>
                   )}
                   {sgst > 0 && (
                     <div className="flex justify-between text-[12px]">
                       <span className="text-[var(--color-text-tertiary)]">SGST</span>
                       <span className="tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(sgst)}</span>
                     </div>
                   )}
                   {igst > 0 && (
                     <div className="flex justify-between text-[12px]">
                       <span className="text-[var(--color-text-tertiary)]">IGST</span>
                       <span className="tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(igst)}</span>
                     </div>
                   )}
                 </>
               ) : gstTotal > 0 ? (
                 <div className="flex justify-between text-[12px]">
                   <span className="text-[var(--color-text-tertiary)]">GST</span>
                   <span className="tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(gstTotal)}</span>
                 </div>
               ) : null}
               <div className="flex justify-between text-[13px] font-semibold pt-1.5 border-t border-[var(--color-border-subtle)]">
                 <span className="text-[var(--color-text-primary)]">Grand Total</span>
                 <span className="tabular-nums text-[var(--color-text-primary)]">{fmtCurrency(order.totalAmount)}</span>
               </div>
             </div>
           </div>
         </div>
       )}
 
       {/* ── Timeline ─────────────────────────────────────────────── */}
       {timeline.length > 0 && (
         <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
           <p className="px-4 py-3 border-b border-[var(--color-border-subtle)] text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
             Activity Timeline
           </p>
           <div className="p-4 space-y-3">
             {timeline.map((entry) => (
               <div key={entry.id} className="flex items-start gap-3">
                 <div className="shrink-0 mt-0.5">
                   <Clock size={13} className="text-[var(--color-text-tertiary)]" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 flex-wrap">
                     <span className="text-[12px] font-medium text-[var(--color-text-primary)]">
                       {entry.fromStatus ? `${STATUS_LABELS[entry.fromStatus.toUpperCase()] ?? entry.fromStatus} → ` : ''}
                       {STATUS_LABELS[entry.toStatus.toUpperCase()] ?? entry.toStatus}
                     </span>
                     {entry.reasonCode && (
                       <span className="text-[10px] bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] px-1.5 py-px rounded-full">
                         {entry.reasonCode}
                       </span>
                     )}
                   </div>
                   {entry.reason && (
                     <p className="text-[11px] text-[var(--color-text-tertiary)] mt-px">{entry.reason}</p>
                   )}
                   <p className="text-[11px] text-[var(--color-text-tertiary)] mt-px">
                     {entry.changedBy} · {fmtDateFull(entry.changedAt)}
                   </p>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}
 
       {/* ── Actions ──────────────────────────────────────────────── */}
       {(canConfirm || canCancel) && (
         <div className="sticky bottom-0 sm:static sm:bottom-auto -mx-0 bg-[var(--color-surface-primary)] sm:bg-transparent border-t sm:border-t-0 border-[var(--color-border-subtle)] px-4 py-3 sm:px-0 sm:py-0 flex items-center gap-2 flex-wrap">
           {canConfirm && (
             <button
               type="button"
               onClick={handleConfirm}
               disabled={isActionLoading}
               className={clsx(
                 'h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-150',
                 'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)] hover:bg-[var(--color-neutral-800)] active:scale-[0.98]',
                 isActionLoading && 'opacity-60 pointer-events-none',
               )}
             >
               {isActionLoading ? 'Confirming...' : 'Confirm order'}
             </button>
           )}
           {canCancel && (
             <button
               type="button"
               onClick={() => setCancelOpen(true)}
               className="h-9 px-4 rounded-lg text-[13px] font-medium border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-all duration-150"
             >
               Cancel order
             </button>
           )}
         </div>
       )}
 
       <CancelDialog
         isOpen={cancelOpen}
         onConfirm={handleCancel}
         onCancel={() => setCancelOpen(false)}
         isLoading={isActionLoading}
       />
     </div>
   );
 }

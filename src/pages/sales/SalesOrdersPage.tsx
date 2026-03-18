 /**
  * SalesOrdersPage
  *
  * Paginated list of sales orders with:
  *  - Search by order number or dealer name
  *  - Date range filter
  *  - Status filter
  *  - Create order (opens CreateOrderDrawer)
  *  - Edit draft order
  *  - Delete draft with ConfirmDialog
  *  - Confirm draft → Confirmed
  *  - Cancel (Draft/Confirmed) with reason dialog
  *  - Row click → OrderDetailPage
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   Plus,
   AlertCircle,
   RefreshCcw,
   Search,
   X,
   ChevronLeft,
   ChevronRight,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { salesApi } from '@/lib/salesApi';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { CreateOrderDrawer } from './CreateOrderDrawer';
 import type { SalesOrderDto, PageResponse } from '@/types';
 import { useToast } from '@/components/ui/Toast';
 
 // ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
 
 function fmtCurrency(value: number): string {
   return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
 }
 
 function fmtDate(iso: string): string {
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
 
 function statusBadge(status: string) {
   const variant = (() => {
     switch (status.toUpperCase()) {
       case 'CONFIRMED':
       case 'RESERVED': return 'success';
       case 'CANCELLED': return 'error';
       case 'DRAFT': return 'warning';
       case 'DISPATCHED':
       case 'INVOICED': return 'info';
       case 'SETTLED':
       case 'CLOSED': return 'neutral';
       default: return 'neutral';
     }
   })();
 
   const cls = {
     success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
     error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
     warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
     info: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
     neutral: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]',
   }[variant];
 
   return (
     <span className={clsx('text-[10px] font-medium px-1.5 py-px rounded-full whitespace-nowrap', cls)}>
       {STATUS_LABELS[status.toUpperCase()] ?? status}
     </span>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Cancel Reason Dialog
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
   orderNumber: string;
   onConfirm: (reasonCode: string, reason: string) => void;
   onCancel: () => void;
   isLoading?: boolean;
 }
 
 function CancelDialog({ isOpen, orderNumber, onConfirm, onCancel, isLoading }: CancelDialogProps) {
   const [reasonCode, setReasonCode] = useState('CUSTOMER_REQUEST');
   const [reason, setReason] = useState('');
 
   if (!isOpen) return null;
 
   return (
     <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
       <div
         className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px]"
         onClick={onCancel}
         style={{ animation: 'fadeIn 200ms ease-out forwards' }}
       />
       <div
         className="relative w-full max-w-sm bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] p-6"
         style={{
           boxShadow: 'var(--shadow-modal)',
           animation: 'slideUp 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
         }}
       >
         <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
           Cancel order
         </h3>
         <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
           {orderNumber} — This cannot be undone.
         </p>
 
         <div className="mt-4 space-y-3">
           <div>
             <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
               Reason
             </label>
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
             <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
               Additional notes
             </label>
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
           <button
             type="button"
             onClick={onCancel}
             className="btn-secondary h-9 px-4 text-[13px]"
           >
             Keep order
           </button>
           <button
             type="button"
             onClick={() => onConfirm(reasonCode, reason)}
             disabled={isLoading}
             className={clsx(
               'h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-150',
               'bg-[var(--color-error)] text-white hover:bg-[var(--color-error-hover)] active:scale-[0.98]',
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
 // Row Actions dropdown
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface RowActionsProps {
   order: SalesOrderDto;
   onEdit: () => void;
   onDelete: () => void;
   onConfirm: () => void;
   onCancel: () => void;
 }
 
 function RowActions({ order, onEdit, onDelete, onConfirm, onCancel }: RowActionsProps) {
   const [open, setOpen] = useState(false);
   const isDraft = ['DRAFT', 'RESERVED', 'PENDING_PRODUCTION'].includes(order.status.toUpperCase());
   const canConfirm = ['DRAFT', 'RESERVED', 'PENDING_PRODUCTION', 'PENDING_INVENTORY', 'READY_TO_SHIP', 'PROCESSING'].includes(order.status.toUpperCase());
   const canCancel = ['DRAFT', 'CONFIRMED', 'RESERVED', 'PENDING_PRODUCTION'].includes(order.status.toUpperCase());
 
   if (!isDraft && !canConfirm && !canCancel) return null;
 
   return (
     <div className="relative" onClick={(e) => e.stopPropagation()}>
       <button
         type="button"
         onClick={() => setOpen(!open)}
         className="h-7 px-2 rounded-md text-[11px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
       >
         Actions
       </button>
       {open && (
         <>
           <div className="fixed inset-0 z-[var(--z-dropdown)]" onClick={() => setOpen(false)} />
           <div className="absolute right-0 top-8 z-[calc(var(--z-dropdown)+1)] w-40 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg shadow-lg overflow-hidden">
             {isDraft && (
               <button
                 type="button"
                 onClick={() => { setOpen(false); onEdit(); }}
                 className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
               >
                 Edit draft
               </button>
             )}
             {canConfirm && (
               <button
                 type="button"
                 onClick={() => { setOpen(false); onConfirm(); }}
                 className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-success)] hover:bg-[var(--color-success-bg)] transition-colors"
               >
                 Confirm order
               </button>
             )}
             {canCancel && (
               <button
                 type="button"
                 onClick={() => { setOpen(false); onCancel(); }}
                 className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors"
               >
                 Cancel order
               </button>
             )}
             {isDraft && (
               <div className="border-t border-[var(--color-border-subtle)]">
                 <button
                   type="button"
                   onClick={() => { setOpen(false); onDelete(); }}
                   className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors"
                 >
                   Delete draft
                 </button>
               </div>
             )}
           </div>
         </>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function SalesOrdersPage() {
   const navigate = useNavigate();
  const { success, error: toastError } = useToast();
 
   // Filters state
   const [searchQuery, setSearchQuery] = useState('');
   const [statusFilter, setStatusFilter] = useState('');
   const [fromDate, setFromDate] = useState('');
   const [toDate, setToDate] = useState('');
   const [page, setPage] = useState(0);
   const pageSize = 20;
 
   // Data state
   const [result, setResult] = useState<PageResponse<SalesOrderDto> | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Action dialogs
   const [createOpen, setCreateOpen] = useState(false);
   const [editOrder, setEditOrder] = useState<SalesOrderDto | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<SalesOrderDto | null>(null);
   const [cancelTarget, setCancelTarget] = useState<SalesOrderDto | null>(null);
   const [isActionLoading, setIsActionLoading] = useState(false);
 
   const loadOrders = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await salesApi.searchOrders({
         status: statusFilter || undefined,
         orderNumber: searchQuery || undefined,
         fromDate: fromDate ? `${fromDate}T00:00:00Z` : undefined,
         toDate: toDate ? `${toDate}T23:59:59Z` : undefined,
         page,
         size: pageSize,
       });
       setResult(data);
     } catch {
       setError("Couldn't load orders. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, [searchQuery, statusFilter, fromDate, toDate, page, pageSize]);
 
   useEffect(() => {
     loadOrders();
   }, [loadOrders]);
 
   const handleDeleteConfirm = useCallback(async () => {
     if (!deleteTarget) return;
     setIsActionLoading(true);
     try {
       await salesApi.deleteOrder(deleteTarget.id);
       success(`Order ${deleteTarget.orderNumber} deleted`);
       setDeleteTarget(null);
       loadOrders();
     } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete');
     } finally {
       setIsActionLoading(false);
     }
  }, [deleteTarget, loadOrders, success, toastError]);
 
   const handleConfirmOrder = useCallback(async (order: SalesOrderDto) => {
     setIsActionLoading(true);
     try {
       await salesApi.confirmOrder(order.id);
       success(`Order ${order.orderNumber} confirmed`);
       loadOrders();
     } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to confirm');
     } finally {
       setIsActionLoading(false);
     }
  }, [loadOrders, success, toastError]);
 
   const handleCancelConfirm = useCallback(async (reasonCode: string, reason: string) => {
     if (!cancelTarget) return;
     setIsActionLoading(true);
     try {
       await salesApi.cancelOrder(cancelTarget.id, { reasonCode, reason });
       success(`Order ${cancelTarget.orderNumber} cancelled`);
       setCancelTarget(null);
       loadOrders();
     } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to cancel');
     } finally {
       setIsActionLoading(false);
     }
  }, [cancelTarget, loadOrders, success, toastError]);
 
   const orders = result?.content ?? [];
   const totalPages = result?.totalPages ?? 0;
   const totalElements = result?.totalElements ?? 0;
 
   const clearFilters = () => {
     setSearchQuery('');
     setStatusFilter('');
     setFromDate('');
     setToDate('');
     setPage(0);
   };
   const hasFilters = searchQuery || statusFilter || fromDate || toDate;
 
   return (
     <div className="space-y-4">
       {/* ── Page Header ─────────────────────────────────────────────── */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Sales Orders</h1>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-px">
             {isLoading ? 'Loading...' : `${totalElements} order${totalElements !== 1 ? 's' : ''}`}
           </p>
         </div>
         <button
           type="button"
           onClick={() => setCreateOpen(true)}
           className="btn-primary h-9 px-4 text-[13px] flex items-center gap-1.5"
         >
           <Plus size={14} />
           New Order
         </button>
       </div>
 
       {/* ── Filters ─────────────────────────────────────────────────── */}
       <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
         {/* Search — full-width on mobile, fixed on sm+ */}
         <div className="relative">
           <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
           <input
             type="text"
             value={searchQuery}
             onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
             placeholder="Search order or dealer..."
             className="h-8 pl-8 pr-3 w-full sm:w-52 text-[13px] bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-300)] transition-all"
           />
         </div>

         {/* Status, date range, and actions — wrap as a flex row */}
         <div className="flex items-center flex-wrap gap-2">
 
         {/* Status filter */}
         <select
           value={statusFilter}
           onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
           className="h-8 px-2 text-[13px] bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-300)] transition-all"
         >
           <option value="">All statuses</option>
           <option value="DRAFT">Draft</option>
           <option value="CONFIRMED">Confirmed</option>
           <option value="DISPATCHED">Dispatched</option>
           <option value="INVOICED">Invoiced</option>
           <option value="SETTLED">Settled</option>
           <option value="CLOSED">Closed</option>
           <option value="CANCELLED">Cancelled</option>
         </select>
 
         {/* Date range */}
         <input
           type="date"
           value={fromDate}
           onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
           className="h-8 px-2 text-[13px] bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-300)] transition-all"
         />
         <span className="text-[12px] text-[var(--color-text-tertiary)]">to</span>
         <input
           type="date"
           value={toDate}
           onChange={(e) => { setToDate(e.target.value); setPage(0); }}
           className="h-8 px-2 text-[13px] bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-300)] transition-all"
         />
 
         {hasFilters && (
           <button
             type="button"
             onClick={clearFilters}
             className="h-8 px-2 flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
           >
             <X size={12} />
             Clear
           </button>
         )}
 
         <button
           type="button"
           onClick={loadOrders}
           className="h-8 px-2 flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
         >
           <RefreshCcw size={12} />
         </button>
         </div>
       </div>
 
       {/* ── Error ────────────────────────────────────────────────────── */}
       {error && (
         <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={15} className="shrink-0" />
           <span className="flex-1">{error}</span>
           <button type="button" onClick={loadOrders} className="text-[12px] font-medium underline underline-offset-2">
             Retry
           </button>
         </div>
       )}
 
       {/* ── Table ────────────────────────────────────────────────────── */}
       <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
         {/* Desktop table */}
         <div className="hidden sm:block overflow-x-auto">
           <table className="w-full text-[13px]">
             <thead>
               <tr className="border-b border-[var(--color-border-default)]">
                 {['Order', 'Dealer', 'Status', 'Total', 'Date', ''].map((h) => (
                   <th
                     key={h}
                     className={clsx(
                       'px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] bg-[var(--color-surface-primary)]',
                       h === 'Total' || h === '' ? 'text-right' : 'text-left',
                     )}
                   >
                     {h}
                   </th>
                 ))}
               </tr>
             </thead>
             <tbody>
               {isLoading
                 ? Array.from({ length: 5 }).map((_, i) => (
                   <tr key={`sk-${i}`} className="border-b border-[var(--color-border-subtle)]">
                     {[1, 2, 3, 4, 5, 6].map((c) => (
                       <td key={c} className="px-3 py-3">
                         <div
                           className="h-3.5 rounded bg-[var(--color-surface-tertiary)] animate-pulse"
                           style={{ width: `${40 + (i * 13 + c * 7) % 40}%` }}
                         />
                       </td>
                     ))}
                   </tr>
                 ))
                 : orders.length === 0
                 ? (
                   <tr>
                     <td colSpan={6} className="px-3 py-12 text-center text-[13px] text-[var(--color-text-tertiary)]">
                       {hasFilters ? 'No orders match these filters.' : 'No orders yet. Create your first order.'}
                     </td>
                   </tr>
                 )
                 : orders.map((order) => (
                   <tr
                     key={order.id}
                     onClick={() => navigate(`/sales/orders/${order.id}`)}
                     className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
                   >
                     <td className="px-3 py-2.5 font-medium text-[var(--color-text-primary)]">
                       {order.orderNumber}
                     </td>
                     <td className="px-3 py-2.5 text-[var(--color-text-secondary)] max-w-[140px] truncate">
                       {order.dealerName ?? '—'}
                     </td>
                     <td className="px-3 py-2.5">
                       {statusBadge(order.status)}
                     </td>
                     <td className="px-3 py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                       {fmtCurrency(order.totalAmount)}
                     </td>
                     <td className="px-3 py-2.5 text-[var(--color-text-tertiary)]">
                       {fmtDate(order.createdAt)}
                     </td>
                     <td className="px-3 py-2.5 text-right">
                       <RowActions
                         order={order}
                         onEdit={() => setEditOrder(order)}
                         onDelete={() => setDeleteTarget(order)}
                         onConfirm={() => handleConfirmOrder(order)}
                         onCancel={() => setCancelTarget(order)}
                       />
                     </td>
                   </tr>
                 ))}
             </tbody>
           </table>
         </div>
 
         {/* Mobile cards */}
         <div className="sm:hidden">
           {isLoading ? (
             <div className="space-y-2 p-3">
               {Array.from({ length: 3 }).map((_, i) => (
                 <div key={`msk-${i}`} className="p-3 rounded-lg border border-[var(--color-border-subtle)] space-y-2 animate-pulse">
                   <div className="h-3.5 w-2/3 rounded bg-[var(--color-surface-tertiary)]" />
                   <div className="h-3 w-1/2 rounded bg-[var(--color-surface-tertiary)]" />
                   <div className="h-3 w-1/3 rounded bg-[var(--color-surface-tertiary)]" />
                 </div>
               ))}
             </div>
           ) : orders.length === 0 ? (
             <div className="p-8 text-center text-[13px] text-[var(--color-text-tertiary)]">
               No orders found.
             </div>
           ) : (
             <div className="space-y-2 p-3">
               {orders.map((order) => (
                 <div
                   key={order.id}
                   onClick={() => navigate(`/sales/orders/${order.id}`)}
                   className="p-3 rounded-lg border border-[var(--color-border-subtle)] cursor-pointer active:bg-[var(--color-surface-secondary)] transition-colors"
                 >
                   <div className="flex items-center justify-between mb-1.5">
                     <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                       {order.orderNumber}
                     </span>
                     {statusBadge(order.status)}
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-[var(--color-text-tertiary)]">
                       {order.dealerName ?? '—'} · {fmtDate(order.createdAt)}
                     </span>
                     <span className="text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                       {fmtCurrency(order.totalAmount)}
                     </span>
                   </div>
                   <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
                     <RowActions
                       order={order}
                       onEdit={() => setEditOrder(order)}
                       onDelete={() => setDeleteTarget(order)}
                       onConfirm={() => handleConfirmOrder(order)}
                       onCancel={() => setCancelTarget(order)}
                     />
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
 
         {/* Pagination */}
         {!isLoading && totalElements > 0 && (
           <div className="flex items-center justify-between px-3 py-2.5 border-t border-[var(--color-border-default)]">
             <span className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
               {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
             </span>
             <div className="flex items-center gap-0.5">
               <button
                 type="button"
                 onClick={() => setPage((p) => Math.max(0, p - 1))}
                 disabled={page === 0}
                 className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] disabled:opacity-25 transition-colors"
               >
                 <ChevronLeft size={14} />
               </button>
               <button
                 type="button"
                 onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                 disabled={page >= totalPages - 1}
                 className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] disabled:opacity-25 transition-colors"
               >
                 <ChevronRight size={14} />
               </button>
             </div>
           </div>
         )}
       </div>
 
       {/* ── Dialogs ──────────────────────────────────────────────────── */}
 
       <CreateOrderDrawer
         isOpen={createOpen || !!editOrder}
         onClose={() => { setCreateOpen(false); setEditOrder(null); }}
         onSuccess={(order) => {
           setCreateOpen(false);
           setEditOrder(null);
          success(editOrder ? `Order ${order.orderNumber} updated` : `Order ${order.orderNumber} created`);
           loadOrders();
         }}
         editOrder={editOrder}
       />
 
       <ConfirmDialog
         isOpen={!!deleteTarget}
         title="Delete draft order"
         message={`Are you sure you want to delete order ${deleteTarget?.orderNumber}? This cannot be undone.`}
         confirmLabel="Delete"
         variant="danger"
         isLoading={isActionLoading}
         onConfirm={handleDeleteConfirm}
         onCancel={() => setDeleteTarget(null)}
       />
 
       <CancelDialog
         isOpen={!!cancelTarget}
         orderNumber={cancelTarget?.orderNumber ?? ''}
         onConfirm={handleCancelConfirm}
         onCancel={() => setCancelTarget(null)}
         isLoading={isActionLoading}
       />
     </div>
   );
 }

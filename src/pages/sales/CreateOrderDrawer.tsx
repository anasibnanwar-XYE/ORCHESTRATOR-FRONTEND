 /**
  * CreateOrderDrawer
  *
  * Right-side drawer for creating (and editing draft) sales orders.
  *
  * Features:
  *  - Searchable dealer combobox (only active, non-dunning dealers)
  *  - Line items table (product code, qty, unit price, computed line total)
  *  - GST auto-calculation: CGST+SGST for intra-state, IGST for inter-state
  *    based on dealer stateCode (if same as company state → intra, else inter)
  *  - Subtotal / GST breakdown / Grand total footer
  *  - Validates required fields before submission
  */
 
 import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
 import { Plus, Trash2, Search, Check, Building2, X, ChevronDown } from 'lucide-react';
 import { clsx } from 'clsx';
 import { v4 as uuidv4 } from 'uuid';
 import { Drawer } from '@/components/ui/Drawer';
 import { salesApi } from '@/lib/salesApi';
 import type { DealerLookupResponse, SalesOrderDto } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface LineItem {
   _id: string;
   productCode: string;
   description: string;
   quantity: string;
   unitPrice: string;
   gstRate: string; // per-item GST rate %
 }
 
 type GstMode = 'NONE' | 'CGST_SGST' | 'IGST';
 
 // Company state code — in production this would come from company settings.
 // For now, default to MH (Maharashtra) as a common case.
 const COMPANY_STATE_CODE = 'MH';
 
 function inferGstMode(dealerStateCode?: string): GstMode {
   if (!dealerStateCode) return 'CGST_SGST'; // default intra-state
   return dealerStateCode.toUpperCase() === COMPANY_STATE_CODE ? 'CGST_SGST' : 'IGST';
 }
 
 function emptyLine(): LineItem {
   return { _id: uuidv4(), productCode: '', description: '', quantity: '1', unitPrice: '', gstRate: '18' };
 }
 
 function fmt(v: number) {
   return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Dealer Combobox — searchable, async
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface DealerComboboxProps {
   value: DealerLookupResponse | null;
   onChange: (dealer: DealerLookupResponse | null) => void;
   error?: string;
 }
 
 function DealerCombobox({ value, onChange, error }: DealerComboboxProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [query, setQuery] = useState('');
   const [results, setResults] = useState<DealerLookupResponse[]>([]);
   const [isSearching, setIsSearching] = useState(false);
   // Fixed-position rect for the dropdown so it is never clipped by overflow-y-auto parents.
   const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const buttonRef = useRef<HTMLButtonElement>(null);
   const searchRef = useRef<HTMLInputElement>(null);
   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 
   useEffect(() => {
     const handleClick = (e: MouseEvent) => {
       if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
         setIsOpen(false);
       }
     };
     document.addEventListener('mousedown', handleClick);
     return () => document.removeEventListener('mousedown', handleClick);
   }, []);
 
   // Reposition dropdown if window resizes or scrolls while open.
   useEffect(() => {
     if (!isOpen) return;
     const reposition = () => {
       if (buttonRef.current) {
         const rect = buttonRef.current.getBoundingClientRect();
         setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
       }
     };
     window.addEventListener('resize', reposition);
     window.addEventListener('scroll', reposition, true);
     return () => {
       window.removeEventListener('resize', reposition);
       window.removeEventListener('scroll', reposition, true);
     };
   }, [isOpen]);
 
   const doSearch = useCallback(async (q: string) => {
     setIsSearching(true);
     try {
       // Filter to ACTIVE dealers only (no dunning hold)
       const data = await salesApi.searchDealers(q, 'ACTIVE');
       // Exclude dealers that are OVER_LIMIT (dunning held)
       setResults(data.filter((d) => d.creditStatus !== 'OVER_LIMIT'));
     } catch {
       setResults([]);
     } finally {
       setIsSearching(false);
     }
   }, []);
 
   const openCombobox = useCallback(() => {
     if (buttonRef.current) {
       const rect = buttonRef.current.getBoundingClientRect();
       setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
     }
     setIsOpen(true);
   }, []);
 
   useEffect(() => {
     if (isOpen) {
       setTimeout(() => searchRef.current?.focus(), 50);
       // Load initial results
       doSearch('');
     }
   }, [isOpen, doSearch]);
 
   const handleQueryChange = useCallback((q: string) => {
     setQuery(q);
     if (debounceRef.current) clearTimeout(debounceRef.current);
     debounceRef.current = setTimeout(() => doSearch(q), 300);
   }, [doSearch]);
 
   return (
     <div ref={containerRef} className="relative">
       <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
         Dealer <span className="text-[var(--color-error)]">*</span>
       </label>
 
       <button
         ref={buttonRef}
         type="button"
         onClick={() => isOpen ? setIsOpen(false) : openCombobox()}
         className={clsx(
           'w-full h-9 flex items-center gap-2.5 px-3 text-left',
           'bg-[var(--color-surface-primary)] border rounded-lg transition-all duration-150',
           isOpen
             ? 'border-[var(--color-neutral-300)]'
             : error
               ? 'border-[var(--color-error)]'
               : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]',
         )}
       >
         {value ? (
           <>
             <Building2 size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
             <span className="flex-1 text-[13px] font-medium text-[var(--color-text-primary)] truncate">
               {value.name}
             </span>
             <span className="text-[11px] font-mono text-[var(--color-text-tertiary)] shrink-0">
               {value.code}
             </span>
             <button
               type="button"
               onClick={(e) => {
                 e.stopPropagation();
                 onChange(null);
               }}
               className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
             >
               <X size={12} />
             </button>
           </>
         ) : (
           <>
             <Building2 size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
             <span className="flex-1 text-[13px] text-[var(--color-text-tertiary)]">
               Search dealer...
             </span>
             <ChevronDown size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
           </>
         )}
       </button>
 
       {error && <p className="mt-1 text-[11px] text-[var(--color-error)]">{error}</p>}
 
       {/* Dropdown is rendered with fixed positioning so it is never clipped by
           the Drawer's overflow-y-auto scrollable content area. This is critical
           on phone where the entire drawer is a scroll container. */}
       {isOpen && dropdownRect && (
         <div
           style={{
             position: 'fixed',
             top: dropdownRect.top,
             left: dropdownRect.left,
             width: dropdownRect.width,
             zIndex: 400,
           }}
           className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg shadow-lg overflow-hidden"
         >
           <div className="p-2 border-b border-[var(--color-border-subtle)]">
             <div className="relative">
               <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
               <input
                 ref={searchRef}
                 type="text"
                 value={query}
                 onChange={(e) => handleQueryChange(e.target.value)}
                 placeholder="Name or code..."
                 className="w-full h-8 pl-8 pr-3 text-[13px] bg-[var(--color-surface-secondary)] border-0 rounded-md placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-300)]"
               />
             </div>
           </div>
           <div className="max-h-[200px] overflow-y-auto py-1">
             {isSearching ? (
               <div className="px-3 py-4 text-center text-[12px] text-[var(--color-text-tertiary)]">
                 Searching...
               </div>
             ) : results.length === 0 ? (
               <div className="px-3 py-4 text-center text-[12px] text-[var(--color-text-tertiary)]">
                 No active dealers found
               </div>
             ) : (
               results.map((dealer) => (
                 <button
                   key={dealer.id}
                   type="button"
                   onClick={() => {
                     onChange(dealer);
                     setIsOpen(false);
                     setQuery('');
                   }}
                   className={clsx(
                     'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                     value?.id === dealer.id
                       ? 'bg-[var(--color-surface-tertiary)]'
                       : 'hover:bg-[var(--color-surface-secondary)]',
                   )}
                 >
                   <Building2 size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                         {dealer.name}
                       </span>
                       <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)] px-1 py-px rounded">
                         {dealer.code}
                       </span>
                     </div>
                     {dealer.stateCode && (
                       <p className="text-[11px] text-[var(--color-text-tertiary)] mt-px">
                         State: {dealer.stateCode} · {dealer.gstRegistrationType ?? 'UNREGISTERED'}
                       </p>
                     )}
                   </div>
                   {value?.id === dealer.id && (
                     <Check size={13} className="shrink-0 text-[var(--color-neutral-900)]" />
                   )}
                 </button>
               ))
             )}
           </div>
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // CreateOrderDrawer
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface CreateOrderDrawerProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: (order: SalesOrderDto) => void;
   /** If provided, edit this draft order instead of creating a new one */
   editOrder?: SalesOrderDto | null;
 }
 
 const inputCls = 'w-full h-8 px-2 border border-transparent rounded-md text-[13px] text-[var(--color-text-primary)] bg-transparent hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none placeholder:text-[var(--color-text-tertiary)] transition-colors';
 const fieldCls = 'w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors duration-150';
 
 export function CreateOrderDrawer({ isOpen, onClose, onSuccess, editOrder }: CreateOrderDrawerProps) {
   const [selectedDealer, setSelectedDealer] = useState<DealerLookupResponse | null>(null);
   const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [dealerError, setDealerError] = useState<string | undefined>();
 
   // Reset form when drawer opens/closes or editOrder changes
   useEffect(() => {
     if (!isOpen) {
       setTimeout(() => {
         setSelectedDealer(null);
         setLines([emptyLine()]);
         setError(null);
         setDealerError(undefined);
       }, 300);
       return;
     }
     if (editOrder) {
       // Pre-fill form with existing draft
       setLines(
         editOrder.items.map((item) => ({
           _id: uuidv4(),
           productCode: item.productCode ?? '',
           description: item.description ?? '',
           quantity: String(item.quantity ?? 1),
           unitPrice: String(item.unitPrice ?? ''),
           gstRate: String(item.gstRate ?? 18),
         })),
       );
       if (editOrder.dealerId) {
         // Create a minimal DealerLookupResponse from order data
         setSelectedDealer({
           id: editOrder.dealerId,
           name: editOrder.dealerName ?? 'Unknown Dealer',
           code: '',
         });
       }
     } else {
       setLines([emptyLine()]);
       setSelectedDealer(null);
     }
     setError(null);
     setDealerError(undefined);
   }, [isOpen, editOrder]);
 
   const updateLine = useCallback((id: string, field: keyof LineItem, value: string) => {
     setLines((prev) =>
       prev.map((l) => (l._id === id ? { ...l, [field]: value } : l))
     );
   }, []);
 
   const removeLine = useCallback((id: string) => {
     setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l._id !== id)));
   }, []);
 
   // Infer GST mode from dealer's state code
   const gstMode = useMemo((): GstMode => inferGstMode(selectedDealer?.stateCode), [selectedDealer]);
 
   // Compute totals
   const totals = useMemo(() => {
     let subtotal = 0;
     let gst = 0;
 
     lines.forEach((l) => {
       const qty = parseFloat(l.quantity) || 0;
       const price = parseFloat(l.unitPrice) || 0;
       const rate = parseFloat(l.gstRate) || 0;
       const lineBase = qty * price;
       subtotal += lineBase;
       gst += lineBase * (rate / 100);
     });
 
     const total = subtotal + gst;
     const cgst = gstMode === 'CGST_SGST' ? gst / 2 : 0;
     const sgst = gstMode === 'CGST_SGST' ? gst / 2 : 0;
     const igst = gstMode === 'IGST' ? gst : 0;
 
     return { subtotal, gst, total, cgst, sgst, igst };
   }, [lines, gstMode]);
 
   const canSubmit = useMemo(() => {
     if (!selectedDealer) return false;
     return lines.some(
       (l) => l.productCode.trim() && parseFloat(l.quantity) > 0 && parseFloat(l.unitPrice) > 0
     );
   }, [selectedDealer, lines]);
 
   const handleSubmit = useCallback(async () => {
     if (!selectedDealer) {
       setDealerError('Please select a dealer');
       return;
     }
     setDealerError(undefined);
 
     const validLines = lines.filter(
       (l) => l.productCode.trim() && parseFloat(l.quantity) > 0 && parseFloat(l.unitPrice) > 0
     );
     if (validLines.length === 0) {
       setError('Add at least one valid line item.');
       return;
     }
 
     setIsSubmitting(true);
     setError(null);
     try {
       const request = {
         dealerId: selectedDealer.id,
         totalAmount: totals.total,
         currency: 'INR',
         gstTreatment: 'PER_ITEM' as const,
         items: validLines.map((l) => ({
           productCode: l.productCode.trim(),
           description: l.description.trim() || undefined,
           quantity: parseFloat(l.quantity),
           unitPrice: parseFloat(l.unitPrice),
           gstRate: parseFloat(l.gstRate) || 0,
         })),
       };
 
       let result: SalesOrderDto;
       if (editOrder) {
         result = await salesApi.updateOrder(editOrder.id, request);
       } else {
         result = await salesApi.createOrder(request);
       }
       onSuccess(result);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to save order');
     } finally {
       setIsSubmitting(false);
     }
   }, [selectedDealer, lines, totals, editOrder, onSuccess]);
 
   const isEdit = !!editOrder;
 
   return (
     <Drawer
       isOpen={isOpen}
       onClose={onClose}
       title={isEdit ? 'Edit draft order' : 'New sales order'}
       description={isEdit ? `Editing order ${editOrder?.orderNumber}` : 'Create an order against a dealer'}
       size="xl"
       footer={
         <>
           <button
             type="button"
             onClick={onClose}
             className="btn-secondary h-9 px-4 text-[13px]"
           >
             Discard
           </button>
           <button
             type="button"
             onClick={handleSubmit}
             disabled={!canSubmit || isSubmitting}
             className={clsx(
               'h-9 px-5 rounded-lg text-[13px] font-medium transition-all duration-150',
               canSubmit && !isSubmitting
                 ? 'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)] hover:bg-[var(--color-neutral-800)] active:scale-[0.98]'
                 : 'bg-[var(--color-neutral-200)] text-[var(--color-text-tertiary)] cursor-not-allowed',
             )}
           >
             {isSubmitting ? 'Saving...' : isEdit ? 'Update order' : 'Create order'}
           </button>
         </>
       }
     >
       <div className="space-y-5">
         {/* Error */}
         {error && (
           <div className="p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
             {error}
           </div>
         )}
 
         {/* Dealer */}
         <DealerCombobox
           value={selectedDealer}
           onChange={setSelectedDealer}
           error={dealerError}
         />
 
         {/* GST mode indicator */}
         {selectedDealer && (
           <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-secondary)]">
             <span className="text-[11px] text-[var(--color-text-tertiary)]">GST type:</span>
             <span className="text-[11px] font-medium text-[var(--color-text-primary)]">
               {gstMode === 'CGST_SGST'
                 ? 'Intra-state (CGST + SGST)'
                 : 'Inter-state (IGST)'}
             </span>
             {selectedDealer.stateCode && (
               <span className="text-[11px] text-[var(--color-text-tertiary)]">
                 — Dealer state: {selectedDealer.stateCode}
               </span>
             )}
           </div>
         )}
 
         {/* Line items (desktop) */}
         <div>
           <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
             Line Items
           </p>
 
           {/* Desktop table */}
           <div className="hidden sm:block border border-[var(--color-border-default)] rounded-xl overflow-hidden">
             <table className="w-full">
               <thead>
                 <tr className="bg-[var(--color-surface-secondary)]">
                   <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[25%]">
                     Product Code
                   </th>
                   <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5">
                     Description
                   </th>
                   <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[10%]">
                     Qty
                   </th>
                   <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[14%]">
                     Unit Price
                   </th>
                   <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[9%]">
                     GST%
                   </th>
                   <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[14%]">
                     Line Total
                   </th>
                   <th className="px-2 py-2.5 w-8" />
                 </tr>
               </thead>
               <tbody>
                 {lines.map((line) => {
                   const qty = parseFloat(line.quantity) || 0;
                   const price = parseFloat(line.unitPrice) || 0;
                   const gst = parseFloat(line.gstRate) || 0;
                   const lineTotal = qty * price * (1 + gst / 100);
                   return (
                     <tr key={line._id} className="border-t border-[var(--color-border-subtle)]">
                       <td className="px-2 py-1.5">
                         <input
                           value={line.productCode}
                           onChange={(e) => updateLine(line._id, 'productCode', e.target.value)}
                           placeholder="e.g. PAINT-001"
                           className={inputCls}
                         />
                       </td>
                       <td className="px-2 py-1.5">
                         <input
                           value={line.description}
                           onChange={(e) => updateLine(line._id, 'description', e.target.value)}
                           placeholder="Optional"
                           className={inputCls}
                         />
                       </td>
                       <td className="px-2 py-1.5">
                         <input
                           type="number"
                           min="1"
                           value={line.quantity}
                           onChange={(e) => updateLine(line._id, 'quantity', e.target.value)}
                           placeholder="1"
                           className={clsx(inputCls, 'text-right tabular-nums')}
                         />
                       </td>
                       <td className="px-2 py-1.5">
                         <input
                           type="number"
                           step="0.01"
                           min="0"
                           value={line.unitPrice}
                           onChange={(e) => updateLine(line._id, 'unitPrice', e.target.value)}
                           placeholder="0.00"
                           className={clsx(inputCls, 'text-right tabular-nums')}
                         />
                       </td>
                       <td className="px-2 py-1.5">
                         <input
                           type="number"
                           min="0"
                           max="100"
                           value={line.gstRate}
                           onChange={(e) => updateLine(line._id, 'gstRate', e.target.value)}
                           placeholder="18"
                           className={clsx(inputCls, 'text-right tabular-nums')}
                         />
                       </td>
                       <td className="px-3 py-1.5 text-right text-[13px] tabular-nums text-[var(--color-text-primary)]">
                         {lineTotal > 0 ? fmt(lineTotal) : '—'}
                       </td>
                       <td className="px-1 py-1.5">
                         <button
                           type="button"
                           onClick={() => removeLine(line._id)}
                           disabled={lines.length <= 1}
                           className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] disabled:opacity-30 transition-colors"
                         >
                           <Trash2 size={12} />
                         </button>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
 
           {/* Mobile stacked */}
           <div className="sm:hidden space-y-3">
             {lines.map((line, idx) => {
               const qty = parseFloat(line.quantity) || 0;
               const price = parseFloat(line.unitPrice) || 0;
               const gst = parseFloat(line.gstRate) || 0;
               const lineTotal = qty * price * (1 + gst / 100);
               return (
                 <div
                   key={line._id}
                   className="border border-[var(--color-border-default)] rounded-xl p-3 space-y-2"
                 >
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                       Item {idx + 1}
                     </span>
                     <button
                       type="button"
                       onClick={() => removeLine(line._id)}
                       disabled={lines.length <= 1}
                       className="text-[var(--color-text-tertiary)] disabled:opacity-30"
                     >
                       <Trash2 size={12} />
                     </button>
                   </div>
                   <input
                     value={line.productCode}
                     onChange={(e) => updateLine(line._id, 'productCode', e.target.value)}
                     placeholder="Product code"
                     className={fieldCls}
                   />
                   <input
                     value={line.description}
                     onChange={(e) => updateLine(line._id, 'description', e.target.value)}
                     placeholder="Description (optional)"
                     className={fieldCls}
                   />
                   <div className="grid grid-cols-3 gap-2">
                     <div>
                       <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">
                         Qty
                       </label>
                       <input
                         type="number"
                         min="1"
                         value={line.quantity}
                         onChange={(e) => updateLine(line._id, 'quantity', e.target.value)}
                         className={clsx(fieldCls, 'text-right tabular-nums')}
                       />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">
                         Price
                       </label>
                       <input
                         type="number"
                         step="0.01"
                         min="0"
                         value={line.unitPrice}
                         onChange={(e) => updateLine(line._id, 'unitPrice', e.target.value)}
                         className={clsx(fieldCls, 'text-right tabular-nums')}
                       />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">
                         GST%
                       </label>
                       <input
                         type="number"
                         min="0"
                         max="100"
                         value={line.gstRate}
                         onChange={(e) => updateLine(line._id, 'gstRate', e.target.value)}
                         className={clsx(fieldCls, 'text-right tabular-nums')}
                       />
                     </div>
                   </div>
                   {lineTotal > 0 && (
                     <p className="text-right text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">
                       ₹{fmt(lineTotal)}
                     </p>
                   )}
                 </div>
               );
             })}
           </div>
 
           {/* Add line */}
           <button
             type="button"
             onClick={() => setLines((prev) => [...prev, emptyLine()])}
             className="mt-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
           >
             <Plus size={13} />
             Add item
           </button>
         </div>
 
         {/* GST Summary */}
         <div className="border border-[var(--color-border-default)] rounded-xl p-4 space-y-2 bg-[var(--color-surface-secondary)]">
           <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
             Order Summary
           </p>
           <div className="space-y-1.5 max-w-[280px] ml-auto">
             <div className="flex justify-between text-[12px]">
               <span className="text-[var(--color-text-tertiary)]">Subtotal</span>
               <span className="tabular-nums text-[var(--color-text-secondary)]">₹{fmt(totals.subtotal)}</span>
             </div>
             {gstMode === 'CGST_SGST' ? (
               <>
                 <div className="flex justify-between text-[12px]">
                   <span className="text-[var(--color-text-tertiary)]">CGST</span>
                   <span className="tabular-nums text-[var(--color-text-secondary)]">₹{fmt(totals.cgst)}</span>
                 </div>
                 <div className="flex justify-between text-[12px]">
                   <span className="text-[var(--color-text-tertiary)]">SGST</span>
                   <span className="tabular-nums text-[var(--color-text-secondary)]">₹{fmt(totals.sgst)}</span>
                 </div>
               </>
             ) : (
               <div className="flex justify-between text-[12px]">
                 <span className="text-[var(--color-text-tertiary)]">IGST</span>
                 <span className="tabular-nums text-[var(--color-text-secondary)]">₹{fmt(totals.igst)}</span>
               </div>
             )}
             <div className="flex justify-between text-[13px] font-semibold pt-1.5 border-t border-[var(--color-border-subtle)]">
               <span className="text-[var(--color-text-primary)]">Grand Total</span>
               <span className="tabular-nums text-[var(--color-text-primary)]">₹{fmt(totals.total)}</span>
             </div>
           </div>
         </div>
       </div>
     </Drawer>
   );
 }

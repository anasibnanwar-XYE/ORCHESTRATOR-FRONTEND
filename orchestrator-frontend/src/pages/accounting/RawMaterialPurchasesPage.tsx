 /**
  * RawMaterialPurchasesPage
  *
  * Record raw material purchase invoices against GRNs.
  * Creates purchase invoice → updates inventory → posts journal (Debit RM, Credit AP).
  *
  * API:
  *  GET  /api/v1/purchasing/raw-material-purchases
  *  POST /api/v1/purchasing/raw-material-purchases
  *  GET  /api/v1/purchasing/goods-receipts (for GRN selection, filter by non-INVOICED)
  *  GET  /api/v1/suppliers
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, Plus } from 'lucide-react';
 import { format, parseISO } from 'date-fns';
 import { clsx } from 'clsx';
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
   type RawMaterialPurchaseResponse,
   type GoodsReceiptResponse,
   type SupplierFullResponse,
   type RawMaterialPurchaseLineRequest,
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
 
 function PurchaseStatusBadge({ status }: { status: string }) {
   const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default' | 'info'; label: string }> = {
     POSTED:   { variant: 'success', label: 'Posted' },
     PARTIAL:  { variant: 'warning', label: 'Partial' },
     PAID:     { variant: 'success', label: 'Paid' },
     VOID:     { variant: 'danger',  label: 'Void' },
     REVERSED: { variant: 'danger',  label: 'Reversed' },
   };
   const m = map[status] ?? { variant: 'default' as const, label: status };
   return <Badge variant={m.variant} dot>{m.label}</Badge>;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Create Purchase Invoice Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface CreatePurchaseFormProps {
   suppliers: SupplierFullResponse[];
   grns: GoodsReceiptResponse[];
   onSaved: () => void;
   onCancel: () => void;
 }
 
 interface PurchaseLineForm {
   rawMaterialId: string;
   rawMaterialName: string;
   batchCode: string;
   quantity: string;
   unit: string;
   costPerUnit: string;
   taxRate: string;
   notes: string;
 }
 
 function CreatePurchaseForm({ suppliers, grns, onSaved, onCancel }: CreatePurchaseFormProps) {
   const toast = useToast();
   const [supplierId, setSupplierId] = useState('');
   const [grnId, setGrnId] = useState('');
   const [selectedGRN, setSelectedGRN] = useState<GoodsReceiptResponse | null>(null);
   const [invoiceNumber, setInvoiceNumber] = useState('');
   const [invoiceDate, setInvoiceDate] = useState(todayISO());
   const [memo, setMemo] = useState('');
   const [lines, setLines] = useState<PurchaseLineForm[]>([]);
   const [taxAmount, setTaxAmount] = useState('');
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [isSaving, setIsSaving] = useState(false);
 
   // Filter GRNs by selected supplier
   const supplierGrns = grns.filter(
     (g) => !supplierId || String(g.supplierId) === supplierId
   );
 
   function handleGRNSelect(id: string) {
     setGrnId(id);
     const grn = grns.find((g) => String(g.id) === id) ?? null;
     setSelectedGRN(grn);
     if (grn) {
       if (!supplierId) setSupplierId(String(grn.supplierId));
       setLines(
         grn.lines.map((l) => ({
           rawMaterialId: String(l.rawMaterialId),
           rawMaterialName: l.rawMaterialName,
           batchCode: l.batchCode ?? '',
           quantity: String(l.quantity),
           unit: l.unit ?? '',
           costPerUnit: String(l.costPerUnit),
           taxRate: '',
           notes: l.notes ?? '',
         }))
       );
     }
   }
 
   function updateLine(i: number, field: keyof PurchaseLineForm, value: string) {
     const next = [...lines];
     next[i] = { ...next[i], [field]: value };
     setLines(next);
   }
 
   function validate(): boolean {
     const errs: Record<string, string> = {};
     if (!supplierId) errs.supplierId = 'Select a supplier';
     if (!grnId) errs.grnId = 'Select a GRN';
     if (!invoiceNumber.trim()) errs.invoiceNumber = 'Invoice number is required';
     if (!invoiceDate) errs.invoiceDate = 'Invoice date is required';
     if (lines.length === 0) errs.lines = 'No lines available from GRN';
     lines.forEach((line, i) => {
       if (!line.quantity || parseFloat(line.quantity) <= 0) errs[`line_${i}_qty`] = 'Qty must be > 0';
       if (!line.costPerUnit || parseFloat(line.costPerUnit) <= 0) errs[`line_${i}_cost`] = 'Cost must be > 0';
     });
     setErrors(errs);
     return Object.keys(errs).length === 0;
   }
 
   const subtotal = lines.reduce((sum, l) => {
     const qty = parseFloat(l.quantity) || 0;
     const cost = parseFloat(l.costPerUnit) || 0;
     return sum + qty * cost;
   }, 0);
 
   async function handleSubmit() {
     if (!validate()) return;
     setIsSaving(true);
     try {
       const requestLines: RawMaterialPurchaseLineRequest[] = lines.map((l) => ({
         rawMaterialId: parseInt(l.rawMaterialId, 10),
         batchCode: l.batchCode || undefined,
         quantity: parseFloat(l.quantity),
         unit: l.unit || undefined,
         costPerUnit: parseFloat(l.costPerUnit),
         taxRate: l.taxRate ? parseFloat(l.taxRate) : undefined,
         notes: l.notes || undefined,
       }));
       await purchasingApi.createRawMaterialPurchase({
         supplierId: parseInt(supplierId, 10),
         invoiceNumber: invoiceNumber.trim(),
         invoiceDate,
         memo: memo.trim() || undefined,
         goodsReceiptId: parseInt(grnId, 10),
         purchaseOrderId: selectedGRN?.purchaseOrderId ?? undefined,
         taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
         lines: requestLines,
       });
       toast.success('Purchase invoice posted. Inventory and journal updated.');
       onSaved();
     } catch {
       toast.error('Failed to post purchase invoice.');
     } finally {
       setIsSaving(false);
     }
   }
 
   return (
     <Modal
       isOpen
       onClose={onCancel}
       title="Record Raw Material Purchase"
       description="Post a purchase invoice against a goods receipt note"
       size="xl"
       footer={
         <>
           <Button variant="secondary" onClick={onCancel}>Cancel</Button>
           <Button onClick={handleSubmit} isLoading={isSaving}>
             Post Invoice
           </Button>
         </>
       }
     >
       <div className="overflow-y-auto max-h-[65vh] space-y-4">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           <Select
             label="Supplier *"
             value={supplierId}
             onChange={(e) => { setSupplierId(e.target.value); setGrnId(''); setSelectedGRN(null); setLines([]); }}
             error={errors.supplierId}
             options={[
               { value: '', label: 'Select supplier…', disabled: true },
               ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
             ]}
           />
           <Select
             label="Goods Receipt Note *"
             value={grnId}
             onChange={(e) => handleGRNSelect(e.target.value)}
             error={errors.grnId}
             options={[
               { value: '', label: 'Select GRN…', disabled: true },
               ...supplierGrns.map((g) => ({
                 value: String(g.id),
                 label: `${g.receiptNumber} — ${g.supplierName}`,
               })),
             ]}
             hint="GRNs not yet invoiced"
           />
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           <Input
             label="Invoice Number *"
             value={invoiceNumber}
             onChange={(e) => setInvoiceNumber(e.target.value)}
             error={errors.invoiceNumber}
           />
           <Input
             label="Invoice Date *"
             type="date"
             value={invoiceDate}
             onChange={(e) => setInvoiceDate(e.target.value)}
             error={errors.invoiceDate}
           />
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           <Input
             label="Memo"
             value={memo}
             onChange={(e) => setMemo(e.target.value)}
           />
           <Input
             label="Tax Amount (total)"
             type="number"
             min="0"
             step="0.01"
             value={taxAmount}
             onChange={(e) => setTaxAmount(e.target.value)}
             hint="Leave blank to use line-level tax rates"
           />
         </div>
 
         {/* Lines */}
         {lines.length > 0 && (
           <div>
             <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
               Invoice Lines
             </p>
             {errors.lines && <p className="text-[11px] text-[var(--color-error)] mb-2">{errors.lines}</p>}
             <div className="space-y-2">
               {lines.map((line, i) => (
                 <div key={i} className="p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] space-y-2">
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
                       label="Tax Rate %"
                       type="number"
                       min="0"
                       max="100"
                       step="0.01"
                       value={line.taxRate}
                       onChange={(e) => updateLine(i, 'taxRate', e.target.value)}
                       hint="Disabled if total tax set"
                       disabled={!!taxAmount}
                     />
                   </div>
                 </div>
               ))}
             </div>
 
             {/* Running total */}
             <div className="flex justify-end mt-3 pt-3 border-t border-[var(--color-border-subtle)] gap-4">
               <span className="text-[13px] text-[var(--color-text-secondary)]">
                 Subtotal: {formatINR(subtotal)}
               </span>
               {taxAmount && (
                 <span className="text-[13px] text-[var(--color-text-secondary)]">
                   Tax: {formatINR(parseFloat(taxAmount) || 0)}
                 </span>
               )}
               <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                 Total: {formatINR(subtotal + (parseFloat(taxAmount) || 0))}
               </span>
             </div>
           </div>
         )}
 
         {!grnId && (
           <p className="text-[13px] text-[var(--color-text-tertiary)] text-center py-4">
             Select a supplier and GRN to load invoice lines.
           </p>
         )}
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Purchase Detail Modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 function PurchaseDetailModal({ purchase, onClose }: { purchase: RawMaterialPurchaseResponse; onClose: () => void }) {
   return (
     <Modal isOpen onClose={onClose} title={`Invoice ${purchase.invoiceNumber}`} description={`${purchase.supplierName} · ${formatDate(purchase.invoiceDate)}`} size="xl">
       <div className="space-y-4">
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[var(--color-surface-secondary)] rounded-xl">
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Status</p>
             <div className="mt-0.5"><PurchaseStatusBadge status={purchase.status} /></div>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Total</p>
             <p className="text-[13px] font-medium tabular-nums mt-0.5">{formatINR(purchase.totalAmount)}</p>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">Outstanding</p>
             <p className={clsx('text-[13px] font-medium tabular-nums mt-0.5', purchase.outstandingAmount > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]')}>
               {formatINR(purchase.outstandingAmount)}
             </p>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)]">GRN</p>
             <p className="text-[13px] mt-0.5">{purchase.goodsReceiptNumber}</p>
           </div>
         </div>
 
         <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <table className="w-full text-[13px]">
             <thead className="bg-[var(--color-surface-secondary)]">
               <tr>
                 <th className="text-left px-3 py-2 font-medium text-[var(--color-text-tertiary)]">Material</th>
                 <th className="text-right px-3 py-2 font-medium text-[var(--color-text-tertiary)]">Qty</th>
                 <th className="text-right px-3 py-2 font-medium text-[var(--color-text-tertiary)]">Cost/Unit</th>
                 <th className="text-right px-3 py-2 font-medium text-[var(--color-text-tertiary)]">Total</th>
               </tr>
             </thead>
             <tbody>
               {purchase.lines.map((line, i) => (
                 <tr key={i} className="border-t border-[var(--color-border-subtle)]">
                   <td className="px-3 py-2.5 text-[var(--color-text-primary)]">{line.rawMaterialName}</td>
                   <td className="px-3 py-2.5 text-right tabular-nums">{line.quantity}</td>
                   <td className="px-3 py-2.5 text-right tabular-nums">{formatINR(line.costPerUnit)}</td>
                   <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatINR(line.lineTotal)}</td>
                 </tr>
               ))}
             </tbody>
             <tfoot className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
               <tr>
                 <td colSpan={3} className="px-3 py-2.5 text-right font-semibold">Total</td>
                 <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatINR(purchase.totalAmount)}</td>
               </tr>
             </tfoot>
           </table>
         </div>
 
         {purchase.journalEntryId && (
           <p className="text-[12px] text-[var(--color-text-tertiary)]">
             Journal Entry #{purchase.journalEntryId} posted (Debit Raw Materials, Credit AP)
           </p>
         )}
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function RawMaterialPurchasesPage() {
   const [purchases, setPurchases] = useState<RawMaterialPurchaseResponse[]>([]);
   const [suppliers, setSuppliers] = useState<SupplierFullResponse[]>([]);
   const [grns, setGrns] = useState<GoodsReceiptResponse[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [showCreate, setShowCreate] = useState(false);
   const [detailPurchase, setDetailPurchase] = useState<RawMaterialPurchaseResponse | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [purchasesData, suppliersData, grnsData] = await Promise.all([
         purchasingApi.getRawMaterialPurchases(),
         purchasingApi.getSuppliers(),
         purchasingApi.getGoodsReceipts(),
       ]);
       setPurchases(purchasesData);
       setSuppliers(suppliersData);
       // Only show GRNs that are not yet invoiced
       setGrns(grnsData.filter((g) => g.status !== 'INVOICED'));
     } catch {
       setError('Failed to load purchases. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const COLUMNS: Column<RawMaterialPurchaseResponse>[] = [
     {
       id: 'invoiceNumber',
       header: 'Invoice #',
       accessor: (row) => (
         <span className="font-medium tabular-nums text-[var(--color-text-primary)]">{row.invoiceNumber}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.invoiceNumber,
     },
     {
       id: 'supplier',
       header: 'Supplier',
       accessor: (row) => <span>{row.supplierName}</span>,
       sortable: true,
       sortAccessor: (row) => row.supplierName,
     },
     {
       id: 'invoiceDate',
       header: 'Date',
       accessor: (row) => (
         <span className="tabular-nums text-[var(--color-text-secondary)]">{formatDate(row.invoiceDate)}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.invoiceDate,
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
       id: 'outstanding',
       header: 'Outstanding',
       accessor: (row) => (
         <span className={clsx('tabular-nums text-[13px]', row.outstandingAmount > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]')}>
           {formatINR(row.outstandingAmount)}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.outstandingAmount,
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => <PurchaseStatusBadge status={row.status} />,
       sortable: true,
       sortAccessor: (row) => row.status,
     },
   ];
 
   return (
     <div className="space-y-5">
       <PageHeader
         title="Raw Material Purchases"
         description="Purchase invoices for raw materials — updates inventory and posts journal"
         actions={
           <Button leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
             Record Purchase
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
             data={purchases}
             keyExtractor={(row) => row.id}
             searchable
             searchPlaceholder="Search by invoice # or supplier..."
             searchFilter={(row, q) =>
               row.invoiceNumber.toLowerCase().includes(q) ||
               row.supplierName.toLowerCase().includes(q)
             }
             onRowClick={(row) => setDetailPurchase(row)}
             emptyMessage="No purchase invoices found. Record your first raw material purchase."
             toolbar={
               <span className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                 {purchases.length} invoice{purchases.length !== 1 ? 's' : ''}
               </span>
             }
           />
         </div>
       )}
 
       {detailPurchase && (
         <PurchaseDetailModal purchase={detailPurchase} onClose={() => setDetailPurchase(null)} />
       )}
 
       {showCreate && (
         <CreatePurchaseForm
           suppliers={suppliers}
           grns={grns}
           onSaved={() => { setShowCreate(false); load(); }}
           onCancel={() => setShowCreate(false)}
         />
       )}
     </div>
   );
 }

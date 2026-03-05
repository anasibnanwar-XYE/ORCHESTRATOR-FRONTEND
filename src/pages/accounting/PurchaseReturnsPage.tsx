 /**
  * PurchaseReturnsPage
  *
  * Return goods against a raw material purchase (invoice).
  * Creates debit note, reduces inventory, posts reversal journal.
  *
  * API:
  *  POST /api/v1/purchasing/raw-material-purchases/returns
  *  GET  /api/v1/purchasing/raw-material-purchases (for return candidate selection)
  *  GET  /api/v1/suppliers
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle } from 'lucide-react';
 import { format, parseISO } from 'date-fns';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
  import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { useToast } from '@/components/ui/Toast';
 import {
   purchasingApi,
   type RawMaterialPurchaseResponse,
   type SupplierFullResponse,
 } from '@/lib/purchasingApi';
 import type { JournalEntryDto } from '@/lib/accountingApi';
 
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
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Return Result Banner
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface ReturnResultProps {
   journal: JournalEntryDto;
   onClose: () => void;
 }
 
 function ReturnResultBanner({ journal, onClose }: ReturnResultProps) {
   return (
     <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-tertiary)] p-5 space-y-3">
       <div className="flex justify-center">
         <div className="h-10 w-10 rounded-full bg-[var(--color-success-icon)]/10 flex items-center justify-center">
           <svg className="h-5 w-5 text-[var(--color-success-icon)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
           </svg>
         </div>
       </div>
       <div className="text-center">
         <p className="text-[14px] font-medium text-[var(--color-text-primary)]">Return processed</p>
         <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
           Debit note posted. Inventory reduced. Journal entry #{journal.id} created.
         </p>
         {journal.referenceNumber && (
           <p className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
             Reference: {journal.referenceNumber}
           </p>
         )}
       </div>
       <div className="flex justify-center">
         <Button variant="ghost" size="sm" onClick={onClose}>
           Record another return
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Purchase Return Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface ReturnFormProps {
   suppliers: SupplierFullResponse[];
   purchases: RawMaterialPurchaseResponse[];
   onSuccess: (journal: JournalEntryDto) => void;
 }
 
 function PurchaseReturnForm({ suppliers, purchases, onSuccess }: ReturnFormProps) {
   const toast = useToast();
   const [supplierId, setSupplierId] = useState('');
   const [purchaseId, setPurchaseId] = useState('');
   const [rawMaterialId, setRawMaterialId] = useState('');
   const [quantity, setQuantity] = useState('');
   const [unitCost, setUnitCost] = useState('');
   const [returnDate, setReturnDate] = useState(todayISO());
   const [referenceNumber, setReferenceNumber] = useState('');
   const [reason, setReason] = useState('');
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [isSaving, setIsSaving] = useState(false);
 
   // Filter purchases by supplier
   const supplierPurchases = purchases.filter(
     (p) => !supplierId || String(p.supplierId) === supplierId
   );
 
   const selectedPurchase = purchases.find((p) => String(p.id) === purchaseId) ?? null;
 
   // Material options from selected purchase
   const materialOptions = selectedPurchase
     ? [
         { value: '', label: 'Select material…', disabled: true },
         ...selectedPurchase.lines.map((l) => ({
           value: String(l.rawMaterialId),
           label: l.rawMaterialName,
         })),
       ]
     : [{ value: '', label: 'Select a purchase first', disabled: true }];
 
   // Auto-fill unit cost from line
   function handleMaterialSelect(id: string) {
     setRawMaterialId(id);
     if (selectedPurchase) {
       const line = selectedPurchase.lines.find((l) => String(l.rawMaterialId) === id);
       if (line) setUnitCost(String(line.costPerUnit));
     }
   }
 
   // Max returnable quantity for selected material
   const maxReturnableQty = (() => {
     if (!selectedPurchase || !rawMaterialId) return null;
     const line = selectedPurchase.lines.find((l) => String(l.rawMaterialId) === rawMaterialId);
     return line?.quantity ?? null;
   })();
 
   function validate(): boolean {
     const errs: Record<string, string> = {};
     if (!supplierId) errs.supplierId = 'Select a supplier';
     if (!purchaseId) errs.purchaseId = 'Select a purchase invoice';
     if (!rawMaterialId) errs.rawMaterialId = 'Select a material';
     if (!quantity || parseFloat(quantity) <= 0) errs.quantity = 'Quantity must be > 0';
     if (maxReturnableQty !== null && parseFloat(quantity) > maxReturnableQty) {
       errs.quantity = `Max returnable: ${maxReturnableQty}`;
     }
     if (!unitCost || parseFloat(unitCost) <= 0) errs.unitCost = 'Unit cost must be > 0';
     setErrors(errs);
     return Object.keys(errs).length === 0;
   }
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     if (!validate()) return;
     setIsSaving(true);
     try {
       const journal = await purchasingApi.createPurchaseReturn({
         supplierId: parseInt(supplierId, 10),
         purchaseId: parseInt(purchaseId, 10),
         rawMaterialId: parseInt(rawMaterialId, 10),
         quantity: parseFloat(quantity),
         unitCost: parseFloat(unitCost),
         referenceNumber: referenceNumber.trim() || undefined,
         returnDate: returnDate || undefined,
         reason: reason.trim() || undefined,
       });
       onSuccess(journal);
     } catch {
       toast.error('Failed to process return. Check quantities and try again.');
     } finally {
       setIsSaving(false);
     }
   }
 
   const returnValue = (() => {
     const qty = parseFloat(quantity) || 0;
     const cost = parseFloat(unitCost) || 0;
     return qty * cost;
   })();
 
   return (
     <form onSubmit={handleSubmit} className="space-y-4">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Select
           label="Supplier *"
           value={supplierId}
           onChange={(e) => { setSupplierId(e.target.value); setPurchaseId(''); setRawMaterialId(''); }}
           error={errors.supplierId}
           options={[
             { value: '', label: 'Select supplier…', disabled: true },
             ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
           ]}
         />
         <Select
           label="Purchase Invoice *"
           value={purchaseId}
           onChange={(e) => { setPurchaseId(e.target.value); setRawMaterialId(''); }}
           error={errors.purchaseId}
           options={[
             { value: '', label: 'Select invoice…', disabled: true },
             ...supplierPurchases.map((p) => ({
               value: String(p.id),
               label: `${p.invoiceNumber} — ${p.supplierName} (${formatDate(p.invoiceDate)})`,
             })),
           ]}
         />
       </div>
 
       {/* Material + quantity */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
         <Select
           label="Material *"
           value={rawMaterialId}
           onChange={(e) => handleMaterialSelect(e.target.value)}
           error={errors.rawMaterialId}
           options={materialOptions}
         />
         <Input
           label="Return Quantity *"
           type="number"
           min="0.001"
           step="0.001"
           value={quantity}
           onChange={(e) => setQuantity(e.target.value)}
           error={errors.quantity}
           hint={maxReturnableQty !== null ? `Max: ${maxReturnableQty}` : undefined}
         />
         <Input
           label="Unit Cost *"
           type="number"
           min="0.01"
           step="0.01"
           value={unitCost}
           onChange={(e) => setUnitCost(e.target.value)}
           error={errors.unitCost}
         />
       </div>
 
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input
           label="Return Date"
           type="date"
           value={returnDate}
           onChange={(e) => setReturnDate(e.target.value)}
         />
         <Input
           label="Reference Number"
           value={referenceNumber}
           onChange={(e) => setReferenceNumber(e.target.value)}
           hint="Optional idempotency reference"
         />
       </div>
       <Input
         label="Reason"
         value={reason}
         onChange={(e) => setReason(e.target.value)}
       />
 
       {/* Return value preview */}
       {returnValue > 0 && (
         <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)]">
           <p className="text-[13px] text-[var(--color-text-secondary)]">Return value</p>
           <p className="text-[13px] font-semibold text-[var(--color-error)] tabular-nums">
             −{formatINR(returnValue)}
           </p>
         </div>
       )}
 
       {/* Outstanding context */}
       {selectedPurchase && (
         <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)]">
           <p className="text-[13px] text-[var(--color-text-secondary)]">Current outstanding on invoice</p>
           <p className={clsx('text-[13px] font-medium tabular-nums', selectedPurchase.outstandingAmount > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]')}>
             {formatINR(selectedPurchase.outstandingAmount)}
           </p>
         </div>
       )}
 
       <div className="flex justify-end pt-2">
         <Button type="submit" isLoading={isSaving}>
           Process Return
         </Button>
       </div>
     </form>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function PurchaseReturnsPage() {
   const [purchases, setPurchases] = useState<RawMaterialPurchaseResponse[]>([]);
   const [suppliers, setSuppliers] = useState<SupplierFullResponse[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [lastReturn, setLastReturn] = useState<JournalEntryDto | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [purchasesData, suppliersData] = await Promise.all([
         purchasingApi.getRawMaterialPurchases(),
         purchasingApi.getSuppliers(),
       ]);
       setPurchases(purchasesData);
       setSuppliers(suppliersData);
     } catch {
       setError('Failed to load data. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   function handleSuccess(journal: JournalEntryDto) {
     setLastReturn(journal);
     load(); // Refresh purchases list to show updated outstanding
   }
 
   return (
     <div className="space-y-5">
       <PageHeader
         title="Purchase Returns"
         description="Return goods to supplier — reduces inventory and posts reversal journal"
       />
 
       {error && !isLoading && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)]">
           <AlertCircle size={16} className="text-[var(--color-error)] shrink-0" />
           <p className="text-[13px] text-[var(--color-error)]">{error}</p>
           <Button variant="secondary" size="sm" onClick={load} className="ml-auto shrink-0">Retry</Button>
         </div>
       )}
 
       {isLoading && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-5 space-y-3">
           {Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="h-10 w-full" />
           ))}
         </div>
       )}
 
       {!isLoading && !error && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-5">
           {lastReturn ? (
             <ReturnResultBanner
               journal={lastReturn}
               onClose={() => setLastReturn(null)}
             />
           ) : (
             <PurchaseReturnForm
               suppliers={suppliers}
               purchases={purchases}
               onSuccess={handleSuccess}
             />
           )}
         </div>
       )}
     </div>
   );
 }

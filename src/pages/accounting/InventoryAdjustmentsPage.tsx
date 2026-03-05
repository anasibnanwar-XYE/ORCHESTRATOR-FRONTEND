 /**
  * InventoryAdjustmentsPage
  *
  * Inventory adjustment management:
  *  - DataTable list of past adjustments with type, date, total, journal link
  *  - Create adjustment form: type (DAMAGED/SHRINKAGE/OBSOLETE/RECOUNT_UP),
  *    product selection, quantity, unit cost, GL account, reason memo
  *  - Posts journal entry on submit
  *
  * API:
  *  GET  /api/v1/inventory/adjustments
  *  POST /api/v1/inventory/adjustments
  *  GET  /api/v1/finished-goods
  *  GET  /api/v1/accounting/accounts
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Plus,
   X,
 } from 'lucide-react';
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
   inventoryApi,
   type InventoryAdjustmentDto,
   type InventoryAdjustmentRequest,
   type AdjustmentType,
   type FinishedGoodDto,
 } from '@/lib/inventoryApi';
 import { accountingApi, type AccountDto } from '@/lib/accountingApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatDate(dateStr: string): string {
   return new Date(dateStr).toLocaleDateString('en-IN', {
     day: '2-digit',
     month: 'short',
     year: 'numeric',
   });
 }
 
 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 0,
   }).format(amount);
 }
 
 function generateIdempotencyKey(): string {
   return `adj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
 }
 
 const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string; variant: 'danger' | 'warning' | 'default' | 'success' | 'info' }[] = [
   { value: 'DAMAGED', label: 'Damaged', variant: 'danger' },
   { value: 'SHRINKAGE', label: 'Shrinkage', variant: 'warning' },
   { value: 'OBSOLETE', label: 'Obsolete', variant: 'default' },
   { value: 'RECOUNT_UP', label: 'Recount Up', variant: 'success' },
 ];
 
 function AdjustmentTypeBadge({ type }: { type: AdjustmentType }) {
   const t = ADJUSTMENT_TYPES.find((a) => a.value === type) ?? { label: type, variant: 'default' as const };
   return <Badge variant={t.variant}>{t.label}</Badge>;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Adjustment Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface AdjLineForm {
   finishedGoodId: string;
   quantity: string;
   unitCost: string;
   note: string;
 }
 
 interface AdjFormState {
   adjustmentDate: string;
   type: AdjustmentType;
   adjustmentAccountId: string;
   reason: string;
   lines: AdjLineForm[];
 }
 
 interface AdjFormErrors {
   adjustmentDate?: string;
   adjustmentAccountId?: string;
   reason?: string;
   lines?: string;
 }
 
 const today = () => new Date().toISOString().split('T')[0];
 
 const EMPTY_LINE: AdjLineForm = { finishedGoodId: '', quantity: '', unitCost: '', note: '' };
 
 interface AdjustmentFormProps {
   finishedGoods: FinishedGoodDto[];
   accounts: AccountDto[];
   onSave: (data: InventoryAdjustmentRequest) => Promise<void>;
   onClose: () => void;
   isSaving: boolean;
 }
 
 function AdjustmentForm({ finishedGoods, accounts, onSave, onClose, isSaving }: AdjustmentFormProps) {
   const [form, setForm] = useState<AdjFormState>({
     adjustmentDate: today(),
     type: 'DAMAGED',
     adjustmentAccountId: '',
     reason: '',
     lines: [{ ...EMPTY_LINE }],
   });
   const [errors, setErrors] = useState<AdjFormErrors>({});
 
   // Filter for expense/asset GL accounts
   const glAccounts = accounts.filter((a) =>
     a.type === 'EXPENSE' || a.type === 'ASSET'
   );
 
   const setField = <K extends keyof AdjFormState>(key: K, value: AdjFormState[K]) =>
     setForm((f) => ({ ...f, [key]: value }));
 
   const setLineField = (idx: number, key: keyof AdjLineForm, value: string) =>
     setForm((f) => {
       const lines = [...f.lines];
       lines[idx] = { ...lines[idx], [key]: value };
       return { ...f, lines };
     });
 
   const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { ...EMPTY_LINE }] }));
   const removeLine = (idx: number) =>
     setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
 
   const validate = (): boolean => {
     const errs: AdjFormErrors = {};
     if (!form.adjustmentDate) errs.adjustmentDate = 'Date is required';
     if (!form.adjustmentAccountId) errs.adjustmentAccountId = 'GL account is required';
     if (!form.reason.trim()) errs.reason = 'Reason is required';
     const validLines = form.lines.filter(
       (l) => l.finishedGoodId && parseFloat(l.quantity) > 0 && parseFloat(l.unitCost) > 0
     );
     if (validLines.length === 0) errs.lines = 'At least one valid line item is required';
     setErrors(errs);
     return Object.keys(errs).length === 0;
   };
 
   const handleSubmit = async () => {
     if (!validate()) return;
     const validLines = form.lines.filter(
       (l) => l.finishedGoodId && parseFloat(l.quantity) > 0 && parseFloat(l.unitCost) > 0
     );
     await onSave({
       adjustmentDate: form.adjustmentDate,
       type: form.type,
       adjustmentAccountId: parseInt(form.adjustmentAccountId, 10),
       reason: form.reason.trim(),
       idempotencyKey: generateIdempotencyKey(),
       lines: validLines.map((l) => ({
         finishedGoodId: parseInt(l.finishedGoodId, 10),
         quantity: parseFloat(l.quantity),
         unitCost: parseFloat(l.unitCost),
         note: l.note.trim() || undefined,
       })),
     });
   };
 
   return (
     <div className="space-y-4">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input
           label="Adjustment Date *"
           type="date"
           value={form.adjustmentDate}
           onChange={(e) => setField('adjustmentDate', e.target.value)}
           error={errors.adjustmentDate}
         />
         <Select
           label="Adjustment Type *"
           options={ADJUSTMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
           value={form.type}
           onChange={(e) => setField('type', e.target.value as AdjustmentType)}
         />
         <div className="sm:col-span-2">
           <Select
             label="GL Account *"
             options={glAccounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` }))}
             placeholder="Select account"
             value={form.adjustmentAccountId}
             onChange={(e) => setField('adjustmentAccountId', e.target.value)}
             error={errors.adjustmentAccountId}
           />
         </div>
         <div className="sm:col-span-2">
           <Input
             label="Reason / Memo *"
             placeholder="Describe the reason for this adjustment..."
             value={form.reason}
             onChange={(e) => setField('reason', e.target.value)}
             error={errors.reason}
           />
         </div>
       </div>
 
       {/* Line items */}
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
             Items
           </p>
           <Button size="sm" variant="ghost" leftIcon={<Plus size={12} />} onClick={addLine}>
             Add item
           </Button>
         </div>
         {errors.lines && (
           <p className="text-[12px] text-[var(--color-danger-text)]">{errors.lines}</p>
         )}
         {form.lines.map((line, idx) => (
           <div key={idx} className="p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] space-y-2">
             <div className="flex items-center justify-between">
               <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Item {idx + 1}</p>
               {form.lines.length > 1 && (
                 <button
                   type="button"
                   onClick={() => removeLine(idx)}
                   className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger-text)] transition-colors"
                 >
                   <X size={13} />
                 </button>
               )}
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
               <div className="col-span-2">
                 <Select
                   label="Product *"
                   options={finishedGoods.map((fg) => ({ value: String(fg.id), label: fg.name }))}
                   placeholder="Select product"
                   value={line.finishedGoodId}
                   onChange={(e) => setLineField(idx, 'finishedGoodId', e.target.value)}
                 />
               </div>
               <Input
                 label="Quantity *"
                 type="number"
                 min="0"
                 step="0.01"
                 value={line.quantity}
                 onChange={(e) => setLineField(idx, 'quantity', e.target.value)}
               />
               <Input
                 label="Unit Cost *"
                 type="number"
                 min="0"
                 step="0.01"
                 value={line.unitCost}
                 onChange={(e) => setLineField(idx, 'unitCost', e.target.value)}
               />
             </div>
             <Input
               label="Note"
               placeholder="Optional line note"
               value={line.note}
               onChange={(e) => setLineField(idx, 'note', e.target.value)}
             />
           </div>
         ))}
       </div>
 
       <div className="flex justify-end gap-2 pt-2">
         <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
         <Button onClick={handleSubmit} isLoading={isSaving}>Post Adjustment</Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function InventoryAdjustmentsPage() {
   const toast = useToast();
   const [adjustments, setAdjustments] = useState<InventoryAdjustmentDto[]>([]);
   const [finishedGoods, setFinishedGoods] = useState<FinishedGoodDto[]>([]);
   const [accounts, setAccounts] = useState<AccountDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [showCreate, setShowCreate] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [adj, fg, accs] = await Promise.all([
         inventoryApi.getAdjustments(),
         inventoryApi.getFinishedGoods(),
         accountingApi.getAccounts(),
       ]);
       setAdjustments(adj);
       setFinishedGoods(fg);
       setAccounts(accs);
     } catch {
       setError('Failed to load inventory adjustments. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const handleCreate = async (data: InventoryAdjustmentRequest) => {
     setIsSaving(true);
     try {
       await inventoryApi.createAdjustment(data);
       toast.success('Adjustment posted. Journal entry created.');
       setShowCreate(false);
       load();
     } catch {
       toast.error('Failed to post adjustment. Please try again.');
     } finally {
       setIsSaving(false);
     }
   };
 
   const COLUMNS: Column<InventoryAdjustmentDto>[] = [
     {
       id: 'referenceNumber',
       header: 'Reference',
       accessor: (row) => (
         <span className="font-mono text-[12px] text-[var(--color-text-secondary)]">
           {row.referenceNumber ?? `ADJ-${row.id}`}
         </span>
       ),
       width: '130px',
     },
     {
       id: 'adjustmentDate',
       header: 'Date',
       accessor: (row) => (
         <span className="tabular-nums text-[var(--color-text-secondary)]">{formatDate(row.adjustmentDate)}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.adjustmentDate,
       width: '110px',
     },
     {
       id: 'type',
       header: 'Type',
       accessor: (row) => <AdjustmentTypeBadge type={row.type} />,
       width: '120px',
     },
     {
       id: 'reason',
       header: 'Reason',
       accessor: (row) => (
         <span className="text-[var(--color-text-secondary)] line-clamp-1">{row.reason ?? '—'}</span>
       ),
     },
     {
       id: 'totalAmount',
       header: 'Amount',
       accessor: (row) => (
         <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
           {formatINR(row.totalAmount)}
         </span>
       ),
       align: 'right',
       sortable: true,
       sortAccessor: (row) => row.totalAmount,
       width: '120px',
     },
     {
       id: 'journal',
       header: 'Journal',
       accessor: (row) => (
         <span className="tabular-nums text-[12px] text-[var(--color-text-tertiary)]">
           {row.journalEntryId ? `#${row.journalEntryId}` : '—'}
         </span>
       ),
       align: 'center',
       hideOnMobile: true,
       width: '80px',
     },
   ];
 
   if (isLoading) {
     return (
       <div className="space-y-5">
         <Skeleton className="h-9 w-48" />
         <Skeleton className="h-64 w-full rounded-xl" />
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-16 gap-3">
         <AlertCircle size={22} className="text-[var(--color-danger-text)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
         <Button size="sm" variant="secondary" leftIcon={<RefreshCcw size={13} />} onClick={load}>
           Retry
         </Button>
       </div>
     );
   }
 
   return (
     <div className="space-y-5">
       <PageHeader
         title="Inventory Adjustments"
         description="Post adjustments for damaged, shrinkage, obsolete, or recount corrections"
         actions={
           <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
             New Adjustment
           </Button>
         }
       />
 
       <DataTable
         columns={COLUMNS}
         data={adjustments}
         keyExtractor={(row) => row.id}
         searchable
         searchPlaceholder="Search adjustments..."
         searchFilter={(row, q) =>
           (row.referenceNumber?.toLowerCase().includes(q) ?? false) ||
           (row.reason?.toLowerCase().includes(q) ?? false) ||
           row.type.toLowerCase().includes(q)
         }
         emptyMessage="No adjustments recorded yet. Post your first adjustment to get started."
       />
 
       <Modal
         isOpen={showCreate}
         onClose={() => setShowCreate(false)}
         title="Post Inventory Adjustment"
         description="Adjust finished goods inventory with GL journal posting"
         size="xl"
       >
         <AdjustmentForm
           finishedGoods={finishedGoods}
           accounts={accounts}
           onSave={handleCreate}
           onClose={() => setShowCreate(false)}
           isSaving={isSaving}
         />
       </Modal>
     </div>
   );
 }

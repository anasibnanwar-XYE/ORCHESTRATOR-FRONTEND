 /**
  * FinishedGoodsPage — Factory portal inventory for finished goods
  *
  * Tabs:
  *   1. All Goods — CRUD DataTable (product, SKU, available stock, packed qty)
  *      - Create entry modal
  *      - Edit entry modal
  *      - Low-stock filter and alert indicators
  *      - View batches: batch hierarchy (parent bulk batch + child size-specific batches)
  *   2. Stock Summary — aggregated by product (available/reserved/dispatched)
  *   3. Low Stock — filtered list with alert badges
  */

 import { useCallback, useEffect, useState } from 'react';
 import { format } from 'date-fns';
 import {
   AlertCircle,
   AlertTriangle,
   RefreshCcw,
   Plus,
   Package,
   Layers,
   BarChart3,
   Filter,
 } from 'lucide-react';
 import { Tabs } from '@/components/ui/Tabs';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Modal } from '@/components/ui/Modal';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { factoryApi } from '@/lib/factoryApi';
 import type {
   FactoryFinishedGoodDto,
   FactoryFinishedGoodRequest,
   FactoryFinishedGoodBatchDto,
   FactoryStockSummaryDto,
   ChildBatchDto,
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

 const LOW_STOCK_DEFAULT_THRESHOLD = 100;

 function isLowStock(good: FactoryFinishedGoodDto, threshold = LOW_STOCK_DEFAULT_THRESHOLD): boolean {
   return (good.currentStock ?? 0) < threshold;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // CRUD Form
 // ─────────────────────────────────────────────────────────────────────────────

 interface GoodFormState {
   name: string;
   productCode: string;
   unit: string;
   costingMethod: string;
 }

 function defaultForm(good?: FactoryFinishedGoodDto): GoodFormState {
   return {
     name: good?.name ?? '',
     productCode: good?.productCode ?? '',
     unit: good?.unit ?? '',
     costingMethod: good?.costingMethod ?? 'FIFO',
   };
 }

 function GoodForm({
   initial,
   onSave,
   onCancel,
   saving,
 }: {
   initial: GoodFormState;
   onSave: (data: FactoryFinishedGoodRequest) => void;
   onCancel: () => void;
   saving: boolean;
 }) {
   const [form, setForm] = useState<GoodFormState>(initial);
   const [errors, setErrors] = useState<Partial<GoodFormState>>({});

   function validate(): boolean {
     const e: Partial<GoodFormState> = {};
     if (!form.name.trim()) e.name = 'Name is required';
     if (!form.productCode.trim()) e.productCode = 'Product code is required';
     setErrors(e);
     return Object.keys(e).length === 0;
   }

   function handleSubmit() {
     if (!validate()) return;
     onSave({
       name: form.name.trim(),
       productCode: form.productCode.trim(),
       unit: form.unit.trim() || undefined,
       costingMethod: form.costingMethod || undefined,
     });
   }

   return (
     <div className="space-y-3 p-1">
       <div className="grid grid-cols-2 gap-3">
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Product Name <span className="text-[var(--color-error)]">*</span>
           </label>
           <input
             type="text"
             value={form.name}
             onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
             placeholder="e.g. Exterior Emulsion 1L"
             className={`w-full px-3 py-2 text-[13px] rounded-lg border bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none transition-colors ${errors.name ? 'border-[var(--color-error)]' : 'border-[var(--color-border-default)] focus:border-[var(--color-neutral-900)]'}`}
           />
           {errors.name && <p className="text-[11px] text-[var(--color-error)]">{errors.name}</p>}
         </div>
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Product Code <span className="text-[var(--color-error)]">*</span>
           </label>
           <input
             type="text"
             value={form.productCode}
             onChange={e => setForm(f => ({ ...f, productCode: e.target.value }))}
             placeholder="e.g. EXT-1L"
             className={`w-full px-3 py-2 text-[13px] rounded-lg border bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none transition-colors ${errors.productCode ? 'border-[var(--color-error)]' : 'border-[var(--color-border-default)] focus:border-[var(--color-neutral-900)]'}`}
           />
           {errors.productCode && <p className="text-[11px] text-[var(--color-error)]">{errors.productCode}</p>}
         </div>
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Unit
           </label>
           <input
             type="text"
             value={form.unit}
             onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
             placeholder="e.g. L, KG, Units"
             className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-neutral-900)] transition-colors"
           />
         </div>
         <div className="space-y-1.5">
           <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
             Costing Method
           </label>
           <select
             value={form.costingMethod}
             onChange={e => setForm(f => ({ ...f, costingMethod: e.target.value }))}
             className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-neutral-900)] transition-colors"
           >
             <option value="FIFO">FIFO</option>
             <option value="LIFO">LIFO</option>
             <option value="WEIGHTED_AVERAGE">Weighted Average</option>
           </select>
         </div>
       </div>
       <div className="flex justify-end gap-2 pt-2">
         <Button variant="secondary" onClick={onCancel}>Cancel</Button>
         <Button onClick={handleSubmit} disabled={saving}>
           {saving ? 'Saving…' : 'Save'}
         </Button>
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Batch Hierarchy View
 // ─────────────────────────────────────────────────────────────────────────────

 function BatchHierarchyView({
   good,
   batches,
   childBatches,
   loadingChildren,
   onLoadChildren,
 }: {
   good: FactoryFinishedGoodDto;
   batches: FactoryFinishedGoodBatchDto[];
   childBatches: Record<number, ChildBatchDto[]>;
   loadingChildren: Record<number, boolean>;
   onLoadChildren: (batchId: number) => void;
 }) {
   const totalQty = batches.reduce((sum, b) => sum + (b.quantityTotal ?? 0), 0);
   const availableQty = batches.reduce((sum, b) => sum + (b.quantityAvailable ?? 0), 0);

   return (
     <div className="space-y-3">
       {/* Summary */}
       <div className="grid grid-cols-3 gap-3">
         {[
           { label: 'Total Batches', value: batches.length.toString() },
           { label: 'Total Qty', value: fmtNum(totalQty) },
           { label: 'Available Qty', value: fmtNum(availableQty) },
         ].map(({ label, value }) => (
           <div key={label} className="rounded-xl p-3 border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] text-center">
             <p className="text-[20px] font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</p>
             <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{label}</p>
           </div>
         ))}
       </div>

       {batches.length === 0 ? (
         <p className="text-center py-6 text-[12px] text-[var(--color-text-tertiary)]">
           No batches registered for {good.name}.
         </p>
       ) : (
         <div className="space-y-2">
           {batches.map(batch => {
             const children = childBatches[batch.id] ?? [];
             const childrenLoaded = batch.id in childBatches;
             const loading = loadingChildren[batch.id] ?? false;

             return (
               <div key={batch.id} className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                 {/* Parent batch row */}
                 <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-primary)] border-b border-[var(--color-border-subtle)]">
                   <div className="flex items-center gap-3">
                     <Layers size={14} className="text-[var(--color-text-tertiary)]" />
                     <div>
                       <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                         {batch.batchCode ?? `Batch #${batch.id}`}
                       </p>
                       <p className="text-[11px] text-[var(--color-text-tertiary)]">
                         Manufactured: {fmtDate(batch.manufacturedAt)}
                         {batch.expiryDate && ` · Expires: ${fmtDate(batch.expiryDate)}`}
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 text-right">
                     <div>
                       <p className="text-[11px] text-[var(--color-text-tertiary)]">Total / Available</p>
                       <p className="text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">
                         {fmtNum(batch.quantityTotal)} / {fmtNum(batch.quantityAvailable)}
                       </p>
                     </div>
                     <div>
                       <p className="text-[11px] text-[var(--color-text-tertiary)]">Unit Cost</p>
                       <p className="text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">
                         {fmtCurrency(batch.unitCost)}
                       </p>
                     </div>
                     {!childrenLoaded && (
                       <button
                         type="button"
                         onClick={() => onLoadChildren(batch.id)}
                         disabled={loading}
                         className="text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                       >
                         {loading ? 'Loading…' : 'View sizes'}
                       </button>
                     )}
                   </div>
                 </div>

                 {/* Child batches */}
                 {childrenLoaded && children.length > 0 && (
                   <div className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
                     {children.map(child => (
                       <div key={child.id} className="flex items-center justify-between px-4 py-2.5 pl-10">
                         <div className="flex items-center gap-2.5">
                           <Package size={12} className="text-[var(--color-text-tertiary)]" />
                           <div>
                             <p className="text-[12px] text-[var(--color-text-primary)]">
                               {child.sizeLabel ?? child.batchCode ?? `Batch #${child.id}`}
                             </p>
                             <p className="text-[10px] text-[var(--color-text-tertiary)]">
                               {child.finishedGoodCode ?? child.finishedGoodName}
                             </p>
                           </div>
                         </div>
                         <div className="flex items-center gap-4 text-right text-[12px]">
                           <div>
                             <p className="text-[10px] text-[var(--color-text-tertiary)]">Quantity</p>
                             <p className="tabular-nums font-medium text-[var(--color-text-primary)]">{fmtNum(child.quantity)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] text-[var(--color-text-tertiary)]">Unit Cost</p>
                             <p className="tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(child.unitCost)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] text-[var(--color-text-tertiary)]">Total Value</p>
                             <p className="tabular-nums font-medium text-[var(--color-text-primary)]">{fmtCurrency(child.totalValue)}</p>
                           </div>
                         </div>
                       </div>
                     ))}
                     {/* Verification: sum of child quantities */}
                     <div className="flex items-center justify-between px-4 py-2 pl-10 bg-[var(--color-surface-tertiary)]">
                       <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                         Total packed
                       </p>
                       <p className="text-[12px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                         {fmtNum(children.reduce((s, c) => s + (c.quantity ?? 0), 0))}
                       </p>
                     </div>
                   </div>
                 )}
                 {childrenLoaded && children.length === 0 && (
                   <p className="px-4 py-2.5 pl-10 text-[11px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-secondary)]">
                     No size-specific batches.
                   </p>
                 )}
               </div>
             );
           })}
         </div>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function FinishedGoodsPage() {
   const toast = useToast();
   const [goods, setGoods] = useState<FactoryFinishedGoodDto[]>([]);
   const [summary, setSummary] = useState<FactoryStockSummaryDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // CRUD modals
   const [createOpen, setCreateOpen] = useState(false);
   const [editTarget, setEditTarget] = useState<FactoryFinishedGoodDto | null>(null);
   const [saving, setSaving] = useState(false);

   // Batch hierarchy
   const [batchTarget, setBatchTarget] = useState<FactoryFinishedGoodDto | null>(null);
   const [batches, setBatches] = useState<FactoryFinishedGoodBatchDto[]>([]);
   const [batchesLoading, setBatchesLoading] = useState(false);
   const [childBatches, setChildBatches] = useState<Record<number, ChildBatchDto[]>>({});
   const [loadingChildren, setLoadingChildren] = useState<Record<number, boolean>>({});

   // Tabs
   const [activeTab, setActiveTab] = useState('goods');
   const [showLowStockOnly, setShowLowStockOnly] = useState(false);
   const [lowStockThreshold, setLowStockThreshold] = useState(LOW_STOCK_DEFAULT_THRESHOLD);

   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const [goodsData, summaryData] = await Promise.all([
         factoryApi.getFinishedGoods(),
         factoryApi.getFinishedGoodStockSummary(),
       ]);
       setGoods(goodsData ?? []);
       setSummary(summaryData ?? []);
     } catch {
       setError('Unable to load finished goods. Please try again.');
     } finally {
       setLoading(false);
     }
   }, []);

   useEffect(() => { void load(); }, [load]);

   async function handleCreate(data: FactoryFinishedGoodRequest) {
     setSaving(true);
     try {
       await factoryApi.createFinishedGood(data);
       toast.success('Finished good created');
       setCreateOpen(false);
       await load();
     } catch {
       toast.error('Failed to create finished good');
     } finally {
       setSaving(false);
     }
   }

   async function handleEdit(data: FactoryFinishedGoodRequest) {
     if (!editTarget) return;
     setSaving(true);
     try {
       await factoryApi.updateFinishedGood(editTarget.id, data);
       toast.success('Finished good updated');
       setEditTarget(null);
       await load();
     } catch {
       toast.error('Failed to update finished good');
     } finally {
       setSaving(false);
     }
   }

   async function openBatches(good: FactoryFinishedGoodDto) {
     setBatchTarget(good);
     setBatches([]);
     setChildBatches({});
     setBatchesLoading(true);
     try {
       const data = await factoryApi.getFinishedGoodBatches(good.id);
       setBatches(data ?? []);
     } catch {
       toast.error('Failed to load batches');
       setBatchTarget(null);
     } finally {
       setBatchesLoading(false);
     }
   }

   async function loadChildren(batchId: number) {
     setLoadingChildren(prev => ({ ...prev, [batchId]: true }));
     try {
       const data = await factoryApi.getBulkBatchChildren(batchId);
       setChildBatches(prev => ({ ...prev, [batchId]: data ?? [] }));
     } catch {
       toast.error('Failed to load child batches');
     } finally {
       setLoadingChildren(prev => ({ ...prev, [batchId]: false }));
     }
   }

   const tabs = [
     { value: 'goods', label: 'All Goods' },
     { value: 'summary', label: 'Stock Summary' },
     { value: 'lowstock', label: 'Low Stock' },
   ];

   const displayedGoods = showLowStockOnly
     ? goods.filter(g => isLowStock(g, lowStockThreshold))
     : goods;

   const lowStockGoods = goods.filter(g => isLowStock(g, lowStockThreshold));

   // ── Render ────────────────────────────────────────────────────────────────

   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Finished Goods</h1>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
             Manage finished goods inventory, stock levels, and batch hierarchy.
           </p>
         </div>
         <div className="flex items-center gap-2">
           <button
             type="button"
             onClick={load}
             className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
           >
             <RefreshCcw size={13} />
             Refresh
           </button>
           {activeTab === 'goods' && (
             <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 h-8 text-[12px]">
               <Plus size={13} />
               Add Good
             </Button>
           )}
         </div>
       </div>

       {/* Low stock alert banner */}
       {!loading && lowStockGoods.length > 0 && (
         <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-bg)]">
           <AlertTriangle size={16} className="text-[var(--color-warning)] shrink-0" />
           <p className="text-[12px] text-[var(--color-warning)]">
             {lowStockGoods.length} product{lowStockGoods.length !== 1 ? 's' : ''} below stock threshold ({lowStockThreshold} units).
           </p>
           <div className="ml-auto flex items-center gap-2">
             <input
               type="number"
               value={lowStockThreshold}
               onChange={e => setLowStockThreshold(Number(e.target.value))}
               className="w-16 px-2 py-1 text-[11px] rounded-md border border-[var(--color-warning)] bg-transparent text-[var(--color-warning)] tabular-nums"
               min={0}
             />
             <span className="text-[11px] text-[var(--color-warning)]">threshold</span>
           </div>
         </div>
       )}

       {/* Tabs */}
       <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

       {loading ? (
         <div className="space-y-3">
           {Array.from({ length: 5 }).map((_, i) => (
             <Skeleton key={i} className="h-12 w-full rounded-lg" />
           ))}
         </div>
       ) : error ? (
         <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
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
         </div>
       ) : (
         <>
           {/* All Goods tab */}
           {activeTab === 'goods' && (
             <div className="space-y-3">
               {/* Filter bar */}
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   onClick={() => setShowLowStockOnly(v => !v)}
                   className={`flex items-center gap-1.5 px-3 h-7 rounded-lg border text-[11px] transition-colors ${showLowStockOnly ? 'border-[var(--color-warning)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]' : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'}`}
                 >
                   <Filter size={11} />
                   Low Stock Only
                 </button>
                 {showLowStockOnly && (
                   <span className="text-[11px] text-[var(--color-text-tertiary)]">
                     {displayedGoods.length} item{displayedGoods.length !== 1 ? 's' : ''}
                   </span>
                 )}
               </div>

               <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
                 {displayedGoods.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-12 gap-2">
                     <Package size={24} className="text-[var(--color-text-tertiary)]" />
                     <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                       No finished goods {showLowStockOnly ? 'below threshold' : 'registered'}
                     </p>
                     {!showLowStockOnly && (
                       <p className="text-[12px] text-[var(--color-text-tertiary)]">
                         Add your first finished good to get started.
                       </p>
                     )}
                   </div>
                 ) : (
                   <>
                     {/* Desktop table */}
                     <div className="hidden sm:block overflow-x-auto">
                       <table className="w-full text-[12px]">
                         <thead>
                           <tr className="border-b border-[var(--color-border-subtle)]">
                             {['Product', 'SKU', 'Unit', 'On Hand', 'Reserved', 'Status', ''].map(h => (
                               <th key={h} className="px-4 py-2.5 text-left font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px]">
                                 {h}
                               </th>
                             ))}
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-[var(--color-border-subtle)]">
                           {displayedGoods.map(good => (
                             <tr key={good.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                               <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                                 <div className="flex items-center gap-2">
                                   {isLowStock(good, lowStockThreshold) && (
                                     <AlertTriangle size={13} className="text-[var(--color-warning)] shrink-0" />
                                   )}
                                   {good.name}
                                 </div>
                               </td>
                               <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-[11px]">
                                 {good.productCode ?? '—'}
                               </td>
                               <td className="px-4 py-3 text-[var(--color-text-tertiary)]">{good.unit ?? '—'}</td>
                               <td className="px-4 py-3 tabular-nums font-medium text-[var(--color-text-primary)]">
                                 {fmtNum(good.currentStock)}
                               </td>
                               <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">
                                 {fmtNum(good.reservedStock)}
                               </td>
                               <td className="px-4 py-3">
                                 {isLowStock(good, lowStockThreshold) ? (
                                   <Badge variant="warning">Low Stock</Badge>
                                 ) : (
                                   <Badge variant="success">In Stock</Badge>
                                 )}
                               </td>
                               <td className="px-4 py-3">
                                 <div className="flex items-center gap-1.5 justify-end">
                                   <button
                                     type="button"
                                     onClick={() => openBatches(good)}
                                     className="flex items-center gap-1 px-2.5 h-7 rounded-md border border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                                   >
                                     <Layers size={12} />
                                     Batches
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => setEditTarget(good)}
                                     className="flex items-center gap-1 px-2.5 h-7 rounded-md border border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                                   >
                                     Edit
                                   </button>
                                 </div>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>

                     {/* Mobile cards */}
                     <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
                       {displayedGoods.map(good => (
                         <div key={good.id} className="p-4 space-y-2">
                           <div className="flex items-start justify-between gap-2">
                             <div>
                               <div className="flex items-center gap-1.5">
                                 {isLowStock(good, lowStockThreshold) && (
                                   <AlertTriangle size={12} className="text-[var(--color-warning)]" />
                                 )}
                                 <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{good.name}</p>
                               </div>
                               <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                                 {good.productCode} · {good.unit}
                               </p>
                             </div>
                             {isLowStock(good, lowStockThreshold) ? (
                               <Badge variant="warning">Low Stock</Badge>
                             ) : (
                               <Badge variant="success">In Stock</Badge>
                             )}
                           </div>
                           <div className="flex items-center gap-4 text-[12px]">
                             <span className="text-[var(--color-text-tertiary)]">On hand: <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{fmtNum(good.currentStock)}</span></span>
                             <span className="text-[var(--color-text-tertiary)]">Reserved: <span className="tabular-nums text-[var(--color-text-secondary)]">{fmtNum(good.reservedStock)}</span></span>
                           </div>
                           <div className="flex gap-2">
                             <button
                               type="button"
                               onClick={() => openBatches(good)}
                               className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                             >
                               <Layers size={13} />
                               Batches
                             </button>
                             <button
                               type="button"
                               onClick={() => setEditTarget(good)}
                               className="flex-1 flex items-center justify-center h-8 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                             >
                               Edit
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </>
                 )}
               </div>
             </div>
           )}

           {/* Stock Summary tab */}
           {activeTab === 'summary' && (
             <div className="space-y-3">
               <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
                 {summary.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-12 gap-2">
                     <BarChart3 size={24} className="text-[var(--color-text-tertiary)]" />
                     <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Stock Summary</p>
                     <p className="text-[12px] text-[var(--color-text-tertiary)]">No stock summary data available.</p>
                   </div>
                 ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full text-[12px]">
                       <thead>
                         <tr className="border-b border-[var(--color-border-subtle)]">
                           {['Product', 'Code', 'Current Stock', 'Reserved', 'Available', 'Avg Cost', 'Batches'].map(h => (
                             <th key={h} className="px-4 py-2.5 text-left font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px]">
                               {h}
                             </th>
                           ))}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--color-border-subtle)]">
                         {summary.map((item, i) => (
                           <tr key={item.id ?? i} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                             <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{item.name ?? '—'}</td>
                             <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-[11px]">{item.code ?? '—'}</td>
                             <td className="px-4 py-3 tabular-nums font-medium text-[var(--color-text-primary)]">{fmtNum(item.currentStock)}</td>
                             <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtNum(item.reservedStock)}</td>
                             <td className="px-4 py-3 tabular-nums font-medium text-[var(--color-text-primary)]">{fmtNum(item.availableStock)}</td>
                             <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtCurrency(item.weightedAverageCost)}</td>
                             <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{item.totalBatches ?? '—'}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* Low Stock tab */}
           {activeTab === 'lowstock' && (
             <div className="space-y-3">
               <div className="flex items-center gap-2">
                 <span className="text-[12px] text-[var(--color-text-tertiary)]">Threshold:</span>
                 <input
                   type="number"
                   value={lowStockThreshold}
                   onChange={e => setLowStockThreshold(Number(e.target.value))}
                   className="w-20 px-2 py-1 text-[12px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] tabular-nums"
                   min={0}
                 />
                 <span className="text-[12px] text-[var(--color-text-tertiary)]">units</span>
               </div>
               <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
                 {lowStockGoods.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-12 gap-2">
                     <Package size={24} className="text-[var(--color-success)]" />
                     <p className="text-[13px] font-medium text-[var(--color-text-primary)]">All stock levels healthy</p>
                     <p className="text-[12px] text-[var(--color-text-tertiary)]">
                       No products below {lowStockThreshold} units.
                     </p>
                   </div>
                 ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full text-[12px]">
                       <thead>
                         <tr className="border-b border-[var(--color-border-subtle)]">
                           {['Product', 'SKU', 'Current Stock', 'Reserved', 'Shortfall'].map(h => (
                             <th key={h} className="px-4 py-2.5 text-left font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px]">
                               {h}
                             </th>
                           ))}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--color-border-subtle)]">
                         {lowStockGoods.map(good => (
                           <tr key={good.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                             <td className="px-4 py-3">
                               <div className="flex items-center gap-2">
                                 <AlertTriangle size={13} className="text-[var(--color-warning)] shrink-0" />
                                 <span className="font-medium text-[var(--color-text-primary)]">{good.name}</span>
                               </div>
                             </td>
                             <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-[11px]">{good.productCode ?? '—'}</td>
                             <td className="px-4 py-3 tabular-nums text-[var(--color-warning)] font-medium">
                               {fmtNum(good.currentStock)}
                             </td>
                             <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">{fmtNum(good.reservedStock)}</td>
                             <td className="px-4 py-3 tabular-nums text-[var(--color-error)] font-medium">
                               {fmtNum(lowStockThreshold - (good.currentStock ?? 0))}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>
             </div>
           )}
         </>
       )}

       {/* Create Modal */}
       <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add Finished Good">
         <GoodForm
           initial={defaultForm()}
           onSave={handleCreate}
           onCancel={() => setCreateOpen(false)}
           saving={saving}
         />
       </Modal>

       {/* Edit Modal */}
       <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Finished Good">
         {editTarget && (
           <GoodForm
             initial={defaultForm(editTarget)}
             onSave={handleEdit}
             onCancel={() => setEditTarget(null)}
             saving={saving}
           />
         )}
       </Modal>

       {/* Batch Hierarchy Modal */}
       <Modal
         isOpen={!!batchTarget}
         onClose={() => { setBatchTarget(null); setBatches([]); setChildBatches({}); }}
         title={`Batch Hierarchy — ${batchTarget?.name ?? ''}`}
       >
         {batchesLoading ? (
           <div className="p-4 space-y-3">
             {Array.from({ length: 3 }).map((_, i) => (
               <Skeleton key={i} className="h-12 w-full rounded-lg" />
             ))}
           </div>
         ) : batchTarget ? (
           <BatchHierarchyView
             good={batchTarget}
             batches={batches}
             childBatches={childBatches}
             loadingChildren={loadingChildren}
             onLoadChildren={loadChildren}
           />
         ) : null}
       </Modal>
     </div>
   );
 }

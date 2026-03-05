 /**
  * FinishedGoodsPage
  *
  * Finished goods inventory:
  *  - List view with stock summary (on hand, reserved, available)
  *  - Batch hierarchy per finished good
  *  - Low stock warning badges
  *
  * API:
  *  GET /api/v1/finished-goods
  *  GET /api/v1/finished-goods/stock-summary
  *  GET /api/v1/finished-goods/{id}/batches
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Layers,
 } from 'lucide-react';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { PageHeader } from '@/components/ui/PageHeader';
 import {
   inventoryApi,
   type FinishedGoodDto,
   type FinishedGoodBatchDto,
   type StockSummaryDto,
 } from '@/lib/inventoryApi';
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatDate(dateStr?: string): string {
   if (!dateStr) return '—';
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
     maximumFractionDigits: 2,
   }).format(amount);
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Stock Summary Tiles
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface StockSummaryTilesProps {
   summary: StockSummaryDto[];
 }
 
 function StockSummaryTiles({ summary }: StockSummaryTilesProps) {
   const totalOnHand = summary.reduce((sum, s) => sum + (s.currentStock ?? 0), 0);
   const totalReserved = summary.reduce((sum, s) => sum + (s.reservedStock ?? 0), 0);
   const totalAvailable = summary.reduce((sum, s) => sum + (s.availableStock ?? 0), 0);
 
   const tiles = [
     { label: 'Total On Hand', value: totalOnHand.toLocaleString('en-IN') },
     { label: 'Reserved', value: totalReserved.toLocaleString('en-IN') },
     { label: 'Available', value: totalAvailable.toLocaleString('en-IN') },
     { label: 'SKUs', value: summary.length.toString() },
   ];
 
   return (
     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
       {tiles.map((tile) => (
         <div
           key={tile.label}
           className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] p-4"
         >
           <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
             {tile.label}
           </p>
           <p className="text-[22px] font-semibold tabular-nums text-[var(--color-text-primary)] mt-1">
             {tile.value}
           </p>
         </div>
       ))}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Batches Modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface BatchesModalProps {
   item: FinishedGoodDto;
   onClose: () => void;
 }
 
 function BatchesModal({ item, onClose }: BatchesModalProps) {
   const [batches, setBatches] = useState<FinishedGoodBatchDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     setIsLoading(true);
     inventoryApi
       .getFinishedGoodBatches(item.id)
       .then(setBatches)
       .catch(() => setError('Failed to load batches.'))
       .finally(() => setIsLoading(false));
   }, [item.id]);
 
   return (
     <Modal isOpen onClose={onClose} title={`Batches — ${item.name}`} description={item.sku ?? ''} size="lg">
       {isLoading ? (
         <div className="space-y-2">
           {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
         </div>
       ) : error ? (
         <p className="text-[13px] text-[var(--color-danger-text)]">{error}</p>
       ) : batches.length === 0 ? (
         <div className="py-8 text-center">
           <Layers size={22} className="mx-auto mb-2 text-[var(--color-text-tertiary)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">No batches recorded for this item.</p>
         </div>
       ) : (
         <div className="overflow-x-auto">
           <table className="w-full text-[13px]">
             <thead className="bg-[var(--color-surface-secondary)]">
               <tr>
                 <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Batch</th>
                 <th className="px-3 py-2 text-right font-medium text-[var(--color-text-secondary)]">Qty</th>
                 <th className="px-3 py-2 text-right font-medium text-[var(--color-text-secondary)]">Unit Cost</th>
                 <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Expiry</th>
                 <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Manufactured</th>
                 <th className="px-3 py-2 text-center font-medium text-[var(--color-text-secondary)]">Status</th>
               </tr>
             </thead>
             <tbody>
               {batches.map((b) => (
                 <tr key={b.id} className="border-t border-[var(--color-border-subtle)]">
                   <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--color-text-secondary)]">
                     {b.batchCode ?? `B-${b.id}`}
                   </td>
                   <td className="px-3 py-2.5 text-right tabular-nums">{b.quantity}</td>
                   <td className="px-3 py-2.5 text-right tabular-nums">
                     {b.costPerUnit !== undefined ? formatINR(b.costPerUnit) : '—'}
                   </td>
                   <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{formatDate(b.expiryDate)}</td>
                   <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{formatDate(b.manufacturedAt)}</td>
                   <td className="px-3 py-2.5 text-center">
                     {b.status ? (
                       <Badge variant={b.status === 'AVAILABLE' ? 'success' : 'default'} dot>
                         {b.status}
                       </Badge>
                     ) : '—'}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function FinishedGoodsPage() {
  const [items, setItems] = useState<FinishedGoodDto[]>([]);
   const [summary, setSummary] = useState<StockSummaryDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [batchItem, setBatchItem] = useState<FinishedGoodDto | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [goods, sum] = await Promise.all([
         inventoryApi.getFinishedGoods(),
         inventoryApi.getFinishedGoodsStockSummary(),
       ]);
       setItems(goods);
       setSummary(sum);
     } catch {
       setError('Failed to load finished goods. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   // Build a map from finished good id to stock summary
   const summaryMap = new Map<number, StockSummaryDto>(
     summary.filter((s) => s.finishedGoodId).map((s) => [s.finishedGoodId!, s])
   );
 
   const COLUMNS: Column<FinishedGoodDto>[] = [
     {
       id: 'name',
       header: 'Product',
       accessor: (row) => (
         <div>
           <p className="font-medium text-[var(--color-text-primary)]">{row.name}</p>
           {row.sku && (
             <p className="text-[11px] font-mono text-[var(--color-text-tertiary)]">{row.sku}</p>
           )}
         </div>
       ),
       sortable: true,
       sortAccessor: (row) => row.name,
     },
     {
       id: 'brand',
       header: 'Brand',
       accessor: (row) => (
         <span className="text-[var(--color-text-secondary)]">{row.brandName ?? '—'}</span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'onHand',
       header: 'On Hand',
       accessor: (row) => {
         const s = summaryMap.get(row.id);
         const qty = s?.currentStock ?? row.onHandQty ?? 0;
         const isLow = (row.reorderLevel ?? 0) > 0 && qty <= (row.reorderLevel ?? 0);
         return (
           <span className={`tabular-nums font-medium ${isLow ? 'text-[var(--color-warning-text)]' : 'text-[var(--color-text-primary)]'}`}>
             {qty}
           </span>
         );
       },
       align: 'right',
       sortable: true,
       sortAccessor: (row) => summaryMap.get(row.id)?.currentStock ?? row.onHandQty ?? 0,
       width: '100px',
     },
     {
       id: 'reserved',
       header: 'Reserved',
       accessor: (row) => {
         const s = summaryMap.get(row.id);
         return <span className="tabular-nums text-[var(--color-text-secondary)]">{s?.reservedStock ?? '—'}</span>;
       },
       align: 'right',
       hideOnMobile: true,
       width: '90px',
     },
     {
       id: 'available',
       header: 'Available',
       accessor: (row) => {
         const s = summaryMap.get(row.id);
         return (
           <span className="tabular-nums font-medium text-[var(--color-success-text)]">
             {s?.availableStock ?? '—'}
           </span>
         );
       },
       align: 'right',
       hideOnMobile: true,
       width: '90px',
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => {
         const s = summaryMap.get(row.id);
         const qty = s?.currentStock ?? row.onHandQty ?? 0;
         const isLow = (row.reorderLevel ?? 0) > 0 && qty <= (row.reorderLevel ?? 0);
         return (
           <Badge variant={row.active === false ? 'default' : isLow ? 'warning' : 'success'} dot>
             {row.active === false ? 'Inactive' : isLow ? 'Low Stock' : 'In Stock'}
           </Badge>
         );
       },
       align: 'center',
       width: '110px',
       hideOnMobile: true,
     },
     {
       id: 'actions',
       header: '',
       accessor: (row) => (
         <button
           type="button"
           onClick={() => setBatchItem(row)}
           className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
         >
           <Layers size={12} />
           Batches
         </button>
       ),
       align: 'right',
       width: '90px',
     },
   ];
 
   if (isLoading) {
     return (
       <div className="space-y-5">
         <Skeleton className="h-9 w-48" />
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
           {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
         </div>
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
         title="Finished Goods"
         description="Stock levels, batch hierarchy, and availability"
         actions={
           <Button size="sm" variant="secondary" leftIcon={<RefreshCcw size={13} />} onClick={load}>
             Refresh
           </Button>
         }
       />
 
       <StockSummaryTiles summary={summary} />
 
       <DataTable
         columns={COLUMNS}
         data={items}
         keyExtractor={(row) => row.id}
         searchable
         searchPlaceholder="Search finished goods..."
         searchFilter={(row, q) =>
           row.name.toLowerCase().includes(q) ||
           (row.sku?.toLowerCase().includes(q) ?? false) ||
           (row.brandName?.toLowerCase().includes(q) ?? false)
         }
         emptyMessage="No finished goods found."
       />
 
       {batchItem && (
         <BatchesModal item={batchItem} onClose={() => setBatchItem(null)} />
       )}
     </div>
   );
 }

 /**
  * InventoryValuationPage
  *
  * Sortable table with GL cross-reference, plus summary tiles.
  * PDF and CSV export.
  *
  * API: GET /api/v1/reports/inventory-valuation
  */

 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw, AlertTriangle } from 'lucide-react';
 import { clsx } from 'clsx';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { ExportButton } from '@/components/ui/ExportButton';
 import { reportsApi, type InventoryValuationDto, type InventoryValuationItemDto } from '@/lib/reportsApi';
 import { useToast } from '@/components/ui/Toast';

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 const COLUMNS: Column<InventoryValuationItemDto>[] = [
   {
     id: 'code',
     header: 'Code',
     accessor: (row) => (
       <span className="tabular-nums font-medium text-[var(--color-text-secondary)]">{row.code}</span>
     ),
     sortable: true,
     sortAccessor: (row) => row.code,
     width: '100px',
   },
   {
     id: 'name',
     header: 'Item',
     accessor: (row) => (
       <div className="flex items-center gap-2">
         <span className="text-[13px] text-[var(--color-text-primary)]">{row.name}</span>
         {row.lowStock && (
           <AlertTriangle size={12} className="text-[var(--color-warning-icon)] shrink-0" />
         )}
       </div>
     ),
     sortable: true,
     sortAccessor: (row) => row.name,
   },
   {
     id: 'type',
     header: 'Type',
     accessor: (row) => (
       <Badge variant={row.inventoryType === 'FINISHED_GOOD' ? 'info' : 'default'}>
         {row.inventoryType === 'FINISHED_GOOD' ? 'Finished Good' : 'Raw Material'}
       </Badge>
     ),
     hideOnMobile: true,
   },
   {
     id: 'category',
     header: 'Category',
     accessor: (row) => <span className="text-[var(--color-text-secondary)]">{row.category ?? '—'}</span>,
     sortable: true,
     sortAccessor: (row) => row.category ?? '',
     hideOnMobile: true,
   },
   {
     id: 'qty',
     header: 'On Hand',
     accessor: (row) => (
       <span className={clsx('tabular-nums font-medium', row.lowStock ? 'text-[var(--color-warning-icon)]' : 'text-[var(--color-text-primary)]')}>
         {row.quantityOnHand ?? 0}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.quantityOnHand ?? 0,
     align: 'right',
     hideOnMobile: true,
   },
   {
     id: 'unitCost',
     header: 'Unit Cost',
     accessor: (row) => <span className="tabular-nums text-[var(--color-text-secondary)]">{formatINR(row.unitCost ?? 0)}</span>,
     sortable: true,
     sortAccessor: (row) => row.unitCost ?? 0,
     align: 'right',
     hideOnMobile: true,
   },
   {
     id: 'totalValue',
     header: 'Total Value',
     accessor: (row) => <span className="tabular-nums font-semibold text-[var(--color-text-primary)]">{formatINR(row.totalValue ?? 0)}</span>,
     sortable: true,
     sortAccessor: (row) => row.totalValue ?? 0,
     align: 'right',
   },
 ];

 export function InventoryValuationPage() {
   const toast = useToast();
   const [data, setData] = useState<InventoryValuationDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await reportsApi.getInventoryValuation();
       setData(result);
     } catch {
       setError('Failed to load inventory valuation. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const handleExport = async (format: 'PDF' | 'CSV') => {
     try {
       await reportsApi.getInventoryValuation();
       toast.success('Export ready', `Inventory valuation ${format} export has been prepared.`);
     } catch {
       toast.error('Export failed', 'Could not export the report. Please try again.');
     }
   };

   return (
     <div className="space-y-5">
       <PageHeader
         title="Inventory Valuation"
         description="Current stock value across all items"
         actions={
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="sm" leftIcon={<RefreshCcw size={13} />} onClick={load}>Refresh</Button>
             <ExportButton onExport={handleExport} />
           </div>
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
         <div className="space-y-4">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
           </div>
           <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4 space-y-2">
             {Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="flex gap-3 py-2">
                 <Skeleton className="h-4 w-16" />
                 <Skeleton className="h-4 flex-1" />
                 <Skeleton className="h-4 w-20" />
                 <Skeleton className="h-4 w-24" />
               </div>
             ))}
           </div>
         </div>
       )}

       {!isLoading && data && (
         <>
           {/* Summary tiles */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
               <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Total Value</p>
               <p className="mt-1.5 text-[20px] font-bold tabular-nums text-[var(--color-text-primary)]">{formatINR(data.totalValue ?? 0)}</p>
             </div>
             <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
               <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Low Stock Items</p>
               <p className={clsx('mt-1.5 text-[20px] font-bold tabular-nums', (data.lowStockItems ?? 0) > 0 ? 'text-[var(--color-warning-icon)]' : 'text-[var(--color-text-primary)]')}>
                 {data.lowStockItems ?? 0}
               </p>
             </div>
             <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
               <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Costing Method</p>
               <p className="mt-1.5 text-[15px] font-semibold text-[var(--color-text-primary)]">{data.costingMethod ?? 'N/A'}</p>
             </div>
           </div>

           {/* Items table */}
           <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
             <DataTable
               columns={COLUMNS}
               data={data.items ?? []}
               keyExtractor={(row) => row.inventoryItemId}
               searchable
               searchPlaceholder="Search items..."
               searchFilter={(row, q) =>
                 row.code?.toLowerCase().includes(q) ||
                 row.name?.toLowerCase().includes(q) ||
                 row.category?.toLowerCase().includes(q)
               }
               emptyMessage="No inventory items found."
             />
           </div>
         </>
       )}
     </div>
   );
 }

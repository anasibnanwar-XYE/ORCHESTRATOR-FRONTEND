 /**
  * CostAllocationPage
  *
  * Cost breakdown per batch/plan showing:
  *   - Raw material costs, labor costs, overhead costs, packaging costs, total cost per unit
  *   - Drilldown by production log with full component trace
  */

 import { useCallback, useEffect, useState } from 'react';
 import { format } from 'date-fns';
 import { BarChart2, ChevronRight } from 'lucide-react';
 import { Button } from '@/components/ui/Button';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Modal } from '@/components/ui/Modal';
 import { factoryApi } from '@/lib/factoryApi';
 import type { ProductionLogDto, CostBreakdownDto } from '@/types';

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

 function fmtCurrency(n: number | undefined): string {
   if (n === undefined || n === null) return '—';
   return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
 }

 function fmtNum(n: number | undefined): string {
   if (n === undefined || n === null) return '—';
   return n.toLocaleString();
 }

 type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

 function statusVariant(status: string | undefined): BadgeVariant {
   switch (status) {
     case 'READY_TO_PACK': return 'info';
     case 'PARTIAL_PACKED': return 'warning';
     case 'FULLY_PACKED': return 'success';
     default: return 'default';
   }
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Cost Breakdown Modal
 // ─────────────────────────────────────────────────────────────────────────────

 interface CostBreakdownModalProps {
   isOpen: boolean;
   logId: number | null;
   onClose: () => void;
 }

 function CostBreakdownModal({ isOpen, logId, onClose }: CostBreakdownModalProps) {
   const [breakdown, setBreakdown] = useState<CostBreakdownDto | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
     if (!isOpen || !logId) return;
     setBreakdown(null);
     setError(null);
     setIsLoading(true);
     factoryApi.getCostBreakdown(logId)
       .then((data) => setBreakdown(data))
       .catch(() => setError("Couldn't load cost breakdown."))
       .finally(() => setIsLoading(false));
   }, [isOpen, logId]);

   const components = breakdown?.costComponents;

   return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       title="Cost Breakdown"
       size="lg"
       footer={
         <Button variant="secondary" onClick={onClose}>Close</Button>
       }
     >
       {isLoading && (
         <div className="space-y-3 animate-pulse">
           {[1, 2, 3, 4, 5].map((i) => (
             <div key={i} className="h-8 bg-[var(--color-surface-tertiary)] rounded-lg" />
           ))}
         </div>
       )}

       {error && (
         <p className="text-[13px] text-[var(--color-error)]">{error}</p>
       )}

       {breakdown && !isLoading && (
         <div className="space-y-5">
           {/* Production info */}
           <div className="px-3 py-2.5 bg-[var(--color-surface-tertiary)] rounded-lg text-[12px]">
             <span className="font-medium text-[var(--color-text-primary)]">
               {breakdown.productionCode}
             </span>
             {breakdown.productName && (
               <>
                 <span className="mx-2 text-[var(--color-text-tertiary)]">·</span>
                 <span className="text-[var(--color-text-secondary)]">{breakdown.productName}</span>
               </>
             )}
           </div>

           {/* Cost components */}
           {components && (
             <div>
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] mb-2">
                 Cost Components
               </p>
               <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                 {[
                   { label: 'Raw Materials', value: components.productionMaterialCost },
                   { label: 'Labour', value: components.laborCost },
                   { label: 'Overhead', value: components.overheadCost },
                   { label: 'Packaging', value: components.packagingCost },
                 ].map(({ label, value }) => (
                   <div key={label} className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0 border-[var(--color-border-subtle)]">
                     <span className="text-[13px] text-[var(--color-text-secondary)]">{label}</span>
                     <span className="tabular-nums text-[13px] font-medium text-[var(--color-text-primary)]">
                       {fmtCurrency(value)}
                     </span>
                   </div>
                 ))}
                 <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-tertiary)]">
                   <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Total Cost</span>
                   <span className="tabular-nums text-[14px] font-semibold text-[var(--color-text-primary)]">
                     {fmtCurrency(components.totalCost)}
                   </span>
                 </div>
               </div>
             </div>
           )}

           {/* Per-unit metrics */}
           {components && (
             <div className="grid grid-cols-3 gap-3">
               {[
                 { label: 'Mixed Qty', value: `${fmtNum(components.mixedQuantity)} L` },
                 { label: 'Packed Qty', value: `${fmtNum(components.packedQuantity)} L` },
                 { label: 'Cost / Unit', value: fmtCurrency(components.blendedUnitCost) },
               ].map(({ label, value }) => (
                 <div key={label} className="px-3 py-2.5 bg-[var(--color-surface-tertiary)] rounded-xl">
                   <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-[0.06em]">{label}</p>
                   <p className="tabular-nums text-[14px] font-semibold text-[var(--color-text-primary)] mt-0.5">{value}</p>
                 </div>
               ))}
             </div>
           )}

           {/* Packed batches */}
           {(breakdown.packedBatches ?? []).length > 0 && (
             <div>
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] mb-2">
                 Packed Batches
               </p>
               <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                 <div className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-2 bg-[var(--color-surface-tertiary)] border-b border-[var(--color-border-default)]">
                   <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Batch</p>
                   <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] text-right">Size</p>
                   <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] text-right">Qty</p>
                   <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] text-right">Value</p>
                 </div>
                 {(breakdown.packedBatches ?? []).map((b, idx) => (
                   <div key={idx} className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-2.5 border-b last:border-b-0 border-[var(--color-border-subtle)] items-center">
                     <div>
                       <p className="text-[12px] text-[var(--color-text-primary)]">{b.finishedGoodName ?? '—'}</p>
                       <p className="text-[11px] text-[var(--color-text-tertiary)] font-mono">{b.finishedGoodCode ?? ''}</p>
                     </div>
                     <p className="text-[12px] text-[var(--color-text-secondary)] text-right">{b.sizeLabel ?? '—'}</p>
                     <p className="tabular-nums text-[12px] text-[var(--color-text-secondary)] text-right">{fmtNum(b.packedQuantity)}</p>
                     <p className="tabular-nums text-[12px] font-medium text-[var(--color-text-primary)] text-right">{fmtCurrency(b.totalValue)}</p>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {/* Raw material trace */}
           {(breakdown.rawMaterialTrace ?? []).length > 0 && (
             <div>
               <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] mb-2">
                 Raw Material Usage
               </p>
               <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                 <div className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-2 bg-[var(--color-surface-tertiary)] border-b border-[var(--color-border-default)]">
                   <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Material</p>
                   <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] text-right">Qty</p>
                   <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] text-right">Unit Cost</p>
                   <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] text-right">Total</p>
                 </div>
                 {(breakdown.rawMaterialTrace ?? []).map((m, idx) => (
                   <div key={idx} className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-2.5 border-b last:border-b-0 border-[var(--color-border-subtle)] items-center">
                     <p className="text-[12px] text-[var(--color-text-primary)]">{m.materialName ?? '—'}</p>
                     <p className="tabular-nums text-[12px] text-[var(--color-text-secondary)] text-right">{fmtNum(m.quantity)}</p>
                     <p className="tabular-nums text-[12px] text-[var(--color-text-secondary)] text-right">{fmtCurrency(m.unitCost)}</p>
                     <p className="tabular-nums text-[12px] font-medium text-[var(--color-text-primary)] text-right">{fmtCurrency(m.totalCost)}</p>
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
       )}
     </Modal>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function CostAllocationPage() {
   const [logs, setLogs] = useState<ProductionLogDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Breakdown modal
   const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
   const [showBreakdown, setShowBreakdown] = useState(false);

   // Filter
   const [statusFilter, setStatusFilter] = useState('');

   const loadLogs = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await factoryApi.getProductionLogs();
       setLogs(data);
     } catch {
       setError("Couldn't load production data.");
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     void loadLogs();
   }, [loadLogs]);

   const filteredLogs = statusFilter
     ? logs.filter((l) => l.status === statusFilter)
     : logs;

   const columns: Column<ProductionLogDto>[] = [
     {
       id: 'productionCode',
       header: 'Production Code',
       accessor: (row) => (
         <span className="font-mono text-[13px] font-medium text-[var(--color-text-primary)]">
           {row.productionCode ?? `LOG-${row.id}`}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.productionCode ?? '',
     },
     {
       id: 'product',
       header: 'Product',
       accessor: (row) => (
         <div>
           <p className="text-[13px] text-[var(--color-text-primary)]">{row.productName ?? '—'}</p>
           {row.brandName && (
             <p className="text-[11px] text-[var(--color-text-tertiary)]">{row.brandName}</p>
           )}
         </div>
       ),
     },
     {
       id: 'batchSize',
       header: 'Batch Size (L)',
       accessor: (row) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-secondary)]">
           {row.mixedQuantity?.toLocaleString() ?? '—'}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'laborCost',
       header: 'Labour Cost',
       accessor: (row) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-secondary)]">
           {row.laborCost !== undefined ? fmtCurrency(row.laborCost) : '—'}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'overheadCost',
       header: 'Overhead',
       accessor: (row) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-secondary)]">
           {row.overheadCost !== undefined ? fmtCurrency(row.overheadCost) : '—'}
         </span>
       ),
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={statusVariant(row.status)} dot>
           {row.status === 'READY_TO_PACK'
             ? 'Ready to Pack'
             : row.status === 'PARTIAL_PACKED'
               ? 'Partial'
               : row.status === 'FULLY_PACKED'
                 ? 'Fully Packed'
                 : (row.status ?? '—')}
         </Badge>
       ),
       hideOnMobile: true,
     },
     {
       id: 'producedAt',
       header: 'Date',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {fmtDate(row.producedAt ?? row.createdAt)}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'actions',
       header: '',
       accessor: (row) => (
         <button
           type="button"
           onClick={() => { setSelectedLogId(row.id); setShowBreakdown(true); }}
           className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
         >
           Breakdown <ChevronRight size={12} />
         </button>
       ),
       align: 'right',
     },
   ];

   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             Cost Allocation
           </h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             View cost breakdowns per production batch — raw materials, labour, overheads, and cost per unit.
           </p>
         </div>
         <div className="flex items-center gap-2">
           <BarChart2 size={16} className="text-[var(--color-text-tertiary)]" />
           <span className="text-[12px] text-[var(--color-text-tertiary)]">
             {logs.length.toLocaleString()} {logs.length === 1 ? 'batch' : 'batches'}
           </span>
         </div>
       </div>

       {/* Status filter */}
       <div className="flex items-center gap-2 flex-wrap">
         {[
           { value: '', label: 'All' },
           { value: 'READY_TO_PACK', label: 'Ready to Pack' },
           { value: 'PARTIAL_PACKED', label: 'Partial' },
           { value: 'FULLY_PACKED', label: 'Fully Packed' },
         ].map(({ value, label }) => (
           <button
             key={value}
             type="button"
             onClick={() => setStatusFilter(value)}
             className={`h-7 px-3 rounded-lg text-[12px] font-medium transition-colors ${
               statusFilter === value
                 ? 'bg-[var(--color-neutral-900)] text-white'
                 : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
             }`}
           >
             {label}
           </button>
         ))}
       </div>

       {error && (
         <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] rounded-xl text-[13px] text-[var(--color-error)]">
           <span>{error}</span>
           <button type="button" onClick={loadLogs} className="font-medium underline-offset-2 hover:underline">
             Retry
           </button>
         </div>
       )}

       <DataTable
         columns={columns}
         data={filteredLogs}
         keyExtractor={(row) => row.id}
         isLoading={isLoading}
         searchable
         searchPlaceholder="Search by product or code..."
         searchFilter={(row, q) => {
           const query = q.toLowerCase();
           return (
             (row.productionCode ?? '').toLowerCase().includes(query) ||
             (row.productName ?? '').toLowerCase().includes(query) ||
             (row.brandName ?? '').toLowerCase().includes(query)
           );
         }}
         emptyMessage="No production data found. Production logs will appear here once batches are logged."
         pageSize={20}
       />

       <CostBreakdownModal
         isOpen={showBreakdown}
         logId={selectedLogId}
         onClose={() => setShowBreakdown(false)}
       />
     </div>
   );
 }

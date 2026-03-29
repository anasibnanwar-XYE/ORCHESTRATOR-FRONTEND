 /**
  * AgedDebtorsPage
  *
  * Dealer rows bucketed by 0-30 / 31-60 / 61-90 / 90+ days.
  * Shows total row at bottom. PDF and CSV export.
  *
  * API: GET /api/v1/reports/aged-debtors
  */

 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw } from 'lucide-react';
 import { clsx } from 'clsx';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { ExportButton } from '@/components/ui/ExportButton';
 import { reportsApi, type AgedDebtorDto } from '@/lib/reportsApi';
 import { useToast } from '@/components/ui/Toast';

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 0,
   }).format(amount);
 }

 const COLUMNS: Column<AgedDebtorDto>[] = [
   {
     id: 'dealer',
     header: 'Dealer',
     accessor: (row) => (
       <div>
         <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{row.dealerName}</p>
         <p className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums">{row.dealerCode}</p>
       </div>
     ),
     sortable: true,
     sortAccessor: (row) => row.dealerName,
   },
   {
     id: 'current',
     header: 'Current',
     accessor: (row) => (
       <span className={clsx('tabular-nums text-[13px]', (row.current ?? 0) > 0 ? 'text-[var(--color-success-icon)]' : 'text-[var(--color-text-tertiary)]')}>
         {formatINR(row.current ?? 0)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.current ?? 0,
     align: 'right',
     hideOnMobile: true,
   },
   {
     id: '1to30',
     header: '1–30 Days',
     accessor: (row) => (
       <span className={clsx('tabular-nums text-[13px]', (row.oneToThirtyDays ?? 0) > 0 ? 'text-[var(--color-warning-icon)]' : 'text-[var(--color-text-tertiary)]')}>
         {formatINR(row.oneToThirtyDays ?? 0)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.oneToThirtyDays ?? 0,
     align: 'right',
     hideOnMobile: true,
   },
   {
     id: '31to60',
     header: '31–60 Days',
     accessor: (row) => (
       <span className={clsx('tabular-nums text-[13px]', (row.thirtyOneToSixtyDays ?? 0) > 0 ? 'text-[var(--color-warning-icon)]' : 'text-[var(--color-text-tertiary)]')}>
         {formatINR(row.thirtyOneToSixtyDays ?? 0)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.thirtyOneToSixtyDays ?? 0,
     align: 'right',
     hideOnMobile: true,
   },
   {
     id: '61to90',
     header: '61–90 Days',
     accessor: (row) => (
       <span className={clsx('tabular-nums text-[13px]', (row.sixtyOneToNinetyDays ?? 0) > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]')}>
         {formatINR(row.sixtyOneToNinetyDays ?? 0)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.sixtyOneToNinetyDays ?? 0,
     align: 'right',
     hideOnMobile: true,
   },
   {
     id: '90plus',
     header: '90+ Days',
     accessor: (row) => (
       <span className={clsx('tabular-nums text-[13px] font-medium', (row.ninetyPlusDays ?? 0) > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]')}>
         {formatINR(row.ninetyPlusDays ?? 0)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.ninetyPlusDays ?? 0,
     align: 'right',
   },
   {
     id: 'total',
     header: 'Total Outstanding',
     accessor: (row) => (
       <span className={clsx('tabular-nums text-[13px] font-semibold', (row.totalOutstanding ?? 0) > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]')}>
         {formatINR(row.totalOutstanding ?? 0)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.totalOutstanding ?? 0,
     align: 'right',
   },
 ];

 export function AgedDebtorsPage() {
   const toast = useToast();
   const [data, setData] = useState<AgedDebtorDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await reportsApi.getAgedDebtors();
       setData(result);
     } catch {
       setError('Failed to load aged debtors report. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const handleExport = async (format: 'PDF' | 'CSV') => {
     try {
       await reportsApi.getAgedDebtors({ exportFormat: format });
       toast.success('Export ready', `Aged debtors ${format} export has been prepared.`);
     } catch {
       toast.error('Export failed', 'Could not export the report. Please try again.');
     }
   };

   // Compute totals
   const totals = data.reduce(
     (acc, row) => ({
       current: acc.current + (row.current ?? 0),
       oneToThirty: acc.oneToThirty + (row.oneToThirtyDays ?? 0),
       thirtyOneToSixty: acc.thirtyOneToSixty + (row.thirtyOneToSixtyDays ?? 0),
       sixtyOneToNinety: acc.sixtyOneToNinety + (row.sixtyOneToNinetyDays ?? 0),
       ninetyPlus: acc.ninetyPlus + (row.ninetyPlusDays ?? 0),
       total: acc.total + (row.totalOutstanding ?? 0),
     }),
     { current: 0, oneToThirty: 0, thirtyOneToSixty: 0, sixtyOneToNinety: 0, ninetyPlus: 0, total: 0 }
   );

   return (
     <div className="space-y-5">
       <PageHeader
         title="Aged Debtors"
         description="Outstanding balances by age bucket per dealer"
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
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4 space-y-2">
           {Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="flex gap-3 py-2">
               <Skeleton className="h-4 flex-1" />
               <Skeleton className="h-4 w-20" />
               <Skeleton className="h-4 w-20" />
               <Skeleton className="h-4 w-20" />
             </div>
           ))}
         </div>
       )}

       {!isLoading && !error && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <DataTable
             columns={COLUMNS}
             data={data}
             keyExtractor={(row) => row.dealerId}
             searchable
             searchPlaceholder="Search dealers..."
             searchFilter={(row, q) =>
               row.dealerName?.toLowerCase().includes(q) || row.dealerCode?.toLowerCase().includes(q)
             }
             emptyMessage="No aged debtors data. All accounts are current."
           />

           {/* Totals footer */}
           {data.length > 0 && (
             <div className="border-t-2 border-[var(--color-border-default)] px-4 py-3 bg-[var(--color-surface-secondary)]">
               <div className="hidden sm:flex items-center justify-end gap-8 text-[12px]">
                 {[
                   { label: 'Current', value: totals.current },
                   { label: '1–30', value: totals.oneToThirty },
                   { label: '31–60', value: totals.thirtyOneToSixty },
                   { label: '61–90', value: totals.sixtyOneToNinety },
                   { label: '90+', value: totals.ninetyPlus },
                   { label: 'Total', value: totals.total, bold: true },
                 ].map(({ label, value, bold }) => (
                   <div key={label} className="text-right">
                     <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">{label}</p>
                     <p className={clsx('tabular-nums', bold ? 'font-bold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]')}>
                       {formatINR(value)}
                     </p>
                   </div>
                 ))}
               </div>
               <div className="sm:hidden flex items-center justify-between">
                 <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Total Outstanding</span>
                 <span className="tabular-nums font-bold text-[var(--color-text-primary)]">{formatINR(totals.total)}</span>
               </div>
             </div>
           )}
         </div>
       )}
     </div>
   );
 }

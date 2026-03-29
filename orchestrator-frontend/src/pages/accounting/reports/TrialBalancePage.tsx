 /**
  * TrialBalancePage
  *
  * Sortable grid of trial balance rows with footer showing
  * total debits = total credits. Balanced badge shown.
  * PDF and CSV export via ExportButton.
  *
  * API: GET /api/v1/reports/trial-balance
  */

 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw, CheckCircle2, XCircle } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { ExportButton } from '@/components/ui/ExportButton';
 import { reportsApi, type TrialBalanceDto, type TrialBalanceRow } from '@/lib/reportsApi';
 import { useToast } from '@/components/ui/Toast';
import { exportTrialBalanceCsv, printToPdf } from '@/utils/reportExport';

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 const COLUMNS: Column<TrialBalanceRow>[] = [
   {
     id: 'code',
     header: 'Code',
     accessor: (row) => <span className="tabular-nums font-medium text-[var(--color-text-secondary)]">{row.code}</span>,
     sortable: true,
     sortAccessor: (row) => row.code,
     width: '100px',
   },
   {
     id: 'name',
     header: 'Account',
     accessor: (row) => <span className="text-[var(--color-text-primary)]">{row.name}</span>,
     sortable: true,
     sortAccessor: (row) => row.name,
   },
   {
     id: 'type',
     header: 'Type',
     accessor: (row) => (
       <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
         {row.type}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.type,
     width: '120px',
     hideOnMobile: true,
   },
   {
     id: 'debit',
     header: 'Debit',
     accessor: (row) => (
       <span className={clsx('tabular-nums', row.debit > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]')}>
         {row.debit > 0 ? formatINR(row.debit) : '—'}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.debit,
     align: 'right',
     width: '160px',
   },
   {
     id: 'credit',
     header: 'Credit',
     accessor: (row) => (
       <span className={clsx('tabular-nums', row.credit > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]')}>
         {row.credit > 0 ? formatINR(row.credit) : '—'}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.credit,
     align: 'right',
     width: '160px',
   },
 ];

 export function TrialBalancePage() {
   const toast = useToast();
   const [data, setData] = useState<TrialBalanceDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await reportsApi.getTrialBalance();
       setData(result);
     } catch {
       setError('Failed to load trial balance. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const handleExport = async (format: 'PDF' | 'CSV') => {
     try {
      if (format === 'CSV') {
        if (!data?.rows?.length) {
          toast.error('No data to export', 'Load the trial balance first.');
          return;
        }
        exportTrialBalanceCsv(data.rows, 'trial-balance.csv');
        toast.success('CSV downloaded', 'Trial balance exported as CSV.');
      } else {
        printToPdf();
      }
     } catch {
       toast.error('Export failed', 'Could not export the trial balance. Please try again.');
     }
   };

   const asOfLabel = data?.metadata?.asOfDate
     ? `As of ${format(new Date(data.metadata.asOfDate), 'dd MMM yyyy')}`
     : data?.metadata?.startDate && data?.metadata?.endDate
       ? `${format(new Date(data.metadata.startDate), 'dd MMM yyyy')} – ${format(new Date(data.metadata.endDate), 'dd MMM yyyy')}`
       : 'Current period';

   return (
     <div className="space-y-5">
       <PageHeader
         title="Trial Balance"
         description={asOfLabel}
         actions={
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="sm" leftIcon={<RefreshCcw size={13} />} onClick={load}>
               Refresh
             </Button>
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
           {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="flex gap-3 py-2">
               <Skeleton className="h-4 w-16" />
               <Skeleton className="h-4 flex-1" />
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-4 w-24" />
             </div>
           ))}
         </div>
       )}

       {!isLoading && data && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           {/* Balanced indicator */}
           <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
             <div className="flex items-center gap-2">
               {data.balanced ? (
                 <>
                   <CheckCircle2 size={15} className="text-[var(--color-success-icon)]" />
                   <span className="text-[13px] text-[var(--color-text-secondary)]">Balanced</span>
                 </>
               ) : (
                 <>
                   <XCircle size={15} className="text-[var(--color-error)]" />
                   <span className="text-[13px] text-[var(--color-error)]">Not balanced — discrepancy detected</span>
                 </>
               )}
             </div>
             {data.metadata?.source && (
               <Badge variant="default">{data.metadata.source}</Badge>
             )}
           </div>

           <DataTable
             columns={COLUMNS}
             data={data.rows ?? []}
             keyExtractor={(row) => row.accountId}
             searchable
             searchPlaceholder="Search accounts..."
             searchFilter={(row, q) =>
               row.code?.toLowerCase().includes(q) || row.name?.toLowerCase().includes(q)
             }
             emptyMessage="No trial balance data available."
           />

           {/* Footer totals */}
           <div className="border-t border-[var(--color-border-default)] px-4 py-3 bg-[var(--color-surface-secondary)]">
             <div className="flex justify-end gap-8 text-[13px]">
               <div className="text-right">
                 <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">Total Debits</p>
                 <p className="tabular-nums font-semibold text-[var(--color-text-primary)]">{formatINR(data.totalDebit ?? 0)}</p>
               </div>
               <div className="text-right">
                 <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">Total Credits</p>
                 <p className="tabular-nums font-semibold text-[var(--color-text-primary)]">{formatINR(data.totalCredit ?? 0)}</p>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

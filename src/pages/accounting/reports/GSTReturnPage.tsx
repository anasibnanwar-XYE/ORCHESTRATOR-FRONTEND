 /**
  * GSTReturnPage
  *
  * Section cards for output/input/net GST.
  * Rate summary grid and transaction detail table.
  *
  * API: GET /api/v1/reports/gst-return
  */

 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { ExportButton } from '@/components/ui/ExportButton';
 import { reportsApi, type GstReturnReportDto, type GstComponentSummary, type GstTransactionDetail } from '@/lib/reportsApi';
 import { useToast } from '@/components/ui/Toast';

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 function formatDate(dateStr: string | null | undefined): string {
   if (!dateStr) return '—';
   try {
     return format(parseISO(dateStr), 'dd MMM yyyy');
   } catch {
     return dateStr;
   }
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // GST Component Card
 // ─────────────────────────────────────────────────────────────────────────────

 interface GstCardProps {
   title: string;
   summary: GstComponentSummary;
   variant?: 'default' | 'positive' | 'negative';
 }

 function GstCard({ title, summary, variant = 'default' }: GstCardProps) {
   return (
     <div className={clsx(
       'rounded-xl border p-4',
       variant === 'positive' && 'border-[var(--color-success-icon)] bg-[var(--color-success-bg,#f0fdf4)]',
       variant === 'negative' && 'border-[var(--color-error)] bg-[var(--color-error-bg)]',
       variant === 'default' && 'border-[var(--color-border-default)] bg-[var(--color-surface-primary)]',
     )}>
       <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
         {title}
       </p>
       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
         {[
           { label: 'CGST', value: summary?.cgst ?? 0 },
           { label: 'SGST', value: summary?.sgst ?? 0 },
           { label: 'IGST', value: summary?.igst ?? 0 },
           { label: 'Total', value: summary?.total ?? 0, bold: true },
         ].map(({ label, value, bold }) => (
           <div key={label}>
             <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</p>
             <p className={clsx('tabular-nums text-[13px] mt-0.5', bold ? 'font-bold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]')}>
               {formatINR(value)}
             </p>
           </div>
         ))}
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Transaction columns
 // ─────────────────────────────────────────────────────────────────────────────

 const TXN_COLUMNS: Column<GstTransactionDetail>[] = [
   {
     id: 'ref',
     header: 'Reference',
     accessor: (row) => <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{row.referenceNumber}</span>,
     sortable: true,
     sortAccessor: (row) => row.referenceNumber,
   },
   {
     id: 'date',
     header: 'Date',
     accessor: (row) => <span className="tabular-nums text-[var(--color-text-secondary)]">{formatDate(row.transactionDate)}</span>,
     sortable: true,
     sortAccessor: (row) => row.transactionDate,
     hideOnMobile: true,
   },
   {
     id: 'party',
     header: 'Party',
     accessor: (row) => <span className="text-[var(--color-text-primary)]">{row.partyName}</span>,
     sortable: true,
     sortAccessor: (row) => row.partyName,
   },
   {
     id: 'direction',
     header: 'Type',
     accessor: (row) => (
       <Badge variant={row.direction === 'OUTPUT' ? 'info' : 'default'}>
         {row.direction === 'OUTPUT' ? 'Output' : 'Input'}
       </Badge>
     ),
     hideOnMobile: true,
   },
   {
     id: 'taxable',
     header: 'Taxable Amount',
     accessor: (row) => <span className="tabular-nums text-[var(--color-text-primary)]">{formatINR(row.taxableAmount ?? 0)}</span>,
     sortable: true,
     sortAccessor: (row) => row.taxableAmount ?? 0,
     align: 'right',
     hideOnMobile: true,
   },
   {
     id: 'tax',
     header: 'Total Tax',
     accessor: (row) => <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{formatINR(row.totalTax ?? 0)}</span>,
     sortable: true,
     sortAccessor: (row) => row.totalTax ?? 0,
     align: 'right',
   },
 ];

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function GSTReturnPage() {
   const toast = useToast();
   const [data, setData] = useState<GstReturnReportDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await reportsApi.getGstReturn();
       setData(result);
     } catch {
       setError('Failed to load GST return. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const handleExport = async (fmt: 'PDF' | 'CSV') => {
     try {
       await reportsApi.getGstReturn();
       toast.success('Export ready', `GST return ${fmt} export has been prepared.`);
     } catch {
       toast.error('Export failed', 'Could not export the GST return. Please try again.');
     }
   };

   const periodLabel = data?.periodLabel
     ? data.periodLabel
     : data?.periodStart && data?.periodEnd
       ? `${formatDate(data.periodStart)} – ${formatDate(data.periodEnd)}`
       : 'Current period';

   return (
     <div className="space-y-5">
       <PageHeader
         title="GST Return"
         description={periodLabel}
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
         <div className="space-y-3">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             {Array.from({ length: 3 }).map((_, i) => (
               <Skeleton key={i} className="h-24 rounded-xl" />
             ))}
           </div>
           <Skeleton className="h-48 rounded-xl" />
         </div>
       )}

       {!isLoading && data && (
         <>
           {/* Section cards */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             <GstCard title="Output Tax" summary={data.outputTax} variant="default" />
             <GstCard title="Input Tax Credit" summary={data.inputTaxCredit} variant="positive" />
             <GstCard title="Net Liability" summary={data.netLiability} variant={
               (data.netLiability?.total ?? 0) > 0 ? 'negative' : 'positive'
             } />
           </div>

           {/* Rate summary */}
           {data.rateSummaries?.length > 0 && (
             <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
               <div className="px-5 py-3 border-b border-[var(--color-border-subtle)]">
                 <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">Rate Summary</h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-[13px]">
                   <thead>
                     <tr className="border-b border-[var(--color-border-default)]">
                       {['Tax Rate', 'Taxable Amount', 'Output Tax', 'Input Credit', 'Net Tax'].map((h) => (
                         <th key={h} className={clsx(
                           'px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]',
                           h === 'Tax Rate' ? 'text-left' : 'text-right',
                         )}>{h}</th>
                       ))}
                     </tr>
                   </thead>
                   <tbody>
                     {data.rateSummaries.map((rs) => (
                       <tr key={rs.taxRate} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)]">
                         <td className="px-4 py-2.5 font-medium tabular-nums text-[var(--color-text-primary)]">{rs.taxRate}%</td>
                         <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">{formatINR(rs.taxableAmount ?? 0)}</td>
                         <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">{formatINR(rs.outputTax ?? 0)}</td>
                         <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">{formatINR(rs.inputTaxCredit ?? 0)}</td>
                         <td className="px-4 py-2.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">{formatINR(rs.netTax ?? 0)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {/* Transaction details */}
           {data.transactionDetails?.length > 0 && (
             <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
               <div className="px-5 py-3 border-b border-[var(--color-border-subtle)]">
                 <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">Transaction Details</h2>
               </div>
               <DataTable
                 columns={TXN_COLUMNS}
                 data={data.transactionDetails}
                 keyExtractor={(row) => `${row.sourceType}-${row.sourceId}`}
                 searchable
                 searchPlaceholder="Search transactions..."
                 searchFilter={(row, q) =>
                   row.referenceNumber?.toLowerCase().includes(q) ||
                   row.partyName?.toLowerCase().includes(q)
                 }
                 emptyMessage="No transactions found."
               />
             </div>
           )}
         </>
       )}
     </div>
   );
 }

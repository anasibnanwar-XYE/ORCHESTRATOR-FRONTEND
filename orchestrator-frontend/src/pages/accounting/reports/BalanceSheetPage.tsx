 /**
  * BalanceSheetPage
  *
  * Hierarchical tree: Assets, Liabilities, Equity
  * Footer verifies Assets = Liabilities + Equity equation.
  * PDF and CSV export via ExportButton.
  *
  * API: GET /api/v1/reports/balance-sheet
  */

 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw, CheckCircle2, XCircle, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { ExportButton } from '@/components/ui/ExportButton';
 import { reportsApi, type BalanceSheetDto, type SectionLine } from '@/lib/reportsApi';
 import { useToast } from '@/components/ui/Toast';

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 interface SectionGroupProps {
   title: string;
   lines: SectionLine[];
   total: number;
   totalLabel: string;
 }

 function SectionGroup({ title, lines, total, totalLabel }: SectionGroupProps) {
   const [open, setOpen] = useState(true);
   return (
     <div>
       <button
         type="button"
         onClick={() => setOpen((o) => !o)}
         className="w-full flex items-center justify-between px-5 py-2.5 text-left bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-default)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
       >
         <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
           {title}
         </span>
         {open ? <ChevronDown size={14} className="text-[var(--color-text-tertiary)]" /> : <ChevronRightIcon size={14} className="text-[var(--color-text-tertiary)]" />}
       </button>
       {open && (
         <>
           {lines.map((line) => (
             <div
               key={line.accountId}
               className="flex items-center justify-between px-5 pl-10 py-2.5 border-b border-[var(--color-border-subtle)]"
             >
               <div>
                 <span className="text-[13px] text-[var(--color-text-primary)]">{line.accountName}</span>
                 <span className="ml-2 text-[11px] text-[var(--color-text-tertiary)] tabular-nums">{line.accountCode}</span>
               </div>
               <span className="tabular-nums text-[13px] font-medium text-[var(--color-text-primary)]">
                 {formatINR(line.amount)}
               </span>
             </div>
           ))}
           <div className="flex items-center justify-between px-5 py-2.5 border-b border-[var(--color-border-default)]">
             <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{totalLabel}</span>
             <span className="tabular-nums text-[13px] font-semibold text-[var(--color-text-primary)]">{formatINR(total)}</span>
           </div>
         </>
       )}
     </div>
   );
 }

 export function BalanceSheetPage() {
   const toast = useToast();
   const [data, setData] = useState<BalanceSheetDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await reportsApi.getBalanceSheet();
       setData(result);
     } catch {
       setError('Failed to load balance sheet. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const handleExport = async (format: 'PDF' | 'CSV') => {
     try {
       await reportsApi.getBalanceSheet({ exportFormat: format });
       toast.success('Export ready', `Balance sheet ${format} export has been prepared.`);
     } catch {
       toast.error('Export failed', 'Could not export the report. Please try again.');
     }
   };

   const equationHolds = data ? Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)) < 0.01 : false;

   return (
     <div className="space-y-5">
       <PageHeader
         title="Balance Sheet"
         description="Assets = Liabilities + Equity"
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
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-5 space-y-3">
           {Array.from({ length: 10 }).map((_, i) => (
             <div key={i} className="flex justify-between py-1.5">
               <Skeleton className="h-4 w-48" />
               <Skeleton className="h-4 w-24" />
             </div>
           ))}
         </div>
       )}

       {!isLoading && data && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           {/* Header status */}
           <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-subtle)]">
             <div className="flex items-center gap-2">
               {equationHolds ? (
                 <>
                   <CheckCircle2 size={15} className="text-[var(--color-success-icon)]" />
                   <span className="text-[13px] text-[var(--color-text-secondary)]">Equation balanced</span>
                 </>
               ) : (
                 <>
                   <XCircle size={15} className="text-[var(--color-error)]" />
                   <span className="text-[13px] text-[var(--color-error)]">Equation not balanced</span>
                 </>
               )}
             </div>
             {data.metadata?.source && (
               <Badge variant="default">{data.metadata.source}</Badge>
             )}
           </div>

           {/* Assets */}
           <SectionGroup
             title="Current Assets"
             lines={data.currentAssets ?? []}
             total={data.currentAssets?.reduce((s, l) => s + l.amount, 0) ?? 0}
             totalLabel="Total Current Assets"
           />
           <SectionGroup
             title="Fixed Assets"
             lines={data.fixedAssets ?? []}
             total={data.fixedAssets?.reduce((s, l) => s + l.amount, 0) ?? 0}
             totalLabel="Total Fixed Assets"
           />
           <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
             <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Total Assets</span>
             <span className="tabular-nums text-[14px] font-bold text-[var(--color-text-primary)]">{formatINR(data.totalAssets ?? 0)}</span>
           </div>

           {/* Liabilities */}
           <SectionGroup
             title="Current Liabilities"
             lines={data.currentLiabilities ?? []}
             total={data.currentLiabilities?.reduce((s, l) => s + l.amount, 0) ?? 0}
             totalLabel="Total Current Liabilities"
           />
           <SectionGroup
             title="Long-Term Liabilities"
             lines={data.longTermLiabilities ?? []}
             total={data.longTermLiabilities?.reduce((s, l) => s + l.amount, 0) ?? 0}
             totalLabel="Total Long-Term Liabilities"
           />
           <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
             <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Total Liabilities</span>
             <span className="tabular-nums text-[14px] font-bold text-[var(--color-text-primary)]">{formatINR(data.totalLiabilities ?? 0)}</span>
           </div>

           {/* Equity */}
           <SectionGroup
             title="Equity"
             lines={data.equityLines ?? []}
             total={data.totalEquity ?? 0}
             totalLabel="Total Equity"
           />

           {/* Footer equation */}
           <div className="border-t-2 border-[var(--color-border-default)] px-5 py-4 bg-[var(--color-surface-secondary)]">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
               <div className="flex items-center gap-2">
                 <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                   Liabilities + Equity
                 </span>
                 <span className="text-[13px] text-[var(--color-text-tertiary)]">=</span>
                 <span className={clsx(
                   'tabular-nums text-[14px] font-bold',
                   equationHolds ? 'text-[var(--color-success-icon)]' : 'text-[var(--color-error)]',
                 )}>
                   {formatINR((data.totalLiabilities ?? 0) + (data.totalEquity ?? 0))}
                 </span>
               </div>
               <div>
                 <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Total Assets </span>
                 <span className="tabular-nums text-[14px] font-bold text-[var(--color-text-primary)]">{formatINR(data.totalAssets ?? 0)}</span>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

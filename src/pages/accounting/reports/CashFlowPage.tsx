 /**
  * CashFlowPage
  *
  * Shows Operating, Investing, and Financing sections with net change.
  * Sections reconcile to confirm net change matches sum.
  *
  * API: GET /api/v1/reports/cash-flow
  */

 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { ExportButton } from '@/components/ui/ExportButton';
 import { reportsApi, type CashFlowDto } from '@/lib/reportsApi';
 import { useToast } from '@/components/ui/Toast';

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 interface CashFlowSectionProps {
   title: string;
   amount: number;
   description: string;
 }

 function CashFlowSection({ title, amount, description }: CashFlowSectionProps) {
   const isPositive = amount > 0;
   const isZero = amount === 0;

   return (
     <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className={clsx(
             'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
             isZero ? 'bg-[var(--color-surface-tertiary)]' :
             isPositive ? 'bg-[var(--color-success-bg,#f0fdf4)]' : 'bg-[var(--color-error-bg)]',
           )}>
             {isZero ? (
               <Minus size={16} className="text-[var(--color-text-tertiary)]" />
             ) : isPositive ? (
               <TrendingUp size={16} className="text-[var(--color-success-icon)]" />
             ) : (
               <TrendingDown size={16} className="text-[var(--color-error)]" />
             )}
           </div>
           <div>
             <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{title}</p>
             <p className="text-[11px] text-[var(--color-text-tertiary)]">{description}</p>
           </div>
         </div>
         <span className={clsx(
           'tabular-nums text-[15px] font-bold',
           isZero ? 'text-[var(--color-text-secondary)]' :
           isPositive ? 'text-[var(--color-success-icon)]' : 'text-[var(--color-error)]',
         )}>
           {formatINR(amount)}
         </span>
       </div>
     </div>
   );
 }

 export function CashFlowPage() {
   const toast = useToast();
   const [data, setData] = useState<CashFlowDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await reportsApi.getCashFlow();
       setData(result);
     } catch {
       setError('Failed to load cash flow statement. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const handleExport = async (fmt: 'PDF' | 'CSV') => {
     toast.info('Export initiated', `Cash flow ${fmt} export has been requested.`);
   };

   const computedNetChange = data
     ? (data.operating ?? 0) + (data.investing ?? 0) + (data.financing ?? 0)
     : 0;
   const reconciled = data
     ? Math.abs(computedNetChange - (data.netChange ?? 0)) < 0.01
     : false;

   return (
     <div className="space-y-5">
       <PageHeader
         title="Cash Flow Statement"
         description="Operating, investing, and financing activities"
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
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-5 space-y-4">
           {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="flex justify-between items-center py-3">
               <div className="flex gap-3 items-center">
                 <Skeleton className="h-9 w-9 rounded-lg" />
                 <div className="space-y-1.5">
                   <Skeleton className="h-4 w-32" />
                   <Skeleton className="h-3 w-48" />
                 </div>
               </div>
               <Skeleton className="h-5 w-28" />
             </div>
           ))}
         </div>
       )}

       {!isLoading && data && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           {data.metadata?.source && (
             <div className="flex items-center justify-between px-5 py-2.5 border-b border-[var(--color-border-subtle)]">
               <span className="text-[12px] text-[var(--color-text-tertiary)]">Data source</span>
               <Badge variant="default">{data.metadata.source}</Badge>
             </div>
           )}

           <CashFlowSection
             title="Operating Activities"
             amount={data.operating ?? 0}
             description="Cash generated from or used in core business operations"
           />
           <CashFlowSection
             title="Investing Activities"
             amount={data.investing ?? 0}
             description="Cash flows from purchase/sale of long-term assets"
           />
           <CashFlowSection
             title="Financing Activities"
             amount={data.financing ?? 0}
             description="Cash flows from loans, equity, and dividends"
           />

           {/* Net Change */}
           <div className="px-5 py-4 border-t-2 border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-[14px] font-bold text-[var(--color-text-primary)]">Net Change in Cash</p>
                 <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                   {reconciled ? 'Operating + Investing + Financing reconciles' : 'Reconciliation mismatch detected'}
                 </p>
               </div>
               <span className={clsx(
                 'tabular-nums text-[20px] font-bold',
                 (data.netChange ?? 0) >= 0 ? 'text-[var(--color-success-icon)]' : 'text-[var(--color-error)]',
               )}>
                 {formatINR(data.netChange ?? 0)}
               </span>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

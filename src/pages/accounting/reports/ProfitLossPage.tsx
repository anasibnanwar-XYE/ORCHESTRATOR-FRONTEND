 /**
  * ProfitLossPage (P&L)
  *
  * Hierarchical tree with expandable groups and subtotals.
  * Shows Revenue, COGS, Gross Profit, Operating Expenses (by category),
  * and Net Profit/Loss at the bottom.
  * PDF and CSV export via ExportButton.
  *
  * API: GET /api/v1/reports/profit-loss
  */

 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { ExportButton } from '@/components/ui/ExportButton';
 import { reportsApi, type ProfitLossDto } from '@/lib/reportsApi';
 import { useToast } from '@/components/ui/Toast';

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Section components
 // ─────────────────────────────────────────────────────────────────────────────

 interface ReportRowProps {
   label: string;
   value: number;
   indent?: boolean;
   bold?: boolean;
   isNegative?: boolean;
 }

 function ReportRow({ label, value, indent = false, bold = false, isNegative }: ReportRowProps) {
   const negative = isNegative ?? value < 0;
   return (
     <div className={clsx(
       'flex items-center justify-between py-2.5 px-5',
       indent && 'pl-10',
       'border-b border-[var(--color-border-subtle)]',
     )}>
       <span className={clsx(
         'text-[13px]',
         bold ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]',
       )}>
         {label}
       </span>
       <span className={clsx(
         'tabular-nums text-[13px]',
         bold ? 'font-semibold' : 'font-medium',
         negative ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]',
       )}>
         {formatINR(value)}
       </span>
     </div>
   );
 }

 interface SectionGroupProps {
   title: string;
   children: React.ReactNode;
 }

 function SectionGroup({ title, children }: SectionGroupProps) {
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
       {open && children}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function ProfitLossPage() {
   const toast = useToast();
   const [data, setData] = useState<ProfitLossDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await reportsApi.getProfitLoss();
       setData(result);
     } catch {
       setError('Failed to load P&L report. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const handleExport = async (format: 'PDF' | 'CSV') => {
     try {
       await reportsApi.getProfitLoss({ exportFormat: format });
       toast.success('Export ready', `P&L ${format} export has been prepared.`);
     } catch {
       toast.error('Export failed', 'Could not export the report. Please try again.');
     }
   };

   return (
     <div className="space-y-5">
       <PageHeader
         title="Profit & Loss"
         description="Income statement for the current period"
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
           {data.metadata?.source && (
             <div className="flex items-center justify-between px-5 py-2.5 border-b border-[var(--color-border-subtle)]">
               <span className="text-[12px] text-[var(--color-text-tertiary)]">Data source</span>
               <Badge variant="default">{data.metadata.source}</Badge>
             </div>
           )}

           {/* Revenue */}
           <SectionGroup title="Revenue">
             <ReportRow label="Total Revenue" value={data.revenue} indent bold />
           </SectionGroup>

           {/* Cost of Goods Sold */}
           <SectionGroup title="Cost of Goods Sold">
             <ReportRow label="Cost of Goods Sold" value={data.costOfGoodsSold} indent isNegative={false} />
           </SectionGroup>

           {/* Gross Profit */}
           <ReportRow label="Gross Profit" value={data.grossProfit} bold isNegative={data.grossProfit < 0} />

           {/* Operating Expenses */}
           <SectionGroup title="Operating Expenses">
             {data.operatingExpenseCategories?.map((cat) => (
               <ReportRow key={cat.category} label={cat.category} value={cat.amount} indent />
             ))}
             <ReportRow label="Total Operating Expenses" value={data.operatingExpenses} indent bold />
           </SectionGroup>

           {/* Net Profit/Loss */}
           <div className="border-t-2 border-[var(--color-border-default)]">
             <div className="flex items-center justify-between px-5 py-4">
               <span className="text-[15px] font-bold text-[var(--color-text-primary)]">
                 {data.netIncome >= 0 ? 'Net Profit' : 'Net Loss'}
               </span>
               <span className={clsx(
                 'text-[20px] font-bold tabular-nums',
                 data.netIncome >= 0 ? 'text-[var(--color-success-icon)]' : 'text-[var(--color-error)]',
               )}>
                 {formatINR(data.netIncome)}
               </span>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

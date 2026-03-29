 /**
  * GSTReconciliationPage
  *
  * Shows GST component reconciliation for a given period.
  * Collected output tax, input tax credit, and net liability
  * are displayed so they can be compared against the GST Return.
  *
  * API: GET /api/v1/accounting/gst/reconciliation?period=YYYY-MM
  *
  * VAL-ACCT-011: Both GST return and GST reconciliation are surfaced
  * for the same period with a shared visible period context.
  */

 import { useEffect, useState, useCallback } from 'react';
 import { useNavigate, useSearchParams } from 'react-router-dom';
 import { AlertCircle, RefreshCcw, ArrowRight } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import {
   gstReconciliationApi,
   type GstReconciliationDto,
   type GstReconciliationComponentSummary,
 } from '@/lib/accountingApi';
 import { useToast } from '@/components/ui/Toast';

 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────

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

 interface ReconciliationCardProps {
   title: string;
   summary: GstReconciliationComponentSummary;
   variant?: 'default' | 'positive' | 'negative';
 }

 function ReconciliationCard({ title, summary, variant = 'default' }: ReconciliationCardProps) {
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
             <p className={clsx(
               'tabular-nums text-[13px] mt-0.5',
               bold ? 'font-bold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]',
             )}>
               {formatINR(value)}
             </p>
           </div>
         ))}
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Period selector
 // ─────────────────────────────────────────────────────────────────────────────

 interface PeriodSelectorProps {
   value: string;
   onChange: (v: string) => void;
 }

 function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
   return (
     <div className="flex items-center gap-2">
       <label
         htmlFor="gst-recon-period"
         className="text-[12px] text-[var(--color-text-tertiary)] shrink-0"
       >
         Period
       </label>
       <input
         id="gst-recon-period"
         type="month"
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className="h-8 px-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neutral-900)] focus:ring-offset-1"
       />
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 /** Returns the current YYYY-MM string */
 function currentYearMonth(): string {
   const now = new Date();
   return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
 }

 export function GSTReconciliationPage() {
   const toast = useToast();
   const navigate = useNavigate();
   const [searchParams, setSearchParams] = useSearchParams();

   const initialPeriod = searchParams.get('period') ?? currentYearMonth();
   const [period, setPeriod] = useState(initialPeriod);
   const [data, setData] = useState<GstReconciliationDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const load = useCallback(async (p: string) => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await gstReconciliationApi.getReconciliation({ period: p });
       setData(result);
     } catch {
       setError('Failed to load GST reconciliation. Please try again.');
       toast.error('Load failed', 'Could not load GST reconciliation data.');
     } finally {
       setIsLoading(false);
     }
   }, [toast]);

   useEffect(() => {
     void load(period);
   }, [load, period]);

   const handlePeriodChange = useCallback((p: string) => {
     setPeriod(p);
     setSearchParams({ period: p }, { replace: true });
   }, [setSearchParams]);

   const handleRefresh = useCallback(() => {
     void load(period);
   }, [load, period]);

   // Build the period label from data or from the selected period string
   const periodLabel = data?.periodStart && data?.periodEnd
     ? `${formatDate(data.periodStart)} – ${formatDate(data.periodEnd)}`
     : period
       ? period
       : 'Current period';

   return (
     <div className="space-y-5">
       <PageHeader
         title="GST Reconciliation"
         description={periodLabel}
         actions={
           <div className="flex items-center gap-2 flex-wrap">
             <PeriodSelector value={period} onChange={handlePeriodChange} />
             <Button variant="ghost" size="sm" leftIcon={<RefreshCcw size={13} />} onClick={handleRefresh}>
               Refresh
             </Button>
             <Button
               variant="secondary"
               size="sm"
               rightIcon={<ArrowRight size={13} />}
               onClick={() => navigate(`/accounting/reports/gst?period=${period}`)}
             >
               View GST Return
             </Button>
           </div>
         }
       />

       {/* Shared period context banner */}
       <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
         <span className="text-[12px] text-[var(--color-text-tertiary)]">Period:</span>
         <span className="text-[12px] font-semibold text-[var(--color-text-primary)] tabular-nums">{periodLabel}</span>
         <span className="text-[12px] text-[var(--color-text-tertiary)] ml-auto">
           Compare against <button
             type="button"
             onClick={() => navigate(`/accounting/reports/gst?period=${period}`)}
             className="text-[var(--color-primary-600)] hover:underline font-medium"
           >GST Return</button> for the same period.
         </span>
       </div>

       {error && !isLoading && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)]">
           <AlertCircle size={16} className="text-[var(--color-error)] shrink-0" />
           <p className="text-[13px] text-[var(--color-error)]">{error}</p>
           <Button variant="secondary" size="sm" onClick={handleRefresh} className="ml-auto shrink-0">
             Retry
           </Button>
         </div>
       )}

       {isLoading && (
         <div className="space-y-3">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             {Array.from({ length: 3 }).map((_, i) => (
               <Skeleton key={i} className="h-24 rounded-xl" />
             ))}
           </div>
           <Skeleton className="h-24 rounded-xl" />
         </div>
       )}

       {!isLoading && !error && !data && (
         <div className="py-12 text-center">
           <p className="text-[13px] text-[var(--color-text-secondary)]">
             No GST reconciliation data available for this period.
           </p>
         </div>
       )}

       {!isLoading && data && (
         <>
           {/* Component cards */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             <ReconciliationCard
               title="Collected (Output Tax)"
               summary={data.collected}
               variant="default"
             />
             <ReconciliationCard
               title="Input Tax Credit"
               summary={data.inputTaxCredit}
               variant="positive"
             />
             <ReconciliationCard
               title="Net Liability"
               summary={data.netLiability}
               variant={(data.netLiability?.total ?? 0) > 0 ? 'negative' : 'positive'}
             />
           </div>

           {/* Variance detail */}
           <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
             <div className="px-5 py-3 border-b border-[var(--color-border-subtle)]">
               <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                 Net Liability Detail
               </h2>
             </div>
             <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
               {[
                 { label: 'CGST Net', value: data.cgst },
                 { label: 'SGST Net', value: data.sgst },
                 { label: 'IGST Net', value: data.igst },
                 { label: 'Total Net', value: data.total, bold: true },
               ].map(({ label, value, bold }) => (
                 <div key={label} className="p-3 rounded-lg bg-[var(--color-surface-secondary)]">
                   <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                     {label}
                   </p>
                   <p className={clsx(
                     'mt-1 text-[14px] tabular-nums',
                     bold ? 'font-bold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]',
                     value < 0 && 'text-[var(--color-error)]',
                   )}>
                     {formatINR(value)}
                   </p>
                 </div>
               ))}
             </div>
           </div>
         </>
       )}
     </div>
   );
 }

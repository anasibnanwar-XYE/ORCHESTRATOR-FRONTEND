 /**
  * ReconciliationDashboardPage
  *
  * Bank reconciliation overview and inventory reconciliation status.
  * Shows balance warnings and reconciliation states.
  *
  * API: GET /api/v1/reports/reconciliation-dashboard?bankAccountId=...
  *      GET /api/v1/accounting/reconciliation/subledger
  */

 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { ExportButton } from '@/components/ui/ExportButton';
 import { apiRequest } from '@/lib/api';
 import { useToast } from '@/components/ui/Toast';
 import type { ApiResponse } from '@/types';

 // ─────────────────────────────────────────────────────────────────────────────
 // Types
 // ─────────────────────────────────────────────────────────────────────────────

 interface SubledgerReconciliationReport {
   arBalance?: number;
   apBalance?: number;
   arLedgerBalance?: number;
   apLedgerBalance?: number;
   arVariance?: number;
   apVariance?: number;
   balanced?: boolean;
   lastUpdated?: string;
 }

 interface DiscrepancyItem {
   id: number;
   type: string;
   status: string;
   description: string;
   amount: number;
   detectedAt: string;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Status card
 // ─────────────────────────────────────────────────────────────────────────────

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 interface StatusCardProps {
   title: string;
   balanced: boolean;
   balancedLabel: string;
   unbalancedLabel: string;
   rows: { label: string; value: number }[];
   varianceLabel?: string;
   variance?: number;
 }

 function StatusCard({ title, balanced, balancedLabel, unbalancedLabel, rows, varianceLabel, variance }: StatusCardProps) {
   return (
     <div className={clsx(
       'rounded-xl border p-5',
       balanced
         ? 'border-[var(--color-border-default)] bg-[var(--color-surface-primary)]'
         : 'border-[var(--color-error-border-subtle)] bg-[var(--color-error-bg)]',
     )}>
       <div className="flex items-center justify-between mb-4">
         <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">{title}</h3>
         <div className="flex items-center gap-1.5">
           {balanced ? (
             <CheckCircle2 size={15} className="text-[var(--color-success-icon)]" />
           ) : (
             <XCircle size={15} className="text-[var(--color-error)]" />
           )}
           <span className={clsx('text-[12px] font-medium', balanced ? 'text-[var(--color-success-icon)]' : 'text-[var(--color-error)]')}>
             {balanced ? balancedLabel : unbalancedLabel}
           </span>
         </div>
       </div>

       <div className="space-y-2">
         {rows.map(({ label, value }) => (
           <div key={label} className="flex items-center justify-between text-[13px]">
             <span className="text-[var(--color-text-secondary)]">{label}</span>
             <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{formatINR(value)}</span>
           </div>
         ))}
         {varianceLabel !== undefined && variance !== undefined && Math.abs(variance) > 0.01 && (
           <div className="flex items-center justify-between text-[13px] pt-2 border-t border-[var(--color-border-subtle)]">
             <span className="text-[var(--color-error)]">{varianceLabel}</span>
             <span className="tabular-nums font-semibold text-[var(--color-error)]">{formatINR(variance)}</span>
           </div>
         )}
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function ReconciliationDashboardPage() {
   const toast = useToast();
   const [subledger, setSubledger] = useState<SubledgerReconciliationReport | null>(null);
   const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [subledgerRes, discRes] = await Promise.allSettled([
         apiRequest.get<ApiResponse<SubledgerReconciliationReport>>('/accounting/reconciliation/subledger'),
         apiRequest.get<ApiResponse<{ items?: DiscrepancyItem[] }>>('/accounting/reconciliation/discrepancies?status=OPEN'),
       ]);

       if (subledgerRes.status === 'fulfilled') {
         setSubledger(subledgerRes.value.data?.data ?? null);
       }
       if (discRes.status === 'fulfilled') {
         setDiscrepancies(discRes.value.data?.data?.items ?? []);
       }
     } catch {
       setError('Failed to load reconciliation data. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const handleExport = async () => {
     toast.info('Export initiated', 'Reconciliation dashboard export has been requested.');
   };

   const arBalanced = subledger ? Math.abs(subledger.arVariance ?? 0) < 0.01 : true;
   const apBalanced = subledger ? Math.abs(subledger.apVariance ?? 0) < 0.01 : true;

   return (
     <div className="space-y-5">
       <PageHeader
         title="Reconciliation Dashboard"
         description="AR, AP, and bank reconciliation status"
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
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
         </div>
       )}

       {!isLoading && subledger && (
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <StatusCard
             title="Accounts Receivable"
             balanced={arBalanced}
             balancedLabel="AR reconciled"
             unbalancedLabel="AR discrepancy"
             rows={[
               { label: 'AR Balance (Subledger)', value: subledger.arBalance ?? 0 },
               { label: 'AR Balance (Ledger)', value: subledger.arLedgerBalance ?? 0 },
             ]}
             varianceLabel="Variance"
             variance={subledger.arVariance ?? 0}
           />
           <StatusCard
             title="Accounts Payable"
             balanced={apBalanced}
             balancedLabel="AP reconciled"
             unbalancedLabel="AP discrepancy"
             rows={[
               { label: 'AP Balance (Subledger)', value: subledger.apBalance ?? 0 },
               { label: 'AP Balance (Ledger)', value: subledger.apLedgerBalance ?? 0 },
             ]}
             varianceLabel="Variance"
             variance={subledger.apVariance ?? 0}
           />
         </div>
       )}

       {!isLoading && !subledger && !error && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-8 text-center">
           <p className="text-[13px] text-[var(--color-text-tertiary)]">No reconciliation data available.</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1">
             Run a subledger sync to generate reconciliation data.
           </p>
         </div>
       )}

       {/* Open Discrepancies */}
       {!isLoading && discrepancies.length > 0 && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--color-border-subtle)]">
             <AlertTriangle size={14} className="text-[var(--color-warning-icon)]" />
             <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
               Open Discrepancies ({discrepancies.length})
             </h2>
           </div>
           <div className="divide-y divide-[var(--color-border-subtle)]">
             {discrepancies.map((d) => (
               <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-3">
                 <div>
                   <p className="text-[13px] text-[var(--color-text-primary)]">{d.description}</p>
                   <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 uppercase tracking-wider">{d.type}</p>
                 </div>
                 <span className="tabular-nums font-medium text-[var(--color-text-primary)] shrink-0">
                   {formatINR(d.amount ?? 0)}
                 </span>
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 }

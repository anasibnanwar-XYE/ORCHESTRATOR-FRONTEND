 /**
  * AccountingDashboardPage
  *
  * Top-level dashboard for the Accounting portal.
  *
  * Sections:
  *  1. KPI stat cards — Revenue, Expenses, Net Profit, Outstanding Receivables
  *     Each card is clickable and navigates to the relevant section.
  *  2. Recent Journals widget — latest 5 journal entries as clickable rows
  *     Clicking a row navigates to /accounting/journals/:id
  *  3. Quick-action buttons — New Journal, Record Receipt, View Reports
  *
  * Data sources:
  *  - GET /api/v1/accounting/trial-balance/as-of  → KPI data (receivables, payables, revenue)
  *  - GET /api/v1/accounting/periods              → Current period status KPI
  *  - GET /api/v1/accounting/journals?size=5      → Recent Journals
  *  - GET /api/v1/reports/balance-warnings        → Reconciliation warnings
  *  - GET /api/v1/accounting/reconciliation/discrepancies → Active discrepancies
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { BookOpen, Receipt, BarChart3, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { EmptyState } from '@/components/ui/EmptyState';
 import { Badge } from '@/components/ui/Badge';
 import {
   accountingApi,
   reportsApi,
   bankReconciliationApi,
   type JournalListItem,
   type TrialBalanceSnapshot,
   type AccountingPeriodDto,
   type BalanceWarningDto,
   type ReconciliationDiscrepancyDto,
 } from '@/lib/accountingApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 0,
   }).format(amount);
 }
 
 function formatDate(dateStr: string): string {
   try {
     return format(parseISO(dateStr), 'dd MMM yyyy');
   } catch {
     return dateStr;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Journal Status Badge
 // ─────────────────────────────────────────────────────────────────────────────
 
 function JournalStatusBadge({ status }: { status: string }) {
  let variant: 'success' | 'warning' | 'danger' | 'default' = 'default';
  if (status === 'POSTED') variant = 'success';
  else if (status === 'VOID') variant = 'danger';
  else if (status === 'PENDING' || status === 'REVIEW') variant = 'warning';
 
  return (
    <Badge variant={variant}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // KPI Stat Card (clickable)
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface KpiCardProps {
   label: string;
   value: string;
   description?: string;
   onClick: () => void;
   isLoading?: boolean;
   isNegative?: boolean;
 }
 
 function KpiCard({ label, value, description, onClick, isLoading, isNegative }: KpiCardProps) {
   if (isLoading) {
     return (
       <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
         <Skeleton width="50%" className="mb-2" />
         <Skeleton height={28} width="70%" />
         {description && <Skeleton width="40%" className="mt-1.5" />}
       </div>
     );
   }
 
   return (
     <button
       type="button"
       onClick={onClick}
       className={clsx(
         'group text-left p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
         'transition-all duration-200 hover:border-[var(--color-border-strong)]',
         'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none',
         'focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)] focus-visible:ring-offset-1',
       )}
     >
       <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
         {label}
       </p>
       <p className={clsx(
         'text-2xl font-semibold mt-1.5 tabular-nums tracking-tight',
         isNegative ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]',
       )}>
         {value}
       </p>
       {description && (
         <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
           {description}
         </p>
       )}
       <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors">
         <span>View details</span>
         <ChevronRight size={12} />
       </div>
     </button>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Recent Journals Widget
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface RecentJournalsProps {
   journals: JournalListItem[];
   isLoading: boolean;
   hasError: boolean;
   onRowClick: (id: number) => void;
   onViewAll: () => void;
 }
 
 function RecentJournals({ journals, isLoading, hasError, onRowClick, onViewAll }: RecentJournalsProps) {
   return (
     <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
       <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
         <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
           Recent Journals
         </h2>
         <button
           type="button"
           onClick={onViewAll}
           className="text-[12px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors flex items-center gap-1"
         >
           View all
           <ChevronRight size={12} />
         </button>
       </div>
 
       {isLoading && (
         <div className="divide-y divide-[var(--color-border-subtle)]">
           {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="px-4 py-3 flex items-center gap-3">
               <Skeleton width="20%" />
               <Skeleton width="30%" />
               <Skeleton width="15%" className="ml-auto" />
             </div>
           ))}
         </div>
       )}
 
       {!isLoading && hasError && (
         <div className="px-4 py-8 text-center">
           <p className="text-[12px] text-[var(--color-text-tertiary)]">
             Couldn't load recent journals.
           </p>
         </div>
       )}
 
       {!isLoading && !hasError && journals.length === 0 && (
         <div className="px-4 py-8">
           <EmptyState
             title="No journal entries yet"
             description="Create your first journal entry to get started."
           />
         </div>
       )}
 
       {!isLoading && !hasError && journals.length > 0 && (
         <div className="divide-y divide-[var(--color-border-subtle)]">
           {journals.slice(0, 5).map((journal) => (
             <button
               key={journal.id}
               type="button"
               onClick={() => onRowClick(journal.id)}
               className={clsx(
                 'w-full px-4 py-3 flex items-center gap-3',
                 'text-left transition-colors hover:bg-[var(--color-surface-secondary)]',
                 'focus-visible:outline-none focus-visible:bg-[var(--color-surface-secondary)]',
               )}
             >
               <div className="min-w-0 flex-1">
                 <div className="flex items-center gap-2">
                   <span className="text-[13px] font-medium text-[var(--color-text-primary)] tabular-nums">
                     {journal.referenceNumber}
                   </span>
                   <JournalStatusBadge status={journal.status} />
                 </div>
                 <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 truncate">
                   {journal.memo || journal.journalType}
                 </p>
               </div>
               <div className="text-right shrink-0">
                 <p className="text-[12px] font-medium tabular-nums text-[var(--color-text-secondary)]">
                   {formatINR(journal.totalDebit)}
                 </p>
                 <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                   {formatDate(journal.entryDate)}
                 </p>
               </div>
               <ChevronRight size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
             </button>
           ))}
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Reconciliation Warnings Widget
 // ─────────────────────────────────────────────────────────────────────────────

 interface ReconciliationWarningsProps {
   balanceWarnings: BalanceWarningDto[];
   discrepancies: ReconciliationDiscrepancyDto[];
   isLoading: boolean;
   onViewAll: () => void;
 }

 function ReconciliationWarnings({
   balanceWarnings,
   discrepancies,
   isLoading,
   onViewAll,
 }: ReconciliationWarningsProps) {
   const hasWarnings = balanceWarnings.length > 0 || discrepancies.length > 0;
   const openDiscrepancies = discrepancies.filter((d) => d.status !== 'RESOLVED').length;

   return (
     <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
       <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
         <div className="flex items-center gap-2">
           <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
             Reconciliation Warnings
           </h2>
           {!isLoading && hasWarnings && (
             <Badge variant="warning">
               {balanceWarnings.length + openDiscrepancies}
             </Badge>
           )}
         </div>
         <button
           type="button"
           onClick={onViewAll}
           className="text-[12px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors flex items-center gap-1"
         >
           View reconciliation
           <ChevronRight size={12} />
         </button>
       </div>

       {isLoading && (
         <div className="p-4 space-y-2">
           {Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} height={32} />
           ))}
         </div>
       )}

       {!isLoading && !hasWarnings && (
         <div className="px-4 py-6 flex items-center gap-3">
           <div className="h-8 w-8 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0">
             <AlertTriangle size={15} className="text-green-600" />
           </div>
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
               All clear
             </p>
             <p className="text-[11px] text-[var(--color-text-tertiary)]">
               No unresolved reconciliation issues detected.
             </p>
           </div>
         </div>
       )}

       {!isLoading && hasWarnings && (
         <div className="divide-y divide-[var(--color-border-subtle)]">
           {/* Balance warnings (max 3 shown) */}
           {balanceWarnings.slice(0, 3).map((w) => (
             <div key={w.accountId} className="flex items-start gap-3 px-4 py-3">
               <div className={clsx(
                 'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0',
                 w.severity === 'HIGH'
                   ? 'bg-red-50 dark:bg-red-950/30'
                   : w.severity === 'MEDIUM'
                     ? 'bg-amber-50 dark:bg-amber-950/30'
                     : 'bg-yellow-50 dark:bg-yellow-950/30',
               )}>
                 <AlertTriangle size={11} className={clsx(
                   w.severity === 'HIGH'
                     ? 'text-red-600'
                     : w.severity === 'MEDIUM'
                       ? 'text-amber-600'
                       : 'text-yellow-600',
                 )} />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate">
                   <span className="tabular-nums text-[var(--color-text-tertiary)] mr-1.5">
                     {w.accountCode}
                   </span>
                   {w.accountName}
                 </p>
                 <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 line-clamp-1">
                   {w.reason}
                 </p>
               </div>
               <Badge variant={w.severity === 'HIGH' ? 'danger' : w.severity === 'MEDIUM' ? 'warning' : 'default'}>
                 {w.severity.charAt(0) + w.severity.slice(1).toLowerCase()}
               </Badge>
             </div>
           ))}

           {/* Open discrepancies summary */}
           {openDiscrepancies > 0 && (
             <div className="flex items-start gap-3 px-4 py-3">
               <div className="mt-0.5 h-5 w-5 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
                 <AlertCircle size={11} className="text-orange-600" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-[12px] font-medium text-[var(--color-text-primary)]">
                   {openDiscrepancies} open {openDiscrepancies === 1 ? 'discrepancy' : 'discrepancies'}
                 </p>
                 <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                   Require resolution before period close.
                 </p>
               </div>
               <Badge variant="warning">Open</Badge>
             </div>
           )}

           {/* More hint */}
           {balanceWarnings.length > 3 && (
             <div className="px-4 py-2.5">
               <button
                 type="button"
                 onClick={onViewAll}
                 className="text-[11px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
               >
                 +{balanceWarnings.length - 3} more warning{balanceWarnings.length - 3 > 1 ? 's' : ''}
               </button>
             </div>
           )}
         </div>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 // ─────────────────────────────────────────────────────────────────────────────
 // KPI computation helpers
 // ─────────────────────────────────────────────────────────────────────────────

 function computeKpisFromTrialBalance(tb: TrialBalanceSnapshot) {
   let totalReceivables = 0;
   let totalPayables = 0;
   let totalRevenue = 0;
   for (const entry of tb.entries) {
     const net = entry.debit - entry.credit;
     if (entry.accountType === 'ASSET' && net > 0) {
       totalReceivables += net;
     } else if (entry.accountType === 'LIABILITY' && net < 0) {
       totalPayables += Math.abs(net);
     } else if (entry.accountType === 'REVENUE' && entry.credit > entry.debit) {
       totalRevenue += entry.credit - entry.debit;
     }
   }
   return { totalReceivables, totalPayables, totalRevenue };
 }

 function getCurrentPeriod(periods: AccountingPeriodDto[]): AccountingPeriodDto | null {
   // prefer OPEN, else most recent
   const open = periods.find((p) => p.status === 'OPEN');
   if (open) return open;
   return periods.length > 0 ? periods[0] : null;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function AccountingDashboardPage() {
   const navigate = useNavigate();

   const [kpiLoading, setKpiLoading] = useState(true);
   const [journalsLoading, setJournalsLoading] = useState(true);
   const [journalsError, setJournalsError] = useState(false);
   const [warningsLoading, setWarningsLoading] = useState(true);

   const [trialBalance, setTrialBalance] = useState<TrialBalanceSnapshot | null>(null);
   const [periods, setPeriods] = useState<AccountingPeriodDto[]>([]);
   const [journals, setJournals] = useState<JournalListItem[]>([]);
   const [balanceWarnings, setBalanceWarnings] = useState<BalanceWarningDto[]>([]);
   const [discrepancies, setDiscrepancies] = useState<ReconciliationDiscrepancyDto[]>([]);

   const loadKpis = useCallback(async () => {
     setKpiLoading(true);
     try {
       const today = new Date().toISOString().split('T')[0];
       const [tbData, periodsData] = await Promise.all([
         accountingApi.getTrialBalance(today).catch(() => null),
         accountingApi.getPeriods().catch(() => [] as AccountingPeriodDto[]),
       ]);
       setTrialBalance(tbData);
       setPeriods(periodsData);
     } finally {
       setKpiLoading(false);
     }
   }, []);

   const loadJournals = useCallback(async () => {
     setJournalsLoading(true);
     setJournalsError(false);
     try {
       const data = await accountingApi.getJournals({ size: 5 });
       setJournals(data.slice(0, 5));
     } catch {
       setJournalsError(true);
     } finally {
       setJournalsLoading(false);
     }
   }, []);

   const loadWarnings = useCallback(async () => {
     setWarningsLoading(true);
     try {
       const [warningsData, discrepanciesData] = await Promise.all([
         reportsApi.getBalanceWarnings().catch(() => [] as BalanceWarningDto[]),
         bankReconciliationApi.listDiscrepancies({ status: 'OPEN' }).catch(() => [] as ReconciliationDiscrepancyDto[]),
       ]);
       setBalanceWarnings(warningsData);
       setDiscrepancies(discrepanciesData);
     } finally {
       setWarningsLoading(false);
     }
   }, []);

   useEffect(() => {
     void loadKpis();
     void loadJournals();
     void loadWarnings();
   }, [loadKpis, loadJournals, loadWarnings]);

   const kpis = trialBalance ? computeKpisFromTrialBalance(trialBalance) : null;
   const currentPeriod = getCurrentPeriod(periods);

   return (
     <div className="space-y-6">
       {/* Page Header */}
       <div className="flex items-start justify-between flex-wrap gap-3">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
             Overview
           </h1>
           <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
             Financial summary for the current period
           </p>
         </div>
         {/* Quick actions */}
         <div className="flex items-center gap-2 shrink-0">
           <Button
             variant="secondary"
             size="sm"
             leftIcon={<BookOpen />}
             onClick={() => navigate('/accounting/journals/new')}
           >
             New Journal
           </Button>
           <Button
             variant="secondary"
             size="sm"
             leftIcon={<Receipt />}
             onClick={() => navigate('/accounting/settlements')}
           >
             Record Receipt
           </Button>
           <Button
             variant="primary"
             size="sm"
             leftIcon={<BarChart3 />}
             onClick={() => navigate('/accounting/reports')}
           >
             View Reports
           </Button>
         </div>
       </div>

       {/* KPI Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
         <KpiCard
           label="Total Receivables"
           value={kpis ? formatINR(kpis.totalReceivables) : '—'}
           description="Outstanding customer balances"
           onClick={() => navigate('/accounting/dealers')}
           isLoading={kpiLoading}
         />
         <KpiCard
           label="Total Payables"
           value={kpis ? formatINR(kpis.totalPayables) : '—'}
           description="Outstanding supplier balances"
           onClick={() => navigate('/accounting/suppliers')}
           isLoading={kpiLoading}
           isNegative={false}
         />
         <KpiCard
           label="Revenue"
           value={kpis ? formatINR(kpis.totalRevenue) : '—'}
           description="Period revenue total"
           onClick={() => navigate('/accounting/reports')}
           isLoading={kpiLoading}
         />
         <KpiCard
           label="Period Status"
           value={currentPeriod ? currentPeriod.label ?? `${currentPeriod.year}/${currentPeriod.month}` : '—'}
           description={currentPeriod ? currentPeriod.status : 'No active period'}
           onClick={() => navigate('/accounting/periods')}
           isLoading={kpiLoading}
         />
       </div>
 
       {/* Main content grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         {/* Left column — journals + warnings */}
         <div className="lg:col-span-2 space-y-4">
           <RecentJournals
             journals={journals}
             isLoading={journalsLoading}
             hasError={journalsError}
             onRowClick={(id) => navigate(`/accounting/journals/${id}`)}
             onViewAll={() => navigate('/accounting/journals')}
           />
           <ReconciliationWarnings
             balanceWarnings={balanceWarnings}
             discrepancies={discrepancies}
             isLoading={warningsLoading}
             onViewAll={() => navigate('/accounting/bank-reconciliation')}
           />
         </div>
 
         {/* Right column — quick links / period context */}
         <div className="space-y-3">
           {/* Quick-action section card */}
           <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
             <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] mb-3">
               Quick actions
             </p>
             <div className="space-y-1.5">
               {[
                 { label: 'New Journal', to: '/accounting/journals/new', icon: BookOpen },
                 { label: 'Record Receipt', to: '/accounting/settlements', icon: Receipt },
                 { label: 'View Reports', to: '/accounting/reports', icon: BarChart3 },
               ].map(({ label, to, icon: Icon }) => (
                 <button
                   key={to}
                   type="button"
                   onClick={() => navigate(to)}
                   className={clsx(
                     'w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] font-medium',
                     'text-[var(--color-text-secondary)] transition-colors',
                     'hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]',
                   )}
                 >
                   <Icon size={14} className="text-[var(--color-text-tertiary)]" />
                   {label}
                 </button>
               ))}
             </div>
           </div>
 
           {/* Trial balance summary card */}
           {!kpiLoading && kpis && (
             <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
               <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] mb-3">
                 Balance summary
               </p>
               <div className="space-y-2">
                 {[
                   { label: 'Total Receivables', value: kpis.totalReceivables },
                   { label: 'Total Payables', value: kpis.totalPayables },
                   { label: 'Revenue', value: kpis.totalRevenue, bold: true },
                 ].map(({ label, value, bold }) => (
                   <div key={label} className="flex items-center justify-between gap-3">
                     <span className={clsx(
                       'text-[12px]',
                       bold
                         ? 'font-semibold text-[var(--color-text-primary)]'
                         : 'text-[var(--color-text-secondary)]',
                     )}>
                       {label}
                     </span>
                     <span className={clsx(
                       'text-[12px] tabular-nums',
                       bold
                         ? 'font-semibold text-[var(--color-text-primary)]'
                         : 'text-[var(--color-text-secondary)]',
                       value < 0 && 'text-[var(--color-error)]',
                     )}>
                       {formatINR(value)}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
       </div>
     </div>
   );
 }

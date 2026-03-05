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
  *  - GET /api/v1/accounting/reports/income-statement/hierarchy → Revenue, Expenses, Net Profit
  *  - GET /api/v1/accounting/reports/aging/receivables         → Outstanding Receivables
  *  - GET /api/v1/accounting/journals?size=5                   → Recent Journals
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { BookOpen, Receipt, BarChart3, ChevronRight, AlertCircle, RefreshCcw } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { EmptyState } from '@/components/ui/EmptyState';
 import { Badge } from '@/components/ui/Badge';
 import { accountingApi, type JournalListItem, type IncomeStatementHierarchy, type AgedReceivablesReport } from '@/lib/accountingApi';
 
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
 // Dashboard Error State
 // ─────────────────────────────────────────────────────────────────────────────
 
 function DashboardError({ onRetry }: { onRetry: () => void }) {
   return (
     <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
       <AlertCircle size={32} className="text-[var(--color-text-tertiary)]" />
       <div>
         <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
           Couldn't load dashboard
         </p>
         <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
           There was a problem fetching financial data.
         </p>
       </div>
       <Button variant="secondary" size="sm" leftIcon={<RefreshCcw />} onClick={onRetry}>
         Try again
       </Button>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function AccountingDashboardPage() {
   const navigate = useNavigate();
 
   const [kpiLoading, setKpiLoading] = useState(true);
   const [kpiError, setKpiError] = useState(false);
   const [journalsLoading, setJournalsLoading] = useState(true);
   const [journalsError, setJournalsError] = useState(false);
 
   const [incomeStatement, setIncomeStatement] = useState<IncomeStatementHierarchy | null>(null);
   const [receivables, setReceivables] = useState<AgedReceivablesReport | null>(null);
   const [journals, setJournals] = useState<JournalListItem[]>([]);
 
   const loadKpis = useCallback(async () => {
     setKpiLoading(true);
     setKpiError(false);
     try {
       const [incomeData, receivablesData] = await Promise.all([
         accountingApi.getIncomeStatement(),
         accountingApi.getAgedReceivables(),
       ]);
       setIncomeStatement(incomeData);
       setReceivables(receivablesData);
     } catch {
       setKpiError(true);
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
 
   useEffect(() => {
     void loadKpis();
     void loadJournals();
   }, [loadKpis, loadJournals]);
 
   const handleRetry = useCallback(() => {
     void loadKpis();
     void loadJournals();
   }, [loadKpis, loadJournals]);
 
   // If KPIs errored, show full-page error
   if (!kpiLoading && kpiError) {
     return <DashboardError onRetry={handleRetry} />;
   }
 
   const netProfit = incomeStatement?.netIncome ?? 0;
 
   return (
     <div className="space-y-6">
       {/* Page Header */}
       <div className="flex items-start justify-between">
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
           label="Revenue"
           value={incomeStatement ? formatINR(incomeStatement.totalRevenue) : '—'}
           description="Current period total"
           onClick={() => navigate('/accounting/reports')}
           isLoading={kpiLoading}
         />
         <KpiCard
           label="Expenses"
           value={incomeStatement ? formatINR(incomeStatement.totalExpenses) : '—'}
           description="Operating expenses"
           onClick={() => navigate('/accounting/reports')}
           isLoading={kpiLoading}
         />
         <KpiCard
           label="Net Profit"
           value={incomeStatement ? formatINR(netProfit) : '—'}
           description="Revenue minus expenses"
           onClick={() => navigate('/accounting/reports')}
           isLoading={kpiLoading}
           isNegative={netProfit < 0}
         />
         <KpiCard
           label="Outstanding Receivables"
           value={receivables ? formatINR(receivables.totalOutstanding) : '—'}
           description="Total unpaid invoices"
           onClick={() => navigate('/accounting/dealers')}
           isLoading={kpiLoading}
         />
       </div>
 
       {/* Main content grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         {/* Recent Journals — takes 2/3 width on desktop */}
         <div className="lg:col-span-2">
           <RecentJournals
             journals={journals}
             isLoading={journalsLoading}
             hasError={journalsError}
             onRowClick={(id) => navigate(`/accounting/journals/${id}`)}
             onViewAll={() => navigate('/accounting/journals')}
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
 
           {/* Financials summary card */}
           {!kpiLoading && incomeStatement && (
             <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
               <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] mb-3">
                 Income summary
               </p>
               <div className="space-y-2">
                 {[
                   { label: 'Gross Revenue', value: incomeStatement.totalRevenue },
                   { label: 'Cost of Goods', value: incomeStatement.totalCogs, negative: false },
                   { label: 'Gross Profit', value: incomeStatement.grossProfit },
                   { label: 'Operating Expenses', value: incomeStatement.totalExpenses, negative: false },
                   { label: 'Net Income', value: incomeStatement.netIncome, bold: true },
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

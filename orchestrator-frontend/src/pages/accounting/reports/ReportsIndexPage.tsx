 /**
  * ReportsIndexPage
  *
  * A landing page for the accounting reports section.
  * Lists all available reports with a brief description and a direct link.
  *
  * This page serves as the destination for the "View Reports" dashboard
  * quick-action button and breadcrumb navigation.
  *
  * VAL-ACCT-012: Named reports, dashboard links, and audit drill-down
  * routes remain valid and recoverable.
  */

 import { useNavigate } from 'react-router-dom';
 import {
   Scale,
   TrendingUp,
   PieChart,
   Activity,
   UserX,
   Receipt,
   Warehouse,
   ClipboardList,
   FileSearch,
 } from 'lucide-react';
 import { clsx } from 'clsx';

 // ─────────────────────────────────────────────────────────────────────────────
 // Report catalog
 // ─────────────────────────────────────────────────────────────────────────────

 interface ReportItem {
   label: string;
   description: string;
   to: string;
   icon: React.ElementType;
 }

 const REPORTS: ReportItem[] = [
   {
     label: 'Trial Balance',
     description: 'Verify that all debits equal all credits across the chart of accounts.',
     to: '/accounting/reports/trial-balance',
     icon: Scale,
   },
   {
     label: 'Profit & Loss',
     description: 'Revenue, cost of goods sold, operating expenses, and net income for the period.',
     to: '/accounting/reports/pl',
     icon: TrendingUp,
   },
   {
     label: 'Balance Sheet',
     description: 'Assets, liabilities, and equity position at a point in time.',
     to: '/accounting/reports/balance-sheet',
     icon: PieChart,
   },
   {
     label: 'Cash Flow',
     description: 'Operating, investing, and financing activities and their net impact on cash.',
     to: '/accounting/reports/cash-flow',
     icon: Activity,
   },
   {
     label: 'Aged Debtors',
     description: 'Outstanding receivables aged by 0–30, 31–60, 61–90, and 90+ days.',
     to: '/accounting/reports/aged-debtors',
     icon: UserX,
   },
   {
     label: 'GST Return',
     description: 'Output tax collected, input tax credit, and net GST liability for the period.',
     to: '/accounting/reports/gst',
     icon: Receipt,
   },
   {
     label: 'GST Reconciliation',
     description: 'Component-level GST reconciliation to compare against the GST Return.',
     to: '/accounting/reports/gst-reconciliation',
     icon: FileSearch,
   },
   {
     label: 'Inventory Valuation',
     description: 'Total inventory value, low-stock items, and per-item cost breakdown.',
     to: '/accounting/reports/inventory',
     icon: Warehouse,
   },
   {
     label: 'Reconciliation Audit',
     description: 'Open discrepancies, resolution status, and subledger variance detail.',
     to: '/accounting/reports/audit',
     icon: ClipboardList,
   },
 ];

 // ─────────────────────────────────────────────────────────────────────────────
 // Report card
 // ─────────────────────────────────────────────────────────────────────────────

 function ReportCard({ item, onClick }: { item: ReportItem; onClick: () => void }) {
   const Icon = item.icon;
   return (
     <button
       type="button"
       onClick={onClick}
       className={clsx(
         'group text-left p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
         'transition-all duration-150 hover:border-[var(--color-border-strong)]',
         'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
         'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)] focus-visible:ring-offset-1',
       )}
     >
       <div className="flex items-start gap-3">
         <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-center">
           <Icon size={16} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors" />
         </div>
         <div className="min-w-0">
           <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{item.label}</p>
           <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)] leading-relaxed">
             {item.description}
           </p>
         </div>
       </div>
     </button>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function ReportsIndexPage() {
   const navigate = useNavigate();

   return (
     <div className="space-y-6">
       <div>
         <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Reports</h1>
         <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
           Financial reports and audit views for the current accounting period.
         </p>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
         {REPORTS.map((report) => (
           <ReportCard
             key={report.to}
             item={report}
             onClick={() => navigate(report.to)}
           />
         ))}
       </div>
     </div>
   );
 }

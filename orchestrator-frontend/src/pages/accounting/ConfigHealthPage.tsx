 /**
  * ConfigHealthPage
  *
  * Diagnostic page that runs configuration health checks and shows
  * pass/fail results with actionable fix links.
  *
  * Checks run server-side via:
  *  GET /api/v1/accounting/configuration/health
  *
  * Returns ConfigurationHealthReport:
  *  - healthy: boolean
  *  - issues: Array<{ companyCode, domain, reference, message }>
  *
  * Fix links map domain → relevant config page in this portal.
  */

 import { useState, useEffect, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   CheckCircle2,
   XCircle,
   RefreshCcw,
   AlertCircle,
   ShieldCheck,
   ExternalLink,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Badge } from '@/components/ui/Badge';
 import {
   configHealthApi,
   type ConfigurationHealthReport,
   type ConfigurationIssue,
 } from '@/lib/accountingApi';

 // ─────────────────────────────────────────────────────────────────────────────
 // Domain → fix link mapping
 // ─────────────────────────────────────────────────────────────────────────────

 const DOMAIN_FIX_LINKS: Record<string, { label: string; path: string }> = {
   DEFAULT_ACCOUNTS: { label: 'Set Default Accounts', path: '/accounting/default-accounts' },
   TAX_ACCOUNT: { label: 'Configure Tax Account', path: '/accounting/default-accounts' },
   PRODUCTION_METADATA: { label: 'Review Catalog', path: '/accounting/catalog' },
   PERIODS: { label: 'Create Periods', path: '/accounting/periods' },
   OPENING_BALANCE: { label: 'Post Opening Balances', path: '/accounting/opening-stock' },
   CHART_OF_ACCOUNTS: { label: 'Review Chart of Accounts', path: '/accounting/chart-of-accounts' },
 };

 function getFixLink(domain: string): { label: string; path: string } | null {
   return DOMAIN_FIX_LINKS[domain] ?? null;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Predefined checks (render as "passing" if not in issues list)
 // ─────────────────────────────────────────────────────────────────────────────

 interface CheckDef {
   domain: string;
   label: string;
   description: string;
 }

 const CHECK_DEFS: CheckDef[] = [
   {
     domain: 'DEFAULT_ACCOUNTS',
     label: 'Default GL accounts',
     description: 'AR, AP, Revenue, COGS, Inventory, Tax accounts configured.',
   },
   {
     domain: 'TAX_ACCOUNT',
     label: 'Tax account configured',
     description: 'Tax payable GL account is set for GST posting.',
   },
   {
     domain: 'PERIODS',
     label: 'Accounting periods created',
     description: 'At least one open accounting period exists.',
   },
   {
     domain: 'OPENING_BALANCE',
     label: 'Opening balances posted',
     description: 'Initial trial balance has been imported or posted.',
   },
   {
     domain: 'PRODUCTION_METADATA',
     label: 'Production metadata',
     description: 'Product catalog and raw material catalog are configured.',
   },
   {
     domain: 'CHART_OF_ACCOUNTS',
     label: 'Chart of accounts',
     description: 'Accounts hierarchy is set up with required account types.',
   },
 ];

 // ─────────────────────────────────────────────────────────────────────────────
 // Check row
 // ─────────────────────────────────────────────────────────────────────────────

 interface CheckRowProps {
   checkDef: CheckDef;
   issues: ConfigurationIssue[];
   onFixClick: (path: string) => void;
 }

 function CheckRow({ checkDef, issues, onFixClick }: CheckRowProps) {
   const domainIssues = issues.filter((i) => i.domain === checkDef.domain);
   const isPassing = domainIssues.length === 0;
   const fixLink = getFixLink(checkDef.domain);

   return (
     <div className={clsx(
       'p-4 rounded-xl border transition-colors',
       isPassing
         ? 'border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)]'
         : 'border-[var(--color-danger,#ef4444)]/20 bg-[var(--color-danger,#ef4444)]/5',
     )}>
       <div className="flex items-start gap-3">
         {isPassing ? (
           <CheckCircle2 size={16} className="mt-0.5 text-[var(--color-success,#22c55e)] shrink-0" />
         ) : (
           <XCircle size={16} className="mt-0.5 text-[var(--color-danger,#ef4444)] shrink-0" />
         )}

         <div className="flex-1 min-w-0">
           <div className="flex items-center justify-between gap-3 flex-wrap">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
               {checkDef.label}
             </p>
             <Badge variant={isPassing ? 'success' : 'danger'}>
               {isPassing ? 'Pass' : 'Fail'}
             </Badge>
           </div>
           <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
             {checkDef.description}
           </p>

           {/* Issue details */}
           {domainIssues.length > 0 && (
             <div className="mt-3 space-y-1.5">
               {domainIssues.map((issue, i) => (
                 <p key={i} className="text-[12px] text-[var(--color-danger,#ef4444)]">
                   {issue.message}
                   {issue.reference !== 'BASE' && issue.reference !== 'COMPANY_DEFAULTS' && (
                     <span className="ml-1 text-[var(--color-text-tertiary)]">
                       ({issue.reference})
                     </span>
                   )}
                 </p>
               ))}
             </div>
           )}

           {/* Fix link */}
           {!isPassing && fixLink && (
             <button
               type="button"
               onClick={() => onFixClick(fixLink.path)}
               className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
             >
               <ExternalLink size={12} />
               {fixLink.label}
             </button>
           )}
         </div>
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Unknown issues (domains not in our predefined list)
 // ─────────────────────────────────────────────────────────────────────────────

 function UnknownIssueRow({ issue }: { issue: ConfigurationIssue }) {
   return (
     <div className="p-4 rounded-xl border border-[var(--color-danger,#ef4444)]/20 bg-[var(--color-danger,#ef4444)]/5">
       <div className="flex items-start gap-3">
         <XCircle size={16} className="mt-0.5 text-[var(--color-danger,#ef4444)] shrink-0" />
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
             {issue.domain}
           </p>
           <p className="mt-0.5 text-[12px] text-[var(--color-danger,#ef4444)]">
             {issue.message}
           </p>
         </div>
         <Badge variant="danger" className="ml-auto shrink-0">Fail</Badge>
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function ConfigHealthPage() {
   const navigate = useNavigate();

   const [report, setReport] = useState<ConfigurationHealthReport | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const loadReport = useCallback(() => {
     setLoading(true);
     setError(null);
     configHealthApi.getHealthReport()
       .then((data) => setReport(data))
       .catch(() => setError('Could not run health check. Try again.'))
       .finally(() => setLoading(false));
   }, []);

   useEffect(() => {
     loadReport();
   }, [loadReport]);

   // Find issues not covered by predefined checks
   const knownDomains = new Set(CHECK_DEFS.map((c) => c.domain));
   const unknownIssues = report?.issues.filter((i) => !knownDomains.has(i.domain)) ?? [];

   const totalFails = report ? CHECK_DEFS.filter(
     (c) => report.issues.some((i) => i.domain === c.domain)
   ).length + unknownIssues.length : 0;

   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-start justify-between gap-4 flex-wrap">
         <div>
           <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
             Config Health Check
           </h1>
           <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
             Diagnostic checks for required accounting configuration.
           </p>
         </div>
         <Button
           variant="secondary"
           size="sm"
           onClick={loadReport}
           disabled={loading}
           className="gap-2"
         >
           <RefreshCcw size={14} className={clsx(loading && 'animate-spin')} />
           {loading ? 'Checking…' : 'Run checks'}
         </Button>
       </div>

       {/* Error */}
       {error && (
         <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--color-danger,#ef4444)]/10 text-[var(--color-danger,#ef4444)]">
           <AlertCircle size={16} />
           <span className="text-[13px]">{error}</span>
         </div>
       )}

       {/* Loading skeletons */}
       {loading && (
         <div className="space-y-3">
           {Array.from({ length: 6 }).map((_, i) => (
             <Skeleton key={i} className="h-20 rounded-xl" />
           ))}
         </div>
       )}

       {/* Results */}
       {!loading && !error && report && (
         <>
           {/* Summary banner */}
           <div className={clsx(
             'flex items-center gap-3 p-4 rounded-xl border',
             report.healthy
               ? 'border-[var(--color-success,#22c55e)]/30 bg-[var(--color-success,#22c55e)]/5'
               : 'border-[var(--color-danger,#ef4444)]/20 bg-[var(--color-danger,#ef4444)]/5',
           )}>
             {report.healthy ? (
               <ShieldCheck size={20} className="text-[var(--color-success,#22c55e)] shrink-0" />
             ) : (
               <AlertCircle size={20} className="text-[var(--color-danger,#ef4444)] shrink-0" />
             )}
             <div>
               <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                 {report.healthy
                   ? 'All checks passing'
                   : `${totalFails} check${totalFails === 1 ? '' : 's'} need attention`}
               </p>
               <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
                 {report.healthy
                   ? 'Your accounting configuration is complete and ready.'
                   : 'Fix the issues below to ensure correct accounting behaviour.'}
               </p>
             </div>
           </div>

           {/* Predefined checks */}
           <div className="space-y-2">
             {CHECK_DEFS.map((check) => (
               <CheckRow
                 key={check.domain}
                 checkDef={check}
                 issues={report.issues}
                 onFixClick={(path) => navigate(path)}
               />
             ))}
           </div>

           {/* Unknown issues (if any) */}
           {unknownIssues.length > 0 && (
             <div className="space-y-2">
               <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                 Other issues
               </p>
               {unknownIssues.map((issue, i) => (
                 <UnknownIssueRow key={i} issue={issue} />
               ))}
             </div>
           )}
         </>
       )}
     </div>
   );
 }

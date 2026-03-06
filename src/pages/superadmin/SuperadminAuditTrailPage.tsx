 /**
  * SuperadminAuditTrailPage
  *
  * Platform-level audit trail: tenant onboarding, lifecycle changes, admin actions.
  * Filterable by date range, action type, and actor.
  *
  * Data source:
  *  - superadminAuditApi.getBusinessEvents() → GET /api/v1/audit/business-events
  */
 
 import { useCallback, useEffect, useRef, useState } from 'react';
 import {
   Search,
   RefreshCcw,
   AlertCircle,
   ChevronLeft,
   ChevronRight,
   Clock,
   User,
   Activity,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { Badge } from '@/components/ui/Badge';
 import { superadminAuditApi } from '@/lib/superadminApi';
 import type { BusinessEvent, AuditEventFilters, PageResponse } from '@/types';
 
 const PAGE_SIZE = 25;
 
 function formatTimestamp(ts: string): string {
   try {
     return format(new Date(ts), 'd MMM yyyy, HH:mm:ss');
   } catch {
     return ts;
   }
 }
 
 function severityVariant(s?: string): 'danger' | 'warning' | 'default' {
   if (s === 'ERROR') return 'danger';
   if (s === 'WARNING') return 'warning';
   return 'default';
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Business Events Table
 // ─────────────────────────────────────────────────────────────────────────────
 
 function BusinessEventsSection() {
   const [data, setData] = useState<PageResponse<BusinessEvent> | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [page, setPage] = useState(0);
   const [filters, setFilters] = useState<AuditEventFilters>({});
   const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 
   const load = useCallback(
     async (f: AuditEventFilters = filters, p: number = page) => {
       setIsLoading(true);
       setError(null);
       try {
         const result = await superadminAuditApi.getBusinessEvents({ ...f, page: p, size: PAGE_SIZE });
         setData(result);
       } catch {
         setError("Couldn't load audit events. Please try again.");
       } finally {
         setIsLoading(false);
       }
     },
     [filters, page],
   );
 
   useEffect(() => {
     void load(filters, page);
   }, [filters, page, load]);
 
   const handleSearchChange = (value: string) => {
     if (searchRef.current) clearTimeout(searchRef.current);
     searchRef.current = setTimeout(() => {
       setFilters((f) => ({ ...f, actor: value || undefined }));
       setPage(0);
     }, 300);
   };
 
   return (
     <div className="space-y-4">
       {/* Filters */}
       <div className="flex flex-col sm:flex-row gap-2">
         <div className="relative flex-1 max-w-sm">
           <Search
             size={14}
             className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
           />
           <input
             type="text"
             placeholder="Filter by actor…"
             onChange={(e) => handleSearchChange(e.target.value)}
             className={clsx(
               'w-full pl-9 pr-3 h-9 rounded-lg border border-[var(--color-border-default)]',
               'bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)]',
               'placeholder:text-[var(--color-text-placeholder)] outline-none',
               'focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
               'transition-colors duration-150',
             )}
           />
         </div>
         <input
           type="text"
           placeholder="Filter by action…"
           onChange={(e) => {
             if (searchRef.current) clearTimeout(searchRef.current);
             searchRef.current = setTimeout(() => {
               setFilters((f) => ({ ...f, action: e.target.value || undefined }));
               setPage(0);
             }, 300);
           }}
           className={clsx(
             'w-full sm:w-48 pl-3 pr-3 h-9 rounded-lg border border-[var(--color-border-default)]',
             'bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)]',
             'placeholder:text-[var(--color-text-placeholder)] outline-none',
             'focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
             'transition-colors duration-150',
           )}
         />
         <button
           type="button"
           onClick={() => void load(filters, page)}
           className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors shrink-0"
         >
           <RefreshCcw size={12} />
           Refresh
         </button>
       </div>
 
       {/* Error */}
       {error && (
         <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={14} className="shrink-0" />
           <span className="flex-1">{error}</span>
           <button
             type="button"
             onClick={() => void load()}
             className="text-[12px] font-medium underline underline-offset-2 hover:no-underline shrink-0"
           >
             Retry
           </button>
         </div>
       )}
 
       {/* Loading */}
       {isLoading && (
         <div className="space-y-2">
           {Array.from({ length: 8 }).map((_, i) => (
             <div
               key={i}
               className="h-12 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse"
             />
           ))}
         </div>
       )}
 
       {/* Empty */}
       {!isLoading && data?.content.length === 0 && !error && (
         <div className="py-16 text-center">
           <Activity size={28} className="mx-auto text-[var(--color-text-tertiary)] opacity-30 mb-2" />
           <p className="text-[13px] text-[var(--color-text-tertiary)]">No audit events found</p>
         </div>
       )}
 
       {/* Table */}
       {!isLoading && data && data.content.length > 0 && (
         <>
           {/* Desktop */}
           <div className="hidden sm:block overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
             <table className="min-w-full divide-y divide-[var(--color-border-subtle)]">
               <thead>
                 <tr className="bg-[var(--color-surface-secondary)]">
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Timestamp</th>
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Actor</th>
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Action</th>
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Resource</th>
                   <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">Severity</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--color-border-subtle)]">
                 {data.content.map((event) => (
                   <tr key={event.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                     <td className="px-4 py-3 whitespace-nowrap">
                       <div className="flex items-center gap-1.5">
                         <Clock size={11} className="text-[var(--color-text-tertiary)] shrink-0" />
                         <span className="text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
                           {formatTimestamp(event.timestamp)}
                         </span>
                       </div>
                     </td>
                     <td className="px-4 py-3">
                       <div className="flex items-center gap-1.5">
                         <User size={11} className="text-[var(--color-text-tertiary)] shrink-0" />
                         <span className="text-[12px] text-[var(--color-text-secondary)] truncate max-w-[120px]">
                           {event.actor}
                         </span>
                       </div>
                     </td>
                     <td className="px-4 py-3">
                       <span className="text-[12px] font-mono text-[var(--color-text-primary)]">
                         {event.action}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       <span className="text-[12px] text-[var(--color-text-secondary)]">
                         {event.resource}
                         {event.resourceId && (
                           <span className="ml-1 text-[var(--color-text-tertiary)]">
                             #{event.resourceId}
                           </span>
                         )}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       {event.severity && (
                         <Badge variant={severityVariant(event.severity)}>
                           {event.severity}
                         </Badge>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
 
           {/* Mobile */}
           <div className="sm:hidden space-y-2">
             {data.content.map((event) => (
               <div
                 key={event.id}
                 className="p-3 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]"
               >
                 <div className="flex items-start justify-between gap-2 mb-1.5">
                   <span className="text-[12px] font-mono font-medium text-[var(--color-text-primary)]">
                     {event.action}
                   </span>
                   {event.severity && (
                     <Badge variant={severityVariant(event.severity)}>{event.severity}</Badge>
                   )}
                 </div>
                 <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                   <span>{event.actor}</span>
                   <span>{event.resource}</span>
                   <span className="tabular-nums">{formatTimestamp(event.timestamp)}</span>
                 </div>
               </div>
             ))}
           </div>
 
           {/* Pagination */}
           <div className="flex items-center justify-between gap-4 pt-1">
             <p className="text-[12px] text-[var(--color-text-tertiary)]">
               Page {data.page + 1} of {Math.max(1, data.totalPages)}
             </p>
             <div className="flex items-center gap-1">
               <button
                 type="button"
                 onClick={() => setPage((p) => Math.max(0, p - 1))}
                 disabled={page === 0}
                 className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronLeft size={13} /> Prev
               </button>
               <button
                 type="button"
                 onClick={() => setPage((p) => p + 1)}
                 disabled={page + 1 >= data.totalPages}
                 className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
               >
                 Next <ChevronRight size={13} />
               </button>
             </div>
           </div>
         </>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function SuperadminAuditTrailPage() {
   return (
     <div className="space-y-6">
       <div>
         <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Audit Trail</h1>
         <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
           Platform-level event log: tenant lifecycle, admin actions, and governance events.
         </p>
       </div>
 
       <BusinessEventsSection />
     </div>
   );
 }

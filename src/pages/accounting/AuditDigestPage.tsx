 /**
  * AuditDigestPage
  *
  * Summary of accounting events for the current period.
  *
  * Sections:
  *  1. Audit Digest panel — GET /api/v1/accounting/audit/digest
  *     shows period label + list of summary entries
  *  2. Export CSV — GET /api/v1/accounting/audit/digest.csv
  *     triggers browser file download
  *  3. Audit Trail table — GET /api/v1/accounting/audit-trail
  *     paginated list of raw audit events
  */

 import { useState, useEffect, useCallback } from 'react';
 import {
   Download,
   RefreshCcw,
   AlertCircle,
   FileText,
   Clock,
   User,
   Activity,
 } from 'lucide-react';
  import { format, parseISO } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Badge } from '@/components/ui/Badge';
 import { useToast } from '@/components/ui/Toast';
 import {
   auditApi,
   type AuditDigestResponse,
   type AuditTrailPageResponse,
   type AccountingAuditTrailEntryDto,
 } from '@/lib/accountingApi';
import { downloadBlob } from '@/utils/mobileUtils';

 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────

 function formatTimestamp(ts: string): string {
   try { return format(parseISO(ts), 'dd MMM yyyy HH:mm'); } catch { return ts; }
 }

 function actionVariant(action: string): 'success' | 'warning' | 'danger' | 'default' {
   const a = action.toUpperCase();
   if (a.includes('CREATE') || a.includes('POST')) return 'success';
   if (a.includes('DELETE') || a.includes('VOID') || a.includes('REVERSE')) return 'danger';
   if (a.includes('UPDATE') || a.includes('MODIFY')) return 'warning';
   return 'default';
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Audit Trail Row
 // ─────────────────────────────────────────────────────────────────────────────

 function AuditTrailRow({ entry }: { entry: AccountingAuditTrailEntryDto }) {
   return (
     <tr className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
       <td className="px-4 py-3 text-[12px] tabular-nums text-[var(--color-text-tertiary)] whitespace-nowrap">
         {formatTimestamp(entry.timestamp)}
       </td>
       <td className="px-4 py-3">
         <span className="text-[13px] text-[var(--color-text-primary)]">
           {entry.actorIdentifier ?? '—'}
         </span>
       </td>
       <td className="px-4 py-3">
         <Badge variant={actionVariant(entry.actionType)} className="text-[11px]">
           {entry.actionType}
         </Badge>
       </td>
       <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)]">
         {entry.entityType}
       </td>
       <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)] max-w-xs truncate">
         {entry.referenceNumber ?? entry.entityId ?? '—'}
       </td>
     </tr>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function AuditDigestPage() {
   const { toast } = useToast();

   // Digest
   const [digest, setDigest] = useState<AuditDigestResponse | null>(null);
   const [digestLoading, setDigestLoading] = useState(true);
   const [digestError, setDigestError] = useState<string | null>(null);

   // Audit trail
   const [trailData, setTrailData] = useState<AuditTrailPageResponse | null>(null);
   const [trailLoading, setTrailLoading] = useState(true);
   const [trailError, setTrailError] = useState<string | null>(null);
   const [currentPage, setCurrentPage] = useState(0);

   // CSV export
   const [exporting, setExporting] = useState(false);

   const loadDigest = useCallback(() => {
     setDigestLoading(true);
     setDigestError(null);
     auditApi.getAuditDigest()
       .then((data) => setDigest(data))
       .catch(() => setDigestError('Could not load audit digest.'))
       .finally(() => setDigestLoading(false));
   }, []);

   const loadTrail = useCallback((page: number) => {
     setTrailLoading(true);
     setTrailError(null);
     auditApi.getAuditTrail({ page, size: 20 })
       .then((data) => setTrailData(data))
       .catch(() => setTrailError('Could not load audit trail.'))
       .finally(() => setTrailLoading(false));
   }, []);

   useEffect(() => {
     loadDigest();
     loadTrail(0);
   }, [loadDigest, loadTrail]);

   const handleExportCsv = useCallback(async () => {
     setExporting(true);
     try {
       const csvText = await auditApi.getAuditDigestCsv();
       const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`);
       toast({ title: 'CSV downloaded', type: 'success' });
     } catch {
       toast({ title: 'Export failed. Try again.', type: 'error' });
     } finally {
       setExporting(false);
     }
   }, [toast]);

   const handlePageChange = useCallback((p: number) => {
     setCurrentPage(p);
     loadTrail(p);
   }, [loadTrail]);

   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-start justify-between gap-4 flex-wrap">
         <div>
           <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
             Audit Digest
           </h1>
           <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
             Summary of accounting activity and full audit trail export.
           </p>
         </div>
         <Button
           variant="secondary"
           size="sm"
           onClick={handleExportCsv}
           disabled={exporting}
           className="gap-2"
         >
           <Download size={14} />
           {exporting ? 'Exporting…' : 'Export CSV'}
         </Button>
       </div>

       {/* Digest summary panel */}
       <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
         <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
           <div className="flex items-center gap-2">
             <Activity size={15} className="text-[var(--color-text-tertiary)]" />
             <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
               Period Summary
             </span>
           </div>
           {!digestLoading && (
             <button
               type="button"
               onClick={loadDigest}
               className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
               aria-label="Refresh digest"
             >
               <RefreshCcw size={14} />
             </button>
           )}
         </div>

         <div className="p-5">
           {digestLoading ? (
             <div className="space-y-2">
               {Array.from({ length: 4 }).map((_, i) => (
                 <Skeleton key={i} className="h-5 w-full" />
               ))}
             </div>
           ) : digestError ? (
             <div className="flex items-center gap-2 text-[var(--color-danger,#ef4444)]">
               <AlertCircle size={15} />
               <span className="text-[13px]">{digestError}</span>
             </div>
           ) : digest ? (
             <>
               {digest.periodLabel && (
                 <p className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                   {digest.periodLabel}
                 </p>
               )}
               {digest.entries.length === 0 ? (
                 <p className="text-[13px] text-[var(--color-text-secondary)]">
                   No activity recorded for this period.
                 </p>
               ) : (
                 <ul className="space-y-2">
                   {digest.entries.map((entry, i) => (
                     <li key={i} className="flex items-start gap-2">
                       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] shrink-0" />
                       <span className="text-[13px] text-[var(--color-text-primary)]">{entry}</span>
                     </li>
                   ))}
                 </ul>
               )}
             </>
           ) : null}
         </div>
       </div>

       {/* Audit Trail table */}
       <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
         <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
           <div className="flex items-center gap-2">
             <FileText size={15} className="text-[var(--color-text-tertiary)]" />
             <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
               Audit Trail
             </span>
             {trailData && (
               <span className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                 ({trailData.totalElements.toLocaleString()} events)
               </span>
             )}
           </div>
         </div>

         {trailLoading ? (
           <div className="p-5 space-y-2">
             {Array.from({ length: 8 }).map((_, i) => (
               <Skeleton key={i} className="h-10 w-full" />
             ))}
           </div>
         ) : trailError ? (
           <div className="p-5 flex items-center gap-2 text-[var(--color-danger,#ef4444)]">
             <AlertCircle size={15} />
             <span className="text-[13px]">{trailError}</span>
           </div>
         ) : !trailData || trailData.content.length === 0 ? (
           <div className="py-12 text-center">
             <p className="text-[13px] text-[var(--color-text-secondary)]">
               No audit events found.
             </p>
           </div>
         ) : (
           <>
             {/* Desktop table */}
             <div className="overflow-x-auto hidden sm:block">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-[var(--color-border-default)]">
                     {['Timestamp', 'User', 'Action', 'Entity', 'Reference'].map((h) => (
                       <th
                         key={h}
                         className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]"
                       >
                         {h}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {trailData.content.map((entry) => (
                     <AuditTrailRow key={entry.id} entry={entry} />
                   ))}
                 </tbody>
               </table>
             </div>

             {/* Mobile cards */}
             <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
               {trailData.content.map((entry) => (
                 <div key={entry.id} className="p-4 space-y-1.5">
                   <div className="flex items-center justify-between gap-2">
                     <Badge variant={actionVariant(entry.actionType)} className="text-[11px]">
                       {entry.actionType}
                     </Badge>
                     <span className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                       {formatTimestamp(entry.timestamp)}
                     </span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <User size={12} className="text-[var(--color-text-tertiary)]" />
                     <span className="text-[13px] text-[var(--color-text-secondary)]">
                       {entry.actorIdentifier ?? '—'}
                     </span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <Clock size={12} className="text-[var(--color-text-tertiary)]" />
                     <span className="text-[13px] text-[var(--color-text-secondary)]">
                       {entry.entityType} — {entry.referenceNumber ?? entry.entityId ?? '—'}
                     </span>
                   </div>
                 </div>
               ))}
             </div>

             {/* Pagination */}
             {trailData.totalPages > 1 && (
               <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--color-border-subtle)]">
                 <p className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                   Page {currentPage + 1} of {trailData.totalPages}
                 </p>
                 <div className="flex items-center gap-2">
                   <Button
                     size="sm"
                     variant="secondary"
                     disabled={currentPage === 0}
                     onClick={() => handlePageChange(currentPage - 1)}
                   >
                     Previous
                   </Button>
                   <Button
                     size="sm"
                     variant="secondary"
                     disabled={currentPage >= trailData.totalPages - 1}
                     onClick={() => handlePageChange(currentPage + 1)}
                   >
                     Next
                   </Button>
                 </div>
               </div>
             )}
           </>
         )}
       </div>
     </div>
   );
 }

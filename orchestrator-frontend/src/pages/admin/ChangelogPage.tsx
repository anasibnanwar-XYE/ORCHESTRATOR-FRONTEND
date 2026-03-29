 /**
  * ChangelogPage — Changelog Read-Only View for Tenant Admin
  *
  * Tenant admin can READ changelog entries only.
  * Changelog CRUD (create/update/delete) is superadmin-only via /superadmin/changelog.
  *
  * Read endpoints:
  *   GET /changelog              — paginated list of entries
  *   GET /changelog/latest-highlighted — for the WhatsNew banner
  *
  * WhatsNewBanner: shown when there are unread entries (tracked in localStorage).
  * Exported separately so it can be mounted in the shell layout.
  */

 import { useState, useEffect, useCallback } from 'react';
 import {
   BookOpen,
   Tag,
   Calendar,
   Bell,
   AlertCircle,
   RefreshCcw,
   Loader2,
   X,
   ChevronDown,
   ChevronUp,
   Lock,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { changelogApi } from '@/lib/adminApi';
 import type { ChangelogEntryResponse } from '@/types';

 // ─────────────────────────────────────────────────────────────────────────────
 // Banner read-state helpers (per-browser localStorage tracking only)
 // ─────────────────────────────────────────────────────────────────────────────

 const READ_KEY = 'o_changelog_last_read';

 function getLastReadId(): number {
   try { return Number(localStorage.getItem(READ_KEY) ?? 0); } catch { return 0; }
 }

 function markAsRead(latestId: number) {
   try { localStorage.setItem(READ_KEY, String(latestId)); } catch { /* ignore */ }
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // WhatsNewBanner
 // ─────────────────────────────────────────────────────────────────────────────

 interface WhatsNewBannerProps {
   entries: ChangelogEntryResponse[];
   onViewAll?: () => void;
 }

 export function WhatsNewBanner({ entries, onViewAll }: WhatsNewBannerProps) {
   const [visible, setVisible] = useState(false);
   const [unread, setUnread] = useState<ChangelogEntryResponse[]>([]);

   useEffect(() => {
     if (entries.length === 0) return;
     const lastId = getLastReadId();
     const newEntries = entries.filter((e) => e.id > lastId);
     if (newEntries.length > 0) {
       setUnread(newEntries);
       setVisible(true);
     }
   }, [entries]);

   const dismiss = () => {
     if (unread.length > 0) {
       markAsRead(Math.max(...unread.map((e) => e.id)));
     }
     setVisible(false);
   };

   if (!visible || unread.length === 0) return null;

   const latest = unread[0];

   return (
     <div
       className={clsx(
         'fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-[var(--color-border-default)]',
         'bg-[var(--color-surface-primary)] shadow-lg p-4',
       )}
       style={{ animation: 'slideUp 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
       role="status"
       aria-live="polite"
     >
       <div className="flex items-start justify-between gap-2">
         <div className="flex items-center gap-2">
           <Bell size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
           <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
             What&apos;s New
           </span>
           {unread.length > 1 && (
             <Badge variant="info">{unread.length} updates</Badge>
           )}
         </div>
         <button
           onClick={dismiss}
           aria-label="Dismiss"
           className="h-6 w-6 flex items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors shrink-0"
         >
           <X size={13} />
         </button>
       </div>
       <div className="mt-2">
         <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{latest.title}</p>
         <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 line-clamp-2">
           {latest.body.replace(/#+\s/g, '').substring(0, 100)}
         </p>
       </div>
       {onViewAll && (
         <button
           onClick={() => { dismiss(); onViewAll(); }}
           className="mt-3 text-[12px] font-medium text-[var(--color-text-primary)] underline underline-offset-2"
         >
           View all updates
         </button>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // ChangelogPage — Read-Only
 // ─────────────────────────────────────────────────────────────────────────────

 export function ChangelogPage() {
   const [entries, setEntries] = useState<ChangelogEntryResponse[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);
   const [expandedId, setExpandedId] = useState<number | null>(null);

   const load = useCallback(async () => {
     setIsLoading(true);
     setLoadError(null);
     try {
       const { content } = await changelogApi.list(0, 50);
       setEntries(content);
     } catch {
       setLoadError("Couldn't load changelog entries. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => { load(); }, [load]);

   // ── Render ─────────────────────────────────────────────────────────────────

   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-center justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
             Changelog
           </h1>
           <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
             Product updates and release notes
           </p>
         </div>
         <Button
           variant="ghost"
           size="sm"
           onClick={load}
           disabled={isLoading}
           className="gap-1.5"
           aria-label="Refresh changelog"
         >
           <RefreshCcw size={13} className={isLoading ? 'animate-spin' : ''} />
           Refresh
         </Button>
       </div>

       {/* Read-only notice */}
       <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
         <Lock size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
         <p className="text-[12px] text-[var(--color-text-secondary)]">
           Changelog entries are managed by the platform team. Contact your superadmin to publish or update entries.
         </p>
       </div>

       {/* Error state */}
       {loadError && !isLoading && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]">
           <AlertCircle size={16} className="shrink-0 text-[var(--color-error)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">{loadError}</p>
           <Button variant="ghost" size="sm" onClick={load} className="ml-auto shrink-0">
             Try again
           </Button>
         </div>
       )}

       {/* Loading state */}
       {isLoading && (
         <div className="flex flex-col items-center justify-center py-16 gap-3">
           <Loader2 size={20} className="animate-spin text-[var(--color-text-tertiary)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">Loading entries…</p>
         </div>
       )}

       {/* Empty state */}
       {!isLoading && !loadError && entries.length === 0 && (
         <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border-default)] py-16 gap-3">
           <BookOpen size={24} className="text-[var(--color-text-tertiary)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">No entries yet</p>
           <p className="text-[12px] text-[var(--color-text-tertiary)]">
             Check back after the next release.
           </p>
         </div>
       )}

       {/* Entry list */}
       {!isLoading && !loadError && entries.length > 0 && (
         <div className="space-y-3">
           {entries.map((entry) => {
             const isExpanded = expandedId === entry.id;
             return (
               <div
                 key={entry.id}
                 className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden"
               >
                 <div className="flex items-start justify-between px-5 py-4">
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 flex-wrap">
                       <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                         {entry.title}
                       </h3>
                       <Badge variant="info">
                         <Tag size={10} className="mr-1" />
                         {entry.version}
                       </Badge>
                       {entry.isHighlighted && (
                         <Badge variant="warning">Highlighted</Badge>
                       )}
                     </div>
                     <div className="flex items-center gap-3 mt-1 flex-wrap">
                       <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                         <Calendar size={10} />
                         {new Date(entry.publishedAt).toLocaleDateString('en-IN', {
                           day: 'numeric', month: 'short', year: 'numeric',
                         })}
                       </span>
                       {entry.createdBy && (
                         <span className="text-[11px] text-[var(--color-text-tertiary)]">
                           by {entry.createdBy}
                         </span>
                       )}
                     </div>
                   </div>
                   <button
                     onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                     aria-expanded={isExpanded}
                     aria-label={isExpanded ? 'Collapse entry' : 'Expand entry'}
                     className="ml-3 h-7 px-2.5 flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-md transition-colors shrink-0"
                   >
                     {isExpanded ? (
                       <><ChevronUp size={12} /> Hide</>
                     ) : (
                       <><ChevronDown size={12} /> View</>
                     )}
                   </button>
                 </div>
                 {isExpanded && (
                   <div className="px-5 pb-4 border-t border-[var(--color-border-subtle)]">
                     <pre className="mt-3 text-[12px] text-[var(--color-text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
                       {entry.body}
                     </pre>
                   </div>
                 )}
               </div>
             );
           })}
         </div>
       )}
     </div>
   );
 }

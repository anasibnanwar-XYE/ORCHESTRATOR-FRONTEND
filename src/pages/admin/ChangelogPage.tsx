 /**
  * ChangelogPage — Changelog Management & What's New Banner
  *
  * Features:
  *  - Create changelog entry form: title, body (markdown), version tag, isHighlighted flag
  *  - Edit existing entries
  *  - Soft-delete entries
  *  - WhatsNewBanner: shown to users when there are unread entries
  *    (tracks last-read version in localStorage)
  *
  * Admin write endpoints: POST/PUT/DELETE /admin/changelog
  * Public read endpoint: GET /changelog (paginated list)
  * Highlight endpoint: GET /changelog/latest-highlighted
  */

 import { useState, useEffect, useCallback } from 'react';
 import {
   Plus,
   BookOpen,
   X,
   Tag,
   Calendar,
   Bell,
   AlertCircle,
   Pencil,
   RefreshCcw,
   Loader2,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Modal } from '@/components/ui/Modal';
 import { Badge } from '@/components/ui/Badge';
 import { useToast } from '@/components/ui/Toast';
 import { changelogApi } from '@/lib/adminApi';
 import type { ChangelogEntryResponse, ChangelogEntryRequest } from '@/types';

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
 // ChangelogPage
 // ─────────────────────────────────────────────────────────────────────────────

 interface EntryFormData {
   title: string;
   body: string;
   version: string;
   isHighlighted: boolean;
 }

 const emptyForm: EntryFormData = {
   title: '',
   body: '',
   version: '',
   isHighlighted: false,
 };

 type DialogMode = 'create' | 'edit';

 export function ChangelogPage() {
   const { success, error: toastError } = useToast();
   const [entries, setEntries] = useState<ChangelogEntryResponse[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);
   const [dialogMode, setDialogMode] = useState<DialogMode>('create');
   const [editingEntry, setEditingEntry] = useState<ChangelogEntryResponse | null>(null);
   const [showDialog, setShowDialog] = useState(false);
   const [form, setForm] = useState<EntryFormData>({ ...emptyForm });
   const [formError, setFormError] = useState<string | null>(null);
   const [isSaving, setIsSaving] = useState(false);
   const [expandedId, setExpandedId] = useState<number | null>(null);
   const [deletingId, setDeletingId] = useState<number | null>(null);

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

   // ── Dialog helpers ─────────────────────────────────────────────────────────

   const openCreate = () => {
     setDialogMode('create');
     setEditingEntry(null);
     setForm({ ...emptyForm });
     setFormError(null);
     setShowDialog(true);
   };

   const openEdit = (entry: ChangelogEntryResponse) => {
     setDialogMode('edit');
     setEditingEntry(entry);
     setForm({
       title: entry.title,
       body: entry.body,
       version: entry.version,
       isHighlighted: entry.isHighlighted ?? false,
     });
     setFormError(null);
     setShowDialog(true);
   };

   const closeDialog = () => {
     if (isSaving) return;
     setShowDialog(false);
     setForm({ ...emptyForm });
     setFormError(null);
     setEditingEntry(null);
   };

   // ── Submit ─────────────────────────────────────────────────────────────────

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!form.title.trim() || !form.body.trim() || !form.version.trim()) {
       setFormError('Title, body, and version are required.');
       return;
     }

     const payload: ChangelogEntryRequest = {
       title: form.title.trim(),
       body: form.body.trim(),
       version: form.version.trim(),
       isHighlighted: form.isHighlighted,
     };

     setIsSaving(true);
     setFormError(null);
     try {
       if (dialogMode === 'edit' && editingEntry) {
         await changelogApi.update(editingEntry.id, payload);
         success('Entry updated.');
       } else {
         await changelogApi.create(payload);
         success('Entry published.');
       }
       setShowDialog(false);
       setForm({ ...emptyForm });
       setEditingEntry(null);
       await load();
     } catch (err) {
       const msg = err instanceof Error ? err.message : 'Failed to save entry. Please try again.';
       setFormError(msg);
     } finally {
       setIsSaving(false);
     }
   };

   // ── Delete ─────────────────────────────────────────────────────────────────

   const handleDelete = async (id: number) => {
     setDeletingId(id);
     try {
       await changelogApi.remove(id);
       success('Entry removed.');
       await load();
     } catch {
       toastError('Failed to remove entry. Please try again.');
     } finally {
       setDeletingId(null);
     }
   };

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
             Publish updates visible to all users via the What&apos;s New banner
           </p>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" onClick={load} disabled={isLoading} className="gap-1.5">
             <RefreshCcw size={13} className={isLoading ? 'animate-spin' : ''} />
             Refresh
           </Button>
           <Button onClick={openCreate} disabled={isLoading}>
             <Plus size={15} className="mr-1.5" /> New Entry
           </Button>
         </div>
       </div>

       {/* Error state */}
       {loadError && !isLoading && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]">
           <AlertCircle size={16} className="shrink-0 text-[var(--color-error)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">{loadError}</p>
           <Button variant="ghost" size="sm" onClick={load} className="ml-auto shrink-0">Try again</Button>
         </div>
       )}

       {/* Loading state */}
       {isLoading && (
         <div className="flex flex-col items-center justify-center py-16 gap-3">
           <Loader2 size={20} className="animate-spin text-[var(--color-text-tertiary)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">Loading entries…</p>
         </div>
       )}

       {/* Entry list */}
       {!isLoading && !loadError && entries.length === 0 && (
         <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border-default)] py-16 gap-3">
           <BookOpen size={24} className="text-[var(--color-text-tertiary)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">No entries yet</p>
           <Button size="sm" variant="secondary" onClick={openCreate}>
             Create your first entry
           </Button>
         </div>
       )}

       {!isLoading && !loadError && entries.length > 0 && (
         <div className="space-y-3">
           {entries.map((entry) => {
             const isExpanded = expandedId === entry.id;
             const isDeleting = deletingId === entry.id;
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
                     <div className="flex items-center gap-3 mt-1">
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
                   <div className="flex items-center gap-1 shrink-0 ml-3">
                     <button
                       onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                       className="h-7 px-2.5 flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-md transition-colors"
                     >
                       {isExpanded ? 'Hide' : 'View'}
                     </button>
                     <button
                       onClick={() => openEdit(entry)}
                       aria-label="Edit entry"
                       className="h-7 w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-md transition-colors"
                     >
                       <Pencil size={12} />
                     </button>
                     <button
                       onClick={() => handleDelete(entry.id)}
                       disabled={isDeleting}
                       aria-label="Delete entry"
                       className="h-7 w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] rounded-md transition-colors disabled:opacity-50"
                     >
                       {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <X size={13} />}
                     </button>
                   </div>
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

       {/* Create / Edit Modal */}
       <Modal
         isOpen={showDialog}
         onClose={closeDialog}
         title={dialogMode === 'edit' ? 'Edit Changelog Entry' : 'Create Changelog Entry'}
         description={
           dialogMode === 'edit'
             ? 'Update this entry in the changelog feed.'
             : "Publish a new update to the What's New banner."
         }
         size="lg"
         footer={
           <>
             <Button variant="secondary" onClick={closeDialog} disabled={isSaving}>
               Cancel
             </Button>
             <Button type="submit" form="changelog-form" disabled={isSaving}>
               {isSaving
                 ? (dialogMode === 'edit' ? 'Saving…' : 'Publishing…')
                 : (dialogMode === 'edit' ? 'Save Changes' : 'Create Entry')}
             </Button>
           </>
         }
       >
         <form id="changelog-form" onSubmit={handleSubmit} className="space-y-4">
           <Input
             label="Title"
             required
             value={form.title}
             onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
             placeholder="e.g. New Features in v2.1"
           />
           <Input
             label="Version Tag"
             required
             value={form.version}
             onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
             placeholder="e.g. v2.1.0"
           />
           <div className="space-y-1.5">
             <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
               Body (Markdown supported)
             </label>
             <textarea
               required
               value={form.body}
               onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
               placeholder="## New Features&#10;&#10;- Added X&#10;- Improved Y"
               rows={7}
               className={clsx(
                 'w-full rounded-lg border border-[var(--color-border-default)] px-3 py-2.5',
                 'text-[13px] font-mono text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
                 'placeholder:text-[var(--color-text-tertiary)]',
                 'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
               )}
             />
           </div>
           <label className="flex items-center gap-2 cursor-pointer select-none">
             <input
               type="checkbox"
               checked={form.isHighlighted}
               onChange={(e) => setForm((f) => ({ ...f, isHighlighted: e.target.checked }))}
               className="h-4 w-4 rounded border-[var(--color-border-default)] accent-[var(--color-neutral-900)]"
             />
             <span className="text-[13px] text-[var(--color-text-primary)]">
               Highlight this entry in the What&apos;s New banner
             </span>
           </label>
           {formError && (
             <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)]">
               <AlertCircle size={14} />
               <p className="text-[12px]">{formError}</p>
             </div>
           )}
         </form>
       </Modal>
     </div>
   );
 }

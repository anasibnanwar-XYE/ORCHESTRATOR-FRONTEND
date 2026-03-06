 /**
  * ChangelogPage — Changelog Management & What's New Banner
  *
  * Features:
  *  - Create changelog entry form: title, body (markdown), version tag, publish date
  *  - List of all changelog entries (local state, admin-created)
  *  - WhatsNewBanner: shown to users when there are unread entries
  *    (tracks last-read version in localStorage)
  *
  * Note: The backend does not have a dedicated changelog endpoint.
  * Entries are stored in localStorage for this admin session.
  * The WhatsNewBanner is exported for use in other layouts.
  */
 
 import { useState, useEffect } from 'react';
 import {
   Plus,
   BookOpen,
   X,
   Tag,
   Calendar,
   Bell,
   AlertCircle,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Modal } from '@/components/ui/Modal';
 import { Badge } from '@/components/ui/Badge';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface ChangelogEntry {
   id: number;
   title: string;
   body: string;
   version: string;
   publishedAt: string;
   createdAt: string;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Storage helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 const STORAGE_KEY = 'o_changelog_entries';
 const READ_KEY = 'o_changelog_last_read';
 
 function loadEntries(): ChangelogEntry[] {
   try {
    const raw = safeLocalGet(STORAGE_KEY);
     return raw ? (JSON.parse(raw) as ChangelogEntry[]) : [];
   } catch {
     return [];
   }
 }
 
 function saveEntries(entries: ChangelogEntry[]) {
  safeLocalSet(STORAGE_KEY, JSON.stringify(entries));
 }
 
 function getLastReadId(): number {
  return Number(safeLocalGet(READ_KEY) ?? 0);
 }
 
 function markAsRead(latestId: number) {
  safeLocalSet(READ_KEY, String(latestId));
 }
 
 function safeLocalGet(key: string): string | null {
   try { return localStorage.getItem(key); } catch { return null; }
 }
 
 function safeLocalSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch (_e) { /* ignore storage errors */ }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // WhatsNewBanner
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface WhatsNewBannerProps {
   entries: ChangelogEntry[];
   onViewAll?: () => void;
 }
 
 export function WhatsNewBanner({ entries, onViewAll }: WhatsNewBannerProps) {
   const [visible, setVisible] = useState(false);
   const [unread, setUnread] = useState<ChangelogEntry[]>([]);
 
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
   publishedAt: string;
 }
 
 const emptyForm: EntryFormData = {
   title: '',
   body: '',
   version: '',
   publishedAt: new Date().toISOString().split('T')[0],
 };
 
 export function ChangelogPage() {
   const [entries, setEntries] = useState<ChangelogEntry[]>([]);
   const [showCreate, setShowCreate] = useState(false);
   const [form, setForm] = useState<EntryFormData>({ ...emptyForm });
   const [formError, setFormError] = useState<string | null>(null);
   const [expandedId, setExpandedId] = useState<number | null>(null);
 
   // Load from localStorage on mount
   useEffect(() => {
     setEntries(loadEntries());
   }, []);
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!form.title.trim() || !form.body.trim() || !form.version.trim()) {
       setFormError('Title, body, and version are required.');
       return;
     }
     const newEntry: ChangelogEntry = {
       id: Date.now(),
       title: form.title.trim(),
       body: form.body.trim(),
       version: form.version.trim(),
       publishedAt: form.publishedAt || new Date().toISOString().split('T')[0],
       createdAt: new Date().toISOString(),
     };
     const updated = [newEntry, ...entries];
     setEntries(updated);
     saveEntries(updated);
     setShowCreate(false);
     setForm({ ...emptyForm });
     setFormError(null);
   };
 
   const handleDelete = (id: number) => {
     const updated = entries.filter((e) => e.id !== id);
     setEntries(updated);
     saveEntries(updated);
   };
 
   const closeCreate = () => {
     setShowCreate(false);
     setForm({ ...emptyForm });
     setFormError(null);
   };
 
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
         <Button onClick={() => { setFormError(null); setShowCreate(true); }}>
           <Plus size={15} className="mr-1.5" /> New Entry
         </Button>
       </div>
 
       {/* Entry list */}
       {entries.length === 0 ? (
         <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border-default)] py-16 gap-3">
           <BookOpen size={24} className="text-[var(--color-text-tertiary)]" />
           <p className="text-[13px] text-[var(--color-text-secondary)]">No entries yet</p>
           <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)}>
             Create your first entry
           </Button>
         </div>
       ) : (
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
                     </div>
                     <div className="flex items-center gap-3 mt-1">
                       <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                         <Calendar size={10} />
                         {new Date(entry.publishedAt).toLocaleDateString('en-IN', {
                           day: 'numeric', month: 'short', year: 'numeric',
                         })}
                       </span>
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
                       onClick={() => handleDelete(entry.id)}
                       className="h-7 w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] rounded-md transition-colors"
                       aria-label="Delete entry"
                     >
                       <X size={13} />
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
 
       {/* Create Entry Modal */}
       <Modal
         isOpen={showCreate}
         onClose={closeCreate}
         title="Create Changelog Entry"
         description="Publish a new update to the What's New banner."
         size="lg"
         footer={
           <>
             <Button variant="secondary" onClick={closeCreate}>Cancel</Button>
             <Button type="submit" form="changelog-form">Create Entry</Button>
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
           <div className="grid grid-cols-2 gap-3">
             <Input
               label="Version Tag"
               required
               value={form.version}
               onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
               placeholder="e.g. v2.1.0"
             />
             <Input
               label="Publish Date"
               type="date"
               value={form.publishedAt}
               onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
             />
           </div>
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

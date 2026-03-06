 /**
  * DealerSupportTicketsPage — Support Tickets
  *
  * Dealer can:
  *  - View their support tickets list
  *  - Create a new ticket (subject, category, description)
  *  - See ticket reference number and Open status on submission
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import {
   LifeBuoy,
   RefreshCcw,
   AlertCircle,
   Plus,
    MessageSquare,
   X,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { dealerApi } from '@/lib/dealerApi';
 import { useToast } from '@/components/ui/Toast';
 import type { DealerSupportTicket, DealerSupportTicketCreateRequest } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtDate(iso: string | undefined): string {
   if (!iso) return '—';
   try {
     return format(new Date(iso), 'd MMM yyyy');
   } catch {
     return iso;
   }
 }
 
 const TICKET_CATEGORIES = [
   { value: 'SUPPORT', label: 'General Support' },
   { value: 'BUG', label: 'Bug / Issue' },
   { value: 'FEATURE_REQUEST', label: 'Feature Request' },
 ];
 
 function statusBadge(status: string | undefined) {
   if (!status) return null;
   const upper = status.toUpperCase();
   const cls = (() => {
     switch (upper) {
       case 'OPEN': return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
       case 'IN_PROGRESS': return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
       case 'RESOLVED': return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
       case 'CLOSED': return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]';
       default: return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
     }
   })();
   const label: Record<string, string> = {
     OPEN: 'Open',
     IN_PROGRESS: 'In Progress',
     RESOLVED: 'Resolved',
     CLOSED: 'Closed',
   };
   return (
     <span className={clsx('text-[10px] font-medium px-1.5 py-px rounded-full whitespace-nowrap', cls)}>
       {label[upper] ?? status}
     </span>
   );
 }
 
 function categoryLabel(cat: string | undefined): string {
   if (!cat) return '—';
   const found = TICKET_CATEGORIES.find((c) => c.value === cat);
   return found ? found.label : cat;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // New Ticket Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface NewTicketFormProps {
   onSubmit: (req: DealerSupportTicketCreateRequest) => Promise<void>;
   onCancel: () => void;
   isSubmitting: boolean;
 }
 
 interface TicketFormState {
   subject: string;
   category: string;
   description: string;
 }
 
 interface TicketFormErrors {
   subject?: string;
   category?: string;
   description?: string;
 }
 
 function NewTicketForm({ onSubmit, onCancel, isSubmitting }: NewTicketFormProps) {
   const [form, setForm] = useState<TicketFormState>({
     subject: '',
     category: 'SUPPORT',
     description: '',
   });
   const [errors, setErrors] = useState<TicketFormErrors>({});
 
   const validate = (): TicketFormErrors => {
     const e: TicketFormErrors = {};
     if (!form.subject.trim()) e.subject = 'Subject is required';
     if (!form.category) e.category = 'Category is required';
     if (!form.description.trim()) e.description = 'Description is required';
     return e;
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     const errs = validate();
     setErrors(errs);
     if (Object.keys(errs).length > 0) return;
     await onSubmit({
       subject: form.subject.trim(),
       category: form.category,
       description: form.description.trim(),
     });
   };
 
   return (
     <div className="p-5 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
       <div className="flex items-center justify-between mb-4">
         <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
           New support ticket
         </p>
         <button
           type="button"
           onClick={onCancel}
           className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
         >
           <X size={14} />
         </button>
       </div>
 
       <form onSubmit={handleSubmit} className="space-y-4">
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
             Subject
           </label>
           <input
             type="text"
             value={form.subject}
             onChange={(e) => {
               setForm((f) => ({ ...f, subject: e.target.value }));
               if (errors.subject) setErrors((err) => ({ ...err, subject: undefined }));
             }}
             maxLength={255}
             placeholder="Brief description of your issue"
             className={clsx(
               'w-full h-9 px-3 border rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none transition-colors',
               errors.subject
                 ? 'border-[var(--color-error)]'
                 : 'border-[var(--color-border-default)] focus:border-[var(--color-neutral-300)]',
             )}
           />
           {errors.subject && <p className="mt-1 text-[11px] text-[var(--color-error)]">{errors.subject}</p>}
         </div>
 
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
             Category
           </label>
           <select
             value={form.category}
             onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
             className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors"
           >
             {TICKET_CATEGORIES.map((c) => (
               <option key={c.value} value={c.value}>{c.label}</option>
             ))}
           </select>
         </div>
 
         <div>
           <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
             Description
           </label>
           <textarea
             value={form.description}
             onChange={(e) => {
               setForm((f) => ({ ...f, description: e.target.value }));
               if (errors.description) setErrors((err) => ({ ...err, description: undefined }));
             }}
             rows={4}
             maxLength={4000}
             placeholder="Describe your issue in detail..."
             className={clsx(
               'w-full px-3 py-2 border rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none transition-colors resize-none',
               errors.description
                 ? 'border-[var(--color-error)]'
                 : 'border-[var(--color-border-default)] focus:border-[var(--color-neutral-300)]',
             )}
           />
           {errors.description && <p className="mt-1 text-[11px] text-[var(--color-error)]">{errors.description}</p>}
         </div>
 
         <div className="flex items-center gap-2">
           <button
             type="submit"
             disabled={isSubmitting}
             className="h-9 px-5 bg-[var(--color-neutral-900)] text-white text-[13px] font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
           >
             {isSubmitting ? 'Submitting...' : 'Submit ticket'}
           </button>
           <button
             type="button"
             onClick={onCancel}
             className="h-9 px-4 text-[13px] font-medium bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] transition-colors"
           >
             Cancel
           </button>
         </div>
       </form>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function DealerSupportTicketsPage() {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [tickets, setTickets] = useState<DealerSupportTicket[]>([]);
   const [showForm, setShowForm] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const loadTickets = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await dealerApi.getTickets();
       setTickets(Array.isArray(data) ? data : []);
     } catch {
       setError("Couldn't load your support tickets. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadTickets();
   }, [loadTickets]);
 
   const handleCreateTicket = useCallback(async (req: DealerSupportTicketCreateRequest) => {
     setIsSubmitting(true);
     try {
       const created = await dealerApi.createTicket(req);
       setTickets((prev) => [created, ...prev]);
       setShowForm(false);
       toast({
         title: `Ticket created: ${created.publicId ?? `#${created.id}`}`,
         type: 'success',
       });
     } catch {
       toast({ title: 'Could not create support ticket', type: 'error' });
       throw new Error('create failed');
     } finally {
       setIsSubmitting(false);
     }
   }, [toast]);
 
   return (
     <div className="space-y-5">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div className="flex items-center justify-between gap-3">
         <div>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
             Help
           </p>
           <h1 className="mt-0.5 text-[20px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             Support Tickets
           </h1>
         </div>
         <div className="flex items-center gap-2">
           <button
             type="button"
             onClick={loadTickets}
             className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
             title="Refresh"
           >
             <RefreshCcw size={15} />
           </button>
           {!showForm && (
             <button
               type="button"
               onClick={() => setShowForm(true)}
               className="flex items-center gap-1.5 h-9 px-4 bg-[var(--color-neutral-900)] text-white text-[13px] font-medium rounded-lg hover:opacity-90 transition-opacity"
             >
               <Plus size={14} />
               New ticket
             </button>
           )}
         </div>
       </div>
 
       {/* ── New Ticket Form ─────────────────────────────────────────── */}
       {showForm && (
         <NewTicketForm
           onSubmit={handleCreateTicket}
           onCancel={() => setShowForm(false)}
           isSubmitting={isSubmitting}
         />
       )}
 
       {/* ── Error ───────────────────────────────────────────────────── */}
       {error && !isLoading && (
         <div className="flex items-start gap-3 p-4 bg-[var(--color-error-bg)] border border-[var(--color-error)] border-opacity-20 rounded-xl">
           <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-error)]" />
           <div className="flex-1 min-w-0">
             <p className="text-[13px] text-[var(--color-error)]">{error}</p>
             <button
               type="button"
               onClick={loadTickets}
               className="mt-1 text-[12px] font-medium text-[var(--color-error)] underline underline-offset-2"
             >
               Retry
             </button>
           </div>
         </div>
       )}
 
       {/* ── Tickets List ────────────────────────────────────────────── */}
       {!error && (
         <>
           {isLoading ? (
             <div className="space-y-2">
               {Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
                   <Skeleton width="60%" className="mb-2" />
                   <Skeleton width="30%" />
                 </div>
               ))}
             </div>
           ) : tickets.length === 0 ? (
             <div className="p-8 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl text-center">
               <LifeBuoy size={20} className="mx-auto mb-2 text-[var(--color-text-tertiary)]" />
               <p className="text-[13px] text-[var(--color-text-tertiary)]">
                 No support tickets yet. Create one if you need help.
               </p>
             </div>
           ) : (
             <div className="space-y-2">
               {tickets.map((ticket) => (
                 <div
                   key={ticket.id ?? ticket.publicId}
                   className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl"
                 >
                   <div className="flex items-start justify-between gap-2 mb-1.5">
                     <div className="flex items-start gap-2 min-w-0">
                       <MessageSquare size={14} className="mt-0.5 shrink-0 text-[var(--color-text-tertiary)]" />
                       <div className="min-w-0">
                         <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                           {ticket.subject ?? '—'}
                         </p>
                         <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                           Ref: <span className="font-medium text-[var(--color-text-secondary)]">
                             {ticket.publicId ?? `#${ticket.id}`}
                           </span>
                         </p>
                       </div>
                     </div>
                     {statusBadge(ticket.status)}
                   </div>
                   <div className="flex items-center gap-3 ml-5">
                     <span className="text-[11px] text-[var(--color-text-tertiary)]">
                       {categoryLabel(ticket.category)}
                     </span>
                     <span className="text-[var(--color-border-default)]">·</span>
                     <span className="text-[11px] text-[var(--color-text-tertiary)]">
                       {fmtDate(ticket.createdAt)}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </>
       )}
     </div>
   );
 }

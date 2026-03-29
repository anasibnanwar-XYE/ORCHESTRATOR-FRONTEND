 /**
  * DealerCreditRequestsPage — Submit Credit Request
  *
  * Allows the dealer to submit a credit limit increase request.
  * Shows a form (amount, justification) and a list of previously submitted requests.
  */
 
 import { useCallback, useState } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 
 import { dealerApi } from '@/lib/dealerApi';
 import { useToast } from '@/components/ui/Toast';
 import type { CreditRequestDto } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtCurrency(value: number | undefined): string {
   if (value === undefined || value === null) return '—';
   return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
 }
 
 function fmtDate(iso: string | undefined): string {
   if (!iso) return '—';
   try {
     return format(new Date(iso), 'd MMM yyyy');
   } catch {
     return iso;
   }
 }
 
 function statusBadge(status: string | undefined) {
   if (!status) return null;
   const upper = status.toUpperCase();
   const cls = (() => {
     switch (upper) {
       case 'PENDING': return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
       case 'APPROVED': return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
       case 'REJECTED': return 'bg-[var(--color-error-bg)] text-[var(--color-error)]';
       default: return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]';
     }
   })();
   return (
     <span className={clsx('text-[10px] font-medium px-1.5 py-px rounded-full whitespace-nowrap', cls)}>
       {upper.charAt(0) + upper.slice(1).toLowerCase()}
     </span>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Credit Request Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface FormState {
   amountRequested: string;
   reason: string;
 }
 
 interface FormErrors {
   amountRequested?: string;
 }
 
 interface CreditRequestFormProps {
   onSubmit: (amount: number, reason: string) => Promise<void>;
   isSubmitting: boolean;
 }
 
 function CreditRequestForm({ onSubmit, isSubmitting }: CreditRequestFormProps) {
   const [form, setForm] = useState<FormState>({ amountRequested: '', reason: '' });
   const [errors, setErrors] = useState<FormErrors>({});
   const [submitted, setSubmitted] = useState(false);
 
   const validate = (): FormErrors => {
     const e: FormErrors = {};
     if (!form.amountRequested || parseFloat(form.amountRequested) <= 0) {
       e.amountRequested = 'Enter a valid amount';
     }
     return e;
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     const errs = validate();
     setErrors(errs);
     if (Object.keys(errs).length > 0) return;
     await onSubmit(parseFloat(form.amountRequested), form.reason);
     setForm({ amountRequested: '', reason: '' });
     setErrors({});
     setSubmitted(true);
     setTimeout(() => setSubmitted(false), 4000);
   };
 
   return (
     <form onSubmit={handleSubmit} className="space-y-4">
       <div>
         <label
           htmlFor="amountRequested"
           className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5"
         >
           Requested amount
         </label>
         <div className="relative">
           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--color-text-tertiary)]">
             ₹
           </span>
           <input
             id="amountRequested"
             type="number"
             min="1"
             step="1000"
             value={form.amountRequested}
             onChange={(e) => {
               setForm((f) => ({ ...f, amountRequested: e.target.value }));
               if (errors.amountRequested) setErrors((err) => ({ ...err, amountRequested: undefined }));
             }}
             placeholder="0.00"
             className={clsx(
               'w-full h-9 pl-7 pr-3 border rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none transition-colors',
               errors.amountRequested
                 ? 'border-[var(--color-error)]'
                 : 'border-[var(--color-border-default)] focus:border-[var(--color-neutral-300)]',
             )}
           />
         </div>
         {errors.amountRequested && (
           <p className="mt-1 text-[11px] text-[var(--color-error)]">{errors.amountRequested}</p>
         )}
       </div>
 
       <div>
         <label
           htmlFor="reason"
           className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5"
         >
           Justification <span className="normal-case font-normal text-[var(--color-text-tertiary)]">(optional)</span>
         </label>
         <textarea
           id="reason"
           value={form.reason}
           onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
           rows={3}
           placeholder="Explain why you need the credit increase..."
           className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors resize-none"
         />
       </div>
 
       {submitted && (
         <div className="flex items-center gap-2 text-[var(--color-success)]">
           <CheckCircle size={14} />
           <span className="text-[12px]">Request submitted successfully</span>
         </div>
       )}
 
       <button
         type="submit"
         disabled={isSubmitting}
         className="h-9 px-5 bg-[var(--color-neutral-900)] text-white text-[13px] font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
       >
         {isSubmitting ? 'Submitting...' : 'Submit request'}
       </button>
     </form>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function DealerCreditRequestsPage() {
   const { toast } = useToast();
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [requests, setRequests] = useState<CreditRequestDto[]>([]);
 
 
   // Note: The dealer portal does not have a "list credit requests" endpoint in the API contract.
   // We maintain a local in-session list of submitted requests.
 
   const handleSubmit = useCallback(async (amount: number, reason: string) => {
     setIsSubmitting(true);
     try {
       const result = await dealerApi.createCreditRequest({
         amountRequested: amount,
         reason: reason || undefined,
       });
       setRequests((prev) => [result, ...prev]);
       toast({ title: 'Credit request submitted', type: 'success' });
     } catch {
       toast({ title: 'Could not submit credit request', type: 'error' });
       throw new Error('submit failed');
     } finally {
       setIsSubmitting(false);
     }
   }, [toast]);
 
   return (
     <div className="space-y-6">
       {/* ── Header ──────────────────────────────────────────────────── */}
       <div>
         <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
           Credit
         </p>
         <h1 className="mt-0.5 text-[20px] font-semibold text-[var(--color-text-primary)] tracking-tight">
           Credit Requests
         </h1>
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* ── Request Form ──────────────────────────────────────────── */}
         <div className="p-5 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
           <p className="text-[13px] font-medium text-[var(--color-text-primary)] mb-4">
             Request a credit limit increase
           </p>
           <CreditRequestForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
         </div>
 
         {/* ── Submitted Requests ────────────────────────────────────── */}
         <div>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
             Submitted requests
           </p>
           {requests.length === 0 ? (
             <div className="p-6 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl text-center">
               <CreditCard size={20} className="mx-auto mb-2 text-[var(--color-text-tertiary)]" />
               <p className="text-[13px] text-[var(--color-text-tertiary)]">
                 No credit requests submitted yet
               </p>
             </div>
           ) : (
             <div className="space-y-2">
               {requests.map((req) => (
                 <div
                   key={req.id ?? req.publicId}
                   className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl"
                 >
                   <div className="flex items-start justify-between gap-2 mb-1">
                     <span className="text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">
                       {fmtCurrency(req.amountRequested)}
                     </span>
                     {statusBadge(req.status)}
                   </div>
                   {req.reason && (
                     <p className="text-[12px] text-[var(--color-text-secondary)] mb-1 line-clamp-2">
                       {req.reason}
                     </p>
                   )}
                   <div className="flex items-center gap-2 flex-wrap">
                     {(req.publicId || req.id) && (
                       <span className="text-[11px] text-[var(--color-text-tertiary)]">
                         Ref: <span className="font-medium text-[var(--color-text-secondary)]">
                           {req.publicId ?? `#${req.id}`}
                         </span>
                       </span>
                     )}
                     <span className="text-[11px] text-[var(--color-text-tertiary)]">
                       {fmtDate(req.createdAt)}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </div>
     </div>
   );
 }

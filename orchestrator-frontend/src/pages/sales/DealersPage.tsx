 /**
  * DealersPage — Sales portal dealer management
  *
  * Tabs:
  *   Dealers — paginated table (name, code, region, credit limit, outstanding, status)
  *             search by name/code, create, edit, dunning hold/release toggle
  *   Aging    — aging report for selected dealer (Current/30/60/90/120+ buckets)
  *   Ledger   — chronological transactions with running balance for selected dealer
  *   Invoices — list of invoices for selected dealer
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import {
   Plus,
   Search,
   AlertCircle,
   RefreshCcw,
   X,
   ChevronDown,
   Lock,
   Unlock,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format } from 'date-fns';
 import { salesApi } from '@/lib/salesApi';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { useToast } from '@/components/ui/Toast';
 import type {
   DealerDto,
   CreateDealerRequest,
   PageResponse,
   DealerAgingDetailedReport,
   LedgerEntryDto,
   DealerInvoiceDto,
 } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function fmtCurrency(v?: number): string {
   if (v == null) return '—';
   return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
 }
 
 function fmtDate(iso?: string): string {
   if (!iso) return '—';
   try {
     return format(new Date(iso), 'dd MMM yyyy');
   } catch {
     return iso;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Status badge helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function DealerStatusBadge({ status, dunning }: { status?: string; dunning?: string }) {
   if (dunning && dunning.toUpperCase() !== 'NONE') {
     return (
       <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning)]">
         <Lock size={9} />
         On Hold
       </span>
     );
   }
   const isActive = !status || status.toUpperCase() === 'ACTIVE';
   return (
     <span className={clsx(
       'text-[10px] font-medium px-2 py-0.5 rounded-full',
       isActive
         ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
         : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]',
     )}>
       {isActive ? 'Active' : 'Inactive'}
     </span>
   );
 }
 
 function InvoiceStatusBadge({ status }: { status?: string }) {
   const s = status?.toUpperCase() ?? '';
   const cls = s === 'PAID'
     ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
     : s === 'OVERDUE'
       ? 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
       : s === 'OUTSTANDING'
         ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
         : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]';
   return (
     <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', cls)}>
       {status ?? '—'}
     </span>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Empty state
 // ─────────────────────────────────────────────────────────────────────────────
 
 function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
   return (
     <div className="flex flex-col items-center justify-center py-16 gap-3">
       <p className="text-[13px] text-[var(--color-text-secondary)]">{message}</p>
       {action}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Create / Edit Dealer Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface DealerFormProps {
   initial?: DealerDto;
   onSubmit: (data: CreateDealerRequest) => Promise<void>;
   onCancel: () => void;
   isSubmitting: boolean;
 }
 
 const EMPTY_FORM: CreateDealerRequest = {
   name: '',
   companyName: '',
   contactEmail: '',
   contactPhone: '',
   address: '',
   gstNumber: '',
   creditLimit: undefined,
   region: '',
   gstRegistrationType: 'REGULAR',
   paymentTerms: 'NET_30',
 };
 
 function DealerForm({ initial, onSubmit, onCancel, isSubmitting }: DealerFormProps) {
   const [form, setForm] = useState<CreateDealerRequest>(() => initial
     ? {
         name: initial.name ?? '',
         companyName: initial.companyName ?? '',
         contactEmail: initial.email ?? '',
         contactPhone: initial.phone ?? '',
         address: initial.address ?? '',
         gstNumber: initial.gstNumber ?? '',
         creditLimit: initial.creditLimit,
         region: initial.region ?? '',
         gstRegistrationType: initial.gstRegistrationType ?? 'REGULAR',
         paymentTerms: initial.paymentTerms ?? 'NET_30',
       }
     : EMPTY_FORM
   );
   const [errors, setErrors] = useState<Partial<Record<keyof CreateDealerRequest, string>>>({});
 
   const validate = () => {
     const e: typeof errors = {};
     if (!form.name.trim()) e.name = 'Name is required';
     if (!form.companyName.trim()) e.companyName = 'Company name is required';
     if (!form.contactEmail.trim()) e.contactEmail = 'Contact email is required';
     if (!form.contactPhone.trim()) e.contactPhone = 'Contact phone is required';
     return e;
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     const errs = validate();
     if (Object.keys(errs).length > 0) {
       setErrors(errs);
       return;
     }
     await onSubmit(form);
   };
 
   const set = (field: keyof CreateDealerRequest, value: string | number | undefined) => {
     setForm((f) => ({ ...f, [field]: value }));
     setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
   };
 
   return (
     <form onSubmit={handleSubmit} className="space-y-4">
       <div className="grid grid-cols-2 gap-3">
         <Input
           label="Name *"
           value={form.name}
           onChange={(e) => set('name', e.target.value)}
           error={errors.name}
           placeholder="Dealer name"
         />
         <Input
           label="Company *"
           value={form.companyName}
           onChange={(e) => set('companyName', e.target.value)}
           error={errors.companyName}
           placeholder="Company name"
         />
       </div>
       <div className="grid grid-cols-2 gap-3">
         <Input
           label="Contact Email *"
           type="email"
           value={form.contactEmail}
           onChange={(e) => set('contactEmail', e.target.value)}
           error={errors.contactEmail}
           placeholder="email@example.com"
         />
         <Input
           label="Contact Phone *"
           value={form.contactPhone}
           onChange={(e) => set('contactPhone', e.target.value)}
           error={errors.contactPhone}
           placeholder="+91 99999 99999"
         />
       </div>
       <Input
         label="Address"
         value={form.address ?? ''}
         onChange={(e) => set('address', e.target.value)}
         placeholder="Registered address"
       />
       <div className="grid grid-cols-2 gap-3">
         <Input
           label="GST Number"
           value={form.gstNumber ?? ''}
           onChange={(e) => set('gstNumber', e.target.value)}
           placeholder="22AAAAA0000A1Z5"
         />
         <Input
           label="Region"
           value={form.region ?? ''}
           onChange={(e) => set('region', e.target.value)}
           placeholder="North, South..."
         />
       </div>
       <div className="grid grid-cols-2 gap-3">
         <div className="space-y-1.5">
           <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">GST Type</label>
           <select
             value={form.gstRegistrationType ?? 'REGULAR'}
             onChange={(e) => set('gstRegistrationType', e.target.value as CreateDealerRequest['gstRegistrationType'])}
             className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors"
           >
             <option value="REGULAR">Regular</option>
             <option value="COMPOSITION">Composition</option>
             <option value="UNREGISTERED">Unregistered</option>
           </select>
         </div>
         <div className="space-y-1.5">
           <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">Payment Terms</label>
           <select
             value={form.paymentTerms ?? 'NET_30'}
             onChange={(e) => set('paymentTerms', e.target.value as CreateDealerRequest['paymentTerms'])}
             className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors"
           >
             <option value="NET_30">Net 30</option>
             <option value="NET_60">Net 60</option>
             <option value="NET_90">Net 90</option>
           </select>
         </div>
       </div>
       <Input
         label="Credit Limit (₹)"
         type="number"
         min="0"
         step="1000"
         value={form.creditLimit ?? ''}
         onChange={(e) => set('creditLimit', e.target.value ? Number(e.target.value) : undefined)}
         placeholder="e.g. 500000"
       />
       <div className="flex justify-end gap-2 pt-1">
         <button
           type="button"
           onClick={onCancel}
           className="h-9 px-4 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
         >
           Cancel
         </button>
         <button
           type="submit"
           disabled={isSubmitting}
           className="h-9 px-5 rounded-lg text-[13px] font-medium bg-[var(--color-neutral-900)] text-white hover:bg-[var(--color-neutral-700)] disabled:opacity-50 transition-colors dark:bg-white dark:text-[var(--color-neutral-900)]"
         >
           {isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Create dealer'}
         </button>
       </div>
     </form>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Aging Report sub-panel
 // ─────────────────────────────────────────────────────────────────────────────
 
 function AgingPanel({ dealerId }: { dealerId: number }) {
   const [data, setData] = useState<DealerAgingDetailedReport | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     let active = true;
     setLoading(true);
     setError(null);
     salesApi.getDealerAging(dealerId)
       .then((d) => { if (active) setData(d); })
       .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Unable to load aging'); })
       .finally(() => { if (active) setLoading(false); });
     return () => { active = false; };
   }, [dealerId]);
 
   if (loading) {
     return (
       <div className="space-y-2 py-4">
         {Array.from({ length: 5 }).map((_, i) => (
           <Skeleton key={i} className="h-8 w-full" />
         ))}
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="flex items-center gap-2 text-[12px] text-[var(--color-error)] py-4">
         <AlertCircle size={13} />
         {error}
       </div>
     );
   }
 
   if (!data) return null;
 
   const buckets = [
     { label: 'Current', value: data.buckets?.current },
     { label: '1–30 days', value: data.buckets?.days1to30 },
     { label: '31–60 days', value: data.buckets?.days31to60 },
     { label: '61–90 days', value: data.buckets?.days61to90 },
     { label: '90+ days', value: data.buckets?.over90 },
   ];
 
   const total = data.totalOutstanding ?? 0;
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <p className="text-[13px] text-[var(--color-text-secondary)]">
           Total outstanding: <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">{fmtCurrency(total)}</span>
         </p>
         {data.averageDSO != null && (
           <p className="text-[12px] text-[var(--color-text-tertiary)]">
             Average DSO: <span className="tabular-nums">{data.averageDSO.toFixed(1)} days</span>
           </p>
         )}
       </div>
 
       {/* Bucket summary */}
       <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
         {buckets.map((b) => {
           const pct = total > 0 ? ((b.value ?? 0) / total) * 100 : 0;
           const isOverdue = b.label !== 'Current';
           return (
             <div key={b.label} className="p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
               <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">{b.label}</p>
               <p className={clsx(
                 'text-[15px] font-semibold mt-1 tabular-nums',
                 isOverdue && (b.value ?? 0) > 0
                   ? 'text-[var(--color-warning)]'
                   : 'text-[var(--color-text-primary)]',
               )}>
                 {fmtCurrency(b.value)}
               </p>
               {total > 0 && (
                 <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 tabular-nums">{pct.toFixed(1)}%</p>
               )}
             </div>
           );
         })}
       </div>
 
       {/* Line items */}
       {data.lineItems && data.lineItems.length > 0 && (
         <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] bg-[var(--color-surface-secondary)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border-default)]">
             <span>Invoice</span>
             <span>Issue Date</span>
             <span>Due Date</span>
             <span className="text-right">Amount</span>
             <span className="text-right">Outstanding</span>
             <span className="text-right">Days Overdue</span>
           </div>
           {data.lineItems.map((item, idx) => (
             <div key={idx} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 text-[13px] border-b last:border-0 border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)] transition-colors">
               <span className="font-medium text-[var(--color-text-primary)]">{item.invoiceNumber ?? `#${item.invoiceId}`}</span>
               <span className="text-[var(--color-text-secondary)] sm:block hidden">{fmtDate(item.issueDate)}</span>
               <span className="text-[var(--color-text-secondary)] sm:block hidden">{fmtDate(item.dueDate)}</span>
               <span className="text-right tabular-nums text-[var(--color-text-primary)] sm:block hidden">{fmtCurrency(item.amount)}</span>
               <span className="text-right tabular-nums font-medium text-[var(--color-text-primary)]">{fmtCurrency(item.outstanding)}</span>
               <span className={clsx(
                 'text-right tabular-nums sm:block hidden',
                 (item.daysOverdue ?? 0) > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-tertiary)]',
               )}>
                 {item.daysOverdue ?? 0}d
               </span>
             </div>
           ))}
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Ledger sub-panel
 // ─────────────────────────────────────────────────────────────────────────────
 
 function LedgerPanel({ dealerId }: { dealerId: number }) {
   const [entries, setEntries] = useState<LedgerEntryDto[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     let active = true;
     setLoading(true);
     setError(null);
     salesApi.getDealerLedger(dealerId)
       .then((d) => { if (active) setEntries(d); })
       .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Unable to load ledger'); })
       .finally(() => { if (active) setLoading(false); });
     return () => { active = false; };
   }, [dealerId]);
 
   if (loading) {
     return (
       <div className="space-y-2 py-4">
         {Array.from({ length: 6 }).map((_, i) => (
           <Skeleton key={i} className="h-8 w-full" />
         ))}
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="flex items-center gap-2 text-[12px] text-[var(--color-error)] py-4">
         <AlertCircle size={13} />
         {error}
       </div>
     );
   }
 
   if (entries.length === 0) {
     return <EmptyState message="No ledger entries found." />;
   }
 
   return (
     <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
       <div className="hidden sm:grid grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr] bg-[var(--color-surface-secondary)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border-default)]">
         <span>Date</span>
         <span>Reference</span>
         <span className="sm:hidden">—</span>
         <span className="hidden sm:block">Description</span>
         <span className="text-right">Debit</span>
         <span className="text-right">Credit</span>
         <span className="text-right">Balance</span>
       </div>
       {entries.map((entry, idx) => (
         <div key={idx} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr] px-4 py-3 text-[13px] border-b last:border-0 border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)] transition-colors">
           <span className="text-[var(--color-text-secondary)]">{fmtDate(entry.date)}</span>
           <span className="font-medium text-[var(--color-text-primary)]">{entry.reference ?? '—'}</span>
           <span className="text-[var(--color-text-tertiary)] hidden sm:block col-span-1">—</span>
           <span className={clsx(
             'text-right tabular-nums sm:block hidden',
             (entry.debit ?? 0) > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]',
           )}>
             {(entry.debit ?? 0) > 0 ? fmtCurrency(entry.debit) : '—'}
           </span>
           <span className={clsx(
             'text-right tabular-nums sm:block hidden',
             (entry.credit ?? 0) > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]',
           )}>
             {(entry.credit ?? 0) > 0 ? fmtCurrency(entry.credit) : '—'}
           </span>
           <span className="text-right tabular-nums font-medium text-[var(--color-text-primary)]">
             {fmtCurrency(entry.balance)}
           </span>
         </div>
       ))}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Invoices sub-panel
 // ─────────────────────────────────────────────────────────────────────────────
 
 function InvoicesPanel({ dealerId }: { dealerId: number }) {
   const [invoices, setInvoices] = useState<DealerInvoiceDto[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     let active = true;
     setLoading(true);
     setError(null);
     salesApi.getDealerInvoices(dealerId)
       .then((d) => { if (active) setInvoices(d); })
       .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Unable to load invoices'); })
       .finally(() => { if (active) setLoading(false); });
     return () => { active = false; };
   }, [dealerId]);
 
   if (loading) {
     return (
       <div className="space-y-2 py-4">
         {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="flex items-center gap-2 text-[12px] text-[var(--color-error)] py-4">
         <AlertCircle size={13} />
         {error}
       </div>
     );
   }
 
   if (invoices.length === 0) {
     return <EmptyState message="No invoices found for this dealer." />;
   }
 
   return (
     <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
       <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] bg-[var(--color-surface-secondary)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border-default)]">
         <span>Invoice</span>
         <span>Issue Date</span>
         <span>Due Date</span>
         <span className="text-right">Amount</span>
         <span>Status</span>
       </div>
       {invoices.map((inv) => (
         <div key={inv.id} className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] px-4 py-3 text-[13px] border-b last:border-0 border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)] transition-colors">
           <span className="font-medium text-[var(--color-text-primary)]">{inv.invoiceNumber ?? inv.publicId ?? `#${inv.id}`}</span>
           <span className="text-[var(--color-text-secondary)] hidden sm:block">{fmtDate(inv.issueDate)}</span>
           <span className="text-[var(--color-text-secondary)] hidden sm:block">{fmtDate(inv.dueDate)}</span>
           <span className="text-right tabular-nums font-medium text-[var(--color-text-primary)] hidden sm:block">{fmtCurrency(inv.totalAmount)}</span>
           <span><InvoiceStatusBadge status={inv.status} /></span>
         </div>
       ))}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Dealer Detail View (tabs: aging, ledger, invoices)
 // ─────────────────────────────────────────────────────────────────────────────
 
 type DealerDetailTab = 'aging' | 'ledger' | 'invoices';
 
 function DealerDetailView({
  dealer,
  onDunningToggle,
}: {
  dealer: DealerDto;
  onClose: () => void;
  onDunningToggle: (dealer: DealerDto) => void;
}) {
   const [activeTab, setActiveTab] = useState<DealerDetailTab>('aging');
 
   const isOnHold = dealer.dunningStatus && dealer.dunningStatus.toUpperCase() !== 'NONE';
 
   const tabs: { id: DealerDetailTab; label: string }[] = [
     { id: 'aging', label: 'Aging Report' },
     { id: 'ledger', label: 'Ledger' },
     { id: 'invoices', label: 'Invoices' },
   ];
 
   return (
     <div className="space-y-5">
       {/* Dealer summary */}
       <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
         <div>
           <div className="flex items-center gap-2 flex-wrap">
             <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{dealer.name}</h2>
             <DealerStatusBadge status={dealer.status} dunning={dealer.dunningStatus} />
           </div>
           <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
             {dealer.code && <span className="font-mono mr-2">{dealer.code}</span>}
             {dealer.region && <span>{dealer.region}</span>}
           </p>
         </div>
         <button
           type="button"
           onClick={() => onDunningToggle(dealer)}
           className={clsx(
             'flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-colors self-start',
             isOnHold
               ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] hover:bg-[var(--color-success-bg)]'
               : 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] hover:bg-[var(--color-warning-bg)]',
           )}
         >
           {isOnHold ? <><Unlock size={13} /> Release hold</> : <><Lock size={13} /> Place on hold</>}
         </button>
       </div>
 
       {/* Credit info bar */}
       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
         <div className="p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
           <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Credit Limit</p>
           <p className="text-[15px] font-semibold mt-1 tabular-nums text-[var(--color-text-primary)]">{fmtCurrency(dealer.creditLimit)}</p>
         </div>
         <div className="p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
           <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Outstanding</p>
           <p className="text-[15px] font-semibold mt-1 tabular-nums text-[var(--color-text-primary)]">{fmtCurrency(dealer.outstandingBalance)}</p>
         </div>
         <div className="p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
           <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Available</p>
           <p className="text-[15px] font-semibold mt-1 tabular-nums text-[var(--color-text-primary)]">
             {fmtCurrency((dealer.creditLimit ?? 0) - (dealer.outstandingBalance ?? 0))}
           </p>
         </div>
       </div>
 
       {/* Tabs */}
       <div className="border-b border-[var(--color-border-default)]">
         <div className="flex gap-1 overflow-x-auto no-scrollbar">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               type="button"
               onClick={() => setActiveTab(tab.id)}
               className={clsx(
                 'px-4 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors',
                 activeTab === tab.id
                   ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                   : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
               )}
             >
               {tab.label}
             </button>
           ))}
         </div>
       </div>
 
       {/* Tab content */}
       <div>
         {activeTab === 'aging' && <AgingPanel dealerId={dealer.id} />}
         {activeTab === 'ledger' && <LedgerPanel dealerId={dealer.id} />}
         {activeTab === 'invoices' && <InvoicesPanel dealerId={dealer.id} />}
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Skeleton rows
 // ─────────────────────────────────────────────────────────────────────────────
 
 function SkeletonRows({ count = 5 }: { count?: number }) {
   return (
     <>
       {Array.from({ length: count }).map((_, i) => (
         <tr key={i} className="border-b border-[var(--color-border-subtle)]">
           {Array.from({ length: 6 }).map((_, j) => (
             <td key={j} className="px-4 py-3">
               <Skeleton className="h-4 w-full" />
             </td>
           ))}
         </tr>
       ))}
     </>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function DealersPage() {
   const { success: toastSuccess, error: toastError } = useToast();
 
   // List state
   const [dealers, setDealers] = useState<DealerDto[]>([]);
   const [total, setTotal] = useState(0);
   const [page, setPage] = useState(0);
   const PAGE_SIZE = 20;
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   // Search
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState<DealerDto[] | null>(null);
   const [isSearching, setIsSearching] = useState(false);
 
   // Modals
   const [createOpen, setCreateOpen] = useState(false);
   const [editTarget, setEditTarget] = useState<DealerDto | null>(null);
   const [detailTarget, setDetailTarget] = useState<DealerDto | null>(null);
   const [dunningTarget, setDunningTarget] = useState<DealerDto | null>(null);
 
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isDunningLoading, setIsDunningLoading] = useState(false);
 
   // ── Load paginated list ──
   const load = useCallback(async (p = 0) => {
     setLoading(true);
     setError(null);
     try {
       const result: PageResponse<DealerDto> = await salesApi.listDealers({ page: p, size: PAGE_SIZE });
       setDealers(result.content ?? []);
       setTotal(result.totalElements ?? 0);
       setPage(p);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Unable to load dealers');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => {
     load(0);
   }, [load]);
 
   // ── Search ──
   useEffect(() => {
     if (!searchQuery.trim()) {
       setSearchResults(null);
       return;
     }
     setIsSearching(true);
     const handle = setTimeout(() => {
       salesApi.searchDealersManagement(searchQuery)
         .then((res) => setSearchResults(res))
         .catch(() => setSearchResults([]))
         .finally(() => setIsSearching(false));
     }, 300);
     return () => clearTimeout(handle);
   }, [searchQuery]);
 
   const displayedDealers = searchResults ?? dealers;
 
   // ── Create dealer ──
   const handleCreate = async (data: CreateDealerRequest) => {
     setIsSubmitting(true);
     try {
       await salesApi.createDealer(data);
       toastSuccess('Dealer created successfully');
       setCreateOpen(false);
       load(0);
     } catch (err) {
       toastError(err instanceof Error ? err.message : 'Failed to create dealer');
     } finally {
       setIsSubmitting(false);
     }
   };
 
   // ── Update dealer ──
   const handleUpdate = async (data: CreateDealerRequest) => {
     if (!editTarget) return;
     setIsSubmitting(true);
     try {
       await salesApi.updateDealer(editTarget.id, data);
       toastSuccess('Dealer updated');
       setEditTarget(null);
       load(page);
     } catch (err) {
       toastError(err instanceof Error ? err.message : 'Failed to update dealer');
     } finally {
       setIsSubmitting(false);
     }
   };
 
   // ── Dunning hold/release ──
   const handleDunningToggle = useCallback((dealer: DealerDto) => {
     setDunningTarget(dealer);
   }, []);
 
   const confirmDunning = async () => {
     if (!dunningTarget) return;
     setIsDunningLoading(true);
     try {
       await salesApi.holdDealerDunning(dunningTarget.id);
       const isOnHold = dunningTarget.dunningStatus && dunningTarget.dunningStatus.toUpperCase() !== 'NONE';
       toastSuccess(isOnHold ? 'Dunning hold released' : 'Dealer placed on dunning hold');
       setDunningTarget(null);
       // If this dealer is currently shown in detail view, close it to refresh
       if (detailTarget?.id === dunningTarget.id) setDetailTarget(null);
       load(page);
     } catch (err) {
       toastError(err instanceof Error ? err.message : 'Failed to toggle dunning');
     } finally {
       setIsDunningLoading(false);
     }
   };
 
   const totalPages = Math.ceil(total / PAGE_SIZE);
   const isOnHoldTarget = dunningTarget?.dunningStatus && dunningTarget.dunningStatus.toUpperCase() !== 'NONE';
 
   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Dealers</h1>
           <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
             Manage dealer accounts, credit limits, aging, and dunning.
           </p>
         </div>
         <button
           type="button"
           onClick={() => setCreateOpen(true)}
           className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-medium bg-[var(--color-neutral-900)] text-white hover:bg-[var(--color-neutral-700)] transition-colors dark:bg-white dark:text-[var(--color-neutral-900)]"
         >
           <Plus size={14} />
           New dealer
         </button>
       </div>
 
       {/* Search */}
       <div className="relative max-w-sm">
         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
         <input
           type="text"
           placeholder="Search by name or code"
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           className="w-full h-9 pl-9 pr-9 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors"
         />
         {searchQuery && (
           <button
             type="button"
             onClick={() => setSearchQuery('')}
             className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
           >
             <X size={13} />
           </button>
         )}
       </div>
 
       {/* Error */}
       {error && (
         <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={14} />
           <span>{error}</span>
           <button
             type="button"
             onClick={() => load(page)}
             className="ml-auto flex items-center gap-1 text-[12px] underline"
           >
             <RefreshCcw size={12} /> Retry
           </button>
         </div>
       )}
 
       {/* Desktop table */}
       <div className="hidden sm:block rounded-xl border border-[var(--color-border-default)] overflow-hidden bg-[var(--color-surface-primary)]">
         <table className="w-full text-[13px]">
           <thead>
             <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-default)]">
               <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Name</th>
               <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Code</th>
               <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Region</th>
               <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Credit Limit</th>
               <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Outstanding</th>
               <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Status</th>
               <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-[var(--color-border-subtle)]">
             {loading || isSearching ? (
               <SkeletonRows count={5} />
             ) : displayedDealers.length === 0 ? (
               <tr>
                 <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[var(--color-text-secondary)]">
                   {searchQuery ? 'No dealers match your search.' : 'No dealers yet. Create your first dealer to get started.'}
                 </td>
               </tr>
             ) : (
               displayedDealers.map((dealer) => (
                 <tr
                   key={dealer.id}
                   className="hover:bg-[var(--color-surface-secondary)] cursor-pointer transition-colors"
                   onClick={() => setDetailTarget(dealer)}
                 >
                   <td className="px-4 py-3">
                     <p className="font-medium text-[var(--color-text-primary)]">{dealer.name ?? '—'}</p>
                     <p className="text-[11px] text-[var(--color-text-tertiary)]">{dealer.companyName ?? ''}</p>
                   </td>
                   <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-text-secondary)]">{dealer.code ?? '—'}</td>
                   <td className="px-4 py-3 text-[var(--color-text-secondary)]">{dealer.region ?? '—'}</td>
                   <td className="px-4 py-3 text-right tabular-nums font-medium text-[var(--color-text-primary)]">{fmtCurrency(dealer.creditLimit)}</td>
                   <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-primary)]">{fmtCurrency(dealer.outstandingBalance)}</td>
                   <td className="px-4 py-3">
                     <DealerStatusBadge status={dealer.status} dunning={dealer.dunningStatus} />
                   </td>
                   <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                     <DealerRowActions
                       dealer={dealer}
                       onEdit={() => setEditTarget(dealer)}
                       onDunning={() => handleDunningToggle(dealer)}
                     />
                   </td>
                 </tr>
               ))
             )}
           </tbody>
         </table>
       </div>
 
       {/* Mobile card list */}
       <div className="sm:hidden space-y-2">
         {loading || isSearching ? (
           Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
         ) : displayedDealers.length === 0 ? (
           <EmptyState message={searchQuery ? 'No dealers match your search.' : 'No dealers yet.'} />
         ) : (
           displayedDealers.map((dealer) => (
             <div
               key={dealer.id}
               className="p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] cursor-pointer"
               onClick={() => setDetailTarget(dealer)}
             >
               <div className="flex items-start justify-between gap-2">
                 <div>
                   <p className="font-medium text-[var(--color-text-primary)] text-[13px]">{dealer.name ?? '—'}</p>
                   <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{dealer.code} · {dealer.region ?? '—'}</p>
                 </div>
                 <DealerStatusBadge status={dealer.status} dunning={dealer.dunningStatus} />
               </div>
               <div className="flex items-center gap-4 mt-2">
                 <div>
                   <p className="text-[10px] text-[var(--color-text-tertiary)]">Credit</p>
                   <p className="text-[12px] tabular-nums font-medium text-[var(--color-text-primary)]">{fmtCurrency(dealer.creditLimit)}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-[var(--color-text-tertiary)]">Outstanding</p>
                   <p className="text-[12px] tabular-nums font-medium text-[var(--color-text-primary)]">{fmtCurrency(dealer.outstandingBalance)}</p>
                 </div>
               </div>
             </div>
           ))
         )}
       </div>
 
       {/* Pagination */}
       {!searchQuery && totalPages > 1 && (
         <div className="flex items-center justify-between text-[13px]">
           <span className="text-[var(--color-text-tertiary)]">
             Page {page + 1} of {totalPages} · {total} dealers
           </span>
           <div className="flex gap-2">
             <button
               type="button"
               disabled={page === 0}
               onClick={() => load(page - 1)}
               className="h-8 px-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-40 transition-colors"
             >
               Previous
             </button>
             <button
               type="button"
               disabled={page >= totalPages - 1}
               onClick={() => load(page + 1)}
               className="h-8 px-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-40 transition-colors"
             >
               Next
             </button>
           </div>
         </div>
       )}
 
       {/* Create Dealer Modal */}
       <Modal
         isOpen={createOpen}
         onClose={() => setCreateOpen(false)}
         title="New dealer"
         description="Create a dealer account"
         size="xl"
       >
         <DealerForm
           onSubmit={handleCreate}
           onCancel={() => setCreateOpen(false)}
           isSubmitting={isSubmitting}
         />
       </Modal>
 
       {/* Edit Dealer Modal */}
       {editTarget && (
         <Modal
           isOpen
           onClose={() => setEditTarget(null)}
           title="Edit dealer"
           size="xl"
         >
           <DealerForm
             initial={editTarget}
             onSubmit={handleUpdate}
             onCancel={() => setEditTarget(null)}
             isSubmitting={isSubmitting}
           />
         </Modal>
       )}
 
       {/* Dealer Detail Drawer-Modal */}
       {detailTarget && (
         <Modal
           isOpen
           onClose={() => setDetailTarget(null)}
           size="xl"
         >
           <DealerDetailView
             dealer={detailTarget}
             onClose={() => setDetailTarget(null)}
             onDunningToggle={handleDunningToggle}
           />
         </Modal>
       )}
 
       {/* Dunning confirm */}
       <ConfirmDialog
         isOpen={!!dunningTarget}
         title={isOnHoldTarget ? 'Release dunning hold' : 'Place on dunning hold'}
        message={
          isOnHoldTarget
            ? `Release the dunning hold on ${dunningTarget?.name}? They will be able to place new orders.`
            : `Place ${dunningTarget?.name} on dunning hold? They will be blocked from new orders.`
        }
         confirmLabel={isOnHoldTarget ? 'Release hold' : 'Place on hold'}
         variant={isOnHoldTarget ? 'default' : 'danger'}
         isLoading={isDunningLoading}
         onConfirm={confirmDunning}
         onCancel={() => setDunningTarget(null)}
       />
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Row Actions dropdown
 // ─────────────────────────────────────────────────────────────────────────────
 
 function DealerRowActions({
   dealer,
   onEdit,
   onDunning,
 }: {
   dealer: DealerDto;
   onEdit: () => void;
   onDunning: () => void;
 }) {
   const [open, setOpen] = useState(false);
   const isOnHold = dealer.dunningStatus && dealer.dunningStatus.toUpperCase() !== 'NONE';
 
   return (
     <div className="relative flex justify-end">
       <button
         type="button"
         onClick={() => setOpen(!open)}
         className="h-7 px-2 rounded-md text-[11px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors flex items-center gap-1"
       >
         Actions <ChevronDown size={12} />
       </button>
       {open && (
         <>
           <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
           <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] shadow-lg py-1">
             <button
               type="button"
               onClick={() => { setOpen(false); onEdit(); }}
               className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
             >
               Edit details
             </button>
             <button
               type="button"
               onClick={() => { setOpen(false); onDunning(); }}
               className={clsx(
                 'w-full text-left px-3 py-2 text-[12px] transition-colors',
                 isOnHold
                   ? 'text-[var(--color-success)] hover:bg-[var(--color-success-bg)]'
                   : 'text-[var(--color-warning)] hover:bg-[var(--color-warning-bg)]',
               )}
             >
               {isOnHold ? 'Release hold' : 'Place on hold'}
             </button>
           </div>
         </>
       )}
     </div>
   );
 }

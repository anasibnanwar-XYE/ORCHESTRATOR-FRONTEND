 /**
  * InvoiceDetailPage
  *
  * Shows full invoice detail with:
  *  - Header: invoice number, status, dealer, dates
  *  - Line items table: product, qty, price, tax, total
  *  - Totals: subtotal, tax, total, outstanding
  *  - PDF download action (fetch as blob → create download link)
  *  - Email sending dialog (pre-filled dealer name, single-click send)
  *
  * API:
  *  GET  /api/v1/invoices/{id}
  *  GET  /api/v1/invoices/{id}/pdf   → Blob
  *  POST /api/v1/invoices/{id}/email
  */

 import { useEffect, useState, useCallback } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import {
   ArrowLeft,
   Download,
   Mail,
   AlertCircle,
   RefreshCcw,
   CheckCircle2,
 } from 'lucide-react';
 import { format, parseISO } from 'date-fns';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { invoicesApi, type InvoiceDto } from '@/lib/reportsApi';
import { downloadBlob } from '@/utils/mobileUtils';

 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 function formatDate(dateStr: string | null | undefined): string {
   if (!dateStr) return '—';
   try {
     return format(parseISO(dateStr), 'dd MMM yyyy');
   } catch {
     return dateStr;
   }
 }

 function InvoiceStatusBadge({ status }: { status: string }) {
   const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default' | 'info'; label: string }> = {
     DRAFT: { variant: 'default', label: 'Draft' },
     SENT: { variant: 'info', label: 'Sent' },
     PAID: { variant: 'success', label: 'Paid' },
     OVERDUE: { variant: 'danger', label: 'Overdue' },
   };
   const { variant, label } = map[status] ?? { variant: 'default', label: status };
   return <Badge variant={variant} dot>{label}</Badge>;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Email Dialog
 // ─────────────────────────────────────────────────────────────────────────────

 interface EmailDialogProps {
   isOpen: boolean;
   onClose: () => void;
   invoice: InvoiceDto;
 }

 function EmailDialog({ isOpen, onClose, invoice }: EmailDialogProps) {
   const toast = useToast();
   const [isSending, setIsSending] = useState(false);
   const [subject, setSubject] = useState(
     `Invoice ${invoice.invoiceNumber} from Orchestrator ERP`
   );
   const [message, setMessage] = useState(
     `Dear ${invoice.dealerName},\n\nPlease find attached invoice ${invoice.invoiceNumber} for ${formatINR(invoice.totalAmount)}.\n\nKind regards,\nOrchestrator ERP`
   );

   const handleSend = async () => {
     setIsSending(true);
     try {
       await invoicesApi.sendInvoiceEmail(invoice.id);
       toast.success('Invoice sent', `Invoice ${invoice.invoiceNumber} was emailed to ${invoice.dealerName}.`);
       onClose();
     } catch {
       toast.error('Failed to send email', 'Please try again or contact support.');
     } finally {
       setIsSending(false);
     }
   };

   return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       title="Send Invoice by Email"
       description={`Compose email for ${invoice.invoiceNumber}`}
       size="md"
       footer={
         <>
           <Button variant="ghost" size="sm" onClick={onClose} disabled={isSending}>
             Cancel
           </Button>
           <Button
             variant="primary"
             size="sm"
             leftIcon={<Mail size={14} />}
             isLoading={isSending}
             onClick={handleSend}
           >
             Send Invoice
           </Button>
         </>
       }
     >
       <div className="space-y-4">
         {/* Recipient (read-only) */}
         <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-between gap-3">
           <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)] shrink-0">To</span>
           <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{invoice.dealerName}</span>
         </div>

         {/* Subject */}
         <Input
           label="Subject"
           value={subject}
           onChange={(e) => setSubject(e.target.value)}
           placeholder="Email subject"
         />

         {/* Message body */}
         <div className="space-y-1.5">
           <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
             Message
           </label>
           <textarea
             value={message}
             onChange={(e) => setMessage(e.target.value)}
             rows={6}
             placeholder="Write your message..."
             className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-neutral-900)] focus:ring-offset-1 transition-shadow"
           />
         </div>

         <p className="text-[11px] text-[var(--color-text-tertiary)]">
           The invoice PDF will be attached automatically.
         </p>
       </div>
     </Modal>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function InvoiceDetailPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const toast = useToast();
   const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [isDownloading, setIsDownloading] = useState(false);
   const [emailDialogOpen, setEmailDialogOpen] = useState(false);

   const load = useCallback(async () => {
     if (!id) return;
     setIsLoading(true);
     setError(null);
     try {
       const data = await invoicesApi.getInvoice(Number(id));
       setInvoice(data);
     } catch {
       setError('Failed to load invoice. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, [id]);

   useEffect(() => {
     load();
   }, [load]);

   const handleDownloadPdf = async () => {
     if (!invoice) return;
     setIsDownloading(true);
     try {
       const blob = await invoicesApi.downloadInvoicePdf(invoice.id);
      downloadBlob(blob, `invoice-${invoice.invoiceNumber}.pdf`);
       toast.success('PDF downloaded', `${invoice.invoiceNumber} saved to your downloads.`);
     } catch {
       toast.error('Download failed', 'Could not download the invoice PDF. Please try again.');
     } finally {
       setIsDownloading(false);
     }
   };

   if (isLoading) {
     return (
       <div className="space-y-5">
         <Skeleton className="h-8 w-48" />
         <div className="space-y-4">
           <Skeleton className="h-32 w-full rounded-xl" />
           <Skeleton className="h-64 w-full rounded-xl" />
         </div>
       </div>
     );
   }

   if (error || !invoice) {
     return (
       <div className="flex flex-col items-center justify-center py-16 gap-3">
         <AlertCircle size={24} className="text-[var(--color-error)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">{error ?? 'Invoice not found.'}</p>
         <div className="flex gap-2">
           <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
             Go back
           </Button>
           <Button variant="secondary" size="sm" leftIcon={<RefreshCcw size={13} />} onClick={load}>
             Retry
           </Button>
         </div>
       </div>
     );
   }

   return (
     <div className="space-y-5">
       {/* Back nav + actions */}
       <div className="flex items-center justify-between gap-3">
         <button
           type="button"
           onClick={() => navigate('/accounting/invoices')}
           className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
         >
           <ArrowLeft size={14} />
           Back to Invoices
         </button>

         <div className="flex items-center gap-2">
           <Button
             variant="secondary"
             size="sm"
             leftIcon={<Mail size={14} />}
             onClick={() => setEmailDialogOpen(true)}
           >
             Send Email
           </Button>
           <Button
             variant="secondary"
             size="sm"
             leftIcon={<Download size={14} />}
             isLoading={isDownloading}
             onClick={handleDownloadPdf}
           >
             Download PDF
           </Button>
         </div>
       </div>

       {/* Invoice header card */}
       <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-5">
         <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
           <div>
             <div className="flex items-center gap-2.5 flex-wrap">
               <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight tabular-nums">
                 {invoice.invoiceNumber}
               </h1>
               <InvoiceStatusBadge status={invoice.status} />
             </div>
             <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
               {invoice.dealerName}
             </p>
           </div>

           <div className="text-right">
             <p className="text-[24px] font-semibold tabular-nums text-[var(--color-text-primary)]">
               {formatINR(invoice.totalAmount)}
             </p>
             {(invoice.outstandingAmount ?? 0) > 0 && (
               <p className="text-[12px] text-[var(--color-error)] tabular-nums">
                 {formatINR(invoice.outstandingAmount)} outstanding
               </p>
             )}
           </div>
         </div>

         <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-4">
           <div>
             <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Issue Date</p>
             <p className="mt-0.5 text-[13px] tabular-nums text-[var(--color-text-primary)]">{formatDate(invoice.issueDate)}</p>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Due Date</p>
             <p className="mt-0.5 text-[13px] tabular-nums text-[var(--color-text-primary)]">{formatDate(invoice.dueDate)}</p>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Currency</p>
             <p className="mt-0.5 text-[13px] text-[var(--color-text-primary)]">{invoice.currency ?? 'INR'}</p>
           </div>
           <div>
             <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Journal</p>
             <p className="mt-0.5 text-[13px] tabular-nums text-[var(--color-text-primary)]">
               {invoice.journalEntryId ? `#${invoice.journalEntryId}` : '—'}
             </p>
           </div>
           {invoice.salesOrderId && (
             <div>
               <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Sales Order</p>
               <p className="mt-0.5 text-[13px] tabular-nums text-[var(--color-text-primary)]" data-testid="sales-order-link">
                 #{invoice.salesOrderId}
               </p>
             </div>
           )}
         </div>
       </div>

       {/* Line items */}
       <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
         <div className="px-5 py-3.5 border-b border-[var(--color-border-subtle)]">
           <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">Line Items</h2>
         </div>

         <div className="overflow-x-auto">
           <table className="w-full text-[13px]">
             <thead>
               <tr className="border-b border-[var(--color-border-default)]">
                 {['Product', 'Description', 'Qty', 'Unit Price', 'Tax', 'Total'].map((h) => (
                   <th
                     key={h}
                     className={clsx(
                       'px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]',
                       h === 'Qty' || h === 'Unit Price' || h === 'Tax' || h === 'Total' ? 'text-right' : 'text-left',
                     )}
                   >
                     {h}
                   </th>
                 ))}
               </tr>
             </thead>
             <tbody>
               {invoice.lines?.length > 0 ? (
                 invoice.lines.map((line, idx) => (
                   <tr key={line.id ?? idx} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)] transition-colors">
                     <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)]">
                       {line.productCode ?? '—'}
                     </td>
                     <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">
                       {line.description ?? '—'}
                     </td>
                     <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                       {line.quantity ?? 0}
                     </td>
                     <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                       {formatINR(line.unitPrice ?? 0)}
                     </td>
                     <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                       <span>{(line.taxRate ?? 0)}%</span>
                       {((line.cgstAmount ?? 0) > 0 || (line.sgstAmount ?? 0) > 0) && (
                         <span className="block text-[10px] text-[var(--color-text-tertiary)]" data-testid="gst-components">
                           {(line.cgstAmount ?? 0) > 0 && `C:${formatINR(line.cgstAmount!)}`}
                           {(line.sgstAmount ?? 0) > 0 && ` S:${formatINR(line.sgstAmount!)}`}
                           {(line.igstAmount ?? 0) > 0 && ` I:${formatINR(line.igstAmount!)}`}
                         </span>
                       )}
                     </td>
                     <td className="px-4 py-2.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                       {formatINR(line.lineTotal ?? 0)}
                     </td>
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[var(--color-text-tertiary)]">
                     No line items.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>

         {/* Totals */}
         <div className="border-t border-[var(--color-border-default)] px-5 py-4">
           <div className="ml-auto max-w-xs space-y-2">
             <div className="flex items-center justify-between text-[13px]">
               <span className="text-[var(--color-text-secondary)]">Subtotal</span>
               <span className="tabular-nums text-[var(--color-text-primary)]">{formatINR(invoice.subtotal ?? 0)}</span>
             </div>
             <div className="flex items-center justify-between text-[13px]">
               <span className="text-[var(--color-text-secondary)]">Tax</span>
               <span className="tabular-nums text-[var(--color-text-primary)]">{formatINR(invoice.taxTotal ?? 0)}</span>
             </div>
             <div className="flex items-center justify-between text-[14px] font-semibold pt-2 border-t border-[var(--color-border-subtle)]">
               <span className="text-[var(--color-text-primary)]">Total</span>
               <span className="tabular-nums text-[var(--color-text-primary)]">{formatINR(invoice.totalAmount ?? 0)}</span>
             </div>
             {(invoice.outstandingAmount ?? 0) > 0 && (
               <div className="flex items-center justify-between text-[13px] pt-1">
                 <span className="text-[var(--color-error)]">Outstanding</span>
                 <span className="tabular-nums font-medium text-[var(--color-error)]">
                   {formatINR(invoice.outstandingAmount ?? 0)}
                 </span>
               </div>
             )}
             {(invoice.outstandingAmount ?? 0) === 0 && (
               <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-success-icon)] pt-1">
                 <CheckCircle2 size={13} />
                 <span>Fully paid</span>
               </div>
             )}
           </div>
         </div>
       </div>

       {/* Email dialog */}
       {emailDialogOpen && (
         <EmailDialog
           isOpen={emailDialogOpen}
           onClose={() => setEmailDialogOpen(false)}
           invoice={invoice}
         />
       )}
     </div>
   );
 }

 /**
  * InvoicesPage
  *
  * Paginated list of all invoices with status filter tabs.
  * Status: Draft / Sent / Paid / Overdue
  *
  * API:
  *  GET /api/v1/invoices
  */

 import { useEffect, useState, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { AlertCircle, RefreshCcw, FileText } from 'lucide-react';
 import { format, parseISO } from 'date-fns';
 import { clsx } from 'clsx';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { invoicesApi, type InvoiceDto } from '@/lib/reportsApi';

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

 type InvoiceStatus = 'ALL' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

 const STATUS_TABS: { key: InvoiceStatus; label: string }[] = [
   { key: 'ALL', label: 'All' },
   { key: 'DRAFT', label: 'Draft' },
   { key: 'SENT', label: 'Sent' },
   { key: 'PAID', label: 'Paid' },
   { key: 'OVERDUE', label: 'Overdue' },
 ];

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
 // Columns
 // ─────────────────────────────────────────────────────────────────────────────

 const COLUMNS: Column<InvoiceDto>[] = [
   {
     id: 'invoiceNumber',
     header: 'Invoice #',
     accessor: (row) => (
       <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
         {row.invoiceNumber}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.invoiceNumber,
   },
   {
     id: 'dealer',
     header: 'Dealer',
     accessor: (row) => (
       <span className="text-[var(--color-text-primary)]">{row.dealerName ?? '—'}</span>
     ),
     sortable: true,
     sortAccessor: (row) => row.dealerName ?? '',
   },
   {
     id: 'issueDate',
     header: 'Issue Date',
     accessor: (row) => (
       <span className="tabular-nums text-[var(--color-text-secondary)]">
         {formatDate(row.issueDate)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.issueDate ?? '',
     hideOnMobile: true,
   },
   {
     id: 'dueDate',
     header: 'Due Date',
     accessor: (row) => (
       <span className="tabular-nums text-[var(--color-text-secondary)]">
         {formatDate(row.dueDate)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.dueDate ?? '',
     hideOnMobile: true,
   },
   {
     id: 'totalAmount',
     header: 'Total',
     accessor: (row) => (
       <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
         {formatINR(row.totalAmount ?? 0)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.totalAmount ?? 0,
     align: 'right',
   },
   {
     id: 'outstanding',
     header: 'Outstanding',
     accessor: (row) => (
       <span className={clsx('tabular-nums font-medium', (row.outstandingAmount ?? 0) > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]')}>
         {formatINR(row.outstandingAmount ?? 0)}
       </span>
     ),
     sortable: true,
     sortAccessor: (row) => row.outstandingAmount ?? 0,
     align: 'right',
     hideOnMobile: true,
   },
   {
     id: 'status',
     header: 'Status',
     accessor: (row) => <InvoiceStatusBadge status={row.status} />,
   },
 ];

 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function InvoicesPage() {
   const navigate = useNavigate();
   const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [activeStatus, setActiveStatus] = useState<InvoiceStatus>('ALL');

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await invoicesApi.getInvoices();
       setInvoices(data);
     } catch {
       setError('Failed to load invoices. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const filtered = activeStatus === 'ALL'
     ? invoices
     : invoices.filter((inv) => inv.status === activeStatus);

   return (
     <div className="space-y-5">
       <PageHeader
         title="Invoices"
         description="Sales invoices for all dealers"
       />

       {/* Status filter tabs */}
       <div className="flex items-center gap-1 border-b border-[var(--color-border-default)]">
         {STATUS_TABS.map((tab) => {
           const count = tab.key === 'ALL'
             ? invoices.length
             : invoices.filter((inv) => inv.status === tab.key).length;
           return (
             <button
               key={tab.key}
               type="button"
               onClick={() => setActiveStatus(tab.key)}
               className={clsx(
                 'relative px-3 pb-2.5 pt-0.5 text-[13px] font-medium transition-colors',
                 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full',
                 activeStatus === tab.key
                   ? 'text-[var(--color-text-primary)] after:bg-[var(--color-neutral-900)]'
                   : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] after:bg-transparent',
               )}
             >
               {tab.label}
               {!isLoading && (
                 <span className={clsx(
                   'ml-1.5 text-[11px] tabular-nums',
                   activeStatus === tab.key ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-tertiary)]'
                 )}>
                   {count}
                 </span>
               )}
             </button>
           );
         })}

         <div className="ml-auto pb-2.5">
           <Button variant="ghost" size="sm" leftIcon={<RefreshCcw size={13} />} onClick={load}>
             Refresh
           </Button>
         </div>
       </div>

       {/* Error state */}
       {error && !isLoading && (
         <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)]">
           <AlertCircle size={16} className="text-[var(--color-error)] shrink-0" />
           <p className="text-[13px] text-[var(--color-error)]">{error}</p>
           <Button variant="secondary" size="sm" onClick={load} className="ml-auto shrink-0">
             Retry
           </Button>
         </div>
       )}

       {/* Loading skeleton */}
       {isLoading && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <div className="p-3 space-y-2">
             {Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="flex gap-3 py-2.5 border-b border-[var(--color-border-subtle)]">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-4 w-20 ml-auto" />
                 <Skeleton className="h-5 w-16" />
               </div>
             ))}
           </div>
         </div>
       )}

       {/* DataTable */}
       {!isLoading && !error && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <DataTable
             columns={COLUMNS}
             data={filtered}
             keyExtractor={(row) => row.id}
             searchable
             searchPlaceholder="Search by invoice # or dealer..."
             searchFilter={(row, q) =>
               row.invoiceNumber?.toLowerCase().includes(q) ||
               row.dealerName?.toLowerCase().includes(q)
             }
             onRowClick={(row) => navigate(`/accounting/invoices/${row.id}`)}
             emptyMessage={
               activeStatus === 'ALL'
                 ? 'No invoices found.'
                 : `No ${activeStatus.toLowerCase()} invoices.`
             }
             toolbar={
               <div className="flex items-center gap-1.5">
                 <FileText size={14} className="text-[var(--color-text-tertiary)]" />
                 <span className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                   {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
                 </span>
               </div>
             }
           />
         </div>
       )}
     </div>
   );
 }

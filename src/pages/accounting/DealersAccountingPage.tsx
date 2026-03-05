 /**
  * DealersAccountingPage (Accounting view)
  *
  * Accounting view of dealers: download account statement and aging PDFs.
  * Lists all dealers with their outstanding balance for accounting context.
  *
  * API:
  *  GET /api/v1/dealers
  *  GET /api/v1/accounting/statements/dealers/{id}/pdf → blob
  *  GET /api/v1/accounting/aging/dealers/{id}/pdf → blob
  *  GET /api/v1/accounting/aging/dealers/{id}
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import { AlertCircle, RefreshCcw, Download, FileText } from 'lucide-react';
 import { clsx } from 'clsx';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { useToast } from '@/components/ui/Toast';
 import { accountingApi, type DealerResponse } from '@/lib/accountingApi';
 import { purchasingApi } from '@/lib/purchasingApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 0,
   }).format(amount);
 }
 
 function downloadBlob(blob: Blob, filename: string) {
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename;
   a.click();
   URL.revokeObjectURL(url);
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Dealer Documents Modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface DealerDocumentsModalProps {
   dealer: DealerResponse | null;
   onClose: () => void;
 }
 
 function DealerDocumentsModal({ dealer, onClose }: DealerDocumentsModalProps) {
   const toast = useToast();
   const [downloading, setDownloading] = useState<'statement' | 'aging' | null>(null);
 
   async function handleDownload(type: 'statement' | 'aging') {
     if (!dealer) return;
     setDownloading(type);
     try {
       const blob = type === 'statement'
         ? await purchasingApi.getDealerStatementPdf(dealer.id)
         : await purchasingApi.getDealerAgingPdf(dealer.id);
       downloadBlob(blob, `${dealer.name.replace(/\s+/g, '_')}_${type}.pdf`);
       toast.success(`${type === 'statement' ? 'Statement' : 'Aging report'} downloaded.`);
     } catch {
       toast.error(`Failed to download ${type} PDF.`);
     } finally {
       setDownloading(null);
     }
   }
 
   return (
     <Modal
       isOpen={dealer !== null}
       onClose={onClose}
       title={`${dealer?.name ?? ''} — Documents`}
       description="Download account statement and aging report"
       size="sm"
     >
       <div className="space-y-3">
         <button
           type="button"
           disabled={downloading === 'statement'}
           onClick={() => handleDownload('statement')}
           className={clsx(
             'w-full flex items-center gap-3 p-3.5 rounded-xl border border-[var(--color-border-default)]',
             'hover:bg-[var(--color-surface-tertiary)] transition-colors text-left',
             downloading === 'statement' && 'opacity-60 pointer-events-none'
           )}
         >
           <FileText size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
           <div className="flex-1 min-w-0">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Account Statement</p>
             <p className="text-[11px] text-[var(--color-text-tertiary)]">Full transaction history PDF</p>
           </div>
           {downloading === 'statement' ? (
             <RefreshCcw size={14} className="animate-spin text-[var(--color-text-tertiary)]" />
           ) : (
             <Download size={14} className="text-[var(--color-text-tertiary)]" />
           )}
         </button>
 
         <button
           type="button"
           disabled={downloading === 'aging'}
           onClick={() => handleDownload('aging')}
           className={clsx(
             'w-full flex items-center gap-3 p-3.5 rounded-xl border border-[var(--color-border-default)]',
             'hover:bg-[var(--color-surface-tertiary)] transition-colors text-left',
             downloading === 'aging' && 'opacity-60 pointer-events-none'
           )}
         >
           <FileText size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
           <div className="flex-1 min-w-0">
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Aging Report</p>
             <p className="text-[11px] text-[var(--color-text-tertiary)]">Outstanding balance by age bucket PDF</p>
           </div>
           {downloading === 'aging' ? (
             <RefreshCcw size={14} className="animate-spin text-[var(--color-text-tertiary)]" />
           ) : (
             <Download size={14} className="text-[var(--color-text-tertiary)]" />
           )}
         </button>
       </div>
     </Modal>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function DealersAccountingPage() {
   const [dealers, setDealers] = useState<DealerResponse[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [selectedDealer, setSelectedDealer] = useState<DealerResponse | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await accountingApi.getDealers();
       setDealers(data);
     } catch {
       setError('Failed to load dealers. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const COLUMNS: Column<DealerResponse>[] = [
     {
       id: 'name',
       header: 'Dealer',
       accessor: (row) => (
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{row.name}</p>
           <p className="text-[11px] text-[var(--color-text-tertiary)]">{row.code}</p>
         </div>
       ),
       sortable: true,
       sortAccessor: (row) => row.name,
     },
     {
       id: 'region',
       header: 'Region',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {row.city && row.region ? `${row.city}, ${row.region}` : row.city ?? row.region ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'outstanding',
       header: 'Outstanding',
       accessor: (row) => (
         <span className={clsx(
           'tabular-nums text-[13px] font-medium',
           (row.outstandingBalance ?? 0) > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'
         )}>
           {formatINR(row.outstandingBalance ?? 0)}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.outstandingBalance ?? 0,
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={row.status === 'ACTIVE' ? 'success' : 'warning'} dot>
           {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
         </Badge>
       ),
     },
     {
       id: 'documents',
       header: '',
       accessor: (row) => (
         <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
           <Button
             variant="ghost"
             size="sm"
             leftIcon={<Download size={13} />}
             onClick={() => setSelectedDealer(row)}
           >
             Documents
           </Button>
         </div>
       ),
       align: 'right',
     },
   ];
 
   return (
     <div className="space-y-5">
       <PageHeader
         title="Dealers"
         description="Dealer accounts and financial documents"
         actions={
           <Button variant="secondary" leftIcon={<RefreshCcw size={14} />} onClick={load}>
             Refresh
           </Button>
         }
       />
 
       {/* Error */}
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
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className="flex gap-3 py-2.5 border-b border-[var(--color-border-subtle)]">
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-4 w-20 ml-auto" />
                 <Skeleton className="h-5 w-16" />
               </div>
             ))}
           </div>
         </div>
       )}
 
       {/* Table */}
       {!isLoading && !error && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <DataTable
             columns={COLUMNS}
             data={dealers}
             keyExtractor={(row) => row.id}
             searchable
             searchPlaceholder="Search dealers..."
             searchFilter={(row, q) =>
               row.name.toLowerCase().includes(q) ||
               row.code?.toLowerCase().includes(q) ||
               row.region?.toLowerCase().includes(q) ||
               false
             }
             emptyMessage="No dealers found."
             toolbar={
               <span className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                 {dealers.length} dealer{dealers.length !== 1 ? 's' : ''}
               </span>
             }
           />
         </div>
       )}
 
       {/* Documents modal */}
       <DealerDocumentsModal
         dealer={selectedDealer}
         onClose={() => setSelectedDealer(null)}
       />
     </div>
   );
 }

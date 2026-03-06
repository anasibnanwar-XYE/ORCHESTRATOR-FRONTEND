 /**
  * SuppliersPage
  *
  * Supplier management: list, create, edit, and lifecycle actions (approve, activate, suspend).
  * Includes statements PDF download and aging PDF download per supplier.
  *
  * API:
  *  GET    /api/v1/suppliers
  *  POST   /api/v1/suppliers
  *  PUT    /api/v1/suppliers/{id}
  *  POST   /api/v1/suppliers/{id}/approve
  *  POST   /api/v1/suppliers/{id}/activate
  *  POST   /api/v1/suppliers/{id}/suspend
  *  GET    /api/v1/accounting/statements/suppliers/{id}/pdf
  *  GET    /api/v1/accounting/aging/suppliers/{id}/pdf
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Plus,
   MoreHorizontal,
   Download,
   FileText,
   CheckCircle,
   PauseCircle,
   PlayCircle,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Modal } from '@/components/ui/Modal';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { DropdownMenu } from '@/components/ui/DropdownMenu';
 import { useToast } from '@/components/ui/Toast';
 import {
   purchasingApi,
   type SupplierFullResponse,
   type SupplierRequest,
   type SupplierStatus,
   type PaymentTerms,
   type GstRegistrationType,
 } from '@/lib/purchasingApi';
import { downloadBlob } from '@/utils/mobileUtils';
 
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
 
 function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
   const map: Record<SupplierStatus, { variant: 'success' | 'warning' | 'danger' | 'default' | 'info'; label: string }> = {
     PENDING:  { variant: 'warning', label: 'Pending' },
     APPROVED: { variant: 'info', label: 'Approved' },
     ACTIVE:   { variant: 'success', label: 'Active' },
     SUSPENDED:{ variant: 'danger', label: 'Suspended' },
   };
   const m = map[status] ?? { variant: 'default' as const, label: status };
   return <Badge variant={m.variant} dot>{m.label}</Badge>;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Supplier Form
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface SupplierFormState {
   name: string;
   code: string;
   contactEmail: string;
   contactPhone: string;
   address: string;
   creditLimit: string;
   gstNumber: string;
   stateCode: string;
   gstRegistrationType: GstRegistrationType;
   paymentTerms: PaymentTerms;
   bankAccountName: string;
   bankAccountNumber: string;
   bankIfsc: string;
   bankBranch: string;
 }
 
 function emptyForm(): SupplierFormState {
   return {
     name: '',
     code: '',
     contactEmail: '',
     contactPhone: '',
     address: '',
     creditLimit: '',
     gstNumber: '',
     stateCode: '',
     gstRegistrationType: 'UNREGISTERED',
     paymentTerms: 'NET_30',
     bankAccountName: '',
     bankAccountNumber: '',
     bankIfsc: '',
     bankBranch: '',
   };
 }
 
 function supplierToForm(s: SupplierFullResponse): SupplierFormState {
   return {
     name: s.name,
     code: s.code ?? '',
     contactEmail: s.email ?? '',
     contactPhone: s.phone ?? '',
     address: s.address ?? '',
     creditLimit: s.creditLimit > 0 ? String(s.creditLimit) : '',
     gstNumber: s.gstNumber ?? '',
     stateCode: s.stateCode ?? '',
     gstRegistrationType: s.gstRegistrationType ?? 'UNREGISTERED',
     paymentTerms: s.paymentTerms ?? 'NET_30',
     bankAccountName: s.bankAccountName ?? '',
     bankAccountNumber: s.bankAccountNumber ?? '',
     bankIfsc: s.bankIfsc ?? '',
     bankBranch: s.bankBranch ?? '',
   };
 }
 
 function formToRequest(f: SupplierFormState): SupplierRequest {
   return {
     name: f.name.trim(),
     code: f.code.trim() || undefined,
     contactEmail: f.contactEmail.trim() || undefined,
     contactPhone: f.contactPhone.trim() || undefined,
     address: f.address.trim() || undefined,
     creditLimit: f.creditLimit ? parseFloat(f.creditLimit) : undefined,
     gstNumber: f.gstNumber.trim() || undefined,
     stateCode: f.stateCode.trim() || undefined,
     gstRegistrationType: f.gstRegistrationType,
     paymentTerms: f.paymentTerms,
     bankAccountName: f.bankAccountName.trim() || undefined,
     bankAccountNumber: f.bankAccountNumber.trim() || undefined,
     bankIfsc: f.bankIfsc.trim() || undefined,
     bankBranch: f.bankBranch.trim() || undefined,
   };
 }
 
 interface SupplierFormProps {
   form: SupplierFormState;
   onChange: (f: SupplierFormState) => void;
   errors: Partial<Record<keyof SupplierFormState, string>>;
 }
 
 function SupplierForm({ form, onChange, errors }: SupplierFormProps) {
   function field(key: keyof SupplierFormState) {
     return {
       value: form[key],
       onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
         onChange({ ...form, [key]: e.target.value }),
       error: errors[key],
     };
   }
 
   return (
     <div className="space-y-4">
       {/* Basic info */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input label="Name *" {...field('name')} />
         <Input label="Code" hint="Auto-generated from name if blank" {...field('code')} />
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input label="Email" type="email" {...field('contactEmail')} />
         <Input label="Phone" {...field('contactPhone')} />
       </div>
       <Input label="Address" {...field('address')} />
 
       {/* Financial */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
         <Input label="Credit Limit" type="number" min="0" hint="0 for unlimited" {...field('creditLimit')} />
         <Select
           label="Payment Terms"
           {...field('paymentTerms')}
           options={[
             { value: 'NET_30', label: 'Net 30' },
             { value: 'NET_60', label: 'Net 60' },
             { value: 'NET_90', label: 'Net 90' },
           ]}
         />
         <Select
           label="GST Registration"
           {...field('gstRegistrationType')}
           options={[
             { value: 'UNREGISTERED', label: 'Unregistered' },
             { value: 'REGULAR', label: 'Regular' },
             { value: 'COMPOSITION', label: 'Composition' },
           ]}
         />
       </div>
 
       {/* GST */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input label="GSTIN" hint="15-char GST number" {...field('gstNumber')} />
         <Input label="State Code" hint="2-digit state code" {...field('stateCode')} />
       </div>
 
       {/* Bank */}
       <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] pt-1">
         Bank Details
       </p>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input label="Account Name" {...field('bankAccountName')} />
         <Input label="Account Number" {...field('bankAccountNumber')} />
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input label="IFSC Code" {...field('bankIfsc')} />
         <Input label="Branch" {...field('bankBranch')} />
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Void Reason Dialog
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface SuspendConfirmProps {
   isOpen: boolean;
   supplierName: string;
   onConfirm: () => void;
   onCancel: () => void;
   isLoading: boolean;
 }
 
 function SuspendConfirm({ isOpen, supplierName, onConfirm, onCancel, isLoading }: SuspendConfirmProps) {
   return (
     <ConfirmDialog
       isOpen={isOpen}
       title="Suspend Supplier"
       message={`Suspend ${supplierName}? They will not be selectable for new purchase orders.`}
       confirmLabel="Suspend"
       variant="warning"
       isLoading={isLoading}
       onConfirm={onConfirm}
       onCancel={onCancel}
     />
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Statement / Aging detail modal
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface StatementModalProps {
   supplierId: number | null;
   supplierName: string;
   onClose: () => void;
 }
 
 function SupplierStatementModal({ supplierId, supplierName, onClose }: StatementModalProps) {
   const toast = useToast();
   const [downloading, setDownloading] = useState<'statement' | 'aging' | null>(null);
 
   async function handleDownload(type: 'statement' | 'aging') {
     if (!supplierId) return;
     setDownloading(type);
     try {
       const blob = type === 'statement'
         ? await purchasingApi.getSupplierStatementPdf(supplierId)
         : await purchasingApi.getSupplierAgingPdf(supplierId);
       downloadBlob(blob, `${supplierName.replace(/\s+/g, '_')}_${type}.pdf`);
       toast.success(`${type === 'statement' ? 'Statement' : 'Aging report'} downloaded.`);
     } catch {
       toast.error(`Failed to download ${type} PDF.`);
     } finally {
       setDownloading(null);
     }
   }
 
   return (
     <Modal
       isOpen={supplierId !== null}
       onClose={onClose}
       title={`${supplierName} — Documents`}
       description="Download supplier statement and aging report PDFs"
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
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function SuppliersPage() {
   const toast = useToast();
 
   const [suppliers, setSuppliers] = useState<SupplierFullResponse[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Form modal state
   const [formOpen, setFormOpen] = useState(false);
   const [editingSupplier, setEditingSupplier] = useState<SupplierFullResponse | null>(null);
   const [formState, setFormState] = useState<SupplierFormState>(emptyForm());
   const [formErrors, setFormErrors] = useState<Partial<Record<keyof SupplierFormState, string>>>({});
   const [isSaving, setIsSaving] = useState(false);
 
   // Lifecycle action state
   const [suspendTarget, setSuspendTarget] = useState<SupplierFullResponse | null>(null);
   const [isSuspending, setIsSuspending] = useState(false);
   const [isActioning, setIsActioning] = useState<number | null>(null);
 
   // Statement/Aging modal
   const [statementTarget, setStatementTarget] = useState<SupplierFullResponse | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await purchasingApi.getSuppliers();
       setSuppliers(data);
     } catch {
       setError('Failed to load suppliers. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   function openCreate() {
     setEditingSupplier(null);
     setFormState(emptyForm());
     setFormErrors({});
     setFormOpen(true);
   }
 
   function openEdit(supplier: SupplierFullResponse) {
     setEditingSupplier(supplier);
     setFormState(supplierToForm(supplier));
     setFormErrors({});
     setFormOpen(true);
   }
 
   function validateForm(f: SupplierFormState): Partial<Record<keyof SupplierFormState, string>> {
     const errs: Partial<Record<keyof SupplierFormState, string>> = {};
     if (!f.name.trim()) errs.name = 'Name is required';
     return errs;
   }
 
   async function handleSave() {
     const errs = validateForm(formState);
     if (Object.keys(errs).length > 0) {
       setFormErrors(errs);
       return;
     }
     setIsSaving(true);
     try {
       if (editingSupplier) {
         await purchasingApi.updateSupplier(editingSupplier.id, formToRequest(formState));
         toast.success('Supplier updated.');
       } else {
         await purchasingApi.createSupplier(formToRequest(formState));
         toast.success('Supplier created.');
       }
       setFormOpen(false);
       await load();
     } catch {
       toast.error('Failed to save supplier. Please try again.');
     } finally {
       setIsSaving(false);
     }
   }
 
   async function handleApprove(supplier: SupplierFullResponse) {
     setIsActioning(supplier.id);
     try {
       await purchasingApi.approveSupplier(supplier.id);
       toast.success(`${supplier.name} approved.`);
       await load();
     } catch {
       toast.error('Failed to approve supplier.');
     } finally {
       setIsActioning(null);
     }
   }
 
   async function handleActivate(supplier: SupplierFullResponse) {
     setIsActioning(supplier.id);
     try {
       await purchasingApi.activateSupplier(supplier.id);
       toast.success(`${supplier.name} activated.`);
       await load();
     } catch {
       toast.error('Failed to activate supplier.');
     } finally {
       setIsActioning(null);
     }
   }
 
   async function handleSuspend() {
     if (!suspendTarget) return;
     setIsSuspending(true);
     try {
       await purchasingApi.suspendSupplier(suspendTarget.id);
       toast.success(`${suspendTarget.name} suspended.`);
       setSuspendTarget(null);
       await load();
     } catch {
       toast.error('Failed to suspend supplier.');
     } finally {
       setIsSuspending(false);
     }
   }
 
   // ── Columns ────────────────────────────────────────────────────────────────
 
   const COLUMNS: Column<SupplierFullResponse>[] = [
     {
       id: 'name',
       header: 'Supplier',
       accessor: (row) => (
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{row.name}</p>
           <p className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums">{row.code}</p>
         </div>
       ),
       sortable: true,
       sortAccessor: (row) => row.name,
     },
     {
       id: 'contact',
       header: 'Contact',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {row.email ?? row.phone ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'gst',
       header: 'Tax ID',
       accessor: (row) => (
         <span className="tabular-nums text-[13px] text-[var(--color-text-secondary)]">
           {row.gstNumber ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'paymentTerms',
       header: 'Payment Terms',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {row.paymentTerms?.replace('NET_', 'Net ') ?? '—'}
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
           row.outstandingBalance > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'
         )}>
           {formatINR(row.outstandingBalance)}
         </span>
       ),
       sortable: true,
       sortAccessor: (row) => row.outstandingBalance,
       align: 'right',
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => <SupplierStatusBadge status={row.status} />,
       sortable: true,
       sortAccessor: (row) => row.status,
     },
     {
       id: 'actions',
       header: '',
       accessor: (row) => (
         <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
           {/* Lifecycle action button */}
           {row.status === 'PENDING' && (
             <button
               type="button"
               disabled={isActioning === row.id}
               onClick={() => handleApprove(row)}
               className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors disabled:opacity-50"
             >
               <CheckCircle size={13} />
               Approve
             </button>
           )}
           {(row.status === 'APPROVED' || row.status === 'SUSPENDED') && (
             <button
               type="button"
               disabled={isActioning === row.id}
               onClick={() => handleActivate(row)}
               className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors disabled:opacity-50"
             >
               <PlayCircle size={13} />
               Activate
             </button>
           )}
           {row.status === 'ACTIVE' && (
             <button
               type="button"
               disabled={isActioning === row.id}
               onClick={() => setSuspendTarget(row)}
               className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors disabled:opacity-50"
             >
               <PauseCircle size={13} />
               Suspend
             </button>
           )}
 
           <DropdownMenu
             trigger={
               <button
                 type="button"
                 className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
               >
                 <MoreHorizontal size={14} />
               </button>
             }
             items={[
               { label: 'Edit', value: 'edit' },
               { label: 'Documents', value: 'documents' },
             ]}
             onSelect={(value) => {
               if (value === 'edit') openEdit(row);
               else if (value === 'documents') setStatementTarget(row);
             }}
           />
         </div>
       ),
       align: 'right',
     },
   ];
 
   return (
     <div className="space-y-5">
       <PageHeader
         title="Suppliers"
         description="Manage supplier accounts and purchasing relationships"
         actions={
           <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
             New Supplier
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
                 <Skeleton className="h-4 w-40" />
                 <Skeleton className="h-4 w-24 ml-auto" />
                 <Skeleton className="h-5 w-16" />
               </div>
             ))}
           </div>
         </div>
       )}
 
       {/* Data table */}
       {!isLoading && !error && (
         <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           <DataTable
             columns={COLUMNS}
             data={suppliers}
             keyExtractor={(row) => row.id}
             searchable
             searchPlaceholder="Search suppliers..."
             searchFilter={(row, q) =>
               row.name.toLowerCase().includes(q) ||
               row.code?.toLowerCase().includes(q) ||
               row.gstNumber?.toLowerCase().includes(q) ||
               row.email?.toLowerCase().includes(q) ||
               false
             }
             emptyMessage="No suppliers found. Add your first supplier."
             toolbar={
               <div className="flex items-center gap-1.5">
                 <span className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                   {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
                 </span>
               </div>
             }
           />
         </div>
       )}
 
       {/* Create/Edit modal */}
       <Modal
         isOpen={formOpen}
         onClose={() => setFormOpen(false)}
         title={editingSupplier ? 'Edit Supplier' : 'New Supplier'}
         description={editingSupplier ? `Updating ${editingSupplier.name}` : 'Add a new supplier to your vendor master'}
         size="xl"
         footer={
           <>
             <Button variant="secondary" onClick={() => setFormOpen(false)}>
               Cancel
             </Button>
             <Button onClick={handleSave} isLoading={isSaving}>
               {editingSupplier ? 'Save Changes' : 'Create Supplier'}
             </Button>
           </>
         }
       >
         <div className="overflow-y-auto max-h-[60vh]">
           <SupplierForm form={formState} onChange={setFormState} errors={formErrors} />
         </div>
       </Modal>
 
       {/* Suspend confirm */}
       <SuspendConfirm
         isOpen={suspendTarget !== null}
         supplierName={suspendTarget?.name ?? ''}
         onConfirm={handleSuspend}
         onCancel={() => setSuspendTarget(null)}
         isLoading={isSuspending}
       />
 
       {/* Statement/Aging modal */}
       {statementTarget && (
         <SupplierStatementModal
           supplierId={statementTarget.id}
           supplierName={statementTarget.name}
           onClose={() => setStatementTarget(null)}
         />
       )}
     </div>
   );
 }

 /**
  * CompaniesPage — Company Management for the Admin portal
  *
  * Features:
  *  - DataTable listing companies: code, name, email, GST number, active status
  *  - Company detail drawer (click row) with info, status, and settings sections
  *  - Create company form modal (name, code, email, phone, address, GST)
  *  - Update company form modal (pre-filled)
  *  - Delete with ConfirmDialog danger variant
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   Plus,
   AlertCircle,
   RefreshCcw,
   Pencil,
   Trash2,
   Building2,
   Phone,
   Mail,
   MapPin,
   Calendar,
   FileText,
   Settings2,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Modal } from '@/components/ui/Modal';
 import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
 import { Badge } from '@/components/ui/Badge';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Drawer } from '@/components/ui/Drawer';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { adminApi } from '@/lib/adminApi';
 import type { Company } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface CompanyFormData {
   name: string;
   code: string;
   email: string;
   phone: string;
   address: string;
   gstNumber: string;
 }
 
 const emptyForm: CompanyFormData = {
   name: '',
   code: '',
   email: '',
   phone: '',
   address: '',
   gstNumber: '',
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatDate(iso?: string): string {
   if (!iso) return '—';
   try {
     return new Date(iso).toLocaleString('en-IN', {
       day: '2-digit',
       month: 'short',
       year: 'numeric',
       hour: '2-digit',
       minute: '2-digit',
     });
   } catch {
     return iso;
   }
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Company Detail Drawer
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface CompanyDetailDrawerProps {
   company: Company | null;
   onClose: () => void;
   onEdit: (company: Company) => void;
 }
 
 function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
   return (
     <div className="flex items-start gap-3">
       <div className="mt-0.5 h-7 w-7 flex items-center justify-center rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] shrink-0">
         {icon}
       </div>
       <div className="flex-1 min-w-0">
         <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-0.5">
           {label}
         </p>
         <p className="text-[13px] text-[var(--color-text-primary)] break-words">
           {value || <span className="text-[var(--color-text-tertiary)]">—</span>}
         </p>
       </div>
     </div>
   );
 }
 
 function CompanyDetailDrawer({ company, onClose, onEdit }: CompanyDetailDrawerProps) {
   if (!company) return null;
 
   return (
     <Drawer
       isOpen={company !== null}
       onClose={onClose}
       title={company.name}
       description={`Company code: ${company.code}`}
       size="md"
       footer={
         <>
           <Button variant="secondary" size="sm" onClick={onClose}>
             Close
           </Button>
           <Button
             size="sm"
             onClick={() => {
               onClose();
               onEdit(company);
             }}
           >
             Edit Company
           </Button>
         </>
       }
     >
       <div className="space-y-6">
         {/* Status badge */}
         <div className="flex items-center gap-2">
           <Badge variant={company.isActive ? 'success' : 'default'} dot>
             {company.isActive ? 'Active' : 'Inactive'}
           </Badge>
         </div>
 
         {/* Company Info section */}
         <div>
           <div className="flex items-center gap-2 mb-3">
             <Building2 size={13} className="text-[var(--color-text-tertiary)]" />
             <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
               Company Info
             </h3>
           </div>
           <div className="space-y-3 pl-1">
             <DetailRow icon={<Building2 size={12} />} label="Company Name" value={company.name} />
             <DetailRow
               icon={<FileText size={12} />}
               label="Company Code"
               value={company.code}
             />
             <DetailRow icon={<Mail size={12} />} label="Email" value={company.email} />
             <DetailRow icon={<Phone size={12} />} label="Phone" value={company.phone} />
             <DetailRow icon={<MapPin size={12} />} label="Address" value={company.address} />
             <DetailRow
               icon={<FileText size={12} />}
               label="GST Number"
               value={company.gstNumber}
             />
           </div>
         </div>
 
         {/* Subscription section */}
         <div>
           <div className="flex items-center gap-2 mb-3">
             <Settings2 size={13} className="text-[var(--color-text-tertiary)]" />
             <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
               Subscription & Settings
             </h3>
           </div>
           <div className="rounded-lg border border-[var(--color-border-subtle)] p-3 bg-[var(--color-surface-secondary)]">
             <p className="text-[12px] text-[var(--color-text-secondary)]">
               Subscription details and module configuration are managed by platform administrators.
             </p>
           </div>
         </div>
 
         {/* Dates section */}
         <div>
           <div className="flex items-center gap-2 mb-3">
             <Calendar size={13} className="text-[var(--color-text-tertiary)]" />
             <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
               Dates
             </h3>
           </div>
           <div className="space-y-3 pl-1">
             <DetailRow
               icon={<Calendar size={12} />}
               label="Created"
               value={formatDate(company.createdAt)}
             />
             <DetailRow
               icon={<Calendar size={12} />}
               label="Last Updated"
               value={formatDate(company.updatedAt)}
             />
           </div>
         </div>
       </div>
     </Drawer>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // GST Validation (15-char alphanumeric)
 // ─────────────────────────────────────────────────────────────────────────────
 
 const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
 
 function validateGST(gst: string): string | null {
   if (!gst) return null; // optional
   if (!GST_REGEX.test(gst)) return 'Invalid GST number. Format: 22AAAAA0000A1Z5';
   return null;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // CompaniesPage
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function CompaniesPage() {
  const { success, error: toastError } = useToast();
   const [companies, setCompanies] = useState<Company[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Detail drawer
   const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
 
   // Create/Edit modal
   const [showForm, setShowForm] = useState(false);
   const [editingCompany, setEditingCompany] = useState<Company | null>(null);
   const [form, setForm] = useState<CompanyFormData>({ ...emptyForm });
   const [formError, setFormError] = useState<string | null>(null);
   const [gstError, setGstError] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   // Delete confirmation
   const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await adminApi.getCompanies();
       setCompanies(data);
     } catch {
       setError("Couldn't load companies. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const openCreate = () => {
     setEditingCompany(null);
     setForm({ ...emptyForm });
     setFormError(null);
     setGstError(null);
     setShowForm(true);
   };
 
   const openEdit = (company: Company) => {
     setEditingCompany(company);
     setForm({
       name: company.name ?? '',
       code: company.code ?? '',
       email: company.email ?? '',
       phone: company.phone ?? '',
       address: company.address ?? '',
       gstNumber: company.gstNumber ?? '',
     });
     setFormError(null);
     setGstError(null);
     setShowForm(true);
   };
 
   const closeForm = () => {
     setShowForm(false);
     setEditingCompany(null);
     setForm({ ...emptyForm });
     setFormError(null);
     setGstError(null);
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!form.name.trim() || !form.code.trim()) return;
 
     // Validate GST if provided
     const gstErr = validateGST(form.gstNumber.trim().toUpperCase());
     if (gstErr) { setGstError(gstErr); return; }
 
     setIsSubmitting(true);
     setFormError(null);
     try {
       const payload: Partial<Company> = {
         name: form.name.trim(),
         code: form.code.trim().toUpperCase(),
         email: form.email.trim() || undefined,
         phone: form.phone.trim() || undefined,
         address: form.address.trim() || undefined,
         gstNumber: form.gstNumber.trim().toUpperCase() || undefined,
       };
 
       if (editingCompany) {
         await adminApi.updateCompany(editingCompany.id, payload);
        success('Company updated', `"${form.name}" has been updated.`);
       } else {
         await adminApi.createCompany(payload);
        success('Company created', `"${form.name}" has been registered.`);
       }
       closeForm();
       load();
     } catch (err) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setFormError(msg);
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const handleDelete = async () => {
     if (!deletingCompany) return;
     try {
       await adminApi.deleteCompany(deletingCompany.id);
      success('Company deleted', `"${deletingCompany.name}" has been removed.`);
       setDeletingCompany(null);
       load();
     } catch (err) {
      toastError('Failed to delete', err instanceof Error ? err.message : 'Failed to delete company');
       setDeletingCompany(null);
     }
   };
 
   const columns: Column<Company>[] = [
     {
       id: 'code',
       header: 'Code',
       accessor: (c) => (
         <span className="text-[12px] font-mono font-semibold text-[var(--color-text-secondary)]">
           {c.code}
         </span>
       ),
       width: '80px',
     },
     {
       id: 'name',
       header: 'Name',
       accessor: (c) => (
         <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{c.name}</span>
       ),
     },
     {
       id: 'email',
       header: 'Email',
       accessor: (c) => (
         <span className="text-[12px] text-[var(--color-text-tertiary)]">{c.email ?? '—'}</span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'gst',
       header: 'GST',
       accessor: (c) => (
         <span className="text-[11px] font-mono text-[var(--color-text-tertiary)]">
           {c.gstNumber ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (c) => (
         <Badge variant={c.isActive ? 'success' : 'default'} dot>
           {c.isActive ? 'Active' : 'Inactive'}
         </Badge>
       ),
       align: 'center',
     },
   ];
 
   if (isLoading) {
     return (
       <div className="space-y-5">
         <div className="flex items-center justify-between">
           <div>
             <Skeleton width={160} height={22} />
             <Skeleton width={200} height={14} className="mt-1.5" />
           </div>
           <Skeleton width={120} height={34} />
         </div>
         <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
           {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="px-4 py-3 border-b border-[var(--color-border-subtle)] last:border-0 animate-pulse">
               <div className="flex gap-4">
                 <Skeleton width="10%" />
                 <Skeleton width="30%" />
                 <Skeleton width="25%" />
               </div>
             </div>
           ))}
         </div>
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-20 gap-3">
         <AlertCircle size={24} className="text-[var(--color-error)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
         <Button size="sm" variant="secondary" onClick={load}>
           <RefreshCcw size={14} className="mr-1.5" /> Retry
         </Button>
       </div>
     );
   }
 
   const isEditing = !!editingCompany;
 
   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-center justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
             Companies
           </h1>
           <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
             {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'} registered
           </p>
         </div>
         <Button onClick={openCreate}>
           <Plus size={15} className="mr-1.5" /> Add Company
         </Button>
       </div>
 
       {/* DataTable */}
       <DataTable
         columns={columns}
         data={companies}
         keyExtractor={(c) => c.id}
         searchable
         searchPlaceholder="Search companies..."
         searchFilter={(c, q) =>
           c.name.toLowerCase().includes(q.toLowerCase()) ||
           c.code.toLowerCase().includes(q.toLowerCase()) ||
           (c.email ?? '').toLowerCase().includes(q.toLowerCase())
         }
         emptyMessage="No companies found"
         onRowClick={(c) => setViewingCompany(c)}
         rowActions={(c) => (
           <div className="flex items-center gap-1">
             <button
               onClick={(e) => { e.stopPropagation(); openEdit(c); }}
               className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
               aria-label="Edit company"
             >
               <Pencil size={13} />
             </button>
             <button
               onClick={(e) => { e.stopPropagation(); setDeletingCompany(c); }}
               className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors"
               aria-label="Delete company"
             >
               <Trash2 size={13} />
             </button>
           </div>
         )}
       />
 
       {/* Create / Edit Modal */}
       <Modal
         isOpen={showForm}
         onClose={closeForm}
         title={isEditing ? 'Edit Company' : 'Create Company'}
         description={isEditing ? 'Update company details.' : 'Register a new company.'}
         size="md"
         footer={
           <>
             <Button variant="secondary" onClick={closeForm} disabled={isSubmitting}>
               Cancel
             </Button>
             <Button
               type="submit"
               form="company-form"
               disabled={isSubmitting || !form.name.trim() || !form.code.trim()}
             >
               {isSubmitting
                 ? isEditing ? 'Saving...' : 'Creating...'
                 : isEditing ? 'Save Changes' : 'Create Company'}
             </Button>
           </>
         }
       >
         <form id="company-form" onSubmit={handleSubmit} className="space-y-4">
           <Input
             label="Company Name"
             required
             value={form.name}
             onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
             placeholder="e.g. Acme Corporation"
           />
           <Input
             label="Company Code"
             required
             value={form.code}
             onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
             placeholder="e.g. ACME"
             disabled={isEditing}
           />
           {isEditing && (
             <p className="text-[11px] text-[var(--color-text-tertiary)] -mt-2">
               Company code cannot be changed after creation.
             </p>
           )}
           <Input
             label="Email"
             type="email"
             value={form.email}
             onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
             placeholder="admin@company.com"
           />
           <Input
             label="Phone"
             value={form.phone}
             onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
             placeholder="+91 99999 99999"
           />
           <div className="space-y-1.5">
             <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
               Address
             </label>
             <textarea
               value={form.address}
               onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
               placeholder="Full address..."
               rows={2}
               className={clsx(
                 'w-full rounded-lg border border-[var(--color-border-default)] px-3 py-2',
                 'text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
                 'placeholder:text-[var(--color-text-tertiary)] resize-none',
                 'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
               )}
             />
           </div>
           <div className="space-y-1.5">
             <Input
               label="GST Number"
               value={form.gstNumber}
               onChange={(e) => {
                 const val = e.target.value.toUpperCase();
                 setForm((f) => ({ ...f, gstNumber: val }));
                 setGstError(validateGST(val));
               }}
               placeholder="22AAAAA0000A1Z5"
             />
             {gstError && (
               <p className="text-[11px] text-[var(--color-error)]">{gstError}</p>
             )}
           </div>
 
           {formError && (
             <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)]">
               <AlertCircle size={14} />
               <p className="text-[12px]">{formError}</p>
             </div>
           )}
         </form>
       </Modal>
 
       {/* Delete Confirmation */}
       <ConfirmDialog
         isOpen={!!deletingCompany}
         onCancel={() => setDeletingCompany(null)}
         onConfirm={handleDelete}
         title="Delete Company"
         message={`Are you sure you want to delete "${deletingCompany?.name}" (${deletingCompany?.code})? This action cannot be undone.`}
         confirmLabel="Delete Company"
         variant="danger"
       />
 
       {/* Company Detail Drawer */}
       <CompanyDetailDrawer
         company={viewingCompany}
         onClose={() => setViewingCompany(null)}
         onEdit={(c) => { setViewingCompany(null); openEdit(c); }}
       />
     </div>
   );
 }

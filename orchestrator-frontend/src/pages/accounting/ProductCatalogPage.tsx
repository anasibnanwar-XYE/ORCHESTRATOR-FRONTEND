/**
  * ProductCatalogPage
  *
  * Product catalog management with:
  *  - DataTable with search, filter by brand and status
  *  - Create product form (name, brand, colors, sizes, HSN, GST rate, unit)
  *  - Duplicate SKU prevention (BUS_002 error from backend)
  *  - Edit and archive (soft-delete) products
  *  - Bulk variant generator: matrix UI for size x color combinations
  *
  * API:
  *  GET    /api/v1/catalog/brands?active=true
  *  GET    /api/v1/catalog/products
  *  POST   /api/v1/catalog/products
  *  PUT    /api/v1/catalog/products/{id}
  *  DELETE /api/v1/catalog/products/{id}
  *  POST   /api/v1/accounting/catalog/products/bulk-variants
  */


import { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  RefreshCcw,
  Plus,
  MoreHorizontal,
  Layers,
} from 'lucide-react';
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
  inventoryApi,
  type CatalogProductDto,
  type CatalogProductRequest,
  type CatalogBrandDto,
  type BulkVariantRequest,
  type VariantItem,
} from '@/lib/inventoryApi';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const GST_RATES = [
   { value: '0', label: '0%' },
   { value: '5', label: '5%' },
   { value: '12', label: '12%' },
   { value: '18', label: '18%' },
   { value: '28', label: '28%' },
];

const UOM_OPTIONS = [
   { value: 'LITRE', label: 'Litre' },
   { value: 'KG', label: 'Kilogram' },
   { value: 'PIECE', label: 'Piece' },
   { value: 'BOX', label: 'Box' },
   { value: 'CARTON', label: 'Carton' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Product Form
// ─────────────────────────────────────────────────────────────────────────────

interface ProductFormState {
   brandId: string;
   name: string;
   unitOfMeasure: string;
   hsnCode: string;
   gstRate: string;
   colorsRaw: string; // comma-separated
   sizesRaw: string;  // comma-separated
}

interface ProductFormErrors {
   brandId?: string;
   name?: string;
   unitOfMeasure?: string;
   hsnCode?: string;
   gstRate?: string;
}

const EMPTY_FORM: ProductFormState = {
   brandId: '',
   name: '',
   unitOfMeasure: 'LITRE',
   hsnCode: '',
   gstRate: '18',
   colorsRaw: '',
   sizesRaw: '',
};

function parseCommaSeparated(raw: string): string[] {
   return raw
     .split(',')
     .map((s) => s.trim())
     .filter(Boolean);
}

interface ProductFormProps {
   brands: CatalogBrandDto[];
   initial?: CatalogProductDto | null;
   onSave: (data: CatalogProductRequest) => Promise<void>;
   onClose: () => void;
   isSaving: boolean;
}

function ProductForm({ brands, initial, onSave, onClose, isSaving }: ProductFormProps) {
   const [form, setForm] = useState<ProductFormState>(() => {
     if (initial) {
       return {
         brandId: String(initial.brandId),
         name: initial.name,
         unitOfMeasure: initial.unitOfMeasure,
         hsnCode: initial.hsnCode,
         gstRate: String(initial.gstRate),
         colorsRaw: initial.colors.join(', '),
         sizesRaw: initial.sizes.join(', '),
       };
     }
     return EMPTY_FORM;
   });
   const [errors, setErrors] = useState<ProductFormErrors>({});

   const field = (key: keyof ProductFormState) => ({
     value: form[key],
     onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
       setForm((f) => ({ ...f, [key]: e.target.value })),
   });

   const validate = (): boolean => {
     const errs: ProductFormErrors = {};
     if (!form.brandId) errs.brandId = 'Brand is required';
     if (!form.name.trim()) errs.name = 'Product name is required';
     if (!form.unitOfMeasure) errs.unitOfMeasure = 'Unit of measure is required';
     if (!form.hsnCode.trim()) errs.hsnCode = 'HSN code is required';
     if (!form.gstRate) errs.gstRate = 'GST rate is required';
     setErrors(errs);
     return Object.keys(errs).length === 0;
   };

   const handleSubmit = async () => {
     if (!validate()) return;
     await onSave({
       brandId: parseInt(form.brandId, 10),
       name: form.name.trim(),
       unitOfMeasure: form.unitOfMeasure,
       hsnCode: form.hsnCode.trim(),
       gstRate: parseFloat(form.gstRate),
       colors: parseCommaSeparated(form.colorsRaw),
       sizes: parseCommaSeparated(form.sizesRaw),
       cartonSizes: parseCommaSeparated(form.sizesRaw).map((s) => ({
         size: s,
         piecesPerCarton: 1,
       })),
     });
   };

   return (
     <div className="space-y-4">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Select
           label="Brand *"
           options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
           placeholder="Select brand"
           {...field('brandId')}
           error={errors.brandId}
         />
         <Input
           label="Product Name *"
           placeholder="e.g. Premium Emulsion"
           {...field('name')}
           error={errors.name}
         />
         <Select
           label="Unit of Measure *"
           options={UOM_OPTIONS}
           {...field('unitOfMeasure')}
           error={errors.unitOfMeasure}
         />
         <Select
           label="GST Rate *"
           options={GST_RATES}
           {...field('gstRate')}
           error={errors.gstRate}
         />
         <Input
           label="HSN Code *"
           placeholder="e.g. 3209"
           {...field('hsnCode')}
           error={errors.hsnCode}
         />
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <Input
           label="Colors"
           placeholder="e.g. White, Ivory, Cream"
           hint="Comma-separated list"
           {...field('colorsRaw')}
         />
         <Input
           label="Sizes"
           placeholder="e.g. 1L, 4L, 20L"
           hint="Comma-separated list"
           {...field('sizesRaw')}
         />
       </div>
       <div className="flex justify-end gap-2 pt-2">
         <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
         <Button onClick={handleSubmit} isLoading={isSaving}>
           {initial ? 'Save Changes' : 'Create Product'}
         </Button>
       </div>
     </div>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Variant Generator
// ─────────────────────────────────────────────────────────────────────────────

interface BulkVariantModalProps {
   brands: CatalogBrandDto[];
   onSave: (data: BulkVariantRequest) => Promise<void>;
   onClose: () => void;
   isSaving: boolean;
   result: VariantItem[] | null;
}

interface BulkVariantFormState {
   brandId: string;
   baseProductName: string;
   category: string;
   sizesRaw: string;
   colorsRaw: string;
   hsnCode: string;
   gstRate: string;
   unitOfMeasure: string;
}

function BulkVariantModal({ brands, onSave, onClose, isSaving, result }: BulkVariantModalProps) {
   const [form, setForm] = useState<BulkVariantFormState>({
     brandId: '',
     baseProductName: '',
     category: '',
     sizesRaw: '',
     colorsRaw: '',
     hsnCode: '',
     gstRate: '18',
     unitOfMeasure: 'LITRE',
   });
   const [errors, setErrors] = useState<Partial<BulkVariantFormState>>({});

   const field = (key: keyof BulkVariantFormState) => ({
     value: form[key],
     onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
       setForm((f) => ({ ...f, [key]: e.target.value })),
   });

   const sizes = parseCommaSeparated(form.sizesRaw);
   const colors = parseCommaSeparated(form.colorsRaw);
   const combinations = sizes.flatMap((s) => colors.map((c) => ({ size: s, color: c })));

   const validate = (): boolean => {
     const errs: Partial<BulkVariantFormState> = {};
     if (!form.brandId) errs.brandId = 'Brand is required';
     if (!form.baseProductName.trim()) errs.baseProductName = 'Base name is required';
     if (!form.category.trim()) errs.category = 'Category is required';
     if (sizes.length === 0) errs.sizesRaw = 'At least one size required';
     if (colors.length === 0) errs.colorsRaw = 'At least one color required';
     setErrors(errs);
     return Object.keys(errs).length === 0;
   };

   const handleGenerate = async () => {
     if (!validate()) return;
     const brand = brands.find((b) => b.id === parseInt(form.brandId, 10));
     if (!brand) return;
     await onSave({
       brandId: brand.id,
       brandName: brand.name,
       brandCode: brand.code,
       baseProductName: form.baseProductName.trim(),
       category: form.category.trim(),
       sizes,
       colors,
       unitOfMeasure: form.unitOfMeasure,
       hsnCode: form.hsnCode.trim() || undefined,
       gstRate: parseFloat(form.gstRate),
     });
   };

   return (
     <div className="space-y-4">
       {result ? (
         <div className="space-y-3">
           <p className="text-[13px] text-[var(--color-text-secondary)]">
             {result.length} variant(s) generated successfully.
           </p>
           <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border-default)]">
             <table className="w-full text-[13px]">
               <thead className="bg-[var(--color-surface-secondary)]">
                 <tr>
                   <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">SKU</th>
                   <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Name</th>
                   <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Size</th>
                   <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Color</th>
                 </tr>
               </thead>
               <tbody>
                 {result.map((v, i) => (
                   <tr key={i} className="border-t border-[var(--color-border-subtle)]">
                     <td className="px-3 py-2 font-mono text-[12px] text-[var(--color-text-secondary)]">{v.sku}</td>
                     <td className="px-3 py-2 text-[var(--color-text-primary)]">{v.name}</td>
                     <td className="px-3 py-2 text-[var(--color-text-secondary)]">{v.size}</td>
                     <td className="px-3 py-2 text-[var(--color-text-secondary)]">{v.color}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <div className="flex justify-end">
             <Button onClick={onClose}>Done</Button>
           </div>
         </div>
       ) : (
         <>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <Select
               label="Brand *"
               options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
               placeholder="Select brand"
               {...field('brandId')}
               error={errors.brandId}
             />
             <Input
               label="Base Product Name *"
               placeholder="e.g. Premium Emulsion"
               {...field('baseProductName')}
               error={errors.baseProductName}
             />
             <Input
               label="Category *"
               placeholder="e.g. Interior Wall Paint"
               {...field('category')}
               error={errors.category}
             />
             <Select
               label="GST Rate *"
               options={GST_RATES}
               {...field('gstRate')}
             />
             <Input
               label="Sizes *"
               placeholder="e.g. 1L, 4L, 20L"
               hint="Comma-separated"
               {...field('sizesRaw')}
               error={errors.sizesRaw}
             />
             <Input
               label="Colors *"
               placeholder="e.g. White, Off-White, Cream"
               hint="Comma-separated"
               {...field('colorsRaw')}
               error={errors.colorsRaw}
             />
           </div>

           {/* Preview matrix */}
           {combinations.length > 0 && (
             <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] p-3">
               <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
                 Preview — {combinations.length} variant(s)
               </p>
               <div className="flex flex-wrap gap-1.5">
                 {combinations.slice(0, 20).map((c, i) => (
                   <span
                     key={i}
                     className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)]"
                   >
                     {c.size} / {c.color}
                   </span>
                 ))}
                 {combinations.length > 20 && (
                   <span className="text-[11px] text-[var(--color-text-tertiary)]">
                     +{combinations.length - 20} more
                   </span>
                 )}
               </div>
             </div>
           )}

           <div className="flex justify-end gap-2 pt-2">
             <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
             <Button
               leftIcon={<Layers size={14} />}
               onClick={handleGenerate}
               isLoading={isSaving}
             >
               Generate Variants
             </Button>
           </div>
         </>
       )}
     </div>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function ProductCatalogPage() {
   const toast = useToast();
   const [products, setProducts] = useState<CatalogProductDto[]>([]);
   const [brands, setBrands] = useState<CatalogBrandDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Create / edit modal
   const [showCreate, setShowCreate] = useState(false);
   const [editProduct, setEditProduct] = useState<CatalogProductDto | null>(null);
   const [isSaving, setIsSaving] = useState(false);

   // Bulk variant modal
   const [showBulkVariant, setShowBulkVariant] = useState(false);
   const [isBulkSaving, setIsBulkSaving] = useState(false);
   const [bulkResult, setBulkResult] = useState<VariantItem[] | null>(null);

   // Archive confirm
   const [archiveTarget, setArchiveTarget] = useState<CatalogProductDto | null>(null);
   const [isArchiving, setIsArchiving] = useState(false);

   const load = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [productsData, brandsData] = await Promise.all([
         inventoryApi.getProducts({ pageSize: 100, page: 0 }),
         inventoryApi.getBrands(true),
       ]);
       setProducts(productsData.content ?? []);
       setBrands(brandsData);
     } catch {
       setError('Failed to load product catalog. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     load();
   }, [load]);

   const handleCreate = async (data: CatalogProductRequest) => {
     setIsSaving(true);
     try {
       await inventoryApi.createProduct(data);
       toast.success('Product created successfully.');
       setShowCreate(false);
       load();
     } catch (err: unknown) {
       const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
       if (msg?.includes('duplicate') || msg?.includes('BUS_002') || msg?.includes('Duplicate')) {
         toast.error('A product with this SKU already exists. Please use a different name or brand.');
       } else {
         toast.error('Failed to create product. Please try again.');
       }
     } finally {
       setIsSaving(false);
     }
   };

   const handleUpdate = async (data: CatalogProductRequest) => {
     if (!editProduct) return;
     setIsSaving(true);
     try {
       await inventoryApi.updateProduct(editProduct.id, data);
       toast.success('Product updated successfully.');
       setEditProduct(null);
       load();
     } catch (err: unknown) {
       const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
       if (msg?.includes('duplicate') || msg?.includes('BUS_002') || msg?.includes('Duplicate')) {
         toast.error('Duplicate SKU detected. Please change the product name or brand.');
       } else {
         toast.error('Failed to update product. Please try again.');
       }
     } finally {
       setIsSaving(false);
     }
   };

   const handleArchive = async () => {
     if (!archiveTarget) return;
     setIsArchiving(true);
     try {
       await inventoryApi.archiveProduct(archiveTarget.id);
       toast.success(`"${archiveTarget.name}" archived.`);
       setArchiveTarget(null);
       load();
     } catch {
       toast.error('Failed to archive product. Please try again.');
     } finally {
       setIsArchiving(false);
     }
   };

   const handleBulkVariants = async (data: BulkVariantRequest) => {
     setIsBulkSaving(true);
     try {
       const resp = await inventoryApi.createBulkVariants(data);
       setBulkResult(resp.created ?? resp.generated ?? []);
       toast.success(`Bulk variants generated.`);
       load();
     } catch {
       toast.error('Failed to generate variants. Please try again.');
     } finally {
       setIsBulkSaving(false);
     }
   };

   const COLUMNS: Column<CatalogProductDto>[] = [
     {
       id: 'sku',
       header: 'SKU',
       accessor: (row) => (
         <span className="font-mono text-[12px] text-[var(--color-text-secondary)]">{row.sku}</span>
       ),
       sortable: true,
       sortAccessor: (row) => row.sku,
       width: '120px',
     },
     {
       id: 'name',
       header: 'Product',
       accessor: (row) => (
         <div>
           <p className="font-medium text-[var(--color-text-primary)]">{row.name}</p>
           <p className="text-[11px] text-[var(--color-text-tertiary)]">{row.brandName}</p>
         </div>
       ),
       sortable: true,
       sortAccessor: (row) => row.name,
     },
     {
       id: 'gstRate',
       header: 'GST',
       accessor: (row) => (
         <span className="tabular-nums">{row.gstRate}%</span>
       ),
       align: 'center',
       hideOnMobile: true,
       width: '80px',
     },
     {
       id: 'unitOfMeasure',
       header: 'UOM',
       accessor: (row) => row.unitOfMeasure,
       align: 'center',
       hideOnMobile: true,
       width: '80px',
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={row.active ? 'success' : 'default'} dot>
           {row.active ? 'Active' : 'Archived'}
         </Badge>
       ),
       align: 'center',
       width: '100px',
     },
     {
       id: 'actions',
       header: '',
       accessor: (row) => (
         <DropdownMenu
           trigger={
             <button
               type="button"
               className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
               aria-label="Product actions"
             >
               <MoreHorizontal size={15} />
             </button>
           }
           items={[
             { label: 'Edit', value: 'edit' },
             { label: 'Archive', value: 'archive', destructive: true },
           ]}
           onSelect={(value) => {
             if (value === 'edit') setEditProduct(row);
             else if (value === 'archive') setArchiveTarget(row);
           }}
         />
       ),
       width: '48px',
     },
   ];

   // ── Render ────────────────────────────────────────────────────────────────

   if (isLoading) {
     return (
       <div className="space-y-5">
         <Skeleton className="h-9 w-48" />
         <Skeleton className="h-64 w-full rounded-xl" />
       </div>
     );
   }

   if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-16 gap-3">
         <AlertCircle size={22} className="text-[var(--color-danger-text)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
         <Button size="sm" variant="secondary" leftIcon={<RefreshCcw size={13} />} onClick={load}>
           Retry
         </Button>
       </div>
     );
   }

   return (
     <div className="space-y-5">
       <PageHeader
         title="Product Catalog"
         description="Manage products, variants and pricing"
         actions={
           <div className="flex items-center gap-2">
             <Button
               size="sm"
               variant="secondary"
               leftIcon={<Layers size={14} />}
               onClick={() => { setBulkResult(null); setShowBulkVariant(true); }}
             >
               Bulk Variants
             </Button>
             <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
               New Product
             </Button>
           </div>
         }
       />

       <DataTable
         columns={COLUMNS}
         data={products}
         keyExtractor={(row) => row.id}
         searchable
         searchPlaceholder="Search products or SKU..."
         searchFilter={(row, q) =>
           row.name.toLowerCase().includes(q) ||
           row.sku.toLowerCase().includes(q) ||
           row.brandName.toLowerCase().includes(q)
         }
         emptyMessage="No products found. Create your first product to get started."
       />

       {/* Create Modal */}
       <Modal
         isOpen={showCreate}
         onClose={() => setShowCreate(false)}
         title="Create Product"
         description="Add a new product to the catalog"
         size="lg"
       >
         <ProductForm
           brands={brands}
           onSave={handleCreate}
           onClose={() => setShowCreate(false)}
           isSaving={isSaving}
         />
       </Modal>

       {/* Edit Modal */}
       <Modal
         isOpen={editProduct !== null}
         onClose={() => setEditProduct(null)}
         title="Edit Product"
         description={editProduct?.name ?? ''}
         size="lg"
       >
         {editProduct && (
           <ProductForm
             brands={brands}
             initial={editProduct}
             onSave={handleUpdate}
             onClose={() => setEditProduct(null)}
             isSaving={isSaving}
           />
         )}
       </Modal>

       {/* Bulk Variant Modal */}
       <Modal
         isOpen={showBulkVariant}
         onClose={() => setShowBulkVariant(false)}
         title="Generate Bulk Variants"
         description="Create a matrix of size × color variant products"
         size="lg"
       >
         <BulkVariantModal
           brands={brands}
           onSave={handleBulkVariants}
           onClose={() => setShowBulkVariant(false)}
           isSaving={isBulkSaving}
           result={bulkResult}
         />
       </Modal>

       {/* Archive Confirm */}
       <ConfirmDialog
         isOpen={archiveTarget !== null}
        onCancel={() => setArchiveTarget(null)}
         onConfirm={handleArchive}
         title="Archive Product"
         message={`Archive "${archiveTarget?.name}"? It will no longer appear in active listings.`}
         confirmLabel="Archive"
         variant="danger"
         isLoading={isArchiving}
       />
     </div>
   );
}

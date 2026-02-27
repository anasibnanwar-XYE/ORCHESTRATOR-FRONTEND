import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductEditDialog from '../../components/catalog/ProductEditDialog';
import { Dialog, Tab, Transition } from '@headlessui/react';
import { PlusCircleIcon, PencilSquareIcon, ArrowUpTrayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import {
  createCatalogProduct,
  importCatalogCsv,
  createBulkVariants,
  listAccounts,
  listCatalogProducts,
  updateCatalogProduct,
  type AccountSummary,
  type CatalogProduct,
  type CatalogProductCreatePayload,
  type CatalogProductUpdatePayload,
  type BulkVariantRequest,
  type BulkVariantResponse,
  type CatalogImportResponse,
} from '../../lib/accountingApi';
import {
  createFinishedGood,
  createRawMaterial,
  importOpeningStock,
  listProductionBrands,
  listRawMaterials,
  updateRawMaterial,
  type FinishedGoodRequest,
  type ProductionBrandDto,
  type RawMaterialDto,
  type RawMaterialRequest,
  type OpeningStockImportResponse,
} from '../../lib/factoryApi';
import { formatAmount } from '../../lib/formatUtils';

const categories = ['GENERAL', 'FINISHED_GOOD', 'RAW_MATERIAL', 'SERVICE'];

const emptyProductForm = {
  brandId: '',
  brandName: '',
  brandCode: '',
  productName: '',
  category: 'GENERAL',
  defaultColour: '',
  unitOfMeasure: '',
  basePrice: '',
  gstRate: '',
  minDiscountPercent: '',
  minSellingPrice: '',
  revenueAccountId: '',
  cogsAccountId: '',
  fgInventoryAccountId: '',
  taxAccountId: '',
};

interface RawMaterialFormState {
  name: string;
  sku: string;
  unitType: string;
  reorderLevel: number;
  minStock: number;
  maxStock: number;
  materialType: 'PRODUCTION' | 'PACKAGING';
}

const initialRawMaterial: RawMaterialFormState = {
  name: '',
  sku: '',
  unitType: '',
  reorderLevel: 0,
  minStock: 0,
  maxStock: 0,
  materialType: 'PRODUCTION',
};

const numberString = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
const parseNumber = (value: string) => {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};
const formatCurrency = formatAmount;
const resolveGstSlabs = (metadata?: Record<string, unknown> | null) => {
  if (!metadata || typeof metadata !== 'object') return [] as Array<[string, number]>;
  const raw = (metadata as Record<string, unknown>).gstSlabs;
  if (!raw || typeof raw !== 'object') return [] as Array<[string, number]>;
  return Object.entries(raw as Record<string, unknown>).filter((entry): entry is [string, number] => typeof entry[1] === 'number');
};

/* Shared input class for all modal forms */
const inputClass = 'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const selectClass = 'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const btnSecondary = 'rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-surface-highlight transition-colors min-h-[44px] touch-manipulation';
const btnPrimary = 'rounded-lg bg-action-bg px-4 py-2 text-sm font-medium text-action-text shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation';

export default function CatalogPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productLoading, setProductLoading] = useState(false);

  const [brands, setBrands] = useState<ProductionBrandDto[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productEditing, setProductEditing] = useState<CatalogProduct | null>(null);


  const [rawMaterials, setRawMaterials] = useState<RawMaterialDto[]>([]);
  const [rawSearch, setRawSearch] = useState('');
  const [rawStatus, setRawStatus] = useState('');
  const [rawModalOpen, setRawModalOpen] = useState(false);
  const [rawEditing, setRawEditing] = useState<RawMaterialDto | null>(null);
  const [rawForm, setRawForm] = useState<RawMaterialFormState>(initialRawMaterial);
  const [rawMessage, setRawMessage] = useState<string | null>(null);
  const [savingRaw, setSavingRaw] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  // Bulk variant state
  const [bulkVariantModalOpen, setBulkVariantModalOpen] = useState(false);
  const [bulkVariantForm, setBulkVariantForm] = useState<BulkVariantRequest>({
    baseProductName: '',
    category: 'FINISHED_GOOD',
    colors: [],
    sizes: [],
    unitOfMeasure: '',
    skuPrefix: '',
    basePrice: 0,
    gstRate: 18,
    minDiscountPercent: 5,
    minSellingPrice: 0,
  });
  const [bulkVariantBrandMode, setBulkVariantBrandMode] = useState<'existing' | 'new'>('existing');
  const [bulkVariantMessage, setBulkVariantMessage] = useState<string | null>(null);
  const [savingBulkVariants, setSavingBulkVariants] = useState(false);
  const [bulkVariantResults, setBulkVariantResults] = useState<BulkVariantResponse | null>(null);

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [catalogImportFile, setCatalogImportFile] = useState<File | null>(null);
  const [catalogImportResult, setCatalogImportResult] = useState<CatalogImportResponse | null>(null);
  const [catalogImportMessage, setCatalogImportMessage] = useState<string | null>(null);
  const [catalogImporting, setCatalogImporting] = useState(false);

  const [stockImportFile, setStockImportFile] = useState<File | null>(null);
  const [stockImportResult, setStockImportResult] = useState<OpeningStockImportResponse | null>(null);
  const [stockImportMessage, setStockImportMessage] = useState<string | null>(null);
  const [stockImporting, setStockImporting] = useState(false);

  // Color and size filters
  const [productColorFilter, setProductColorFilter] = useState('');
  const [productSizeFilter, setProductSizeFilter] = useState('');

  useEffect(() => {
    if (!session) return;
    setProductLoading(true);
    listCatalogProducts(session)
      .then(setProducts)
      .catch(() => setToast('Unable to load catalog products.'))
      .finally(() => setProductLoading(false));
    listProductionBrands(session).then(setBrands).catch(() => setToast('Unable to load production brands.'));
    listRawMaterials(session).then(setRawMaterials).catch(() => setToast('Unable to load raw materials.'));
    listAccounts(session).then(setAccounts).catch(() => setToast('Unable to load ledger accounts.'));
  }, [session]);

  const filteredProducts = useMemo(() => (
    products.filter((product) => {
      const matchesSearch =
        !productSearch ||
        (product.productName ?? '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (product.skuCode && product.skuCode.toLowerCase().includes(productSearch.toLowerCase())) ||
        (product.brandName && product.brandName.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesCategory = !productCategory || (product.category && product.category === productCategory);
      const matchesColor = !productColorFilter || (product.defaultColour && product.defaultColour.toLowerCase().includes(productColorFilter.toLowerCase()));
      const matchesSize = !productSizeFilter || (product.sizeLabel && product.sizeLabel.toLowerCase().includes(productSizeFilter.toLowerCase()));
      return matchesSearch && matchesCategory && matchesColor && matchesSize;
    })
  ), [products, productSearch, productCategory, productColorFilter, productSizeFilter]);

  const filteredRawMaterials = useMemo(() => (
    rawMaterials.filter((material) => {
      const matchesSearch =
        !rawSearch ||
        (material.name ?? '').toLowerCase().includes(rawSearch.toLowerCase()) ||
        (material.sku ?? '').toLowerCase().includes(rawSearch.toLowerCase());
      const matchesStatus = !rawStatus || (material.stockStatus ?? '') === rawStatus;
      return matchesSearch && matchesStatus;
    })
  ), [rawMaterials, rawSearch, rawStatus]);

  const openCreateProduct = () => {
    setProductEditing(null);
    setProductModalOpen(true);
  };

  const openEditProduct = (product: CatalogProduct) => {
    setProductEditing(product);
    setProductModalOpen(true);
  };

  const openCreateRawMaterial = () => {
    setRawEditing(null);
    setRawForm(initialRawMaterial);
    setRawMessage(null);
    setRawModalOpen(true);
  };

  const openEditRawMaterial = (material: RawMaterialDto) => {
    setRawEditing(material);
    setRawForm({
      name: material.name ?? '',
      sku: material.sku ?? '',
      unitType: material.unitType ?? '',
      reorderLevel: material.reorderLevel ?? 0,
      minStock: material.minStock ?? 0,
      maxStock: material.maxStock ?? 0,
      materialType: (material.materialType === 'PRODUCTION' || material.materialType === 'PACKAGING') ? material.materialType : 'PRODUCTION',
    });
    setRawMessage(null);
    setRawModalOpen(true);
  };

  const openImportModal = () => {
    setImportModalOpen(true);
    setCatalogImportFile(null);
    setCatalogImportResult(null);
    setCatalogImportMessage(null);
    setStockImportFile(null);
    setStockImportResult(null);
    setStockImportMessage(null);
  };

  const handleCatalogImport = async () => {
    if (!session) return;
    if (!catalogImportFile) {
      setCatalogImportMessage('Choose a CSV file to import.');
      return;
    }
    setCatalogImporting(true);
    setCatalogImportMessage(null);
    setCatalogImportResult(null);
    try {
      const result = await importCatalogCsv(catalogImportFile, session);
      setCatalogImportResult(result);
      setCatalogImportMessage('Catalog import completed.');
      listCatalogProducts(session).then(setProducts).catch(() => setToast('Unable to refresh catalog.'));
    } catch (err) {
      setCatalogImportMessage(err instanceof Error ? err.message : 'Unable to import catalog.');
    } finally {
      setCatalogImporting(false);
    }
  };

  const handleStockImport = async () => {
    if (!session) return;
    if (!stockImportFile) {
      setStockImportMessage('Choose a CSV file to import.');
      return;
    }
    setStockImporting(true);
    setStockImportMessage(null);
    setStockImportResult(null);
    try {
      const result = await importOpeningStock(stockImportFile, session);
      setStockImportResult(result);
      setStockImportMessage('Opening stock import completed.');
      listRawMaterials(session).then(setRawMaterials).catch(() => setToast('Unable to refresh raw materials.'));
    } catch (err) {
      setStockImportMessage(err instanceof Error ? err.message : 'Unable to import opening stock.');
    } finally {
      setStockImporting(false);
    }
  };

  const handleSaveRawMaterial = async () => {
    if (!session) return;
    if (!rawForm.name || !rawForm.unitType) {
      setRawMessage('Name and Unit Type are required.');
      return;
    }
    const trimmedSku = typeof rawForm.sku === 'string' ? rawForm.sku.trim() : '';
    const resolvedSku = trimmedSku || rawEditing?.sku || '';
    if (rawEditing && !resolvedSku) {
      setRawMessage('Unable to update: missing SKU.');
      return;
    }
    const payload: RawMaterialRequest = {
      name: rawForm.name,
      sku: rawEditing ? resolvedSku : trimmedSku || undefined,
      unitType: rawForm.unitType,
      reorderLevel: Number(rawForm.reorderLevel) || 0,
      minStock: Number(rawForm.minStock) || 0,
      maxStock: Number(rawForm.maxStock) || 0,
    };
    setSavingRaw(true);
    setRawMessage(null);
    try {
      if (rawEditing) {
        if (rawEditing.id == null) {
          setRawMessage('Unable to update: missing raw material ID.');
          return;
        }
        await updateRawMaterial(rawEditing.id, payload, session);
        setToast('Raw material updated.');
      } else {
        await createRawMaterial(payload, session);
        setToast('Raw material added.');
      }
      setRawModalOpen(false);
      if (session) {
        listRawMaterials(session).then(setRawMaterials).catch(() => setToast('Unable to refresh raw materials.'));
      }
    } catch (err) {
      setRawMessage(err instanceof Error ? err.message : 'Unable to save raw material.');
    } finally {
      setSavingRaw(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold font-display text-primary tracking-tight">Product Catalog</h1>
          <p className="text-sm text-secondary max-w-2xl">Manage your products and raw materials in one place. Configure pricing, GST rates, and inventory rules.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => navigate('/accounting/config-health')} className={btnSecondary + ' inline-flex items-center gap-2'}>
            <Cog6ToothIcon className="h-5 w-5" />
            <span>Config Health</span>
          </button>
          <button type="button" onClick={openCreateProduct} className={btnPrimary + ' inline-flex items-center gap-2'}>
            <PlusCircleIcon className="h-5 w-5" />
            <span>New Product</span>
          </button>
          <button type="button" onClick={() => { setBulkVariantModalOpen(true); setBulkVariantResults(null); setBulkVariantMessage(null); }} className={btnPrimary + ' inline-flex items-center gap-2'}>
            <PlusCircleIcon className="h-5 w-5" />
            <span>Bulk Variants</span>
          </button>
          <button type="button" onClick={openImportModal} className={btnSecondary + ' inline-flex items-center gap-2'}>
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span>Import CSV</span>
          </button>
          <button type="button" onClick={openCreateRawMaterial} className={btnSecondary + ' inline-flex items-center gap-2'}>
            <PlusCircleIcon className="h-5 w-5" />
            <span>New Material</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-lg border border-status-success-text/20 bg-status-success-bg px-4 py-3 text-sm font-medium text-status-success-text">
          {toast}
        </div>
      )}

      {/* Tab Group */}
      <Tab.Group>
        <Tab.List className="flex w-full max-w-md gap-1 rounded-xl bg-surface-highlight p-1 border border-border">
          {['Products', 'Raw Materials'].map((label) => (
            <Tab key={label} className={({ selected }) =>
              clsx(
                'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all focus:outline-none',
                selected
                  ? 'bg-surface text-primary shadow-sm ring-1 ring-border'
                  : 'text-secondary hover:text-primary hover:bg-surface/50'
              )
            }>
              {label}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">

          {/* ───── PRODUCTS TAB ───── */}
          <Tab.Panel className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center rounded-xl border border-border bg-surface p-2 shadow-sm">
              <div className="flex-1 min-w-[240px]">
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-10 rounded-lg border-0 bg-transparent px-3 text-sm text-primary placeholder:text-tertiary focus:ring-0"
                />
              </div>
              <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="h-10 rounded-lg border-0 bg-transparent px-3 text-sm text-secondary font-medium focus:ring-0 cursor-pointer hover:text-primary"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (<option key={cat} value={cat}>{cat.replace('_', ' ')}</option>))}
              </select>
              <input
                value={productColorFilter}
                onChange={(e) => setProductColorFilter(e.target.value)}
                placeholder="Filter by color..."
                className="h-10 rounded-lg border-0 bg-transparent px-3 text-sm text-primary placeholder:text-tertiary focus:ring-0 min-w-[120px]"
              />
              <input
                value={productSizeFilter}
                onChange={(e) => setProductSizeFilter(e.target.value)}
                placeholder="Filter by size..."
                className="h-10 rounded-lg border-0 bg-transparent px-3 text-sm text-primary placeholder:text-tertiary focus:ring-0 min-w-[120px]"
              />
              <button type="button" onClick={() => session && listCatalogProducts(session).then(setProducts)} className="h-9 px-4 rounded-lg bg-surface-highlight text-sm font-medium text-primary hover:opacity-80 transition-colors">
                Refresh
              </button>
            </div>

            {/* Desktop table (hidden on mobile) */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <div className="grid grid-cols-7 gap-4 border-b border-border bg-surface-highlight px-6 py-3 text-xs font-medium uppercase tracking-wider text-secondary">
                <div className="col-span-2">Product Details</div>
                <div>SKU</div>
                <div>Category</div>
                <div className="text-right">Base Price</div>
                <div className="text-right">Config</div>
                <div className="text-right">Min Price</div>
              </div>
              {productLoading ? (
                <div className="px-6 py-12 text-center text-sm text-secondary">Loading catalog...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-secondary">No products found matching your filters.</div>
              ) : (
                filteredProducts.map((product) => {
                  const gstSlabs = resolveGstSlabs(product.metadata);
                  return (
                    <div key={product.id} className="group grid grid-cols-7 items-center gap-4 border-b border-border px-6 py-4 text-sm last:border-0 hover:bg-surface-highlight/50 transition-colors">
                      <div className="col-span-2">
                        <p className="font-medium text-primary">{product.productName}</p>
                        <p className="text-xs text-secondary mt-0.5">{product.brandName}</p>
                        {gstSlabs.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {gstSlabs.map(([state, rate]) => (
                              <span key={`${product.id}-${state}`} className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-surface-highlight text-secondary border border-border">
                                {state} {rate}%
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <code className="rounded bg-surface-highlight px-1.5 py-0.5 text-xs font-mono text-primary border border-border">{product.skuCode}</code>
                        {product.defaultColour && <p className="text-xs text-tertiary mt-1">{product.defaultColour}</p>}
                      </div>
                      <div>
                        <span className="inline-flex items-center rounded-full bg-surface-highlight px-2 py-1 text-xs font-medium text-secondary border border-border">
                          {product.category?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      <div className="text-right font-medium text-primary tabular-nums">{formatCurrency(product.basePrice || 0)}</div>
                      <div className="text-right text-xs space-y-1">
                        <p className="text-secondary">GST {product.gstRate || 0}%</p>
                        <p className="text-tertiary">Disc {product.minDiscountPercent || 0}%</p>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <div className="text-right font-medium text-status-success-text tabular-nums">{formatCurrency(product.minSellingPrice || 0)}</div>
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-tertiary hover:bg-surface-highlight hover:text-primary transition-all"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile cards (hidden on desktop) */}
            <div className="sm:hidden space-y-3">
              {productLoading ? (
                <div className="rounded-xl border border-border bg-surface px-4 py-12 text-center text-sm text-secondary">Loading catalog...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface px-4 py-12 text-center text-sm text-secondary">No products found matching your filters.</div>
              ) : (
                filteredProducts.map((product) => {
                  const gstSlabs = resolveGstSlabs(product.metadata);
                  return (
                    <div key={product.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-primary truncate">{product.productName}</p>
                          <p className="text-xs text-secondary mt-0.5">{product.brandName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="rounded-lg p-2 text-tertiary hover:bg-surface-highlight hover:text-primary transition-all touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <code className="rounded bg-surface-highlight px-1.5 py-0.5 text-xs font-mono text-primary border border-border">{product.skuCode}</code>
                        <span className="inline-flex items-center rounded-full bg-surface-highlight px-2 py-0.5 text-[10px] font-medium text-secondary border border-border">
                          {product.category?.replace('_', ' ') || 'N/A'}
                        </span>
                        {product.defaultColour && <span className="text-[10px] text-tertiary">{product.defaultColour}</span>}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-tertiary">Base Price</p>
                          <p className="font-medium text-primary tabular-nums">{formatCurrency(product.basePrice || 0)}</p>
                        </div>
                        <div>
                          <p className="text-tertiary">GST / Disc</p>
                          <p className="font-medium text-secondary">{product.gstRate || 0}% / {product.minDiscountPercent || 0}%</p>
                        </div>
                        <div>
                          <p className="text-tertiary">Min Price</p>
                          <p className="font-medium text-status-success-text tabular-nums">{formatCurrency(product.minSellingPrice || 0)}</p>
                        </div>
                      </div>
                      {gstSlabs.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {gstSlabs.map(([state, rate]) => (
                            <span key={`${product.id}-${state}`} className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-surface-highlight text-secondary border border-border">
                              {state} {rate}%
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Tab.Panel>

          {/* ───── RAW MATERIALS TAB ───── */}
          <Tab.Panel className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center rounded-xl border border-border bg-surface p-2 shadow-sm">
              <div className="flex-1 min-w-[240px]">
                <input
                  value={rawSearch}
                  onChange={(e) => setRawSearch(e.target.value)}
                  placeholder="Search materials..."
                  className="w-full h-10 rounded-lg border-0 bg-transparent px-3 text-sm text-primary placeholder:text-tertiary focus:ring-0"
                />
              </div>
              <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
              <select
                value={rawStatus}
                onChange={(e) => setRawStatus(e.target.value)}
                className="h-10 rounded-lg border-0 bg-transparent px-3 text-sm text-secondary font-medium focus:ring-0 cursor-pointer hover:text-primary"
              >
                <option value="">All Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="CRITICAL">Critical Stock</option>
              </select>
              <button type="button" onClick={() => session && listRawMaterials(session).then(setRawMaterials)} className="h-9 px-4 rounded-lg bg-surface-highlight text-sm font-medium text-primary hover:opacity-80 transition-colors">
                Refresh
              </button>
            </div>

            {/* Desktop table (hidden on mobile) */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <div className="grid grid-cols-6 gap-4 border-b border-border bg-surface-highlight px-6 py-3 text-xs font-medium uppercase tracking-wider text-secondary">
                <div className="col-span-2">Material</div>
                <div>SKU</div>
                <div className="text-right">Current Stock</div>
                <div className="text-right">Levels</div>
                <div className="text-right">Actions</div>
              </div>
              {filteredRawMaterials.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-secondary">No raw materials found.</div>
              ) : (
                filteredRawMaterials.map((material) => (
                  <div key={material.id} className="group grid grid-cols-6 items-center gap-4 border-b border-border px-6 py-4 text-sm last:border-0 hover:bg-surface-highlight/50 transition-colors">
                    <div className="col-span-2">
                      <p className="font-medium text-primary">{material.name}</p>
                      <p className="text-xs text-secondary mt-0.5">{material.unitType}</p>
                    </div>
                    <div>
                      <code className="rounded bg-surface-highlight px-1.5 py-0.5 text-xs font-mono text-primary border border-border">{material.sku}</code>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary tabular-nums">{(material.currentStock ?? 0).toLocaleString()}</p>
                      <span className={clsx(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-1',
                        material.stockStatus === 'IN_STOCK' ? 'bg-status-success-bg text-status-success-text' :
                          material.stockStatus === 'LOW_STOCK' ? 'bg-status-warning-bg text-status-warning-text' :
                            'bg-status-error-bg text-status-error-text'
                      )}>
                        {(material.stockStatus ?? 'UNKNOWN').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <p className="text-secondary">Min: {material.minStock}</p>
                      <p className="text-tertiary">Max: {material.maxStock}</p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => openEditRawMaterial(material)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-highlight hover:text-primary transition-colors"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mobile cards (hidden on desktop) */}
            <div className="sm:hidden space-y-3">
              {filteredRawMaterials.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface px-4 py-12 text-center text-sm text-secondary">No raw materials found.</div>
              ) : (
                filteredRawMaterials.map((material) => (
                  <div key={material.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-primary truncate">{material.name}</p>
                        <p className="text-xs text-secondary mt-0.5">{material.unitType}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditRawMaterial(material)}
                        className="rounded-lg p-2 text-tertiary hover:bg-surface-highlight hover:text-primary transition-all touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <code className="rounded bg-surface-highlight px-1.5 py-0.5 text-xs font-mono text-primary border border-border">{material.sku}</code>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-tertiary">Stock</p>
                        <p className="font-medium text-primary tabular-nums">{(material.currentStock ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-tertiary">Min / Max</p>
                        <p className="font-medium text-secondary">{material.minStock} / {material.maxStock}</p>
                      </div>
                      <div>
                        <p className="text-tertiary">Status</p>
                        <span className={clsx(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                          material.stockStatus === 'IN_STOCK' ? 'bg-status-success-bg text-status-success-text' :
                            material.stockStatus === 'LOW_STOCK' ? 'bg-status-warning-bg text-status-warning-text' :
                              'bg-status-error-bg text-status-error-text'
                        )}>
                          {(material.stockStatus ?? 'UNKNOWN').replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Product Edit Dialog */}
      <ProductEditDialog
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={productEditing}
        onSuccess={() => {
          if (session) {
            listCatalogProducts(session).then(setProducts).catch(() => setToast('Unable to refresh catalog.'));
          }
        }}
        brands={brands}
        accounts={accounts}
      />

      {/* ───── IMPORT CSV MODAL ───── */}
      <Transition show={importModalOpen} as={Fragment}>
        <Dialog onClose={() => setImportModalOpen(false)} className="relative z-50">
          <Transition.Child as="div" enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
              <Transition.Child as="div" enter="ease-out duration-150" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-3">
                <Dialog.Panel className="w-full max-w-3xl rounded-xl border border-border bg-surface p-6 shadow-lg ring-1 ring-border">
                  <Dialog.Title className="text-xl font-semibold text-primary">Import CSV</Dialog.Title>
                  <p className="mt-1 text-sm text-secondary">Upload your product catalog and opening stock without manual entry.</p>

                  <div className="mt-6 space-y-6">
                    {/* Catalog CSV Section */}
                    <div className="rounded-lg border border-border bg-surface-highlight p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-primary">Catalog CSV (products)</h3>
                          <p className="text-xs text-secondary">Creates or updates catalog items, brands, and raw materials.</p>
                        </div>
                      </div>

                      {catalogImportMessage && (
                        <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-xs text-secondary">
                          {catalogImportMessage}
                        </div>
                      )}

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(e) => setCatalogImportFile(e.target.files?.[0] ?? null)}
                          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary file:mr-3 file:rounded file:border-0 file:bg-action-bg file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-action-text hover:file:opacity-90"
                        />
                        <button
                          type="button"
                          onClick={handleCatalogImport}
                          disabled={catalogImporting}
                          className={btnPrimary + ' whitespace-nowrap'}
                        >
                          {catalogImporting ? 'Uploading...' : 'Upload Catalog'}
                        </button>
                      </div>

                      {catalogImportResult && (
                        <div className="mt-3 text-xs text-secondary space-y-1">
                          <div>Rows processed: {catalogImportResult.rowsProcessed ?? 0}</div>
                          <div>Brands created: {catalogImportResult.brandsCreated ?? 0}</div>
                          <div>Products created: {catalogImportResult.productsCreated ?? 0}</div>
                          <div>Products updated: {catalogImportResult.productsUpdated ?? 0}</div>
                          <div>Raw materials seeded: {catalogImportResult.rawMaterialsSeeded ?? 0}</div>
                          {catalogImportResult.errors?.length ? (
                            <div className="mt-2 rounded-md border border-status-error-text/20 bg-status-error-bg px-3 py-2 text-xs text-status-error-text">
                              {catalogImportResult.errors.slice(0, 5).map((error, idx) => (
                                <div key={`${error.rowNumber ?? idx}`}>Row {error.rowNumber ?? '-'}: {error.message ?? 'Unknown error'}</div>
                              ))}
                              {catalogImportResult.errors.length > 5 && <div>+ {catalogImportResult.errors.length - 5} more</div>}
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className="mt-4 rounded-md border border-dashed border-border bg-surface px-3 py-2 text-[11px] text-tertiary">
                        <div className="font-semibold text-secondary">Template</div>
                        <pre className="mt-2 whitespace-pre-wrap">{`brand,product_name,sku_code,category,default_colour,unit_of_measure,size,base_price,gst_rate
BigBright,Interior Emulsion,BBP-INT-01,FINISHED_GOOD,White,L,20L,2500,18`}</pre>
                      </div>
                    </div>

                    {/* Opening Stock CSV Section */}
                    <div className="rounded-lg border border-border bg-surface-highlight p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-primary">Opening Stock CSV</h3>
                          <p className="text-xs text-secondary">Adds raw material and finished goods stock in one upload.</p>
                        </div>
                      </div>

                      {stockImportMessage && (
                        <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-xs text-secondary">
                          {stockImportMessage}
                        </div>
                      )}

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(e) => setStockImportFile(e.target.files?.[0] ?? null)}
                          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary file:mr-3 file:rounded file:border-0 file:bg-action-bg file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-action-text hover:file:opacity-90"
                        />
                        <button
                          type="button"
                          onClick={handleStockImport}
                          disabled={stockImporting}
                          className={btnPrimary + ' whitespace-nowrap'}
                        >
                          {stockImporting ? 'Uploading...' : 'Upload Stock'}
                        </button>
                      </div>

                      {stockImportResult && (
                        <div className="mt-3 text-xs text-secondary space-y-1">
                          <div>Rows processed: {stockImportResult.rowsProcessed ?? 0}</div>
                          <div>Raw materials created: {stockImportResult.rawMaterialsCreated ?? 0}</div>
                          <div>Raw material batches: {stockImportResult.rawMaterialBatchesCreated ?? 0}</div>
                          <div>Finished goods created: {stockImportResult.finishedGoodsCreated ?? 0}</div>
                          <div>Finished good batches: {stockImportResult.finishedGoodBatchesCreated ?? 0}</div>
                          {stockImportResult.errors?.length ? (
                            <div className="mt-2 rounded-md border border-status-error-text/20 bg-status-error-bg px-3 py-2 text-xs text-status-error-text">
                              {stockImportResult.errors.slice(0, 5).map((error, idx) => (
                                <div key={`${error.rowNumber ?? idx}`}>Row {error.rowNumber ?? '-'}: {error.message ?? 'Unknown error'}</div>
                              ))}
                              {stockImportResult.errors.length > 5 && <div>+ {stockImportResult.errors.length - 5} more</div>}
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className="mt-4 rounded-md border border-dashed border-border bg-surface px-3 py-2 text-[11px] text-tertiary">
                        <div className="font-semibold text-secondary">Template</div>
                        <pre className="mt-2 whitespace-pre-wrap">{`type,sku,name,unit,unit_type,material_type,quantity,unit_cost,batch_code,manufactured_at
FINISHED_GOOD,BBP-INT-01,Interior Emulsion 20L,L,,,120,2200,OPEN-FG-1,2025-01-01
RAW_MATERIAL,RM-001,Titanium Dioxide,KG,KG,PRODUCTION,500,130,OPEN-RM-1,`}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button type="button" onClick={() => setImportModalOpen(false)} className={btnSecondary}>
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ───── RAW MATERIAL MODAL ───── */}
      <Transition show={rawModalOpen} as={Fragment}>
        <Dialog onClose={() => setRawModalOpen(false)} className="relative z-50">
          <Transition.Child as="div" enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto flex min-h-full max-w-lg items-center justify-center">
              <Transition.Child as="div" enter="ease-out duration-150" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-3">
                <Dialog.Panel className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-lg ring-1 ring-border">
                  <Dialog.Title className="text-xl font-semibold text-primary">{rawEditing ? 'Edit Raw Material' : 'Add Raw Material'}</Dialog.Title>

                  {rawMessage && (
                    <div className="mt-4 rounded-xl border border-status-error-text/20 bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
                      {rawMessage}
                    </div>
                  )}
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Material Name <span className="text-status-error-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={rawForm.name}
                        onChange={(e) => setRawForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., TITANIUM"
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          SKU Code
                        </label>
                        <input
                          type="text"
                          value={rawForm.sku || ''}
                          onChange={(e) => setRawForm((prev) => ({ ...prev, sku: e.target.value }))}
                          placeholder="Leave blank to auto-generate"
                          className={inputClass}
                        />
                        <p className="mt-1 text-xs text-tertiary">If you leave this empty, ORCHESTRATOR ERP will generate one for you.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          Unit Type <span className="text-status-error-text">*</span>
                        </label>
                        <input
                          type="text"
                          value={rawForm.unitType}
                          onChange={(e) => setRawForm((prev) => ({ ...prev, unitType: e.target.value }))}
                          placeholder="e.g., KG, L, BAG"
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Material Type
                      </label>
                      <select
                        value={rawForm.materialType || 'PRODUCTION'}
                        onChange={(e) => setRawForm((prev) => ({ ...prev, materialType: e.target.value as 'PRODUCTION' | 'PACKAGING' }))}
                        className={selectClass}
                      >
                        <option value="PRODUCTION">Production</option>
                        <option value="PACKAGING">Packaging</option>
                      </select>
                      <p className="mt-1 text-xs text-tertiary">Production materials are used in production runs. Packaging materials (buckets, cans, cartons) are used in packing operations.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          Reorder Level
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={rawForm.reorderLevel || ''}
                          onChange={(e) => setRawForm((prev) => ({ ...prev, reorderLevel: Number(e.target.value) || 0 }))}
                          placeholder="0"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          Minimum Stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={rawForm.minStock || ''}
                          onChange={(e) => setRawForm((prev) => ({ ...prev, minStock: Number(e.target.value) || 0 }))}
                          placeholder="0"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          Maximum Stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={rawForm.maxStock || ''}
                          onChange={(e) => setRawForm((prev) => ({ ...prev, maxStock: Number(e.target.value) || 0 }))}
                          placeholder="0"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2">
                    <button type="button" onClick={() => setRawModalOpen(false)} className={btnSecondary}>
                      Cancel
                    </button>
                    <button type="button" onClick={handleSaveRawMaterial} disabled={savingRaw} className={btnPrimary}>
                      {savingRaw ? 'Saving...' : rawEditing ? 'Update Material' : 'Add Material'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ───── BULK VARIANT MODAL ───── */}
      <Transition show={bulkVariantModalOpen} as={Fragment}>
        <Dialog onClose={() => { setBulkVariantModalOpen(false); setBulkVariantResults(null); }} className="relative z-50">
          <Transition.Child as="div" enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center">
              <Transition.Child as="div" enter="ease-out duration-150" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-3">
                <Dialog.Panel className="w-full rounded-xl border border-border bg-surface p-6 shadow-xl ring-1 ring-border max-h-[90vh] overflow-y-auto">
                  <Dialog.Title className="text-lg font-semibold text-primary tracking-tight">Create Bulk Variants</Dialog.Title>
                  <p className="mt-1 text-sm text-secondary">Generate multiple product variants by combining colors and sizes. SKUs are auto-generated.</p>

                  {bulkVariantMessage && (
                    <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${bulkVariantMessage.includes('success') || bulkVariantMessage.includes('created')
                      ? 'border-status-success-text/20 bg-status-success-bg text-status-success-text'
                      : 'border-status-error-text/20 bg-status-error-bg text-status-error-text'
                      }`}>
                      {bulkVariantMessage}
                    </div>
                  )}

                  {bulkVariantResults ? (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border border-status-success-text/20 bg-status-success-bg p-4">
                          <div className="text-2xl font-bold text-status-success-text font-display tabular-nums">{bulkVariantResults.created ?? 0}</div>
                          <div className="text-sm text-status-success-text">Created</div>
                        </div>
                        <div className="rounded-lg border border-status-warning-text/20 bg-status-warning-bg p-4">
                          <div className="text-2xl font-bold text-status-warning-text font-display tabular-nums">{bulkVariantResults.skippedExisting ?? 0}</div>
                          <div className="text-sm text-status-warning-text">Skipped (existing)</div>
                        </div>
                        <div className="rounded-lg border border-border bg-surface-highlight p-4">
                          <div className="text-2xl font-bold text-primary font-display tabular-nums">{bulkVariantResults.variants?.length ?? 0}</div>
                          <div className="text-sm text-secondary">Total Variants</div>
                        </div>
                      </div>

                      {/* Desktop variant table */}
                      <div className="hidden sm:block max-h-96 overflow-y-auto rounded-lg border border-border">
                        <div className="grid grid-cols-1 gap-0">
                          {(bulkVariantResults.variants ?? []).map((variant: Record<string, unknown>, idx: number) => {
                            return (
                              <div key={(variant.id as number) || idx} className="grid grid-cols-5 gap-4 px-4 py-3 text-sm border-b border-border last:border-0 bg-surface">
                                <div className="font-medium text-primary">{variant.productName as string}</div>
                                <div className="text-secondary">
                                  <code className="text-xs bg-surface-highlight px-1.5 py-0.5 rounded">{(variant.skuCode as string) || 'N/A'}</code>
                                </div>
                                <div className="text-secondary">{(variant.defaultColour as string) || '-'}</div>
                                <div className="text-secondary">{(variant.sizeLabel as string) || '-'}</div>
                                <div className="text-right">
                                  <span className="text-xs text-secondary font-medium">Variant</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mobile variant cards */}
                      <div className="sm:hidden max-h-96 overflow-y-auto space-y-2">
                        {(bulkVariantResults.variants ?? []).map((variant: Record<string, unknown>, idx: number) => (
                          <div key={(variant.id as number) || idx} className="rounded-lg border border-border bg-surface p-3">
                            <p className="font-medium text-primary text-sm">{variant.productName as string}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
                              <code className="bg-surface-highlight px-1.5 py-0.5 rounded text-secondary">{(variant.skuCode as string) || 'N/A'}</code>
                              {(variant.defaultColour as string) && <span className="text-tertiary">{variant.defaultColour as string}</span>}
                              {(variant.sizeLabel as string) && <span className="text-tertiary">{variant.sizeLabel as string}</span>}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                          type="button"
                          onClick={() => { setBulkVariantModalOpen(false); setBulkVariantResults(null); if (session) listCatalogProducts(session).then(setProducts); }}
                          className={btnPrimary}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Brand selection */}
                      <div className="mt-6 p-4 rounded-lg border border-border bg-surface-highlight/50">
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="bulk-brand-mode"
                              checked={bulkVariantBrandMode === 'existing'}
                              onChange={() => setBulkVariantBrandMode('existing')}
                              className="h-4 w-4 border-border accent-action-bg focus:ring-primary/20"
                            />
                            <span className="text-sm font-medium text-primary">Existing Brand</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="bulk-brand-mode"
                              checked={bulkVariantBrandMode === 'new'}
                              onChange={() => setBulkVariantBrandMode('new')}
                              className="h-4 w-4 border-border accent-action-bg focus:ring-primary/20"
                            />
                            <span className="text-sm font-medium text-primary">New Brand</span>
                          </label>
                        </div>

                        {bulkVariantBrandMode === 'existing' ? (
                          <div className="mt-4">
                            <select
                              value={bulkVariantForm.brandId || ''}
                              onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, brandId: e.target.value ? Number(e.target.value) : undefined }))}
                              className={selectClass}
                            >
                              <option value="">Select a brand...</option>
                              {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>{brand.name} ({brand.code})</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <input
                              value={bulkVariantForm.brandName || ''}
                              onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, brandName: e.target.value }))}
                              placeholder="Brand Name"
                              className={inputClass}
                            />
                            <input
                              value={bulkVariantForm.brandCode || ''}
                              onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, brandCode: e.target.value }))}
                              placeholder="Brand Code (e.g. BBP)"
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Base Product Name <span className="text-status-error-text">*</span></label>
                          <input
                            value={bulkVariantForm.baseProductName}
                            onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, baseProductName: e.target.value }))}
                            placeholder="e.g., Safari"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Category <span className="text-status-error-text">*</span></label>
                          <select
                            value={bulkVariantForm.category}
                            onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, category: e.target.value }))}
                            className={selectClass}
                          >
                            {categories.map((cat) => (<option key={cat} value={cat}>{cat.replace('_', ' ')}</option>))}
                          </select>
                        </div>
                      </div>

                      {/* Colors & Sizes */}
                      <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Colors <span className="text-status-error-text">*</span> <span className="text-tertiary font-normal">(comma-separated)</span></label>
                          <input
                            value={bulkVariantForm.colors.join(', ')}
                            onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                            placeholder="WHITE, IVORY, BLUE"
                            className={inputClass}
                          />
                          <p className="text-xs text-tertiary mt-1">Selected: {bulkVariantForm.colors.length} color{bulkVariantForm.colors.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Sizes <span className="text-status-error-text">*</span> <span className="text-tertiary font-normal">(comma-separated)</span></label>
                          <input
                            value={bulkVariantForm.sizes.join(', ')}
                            onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                            placeholder="1L, 4L, 20L"
                            className={inputClass}
                          />
                          <p className="text-xs text-tertiary mt-1">Selected: {bulkVariantForm.sizes.length} size{bulkVariantForm.sizes.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* UoM, SKU prefix, total */}
                      <div className="mt-6 grid gap-5 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Unit of Measure</label>
                          <input
                            value={bulkVariantForm.unitOfMeasure || ''}
                            onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, unitOfMeasure: e.target.value }))}
                            placeholder="L, kg, pcs"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">SKU Prefix <span className="text-tertiary font-normal">(optional)</span></label>
                          <input
                            value={bulkVariantForm.skuPrefix || ''}
                            onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, skuPrefix: e.target.value }))}
                            placeholder="Auto-filled from brand"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Total Variants</label>
                          <div className="h-10 rounded-lg border border-border bg-surface-highlight px-3 flex items-center text-sm font-medium text-primary">
                            {bulkVariantForm.colors.length * bulkVariantForm.sizes.length || 0} variants
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="mt-6 pt-6 border-t border-border grid gap-5 sm:grid-cols-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Base Price</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-tertiary text-sm">&#x20B9;</span>
                            <input
                              type="number"
                              value={bulkVariantForm.basePrice || ''}
                              onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, basePrice: parseNumber(e.target.value) || 0 }))}
                              className={'w-full rounded-lg border border-border bg-surface pl-7 pr-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">GST %</label>
                          <input
                            type="number"
                            value={bulkVariantForm.gstRate || ''}
                            onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, gstRate: parseNumber(e.target.value) || 0 }))}
                            className={inputClass}
                            placeholder="18"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Min Disc %</label>
                          <input
                            type="number"
                            value={bulkVariantForm.minDiscountPercent || ''}
                            onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, minDiscountPercent: parseNumber(e.target.value) || 0 }))}
                            className={inputClass}
                            placeholder="5"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Min Sell Price</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-tertiary text-sm">&#x20B9;</span>
                            <input
                              type="number"
                              value={bulkVariantForm.minSellingPrice || ''}
                              onChange={(e) => setBulkVariantForm((prev) => ({ ...prev, minSellingPrice: parseNumber(e.target.value) || 0 }))}
                              className={'w-full rounded-lg border border-border bg-surface pl-7 pr-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-border pt-6">
                        <button
                          type="button"
                          onClick={() => { setBulkVariantModalOpen(false); setBulkVariantResults(null); }}
                          className={btnSecondary}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!session) return;
                            if (!bulkVariantForm.baseProductName || !bulkVariantForm.category) {
                              setBulkVariantMessage('Base product name and category are required.');
                              return;
                            }
                            if (bulkVariantForm.colors.length === 0 || bulkVariantForm.sizes.length === 0) {
                              setBulkVariantMessage('At least one color and one size are required.');
                              return;
                            }
                            if (bulkVariantBrandMode === 'existing' && !bulkVariantForm.brandId) {
                              setBulkVariantMessage('Please select a brand.');
                              return;
                            }
                            if (bulkVariantBrandMode === 'new' && (!bulkVariantForm.brandName || !bulkVariantForm.brandCode)) {
                              setBulkVariantMessage('Brand name and code are required for new brands.');
                              return;
                            }

                            setSavingBulkVariants(true);
                            setBulkVariantMessage(null);
                            try {
                              const payload: BulkVariantRequest = {
                                baseProductName: bulkVariantForm.baseProductName.trim(),
                                category: bulkVariantForm.category,
                                colors: bulkVariantForm.colors,
                                sizes: bulkVariantForm.sizes,
                                unitOfMeasure: bulkVariantForm.unitOfMeasure || undefined,
                                skuPrefix: bulkVariantForm.skuPrefix || undefined,
                                basePrice: bulkVariantForm.basePrice,
                                gstRate: bulkVariantForm.gstRate,
                                minDiscountPercent: bulkVariantForm.minDiscountPercent,
                                minSellingPrice: bulkVariantForm.minSellingPrice,
                              };

                              if (bulkVariantBrandMode === 'existing') {
                                payload.brandId = bulkVariantForm.brandId;
                              } else {
                                payload.brandName = bulkVariantForm.brandName?.trim();
                                payload.brandCode = bulkVariantForm.brandCode?.trim();
                              }

                              const result = await createBulkVariants(payload, session);
                              const normalizedResult: BulkVariantResponse = {
                                created: result.created ?? 0,
                                skippedExisting: result.skippedExisting ?? 0,
                                variants: result.variants ?? [],
                              };
                              setBulkVariantResults(normalizedResult);
                              setBulkVariantMessage(`Success! Created ${normalizedResult.created ?? 0} new variants, ${normalizedResult.skippedExisting ?? 0} already existed.`);
                            } catch (err) {
                              setBulkVariantMessage(err instanceof Error ? err.message : 'Unable to create bulk variants.');
                            } finally {
                              setSavingBulkVariants(false);
                            }
                          }}
                          disabled={savingBulkVariants}
                          className={btnPrimary}
                        >
                          {savingBulkVariants ? 'Creating...' : `Create ${bulkVariantForm.colors.length * bulkVariantForm.sizes.length || 0} Variants`}
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

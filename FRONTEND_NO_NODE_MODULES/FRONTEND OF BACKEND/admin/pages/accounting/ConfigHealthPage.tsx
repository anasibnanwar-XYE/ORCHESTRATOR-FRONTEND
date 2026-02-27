import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listCatalogProducts, listAccounts, type CatalogProduct, type AccountSummary } from '../../lib/accountingApi';
import { listProductionBrands, type ProductionBrandDto } from '../../lib/factoryApi';
import { ArrowTopRightOnSquareIcon, ClipboardDocumentCheckIcon, PencilSquareIcon, CurrencyRupeeIcon, TagIcon } from '@heroicons/react/24/outline';
import ProductEditDialog from '../../components/catalog/ProductEditDialog';

interface ConfigIssue {
  id: number;
  skuCode?: string;
  productName: string;
  brandName?: string;
  revenueMissing: boolean;
  taxMissing: boolean;
  originalProduct: CatalogProduct;
}

const metadataAccountId = (metadata: any, key: string): number | null => {
  const value = metadata?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }
  return null;
};

export default function ConfigHealthPage() {
  const { session } = useAuth();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data for Edit Dialog
  const [brands, setBrands] = useState<ProductionBrandDto[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError(null);

    Promise.all([
      listCatalogProducts(session),
      listProductionBrands(session),
      listAccounts(session)
    ])
      .then(([productsData, brandsData, accountsData]) => {
        setProducts(productsData);
        setBrands(brandsData);
        setAccounts(accountsData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load configuration data.'))
      .finally(() => setLoading(false));
  }, [session]);

  const refreshProducts = () => {
    if (!session) return;
    setLoading(true);
    listCatalogProducts(session)
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to refresh catalog.'))
      .finally(() => setLoading(false));
  };

  const issues = useMemo<ConfigIssue[]>(() => {
    return products
      .filter((p) => p.category === 'FINISHED_GOOD')
      .map<ConfigIssue>((p) => {
        const revenueId = metadataAccountId(p.metadata as Record<string, unknown> | undefined, 'fgRevenueAccountId');
        const taxId = metadataAccountId(p.metadata as Record<string, unknown> | undefined, 'fgTaxAccountId');
        const revenueMissing = !(revenueId != null && revenueId > 0);
        const taxMissing = !(taxId != null && taxId > 0);
        return {
          id: p.id ?? 0,
          skuCode: p.skuCode,
          productName: p.productName ?? '',
          brandName: p.brandName,
          revenueMissing,
          taxMissing,
          originalProduct: p,
        };
      })
      .filter((row) => row.revenueMissing || row.taxMissing);
  }, [products]);

  const openEdit = (product: CatalogProduct, focusField?: 'revenue' | 'tax') => {
    setEditingProduct(product);
    setEditOpen(true);
    // Note: focusing specific field is a nice-to-have, but for now we just open the modal.
    // To implement auto-focus, we'd need to pass a ref or prop to ProductEditDialog.
    // We'll leave it simple for now as the modal is small enough.
    if (focusField) {
      // We can use a small timeout to let the modal render, then find the element.
      // This is a bit hacky but effective for "UX without heavy state".
      setTimeout(() => {
        const id = focusField === 'revenue' ? 'revenue-account-select' : 'tax-account-select';
        document.getElementById(id)?.focus();
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-400">Accounting</p>
          <h1 className="text-2xl font-semibold">Revenue & Tax Account Health</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Check finished-good SKUs for missing revenue and GST account mappings. These mappings are required for sales journals and shipment
            finalization to succeed without errors.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refreshProducts}
            className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/40">
          Scanning catalog for configuration issues...
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-4 py-6 text-sm text-emerald-800 dark:text-emerald-200">
          All finished-good SKUs in the catalog have revenue and tax account mappings configured via metadata. If you still see startup errors,
          check for finished goods created outside the catalog import workflow.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-widest text-slate-500 dark:border-white/10 dark:bg-slate-900/60">
            <span>Missing mappings</span>
            <span>{issues.length} SKU{issues.length === 1 ? '' : 's'}</span>
          </div>
          <div className="overflow-visible">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/5">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60">
                <tr>
                  <th className="px-4 py-2 text-left">SKU</th>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Brand</th>
                  <th className="px-4 py-2 text-left">Revenue account</th>
                  <th className="px-4 py-2 text-left">Tax account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {issues.map((issue) => (
                  <tr key={issue.id} className="group relative hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{issue.skuCode}</td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">{issue.productName}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{issue.brandName}</td>
                    <td className="px-4 py-2">
                      {issue.revenueMissing ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                          Missing
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {issue.taxMissing ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                          Missing
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                          OK
                        </span>
                      )}
                    </td>

                    {/* Hover Overlay */}
                    <td colSpan={5} className="absolute inset-0 hidden group-hover:flex items-center justify-end gap-3 bg-white/95 dark:bg-slate-900/95 px-4 backdrop-blur-sm transition-all z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest mr-2">Quick Actions:</span>

                        <button
                          onClick={() => openEdit(issue.originalProduct)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                        >
                          <ClipboardDocumentCheckIcon className="h-4 w-4" />
                          Fix Now
                        </button>

                        <button
                          onClick={() => openEdit(issue.originalProduct)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          Open SKU
                        </button>

                        <button
                          onClick={() => openEdit(issue.originalProduct, 'revenue')}
                          className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/40 transition-colors"
                        >
                          <CurrencyRupeeIcon className="h-4 w-4" />
                          Map Revenue
                        </button>

                        <button
                          onClick={() => openEdit(issue.originalProduct, 'tax')}
                          className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <TagIcon className="h-4 w-4" />
                          Map Tax Account
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <ProductEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={refreshProducts}
        product={editingProduct}
        brands={brands}
        accounts={accounts}
      />
    </div>
  );
}

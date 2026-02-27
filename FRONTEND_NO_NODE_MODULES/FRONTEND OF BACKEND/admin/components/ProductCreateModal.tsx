import React, { useEffect, useMemo, useState } from 'react';
import { Switch } from '@headlessui/react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { apiData, apiRequest } from '../lib/api';
import { ResponsiveModal } from '../design-system';

type Category = 'GENERAL' | 'FINISHED_GOOD' | 'RAW_MATERIAL' | 'SERVICE' | 'OTHER';

interface Brand {
  id: number;
  name: string;
  code?: string;
}

interface BrandProduct {
  id: number;
  name: string;
  sku?: string;
}

interface CreateProductRequest {
  brandId?: number;
  brandName?: string;
  brandCode?: string;
  name: string;
  category: Category | string;
  colour?: string;
  size?: string;
  uom?: string;
  basePrice?: string;
  gstRate?: string;
}

export function ProductCreateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (payload: unknown) => void }) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandProducts, setBrandProducts] = useState<BrandProduct[]>([]);
  const [useNewBrand, setUseNewBrand] = useState(false);

  const [form, setForm] = useState<CreateProductRequest>({
    name: '',
    category: 'GENERAL',
  });

  const reset = () => {
    setError(null);
    setSaving(false);
    setBrandProducts([]);
    setUseNewBrand(false);
    setForm({ name: '', category: 'GENERAL' });
  };

  const loadBrands = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiData<Brand[]>(`/api/v1/production/brands`, {}, session);
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadBrands();
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session?.companyCode]);

  useEffect(() => {
    const bid = form.brandId;
    if (!open || !session || !bid || useNewBrand) {
      setBrandProducts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiData<BrandProduct[]>(`/api/v1/production/brands/${bid}/products`, {}, session);
        if (!cancelled) setBrandProducts(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setBrandProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, form.brandId, useNewBrand, session]);

  const selectedBrand = useMemo(() => brands.find((b) => b.id === form.brandId) || null, [brands, form.brandId]);

  const hasDuplicate = useMemo(() => {
    const name = form.name.trim().toLowerCase();
    if (!name || brandProducts.length === 0) return null;
    return brandProducts.find((p) => p.name?.trim()?.toLowerCase() === name) || null;
  }, [form.name, brandProducts]);

  const brandCodeForPreview = useMemo(() => {
    if (useNewBrand) return (form.brandCode || '').toUpperCase();
    return (selectedBrand?.code || selectedBrand?.name || '').toUpperCase().replace(/\s+/g, '-');
  }, [useNewBrand, form.brandCode, selectedBrand]);

  const categoryForPreview = (form.category || '').toString().toUpperCase().replace(/\s+/g, '_');
  const colorForPreview = (form.colour || '').toString().toUpperCase().replace(/\s+/g, '-');
  const sizeForPreview = (form.size || '').toString().toUpperCase().replace(/\s+/g, '-');

  const skuPreview = useMemo(() => {
    const parts = [brandCodeForPreview, categoryForPreview, colorForPreview, sizeForPreview]
      .filter(Boolean)
      .join('-')
      .replace(/-+/g, '-')
      .replace(/-$/, '');
    return parts ? `${parts}-###` : '';
  }, [brandCodeForPreview, categoryForPreview, colorForPreview, sizeForPreview]);

  const setField = <K extends keyof CreateProductRequest>(key: K, value: CreateProductRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.category) return false;
    if (useNewBrand) return Boolean(form.brandName?.trim() && form.brandCode?.trim());
    return Boolean(form.brandId);
  }, [form, useNewBrand]);

  const submit = async () => {
    if (!session || !canSubmit || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        productName: form.name.trim(),
        category: form.category,
      };
      if (useNewBrand) {
        payload.brandName = form.brandName?.trim();
        payload.brandCode = form.brandCode?.trim();
      } else {
        payload.brandId = form.brandId;
      }
      if (form.colour?.trim()) payload.defaultColour = form.colour.trim();
      if (form.size?.trim()) payload.sizeLabel = form.size.trim();
      if (form.uom?.trim()) payload.unitOfMeasure = form.uom.trim();
      if (form.basePrice?.trim()) {
        const parsed = Number(form.basePrice);
        if (Number.isFinite(parsed) && parsed > 0) payload.basePrice = parsed;
      }
      if (form.gstRate?.trim()) {
        const parsed = Number(form.gstRate);
        if (Number.isFinite(parsed) && parsed >= 0) payload.gstRate = parsed;
      }

      const result = await apiData(`/api/v1/accounting/catalog/products`, { method: 'POST', body: JSON.stringify(payload) }, session);
      try { await apiRequest(`/api/v1/production/brands`, {}, session); } catch { /* warm cache */ }
      onCreated?.(result);
      onClose();
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary';
  const selectClass = inputClass;

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-secondary hover:bg-surface-highlight"
        disabled={saving}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit || Boolean(hasDuplicate) || saving}
        className={clsx(
          'rounded-md px-4 py-2 text-sm font-semibold shadow transition-colors',
          (!canSubmit || Boolean(hasDuplicate) || saving)
            ? 'bg-surface-highlight text-tertiary cursor-not-allowed'
            : 'bg-action-bg text-action-text hover:opacity-90'
        )}
      >
        {saving ? 'Saving...' : 'Save product'}
      </button>
    </>
  );

  return (
    <ResponsiveModal
      isOpen={open}
      onClose={() => { if (!saving) onClose(); }}
      title="Add Product"
      footer={footerButtons}
      size="lg"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left column: Form */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-primary">Brand</p>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span>New brand</span>
              <Switch
                checked={useNewBrand}
                onChange={setUseNewBrand}
                className={clsx('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', useNewBrand ? 'bg-action-bg' : 'bg-surface-highlight')}
              >
                <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-surface shadow transition', useNewBrand ? 'translate-x-4' : 'translate-x-1')} />
              </Switch>
            </div>
          </div>

          {!useNewBrand ? (
            <div className="space-y-2">
              <select
                value={form.brandId || ''}
                onChange={(e) => setField('brandId', e.target.value ? Number(e.target.value) : undefined)}
                className={selectClass}
                disabled={loading}
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.code ? `${b.code} — ${b.name}` : b.name}</option>
                ))}
              </select>
              {loading && <p className="text-xs text-secondary">Loading brands...</p>}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                placeholder="Brand name"
                value={form.brandName || ''}
                onChange={(e) => setField('brandName', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Brand code (e.g., BBP)"
                value={form.brandCode || ''}
                onChange={(e) => setField('brandCode', e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div className="mt-4 grid gap-2">
            <input
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={String(form.category)}
                onChange={(e) => setField('category', e.target.value)}
                className={selectClass}
              >
                <option value="GENERAL">General</option>
                <option value="FINISHED_GOOD">Finished Good</option>
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="SERVICE">Service</option>
                <option value="OTHER">Other</option>
              </select>
              <input
                placeholder="UOM (e.g., kg, L, pcs)"
                value={form.uom || ''}
                onChange={(e) => setField('uom', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Colour (optional)"
                value={form.colour || ''}
                onChange={(e) => setField('colour', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Size (optional)"
                value={form.size || ''}
                onChange={(e) => setField('size', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Base price"
                value={form.basePrice || ''}
                onChange={(e) => setField('basePrice', e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="GST rate %"
                value={form.gstRate || ''}
                onChange={(e) => setField('gstRate', e.target.value)}
                className={inputClass}
              />
            </div>

            {hasDuplicate && (
              <div className="rounded-lg border border-status-warning-text/20 bg-status-warning-bg p-2 text-xs text-status-warning-text">
                A product with this name already exists under the selected brand.
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-status-error-text/20 bg-status-error-bg p-2 text-xs text-status-error-text">{error}</div>
            )}
          </div>
        </div>

        {/* Right column: Preview */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-primary">Preview</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-secondary">Brand</span>
              <span className="font-medium text-primary">{useNewBrand ? (form.brandCode || form.brandName || '—') : (selectedBrand?.code || selectedBrand?.name || '—')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Name</span>
              <span className="font-medium text-primary">{form.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Category</span>
              <span className="font-medium text-primary">{String(form.category) || '—'}</span>
            </div>
            {(form.basePrice || form.gstRate) && (
              <div className="flex items-center justify-between">
                <span className="text-secondary">Pricing</span>
                <span className="font-medium text-primary tabular-nums">
                  {form.basePrice ? `₹${form.basePrice}` : '—'}{form.gstRate ? ` @ ${form.gstRate}% GST` : ''}
                </span>
              </div>
            )}
            {(form.colour || form.size || form.uom) && (
              <div className="flex items-center justify-between">
                <span className="text-secondary">Attributes</span>
                <span className="font-medium text-primary">{[form.colour, form.size, form.uom].filter(Boolean).join(' / ')}</span>
              </div>
            )}
            <div className="mt-3 rounded-md border border-dashed border-border p-3 text-center text-xs text-secondary">
              SKU preview (final SKU from server):
              <div className="mt-1 font-mono text-sm font-semibold text-primary">{skuPreview || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}

export default ProductCreateModal;

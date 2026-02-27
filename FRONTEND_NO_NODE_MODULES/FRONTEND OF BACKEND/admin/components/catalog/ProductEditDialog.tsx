import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../context/AuthContext';
import {
    createCatalogProduct,
    updateCatalogProduct,
    type AccountSummary,
    type CatalogProduct,
    type CatalogProductCreatePayload,
    type CatalogProductUpdatePayload,
} from '../../lib/accountingApi';
import {
    type ProductionBrandDto,
    createFinishedGood,
    type FinishedGoodRequest,
} from '../../lib/factoryApi';

export interface ProductEditDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product: CatalogProduct | null; // If null, we are creating a new product
    // Pre-loaded data to avoid re-fetching inside component
    brands: ProductionBrandDto[];
    accounts: AccountSummary[];
    // Optional pre-filled category if creating new
    initialCategory?: string;
}

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

const numberString = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
const metadataNumberString = (metadata: any, key: string) => {
    const value = metadata?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return '';
        const num = Number(trimmed);
        return Number.isFinite(num) ? String(num) : '';
    }
    return '';
};
const upsertMetadataAccountId = (metadata: Record<string, any>, key: string, value: string) => {
    if (!value) {
        delete metadata[key];
        return;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return;
    }
    metadata[key] = num;
};
const parseNumber = (value: string) => {
    if (!value) return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
};

export default function ProductEditDialog({ open, onClose, onSuccess, product, brands, accounts, initialCategory }: ProductEditDialogProps) {
    const { session } = useAuth();
    const [form, setForm] = useState(emptyProductForm);
    const [brandMode, setBrandMode] = useState<'existing' | 'new'>('existing');
    const [productType, setProductType] = useState<'catalog' | 'finished-good'>('catalog');
    const [message, setMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Initialize form when product changes or dialog opens
    useEffect(() => {
        if (open) {
            if (product) {
                setBrandMode('existing');
                setForm({
                    brandId: product.brandId ? String(product.brandId) : '',
                    brandName: product.brandName ?? '',
                    brandCode: product.brandCode ?? '',
                    productName: product.productName ?? '',
                    category: product.category ?? '',
                    defaultColour: product.defaultColour ?? '',
                    unitOfMeasure: product.unitOfMeasure ?? '',
                    basePrice: numberString(product.basePrice),
                    gstRate: numberString(product.gstRate),
                    minDiscountPercent: numberString(product.minDiscountPercent),
                    minSellingPrice: numberString(product.minSellingPrice),
                    revenueAccountId: metadataNumberString(product.metadata as Record<string, unknown> | undefined, 'fgRevenueAccountId'),
                    cogsAccountId: metadataNumberString(product.metadata as Record<string, unknown> | undefined, 'fgCogsAccountId'),
                    fgInventoryAccountId: metadataNumberString(product.metadata as Record<string, unknown> | undefined, 'fgValuationAccountId'),
                    taxAccountId: metadataNumberString(product.metadata as Record<string, unknown> | undefined, 'fgTaxAccountId'),
                });
            } else {
                setForm({ ...emptyProductForm, category: initialCategory || 'GENERAL' });
                setBrandMode('existing');
            }
            setMessage(null);
        }
    }, [open, product, initialCategory]);

    const handleSave = async () => {
        if (!session) return;
        if (!form.productName || !form.category) {
            setMessage('Product name and category are required.');
            return;
        }
        if (!form.unitOfMeasure) {
            setMessage('Unit of measure is required.');
            return;
        }

        setSaving(true);
        setMessage(null);
        try {
            const baseMetadata = (product?.metadata ?? {}) as Record<string, any>;
            const metadata: Record<string, any> = { ...baseMetadata };
            upsertMetadataAccountId(metadata, 'fgRevenueAccountId', form.revenueAccountId);
            upsertMetadataAccountId(metadata, 'fgCogsAccountId', form.cogsAccountId);
            upsertMetadataAccountId(metadata, 'fgValuationAccountId', form.fgInventoryAccountId);
            upsertMetadataAccountId(metadata, 'fgTaxAccountId', form.taxAccountId);

            if (product) {
                // Edit Mode
                const updatePayload: CatalogProductUpdatePayload = {
                    productName: form.productName.trim(),
                    category: form.category,
                    defaultColour: form.defaultColour || undefined,
                    unitOfMeasure: form.unitOfMeasure || undefined,
                    basePrice: parseNumber(form.basePrice) || 0,
                    gstRate: parseNumber(form.gstRate) || 0,
                    minDiscountPercent: parseNumber(form.minDiscountPercent) || 0,
                    minSellingPrice: parseNumber(form.minSellingPrice) || 0,
                    metadata,
                    id: product.id ?? 0,
                };
                await updateCatalogProduct(product.id ?? 0, updatePayload, session);
            } else {
                const payload: CatalogProductCreatePayload = {
                    productName: form.productName.trim(),
                    category: form.category,
                    defaultColour: form.defaultColour || undefined,
                    unitOfMeasure: form.unitOfMeasure || undefined,
                    basePrice: parseNumber(form.basePrice) || 0,
                    gstRate: parseNumber(form.gstRate) || 0,
                    minDiscountPercent: parseNumber(form.minDiscountPercent) || 0,
                    minSellingPrice: parseNumber(form.minSellingPrice) || 0,
                    metadata,
                };

                if (brandMode === 'existing') {
                    if (!form.brandId) {
                        setMessage('Select a brand or create a new one.');
                        setSaving(false);
                        return;
                    }
                    payload.brandId = Number(form.brandId);
                } else {
                    if (!form.brandName || !form.brandCode) {
                        setMessage('Brand name and code are required for new brands.');
                        setSaving(false);
                        return;
                    }
                    payload.brandName = form.brandName.trim();
                    payload.brandCode = form.brandCode.trim();
                }

                await createCatalogProduct(payload, session);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'Unable to save product.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto p-6">
                    <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-3">
                            <Dialog.Panel className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-xl ring-1 ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-zinc-800">
                                <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">{product ? 'Edit Product' : 'New Product'}</Dialog.Title>
                                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    {product
                                        ? 'Configure product details, pricing rules, and tax settings.'
                                        : 'Create a new product definition.'}
                                </p>
                                {message && <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-200">{message}</p>}

                                {!product && (
                                    <div className="mt-6 p-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input type="radio" name="brand-mode" value="existing" checked={brandMode === 'existing'} onChange={() => setBrandMode('existing')} className="peer h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-500/20 dark:border-zinc-700 dark:text-zinc-100" />
                                                </div>
                                                <span className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700 transition-colors dark:text-white dark:group-hover:text-zinc-200">Existing Brand</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input type="radio" name="brand-mode" value="new" checked={brandMode === 'new'} onChange={() => setBrandMode('new')} className="peer h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-500/20 dark:border-zinc-700 dark:text-zinc-100" />
                                                </div>
                                                <span className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700 transition-colors dark:text-white dark:group-hover:text-zinc-200">New Brand</span>
                                            </label>
                                        </div>

                                        {brandMode === 'existing' ? (
                                            <div className="mt-4">
                                                <select
                                                    value={form.brandId}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, brandId: e.target.value }))}
                                                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100"
                                                >
                                                    <option value="" className="dark:bg-zinc-900 dark:text-white">Select a brand...</option>
                                                    {brands.map((brand) => (
                                                        <option key={brand.id} value={brand.id} className="dark:bg-zinc-900 dark:text-white">{brand.name} ({brand.productCount} products)</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                <input
                                                    value={form.brandName}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, brandName: e.target.value }))}
                                                    placeholder="Brand Name"
                                                    className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                                                />
                                                <input
                                                    value={form.brandCode}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, brandCode: e.target.value }))}
                                                    placeholder="Brand Code (e.g. AP)"
                                                    className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Product Name <span className="text-rose-500">*</span></label>
                                        <input value={form.productName} onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))} className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Category <span className="text-rose-500">*</span></label>
                                        <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100">
                                            {categories.map((cat) => (<option key={cat} value={cat} className="dark:bg-zinc-900 dark:text-white">{cat.replace('_', ' ')}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Colour / Shade</label>
                                        <input value={form.defaultColour} onChange={(e) => setForm((prev) => ({ ...prev, defaultColour: e.target.value }))} placeholder="e.g., Red, Blue" className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Unit of Measure <span className="text-rose-500">*</span></label>
                                        <input value={form.unitOfMeasure} onChange={(e) => setForm((prev) => ({ ...prev, unitOfMeasure: e.target.value }))} placeholder="e.g., L, kg, UNIT" className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100" />
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 grid gap-5 sm:grid-cols-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Base Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500 text-sm">₹</span>
                                            <input value={form.basePrice} onChange={(e) => setForm((prev) => ({ ...prev, basePrice: e.target.value }))} type="number" className="w-full h-10 rounded-lg border border-zinc-200 bg-white pl-7 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100" placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">GST %</label>
                                        <input value={form.gstRate} onChange={(e) => setForm((prev) => ({ ...prev, gstRate: e.target.value }))} type="number" className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100" placeholder="18" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Min Disc %</label>
                                        <input value={form.minDiscountPercent} onChange={(e) => setForm((prev) => ({ ...prev, minDiscountPercent: e.target.value }))} type="number" className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100" placeholder="5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Min Sell Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500 text-sm">₹</span>
                                            <input value={form.minSellingPrice} onChange={(e) => setForm((prev) => ({ ...prev, minSellingPrice: e.target.value }))} type="number" className="w-full h-10 rounded-lg border border-zinc-200 bg-white pl-7 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100" placeholder="0.00" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Revenue Account (Sales) <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.revenueAccountId}
                                            onChange={(e) => setForm((prev) => ({ ...prev, revenueAccountId: e.target.value }))}
                                            className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100"
                                            id="revenue-account-select"
                                        >
                                            <option value="" className="dark:bg-zinc-900 dark:text-white">Select revenue account...</option>
                                            {accounts.filter(a => a.type === 'Revenue').map((a) => (
                                                <option key={a.id} value={a.id} className="dark:bg-zinc-900 dark:text-white">{a.code} - {a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            COGS Account <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.cogsAccountId}
                                            onChange={(e) => setForm((prev) => ({ ...prev, cogsAccountId: e.target.value }))}
                                            className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100"
                                        >
                                            <option value="" className="dark:bg-zinc-900 dark:text-white">Select COGS account...</option>
                                            {accounts.filter(a => a.type === 'COGS').map((a) => (
                                                <option key={a.id} value={a.id} className="dark:bg-zinc-900 dark:text-white">{a.code} - {a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            FG Inventory Account <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.fgInventoryAccountId}
                                            onChange={(e) => setForm((prev) => ({ ...prev, fgInventoryAccountId: e.target.value }))}
                                            className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100"
                                        >
                                            <option value="" className="dark:bg-zinc-900 dark:text-white">Select FG inventory account...</option>
                                            {accounts.filter(a => a.type === 'Asset').map((a) => (
                                                <option key={a.id} value={a.id} className="dark:bg-zinc-900 dark:text-white">{a.code} - {a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Tax Account (GST) <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.taxAccountId}
                                            onChange={(e) => setForm((prev) => ({ ...prev, taxAccountId: e.target.value }))}
                                            className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-100"
                                            id="tax-account-select"
                                        >
                                            <option value="" className="dark:bg-zinc-900 dark:text-white">Select tax account...</option>
                                            {accounts.filter(a => a.type === 'Liability' || a.name.toLowerCase().includes('tax') || a.name.toLowerCase().includes('gst')).map((a) => (
                                                <option key={a.id} value={a.id} className="dark:bg-zinc-900 dark:text-white">{a.code} - {a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                                    <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800">Cancel</button>
                                    <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-zinc-500/20 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                                        {saving ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

import { useState, useEffect } from 'react';
import { PlusIcon, ShoppingCartIcon, CheckCircleIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { listRawMaterialPurchases, createFullPurchase, type RawMaterialPurchaseDto, type RawMaterialPurchaseLine } from '../../lib/purchasingApi';
import { listSuppliers, type SupplierResponse } from '../../lib/accountingApi';
import { listRawMaterials, type RawMaterialDto } from '../../lib/factoryApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormSelect, FormTextarea } from '../../design-system/ResponsiveForm';
import SearchableCombobox, { type ComboboxOption } from '../../components/SearchableCombobox';

export default function PurchaseOrdersPage() {
    const { session } = useAuth();
    const [orders, setOrders] = useState<RawMaterialPurchaseDto[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
    const [rawMaterials, setRawMaterials] = useState<RawMaterialDto[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        supplierId: 0,
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        memo: '',
        taxAmount: 0,
    });
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [lineItems, setLineItems] = useState<RawMaterialPurchaseLine[]>([
        { rawMaterialId: 0, batchCode: '', quantity: 0, costPerUnit: 0, unit: '', notes: '' }
    ]);

    useEffect(() => {
        loadData();
    }, [session]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ordersData, suppliersData, rawMaterialsData] = await Promise.all([
                listRawMaterialPurchases(session),
                listSuppliers(session),
                listRawMaterials(session).catch(() => []) // Fallback if fails
            ]);
            setOrders(ordersData);
            setSuppliers(suppliersData);
            setRawMaterials(rawMaterialsData);
        } catch (err) {
            console.error('Failed to load data', err);
            setError('Failed to load purchase orders');
        } finally {
            setLoading(false);
        }
    };

    const loadSuppliers = async (query: string): Promise<ComboboxOption[]> => {
        const normalizedQuery = query.toLowerCase();
        const results = suppliers.filter((s) => {
            const name = (s.name ?? '').toLowerCase();
            const code = (s.code ?? '').toLowerCase();
            return name.includes(normalizedQuery) || code.includes(normalizedQuery);
        });
        return results.map((supplier: SupplierResponse) => ({
            id: supplier.id,
            label: supplier.name,
            subLabel: supplier.code,
            original: supplier
        }));
    };

    // Note: Raw material purchases are auto-approved and auto-posted (GRN created automatically)
    // No approval step needed

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.supplierId || !formData.invoiceDate ||
            lineItems.length === 0 || lineItems.some(l => !l.rawMaterialId || l.quantity <= 0 || l.costPerUnit <= 0)) {
            setError('Please fill in all required fields (Supplier, Invoice Date, and all line items)');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const invoiceNumber = formData.invoiceNumber?.trim() || `INV-${Date.now()}`;
            const taxAmount = typeof formData.taxAmount === 'number' ? formData.taxAmount : Number(formData.taxAmount);
            await createFullPurchase({
                supplierId: formData.supplierId,
                orderDate: formData.invoiceDate,
                invoiceNumber,
                memo: formData.memo || undefined,
                taxAmount: Number.isFinite(taxAmount) && taxAmount > 0 ? taxAmount : undefined,
                lines: lineItems.map(l => ({
                    rawMaterialId: l.rawMaterialId,
                    batchCode: l.batchCode?.trim() ? l.batchCode.trim() : undefined,
                    quantity: l.quantity,
                    unit: l.unit || undefined,
                    costPerUnit: l.costPerUnit,
                    notes: l.notes || undefined,
                }))
            }, session);
            setShowModal(false);
            setFormData({
                supplierId: 0,
                invoiceNumber: '',
                invoiceDate: new Date().toISOString().split('T')[0],
                memo: '',
                taxAmount: 0,
            });
            setLineItems([{ rawMaterialId: 0, batchCode: '', quantity: 0, costPerUnit: 0, unit: '', notes: '' }]);
            setSelectedSupplier(null);
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create purchase order');
        } finally {
            setSubmitting(false);
        }
    };

	    const loadRawMaterials = async (query: string): Promise<ComboboxOption[]> => {
	        if (!session) return [];
	        try {
	            const normalizedQuery = query.toLowerCase();
	            const results = rawMaterials.filter((rm) => {
	                const name = (rm.name ?? '').toLowerCase();
	                const sku = (rm.sku ?? '').toLowerCase();
	                return name.includes(normalizedQuery) || sku.includes(normalizedQuery);
	            });
	            return results
	                .filter((rm): rm is RawMaterialDto & { id: number } => typeof rm.id === 'number')
	                .map((rm) => ({
	                    id: rm.id,
	                    label: rm.name ?? `Raw Material #${rm.id}`,
	                    subLabel: rm.sku ?? `ID: ${rm.id}`,
	                    original: rm,
	                }));
	        } catch (err) {
	            console.error('Failed to search raw materials', err);
	            return [];
	        }
	    };

    const addLineItem = () => {
        setLineItems([...lineItems, { rawMaterialId: 0, batchCode: '', quantity: 0, costPerUnit: 0, unit: '', notes: '' }]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: keyof RawMaterialPurchaseLine, value: string | number) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };
        setLineItems(updated);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Purchase Orders</h1>
                    <p className="text-sm text-secondary">Manage procurement and supplier orders</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                    <PlusIcon className="h-5 w-5" />
                    New Order
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-highlight text-xs uppercase text-secondary">
                            <tr>
                                <th className="px-6 py-3 font-medium">Invoice Number</th>
                                <th className="px-6 py-3 font-medium">Supplier</th>
                                <th className="px-6 py-3 font-medium">Invoice Date</th>
                                <th className="px-6 py-3 font-medium">Total</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">GRN Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-secondary">Loading orders...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-secondary">No purchase orders found</td>
                                </tr>
                            ) : (
                                orders.map((po) => (
                                    <tr key={po.id} className="hover:bg-surface-highlight/50">
                                        <td className="px-6 py-4 font-medium text-primary">{po.invoiceNumber}</td>
                                        <td className="px-6 py-4 text-secondary">{po.supplierName}</td>
                                        <td className="px-6 py-4 text-secondary">{po.invoiceDate}</td>
                                        <td className="px-6 py-4 font-medium text-primary">₹ {(po.totalAmount || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                Posted
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-secondary">GRN Auto-Created</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ResponsiveModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setError(null);
                    setFormData({
                        supplierId: 0,
                        invoiceNumber: '',
                        invoiceDate: new Date().toISOString().split('T')[0],
                        memo: '',
                        taxAmount: 0,
                    });
                    setSelectedSupplier(null);
                    setLineItems([{ rawMaterialId: 0, batchCode: '', quantity: 0, costPerUnit: 0, unit: '', notes: '' }]);
                }}
                title="Create Purchase Order"
                size="xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || !selectedSupplier || lineItems.length === 0}
                            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Creating...' : 'Create Order'}
                        </button>
                    </>
                }
            >
                <ResponsiveForm onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <SearchableCombobox
                                label="Supplier *"
                                value={selectedSupplier ? {
                                    id: selectedSupplier.id,
                                    label: selectedSupplier.name,
                                    subLabel: selectedSupplier.code,
                                    original: selectedSupplier
                                } : null}
                                onChange={(option) => {
                                    if (option && option.original) {
                                        const supplier = option.original as SupplierResponse;
                                        setSelectedSupplier(supplier);
                                        setFormData({ ...formData, supplierId: supplier.id });
                                    } else {
                                        setSelectedSupplier(null);
                                        setFormData({ ...formData, supplierId: 0 });
                                    }
                                }}
                                loadOptions={loadSuppliers}
                                placeholder="Search supplier by name or code..."
                                nullable={false}
                            />
                            {!selectedSupplier && (
                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">Supplier is required</p>
                            )}
                        </div>

                        <FormInput
                            label="Supplier Invoice # (optional)"
                            type="text"
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="Leave blank to auto-generate"
                        />

                        <FormInput
                            label="Invoice Date *"
                            type="date"
                            required
                            value={formData.invoiceDate}
                            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                        />

                        <FormInput
                            label="GST / Input Tax"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.taxAmount || ''}
                            onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })}
                            placeholder="0.00"
                        />
                    </div>

                    <FormTextarea
                        label="Memo"
                        value={formData.memo || ''}
                        onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                        placeholder="Optional notes..."
                        rows={3}
                    />

                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-primary">Line Items *</label>
                            <button
                                type="button"
                                onClick={addLineItem}
                                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                            >
                                + Add Item
                            </button>
                        </div>

                        <div className="space-y-3 overflow-x-auto">
	                            {lineItems.map((line, idx) => {
	                                const selectedRawMaterial = rawMaterials.find(rm => rm.id === line.rawMaterialId);
	                                return (
                                    <div key={idx} className="grid gap-3 rounded-lg border border-border bg-surface-highlight p-4 sm:grid-cols-7">
                                        <div className="sm:col-span-2">
	                                            <SearchableCombobox
	                                                label="Raw Material *"
	                                                value={selectedRawMaterial && typeof selectedRawMaterial.id === 'number' ? {
	                                                    id: selectedRawMaterial.id,
	                                                    label: selectedRawMaterial.name ?? `Raw Material #${selectedRawMaterial.id}`,
	                                                    subLabel: selectedRawMaterial.sku ?? `ID: ${selectedRawMaterial.id}`,
	                                                    original: selectedRawMaterial
	                                                } : null}
	                                                onChange={(option) => {
	                                                    if (option && option.original) {
	                                                        const rm = option.original as RawMaterialDto;
	                                                        updateLineItem(idx, 'rawMaterialId', rm.id ?? 0);
	                                                    } else {
	                                                        updateLineItem(idx, 'rawMaterialId', 0);
	                                                    }
	                                                }}
                                                loadOptions={loadRawMaterials}
                                                placeholder="Search raw material..."
                                                nullable={false}
                                            />
                                        </div>
                                        <div>
                                            <FormInput
                                                label="Batch Code (auto if blank)"
                                                type="text"
                                                value={line.batchCode}
                                                onChange={(e) => updateLineItem(idx, 'batchCode', e.target.value)}
                                                placeholder="Leave blank to auto-generate"
                                            />
                                        </div>
                                        <div>
                                            <FormInput
                                                label="Quantity *"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.quantity || ''}
                                                onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <FormInput
                                                label="Unit"
                                                type="text"
                                                value={line.unit || ''}
                                                onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                                                placeholder="KG, L, etc."
                                            />
                                        </div>
                                        <div>
                                            <FormInput
                                                label="Cost/Unit *"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.costPerUnit || ''}
                                                onChange={(e) => updateLineItem(idx, 'costPerUnit', Number(e.target.value))}
                                                required
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <FormInput
                                                label="Notes"
                                                type="text"
                                                value={line.notes || ''}
                                                onChange={(e) => updateLineItem(idx, 'notes', e.target.value)}
                                                placeholder="Optional notes..."
                                            />
                                        </div>
                                        {lineItems.length > 1 && (
                                            <div className="flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLineItem(idx)}
                                                    className="rounded-lg p-2 text-status-error-text hover:bg-status-error-bg touch-manipulation min-h-[36px] min-w-[36px]"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ResponsiveForm>
            </ResponsiveModal>
        </div>
    );
}

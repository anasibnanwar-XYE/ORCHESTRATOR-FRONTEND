import { useState, useEffect, useMemo } from 'react';
import { PlusIcon, MagnifyingGlassIcon, ArrowPathIcon, ReceiptRefundIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { apiData } from '../../lib/api';
import { searchDealers, type DealerLookup } from '../../lib/accountingApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormSelect, FormTextarea } from '../../design-system/ResponsiveForm';
import SearchableCombobox, { type ComboboxOption } from '../../components/SearchableCombobox';
import clsx from 'clsx';

interface SalesReturnDto {
  id: number;
  dealerId: number;
  dealerName?: string;
  returnDate: string;
  referenceNumber?: string;
  reason?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

interface SalesReturnRequest {
  dealerId: number;
  returnDate: string;
  referenceNumber?: string;
  reason?: string;
  lines: SalesReturnLineRequest[];
}

interface SalesReturnLineRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  reason?: string;
}

interface ReturnLine {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  reason: string;
}

export default function ReturnsPage() {
    const { session } = useAuth();
    const [returns, setReturns] = useState<SalesReturnDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState<{
        dealerId: number;
        returnDate: string;
        referenceNumber: string;
        reason: string;
    }>({
        dealerId: 0,
        returnDate: new Date().toISOString().split('T')[0],
        referenceNumber: '',
        reason: '',
    });
    
    const [lines, setLines] = useState<ReturnLine[]>([]);
    const [selectedDealer, setSelectedDealer] = useState<DealerLookup | null>(null);

    useEffect(() => {
        loadReturns();
    }, [session]);

    const loadReturns = async () => {
        try {
            setLoading(true);
            // Note: Backend might not have a GET endpoint for returns list
            // This is a placeholder - adjust based on actual API
            const data = await apiData<SalesReturnDto[]>(
                '/api/v1/accounting/sales/returns',
                { headers: session?.companyCode ? { 'X-Company-Id': session.companyCode } : undefined },
                session ?? undefined
            ).catch(() => []); // Return empty array if endpoint doesn't exist
            setReturns(data);
        } catch (err) {
            console.error('Failed to load returns', err);
            // Don't show error if endpoint doesn't exist
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.dealerId || lines.length === 0) {
            setError('Please select a dealer and add at least one return line');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const payload: SalesReturnRequest = {
                dealerId: formData.dealerId,
                returnDate: formData.returnDate,
                referenceNumber: formData.referenceNumber || undefined,
                reason: formData.reason || undefined,
                lines: lines.map(line => ({
                    productId: line.productId,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                    reason: line.reason || undefined,
                })),
            };
            await apiData<SalesReturnDto>(
                '/api/v1/accounting/sales/returns',
                {
                    method: 'POST',
                    headers: session?.companyCode ? { 'X-Company-Id': session.companyCode } : undefined,
                    body: JSON.stringify(payload),
                },
                session ?? undefined
            );
            setShowModal(false);
            setFormData({
                dealerId: 0,
                returnDate: new Date().toISOString().split('T')[0],
                referenceNumber: '',
                reason: '',
            });
            setLines([]);
            setSelectedDealer(null);
            setSuccess('Sales return created successfully');
            loadReturns();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create sales return');
        } finally {
            setSubmitting(false);
        }
    };

    const loadDealers = async (query: string): Promise<ComboboxOption[]> => {
        try {
            const results = await searchDealers(query, session, session?.companyCode);
            return results.map((dealer) => ({
                id: dealer.id,
                label: dealer.name,
                subLabel: dealer.code || '',
                original: dealer,
            }));
        } catch {
            return [];
        }
    };

    const addLine = () => {
        setLines([...lines, { productId: 0, productName: '', quantity: 0, unitPrice: 0, reason: '' }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof ReturnLine, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const filteredReturns = useMemo(() => {
        return returns.filter(ret =>
            !searchTerm ||
            ret.dealerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.reason?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [returns, searchTerm]);

    const getStatusBadge = (status?: string) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
                return 'bg-status-success-bg text-status-success-text';
            case 'PENDING':
                return 'bg-status-warning-bg text-status-warning-text';
            case 'REJECTED':
                return 'bg-status-error-bg text-status-error-text';
            default:
                return 'bg-surface-highlight text-secondary';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Sales Returns</h1>
                    <p className="mt-1 text-sm text-secondary">Process customer returns and refunds</p>
                </div>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setError(null);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                    <PlusIcon className="h-5 w-5" />
                    New Return
                </button>
            </div>

            {success && (
                <div className="rounded-lg border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
                    {success}
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
                    {error}
                </div>
            )}

            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
                <input
                    type="text"
                    placeholder="Search by dealer name, reference number, or reason..."
                    className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-primary placeholder-secondary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-secondary">Loading sales returns...</div>
                ) : filteredReturns.length === 0 ? (
                    <div className="p-8 text-center text-secondary">No sales returns found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-highlight text-xs uppercase text-secondary">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Reference</th>
                                    <th className="px-6 py-3 font-medium">Dealer</th>
                                    <th className="px-6 py-3 font-medium">Return Date</th>
                                    <th className="px-6 py-3 font-medium">Amount</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredReturns.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-surface-highlight/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-primary">{ret.referenceNumber || `RET-${ret.id}`}</span>
                                        </td>
                                        <td className="px-6 py-4 text-primary">{ret.dealerName || `Dealer #${ret.dealerId}`}</td>
                                        <td className="px-6 py-4 text-primary">{ret.returnDate}</td>
                                        <td className="px-6 py-4 text-primary">{ret.totalAmount?.toFixed(2) || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', getStatusBadge(ret.status))}>
                                                {ret.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-primary">{ret.reason || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ResponsiveModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setError(null);
                    setFormData({
                        dealerId: 0,
                        returnDate: new Date().toISOString().split('T')[0],
                        referenceNumber: '',
                        reason: '',
                    });
                    setLines([]);
                    setSelectedDealer(null);
                }}
                title="New Sales Return"
                size="lg"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="rounded-lg border border-border bg-surface-highlight px-4 py-2 text-sm font-medium text-primary hover:bg-surface-highlight/80 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || !formData.dealerId || lines.length === 0}
                            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        >
                            {submitting ? 'Creating...' : 'Create Return'}
                        </button>
                    </>
                }
            >
                <ResponsiveForm onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 rounded-lg border border-transparent bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
                            {error}
                        </div>
                    )}

                    <div>
                        <SearchableCombobox
                            label="Dealer *"
                            value={selectedDealer ? {
                                id: selectedDealer.id,
                                label: selectedDealer.name,
                                subLabel: selectedDealer.code || '',
                                original: selectedDealer
                            } : null}
                            onChange={(option) => {
                                if (option && option.original) {
                                    const dealer = option.original as DealerLookup;
                                    setSelectedDealer(dealer);
                                    setFormData({ ...formData, dealerId: dealer.id });
                                } else {
                                    setSelectedDealer(null);
                                    setFormData({ ...formData, dealerId: 0 });
                                }
                            }}
                            loadOptions={loadDealers}
                            placeholder="Search for a dealer..."
                            nullable={false}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormInput
                            label="Return Date *"
                            type="date"
                            required
                            value={formData.returnDate}
                            onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                        />
                        <FormInput
                            label="Reference Number"
                            value={formData.referenceNumber}
                            onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                            placeholder="Optional reference number"
                        />
                    </div>

                    <FormTextarea
                        label="Reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Optional reason for return..."
                        rows={2}
                    />

                    <div className="border-t border-border pt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-primary">Return Lines *</label>
                            <button
                                type="button"
                                onClick={addLine}
                                className="rounded-lg border border-brand-600 px-3 py-1 text-xs text-brand-700 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-200 dark:hover:bg-brand-400/10"
                            >
                                + Add Line
                            </button>
                        </div>

                        {lines.length === 0 ? (
                            <p className="text-sm text-secondary">No lines added. Click "Add Line" to add items.</p>
                        ) : (
                            <div className="space-y-3">
                                {lines.map((line, index) => (
                                    <div key={index} className="rounded-lg border border-border bg-surface-highlight p-3">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-sm font-medium text-primary">Line {index + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                className="rounded-md px-2 py-1.5 text-xs text-status-error-text hover:bg-status-error-bg touch-manipulation min-h-[36px]"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <FormInput
                                                label="Product ID *"
                                                type="number"
                                                min="0"
                                                required
                                                value={line.productId || ''}
                                                onChange={(e) => {
                                                    updateLine(index, 'productId', Number(e.target.value));
                                                    updateLine(index, 'productName', `Product #${e.target.value}`);
                                                }}
                                            />
                                            <FormInput
                                                label="Quantity *"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                                value={line.quantity || ''}
                                                onChange={(e) => updateLine(index, 'quantity', Number(e.target.value))}
                                            />
                                            <FormInput
                                                label="Unit Price *"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                                value={line.unitPrice || ''}
                                                onChange={(e) => updateLine(index, 'unitPrice', Number(e.target.value))}
                                            />
                                        </div>
                                        <FormInput
                                            label="Line Reason"
                                            value={line.reason}
                                            onChange={(e) => updateLine(index, 'reason', e.target.value)}
                                            placeholder="Optional reason for this line..."
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ResponsiveForm>
            </ResponsiveModal>
        </div>
    );
}










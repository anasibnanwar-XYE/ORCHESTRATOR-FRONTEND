import { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { listInventoryAdjustments, createInventoryAdjustment, listFinishedGoods, type InventoryAdjustmentDto, InventoryAdjustmentRequest, type FinishedGoodDto } from '../../lib/factoryApi';
import { listAccounts, type AccountSummary } from '../../lib/accountingApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormSelect, FormTextarea } from '../../design-system/ResponsiveForm';
import SearchableCombobox, { type ComboboxOption } from '../../components/SearchableCombobox';
import clsx from 'clsx';

type InventoryAdjustmentLineRequest = NonNullable<InventoryAdjustmentRequest['lines']>[number];

interface AdjustmentLine {
    finishedGoodId: number;
    finishedGoodName: string;
    quantity: number;
    unitCost: number;
    note: string;
}

export default function InventoryAdjustmentsPage() {
    const { session } = useAuth();
    const [adjustments, setAdjustments] = useState<InventoryAdjustmentDto[]>([]);
    const [finishedGoods, setFinishedGoods] = useState<FinishedGoodDto[]>([]);
    const [accounts, setAccounts] = useState<AccountSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<{
        adjustmentDate: string;
        type: any; // Use any to bypass enum strictness for now
        adjustmentAccountId: number;
        reason: string;
        adminOverride: boolean;
    }>({
        adjustmentDate: new Date().toISOString().split('T')[0],
        type: 'SHRINKAGE',
        adjustmentAccountId: 0,
        reason: '',
        adminOverride: false,
    });

    const [lines, setLines] = useState<AdjustmentLine[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<AccountSummary | null>(null);

    useEffect(() => {
        loadData();
    }, [session]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [adjustmentsData, goodsData, accountsData] = await Promise.all([
                listInventoryAdjustments(session),
                listFinishedGoods(session),
                listAccounts(session)
            ]);
            setAdjustments(adjustmentsData);
            setFinishedGoods(goodsData);
            setAccounts(accountsData);
        } catch (err) {
            console.error('Failed to load data', err);
            setError('Failed to load inventory adjustments');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.adjustmentAccountId || lines.length === 0) {
            setError('Please select an adjustment account and add at least one line item');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const payload: InventoryAdjustmentRequest = {
                adjustmentDate: formData.adjustmentDate || undefined,
                type: formData.type,
                adjustmentAccountId: formData.adjustmentAccountId,
                reason: `${formData.type}${formData.reason ? ` - ${formData.reason}` : ''}`,
                adminOverride: formData.adminOverride || undefined,
                lines: lines.map(line => ({
                    finishedGoodId: line.finishedGoodId,
                    quantity: line.quantity,
                    unitCost: line.unitCost,
                    note: line.note || undefined,
                })),
            };
            await createInventoryAdjustment(payload, session);
            setShowModal(false);
            setFormData({
                adjustmentDate: new Date().toISOString().split('T')[0],
                type: 'SHRINKAGE',
                adjustmentAccountId: 0,
                reason: '',
                adminOverride: false,
            });
            setLines([]);
            setSelectedAccount(null);
            setSuccess('Inventory adjustment created successfully');
            loadData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create inventory adjustment');
        } finally {
            setSubmitting(false);
        }
    };

	    const loadFinishedGoods = async (query: string): Promise<ComboboxOption[]> => {
	        try {
	            const normalizedQuery = query.toLowerCase();
	            const results = finishedGoods.filter((good) => {
	                const name = (good.name ?? '').toLowerCase();
	                const productCode = ((good as any).productCode ?? '').toLowerCase();
	                return name.includes(normalizedQuery) || productCode.includes(normalizedQuery);
	            });
	            return results
	                .filter((good) => typeof good.id === 'number')
	                .map((good) => ({
	                    id: good.id as number,
	                    label: good.name ?? `Product #${good.id}`,
	                    subLabel: (good as any).productCode ?? '',
	                    original: good,
	                }));
	        } catch {
	            return [];
	        }
	    };

    const loadAccounts = async (query: string): Promise<ComboboxOption[]> => {
        try {
            const results = accounts.filter(acc =>
                acc.name.toLowerCase().includes(query.toLowerCase()) ||
                acc.code.toLowerCase().includes(query.toLowerCase())
            );
            return results.map((acc) => ({
                id: acc.id,
                label: `${acc.code} - ${acc.name}`,
                subLabel: acc.type,
                original: acc,
            }));
        } catch {
            return [];
        }
    };

    const addLine = () => {
        setLines([...lines, { finishedGoodId: 0, finishedGoodName: '', quantity: 0, unitCost: 0, note: '' }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof AdjustmentLine, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const filteredAdjustments = adjustments.filter(adj => {
        const matchesSearch = !searchTerm ||
            adj.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            adj.type?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !typeFilter || adj.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeBadge = (type?: string) => {
        switch (type?.toUpperCase()) {
            case 'DAMAGED':
                return 'bg-status-error-bg text-status-error-text';
            case 'SHRINKAGE':
                return 'bg-status-warning-bg text-status-warning-text';
            case 'OBSOLETE':
                return 'bg-surface-highlight text-tertiary';
            default:
                return 'bg-surface-highlight text-tertiary';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Inventory Adjustments</h1>
                    <p className="mt-1 text-sm text-secondary">Record inventory adjustments for damaged, shrinkage, or obsolete items</p>
                </div>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setError(null);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                    <PlusIcon className="h-5 w-5" />
                    New Adjustment
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

            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
                    <input
                        type="text"
                        placeholder="Search adjustments..."
                        className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-primary placeholder-secondary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                    <option value="">All Types</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="SHRINKAGE">Shrinkage</option>
                    <option value="OBSOLETE">Obsolete</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-secondary">Loading adjustments...</div>
                ) : filteredAdjustments.length === 0 ? (
                    <div className="p-8 text-center text-secondary">No adjustments found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-highlight text-xs uppercase text-secondary">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Type</th>
                                    <th className="px-6 py-3 font-medium">Reason</th>
                                    <th className="px-6 py-3 font-medium">Lines</th>
                                    <th className="px-6 py-3 font-medium">Journal Entry</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredAdjustments.map((adjustment) => (
                                    <tr key={adjustment.id} className="hover:bg-surface-highlight/50 transition-colors">
                                        <td className="px-6 py-4 text-primary">{adjustment.adjustmentDate}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', getTypeBadge(adjustment.type))}>
                                                {adjustment.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-primary">{adjustment.reason || '—'}</td>
                                        <td className="px-6 py-4 text-primary">{adjustment.lines?.length || 0} items</td>
                                        <td className="px-6 py-4 text-primary">
                                            {adjustment.journalEntryId ? (
                                                <span className="text-status-success-text">#{adjustment.journalEntryId}</span>
                                            ) : (
                                                <span className="text-secondary">—</span>
                                            )}
                                        </td>
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
                        adjustmentDate: new Date().toISOString().split('T')[0],
                        type: 'SHRINKAGE',
                        adjustmentAccountId: 0,
                        reason: '',
                        adminOverride: false,
                    });
                    setLines([]);
                    setSelectedAccount(null);
                }}
                title="New Inventory Adjustment"
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
                            disabled={submitting || !formData.adjustmentAccountId || lines.length === 0}
                            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        >
                            {submitting ? 'Creating...' : 'Create Adjustment'}
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

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormInput
                            label="Adjustment Date *"
                            type="date"
                            required
                            value={formData.adjustmentDate}
                            onChange={(e) => setFormData({ ...formData, adjustmentDate: e.target.value })}
                        />
                                                <select
                                                    required
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="SHRINKAGE">Shrinkage</option>
                                                    <option value="DAMAGED">Damaged</option>
                                                    <option value="OBSOLETE">Obsolete</option>
                                                </select>
                    </div>

                    <div>
                        <SearchableCombobox
                            label="Adjustment Account *"
                            value={selectedAccount ? {
                                id: selectedAccount.id,
                                label: `${selectedAccount.code} - ${selectedAccount.name}`,
                                subLabel: selectedAccount.type,
                                original: selectedAccount
                            } : null}
                            onChange={(option) => {
                                if (option && option.original) {
                                    const acc = option.original as AccountSummary;
                                    setSelectedAccount(acc);
                                    setFormData({ ...formData, adjustmentAccountId: acc.id });
                                } else {
                                    setSelectedAccount(null);
                                    setFormData({ ...formData, adjustmentAccountId: 0 });
                                }
                            }}
                            loadOptions={loadAccounts}
                            placeholder="Search for an account..."
                            nullable={false}
                        />
                    </div>

                    <FormTextarea
                        label="Reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Optional reason for adjustment..."
                        rows={2}
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="adminOverride"
                            checked={formData.adminOverride}
                            onChange={(e) => setFormData({ ...formData, adminOverride: e.target.checked })}
                            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor="adminOverride" className="text-sm text-secondary">
                            Admin Override
                        </label>
                    </div>

                    <div className="border-t border-border pt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-primary">Adjustment Lines *</label>
                            <button
                                type="button"
                                onClick={addLine}
                                className="rounded-lg border border-brand-600 px-3 py-1 text-xs text-brand-700 hover:bg-brand-50"
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
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <SearchableCombobox
                                                    label="Finished Good *"
                                                    value={line.finishedGoodId ? {
                                                        id: line.finishedGoodId,
                                                        label: line.finishedGoodName,
                                                        original: { id: line.finishedGoodId, name: line.finishedGoodName }
                                                    } : null}
                                                    onChange={(option) => {
                                                        if (option && option.original) {
                                                            const good = option.original as FinishedGoodDto;
                                                            updateLine(index, 'finishedGoodId', good.id);
                                                            updateLine(index, 'finishedGoodName', good.name || '');
                                                        } else {
                                                            updateLine(index, 'finishedGoodId', 0);
                                                            updateLine(index, 'finishedGoodName', '');
                                                        }
                                                    }}
                                                    loadOptions={loadFinishedGoods}
                                                    placeholder="Search finished good..."
                                                    nullable={false}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
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
                                                    label="Unit Cost *"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    value={line.unitCost || ''}
                                                    onChange={(e) => updateLine(index, 'unitCost', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <FormInput
                                            label="Note"
                                            value={line.note}
                                            onChange={(e) => updateLine(index, 'note', e.target.value)}
                                            placeholder="Optional note..."
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


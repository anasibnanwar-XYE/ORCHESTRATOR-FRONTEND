import { useState, useEffect } from 'react';
import { PlusIcon, BanknotesIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { createDealerReceipt, createSupplierPayment, listAccounts, listDealers, listSuppliers, searchDealers, searchSuppliers, type AccountSummary, type DealerSummary, type SupplierResponse } from '../../lib/accountingApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormSelect } from '../../design-system/ResponsiveForm';
import SearchableCombobox, { type ComboboxOption } from '../../components/SearchableCombobox';
import SettlementModal from '../../components/SettlementModal';

export default function PaymentsPage() {
    const { session } = useAuth();
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [paymentType, setPaymentType] = useState<'receive' | 'make'>('receive');
    const [paymentMode, setPaymentMode] = useState<'quick' | 'full'>('quick');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [accounts, setAccounts] = useState<AccountSummary[]>([]);
    const [dealers, setDealers] = useState<DealerSummary[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
    const [selectedParty, setSelectedParty] = useState<DealerSummary | SupplierResponse | null>(null);
    const [settlementParty, setSettlementParty] = useState<DealerSummary | SupplierResponse | null>(null);
    const [formData, setFormData] = useState({
        partyId: 0,
        cashAccountId: 0,
        amount: 0,
        referenceNumber: '',
        memo: ''
    });

    useEffect(() => {
        loadData();
    }, [session]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Note: listSettlements endpoint not available in backend - removed
            const [accountsData, dealersData, suppliersData] = await Promise.all([
                listAccounts(session),
                listDealers(session),
                listSuppliers(session)
            ]);
            setSettlements([]); // Empty array since endpoint doesn't exist
            setAccounts(accountsData.filter(a => a.type === 'Asset' && a.name.toLowerCase().includes('cash')));
            setDealers(dealersData);
            setSuppliers(suppliersData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.partyId || !formData.cashAccountId || formData.amount <= 0) {
            setError('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            if (paymentType === 'receive') {
                // Use dealer receipt endpoint for simple payments (not settlements with allocations)
                await createDealerReceipt({
                    dealerId: formData.partyId,
                    cashAccountId: formData.cashAccountId,
                    amount: formData.amount,
                    referenceNumber: formData.referenceNumber || undefined,
                    memo: formData.memo || undefined
                }, session);
            } else {
                // Use supplier payment endpoint for simple payments (not settlements with allocations)
                await createSupplierPayment({
                    supplierId: formData.partyId,
                    cashAccountId: formData.cashAccountId,
                    amount: formData.amount,
                    referenceNumber: formData.referenceNumber || undefined,
                    memo: formData.memo || undefined
                }, session);
            }
            setShowModal(false);
            setFormData({ partyId: 0, cashAccountId: 0, amount: 0, referenceNumber: '', memo: '' });
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Payments & Settlements</h1>
                    <p className="text-sm text-secondary">Manage incoming and outgoing payments</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => {
                                setPaymentType('receive');
                                setPaymentMode('quick');
                                setShowModal(true);
                            }}
                            id="payments-receive-btn"
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                            <ArrowDownLeftIcon className="h-5 w-5" />
                            Quick Receipt
                        </button>
                        <button
                            onClick={() => {
                                setPaymentType('receive');
                                setPaymentMode('full');
                                setShowModal(false);
                                setShowSettlementModal(true);
                            }}
                            className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500"
                        >
                            Full Settlement
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setPaymentType('make');
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                        <ArrowUpRightIcon className="h-5 w-5" />
                        Make Payment
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            <div id="payments-list" className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-highlight text-xs uppercase text-secondary">
                            <tr>
                                <th className="px-6 py-3 font-medium">Reference</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Party</th>
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-secondary">Loading payments...</td>
                                </tr>
                            ) : settlements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-secondary">
                                        Payment history is not yet available. Use Quick Receipt or Make Payment to record transactions.
                                    </td>
                                </tr>
                            ) : (
                                settlements.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-surface-highlight/50">
                                        <td className="px-6 py-4 font-medium text-primary">{item.referenceNumber}</td>
                                        <td className="px-6 py-4 text-secondary">{item.settlementDate}</td>
                                        <td className="px-6 py-4 text-secondary">{item.dealerName || item.supplierName}</td>
                                        <td className="px-6 py-4 font-medium text-primary">₹ {item.totalApplied?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.type === 'INCOMING'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                }`}>
                                                {item.type}
                                            </span>
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
                    setFormData({ partyId: 0, cashAccountId: 0, amount: 0, referenceNumber: '', memo: '' });
                }}
                title={paymentType === 'receive' ? 'Receive Payment' : 'Make Payment'}
                size="md"
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
                            disabled={submitting || !formData.partyId || !formData.cashAccountId || formData.amount <= 0}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${paymentType === 'receive' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-brand-600 hover:bg-brand-700'
                                }`}
                        >
                            {submitting ? 'Processing...' : 'Record Payment'}
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

                    <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        <strong>Quick Receipt:</strong> Records payment without allocating to specific invoices. Use "Full Settlement" to allocate payments to invoices.
                    </div>

                    <div>
                        <SearchableCombobox
                            label={paymentType === 'receive' ? 'Dealer *' : 'Supplier *'}
                            value={selectedParty ? {
                                id: selectedParty.id || 0,
                                label: (selectedParty as any).name || (selectedParty as any).dealerName || (selectedParty as any).supplierName || '',
                                subLabel: (selectedParty as any).code || '',
                                original: selectedParty
                            } as any : null}
                            onChange={(option) => {
                                if (option && option.original) {
                                    const party = option.original as DealerSummary | SupplierResponse;
                                    setSelectedParty(party);
                                    setFormData({ ...formData, partyId: party.id || 0 });
                                } else {
                                    setSelectedParty(null);
                                    setFormData({ ...formData, partyId: 0 });
                                }
                            }}
                            loadOptions={async (query: string) => {
                                try {
                                    const results = paymentType === 'receive'
                                        ? await searchDealers(query, session, session?.companyCode)
                                        : await searchSuppliers(query, session, session?.companyCode);
                                    return results.map((p) => ({
                                        id: p.id,
                                        label: p.name,
                                        subLabel: 'code' in p ? p.code : '',
                                        original: p,
                                    }));
                                } catch {
                                    return [];
                                }
                            }}
                            placeholder={`Search ${paymentType === 'receive' ? 'dealer' : 'supplier'} by name or code...`}
                            nullable={false}
                        />
                        {!selectedParty && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {paymentType === 'receive' ? 'Dealer' : 'Supplier'} is required
                            </p>
                        )}
                    </div>

                    <FormSelect
                        label="Cash Account *"
                        required
                        value={formData.cashAccountId.toString()}
                        onChange={(e) => setFormData({ ...formData, cashAccountId: Number(e.target.value) })}
                        options={[
                            { value: '0', label: 'Select cash account...' },
                            ...accounts.map(a => ({ value: a.id.toString(), label: `${a.code} - ${a.name}` }))
                        ]}
                        error={!formData.cashAccountId ? 'Cash account is required' : undefined}
                    />

                    <FormInput
                        label="Amount *"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        placeholder="0.00"
                        error={formData.amount <= 0 ? 'Amount must be greater than 0' : undefined}
                    />

                    <FormInput
                        label="Reference Number"
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                        placeholder="Cheque number, transaction ID, etc."
                    />

                    <FormInput
                        label="Memo"
                        value={formData.memo}
                        onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                        placeholder="Optional notes..."
                    />
                </ResponsiveForm>
            </ResponsiveModal>

            {showSettlementModal && paymentType === 'receive' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => {
                        setShowSettlementModal(false);
                        setSettlementParty(null);
                    }} />
                    <div className="relative z-10 w-full max-w-4xl p-4">
                        <div className="mb-4 rounded-lg bg-white p-4 shadow-xl dark:bg-[#1e1e1e]">
                            <h3 className="mb-4 text-lg font-semibold text-primary">
                                Select Dealer for Full Settlement
                            </h3>
                            <SearchableCombobox
                                label="Dealer *"
                                value={settlementParty ? {
                                    id: settlementParty.id || 0,
                                    label: (settlementParty as any).name,
                                    subLabel: (settlementParty as any).code || '',
                                    original: settlementParty
                                } as any : null}
                                onChange={(option) => {
                                    if (option && option.original) {
                                        const party = option.original as DealerSummary;
                                        setSettlementParty(party);
                                    } else {
                                        setSettlementParty(null);
                                    }
                                }}
                                loadOptions={async (query: string) => {
                                    try {
                                        const results = await searchDealers(query, session, session?.companyCode);
                                        return results.map((p) => ({
                                            id: p.id,
                                            label: p.name,
                                            subLabel: p.code || '',
                                            original: p,
                                        }));
                                    } catch {
                                        return [];
                                    }
                                }}
                                placeholder="Search dealer by name or code..."
                                nullable={false}
                            />
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowSettlementModal(false);
                                        setSettlementParty(null);
                                    }}
                                    className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (settlementParty) {
                                            setShowSettlementModal(false);
                                        }
                                    }}
                                    disabled={!settlementParty}
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {settlementParty && paymentType === 'receive' && (
                <SettlementModal
                    open={!!settlementParty}
                    onClose={() => {
                        setSettlementParty(null);
                        setShowSettlementModal(false);
                    }}
                    partnerId={settlementParty.id || 0}
                    partnerType="DEALER"
                    partnerName={'name' in settlementParty ? settlementParty.name : (settlementParty as any).dealerName || (settlementParty as any).supplierName || ''}
                    onSuccess={() => {
                        setSettlementParty(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}

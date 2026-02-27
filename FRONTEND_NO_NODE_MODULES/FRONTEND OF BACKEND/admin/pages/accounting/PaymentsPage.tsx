import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createDealerReceipt, createSupplierPayment, listAccounts, listDealers, listSuppliers, searchDealers, searchSuppliers, type AccountSummary, type DealerSummary, type SupplierResponse } from '../../lib/accountingApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormSelect } from '../../design-system/ResponsiveForm';
import SearchableCombobox from '../../components/SearchableCombobox';

export default function PaymentsPage() {
    const { session } = useAuth();
    const [settlements, setSettlements] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [paymentType, setPaymentType] = useState<'receive' | 'make'>('receive');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [accounts, setAccounts] = useState<AccountSummary[]>([]);
    const [selectedParty, setSelectedParty] = useState<DealerSummary | SupplierResponse | null>(null);
    const [formData, setFormData] = useState({
        partyId: 0,
        cashAccountId: 0,
        amount: 0,
        referenceNumber: '',
        memo: ''
    });

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [accountsData, dealersData, suppliersData] = await Promise.all([
                listAccounts(session),
                listDealers(session),
                listSuppliers(session)
            ]);
            // Note: listSettlements endpoint not available in backend
            setSettlements([]);
            void dealersData;
            void suppliersData;
            setAccounts(accountsData.filter(a => a.type === 'Asset' && a.name.toLowerCase().includes('cash')));
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
                await createDealerReceipt({
                    dealerId: formData.partyId,
                    cashAccountId: formData.cashAccountId,
                    amount: formData.amount,
                    referenceNumber: formData.referenceNumber || undefined,
                    memo: formData.memo || undefined
                }, session);
            } else {
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
            setSelectedParty(null);
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-primary">Payments &amp; Settlements</h1>
                    <p className="text-sm text-secondary">Manage incoming and outgoing payments</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setPaymentType('receive');
                            setShowModal(true);
                        }}
                        id="payments-receive-btn"
                        className="flex items-center gap-2 rounded-lg bg-status-success-bg border border-status-success-text/30 px-4 py-2 text-sm font-medium text-status-success-text hover:opacity-80 transition-opacity"
                    >
                        <ArrowDownLeft className="h-4 w-4" />
                        Quick Receipt
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setPaymentType('make');
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-action-primary-bg px-4 py-2 text-sm font-medium text-action-primary-text hover:bg-action-primary-hover transition-colors"
                    >
                        <ArrowUpRight className="h-4 w-4" />
                        Make Payment
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-status-error-text/20 bg-status-error-bg p-4 text-sm text-status-error-text">
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
                                settlements.map((item, idx) => (
                                    <tr key={String(item.id ?? idx)} className="hover:bg-surface-highlight/50">
                                        <td className="px-6 py-4 font-medium text-primary">{String(item.referenceNumber ?? '')}</td>
                                        <td className="px-6 py-4 text-secondary">{String(item.settlementDate ?? '')}</td>
                                        <td className="px-6 py-4 text-secondary">{String(item.dealerName ?? item.supplierName ?? '')}</td>
                                        <td className="px-6 py-4 font-medium text-primary">₹ {Number(item.totalApplied ?? 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.type === 'INCOMING'
                                                ? 'bg-status-success-bg text-status-success-text'
                                                : 'bg-status-error-bg text-status-error-text'
                                                }`}>
                                                {String(item.type ?? '')}
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
                    setSelectedParty(null);
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
                            className="rounded-lg bg-action-primary-bg px-4 py-2 text-sm font-medium text-action-primary-text hover:bg-action-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? 'Processing...' : 'Record Payment'}
                        </button>
                    </>
                }
            >
                <ResponsiveForm onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 rounded-xl border border-status-error-text/20 bg-status-error-bg p-3 text-sm text-status-error-text">
                            {error}
                        </div>
                    )}

                    <div className="mb-4 rounded-lg border border-border bg-surface-highlight p-3 text-sm text-secondary">
                        <strong className="text-primary">Quick {paymentType === 'receive' ? 'Receipt' : 'Payment'}:</strong> Records payment without allocating to specific invoices. Use the Settlement Modal (via Suppliers page) to allocate payments to invoices.
                    </div>

                    <div>
                        <SearchableCombobox
                            label={paymentType === 'receive' ? 'Dealer *' : 'Supplier *'}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            value={selectedParty ? ({
                                id: selectedParty.id ?? 0,
                                label: ((selectedParty as Record<string, unknown>).name as string) || ((selectedParty as Record<string, unknown>).dealerName as string) || '',
                                subLabel: ((selectedParty as Record<string, unknown>).code as string) || '',
                                original: selectedParty,
                            } as any) : null}
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
                            <p className="mt-1 text-xs text-status-error-text">
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
        </div>
    );
}

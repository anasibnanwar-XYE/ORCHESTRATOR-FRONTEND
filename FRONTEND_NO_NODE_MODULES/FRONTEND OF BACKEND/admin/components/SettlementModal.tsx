import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import {
    listAccounts,
    createDealerSettlement,
    createSupplierSettlement,
    listInvoices,
    type AccountSummary,
    type SettlementAllocation,
    type SettlementResponse,
    type SettlementPaymentRequest,
    type InvoiceDto,
} from '../lib/accountingApi';

interface SettlementModalProps {
    open: boolean;
    onClose: () => void;
    partnerId: number;
    partnerType: 'DEALER' | 'SUPPLIER';
    partnerName: string;
    onSuccess?: (response: SettlementResponse) => void;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export default function SettlementModal({
    open,
    onClose,
    partnerId,
    partnerType,
    partnerName,
    onSuccess,
}: SettlementModalProps) {
    const { session } = useAuth();
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [accounts, setAccounts] = useState<AccountSummary[]>([]);
    const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
    const [cashAccountId, setCashAccountId] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
    const [payments, setPayments] = useState<Array<{ accountId: number; amount: number; method: string; referenceNumber?: string; memo?: string }>>([
        { accountId: 0, amount: 0, method: 'CASH' },
    ]);
    const [discountAccountId, setDiscountAccountId] = useState<number | ''>('');
    const [writeOffAccountId, setWriteOffAccountId] = useState<number | ''>('');
    const [fxGainAccountId, setFxGainAccountId] = useState<number | ''>('');
    const [fxLossAccountId, setFxLossAccountId] = useState<number | ''>('');
    const [allocations, setAllocations] = useState<SettlementAllocation[]>([
        { invoiceId: undefined, appliedAmount: 0 },
    ]);
    const [memo, setMemo] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [settlementDate, setSettlementDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [adminOverride, setAdminOverride] = useState(false);
    const [idempotencyKey, setIdempotencyKey] = useState('');
    const [paymentSectionExpanded, setPaymentSectionExpanded] = useState(false);

    useEffect(() => {
        if (open) {
            setIdempotencyKey(generateUUID());
            setSettlementDate(new Date().toISOString().split('T')[0]);
            loadAccounts();
            if (partnerType === 'DEALER') {
                loadInvoices();
            }
        } else {
            resetForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, session, partnerId, partnerType]);

    const loadAccounts = async () => {
        if (!session) return;
        setLoadingAccounts(true);
        try {
            const list = await listAccounts(session);
            setAccounts(list);
        } catch (err) {
            console.error('Failed to load accounts', err);
        } finally {
            setLoadingAccounts(false);
        }
    };

    const loadInvoices = async () => {
        if (!session || partnerType !== 'DEALER') return;
        setLoadingInvoices(true);
        try {
            const list = await listInvoices({ dealerId: partnerId, status: 'UNPAID' }, session, session.companyCode);
            // Filter to only show invoices with outstanding amounts
            setInvoices(list.filter(inv => {
                const outstanding = (inv as any).outstandingAmount ?? inv.totalAmount;
                return outstanding > 0;
            }));
        } catch (err) {
            console.error('Failed to load invoices', err);
            setInvoices([]);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const resetForm = () => {
        setPaymentMode('single');
        setCashAccountId('');
        setPaymentMethod('CASH');
        setPayments([{ accountId: 0, amount: 0, method: 'CASH' }]);
        setDiscountAccountId('');
        setWriteOffAccountId('');
        setFxGainAccountId('');
        setFxLossAccountId('');
        setAllocations([{ invoiceId: undefined, appliedAmount: 0 }]);
        setMemo('');
        setReferenceNumber('');
        setSettlementDate(new Date().toISOString().split('T')[0]);
        setAdminOverride(false);
        setPaymentSectionExpanded(false);
        setError(null);
    };

    const handleAllocationChange = (
        index: number,
        field: keyof SettlementAllocation,
        value: string | number
    ) => {
        const newAllocations = [...allocations];
        const numValue = typeof value === 'string' ? Number(value) : value;

        if (field === 'memo') {
            (newAllocations[index] as any)[field] = value;
        } else {
            (newAllocations[index] as any)[field] = isNaN(numValue) ? 0 : numValue;
        }
        setAllocations(newAllocations);
    };

    const addAllocation = () => {
        setAllocations([...allocations, { appliedAmount: 0 }]);
    };

    const removeAllocation = (index: number) => {
        if (allocations.length > 1) {
            setAllocations(allocations.filter((_, i) => i !== index));
        }
    };

    const totals = useMemo(() => {
        return allocations.reduce(
            (acc, curr) => ({
                applied: acc.applied + (curr.appliedAmount || 0),
                discount: acc.discount + (curr.discountAmount || 0),
                writeOff: acc.writeOff + (curr.writeOffAmount || 0),
                fx: acc.fx + (curr.fxAdjustment || 0),
            }),
            { applied: 0, discount: 0, writeOff: 0, fx: 0 }
        );
    }, [allocations]);

    const needsDiscountAccount = totals.discount > 0;
    const needsWriteOffAccount = totals.writeOff > 0;
    const needsFxGainAccount = totals.fx > 0;
    const needsFxLossAccount = totals.fx < 0;

    const netCashRequired = useMemo(() => {
        return totals.applied + Math.max(totals.fx, 0) - Math.max(-totals.fx, 0) - totals.discount - totals.writeOff;
    }, [totals]);

    const paymentTotal = useMemo(() => {
        if (paymentMode === 'single') {
            return cashAccountId ? netCashRequired : 0;
        }
        return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    }, [paymentMode, cashAccountId, payments, netCashRequired]);

    const canSubmit = useMemo(() => {
        if (totals.applied <= 0) return false;
        if (needsDiscountAccount && !discountAccountId) return false;
        if (needsWriteOffAccount && !writeOffAccountId) return false;
        if (needsFxGainAccount && !fxGainAccountId) return false;
        if (needsFxLossAccount && !fxLossAccountId) return false;
        
        // Payment validation
        // Validate allocations have invoiceId for dealers
        if (partnerType === 'DEALER') {
            if (allocations.some(a => !a.invoiceId && a.appliedAmount > 0)) return false;
        }
        
        // Payment validation
        if (paymentMode === 'single') {
            if (!cashAccountId) return false;
        } else {
            if (payments.length === 0) return false;
            if (payments.some(p => !p.accountId || p.amount <= 0)) return false;
            // Payment total must equal net cash required
            if (Math.abs(paymentTotal - netCashRequired) > 0.01) return false;
        }
        
        return true;
    }, [
        totals.applied,
        needsDiscountAccount,
        discountAccountId,
        needsWriteOffAccount,
        writeOffAccountId,
        needsFxGainAccount,
        fxGainAccountId,
        needsFxLossAccount,
        fxLossAccountId,
        paymentMode,
        cashAccountId,
        payments,
        paymentTotal,
        netCashRequired,
    ]);

    const handlePaymentChange = (index: number, field: string, value: string | number) => {
        const newPayments = [...payments];
        if (field === 'accountId' || field === 'amount') {
            const numValue = typeof value === 'string' ? Number(value) : value;
            (newPayments[index] as any)[field] = isNaN(numValue) ? 0 : numValue;
        } else {
            (newPayments[index] as any)[field] = value;
        }
        setPayments(newPayments);
    };

    const addPayment = () => {
        setPayments([...payments, { accountId: 0, amount: 0, method: 'CASH' }]);
    };

    const removePayment = (index: number) => {
        if (payments.length > 1) {
            setPayments(payments.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit || submitting || !session) return;
        setSubmitting(true);
        setError(null);

        try {
            const commonPayload: any = {
                allocations,
                discountAccountId: discountAccountId ? Number(discountAccountId) : undefined,
                writeOffAccountId: writeOffAccountId ? Number(writeOffAccountId) : undefined,
                fxGainAccountId: fxGainAccountId ? Number(fxGainAccountId) : undefined,
                fxLossAccountId: fxLossAccountId ? Number(fxLossAccountId) : undefined,
                referenceNumber: referenceNumber || undefined,
                memo: memo || undefined,
                adminOverride,
                idempotencyKey,
            };

            // Add settlement date
            commonPayload.settlementDate = settlementDate;

            // Add payment method (single or split-tender)
            if (paymentMode === 'single') {
                // For single payment, use payments array with one entry (backend expects payments array)
                commonPayload.payments = [{
                    accountId: Number(cashAccountId),
                    amount: netCashRequired,
                    method: paymentMethod,
                }];
            } else {
                // Split-tender: send payments array, filter out empty ones
                commonPayload.payments = payments
                    .filter(p => p.accountId > 0 && p.amount > 0)
                    .map(p => ({
                        accountId: p.accountId,
                        amount: p.amount,
                        method: p.method || 'CASH',
                        referenceNumber: p.referenceNumber || undefined,
                        memo: p.memo || undefined,
                    }));
            }

            let response: SettlementResponse;
            if (partnerType === 'DEALER') {
                response = await createDealerSettlement(
                    { ...commonPayload, dealerId: partnerId },
                    session
                );
            } else {
                // Supplier contract: cashAccountId (singular), NO payments array,
                // and allocations must NOT carry invoiceId (that's AR/dealer-only).
                const supplierAllocations = allocations.map(({ invoiceId: _drop, ...rest }) => rest);
                const { payments: _dropPayments, ...rest } = commonPayload;
                response = await createSupplierSettlement(
                    {
                        ...rest,
                        allocations: supplierAllocations,
                        cashAccountId: Number(cashAccountId),
                        supplierId: partnerId,
                    },
                    session
                );
            }

            onSuccess?.(response);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Settlement failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={() => !submitting && onClose()} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto p-2 sm:p-4">
                    <div className="flex min-h-full items-start sm:items-center justify-center pt-4 sm:pt-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-full sm:max-w-2xl md:max-w-4xl rounded-xl sm:rounded-2xl bg-surface p-3 sm:p-4 md:p-6 shadow-xl border-border my-auto max-h-[95vh] overflow-y-auto">
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <div>
                                        <Dialog.Title className="text-xl font-semibold text-primary">
                                            Record Settlement
                                        </Dialog.Title>
                                        <p className="text-sm text-secondary">
                                            {partnerType === 'DEALER' ? 'Receive from' : 'Pay to'}:{' '}
                                            <span className="font-medium text-primary">
                                                {partnerName}
                                            </span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        disabled={submitting}
                                        className="rounded-full p-1 text-tertiary hover:bg-surface-highlight hover:text-primary"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:grid-cols-3">
                                    <div className="space-y-4 lg:col-span-2">
                                        <div className="rounded-xl border border-border bg-surface-highlight p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-primary">
                                                    Allocations
                                                </h3>
                                                <button
                                                    onClick={addAllocation}
                                                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                                >
                                                    <PlusIcon className="h-3 w-3" /> Add line
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {allocations.map((alloc, index) => {
                                                    const selectedInvoice = partnerType === 'DEALER' && alloc.invoiceId 
                                                        ? invoices.find(inv => inv.id === alloc.invoiceId)
                                                        : null;
                                                    const outstandingAmount = selectedInvoice 
                                                        ? ((selectedInvoice as any).outstandingAmount ?? selectedInvoice.totalAmount)
                                                        : 0;
                                                    
                                                    return (
                                                    <div
                                                        key={index}
                                                        className="rounded-lg bg-surface p-3 shadow-sm"
                                                    >
                                                        {partnerType === 'DEALER' && (
                                                            <div className="mb-3">
                                                                <label className="text-[10px] uppercase tracking-wider text-secondary">
                                                                    Invoice <span className="text-rose-500">*</span>
                                                                </label>
                                                                <select
                                                                    value={alloc.invoiceId || ''}
                                                                    onChange={(e) => {
                                                                        const invoiceId = e.target.value ? Number(e.target.value) : undefined;
                                                                        const invoice = invoices.find(inv => inv.id === invoiceId);
                                                                        const outstanding = invoice ? ((invoice as any).outstandingAmount ?? invoice.totalAmount) : 0;
                                                                        handleAllocationChange(index, 'invoiceId', invoiceId || 0);
                                                                        // Auto-fill appliedAmount with outstanding amount if not set
                                                                        if (!alloc.appliedAmount && outstanding > 0) {
                                                                            handleAllocationChange(index, 'appliedAmount', outstanding);
                                                                        }
                                                                    }}
                                                                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-primary"
                                                                    disabled={loadingInvoices}
                                                                >
                                                                    <option value="">Select invoice...</option>
                                                                    {invoices.map((inv) => {
                                                                        const outstanding = (inv as any).outstandingAmount ?? inv.totalAmount;
                                                                        return (
                                                                            <option key={inv.id} value={inv.id}>
                                                                                {inv.invoiceNumber} - ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })} outstanding
                                                                            </option>
                                                                        );
                                                                    })}
                                                                </select>
                                                                {selectedInvoice && (
                                                                    <p className="mt-1 text-xs text-tertiary">
                                                                        Outstanding: ₹{outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                                                            <div className="col-span-1 md:col-span-3">
                                                                <label className="text-[10px] uppercase tracking-wider text-secondary">
                                                                    Applied Amount <span className="text-rose-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={alloc.appliedAmount || ''}
                                                                    onChange={(e) =>
                                                                        handleAllocationChange(index, 'appliedAmount', e.target.value)
                                                                    }
                                                                    max={partnerType === 'DEALER' && selectedInvoice ? outstandingAmount : undefined}
                                                                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-primary"
                                                                />
                                                            </div>
                                                            <div className="col-span-1 md:col-span-3">
                                                                <label className="text-[10px] uppercase tracking-wider text-secondary">
                                                                    Discount
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={alloc.discountAmount || ''}
                                                                    onChange={(e) =>
                                                                        handleAllocationChange(index, 'discountAmount', e.target.value)
                                                                    }
                                                                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-primary"
                                                                />
                                                            </div>
                                                            <div className="col-span-1 sm:col-span-2 md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] uppercase tracking-wider text-secondary">
                                                                        Write-off
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={alloc.writeOffAmount || ''}
                                                                        onChange={(e) =>
                                                                            handleAllocationChange(index, 'writeOffAmount', e.target.value)
                                                                        }
                                                                        className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-primary"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] uppercase tracking-wider text-secondary">
                                                                        FX Adj
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={alloc.fxAdjustment || ''}
                                                                        onChange={(e) =>
                                                                            handleAllocationChange(index, 'fxAdjustment', e.target.value)
                                                                        }
                                                                        className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-primary"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-2 flex justify-end sm:col-span-1 sm:items-end sm:justify-center sm:pb-1">
                                                                {allocations.length > 1 && (
                                                                     <button
                                                                        onClick={() => removeAllocation(index)}
                                                                        className="rounded-md p-1.5 text-status-error-text hover:bg-status-error-bg touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="col-span-2 sm:col-span-12">
                                                                <input
                                                                    placeholder="Memo / Reference (optional)"
                                                                    value={alloc.memo || ''}
                                                                    onChange={(e) =>
                                                                        handleAllocationChange(index, 'memo', e.target.value)
                                                                    }
                                                                    className="w-full rounded border-none bg-slate-50 px-2 py-1 text-xs text-slate-600 placeholder:text-secondary focus:ring-0 dark:bg-white/5 dark:text-secondary"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                            {partnerType === 'DEALER' && loadingInvoices && (
                                                <p className="text-xs text-tertiary text-center py-2">Loading invoices...</p>
                                            )}
                                            {partnerType === 'DEALER' && !loadingInvoices && invoices.length === 0 && (
                                                <p className="text-xs text-amber-600 text-center py-2">No unpaid invoices found for this dealer</p>
                                            )}
                                            <div className="mt-3 flex justify-end gap-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <div>Total Applied: {totals.applied.toFixed(2)}</div>
                                                {totals.discount > 0 && (
                                                    <div className="text-amber-600">Disc: {totals.discount.toFixed(2)}</div>
                                                )}
                                                {totals.writeOff > 0 && (
                                                    <div className="text-rose-600">W/O: {totals.writeOff.toFixed(2)}</div>
                                                )}
                                                {totals.fx !== 0 && (
                                                    <div className={totals.fx > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                        FX: {totals.fx.toFixed(2)}
                                                    </div>
                                                )}
                                                <div className="border-l border-slate-300 pl-4 font-semibold text-slate-900 dark:border-white/10 dark:text-white">
                                                    Cash: {(totals.applied + Math.max(totals.fx, 0) - Math.max(-totals.fx, 0) - totals.discount - totals.writeOff).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                                Settlement Details
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium text-tertiary">
                                                        Settlement Date <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={settlementDate}
                                                        onChange={(e) => setSettlementDate(e.target.value)}
                                                        className="w-full rounded-lg border border-border bg-surface text-primary px-3 py-2 text-sm"
                                                        required
                                                    />
                                                </div>
                                                <input
                                                    placeholder="Reference Number"
                                                    value={referenceNumber}
                                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                                    className="rounded-lg border border-border bg-surface text-primary px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <input
                                                placeholder="Global Memo"
                                                value={memo}
                                                onChange={(e) => setMemo(e.target.value)}
                                                className="w-full rounded-lg border border-border bg-surface text-primary px-3 py-2 text-sm"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="adminOverride"
                                                    checked={adminOverride}
                                                    onChange={(e) => setAdminOverride(e.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                                />
                                                <label htmlFor="adminOverride" className="text-sm text-slate-600 dark:text-secondary">
                                                    Admin Override (bypass date/period checks)
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-xl border border-border p-4 dark:border-white/10">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-primary">
                                                    Payment Method
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentSectionExpanded(!paymentSectionExpanded)}
                                                    className="md:hidden text-xs text-tertiary hover:text-slate-700 dark:text-secondary dark:hover:text-slate-200"
                                                >
                                                    {paymentSectionExpanded ? 'Collapse' : 'Expand'}
                                                </button>
                                            </div>
                                            <div className={clsx('space-y-3', !paymentSectionExpanded && 'hidden md:block')}>
                                                {partnerType === 'DEALER' && (
                                                    <div>
                                                        <label className="mb-2 block text-xs font-medium text-tertiary">
                                                            Payment Type
                                                        </label>
                                                        <div className="flex gap-3">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="paymentMode"
                                                                    value="single"
                                                                    checked={paymentMode === 'single'}
                                                                    onChange={(e) => setPaymentMode(e.target.value as 'single' | 'split')}
                                                                    className="h-4 w-4 text-zinc-900 focus:ring-zinc-500 dark:text-white"
                                                                />
                                                                <span className="text-xs text-slate-700 dark:text-slate-300">Single</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="paymentMode"
                                                                    value="split"
                                                                    checked={paymentMode === 'split'}
                                                                    onChange={(e) => setPaymentMode(e.target.value as 'single' | 'split')}
                                                                    className="h-4 w-4 text-zinc-900 focus:ring-zinc-500 dark:text-white"
                                                                />
                                                                <span className="text-xs text-slate-700 dark:text-slate-300">Split Tender</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {paymentMode === 'single' ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-tertiary">
                                                                Cash / Bank Account <span className="text-rose-500">*</span>
                                                            </label>
                                                            <select
                                                                value={cashAccountId}
                                                                onChange={(e) => setCashAccountId(Number(e.target.value))}
                                                                className="w-full rounded-lg border border-border bg-surface text-primary px-3 py-2 text-sm"
                                                            >
                                                                <option value="">Select account...</option>
                                                                {accounts.map((a) => (
                                                                    <option key={a.id} value={a.id}>
                                                                        {a.code} - {a.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-tertiary">
                                                                Payment Method <span className="text-rose-500">*</span>
                                                            </label>
                                                            <select
                                                                value={paymentMethod}
                                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                                className="w-full rounded-lg border border-border bg-surface text-primary px-3 py-2 text-sm"
                                                            >
                                                                <option value="CASH">Cash</option>
                                                                <option value="BANK">Bank Transfer</option>
                                                                <option value="CHEQUE">Cheque</option>
                                                                <option value="CARD">Card</option>
                                                                <option value="OTHER">Other</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs font-medium text-tertiary">
                                                                Payment Lines <span className="text-rose-500">*</span>
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={addPayment}
                                                                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                                            >
                                                                <PlusIcon className="h-3 w-3" /> Add
                                                            </button>
                                                        </div>
                                                        {payments.map((payment, index) => (
                                                            <div key={index} className="rounded-lg bg-white p-3 shadow-sm dark:bg-white/5 space-y-2">
                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                    <div>
                                                                        <label className="text-[10px] uppercase tracking-wider text-secondary">
                                                                            Account <span className="text-rose-500">*</span>
                                                                        </label>
                                                                        <select
                                                                            value={payment.accountId || ''}
                                                                            onChange={(e) => handlePaymentChange(index, 'accountId', Number(e.target.value))}
                                                                            className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-primary"
                                                                        >
                                                                            <option value="">Select...</option>
                                                                            {accounts.map((a) => (
                                                                                <option key={a.id} value={a.id}>
                                                                                    {a.code} - {a.name}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] uppercase tracking-wider text-secondary">
                                                                            Amount <span className="text-rose-500">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={payment.amount || ''}
                                                                            onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                                                                            className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-primary"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] uppercase tracking-wider text-secondary">
                                                                            Method <span className="text-rose-500">*</span>
                                                                        </label>
                                                                        <select
                                                                            value={payment.method || 'CASH'}
                                                                            onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                                                                            className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-primary"
                                                                        >
                                                                            <option value="CASH">Cash</option>
                                                                            <option value="BANK">Bank</option>
                                                                            <option value="CHEQUE">Cheque</option>
                                                                            <option value="CARD">Card</option>
                                                                            <option value="OTHER">Other</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input
                                                                        placeholder="Reference"
                                                                        value={payment.referenceNumber || ''}
                                                                        onChange={(e) => handlePaymentChange(index, 'referenceNumber', e.target.value)}
                                                                        className="rounded border border-border px-2 py-1 text-xs bg-surface text-primary"
                                                                    />
                                                                    <div className="flex gap-1">
                                                                        <input
                                                                            placeholder="Memo"
                                                                            value={payment.memo || ''}
                                                                            onChange={(e) => handlePaymentChange(index, 'memo', e.target.value)}
                                                                            className="flex-1 rounded border border-border px-2 py-1 text-xs bg-surface text-primary"
                                                                        />
                                                                        {payments.length > 1 && (
                                                                             <button
                                                                                type="button"
                                                                                onClick={() => removePayment(index)}
                                                                                className="rounded-md p-1.5 text-status-error-text hover:bg-status-error-bg touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                                                                            >
                                                                                <TrashIcon className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 pt-2 border-t border-border dark:border-white/10">
                                                            <div className="flex justify-between">
                                                                <span>Payment Total:</span>
                                                                <span className={Math.abs(paymentTotal - netCashRequired) > 0.01 ? 'text-rose-600' : 'text-emerald-600'}>
                                                                    {paymentTotal.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-tertiary">
                                                                <span>Required:</span>
                                                                <span>{netCashRequired.toFixed(2)}</span>
                                                            </div>
                                                            {Math.abs(paymentTotal - netCashRequired) > 0.01 && (
                                                                <div className="text-rose-600 text-[10px] mt-1">
                                                                    Payment total must equal required amount
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="rounded-xl border border-border p-4 dark:border-white/10">
                                            <h3 className="mb-3 text-sm font-medium text-primary">
                                                GL Accounts
                                            </h3>
                                            <div className="space-y-3">

                                                {needsDiscountAccount && (
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-amber-600">
                                                            Discount Account <span className="text-rose-500">*</span>
                                                        </label>
                                                        <select
                                                            value={discountAccountId}
                                                            onChange={(e) => setDiscountAccountId(Number(e.target.value))}
                                                            className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm focus:ring-amber-500 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                                                        >
                                                            <option value="">Select discount account...</option>
                                                            {accounts.map((a) => (
                                                                <option key={a.id} value={a.id}>
                                                                    {a.code} - {a.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {needsWriteOffAccount && (
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-rose-600">
                                                            Write-off Account <span className="text-rose-500">*</span>
                                                        </label>
                                                        <select
                                                            value={writeOffAccountId}
                                                            onChange={(e) => setWriteOffAccountId(Number(e.target.value))}
                                                            className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm focus:ring-rose-500 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                                                        >
                                                            <option value="">Select write-off account...</option>
                                                            {accounts.map((a) => (
                                                                <option key={a.id} value={a.id}>
                                                                    {a.code} - {a.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {needsFxGainAccount && (
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-emerald-600">
                                                            FX Gain Account <span className="text-rose-500">*</span>
                                                        </label>
                                                        <select
                                                            value={fxGainAccountId}
                                                            onChange={(e) => setFxGainAccountId(Number(e.target.value))}
                                                            className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm focus:ring-emerald-500 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                                                        >
                                                            <option value="">Select FX gain account...</option>
                                                            {accounts.map((a) => (
                                                                <option key={a.id} value={a.id}>
                                                                    {a.code} - {a.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {needsFxLossAccount && (
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-rose-600">
                                                            FX Loss Account <span className="text-rose-500">*</span>
                                                        </label>
                                                        <select
                                                            value={fxLossAccountId}
                                                            onChange={(e) => setFxLossAccountId(Number(e.target.value))}
                                                            className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm focus:ring-rose-500 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                                                        >
                                                            <option value="">Select FX loss account...</option>
                                                            {accounts.map((a) => (
                                                                <option key={a.id} value={a.id}>
                                                                    {a.code} - {a.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                                                {error}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!canSubmit || submitting}
                                                className={clsx(
                                                    'w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition',
                                                    !canSubmit || submitting
                                                        ? 'cursor-not-allowed bg-slate-400'
                                                        : 'bg-brand-600 hover:bg-brand-500'
                                                )}
                                            >
                                                {submitting ? 'Processing...' : 'Post Settlement'}
                                            </button>
                                            <button
                                                onClick={onClose}
                                                disabled={submitting}
                                                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

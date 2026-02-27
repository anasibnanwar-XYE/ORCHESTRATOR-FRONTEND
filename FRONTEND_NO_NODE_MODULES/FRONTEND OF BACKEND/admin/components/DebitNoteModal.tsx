import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition, Switch, Listbox } from '@headlessui/react';
import { XMarkIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { createDebitNote, listPurchases, type DebitNoteRequest, type JournalEntrySummary, type PurchaseDto } from '../lib/accountingApi';
import { formatAmount } from '../lib/formatUtils';

interface DebitNoteModalProps {
    open: boolean;
    onClose: () => void;
    supplierId: number;
    supplierName: string;
    onSuccess?: (response: JournalEntrySummary) => void;
}

export default function DebitNoteModal({
    open,
    onClose,
    supplierId,
    supplierName,
    onSuccess,
}: DebitNoteModalProps) {
    const { session, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingPurchases, setFetchingPurchases] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
    const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDto | null>(null);

    // Form state
    const [referenceNumber, setReferenceNumber] = useState('');
    const [memo, setMemo] = useState('');
    const [adminOverride, setAdminOverride] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (open) {
            setReferenceNumber('');
            setMemo('');
            setAdminOverride(false);
            setError(null);
            setLoading(false);
            setSelectedPurchase(null);
            fetchPurchases();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, supplierId]);

    const fetchPurchases = async () => {
        if (!session) return;
        setFetchingPurchases(true);
        try {
            const list = await listPurchases(session, session.companyCode, supplierId);
            // Filter out purchases that might not be eligible if needed, for now show all
            setPurchases(list);
        } catch (err) {
            console.error('Failed to load purchases:', err);
            setError('Failed to load purchases for this supplier.');
        } finally {
            setFetchingPurchases(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !selectedPurchase) return;

        setLoading(true);
        setError(null);

        try {
            const payload: DebitNoteRequest = {
                purchaseId: selectedPurchase.id!,
                referenceNumber: referenceNumber || undefined,
                memo: memo || undefined,
                adminOverride,
                idempotencyKey: crypto.randomUUID(),
                entryDate: new Date().toISOString().split('T')[0],
            };

            const result = await createDebitNote(payload, session, session.companyCode);
            onSuccess?.(result);
            onClose();
        } catch (err) {
            console.error('Failed to create debit note:', err);
            setError(err instanceof Error ? err.message : 'Failed to create debit note');
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = formatAmount;

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/75 transition-opacity backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-2 sm:p-4 text-center sm:items-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all dark:bg-[#1e1e1e] dark:border dark:border-white/10 w-full max-w-full sm:max-w-lg sm:my-8 max-h-[95vh] overflow-y-auto">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-[#1e1e1e] dark:text-slate-500 dark:hover:text-slate-400"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5 sm:p-6">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-slate-900 dark:text-white">
                                                Create Debit Note
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Issue a debit note for <span className="font-medium text-slate-900 dark:text-slate-200">{supplierName}</span>.
                                                    Select a purchase/bill to reverse or adjust.
                                                </p>
                                            </div>

                                            {error && (
                                                <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
                                                    {error}
                                                </div>
                                            )}

                                            <form id="debit-note-form" onSubmit={handleSubmit} className="mt-6 space-y-4">
                                                <div>
                                                    <Listbox value={selectedPurchase} onChange={setSelectedPurchase}>
                                                        {({ open }) => (
                                                            <>
                                                                <Listbox.Label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                    Select Purchase/Bill
                                                                </Listbox.Label>
                                                                <div className="relative mt-1">
                                                                    <Listbox.Button className="relative w-full cursor-default rounded-md border border-slate-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white sm:text-sm">
                                                                        <span className="block truncate">
                                                                            {selectedPurchase
                                                                                ? `${selectedPurchase.invoiceNumber ?? `PUR-${selectedPurchase.id}`} - ${formatMoney(selectedPurchase.totalAmount)}`
                                                                                : fetchingPurchases
                                                                                    ? 'Loading purchases...'
                                                                                    : 'Select a purchase'}
                                                                        </span>
                                                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                                            <ChevronUpDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                                                        </span>
                                                                    </Listbox.Button>

                                                                    <Transition
                                                                        show={open}
                                                                        as={Fragment}
                                                                        leave="transition ease-in duration-100"
                                                                        leaveFrom="opacity-100"
                                                                        leaveTo="opacity-0"
                                                                    >
                                                                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-[#1e1e1e] dark:border dark:border-white/10 sm:text-sm">
                                                                            {purchases.length === 0 && !fetchingPurchases ? (
                                                                                <div className="relative cursor-default select-none px-4 py-2 text-slate-500">
                                                                                    No purchases found for this supplier.
                                                                                </div>
                                                                            ) : (
                                                                                purchases.map((purchase) => (
                                                                                    <Listbox.Option
                                                                                        key={purchase.id}
                                                                                        className={({ active }) =>
                                                                                            clsx(
                                                                                                active ? 'bg-indigo-600 text-white' : 'text-slate-900 dark:text-slate-200',
                                                                                                'relative cursor-default select-none py-2 pl-3 pr-9'
                                                                                            )
                                                                                        }
                                                                                        value={purchase}
                                                                                    >
                                                                                        {({ selected, active }) => (
                                                                                            <>
                                                                                                <div className="flex justify-between">
                                                                                                    <span className={clsx(selected ? 'font-semibold' : 'font-normal', 'truncate')}>
                                                                                                        {purchase.invoiceNumber ?? `PUR-${purchase.id}`}
                                                                                                    </span>
                                                                                                    <span className={clsx(active ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400')}>
                                                                                                        {formatMoney(purchase.totalAmount)}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {selected ? (
                                                                                                    <span
                                                                                                        className={clsx(
                                                                                                            active ? 'text-white' : 'text-indigo-600',
                                                                                                            'absolute inset-y-0 right-0 flex items-center pr-4'
                                                                                                        )}
                                                                                                    >
                                                                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                                                    </span>
                                                                                                ) : null}
                                                                                            </>
                                                                                        )}
                                                                                    </Listbox.Option>
                                                                                ))
                                                                            )}
                                                                        </Listbox.Options>
                                                                    </Transition>
                                                                </div>
                                                            </>
                                                        )}
                                                    </Listbox>
                                                </div>

                                                <div>
                                                    <label htmlFor="reference" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Reference Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="reference"
                                                        id="reference"
                                                        value={referenceNumber}
                                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white sm:text-sm"
                                                        placeholder="Optional reference"
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="memo" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Memo
                                                    </label>
                                                    <textarea
                                                        name="memo"
                                                        id="memo"
                                                        rows={3}
                                                        value={memo}
                                                        onChange={(e) => setMemo(e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white sm:text-sm"
                                                        placeholder="Reason for debit note..."
                                                    />
                                                </div>

                                                {user?.roles?.includes('ROLE_ADMIN') && (
                                                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-white/10">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-900 dark:text-white">Admin Override</span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Force creation even if validation fails</span>
                                                        </div>
                                                        <Switch
                                                            checked={adminOverride}
                                                            onChange={setAdminOverride}
                                                            className={clsx(
                                                                adminOverride ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/10',
                                                                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
                                                            )}
                                                        >
                                                            <span
                                                                aria-hidden="true"
                                                                className={clsx(
                                                                    adminOverride ? 'translate-x-5' : 'translate-x-0',
                                                                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                                                )}
                                                            />
                                                        </Switch>
                                                    </div>
                                                )}
                                            </form>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-4 py-3 dark:bg-white/5 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="submit"
                                        form="debit-note-form"
                                        disabled={loading || !selectedPurchase}
                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                                    >
                                        {loading ? 'Creating...' : 'Create Debit Note'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10 sm:mt-0 sm:w-auto"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

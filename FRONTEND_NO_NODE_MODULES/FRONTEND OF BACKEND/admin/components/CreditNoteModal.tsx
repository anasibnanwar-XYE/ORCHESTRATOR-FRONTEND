import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { createCreditNote, type CreditNoteRequest, type JournalEntrySummary } from '../lib/accountingApi';

interface CreditNoteModalProps {
    open: boolean;
    onClose: () => void;
    invoiceId: number;
    invoiceNumber: string;
    onSuccess?: (response: JournalEntrySummary) => void;
}

export default function CreditNoteModal({
    open,
    onClose,
    invoiceId,
    invoiceNumber,
    onSuccess,
}: CreditNoteModalProps) {
    const { session, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        }
    }, [open, invoiceId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        setLoading(true);
        setError(null);

        try {
            const payload: CreditNoteRequest = {
                invoiceId,
                referenceNumber: referenceNumber || undefined,
                memo: memo || undefined,
                adminOverride,
                idempotencyKey: crypto.randomUUID(),
                entryDate: new Date().toISOString().split('T')[0],
            };

            const result = await createCreditNote(payload, session, session.companyCode);
            onSuccess?.(result);
            onClose();
        } catch (err) {
            console.error('Failed to create credit note:', err);
            setError(err instanceof Error ? err.message : 'Failed to create credit note');
        } finally {
            setLoading(false);
        }
    };

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
                    <div className="fixed inset-0 bg-zinc-900/75 transition-opacity backdrop-blur-sm" />
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
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-primary">
                                                Create Credit Note
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-secondary">
                                                    Issue a credit note for Invoice <span className="font-medium text-primary">{invoiceNumber}</span>.
                                                    This will reverse the invoice amount.
                                                </p>
                                            </div>

                                            {error && (
                                                <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
                                                    {error}
                                                </div>
                                            )}

                                            <form id="credit-note-form" onSubmit={handleSubmit} className="mt-6 space-y-4">
                                                <div>
                                                    <label htmlFor="reference" className="block text-sm font-medium text-primary">
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
                                                    <label htmlFor="memo" className="block text-sm font-medium text-primary">
                                                        Memo
                                                    </label>
                                                    <textarea
                                                        name="memo"
                                                        id="memo"
                                                        rows={3}
                                                        value={memo}
                                                        onChange={(e) => setMemo(e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white sm:text-sm"
                                                        placeholder="Reason for credit note..."
                                                    />
                                                </div>

                                                {user?.roles?.includes('ROLE_ADMIN') && (
                                                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-white/10">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-primary">Admin Override</span>
                                                            <span className="text-xs text-secondary">Force creation even if validation fails</span>
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
                                        form="credit-note-form"
                                        disabled={loading}
                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                                    >
                                        {loading ? 'Creating...' : 'Create Credit Note'}
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

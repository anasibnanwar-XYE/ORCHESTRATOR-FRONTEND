import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { getPackagingSlipByOrder, type PackagingSlipDto, type SalesOrderSummary } from '../lib/salesApi';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PackagingSlipModalProps {
  order: SalesOrderSummary | null;
  open: boolean;
  onClose: () => void;
  onReserve?: () => void;
}

export default function PackagingSlipModal({ order, open, onClose, onReserve }: PackagingSlipModalProps) {
  const { session } = useAuth();
  const [slip, setSlip] = useState<PackagingSlipDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && order && session) {
      loadSlip();
    } else {
      setSlip(null);
      setError(null);
    }
  }, [open, order, session]);

  const loadSlip = async () => {
    if (!order || !session || !order.id || order.id <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const slipData = await getPackagingSlipByOrder(order.id, session);
      setSlip(slipData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packaging slip');
      setSlip(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        />

        <div className="fixed inset-0 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            className="w-full max-w-full sm:max-w-2xl md:max-w-4xl my-auto"
          >
            <Dialog.Panel className="w-full max-h-[95vh] overflow-y-auto rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 md:p-6 shadow-xl dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-xl font-semibold text-slate-900 dark:text-white">
                  Packaging Slip
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                  Loading packaging slip...
                </div>
              ) : error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                  {!slip && order && (
                    <div className="mt-3">
                      <p className="text-xs text-rose-700 dark:text-rose-300 mb-2">
                        No packaging slip found. Would you like to create one?
                      </p>
                      {onReserve && (
                        <button
                          onClick={() => {
                            onReserve();
                            onClose();
                          }}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                        >
                          Reserve & Create Slip
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : slip ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-800/50">
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Order:</span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {slip.orderNumber || `#${slip.salesOrderId}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Slip Number:</span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {slip.slipNumber || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dealer:</span>
                      <p className="text-sm text-slate-900 dark:text-white">{slip.dealerName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Status:</span>
                      <p className="text-sm">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${slip.status === 'DISPATCHED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            slip.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                              slip.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
                                slip.status === 'PENDING_PRODUCTION' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                  slip.status === 'PENDING_STOCK' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {slip.status === 'PARTIAL' ? 'Partially Shipped' : slip.status || '—'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {slip.lines && slip.lines.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Product</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Batch</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">Ordered</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">Shipped</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">Backorder</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">Unit Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                          {slip.lines.map((line, idx) => (
                            <tr key={line.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-3 py-2">
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-white">
                                    {line.productName || line.productCode || '—'}
                                  </div>
                                  {line.productCode && line.productCode !== line.productName && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{line.productCode}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                {line.batchCode || '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-900 dark:text-white">
                                {line.orderedQuantity?.toLocaleString() || '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-900 dark:text-white">
                                {line.shippedQuantity?.toLocaleString() || '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-900 dark:text-white">
                                {line.backorderQuantity?.toLocaleString() || '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-900 dark:text-white">
                                {line.unitCost != null ? `₹${line.unitCost.toLocaleString()}` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">
                      No lines found in packaging slip
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={onClose}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No packaging slip data available
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

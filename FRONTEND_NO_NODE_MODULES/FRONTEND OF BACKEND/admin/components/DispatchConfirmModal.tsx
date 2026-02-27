import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import {
  confirmDispatch,
  confirmFactoryDispatch,
  getPackagingSlip,
  getPackagingSlipByOrder,
  type DispatchLine,
  type DispatchConfirmRequest,
  type PackagingSlipDto,
  type SalesOrderSummary,
  type FactoryDispatchRequest,
  type FactoryLineConfirmation,
} from '../lib/salesApi';
import { getInvoiceByOrderId, sendInvoiceEmail, getInvoicePdfUrl } from '../lib/accountingApi';
import { API_BASE_URL } from '../lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircle } from 'lucide-react';

interface DispatchConfirmModalProps {
  order?: SalesOrderSummary | null;
  slip?: PackagingSlipDto | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  useFactoryFlow?: boolean;
}

interface DispatchLineForm extends DispatchLine {
  productName?: string;
  productCode?: string;
  orderedQuantity?: number;
  batchCode?: string;
}

const inputClass =
  'w-full rounded-md border border-border bg-surface px-2 py-1.5 text-right text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50';

export default function DispatchConfirmModal({ order, slip: propSlip, open, onClose, onSuccess, useFactoryFlow = false }: DispatchConfirmModalProps) {
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ invoiceId: number; invoiceNumber?: string; emailSent: boolean } | null>(null);

  const [slip, setSlip] = useState<PackagingSlipDto | null>(null);
  const [dispatchLines, setDispatchLines] = useState<DispatchLineForm[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [adminOverrideCreditLimit, setAdminOverrideCreditLimit] = useState(false);

  useEffect(() => {
    if (open) {
      if (propSlip && session && propSlip.id) {
        loadSlipById(propSlip.id);
      } else if (propSlip) {
        setSlip(propSlip);
        initLines(propSlip);
      } else if (order && session) {
        loadPackagingSlip();
      }
    } else {
      setSlip(null);
      setDispatchLines([]);
      setError(null);
      setSuccess(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order, propSlip, session]);

  const initLines = (slipData: PackagingSlipDto) => {
    if (slipData.lines && slipData.lines.length > 0) {
      const lines: DispatchLineForm[] = slipData.lines.map((line) => ({
        lineId: line.id,
        batchId: undefined,
        shipQty: line.shippedQuantity || line.orderedQuantity || 0,
        priceOverride: undefined,
        discount: undefined,
        taxRate: undefined,
        taxInclusive: undefined,
        productName: line.productName,
        productCode: line.productCode,
        orderedQuantity: line.orderedQuantity,
        batchCode: line.batchCode,
      }));
      setDispatchLines(lines);
    }
  };

  const loadPackagingSlip = async () => {
    if (!order || !session || !order.id || order.id <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const slipData = await getPackagingSlipByOrder(order.id, session);
      setSlip(slipData);
      initLines(slipData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packaging slip.');
      setSlip(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSlipById = async (slipId: number) => {
    if (!session || !slipId) return;
    setLoading(true);
    setError(null);
    try {
      const slipData = await getPackagingSlip(slipId, session);
      setSlip(slipData);
      initLines(slipData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packaging slip.');
      setSlip(null);
    } finally {
      setLoading(false);
    }
  };

  const updateDispatchLine = (index: number, updates: Partial<DispatchLineForm>) => {
    setDispatchLines((prev) =>
      prev.map((line, idx) =>
        idx === index ? { ...line, ...updates } : line
      )
    );
  };

  const handleSubmit = async () => {
    if (!session || (!order && !slip)) return;
    if (!slip) return;

    const hasShippedQty = dispatchLines.some((line) => line.shipQty > 0);
    if (!hasShippedQty) {
      setError('At least one line must have a shipped quantity greater than 0');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const linesToDispatch: DispatchLine[] = dispatchLines
        .filter((line) => line.shipQty > 0)
        .map((line) => ({
          lineId: line.lineId,
          batchId: line.batchId,
          shipQty: line.shipQty,
          priceOverride: line.priceOverride,
          discount: line.discount,
          taxRate: line.taxRate,
          taxInclusive: line.taxInclusive,
        }));

      if (useFactoryFlow) {
        const factoryPayload: FactoryDispatchRequest = {
          packagingSlipId: slip.id,
          lines: dispatchLines
            .filter((line) => line.shipQty > 0)
            .map((line): FactoryLineConfirmation => ({
              lineId: line.lineId || 0,
              shippedQuantity: line.shipQty,
            })),
          confirmedBy: session.displayName || 'Factory User',
        };

        await confirmFactoryDispatch(factoryPayload, session);

        setSuccess({
          invoiceId: 0,
          invoiceNumber: undefined,
          emailSent: false,
        });
      } else {
        const dispatchPayload: DispatchConfirmRequest = {
          packingSlipId: slip.id,
          orderId: order?.id || slip.salesOrderId,
          lines: linesToDispatch,
          adminOverrideCreditLimit: adminOverrideCreditLimit || undefined,
        };

        const dispatchResult = await confirmDispatch(dispatchPayload, session);

        let invoice = null;
        if (dispatchResult.finalInvoiceId) {
          try {
            const orderId = order?.id || slip.salesOrderId;
            if (orderId) {
              invoice = await getInvoiceByOrderId(orderId, session, session.companyCode);
            }
          } catch {
            // Invoice fetch failed — non-critical
          }
        }

        let emailSent = false;
        if (sendEmail && invoice) {
          try {
            await sendInvoiceEmail(invoice.id, session, session.companyCode);
            emailSent = true;
          } catch {
            // Email send failed — non-critical
          }
        }

        setSuccess({
          invoiceId: invoice?.id || 0,
          invoiceNumber: invoice?.invoiceNumber,
          emailSent,
        });
      }

      setTimeout(() => {
        onSuccess();
        onClose();
        setSlip(null);
        setDispatchLines([]);
        setSendEmail(true);
        setAdminOverrideCreditLimit(false);
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch order');
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!success || !success.invoiceId) return;
    const pdfUrl = getInvoicePdfUrl(success.invoiceId, API_BASE_URL);
    window.open(pdfUrl, '_blank');
  };

  const handleClose = () => {
    if (submitting) return;
    setSlip(null);
    setDispatchLines([]);
    setSendEmail(true);
    setAdminOverrideCreditLimit(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
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
            <Dialog.Panel className="w-full max-h-[95vh] overflow-y-auto rounded-xl sm:rounded-2xl bg-surface p-3 sm:p-4 md:p-6 shadow-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Dialog.Title className="text-xl font-semibold text-primary">
                    Dispatch Confirmation
                  </Dialog.Title>
                  <p className="mt-1 text-xs text-secondary">
                    Issue goods from inventory and generate invoice. Accounting journals are posted automatically.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-2 text-tertiary hover:text-primary hover:bg-surface-highlight min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {success ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-transparent bg-status-success-bg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-status-success-text flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-status-success-text">
                          Dispatch Successful
                        </h3>
                        <p className="mt-1 text-sm text-status-success-text">
                          Order {order?.orderNumber || slip?.orderNumber || `#${slip?.salesOrderId}`} has been dispatched.
                        </p>
                        {success.invoiceNumber && (
                          <p className="mt-1 text-sm text-status-success-text">
                            Invoice {success.invoiceNumber} has been generated.
                          </p>
                        )}
                        {success.emailSent && (
                          <p className="mt-1 text-sm text-status-success-text">
                            Invoice email has been sent to the dealer.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    {success.invoiceId > 0 && (
                      <button
                        onClick={handleDownloadPdf}
                        className="rounded-lg bg-action-bg px-4 py-2 text-sm font-medium text-action-text hover:opacity-90 min-h-[44px]"
                      >
                        Download Invoice PDF
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary hover:bg-surface-highlight min-h-[44px]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : loading ? (
                <div className="py-8 text-center text-secondary">
                  Loading packaging slip...
                </div>
              ) : !slip ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-transparent bg-status-error-bg p-4 text-sm text-status-error-text">
                    {error || 'No packaging slip found. Please reserve the order first to create a packaging slip.'}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleClose}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary hover:bg-surface-highlight min-h-[44px]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Slip summary */}
                  <div className="rounded-lg border border-border bg-surface-highlight p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-secondary">Order:</span>{' '}
                        <span className="text-primary">{order?.orderNumber || slip.orderNumber || `#${slip.salesOrderId}`}</span>
                      </div>
                      <div>
                        <span className="font-medium text-secondary">Slip:</span>{' '}
                        <span className="text-primary">{slip.slipNumber || `#${slip.id}`}</span>
                      </div>
                      {(order?.dealerName || slip.dealerName) && (
                        <div>
                          <span className="font-medium text-secondary">Dealer:</span>{' '}
                          <span className="text-primary">{order?.dealerName || slip.dealerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Line items — responsive: cards on mobile, table on desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2 text-left font-medium text-secondary">Product</th>
                          <th className="px-3 py-2 text-left font-medium text-secondary">Batch</th>
                          <th className="px-3 py-2 text-right font-medium text-secondary">Ordered</th>
                          <th className="px-3 py-2 text-right font-medium text-secondary">Ship Qty *</th>
                          {!useFactoryFlow && (
                            <>
                              <th className="px-3 py-2 text-right font-medium text-secondary">Price</th>
                              <th className="px-3 py-2 text-right font-medium text-secondary">Tax %</th>
                              <th className="px-3 py-2 text-right font-medium text-secondary">Discount</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {dispatchLines.map((line, idx) => (
                          <tr key={line.lineId || idx} className="hover:bg-surface-highlight transition-colors">
                            <td className="px-3 py-2">
                              <div className="font-medium text-primary">
                                {line.productName || line.productCode || '—'}
                              </div>
                              {line.productCode && line.productCode !== line.productName && (
                                <div className="text-xs text-tertiary">{line.productCode}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-secondary">
                              {line.batchCode || '—'}
                            </td>
                            <td className="px-3 py-2 text-right text-primary tabular-nums">
                              {line.orderedQuantity?.toLocaleString() || '—'}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.shipQty || ''}
                                onChange={(e) => updateDispatchLine(idx, { shipQty: Number(e.target.value) || 0 })}
                                className={inputClass}
                                disabled={submitting}
                                required
                              />
                            </td>
                            {!useFactoryFlow && (
                              <>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={line.priceOverride || ''}
                                    onChange={(e) => updateDispatchLine(idx, { priceOverride: e.target.value ? Number(e.target.value) : undefined })}
                                    placeholder="Auto"
                                    className={inputClass}
                                    disabled={submitting}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={line.taxRate || ''}
                                    onChange={(e) => updateDispatchLine(idx, { taxRate: e.target.value ? Number(e.target.value) : undefined })}
                                    placeholder="Auto"
                                    className={inputClass}
                                    disabled={submitting}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={line.discount || ''}
                                    onChange={(e) => updateDispatchLine(idx, { discount: e.target.value ? Number(e.target.value) : undefined })}
                                    placeholder="0"
                                    className={inputClass}
                                    disabled={submitting}
                                  />
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: card layout */}
                  <div className="sm:hidden space-y-3">
                    {dispatchLines.map((line, idx) => (
                      <div key={line.lineId || idx} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-primary text-sm">
                              {line.productName || line.productCode || '—'}
                            </div>
                            {line.batchCode && (
                              <div className="text-xs text-tertiary">Batch: {line.batchCode}</div>
                            )}
                          </div>
                          <span className="text-xs text-secondary tabular-nums">
                            Ordered: {line.orderedQuantity?.toLocaleString() || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-tertiary">Ship Qty *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.shipQty || ''}
                              onChange={(e) => updateDispatchLine(idx, { shipQty: Number(e.target.value) || 0 })}
                              className={inputClass}
                              disabled={submitting}
                              required
                            />
                          </div>
                          {!useFactoryFlow && (
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-tertiary">Price</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.priceOverride || ''}
                                onChange={(e) => updateDispatchLine(idx, { priceOverride: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder="Auto"
                                className={inputClass}
                                disabled={submitting}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {!useFactoryFlow && (
                      <label className="flex items-center gap-3 rounded-lg border border-border bg-surface-highlight p-3 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border accent-action-bg"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                          disabled={submitting}
                        />
                        <span className="text-sm font-medium text-primary">
                          Send Invoice Email to Dealer
                        </span>
                      </label>
                    )}

                    {!useFactoryFlow && (
                      <label className="flex items-center gap-3 rounded-lg border border-border bg-surface-highlight p-3 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border accent-action-bg"
                          checked={adminOverrideCreditLimit}
                          onChange={(e) => setAdminOverrideCreditLimit(e.target.checked)}
                          disabled={submitting}
                        />
                        <span className="text-sm font-medium text-primary">
                          Admin Override Credit Limit
                        </span>
                      </label>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-lg border border-transparent bg-status-error-bg p-3 text-sm text-status-error-text">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                    <button
                      onClick={handleClose}
                      disabled={submitting}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary hover:bg-surface-highlight disabled:opacity-50 min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || dispatchLines.length === 0 || !dispatchLines.some((l) => l.shipQty > 0)}
                      className="rounded-lg bg-action-bg px-4 py-2 text-sm font-medium text-action-text hover:opacity-90 disabled:opacity-50 min-h-[44px]"
                    >
                      {submitting ? 'Dispatching...' : 'Confirm Dispatch'}
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

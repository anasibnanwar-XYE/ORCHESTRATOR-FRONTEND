import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listInvoices, resolveSalesJournalMap, type InvoiceDto, type JournalEntrySummary } from '../../lib/accountingApi';
import CreditNoteModal from '../../components/CreditNoteModal';
import { X, Building2 } from 'lucide-react';
import { formatAmount } from '../../lib/formatUtils';

const formatMoney = formatAmount;

export default function InvoicesPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [journalByOrder, setJournalByOrder] = useState<Record<number, JournalEntrySummary | null>>({});
  const [creditNoteInvoice, setCreditNoteInvoice] = useState<{ id: number; number: string } | null>(null);

  const dealerId = searchParams.get('dealerId');
  const dealerIdNum = dealerId ? Number(dealerId) : undefined;

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const filters: { dealerId?: number } = {};
      if (dealerIdNum) {
        filters.dealerId = dealerIdNum;
      }
      const list = await listInvoices(filters, session, session.companyCode);
      setInvoices(list);
      const orderIds = list.map((inv) => inv.salesOrderId).filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
      if (orderIds.length > 0) {
        const map = await resolveSalesJournalMap(orderIds, session, session.companyCode);
        setJournalByOrder(map);
      } else {
        setJournalByOrder({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.companyCode, dealerIdNum]);

  const clearDealerFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('dealerId');
    navigate({ search: params.toString() }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {dealerId && invoices.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-500/30 dark:bg-violet-500/10">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <div>
              <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
                Viewing invoices for: {invoices[0].dealerName || `Dealer #${dealerIdNum}`}
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400">
                Showing {invoices.length} AR invoice{invoices.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearDealerFilter}
            className="rounded-full p-1.5 text-violet-600 hover:bg-violet-200 dark:text-violet-400 dark:hover:bg-violet-400/20"
            title="Clear filter"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {dealerId && invoices.length === 0 && !loading && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                No invoices found for dealer
              </p>
              <button
                type="button"
                onClick={clearDealerFilter}
                className="text-xs text-amber-700 underline dark:text-amber-300"
              >
                Show all invoices
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {dealerId ? 'Dealer Invoices' : 'Invoices'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {dealerId ? 'Accounts Receivable for selected dealer' : 'Accounts Receivable and credit notes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-xs text-slate-500">Refreshing.</span>}
          <button
            type="button"
            onClick={load}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-secondary hover:bg-surface-highlight"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      <div id="invoices-list" className="rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-7 gap-2 border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-secondary">
          <div>Invoice</div>
          <div>Dealer</div>
          <div>Issue date</div>
          <div>Due date</div>
          <div className="text-right">Total</div>
          <div>Status</div>
          <div>Journal</div>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-zinc-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-4 text-sm text-zinc-500">{dealerId ? 'No invoices found for this dealer.' : 'No invoices have been issued yet.'}</div>
        ) : (
          <div>
            {invoices.map((inv) => {
              const orderId = inv.salesOrderId;
              const journal = orderId != null ? journalByOrder[orderId] : undefined;
              const journalStatus =
                orderId == null
                  ? 'Unknown'
                  : journal
                    ? 'Posted'
                    : 'Pending';
              const journalClass =
                journalStatus === 'Posted'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                  : journalStatus === 'Pending'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-200';
              return (
                <div key={inv.id} className="border-b border-border px-3 py-2 text-sm last:border-b-0">
                  <div
                    className="grid w-full grid-cols-7 items-center gap-2 text-left hover:bg-surface-highlight hover:bg-surface-highlight/50 cursor-pointer"
                    onClick={() => setExpanded((m) => ({ ...m, [inv.id]: !m[inv.id] }))}
                  >
                    <div className="font-medium text-primary">{inv.invoiceNumber ?? `INV-${inv.id}`}</div>
                    <div className="truncate text-secondary">{inv.dealerName ?? '-'}</div>
                    <div className="text-secondary">{inv.invoiceDate ?? '-'}</div>
                    <div className="text-secondary">{inv.dueDate ?? '-'}</div>
                    <div className="text-right text-primary">{formatMoney(inv.totalAmount)}</div>
                    <div>
                      <span className="rounded-full bg-surface-highlight px-2 py-1 text-xs text-secondary">
                        {inv.status ?? 'ISSUED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${journalClass}`}>{journalStatus}</span>
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 py-0.5 text-[11px] text-secondary hover:bg-surface-highlight"
                        onClick={(e) => {
                          e.stopPropagation();
                          const reference =
                            journal?.referenceNumber || (orderId != null ? `SALE-${orderId}` : inv.invoiceNumber ?? '');
                          if (!reference) return;
                          navigate(`/accounting/journal?q=${encodeURIComponent(reference)}`);
                        }}
                        disabled={!orderId}
                      >
                        View journal
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 py-0.5 text-[11px] text-secondary hover:bg-surface-highlight"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreditNoteInvoice({ id: inv.id, number: inv.invoiceNumber ?? `INV-${inv.id}` });
                        }}
                      >
                        Credit Note
                      </button>
                    </div>
                  </div>
                  {expanded[inv.id] && inv.lines && inv.lines.length > 0 && (
                    <div className="mt-2 overflow-x-auto rounded-lg bg-surface-highlight px-3 py-2 text-xs text-secondary">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="text-left text-[11px] uppercase tracking-wide text-secondary">
                            <th className="px-2 py-1">Product</th>
                            <th className="px-2 py-1">Description</th>
                            <th className="px-2 py-1 text-right">Qty</th>
                            <th className="px-2 py-1 text-right">Unit</th>
                            <th className="px-2 py-1 text-right">Tax %</th>
                            <th className="px-2 py-1 text-right">Line total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.lines.map((line) => (
                            <tr key={line.id} className="border-t border-border last:border-b-0">
                              <td className="px-2 py-1 font-mono text-[11px]">{line.productCode}</td>
                              <td className="px-2 py-1">{line.description}</td>
                              <td className="px-2 py-1 text-right">{line.quantity ?? ''}</td>
                              <td className="px-2 py-1 text-right">{formatMoney(line.unitPrice)}</td>
                              <td className="px-2 py-1 text-right">{line.taxRate ?? ''}</td>
                              <td className="px-2 py-1 text-right">{formatMoney(line.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {creditNoteInvoice && (
        <CreditNoteModal
          open={!!creditNoteInvoice}
          onClose={() => setCreditNoteInvoice(null)}
          invoiceId={creditNoteInvoice.id}
          invoiceNumber={creditNoteInvoice.number}
          onSuccess={() => {
            load();
          }}
        />
      )}
    </div>
  );
}


import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, FileText, Mail, X, Download } from 'lucide-react';
import {
  listInvoices,
  getInvoice,
  sendInvoiceEmail,
  getInvoicePdfUrl,
  type InvoiceDto,
  type InvoiceLineDto,
} from '../../lib/accountingApi';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api';
import { formatAmount, formatDate } from '../../lib/formatUtils';

type StatusFilter = '' | 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

const formatCurrency = formatAmount;

const fmtDate = formatDate;

const statusClasses = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PAID':
      return 'bg-status-success-bg text-status-success-text';
    case 'ISSUED':
      return 'bg-brand-500/10 text-brand-400';
    case 'OVERDUE':
      return 'bg-status-error-bg text-status-error-text';
    case 'CANCELLED':
      return 'bg-surface-highlight text-tertiary';
    default:
      return 'bg-surface-highlight text-secondary';
  }
};

export default function SalesInvoicesPage() {
  const { session } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [emailLoadingId, setEmailLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    setError(null);
    const filters: { status?: string; from?: string; to?: string } = {};
    if (statusFilter) filters.status = statusFilter;
    if (dateFrom) filters.from = dateFrom;
    if (dateTo) filters.to = dateTo;
    listInvoices(Object.keys(filters).length ? filters : undefined, session)
      .then((data) => { if (active) setInvoices(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Failed to load invoices'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session, statusFilter, dateFrom, dateTo]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.dealerName?.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  const openDetail = useCallback(async (invoice: InvoiceDto) => {
    setSelectedInvoice(invoice);
    if (!session) return;
    setDetailLoading(true);
    try {
      const full = await getInvoice(invoice.id, session);
      setSelectedInvoice(full);
    } catch {
      // keep the summary version if detail fetch fails
    } finally {
      setDetailLoading(false);
    }
  }, [session]);

  const closeDetail = useCallback(() => setSelectedInvoice(null), []);

  const handleViewPdf = useCallback((id: number) => {
    window.open(getInvoicePdfUrl(id, API_BASE_URL), '_blank');
  }, []);

  const handleSendEmail = useCallback(async (id: number) => {
    if (!session) return;
    setEmailLoadingId(id);
    setToast(null);
    try {
      await sendInvoiceEmail(id, session);
      setToast({ type: 'success', message: 'Invoice email sent successfully' });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to send email' });
    } finally {
      setEmailLoadingId(null);
    }
  }, [session]);

  if (!session) {
    return (
      <div className="rounded-2xl border border-transparent bg-status-warning-bg px-6 py-4 text-sm text-status-warning-text">
        Sign in to view invoices.
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2">Invoice management</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary">Invoices</h1>
          <p className="text-sm text-secondary mt-1">
            View, download, and email invoices to dealers.
          </p>
        </div>

        {/* Error / Success Banners */}
        {error && (
          <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
            {error}
          </div>
        )}
        {toast && (
          <div className={`rounded-xl border border-transparent px-4 py-3 text-sm ${toast.type === 'success' ? 'bg-status-success-bg text-status-success-text' : 'bg-status-error-bg text-status-error-text'}`}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
          <input
            type="text"
            placeholder="Search by invoice # or dealer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-lg border border-border bg-surface px-3 pl-10 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
          />
        </div>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-secondary">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-surface-highlight p-6">
            <FileText className="mx-auto h-10 w-10 text-tertiary mb-3" />
            <p className="text-sm text-secondary">
              {invoices.length === 0 ? 'No invoices yet.' : 'No invoices match your search or filters.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="grid gap-4 lg:hidden">
              {filteredInvoices.map((inv) => (
                <article
                  key={inv.id}
                  className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => openDetail(inv)}
                        className="font-semibold text-primary hover:underline text-left"
                      >
                        {inv.invoiceNumber}
                      </button>
                      <p className="text-sm text-secondary truncate">{inv.dealerName || '—'}</p>
                    </div>
                    <span className={`inline-flex shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <span className="text-xs text-tertiary uppercase tracking-wider">Date</span>
                      <p className="text-secondary">{fmtDate(inv.invoiceDate)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-tertiary uppercase tracking-wider">Amount</span>
                      <p className="text-primary font-medium">{formatCurrency(inv.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => handleViewPdf(inv.id)}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-border bg-surface text-primary text-sm font-medium hover:bg-surface-highlight transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </button>
                    <button
                      onClick={() => handleSendEmail(inv.id)}
                      disabled={emailLoadingId === inv.id}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-border bg-surface text-primary text-sm font-medium hover:bg-surface-highlight transition-colors disabled:opacity-50"
                    >
                      <Mail className="h-4 w-4" />
                      {emailLoadingId === inv.id ? 'Sending...' : 'Email'}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-highlight">
                      <th className="px-4 py-3 text-left font-semibold text-primary">Invoice #</th>
                      <th className="px-4 py-3 text-left font-semibold text-primary">Dealer</th>
                      <th className="px-4 py-3 text-left font-semibold text-primary">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-primary">Due date</th>
                      <th className="px-4 py-3 text-right font-semibold text-primary">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-primary">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-surface-highlight transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openDetail(inv)}
                            className="font-medium text-primary hover:underline cursor-pointer text-left"
                          >
                            {inv.invoiceNumber}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-secondary">{inv.dealerName || '—'}</td>
                        <td className="px-4 py-3 text-secondary">{fmtDate(inv.invoiceDate)}</td>
                        <td className="px-4 py-3 text-secondary">{fmtDate(inv.dueDate)}</td>
                        <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(inv.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleViewPdf(inv.id)}
                              className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-highlight transition-colors"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleSendEmail(inv.id)}
                              disabled={emailLoadingId === inv.id}
                              className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-highlight transition-colors disabled:opacity-50"
                              title="Send email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={closeDetail}
        detailLoading={detailLoading}
        onViewPdf={handleViewPdf}
        onSendEmail={handleSendEmail}
        emailLoading={emailLoadingId}
      />
    </div>
  );
}

/* ── Invoice Detail Modal ─────────────────────────────── */

function InvoiceDetailModal({
  invoice,
  open,
  onClose,
  detailLoading,
  onViewPdf,
  onSendEmail,
  emailLoading,
}: {
  invoice: InvoiceDto | null;
  open: boolean;
  onClose: () => void;
  detailLoading: boolean;
  onViewPdf: (id: number) => void;
  onSendEmail: (id: number) => void;
  emailLoading: number | null;
}) {
  if (!open || !invoice) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-surface shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-primary">Invoice Details</h2>
            <p className="text-sm text-secondary mt-1">{invoice.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-secondary hover:text-primary transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {detailLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-secondary">Loading details...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Grid */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="Dealer" value={invoice.dealerName || '—'} />
                  <DetailRow label="Status">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </DetailRow>
                  <DetailRow label="Invoice date" value={fmtDate(invoice.invoiceDate)} />
                  <DetailRow label="Due date" value={fmtDate(invoice.dueDate)} />
                  <DetailRow label="Total amount" value={formatCurrency(invoice.totalAmount)} bold />
                  <DetailRow label="Sales order" value={invoice.salesOrderId ? `#${invoice.salesOrderId}` : '—'} />
                </div>
              </div>

              {/* Line Items */}
              {invoice.lines && invoice.lines.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Line items</p>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-highlight border-b border-border">
                          <th className="px-4 py-2 text-left text-xs font-medium text-secondary">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-secondary">Description</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-secondary">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-secondary">Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-secondary">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoice.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-4 py-2 font-mono text-xs text-primary">{line.productCode}</td>
                            <td className="px-4 py-2 text-secondary">{line.description}</td>
                            <td className="px-4 py-2 text-right text-primary">{line.quantity}</td>
                            <td className="px-4 py-2 text-right text-primary">{formatCurrency(line.unitPrice)}</td>
                            <td className="px-4 py-2 text-right font-medium text-primary">{formatCurrency(line.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-surface-highlight text-primary font-medium hover:opacity-80 transition-opacity text-sm"
          >
            Close
          </button>
          <button
            onClick={() => onViewPdf(invoice.id)}
            className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
          >
            <Download className="h-4 w-4" />
            View PDF
          </button>
          <button
            onClick={() => onSendEmail(invoice.id)}
            disabled={emailLoading === invoice.id}
            className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
          >
            <Mail className="h-4 w-4" />
            {emailLoading === invoice.id ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Detail Row helper ────────────────────────────────── */

function DetailRow({ label, value, bold, children }: { label: string; value?: string; bold?: boolean; children?: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-tertiary uppercase tracking-wider">{label}</span>
      {children ?? (
        <p className={`text-sm ${bold ? 'font-semibold' : 'font-medium'} text-primary mt-0.5`}>{value}</p>
      )}
    </div>
  );
}

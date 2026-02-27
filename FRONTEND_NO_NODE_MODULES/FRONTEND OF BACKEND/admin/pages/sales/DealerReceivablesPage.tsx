import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDealerLedgerView,
  getDealerInvoicesView,
  getDealerAgingView,
  type DealerLedgerView,
  type DealerLedgerEntry,
  type DealerInvoicesView,
  type DealerInvoiceSummary,
  type DealerAgingView,
  type DealerAgingInvoice,
} from '../../lib/accountingApi';
import { toggleDealerHold } from '../../lib/dealerApi';
import { formatCurrency, formatDate } from '../../lib/formatUtils';

type Tab = 'ledger' | 'invoices' | 'aging';

const fmtDate = formatDate;

const invoiceStatusClasses = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'bg-status-success-bg text-status-success-text';
    case 'OVERDUE':
      return 'bg-status-error-bg text-status-error-text';
    case 'ISSUED':
      return 'bg-brand-500/10 text-brand-400';
    default:
      return 'bg-surface-highlight text-secondary';
  }
};

export default function DealerReceivablesPage() {
  const { dealerId: rawDealerId } = useParams<{ dealerId: string }>();
  const dealerId = Number(rawDealerId);
  const navigate = useNavigate();
  const { session } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('ledger');

  // Lazy-loaded data per tab
  const [ledger, setLedger] = useState<DealerLedgerView | null>(null);
  const [invoices, setInvoices] = useState<DealerInvoicesView | null>(null);
  const [aging, setAging] = useState<DealerAgingView | null>(null);

  const [ledgerLoaded, setLedgerLoaded] = useState(false);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [agingLoaded, setAgingLoaded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dunning hold state
  const [holdConfirm, setHoldConfirm] = useState(false);
  const [holdSubmitting, setHoldSubmitting] = useState(false);
  const [holdMessage, setHoldMessage] = useState('');

  const dealerName = ledger?.dealerName ?? invoices?.dealerName ?? aging?.dealerName ?? `Dealer #${dealerId}`;

  const loadTab = useCallback(async (tab: Tab) => {
    if (Number.isNaN(dealerId)) return;
    setLoading(true);
    setError('');
    try {
      if (tab === 'ledger' && !ledgerLoaded) {
        const data = await getDealerLedgerView(dealerId, session);
        setLedger(data);
        setLedgerLoaded(true);
      } else if (tab === 'invoices' && !invoicesLoaded) {
        const data = await getDealerInvoicesView(dealerId, session);
        setInvoices(data);
        setInvoicesLoaded(true);
      } else if (tab === 'aging' && !agingLoaded) {
        const data = await getDealerAgingView(dealerId, session);
        setAging(data);
        setAgingLoaded(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [dealerId, session, ledgerLoaded, invoicesLoaded, agingLoaded]);

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, loadTab]);

  const handleHold = async () => {
    setHoldSubmitting(true);
    setHoldMessage('');
    try {
      const res = await toggleDealerHold(dealerId, true, undefined, session);
      setHoldMessage(res.message);
      setHoldConfirm(false);
    } catch (err: unknown) {
      setHoldMessage(err instanceof Error ? err.message : 'Hold action failed');
    } finally {
      setHoldSubmitting(false);
    }
  };

  if (Number.isNaN(dealerId)) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <p className="text-secondary">Invalid dealer ID.</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ledger', label: 'Ledger' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'aging', label: 'Aging' },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-xl font-semibold text-primary">
            {dealerName} — Receivables
          </h1>
        </div>
        <button
          onClick={() => setHoldConfirm(true)}
          className="self-start rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--status-error-bg)',
            color: 'var(--status-error-text)',
          }}
        >
          Place on Hold
        </button>
      </div>

      {holdMessage && (
        <div className="rounded-lg border border-border bg-surface-highlight px-4 py-3 text-sm text-secondary">
          {holdMessage}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? 'border-brand-400 text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-secondary text-sm py-8 justify-center">
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {/* Tab content */}
      {!loading && activeTab === 'ledger' && ledgerLoaded && (
        <LedgerTab ledger={ledger} />
      )}
      {!loading && activeTab === 'invoices' && invoicesLoaded && (
        <InvoicesTab invoices={invoices} />
      )}
      {!loading && activeTab === 'aging' && agingLoaded && (
        <AgingTab aging={aging} />
      )}

      {/* Hold confirmation modal */}
      {holdConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-primary">Confirm Dunning Hold</h3>
            <p className="text-sm text-secondary">
              This will place <strong>{dealerName}</strong> on hold, blocking new sales orders. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setHoldConfirm(false)}
                disabled={holdSubmitting}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleHold}
                disabled={holdSubmitting}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--status-error-bg)',
                  color: 'var(--status-error-text)',
                }}
              >
                {holdSubmitting ? 'Processing…' : 'Confirm Hold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Ledger Tab ---------- */

function LedgerTab({ ledger }: { ledger: DealerLedgerView | null }) {
  if (!ledger || ledger.entries.length === 0) {
    return <EmptyState message="No ledger entries found for this dealer." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <Stat label="Current Balance" value={formatCurrency(ledger.currentBalance)} />
        <Stat label="Entries" value={String(ledger.entries.length)} />
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-highlight text-left text-xs font-semibold text-secondary uppercase tracking-wider">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Memo</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Credit</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ledger.entries.map((e: DealerLedgerEntry, i: number) => (
              <tr key={i} className="hover:bg-surface-highlight/50 transition-colors">
                <td className="px-4 py-3 text-primary whitespace-nowrap">{fmtDate(e.date)}</td>
                <td className="px-4 py-3 text-primary">{e.reference ?? '—'}</td>
                <td className="px-4 py-3 text-secondary">{e.memo ?? '—'}</td>
                <td className="px-4 py-3 text-right text-primary tabular-nums">{e.debit != null ? formatCurrency(e.debit) : ''}</td>
                <td className="px-4 py-3 text-right text-primary tabular-nums">{e.credit != null ? formatCurrency(e.credit) : ''}</td>
                <td className="px-4 py-3 text-right font-medium text-primary tabular-nums">{formatCurrency(e.runningBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {ledger.entries.map((e: DealerLedgerEntry, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">{fmtDate(e.date)}</span>
              <span className="font-medium text-primary tabular-nums">{formatCurrency(e.runningBalance)}</span>
            </div>
            {e.reference && <p className="text-sm text-primary">{e.reference}</p>}
            {e.memo && <p className="text-xs text-secondary">{e.memo}</p>}
            <div className="flex gap-4 text-xs text-secondary">
              {e.debit != null && <span>Debit: {formatCurrency(e.debit)}</span>}
              {e.credit != null && <span>Credit: {formatCurrency(e.credit)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Invoices Tab ---------- */

function InvoicesTab({ invoices }: { invoices: DealerInvoicesView | null }) {
  if (!invoices || invoices.invoices.length === 0) {
    return <EmptyState message="No invoices found for this dealer." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6">
        <Stat label="Total Outstanding" value={formatCurrency(invoices.totalOutstanding)} />
        <Stat label="Net Outstanding" value={formatCurrency(invoices.netOutstanding)} />
        <Stat label="Advance Credit" value={formatCurrency(invoices.advanceCredit)} />
        <Stat label="Invoices" value={String(invoices.invoiceCount ?? invoices.invoices.length)} />
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-highlight text-left text-xs font-semibold text-secondary uppercase tracking-wider">
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Issue Date</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.invoices.map((inv: DealerInvoiceSummary) => (
              <tr key={inv.id} className="hover:bg-surface-highlight/50 transition-colors">
                <td className="px-4 py-3 font-medium text-primary">{inv.invoiceNumber ?? `#${inv.id}`}</td>
                <td className="px-4 py-3 text-primary whitespace-nowrap">{fmtDate(inv.issueDate)}</td>
                <td className="px-4 py-3 text-primary whitespace-nowrap">{fmtDate(inv.dueDate)}</td>
                <td className="px-4 py-3 text-right text-primary tabular-nums">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-4 py-3 text-right text-primary tabular-nums">{formatCurrency(inv.outstandingAmount)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${invoiceStatusClasses(inv.status)}`}>
                    {inv.status ?? 'N/A'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {invoices.invoices.map((inv: DealerInvoiceSummary) => (
          <div key={inv.id} className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-primary">{inv.invoiceNumber ?? `#${inv.id}`}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${invoiceStatusClasses(inv.status)}`}>
                {inv.status ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm text-secondary">
              <span>Due: {fmtDate(inv.dueDate)}</span>
              <span className="tabular-nums font-medium text-primary">{formatCurrency(inv.outstandingAmount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Aging Tab ---------- */

function AgingTab({ aging }: { aging: DealerAgingView | null }) {
  if (!aging) {
    return <EmptyState message="No aging data available for this dealer." />;
  }

  const buckets = aging.agingBuckets ?? {};
  const bucketKeys = Object.keys(buckets).sort((a, b) => {
    // Sort by numeric prefix: current, 1-30, 31-60, 61-90, 90+
    const numA = parseInt(a.replace(/[^0-9]/g, '') || '0', 10);
    const numB = parseInt(b.replace(/[^0-9]/g, '') || '0', 10);
    return numA - numB;
  });

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-6">
        <Stat label="Credit Limit" value={formatCurrency(aging.creditLimit)} />
        <Stat label="Total Outstanding" value={formatCurrency(aging.totalOutstanding)} />
        <Stat label="Available Credit" value={formatCurrency(aging.availableCredit)} />
      </div>

      {/* Aging buckets */}
      {bucketKeys.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {bucketKeys.map((bucket) => (
            <div key={bucket} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-1">{bucket}</p>
              <p className="text-lg font-semibold text-primary tabular-nums">{formatCurrency(buckets[bucket])}</p>
            </div>
          ))}
        </div>
      )}

      {/* Overdue invoices */}
      {(aging.overdueInvoices?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-primary">Overdue Invoices</h3>
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-highlight text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Days Overdue</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {aging.overdueInvoices!.map((inv: DealerAgingInvoice, i: number) => (
                  <tr key={i} className="hover:bg-surface-highlight/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{inv.invoiceNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-primary whitespace-nowrap">{fmtDate(inv.issueDate)}</td>
                    <td className="px-4 py-3 text-primary whitespace-nowrap">{fmtDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-right text-status-error-text font-medium tabular-nums">{inv.daysOverdue ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-primary tabular-nums">{formatCurrency(inv.outstandingAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {aging.overdueInvoices!.map((inv: DealerAgingInvoice, i: number) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-primary">{inv.invoiceNumber ?? '—'}</span>
                  <span className="text-xs text-status-error-text font-medium">{inv.daysOverdue} days overdue</span>
                </div>
                <div className="flex justify-between text-sm text-secondary">
                  <span>Due: {fmtDate(inv.dueDate)}</span>
                  <span className="tabular-nums font-medium text-primary">{formatCurrency(inv.outstandingAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(aging.overdueInvoices?.length ?? 0) === 0 && bucketKeys.length === 0 && (
        <EmptyState message="No aging data available." />
      )}
    </div>
  );
}

/* ---------- Shared helpers ---------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-secondary font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold text-primary tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-secondary text-sm">{message}</p>
    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { DealerResponse } from '../../../lib/client/models/DealerResponse';
import type { AuthSession } from '../../../types/auth';
import {
  getDealerLedgerView,
  getDealerInvoicesView,
  getDealerAgingView,
} from '../../../lib/accountingApi';
import type {
  DealerLedgerView,
  DealerLedgerEntry,
  DealerInvoicesView,
  DealerInvoiceSummary,
  DealerAgingView,
} from '../../../lib/accountingApi';

type TabId = 'overview' | 'ledger' | 'invoices' | 'aging';

interface DealerDetailModalProps {
  dealer: DealerResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: AuthSession | null;
}

const fmt = (value?: number | null) => (value ?? 0).toLocaleString();

const fmtDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

/* ── Tab bar ─────────────────────────────────────────── */

function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'ledger', label: 'Ledger' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'aging', label: 'Aging' },
  ];

  return (
    <div className="flex gap-6 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={clsx(
            'relative pb-3 text-sm font-medium transition-colors',
            t.id === active ? 'text-primary' : 'text-secondary hover:text-primary'
          )}
        >
          {t.label}
          {t.id === active && (
            <span
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
              style={{ backgroundColor: 'var(--action-primary-bg)' }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Overview tab ────────────────────────────────────── */

function OverviewTab({ dealer }: { dealer: DealerResponse | null }) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Contact</p>
        <div className="space-y-2">
          {dealer?.email && <Row label="Email" value={dealer.email} />}
          {dealer?.phone && <Row label="Phone" value={dealer.phone} />}
          {dealer?.address && <Row label="Address" value={dealer.address} />}
          {!dealer?.email && !dealer?.phone && !dealer?.address && (
            <p className="text-sm text-tertiary">No contact information</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Financials</p>
        <div className="space-y-2">
          <Row label="Current balance" value={fmt(dealer?.outstandingBalance)} />
          <Row label="Credit limit" value={fmt(dealer?.creditLimit)} />
          {dealer?.creditLimit && dealer?.outstandingBalance ? (
            <Row
              label="Utilization"
              value={`${Math.round((dealer.outstandingBalance / dealer.creditLimit) * 100)}%`}
              valueClass={
                dealer.outstandingBalance > dealer.creditLimit
                  ? 'text-status-error-text'
                  : dealer.outstandingBalance / dealer.creditLimit > 0.8
                  ? 'text-status-warning-text'
                  : 'text-status-success-text'
              }
            />
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Account</p>
        <div className="space-y-2">
          {dealer?.publicId && <Row label="Public ID" value={dealer.publicId} mono />}
          {dealer?.portalEmail && <Row label="Portal email" value={dealer.portalEmail} />}
          {dealer?.code && <Row label="Code" value={dealer.code} mono />}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, mono, valueClass }: { label: string; value: string; mono?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-secondary">{label}</span>
      <span className={clsx('text-sm font-medium', valueClass || 'text-primary', mono && 'font-mono text-xs bg-surface-highlight px-2 py-0.5 rounded')}>
        {value}
      </span>
    </div>
  );
}

/* ── Ledger tab ──────────────────────────────────────── */

function LedgerTab({ dealerId, session }: { dealerId?: number; session?: AuthSession | null }) {
  const [data, setData] = useState<DealerLedgerView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!dealerId || !session || loaded) return;
    let cancelled = false;
    setLoading(true);
    getDealerLedgerView(dealerId, session)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) { setLoading(false); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [dealerId, session, loaded]);

  const entries = data?.entries || [];

  if (loading) return <p className="text-sm text-secondary py-6 text-center">Loading ledger...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Ledger entries</p>
        <span className="text-xs text-secondary">{entries.length} entries</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-tertiary py-6 text-center">No ledger entries</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-highlight">
                <th className="px-3 py-2 text-left text-xs font-medium text-secondary">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-secondary">Reference</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-secondary">Debit</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-secondary">Credit</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-secondary">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e, i) => (
                <tr key={i} className="hover:bg-surface-highlight transition-colors">
                  <td className="px-3 py-2 text-primary">{fmtDate(e.date)}</td>
                  <td className="px-3 py-2 text-primary">{e.reference || e.memo || '—'}</td>
                  <td className="px-3 py-2 text-right text-primary">{e.debit ? fmt(e.debit) : '—'}</td>
                  <td className="px-3 py-2 text-right text-primary">{e.credit ? fmt(e.credit) : '—'}</td>
                  <td className="px-3 py-2 text-right font-medium text-primary">{fmt(e.runningBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Invoices tab ────────────────────────────────────── */

function InvoicesTab({ dealerId, session }: { dealerId?: number; session?: AuthSession | null }) {
  const [data, setData] = useState<DealerInvoicesView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!dealerId || !session || loaded) return;
    let cancelled = false;
    setLoading(true);
    getDealerInvoicesView(dealerId, session)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) { setLoading(false); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [dealerId, session, loaded]);

  const invoices = data?.invoices || [];

  if (loading) return <p className="text-sm text-secondary py-6 text-center">Loading invoices...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Invoices</p>
        <span className="text-xs text-secondary">Outstanding: {fmt(data?.totalOutstanding)}</span>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-tertiary py-6 text-center">No invoices</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-highlight">
                <th className="px-3 py-2 text-left text-xs font-medium text-secondary">Invoice #</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-secondary">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-secondary">Due</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-secondary">Total</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-secondary">Outstanding</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-secondary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-highlight transition-colors">
                  <td className="px-3 py-2 font-medium text-primary">{inv.invoiceNumber || '—'}</td>
                  <td className="px-3 py-2 text-primary">{fmtDate(inv.issueDate)}</td>
                  <td className="px-3 py-2 text-primary">{fmtDate(inv.dueDate)}</td>
                  <td className="px-3 py-2 text-right text-primary">{fmt(inv.totalAmount)}</td>
                  <td className="px-3 py-2 text-right font-medium text-primary">{fmt(inv.outstandingAmount)}</td>
                  <td className="px-3 py-2 text-primary">{inv.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Aging tab ───────────────────────────────────────── */

function AgingTab({ dealerId, session }: { dealerId?: number; session?: AuthSession | null }) {
  const [data, setData] = useState<DealerAgingView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!dealerId || !session || loaded) return;
    let cancelled = false;
    setLoading(true);
    getDealerAgingView(dealerId, session)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) { setLoading(false); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [dealerId, session, loaded]);

  const buckets = data?.agingBuckets || {};
  const bucketKeys = Object.keys(buckets).sort();
  const overdue = data?.overdueInvoices || [];

  if (loading) return <p className="text-sm text-secondary py-6 text-center">Loading aging data...</p>;

  return (
    <div className="space-y-6">
      {/* Aging Buckets */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Aging Buckets</p>
          <span className="text-xs text-secondary">Total: {fmt(data?.totalOutstanding)}</span>
        </div>

        {bucketKeys.length === 0 ? (
          <p className="text-sm text-tertiary py-4 text-center">No aging data</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {bucketKeys.map((k) => (
              <div key={k} className="rounded-lg border border-border bg-surface-highlight p-3">
                <p className="text-xs text-secondary">{k}</p>
                <p className="text-sm font-semibold text-primary">{fmt(buckets[k])}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Overdue Invoices */}
      <section className="space-y-3">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Overdue Invoices</p>

        {overdue.length === 0 ? (
          <p className="text-sm text-tertiary py-4 text-center">No overdue invoices</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-highlight">
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary">Invoice #</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary">Due</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-secondary">Days overdue</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-secondary">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overdue.map((inv, i) => (
                  <tr key={i} className="hover:bg-surface-highlight transition-colors">
                    <td className="px-3 py-2 text-primary">{inv.invoiceNumber || '—'}</td>
                    <td className="px-3 py-2 text-primary">{fmtDate(inv.dueDate)}</td>
                    <td className="px-3 py-2 text-right text-primary">{inv.daysOverdue ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-medium text-primary">{fmt(inv.outstandingAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Main modal ──────────────────────────────────────── */

export function DealerDetailModal({ dealer, open, onOpenChange, session }: DealerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setActiveTab('overview');
  }, [onOpenChange]);

  if (!open || !dealer) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-surface shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-primary">{dealer.name || 'Dealer Details'}</h2>
            <p className="text-sm text-secondary mt-1">{dealer.code || dealer.publicId || 'ID: —'}</p>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 text-secondary hover:text-primary transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === 'overview' && <OverviewTab dealer={dealer} />}
          {activeTab === 'ledger' && <LedgerTab dealerId={dealer.id} session={session} />}
          {activeTab === 'invoices' && <InvoicesTab dealerId={dealer.id} session={session} />}
          {activeTab === 'aging' && <AgingTab dealerId={dealer.id} session={session} />}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6">
          <button
            onClick={handleClose}
            className="w-full h-10 rounded-lg bg-surface-highlight text-primary font-medium hover:opacity-80 transition-opacity text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

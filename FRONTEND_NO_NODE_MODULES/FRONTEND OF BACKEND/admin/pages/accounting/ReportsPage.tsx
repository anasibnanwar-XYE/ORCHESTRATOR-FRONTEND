import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  incomeStatementHierarchy,
  balanceSheetHierarchy,
  getCashFlow,
  getTrialBalance,
  getGstSummary,
  getAgedReceivablesReport,
  listAccountingPeriods,
  type AccountingPeriod,
} from '../../lib/accountingApi';
import { formatMoney, formatNumber, formatDateShort } from '../../lib/formatUtils';
import clsx from 'clsx';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import ApiErrorBanner, { type ApiErrorInfo } from '../../components/ApiErrorBanner';
import AuditDigestPage from './AuditDigestPage';

/* ── Report registry ────────────────────────────────────────── */

type ReportKey = 'pl' | 'bs' | 'cf' | 'tb' | 'ar' | 'gst' | 'audit';

const TABS: { key: ReportKey; label: string }[] = [
  { key: 'pl', label: 'Profit & Loss' },
  { key: 'bs', label: 'Balance Sheet' },
  { key: 'cf', label: 'Cash Flow' },
  { key: 'tb', label: 'Trial Balance' },
  { key: 'ar', label: 'Aged Receivables' },
  { key: 'gst', label: 'GST Summary' },
  { key: 'audit', label: 'Audit Digest' },
];

/* ── Hierarchy tree (P&L, BS, CF) ───────────────────────────── */

function ReportNode({ node, level = 0 }: { node: Record<string, unknown>; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const children = node.children as Record<string, unknown>[] | undefined;
  const hasChildren = Array.isArray(children) && children.length > 0;
  const isRoot = level === 0;
  const amount = (typeof node.totalAmount === 'number' ? node.totalAmount : typeof node.balance === 'number' ? node.balance : 0) as number;
  const isNeg = amount < 0;

  return (
    <div className={clsx(level > 0 && 'ml-3 sm:ml-5')}>
      <div
        className={clsx(
          'flex items-center justify-between py-2 sm:py-2.5 group transition-colors',
          isRoot
            ? 'border-b border-border pb-2.5'
            : 'hover:bg-surface-highlight rounded-lg px-2 sm:px-3 -mx-2 sm:-mx-3'
        )}
      >
        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={() => hasChildren && setExpanded(!expanded)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            <span className="text-tertiary group-hover:text-secondary flex-shrink-0">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          ) : (
            <span className="w-3.5 flex-shrink-0" />
          )}
          <span className={clsx('truncate text-sm', isRoot ? 'font-semibold text-primary' : 'font-medium text-primary')}>
            {String(node.name || node.accountName || '')}
          </span>
          {node.accountCode ? (
            <span className="text-xs text-tertiary font-sans ml-1 flex-shrink-0 hidden sm:inline">
              {String(node.accountCode)}
            </span>
          ) : null}
        </button>
        <span className={clsx(
          'flex-shrink-0 ml-3 text-right tabular-nums',
          isRoot ? 'text-base font-semibold' : 'text-sm font-medium',
          isNeg ? 'text-status-error-text' : 'text-primary'
        )}>
          {formatMoney(Math.abs(amount))}
          {isNeg && <span className="ml-1 text-xs">(Cr)</span>}
        </span>
      </div>
      {hasChildren && expanded && (
        <div className="mt-0.5 space-y-px">
          {children.map((child, idx) => (
            <ReportNode key={String(child.id ?? idx)} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Reusable summary band ──────────────────────────────────── */

function SummaryBand({ label, value, positive }: { label: string; value: number; positive: boolean }) {
  return (
    <div className={clsx(
      'rounded-xl border p-4 sm:p-5',
      positive
        ? 'border-status-success-text/20 bg-status-success-bg'
        : 'border-status-error-text/20 bg-status-error-bg'
    )}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4">
        <span className={clsx('text-base font-semibold', positive ? 'text-status-success-text' : 'text-status-error-text')}>
          {label}
        </span>
        <span className={clsx('font-display text-xl font-bold tabular-nums', positive ? 'text-status-success-text' : 'text-status-error-text')}>
          {formatMoney(Math.abs(value))}
        </span>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export default function ReportsPage() {
  const { session } = useAuth();
  const [active, setActive] = useState<ReportKey>('pl');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [openPeriod, setOpenPeriod] = useState<AccountingPeriod | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<Record<string, any>>({});

  useEffect(() => {
    listAccountingPeriods(session)
      .then((periods) => {
        const open = periods.find((p) => p.status === 'OPEN') ?? null;
        setOpenPeriod(open);
      })
      .catch(() => undefined);
  }, [session]);

  const run = async (key: ReportKey = active) => {
    if (key === 'audit') return;
    setLoading(true);
    setError(null);
    try {
      let result: unknown;
      switch (key) {
        case 'pl': result = await incomeStatementHierarchy(session); break;
        case 'bs': result = await balanceSheetHierarchy(session); break;
        case 'cf': result = await getCashFlow(session); break;
        case 'tb': result = await getTrialBalance(asOfDate || undefined, session, session?.companyCode); break;
        case 'ar': result = await getAgedReceivablesReport(asOfDate || undefined, session, session?.companyCode); break;
        case 'gst': result = await getGstSummary(from || undefined, to || undefined, session, session?.companyCode); break;
      }
      setData((prev) => ({ ...prev, [key]: result }));
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err && (err as Record<string, unknown>).status === 409) {
        setError({ message: 'The selected period is locked. Please select an open period or unlock it in settings.' });
      } else {
        setError({ message: err instanceof Error ? err.message : 'Unable to load report' });
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (key: ReportKey) => {
    setActive(key);
    setError(null);
  };

  const needsAsOf = active === 'tb' || active === 'ar';
  const needsRange = active === 'gst';
  const showControls = active !== 'audit';

  /* ── Hierarchy renderer (P&L, BS, CF) ─────────────────────── */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderSection = (sectionData: any, label: string) => {
    if (!sectionData) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">{label}</h3>
        <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 shadow-sm">
          <ReportNode node={sectionData} />
        </div>
      </div>
    );
  };

  /* ── Panel renderers ──────────────────────────────────────── */

  const renderPL = () => {
    const d = data.pl;
    if (!d) return <p className="text-sm text-secondary py-8 text-center">Click Generate to load the Profit & Loss statement.</p>;
    const gross = d.grossProfit ?? 0;
    const net = d.netProfit ?? d.netIncome ?? 0;
    return (
      <div className="space-y-6">
        {renderSection(d.revenue, 'Revenue')}
        {renderSection(d.cogs, 'Cost of Goods Sold')}
        <SummaryBand label="Gross Profit" value={gross} positive={gross >= 0} />
        {renderSection(d.expenses, 'Operating Expenses')}
        <SummaryBand label={net >= 0 ? 'Net Profit' : 'Net Loss'} value={net} positive={net >= 0} />
      </div>
    );
  };

  const renderBS = () => {
    const d = data.bs;
    if (!d) return <p className="text-sm text-secondary py-8 text-center">Click Generate to load the Balance Sheet.</p>;
    const totalA = d.totalAssets ?? 0;
    const totalL = d.totalLiabilities ?? 0;
    const totalE = d.totalEquity ?? 0;
    const diff = totalA - (totalL + totalE);
    const balanced = Math.abs(diff) < 0.01;
    return (
      <div className="space-y-6">
        {renderSection(d.assets, 'Assets')}
        {renderSection(d.liabilities, 'Liabilities')}
        {renderSection(d.equity, 'Equity')}
        <div className={clsx(
          'rounded-xl border p-4 sm:p-5',
          balanced ? 'border-status-success-text/20 bg-status-success-bg' : 'border-status-error-text/20 bg-status-error-bg'
        )}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
            <span className={clsx('text-base font-semibold', balanced ? 'text-status-success-text' : 'text-status-error-text')}>
              Balance Check
            </span>
            <span className={clsx('font-display text-xl font-bold tabular-nums', balanced ? 'text-status-success-text' : 'text-status-error-text')}>
              {balanced ? 'Balanced' : `Diff: ${formatMoney(Math.abs(diff))}`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderCF = () => {
    const d = data.cf;
    if (!d) return <p className="text-sm text-secondary py-8 text-center">Click Generate to load the Cash Flow statement.</p>;
    const net = d.netCashFlow ?? d.netChange ?? 0;
    return (
      <div className="space-y-6">
        {renderSection(d.operating, 'Operating Activities')}
        {renderSection(d.investing, 'Investing Activities')}
        {renderSection(d.financing, 'Financing Activities')}
        <SummaryBand label="Net Cash Flow" value={net} positive={net >= 0} />
      </div>
    );
  };

  const renderTB = () => {
    const d = data.tb;
    if (!d?.accounts?.length) return <p className="text-sm text-secondary py-8 text-center">Select an as-of date and click Generate.</p>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accts = d.accounts as any[];
    const totalDebit = d.totalDebit ?? accts.reduce((s: number, a: Record<string, number>) => s + (a.debit || 0), 0);
    const totalCredit = d.totalCredit ?? accts.reduce((s: number, a: Record<string, number>) => s + (a.credit || 0), 0);

    return (
      <>
        {/* Desktop */}
        <div className="hidden sm:block rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <table className="min-w-full text-sm divide-y divide-border">
            <thead className="bg-surface-highlight">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-secondary">Account</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-secondary w-28">Code</th>
                <th className="px-4 sm:px-6 py-3 text-right font-medium text-secondary w-36">Debit</th>
                <th className="px-4 sm:px-6 py-3 text-right font-medium text-secondary w-36">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accts.map((a: Record<string, unknown>) => (
                <tr key={String(a.accountId ?? a.id)} className="hover:bg-surface-highlight transition-colors">
                  <td className="px-4 sm:px-6 py-3 font-medium text-primary">{String(a.accountName ?? a.name)}</td>
                  <td className="px-4 sm:px-6 py-3 text-secondary font-sans text-xs">{String(a.accountCode ?? a.code)}</td>
                  <td className="px-4 sm:px-6 py-3 text-right font-sans tabular-nums">
                    {(a.debit as number) > 0 ? formatMoney(a.debit as number) : <span className="text-tertiary">—</span>}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-right font-sans tabular-nums">
                    {(a.credit as number) > 0 ? formatMoney(a.credit as number) : <span className="text-tertiary">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-highlight border-t-2 border-border">
              <tr>
                <td colSpan={2} className="px-4 sm:px-6 py-3 font-bold text-primary">Total</td>
                <td className="px-4 sm:px-6 py-3 text-right font-sans font-bold tabular-nums text-primary">{formatMoney(totalDebit)}</td>
                <td className="px-4 sm:px-6 py-3 text-right font-sans font-bold tabular-nums text-primary">{formatMoney(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden space-y-3">
          {accts.map((a: Record<string, unknown>) => (
            <div key={String(a.accountId ?? a.id)} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-primary text-sm truncate">{String(a.accountName ?? a.name)}</p>
                  <p className="text-xs text-tertiary font-sans">{String(a.accountCode ?? a.code)}</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm border-t border-border pt-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-secondary mb-1">Debit</p>
                  <p className="font-sans tabular-nums text-primary">{(a.debit as number) > 0 ? formatMoney(a.debit as number) : '—'}</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs font-medium text-secondary mb-1">Credit</p>
                  <p className="font-sans tabular-nums text-primary">{(a.credit as number) > 0 ? formatMoney(a.credit as number) : '—'}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-surface-highlight p-4 shadow-sm">
            <div className="flex justify-between text-sm font-bold text-primary">
              <span>Total Debit</span><span className="font-sans tabular-nums">{formatMoney(totalDebit)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-primary mt-2">
              <span>Total Credit</span><span className="font-sans tabular-nums">{formatMoney(totalCredit)}</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderAR = () => {
    const d = data.ar;
    if (!d?.dealers?.length) return <p className="text-sm text-secondary py-8 text-center">Select an as-of date and click Generate.</p>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dealers = d.dealers as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sumBucket = (key: string) => dealers.reduce((s: number, dl: any) => s + (dl.buckets?.[key] || 0), 0);

    return (
      <>
        {/* Desktop */}
        <div className="hidden lg:block rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <table className="min-w-full text-sm divide-y divide-border">
            <thead className="bg-surface-highlight">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-secondary">Dealer</th>
                <th className="px-4 py-3 text-right font-medium text-secondary">Current</th>
                <th className="px-4 py-3 text-right font-medium text-secondary">1–30d</th>
                <th className="px-4 py-3 text-right font-medium text-secondary">31–60d</th>
                <th className="px-4 py-3 text-right font-medium text-secondary">61–90d</th>
                <th className="px-4 py-3 text-right font-medium text-status-error-text">90+d</th>
                <th className="px-4 py-3 text-right font-bold text-primary">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {dealers.map((dl: any) => (
                <tr key={dl.dealerId} className="hover:bg-surface-highlight transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-primary text-sm">{dl.dealerName}</p>
                    <p className="text-xs text-tertiary font-sans">{dl.dealerCode}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-sans tabular-nums text-sm">{dl.buckets.current > 0 ? formatNumber(dl.buckets.current) : '—'}</td>
                  <td className="px-4 py-3 text-right font-sans tabular-nums text-sm">{dl.buckets.days1to30 > 0 ? formatNumber(dl.buckets.days1to30) : '—'}</td>
                  <td className="px-4 py-3 text-right font-sans tabular-nums text-sm">{dl.buckets.days31to60 > 0 ? formatNumber(dl.buckets.days31to60) : '—'}</td>
                  <td className="px-4 py-3 text-right font-sans tabular-nums text-sm">{dl.buckets.days61to90 > 0 ? formatNumber(dl.buckets.days61to90) : '—'}</td>
                  <td className="px-4 py-3 text-right font-sans tabular-nums text-sm font-medium text-status-error-text">{dl.buckets.over90 > 0 ? formatNumber(dl.buckets.over90) : '—'}</td>
                  <td className="px-4 py-3 text-right font-sans tabular-nums text-sm font-bold text-primary">{formatMoney(dl.totalOutstanding)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-highlight border-t-2 border-border font-bold text-primary text-sm">
              <tr>
                <td className="px-6 py-3">Grand Total</td>
                <td className="px-4 py-3 text-right font-sans tabular-nums">{formatNumber(sumBucket('current'))}</td>
                <td className="px-4 py-3 text-right font-sans tabular-nums">{formatNumber(sumBucket('days1to30'))}</td>
                <td className="px-4 py-3 text-right font-sans tabular-nums">{formatNumber(sumBucket('days31to60'))}</td>
                <td className="px-4 py-3 text-right font-sans tabular-nums">{formatNumber(sumBucket('days61to90'))}</td>
                <td className="px-4 py-3 text-right font-sans tabular-nums text-status-error-text">{formatNumber(sumBucket('over90'))}</td>
                <td className="px-4 py-3 text-right font-sans tabular-nums text-lg">{formatMoney(d.grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile */}
        <div className="lg:hidden space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {dealers.map((dl: any) => (
            <div key={dl.dealerId} className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-primary text-sm">{dl.dealerName}</p>
                  <p className="text-xs text-tertiary font-sans">{dl.dealerCode}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-secondary">Total</p>
                  <p className="font-bold text-primary font-sans tabular-nums">{formatMoney(dl.totalOutstanding)}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between"><span className="text-secondary">Current</span><span className="font-sans tabular-nums">{formatNumber(dl.buckets.current)}</span></div>
                <div className="flex justify-between"><span className="text-secondary">1–30d</span><span className="font-sans tabular-nums">{formatNumber(dl.buckets.days1to30)}</span></div>
                <div className="flex justify-between"><span className="text-secondary">31–60d</span><span className="font-sans tabular-nums">{formatNumber(dl.buckets.days31to60)}</span></div>
                <div className="flex justify-between"><span className="text-secondary">61–90d</span><span className="font-sans tabular-nums">{formatNumber(dl.buckets.days61to90)}</span></div>
                <div className="col-span-2 flex justify-between text-status-error-text font-medium border-t border-border pt-2">
                  <span>90+ days</span><span className="font-sans tabular-nums">{formatNumber(dl.buckets.over90)}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-surface-highlight p-4 shadow-sm">
            <div className="flex justify-between font-bold text-primary">
              <span>Grand Total</span>
              <span className="font-display text-lg font-sans tabular-nums">{formatMoney(d.grandTotal)}</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderGST = () => {
    const d = data.gst;
    if (!d) return <p className="text-sm text-secondary py-8 text-center">Select a date range and click Generate.</p>;
    return (
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
          <dt className="truncate text-xs sm:text-sm font-medium text-secondary">Output Liability</dt>
          <dd className="mt-1 sm:mt-2">
            <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-primary tabular-nums">
              {formatMoney(d.totalOutputLiability)}
            </span>
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
          <dt className="truncate text-xs sm:text-sm font-medium text-secondary">Input Credit</dt>
          <dd className="mt-1 sm:mt-2">
            <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-primary tabular-nums">
              {formatMoney(d.totalInputCredit)}
            </span>
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
          <dt className="truncate text-xs sm:text-sm font-medium text-secondary">Net Payable</dt>
          <dd className="mt-1 sm:mt-2">
            <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-primary tabular-nums">
              {formatMoney(d.netPayable)}
            </span>
          </dd>
        </div>
      </div>
    );
  };

  const renderPanel = () => {
    if (active === 'audit') return <AuditDigestPage />;
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-secondary">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary mb-4" />
          <span className="text-sm">Generating report…</span>
        </div>
      );
    }
    switch (active) {
      case 'pl': return renderPL();
      case 'bs': return renderBS();
      case 'cf': return renderCF();
      case 'tb': return renderTB();
      case 'ar': return renderAR();
      case 'gst': return renderGST();
      default: return null;
    }
  };

  const dateInputCls = 'flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-background';

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-primary">Financial Reports</h1>
          <p className="mt-1 text-sm text-secondary">Comprehensive financial statements and audit tools</p>
        </div>
        <button
          type="button"
          onClick={() => run()}
          disabled={loading || active === 'audit'}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight disabled:opacity-50"
        >
          <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
          Generate
        </button>
      </div>

      {/* Tab bar — underline style, horizontal scroll on mobile */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-4 sm:gap-6 overflow-x-auto" aria-label="Report tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={
                active === tab.key
                  ? 'border-b-2 border-primary pb-3 text-sm font-medium text-primary whitespace-nowrap'
                  : 'border-b-2 border-transparent pb-3 text-sm font-medium text-secondary hover:border-border hover:text-primary transition-colors whitespace-nowrap'
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Controls bar */}
      {showControls && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          {/* Period-based reports (P&L, BS, CF) — show which period */}
          {!needsAsOf && !needsRange && openPeriod && (
            <div className="flex items-center gap-3 flex-1 rounded-lg border border-border bg-surface px-4 py-2.5">
              <div className="h-2 w-2 rounded-full bg-status-success-text flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-primary">{openPeriod.name}</span>
                <span className="text-secondary ml-2">
                  {formatDateShort(openPeriod.startDate)} – {formatDateShort(openPeriod.endDate)}
                </span>
              </div>
            </div>
          )}
          {needsRange && (
            <>
              <div className="space-y-1 flex-1 sm:max-w-[200px]">
                <label className="text-xs font-medium text-secondary">From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={dateInputCls} />
              </div>
              <div className="space-y-1 flex-1 sm:max-w-[200px]">
                <label className="text-xs font-medium text-secondary">To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={dateInputCls} />
              </div>
            </>
          )}
          {needsAsOf && (
            <div className="space-y-1 flex-1 sm:max-w-[200px]">
              <label className="text-xs font-medium text-secondary">As of date</label>
              <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className={dateInputCls} />
            </div>
          )}
          <button
            type="button"
            onClick={() => run()}
            disabled={loading}
            className="h-10 rounded-lg bg-action-bg px-5 text-sm font-medium text-action-text shadow-sm hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            Generate
          </button>
        </div>
      )}

      {/* Error */}
      <ApiErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* Report content */}
      {renderPanel()}
    </div>
  );
}

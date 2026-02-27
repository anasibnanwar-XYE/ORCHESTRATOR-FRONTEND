import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listAccounts,
  getReconciliationReport,
  type AccountSummary,
} from '../../lib/accountingApi';
import {
  Landmark,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronDown,
} from 'lucide-react';

interface ReconciliationItem {
  id?: number;
  date?: string;
  reference?: string;
  description?: string;
  amount?: number;
  type?: string;
  status?: string;
}

interface ReconciliationReport {
  bankAccountId?: number;
  accountName?: string;
  statementBalance?: number;
  bookBalance?: number;
  variance?: number;
  isReconciled?: boolean;
  matchedItems?: ReconciliationItem[];
  unmatchedItems?: ReconciliationItem[];
  totalMatched?: number;
  totalUnmatched?: number;
  reconciledAt?: string;
  summary?: {
    openingBalance?: number;
    closingBalance?: number;
    deposits?: number;
    withdrawals?: number;
    adjustments?: number;
  };
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
      <div className="h-3 w-24 rounded bg-surface-highlight animate-pulse" />
      <div className="h-3 w-32 rounded bg-surface-highlight animate-pulse" />
      <div className="flex-1 h-3 rounded bg-surface-highlight animate-pulse" />
      <div className="h-3 w-20 rounded bg-surface-highlight animate-pulse" />
    </div>
  );
}

function formatCurrency(value?: number): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

export default function BankReconciliationPage() {
  const { session } = useAuth();

  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [statementBalance, setStatementBalance] = useState<string>('');

  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [expandedSection, setExpandedSection] = useState<'matched' | 'unmatched' | null>('matched');

  useEffect(() => {
    if (!session) return;
    setLoadingAccounts(true);
    setAccountsError(null);
    listAccounts(session)
      .then((all) => {
        const assetAccounts = all.filter((a) => a.type === 'Asset' || a.type === 'ASSET');
        setAccounts(assetAccounts);
      })
      .catch((err) => {
        setAccountsError(err instanceof Error ? err.message : 'Failed to load accounts');
      })
      .finally(() => setLoadingAccounts(false));
  }, [session?.companyCode]);

  const handleReconcile = async () => {
    if (!session || !selectedAccountId) return;
    setReconciling(true);
    setReportError(null);
    setReport(null);

    const accountId = Number(selectedAccountId);
    const balance = statementBalance !== '' ? Number(statementBalance) : undefined;

    try {
      const data = await getReconciliationReport(accountId, balance, session);
      setReport(data as ReconciliationReport);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Reconciliation failed. Please try again.');
    } finally {
      setReconciling(false);
    }
  };

  const canReconcile = !!selectedAccountId && !reconciling;
  const variance = report?.variance ?? 0;
  const isBalanced = Math.abs(variance) < 0.01;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-display text-primary">Bank Reconciliation</h1>
          <p className="mt-1 text-sm text-secondary">
            Match your bank statement against book records to identify variances.
          </p>
        </div>
      </div>

      {/* Controls panel */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Account selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-secondary uppercase tracking-wide">
              Bank Account
            </label>
            {loadingAccounts ? (
              <div className="h-10 rounded-lg bg-surface-highlight animate-pulse" />
            ) : accountsError ? (
              <p className="text-xs text-[var(--status-error-text)]">{accountsError}</p>
            ) : (
              <div className="relative">
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
                >
                  <option value="">Select account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
              </div>
            )}
          </div>

          {/* Statement balance */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-secondary uppercase tracking-wide">
              Statement Balance
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-border bg-surface pl-7 pr-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
              />
            </div>
          </div>

          {/* Reconcile button */}
          <div className="flex items-end">
            <button
              onClick={handleReconcile}
              disabled={!canReconcile}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: 'var(--action-primary-bg)',
                color: 'var(--action-primary-text)',
              }}
            >
              {reconciling ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Reconciling…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Reconcile
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {reportError && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--status-error-bg)] bg-[var(--status-error-bg)] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-error-text)]" />
          <p className="text-sm text-[var(--status-error-text)]">{reportError}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {reconciling && (
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="h-4 w-40 rounded bg-surface-highlight animate-pulse" />
          </div>
          {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {/* Results */}
      {report && !reconciling && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Book balance */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">Book Balance</span>
                <Landmark className="h-4 w-4 text-secondary" />
              </div>
              <p className="mt-2 text-xl font-semibold font-display text-primary">
                {formatCurrency(report.bookBalance)}
              </p>
            </div>

            {/* Statement balance */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">Statement Balance</span>
                <CircleDot className="h-4 w-4 text-secondary" />
              </div>
              <p className="mt-2 text-xl font-semibold font-display text-primary">
                {formatCurrency(report.statementBalance)}
              </p>
            </div>

            {/* Variance */}
            <div className={`rounded-xl border p-4 shadow-sm ${
              isBalanced
                ? 'border-[var(--status-success-bg)] bg-[var(--status-success-bg)]'
                : 'border-[var(--status-error-bg)] bg-[var(--status-error-bg)]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">Variance</span>
                {variance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-secondary" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-secondary" />
                )}
              </div>
              <p className={`mt-2 text-xl font-semibold font-display ${
                isBalanced
                  ? 'text-[var(--status-success-text)]'
                  : 'text-[var(--status-error-text)]'
              }`}>
                {formatCurrency(variance)}
              </p>
            </div>

            {/* Status */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-secondary uppercase tracking-wide">Status</span>
                {isBalanced ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--status-success-text)]" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-[var(--status-error-text)]" />
                )}
              </div>
              <p className={`mt-2 text-base font-semibold font-display ${
                isBalanced
                  ? 'text-[var(--status-success-text)]'
                  : 'text-[var(--status-error-text)]'
              }`}>
                {isBalanced ? 'Balanced' : 'Variance Detected'}
              </p>
              <p className="mt-0.5 text-xs text-secondary">
                {report.totalMatched ?? 0} matched · {report.totalUnmatched ?? 0} unmatched
              </p>
            </div>
          </div>

          {/* Summary breakdown (if present) */}
          {report.summary && (
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-semibold font-display text-primary mb-3">Reconciliation Summary</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: 'Opening Balance', value: report.summary.openingBalance },
                  { label: 'Deposits', value: report.summary.deposits },
                  { label: 'Withdrawals', value: report.summary.withdrawals },
                  { label: 'Adjustments', value: report.summary.adjustments },
                  { label: 'Closing Balance', value: report.summary.closingBalance },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-background px-3 py-2.5">
                    <p className="text-xs text-secondary">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{formatCurrency(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched items */}
          {((report.matchedItems?.length ?? 0) > 0) && (
            <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface-highlight transition-colors"
                onClick={() => setExpandedSection(expandedSection === 'matched' ? null : 'matched')}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[var(--status-success-text)]" />
                  <span className="text-sm font-semibold font-display text-primary">
                    Matched Items
                  </span>
                  <span className="rounded-full bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-medium text-[var(--status-success-text)]">
                    {report.matchedItems?.length ?? 0}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-secondary transition-transform ${expandedSection === 'matched' ? 'rotate-180' : ''}`} />
              </button>

              {expandedSection === 'matched' && (
                <div className="border-t border-border">
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-highlight">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Date</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Reference</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Description</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wide">Amount</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(report.matchedItems ?? []).map((item, idx) => (
                          <tr key={item.id ?? idx} className="hover:bg-surface-highlight transition-colors">
                            <td className="px-5 py-3 text-secondary whitespace-nowrap">{formatDate(item.date)}</td>
                            <td className="px-5 py-3 text-primary font-mono text-xs">{item.reference ?? '—'}</td>
                            <td className="px-5 py-3 text-secondary">{item.description ?? '—'}</td>
                            <td className="px-5 py-3 text-right font-medium text-primary tabular-nums">{formatCurrency(item.amount)}</td>
                            <td className="px-5 py-3">
                              <span className="rounded-full bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-medium text-[var(--status-success-text)]">
                                {item.type ?? 'Matched'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-border">
                    {(report.matchedItems ?? []).map((item, idx) => (
                      <div key={item.id ?? idx} className="px-4 py-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary">{formatDate(item.date)}</span>
                          <span className="text-sm font-semibold text-primary tabular-nums">{formatCurrency(item.amount)}</span>
                        </div>
                        <p className="text-sm text-primary">{item.description ?? '—'}</p>
                        {item.reference && <p className="text-xs font-mono text-secondary">{item.reference}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unmatched items */}
          {((report.unmatchedItems?.length ?? 0) > 0) && (
            <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface-highlight transition-colors"
                onClick={() => setExpandedSection(expandedSection === 'unmatched' ? null : 'unmatched')}
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-[var(--status-error-text)]" />
                  <span className="text-sm font-semibold font-display text-primary">
                    Unmatched Items
                  </span>
                  <span className="rounded-full bg-[var(--status-error-bg)] px-2 py-0.5 text-xs font-medium text-[var(--status-error-text)]">
                    {report.unmatchedItems?.length ?? 0}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-secondary transition-transform ${expandedSection === 'unmatched' ? 'rotate-180' : ''}`} />
              </button>

              {expandedSection === 'unmatched' && (
                <div className="border-t border-border">
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-highlight">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Date</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Reference</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Description</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wide">Amount</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(report.unmatchedItems ?? []).map((item, idx) => (
                          <tr key={item.id ?? idx} className="hover:bg-surface-highlight transition-colors">
                            <td className="px-5 py-3 text-secondary whitespace-nowrap">{formatDate(item.date)}</td>
                            <td className="px-5 py-3 text-primary font-mono text-xs">{item.reference ?? '—'}</td>
                            <td className="px-5 py-3 text-secondary">{item.description ?? '—'}</td>
                            <td className="px-5 py-3 text-right font-medium text-primary tabular-nums">{formatCurrency(item.amount)}</td>
                            <td className="px-5 py-3">
                              <span className="rounded-full bg-[var(--status-error-bg)] px-2 py-0.5 text-xs font-medium text-[var(--status-error-text)]">
                                {item.status ?? 'Unmatched'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-border">
                    {(report.unmatchedItems ?? []).map((item, idx) => (
                      <div key={item.id ?? idx} className="px-4 py-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary">{formatDate(item.date)}</span>
                          <span className="text-sm font-semibold text-[var(--status-error-text)] tabular-nums">{formatCurrency(item.amount)}</span>
                        </div>
                        <p className="text-sm text-primary">{item.description ?? '—'}</p>
                        {item.reference && <p className="text-xs font-mono text-secondary">{item.reference}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state — no items at all */}
          {(report.matchedItems?.length ?? 0) === 0 && (report.unmatchedItems?.length ?? 0) === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16 shadow-sm">
              <div className="rounded-full bg-surface-highlight p-4 mb-4">
                <Landmark className="h-7 w-7 text-secondary" />
              </div>
              <p className="text-sm font-medium text-primary">No reconciliation items found</p>
              <p className="mt-1 text-xs text-secondary">
                The selected account has no transactions in this period.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial empty state (no reconciliation run yet) */}
      {!report && !reconciling && !reportError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-20 shadow-sm">
          <div className="rounded-full bg-surface-highlight p-5 mb-5">
            <Landmark className="h-8 w-8 text-secondary" />
          </div>
          <p className="text-sm font-semibold font-display text-primary">Run a reconciliation</p>
          <p className="mt-1.5 max-w-xs text-center text-sm text-secondary">
            Select a bank account and enter your statement balance, then click <strong>Reconcile</strong> to compare records.
          </p>
        </div>
      )}
    </div>
  );
}

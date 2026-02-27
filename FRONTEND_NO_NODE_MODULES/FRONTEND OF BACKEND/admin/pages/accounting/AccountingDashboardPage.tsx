import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import {
  listAccounts,
  listJournalEntries,
  incomeStatementHierarchy,
  getDealerLedgerView,
  getDealerInvoicesView,
  getDealerAgingView,
  type AccountSummary,
  type JournalEntrySummary
} from '../../lib/accountingApi';
import { formatDate, formatCurrency } from '../../lib/formatUtils';

interface IncomeStatementResult {
  netIncome?: number;
  netProfit?: number;
}

export default function AccountingDashboardPage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const dealerIdParam = searchParams.get('dealerId');
  const dealerId = dealerIdParam ? Number(dealerIdParam) : undefined;
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [entries, setEntries] = useState<JournalEntrySummary[]>([]);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dealerSummary, setDealerSummary] = useState<{
    dealerName?: string;
    currentBalance?: number;
    totalOutstanding?: number;
    netOutstanding?: number;
    advanceCredit?: number;
    invoiceCount?: number;
    creditLimit?: number;
    availableCredit?: number;
  } | null>(null);
  const [dealerLoading, setDealerLoading] = useState(false);
  const [dealerError, setDealerError] = useState<string | null>(null);
  const [dealerLabel, setDealerLabel] = useState<string | null>(null);

  const load = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [acct, journal, incomeStmt] = await Promise.all([
        dealerId ? Promise.resolve([]) : listAccounts(session),
        listJournalEntries(dealerId ? { dealerId } : {}, session),
        dealerId ? Promise.resolve(null) : incomeStatementHierarchy(session).catch(() => null),
      ]);
      setAccounts(acct);
      setEntries(journal);
      setIncomeStatement(incomeStmt as IncomeStatementResult | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.companyCode, dealerId]);

  useEffect(() => {
    if (!dealerId) {
      setDealerSummary(null);
      setDealerError(null);
      setDealerLabel(null);
      return;
    }
    try {
      const stored = sessionStorage.getItem('accounting.selectedDealer');
      if (stored) {
        const dealer = JSON.parse(stored) as { id: number; name?: string };
        if (dealer?.id === dealerId) {
          setDealerLabel(dealer.name ?? null);
        }
      }
    } catch {
      setDealerLabel(null);
    }
  }, [dealerId]);

  useEffect(() => {
    if (!session || !dealerId) {
      return;
    }
    let cancelled = false;
    setDealerLoading(true);
    setDealerError(null);
    Promise.all([
      getDealerLedgerView(dealerId, session),
      getDealerInvoicesView(dealerId, session),
      getDealerAgingView(dealerId, session)
    ])
      .then(([ledger, invoices, aging]) => {
        if (cancelled) return;
        setDealerSummary({
          dealerName: ledger.dealerName ?? invoices.dealerName ?? aging.dealerName,
          currentBalance: ledger.currentBalance,
          totalOutstanding: invoices.totalOutstanding ?? aging.totalOutstanding,
          netOutstanding: invoices.netOutstanding ?? aging.netOutstanding,
          advanceCredit: invoices.advanceCredit ?? aging.advanceCredit,
          invoiceCount: invoices.invoiceCount,
          creditLimit: aging.creditLimit,
          availableCredit: aging.availableCredit
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setDealerError(err instanceof Error ? err.message : 'Unable to load dealer summary');
        setDealerSummary(null);
      })
      .finally(() => {
        if (cancelled) return;
        setDealerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dealerId, session]);

  const totalsByType = useMemo(() => {
    return accounts.reduce<Record<string, number>>((acc, account) => {
      const key = (account.type || '').toLowerCase();
      if (!acc[key]) acc[key] = 0;
      acc[key] += account.balance ?? 0;
      return acc;
    }, {});
  }, [accounts]);

  const workingCapital = (totalsByType.asset ?? 0) - (totalsByType.liability ?? 0);
  const showCompanySummary = !dealerId;

  const netIncomeYTD = useMemo(() => {
    const revenue = -(totalsByType.revenue ?? 0);
    const cogs = Math.abs(totalsByType.cogs ?? 0);
    const expenses = Math.abs(totalsByType.expense ?? 0);
    const calculatedFromBalances = revenue - cogs - expenses;

    if (incomeStatement?.netIncome != null) {
      const backendNetIncome = incomeStatement.netIncome;
      if (backendNetIncome < 0 && revenue > 0 && calculatedFromBalances > 0) {
        return calculatedFromBalances;
      }
      return backendNetIncome;
    }
    if (incomeStatement?.netProfit != null) {
      const backendNetProfit = incomeStatement.netProfit;
      if (backendNetProfit < 0 && revenue > 0 && calculatedFromBalances > 0) {
        return calculatedFromBalances;
      }
      return backendNetProfit;
    }

    return calculatedFromBalances;
  }, [incomeStatement, totalsByType]);

  const cards = [
    { label: 'Total Assets', value: totalsByType.asset },
    { label: 'Total Liabilities', value: totalsByType.liability },
    { label: 'Equity', value: totalsByType.equity ?? (totalsByType.asset ?? 0) - (totalsByType.liability ?? 0) },
    { label: 'Net Income', value: netIncomeYTD },
  ];

  const dealerCards = [
    { label: 'Current Balance', value: dealerSummary?.currentBalance },
    { label: 'Net Outstanding', value: dealerSummary?.netOutstanding ?? dealerSummary?.totalOutstanding },
    { label: 'Available Credit', value: dealerSummary?.availableCredit },
    { label: 'Open Invoices', value: dealerSummary?.invoiceCount },
  ];

  const recentEntries = entries.slice(0, 5);
  const topAccounts = [...accounts]
    .sort((a, b) => (Math.abs(b.balance ?? 0) - Math.abs(a.balance ?? 0)))
    .slice(0, 5);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-primary truncate">Dashboard</h1>
          <p className="mt-1 text-sm text-secondary truncate">Financial summary and recent activity</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight disabled:opacity-50"
        >
          <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-transparent bg-status-error-bg p-4 text-sm text-status-error-text">
          {error}
        </div>
      )}

      {dealerId && (
        <div className="rounded-lg border border-transparent bg-status-info-bg px-3 py-2 text-sm text-status-info-text">
          Dealer scope: {dealerSummary?.dealerName || dealerLabel || `Dealer #${dealerId}`}
        </div>
      )}

      <div id="acct-kpi-cards" className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(showCompanySummary ? cards : dealerCards).map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
            <dt className="truncate text-xs sm:text-sm font-medium text-secondary">{card.label}</dt>
            <dd className="mt-1 sm:mt-2">
              <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-primary tabular-nums">
                {formatCurrency(card.value)}
              </span>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div id="acct-recent-postings" className="rounded-xl border border-border bg-surface shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base font-semibold text-primary truncate">{dealerId ? 'Dealer Postings' : 'Recent Postings'}</h2>
            <span className="inline-flex items-center rounded-full bg-surface-highlight px-2 py-0.5 text-xs font-medium text-tertiary shrink-0">
              Last {recentEntries.length} entries
            </span>
          </div>
          <div className="p-4 sm:p-6">
            {recentEntries.length === 0 ? (
              <div className="text-center text-sm text-secondary">No recent journal entries found.</div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentEntries.map((entry) => {
                  const calculatedDebit = entry.lines?.reduce((sum, line) => sum + (line.debit || 0), 0) ?? 0;
                  const calculatedCredit = entry.lines?.reduce((sum, line) => sum + (line.credit || 0), 0) ?? 0;
                  const displayDebit = (entry.debitTotal && entry.debitTotal > 0) ? entry.debitTotal : calculatedDebit;

                  return (
                    <div key={entry.id} className="group flex items-center justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-surface-highlight">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-primary">{entry.referenceNumber}</p>
                          <span className={clsx(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            entry.status === 'Posted'
                              ? "bg-status-success-bg text-status-success-text"
                              : "bg-surface-highlight text-secondary"
                          )}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-secondary">{formatDate(entry.entryDate)} · {entry.memo || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-medium text-primary tabular-nums">{formatCurrency(displayDebit)}</span>
                          <span className="text-xs text-tertiary">Debit</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {showCompanySummary ? (
          <div id="acct-quick-stats" className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-primary">Quick Stats</h2>
            </div>
            <div className="p-6">
              <dl className="space-y-6">
                <div>
                  <dt className="text-sm font-medium text-secondary">Working Capital</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-primary tabular-nums">{formatCurrency(workingCapital)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-secondary">Net Income (YTD)</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-primary tabular-nums">{formatCurrency(netIncomeYTD)}</dd>
                </div>
                <div className="pt-4 border-t border-border">
                  <dt className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Top Balances</dt>
                  <div className="space-y-3">
                    {topAccounts.length === 0 ? (
                      <p className="text-sm text-secondary">No active accounts</p>
                    ) : (
                      topAccounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="truncate text-secondary">{account.name}</span>
                          </div>
                          <span className="font-medium text-primary tabular-nums">{formatCurrency(account.balance)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div id="acct-dealer-summary" className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-primary">Dealer Summary</h2>
            </div>
            <div className="p-6">
              {dealerError ? (
                <div className="text-sm text-status-error-text">{dealerError}</div>
              ) : dealerLoading ? (
                <div className="text-sm text-secondary">Loading dealer summary...</div>
              ) : dealerSummary ? (
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-medium text-secondary">Credit Limit</dt>
                    <dd className="mt-1 text-lg font-semibold text-primary tabular-nums">{formatCurrency(dealerSummary.creditLimit)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-secondary">Available Credit</dt>
                    <dd className="mt-1 text-lg font-semibold text-primary tabular-nums">{formatCurrency(dealerSummary.availableCredit)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-secondary">Open Invoices</dt>
                    <dd className="mt-1 text-lg font-semibold text-primary tabular-nums">{dealerSummary.invoiceCount ?? 0}</dd>
                  </div>
                </dl>
              ) : (
                <div className="text-sm text-secondary">Select a dealer to view summary.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

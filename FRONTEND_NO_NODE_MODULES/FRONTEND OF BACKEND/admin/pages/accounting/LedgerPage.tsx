import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { accountStatement, getDealerLedgerView, listAccounts, type AccountSummary, type DealerLedgerView, type StatementRow } from '../../lib/accountingApi';
import { formatDate, formatMoney } from '../../lib/formatUtils';
import ApiErrorBanner, { type ApiErrorInfo } from '../../components/ApiErrorBanner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

function StickyTotals({ rows }: { rows: StatementRow[] }) {
  const debit = useMemo(() => rows.reduce((s, r) => s + r.debit, 0), [rows]);
  const credit = useMemo(() => rows.reduce((s, r) => s + r.credit, 0), [rows]);
  const balance = useMemo(() => rows.reduce((_, r) => r.balance, 0), [rows]);
  return (
    <div className="sticky bottom-0 flex flex-col sm:flex-row justify-end gap-2 sm:gap-8 border-t border-border bg-background/95 px-3 py-2 text-xs sm:text-sm">
      <div>Debit: <span className="font-semibold text-status-success-text">{debit.toLocaleString()}</span></div>
      <div>Credit: <span className="font-semibold text-status-error-text">{credit.toLocaleString()}</span></div>
      <div>Balance: <span className="font-semibold text-primary">{balance.toLocaleString()}</span></div>
    </div>
  );
}

export default function LedgerPage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const dealerIdParam = searchParams.get('dealerId');
  const dealerId = dealerIdParam ? Number(dealerIdParam) : undefined;
  const [companyCode] = useState(session?.companyCode);
  const [tab, setTab] = useState<'single' | 'consolidated'>('single');
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [accountIds, setAccountIds] = useState<number[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [rowsMap, setRowsMap] = useState<Record<number, StatementRow[]>>({});
  const [dealerLedger, setDealerLedger] = useState<DealerLedgerView | null>(null);
  const [dealerLoading, setDealerLoading] = useState(false);
  const [dealerError, setDealerError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => { listAccounts(session).then(setAccounts).catch(() => undefined); }, [session]);

  const loadDealerLedger = async () => {
    if (!session || !dealerId) {
      setDealerLedger(null);
      setDealerError(null);
      setDealerLoading(false);
      return;
    }
    setDealerLoading(true);
    setDealerError(null);
    try {
      const view = await getDealerLedgerView(dealerId, session);
      setDealerLedger(view);
    } catch (err) {
      setDealerError({
        message: err instanceof Error ? err.message : 'Unable to load dealer ledger.',
        body: (err as Record<string, unknown>)?.body,
      });
      setDealerLedger(null);
    } finally {
      setDealerLoading(false);
    }
  };

  useEffect(() => {
    if (!session || !dealerId) {
      setDealerLedger(null);
      setDealerError(null);
      setDealerLoading(false);
      return;
    }
    loadDealerLedger().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealerId, session]);

  const load = async () => {
    if (accountIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const entries = await Promise.all(accountIds.map((id) => accountStatement(id, from || undefined, to || undefined, session, companyCode).then((rows) => [id, rows] as const)));
      setRowsMap(Object.fromEntries(entries));
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to load account statement.',
        body: (err as Record<string, unknown>)?.body,
      });
      setRowsMap({});
    } finally {
      setLoading(false);
    }
  };

  const merged = useMemo(() => {
    if (tab !== 'consolidated') return [] as Array<StatementRow & { accountId: number }>;
    const list: Array<StatementRow & { accountId: number }> = [];
    for (const id of Object.keys(rowsMap)) {
      const rows = rowsMap[Number(id)] || [];
      rows.forEach((r) => list.push({ ...r, accountId: Number(id) }));
    }
    return list.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [rowsMap, tab]);

  const rows = rowsMap[accountIds[0] ?? -1] || [];

  if (dealerId) {
    const entries = dealerLedger?.entries ?? [];
    return (
      <div className="space-y-4 px-2 sm:px-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-primary">Dealer Ledger</h1>
            <p className="text-xs sm:text-sm text-secondary">
              {dealerLedger?.dealerName ? `Ledger for ${dealerLedger.dealerName}` : 'Dealer ledger entries'}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadDealerLedger} disabled={dealerLoading}>
            Refresh
          </Button>
        </div>

        <ApiErrorBanner error={dealerError} onDismiss={() => setDealerError(null)} />

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="text-xs text-secondary">Current balance</div>
          <div className="mt-1 text-2xl font-semibold text-primary">{formatMoney(dealerLedger?.currentBalance)}</div>
        </div>

        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface/50 hover:bg-surface/50">
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-[40%]">Memo</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealerLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-secondary">Loading ledger...</TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-secondary">No dealer ledger entries found.</TableCell>
                </TableRow>
              ) : (
                entries.map((entry, idx) => (
                  <TableRow key={`${entry.reference ?? 'entry'}-${idx}`}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell className="font-medium">{entry.reference ?? '—'}</TableCell>
                    <TableCell className="text-secondary truncate max-w-xs" title={entry.memo}>{entry.memo ?? '—'}</TableCell>
                    <TableCell className="text-right text-status-success-text">{entry.debit ? formatMoney(entry.debit) : ''}</TableCell>
                    <TableCell className="text-right text-status-error-text">{entry.credit ? formatMoney(entry.credit) : ''}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(entry.runningBalance)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold font-display text-primary">General Ledger</h1>
          <p className="text-xs sm:text-sm text-secondary">View account statements and consolidated reports</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant={tab === 'single' ? 'default' : 'outline'}
            onClick={() => setTab('single')}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            Single Account
          </Button>
          <Button
            type="button"
            variant={tab === 'consolidated' ? 'default' : 'outline'}
            onClick={() => setTab('consolidated')}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            Consolidated View
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex flex-col gap-3 p-3 sm:p-4">
          {/* Account selector row */}
          <div className="w-full space-y-1">
            <label className="text-xs font-medium text-secondary">
              {tab === 'consolidated' ? 'Accounts (hold Ctrl to select multiple)' : 'Account'}
            </label>
            <select
              multiple={tab === 'consolidated'}
              value={tab === 'consolidated' ? accountIds.map(String) : (accountIds[0] ? String(accountIds[0]) : '')}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                setAccountIds(tab === 'consolidated' ? opts : [Number(e.target.value)]);
              }}
              className={clsx(
                'w-full rounded-lg border border-border bg-background px-3 text-sm text-primary transition-colors',
                'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                tab === 'consolidated' ? 'h-28 py-2' : 'h-10 py-2'
              )}
            >
              {tab !== 'consolidated' && <option value="">Select account…</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </select>
          </div>

          {/* Date range + action row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex gap-3 flex-1">
              <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <Button type="button" onClick={load} className="w-full sm:w-auto flex-shrink-0">
              View Ledger
            </Button>
          </div>
        </div>
      </div>

      {tab === 'single' ? (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface/50 hover:bg-surface/50">
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-secondary">Loading transactions...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-secondary">No transactions found for this period</TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell className="font-medium">{r.reference}</TableCell>
                    <TableCell className="text-secondary truncate max-w-xs" title={r.description}>{r.description}</TableCell>
                    <TableCell className="text-right text-status-success-text">{r.debit ? r.debit.toLocaleString() : ''}</TableCell>
                    <TableCell className="text-right text-status-error-text">{r.credit ? r.credit.toLocaleString() : ''}</TableCell>
                    <TableCell className="text-right font-medium">{r.balance.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <StickyTotals rows={rows} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface/50 hover:bg-surface/50">
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-[30%]">Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Net Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-secondary">Loading transactions...</TableCell>
                </TableRow>
              ) : merged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-secondary">No transactions found</TableCell>
                </TableRow>
              ) : (
                merged.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell className="text-secondary">{accounts.find((a) => a.id === r.accountId)?.code}</TableCell>
                    <TableCell className="font-medium">{r.reference}</TableCell>
                    <TableCell className="text-secondary truncate max-w-xs" title={r.description}>{r.description}</TableCell>
                    <TableCell className="text-right text-status-success-text">{r.debit ? r.debit.toLocaleString() : ''}</TableCell>
                    <TableCell className="text-right text-status-error-text">{r.credit ? r.credit.toLocaleString() : ''}</TableCell>
                    <TableCell className="text-right font-medium">{r.balance.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

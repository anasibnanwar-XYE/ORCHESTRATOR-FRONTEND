import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDealerLedger } from '../../lib/dealerApi';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { formatDate, formatMoney } from '../../lib/formatUtils';

export default function DealerLedgerPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [entries, setEntries] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const view = await getDealerLedger(session);
      setCurrentBalance(view.currentBalance ?? 0);
      setEntries(view.entries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ledger.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-primary">Ledger</h1>
          <p className="text-xs sm:text-sm text-secondary">Your account transactions with running balance</p>
        </div>
        <Button type="button" variant="outline" onClick={load} disabled={!session || loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-status-error-text/20 bg-status-error-bg p-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current balance</CardTitle>
          <CardDescription>Latest running balance on your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-primary">{formatMoney(currentBalance)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entries</CardTitle>
          <CardDescription>Most recent entries appear last (running balance is computed by backend)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-secondary">
                    Loading ledger...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-secondary">
                    No ledger entries found.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e, idx) => (
                  <TableRow key={`${e.reference ?? idx}-${idx}`}>
                    <TableCell label="Date">{formatDate(e.date)}</TableCell>
                    <TableCell label="Ref" className="font-medium">{e.reference ?? '—'}</TableCell>
                    <TableCell label="Memo" className="text-secondary">{e.memo ?? '—'}</TableCell>
                    <TableCell label="Debit">
                      <div className="sm:text-right text-status-success-text">{formatMoney(e.debit)}</div>
                    </TableCell>
                    <TableCell label="Credit">
                      <div className="sm:text-right text-status-error-text">{formatMoney(e.credit)}</div>
                    </TableCell>
                    <TableCell label="Balance">
                      <div className="sm:text-right font-medium">{formatMoney(e.runningBalance)}</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

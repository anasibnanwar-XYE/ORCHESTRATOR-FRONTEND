import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDealerAging, type DealerPortalOverdueInvoice } from '../../lib/dealerApi';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { formatDate, formatMoney } from '../../lib/formatUtils';

export default function DealerAgingPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creditLimit, setCreditLimit] = useState(0);
  const [netOutstanding, setNetOutstanding] = useState(0);
  const [availableCredit, setAvailableCredit] = useState(0);
  const [agingBuckets, setAgingBuckets] = useState<Record<string, number>>({});
  const [overdueInvoices, setOverdueInvoices] = useState<DealerPortalOverdueInvoice[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const view = await getDealerAging(session);
      setCreditLimit(view.creditLimit ?? 0);
      setNetOutstanding(view.netOutstanding ?? view.totalOutstanding ?? 0);
      setAvailableCredit(view.availableCredit ?? 0);
      setAgingBuckets(view.agingBuckets ?? {});
      setOverdueInvoices(view.overdueInvoices ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load aging.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const bucketRows = useMemo(() => {
    const entries = Object.entries(agingBuckets ?? {});
    const preferredOrder = ['current', '1-30 days', '31-60 days', '61-90 days', '90+ days'];
    const getRank = (key: string) => {
      const idx = preferredOrder.findIndex((k) => k.toLowerCase() === key.toLowerCase());
      return idx === -1 ? 999 : idx;
    };
    return entries
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => getRank(a.label) - getRank(b.label));
  }, [agingBuckets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-primary">Outstanding & Aging</h1>
          <p className="text-xs sm:text-sm text-secondary">Aging buckets and overdue invoice details</p>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credit limit</CardTitle>
            <CardDescription>Your configured credit limit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{formatMoney(creditLimit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Net outstanding</CardTitle>
            <CardDescription>After credits and advances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{formatMoney(netOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available credit</CardTitle>
            <CardDescription>Remaining credit after outstanding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{formatMoney(availableCredit)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aging buckets</CardTitle>
          <CardDescription>Breakdown of outstanding amounts by age</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-secondary">Loading...</div>
          ) : bucketRows.length === 0 ? (
            <div className="text-sm text-secondary">No aging data available.</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {bucketRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                  <div className="text-sm font-medium text-secondary">{row.label}</div>
                  <div className="text-sm font-semibold text-primary">{formatMoney(row.value)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overdue invoices</CardTitle>
          <CardDescription>Invoices with outstanding balance past due date</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface/50 hover:bg-surface/50">
                <TableHead>Invoice</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Days overdue</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-secondary">
                    Loading overdue invoices...
                  </TableCell>
                </TableRow>
              ) : overdueInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-secondary">
                    No overdue invoices.
                  </TableCell>
                </TableRow>
              ) : (
                overdueInvoices.map((inv, idx) => (
                  <TableRow key={`${inv.invoiceNumber ?? idx}-${idx}`}>
                    <TableCell label="Invoice" className="font-medium">{inv.invoiceNumber ?? '—'}</TableCell>
                    <TableCell label="Issued">{formatDate(inv.issueDate)}</TableCell>
                    <TableCell label="Due">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell label="Days">
                      <div className="sm:text-right">{String(inv.daysOverdue ?? 0)}</div>
                    </TableCell>
                    <TableCell label="Outstanding">
                      <div className="sm:text-right font-medium">{formatMoney(inv.outstandingAmount)}</div>
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

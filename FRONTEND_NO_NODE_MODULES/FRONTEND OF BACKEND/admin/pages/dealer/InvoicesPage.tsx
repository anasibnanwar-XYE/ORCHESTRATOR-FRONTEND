import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDealerInvoicePdf, getDealerInvoices } from '../../lib/dealerApi';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { formatDate, formatMoney } from '../../lib/formatUtils';

const statusVariant = (status?: string) => {
  const upper = String(status ?? '').toUpperCase();
  if (!upper) return 'secondary' as const;
  if (upper.includes('PAID')) return 'success' as const;
  if (upper.includes('OVERDUE')) return 'error' as const;
  if (upper.includes('DUE')) return 'warning' as const;
  return 'secondary' as const;
};

export default function DealerInvoicesPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const view = await getDealerInvoices(session);
      setInvoiceCount(view.invoiceCount ?? 0);
      setTotalOutstanding(view.netOutstanding ?? view.totalOutstanding ?? 0);
      setInvoices(view.invoices ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const handleViewPdf = async (invoiceId: number) => {
    if (!session) return;

    const placeholder = window.open('about:blank', '_blank', 'noopener,noreferrer');
    setPdfLoadingId(invoiceId);
    setError(null);

    try {
      const { blob, fileName } = await getDealerInvoicePdf(invoiceId, session);
      const objectUrl = URL.createObjectURL(blob);

      if (placeholder) {
        placeholder.location.href = objectUrl;
        if (fileName) {
          placeholder.document.title = fileName;
        }
      } else {
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
      }

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (e) {
      if (placeholder) {
        placeholder.close();
      }
      setError(e instanceof Error ? e.message : 'Failed to open invoice PDF.');
    } finally {
      setPdfLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-primary">Invoices</h1>
          <p className="text-xs sm:text-sm text-secondary">View your outstanding and paid invoices</p>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice count</CardTitle>
            <CardDescription>Total invoices on your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{invoiceCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total outstanding</CardTitle>
            <CardDescription>Amount currently unpaid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{formatMoney(totalOutstanding)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice list</CardTitle>
          <CardDescription>Most recent invoices first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface/50 hover:bg-surface/50">
                <TableHead>Invoice</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Applied</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-secondary">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-secondary">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell label="Invoice" className="font-medium">
                      {inv.invoiceNumber || `#${inv.id}`}
                    </TableCell>
                    <TableCell label="Issued">{formatDate(inv.issueDate)}</TableCell>
                    <TableCell label="Due">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell label="Status">
                      <Badge variant={statusVariant(inv.status)}>{String(inv.status ?? '—')}</Badge>
                    </TableCell>
                    <TableCell label="Outstanding">
                      <div className="sm:text-right font-medium">{formatMoney(inv.outstandingAmount)}</div>
                    </TableCell>
                    <TableCell label="Applied">
                      <div className="sm:text-right">
                        <div className="font-medium">{formatMoney(inv.appliedAmount)}</div>
                        {inv.advanceApplied && (
                          <div className="text-xs text-secondary">Advance used</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell label="Total">
                      <div className="sm:text-right">{formatMoney(inv.totalAmount)}</div>
                    </TableCell>
                    <TableCell label="PDF">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!session || pdfLoadingId === inv.id}
                          onClick={() => handleViewPdf(inv.id)}
                        >
                          {pdfLoadingId === inv.id ? 'Opening…' : 'View'}
                        </Button>
                      </div>
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

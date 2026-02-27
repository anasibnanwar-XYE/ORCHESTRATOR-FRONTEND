import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import {
  getStockSummary,
  listInventorySnapshots,
  listLowStock,
  type InventoryStockSnapshotDto,
  type StockSummaryDto,
} from '../../lib/factoryApi';

export default function StockOverviewPage() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<StockSummaryDto | null>(null);
  const [lowStock, setLowStock] = useState<InventoryStockSnapshotDto[]>([]);
  const [inventory, setInventory] = useState<InventoryStockSnapshotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    Promise.all([getStockSummary(session), listLowStock(session), listInventorySnapshots(session)])
      .then(([s, low, snaps]) => {
        setSummary(s);
        setLowStock(low);
        setInventory(snaps);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load inventory.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [session]);

  const kpi = useMemo(
    () => [
      { label: 'Total materials', value: String(summary?.totalMaterials ?? 0) },
      { label: 'Low stock', value: String(summary?.lowStockMaterials ?? 0) },
      { label: 'Critical', value: String(summary?.criticalStockMaterials ?? 0) },
      { label: 'Total batches', value: String(summary?.totalBatches ?? 0) },
    ],
    [summary]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-primary">Stock Overview</h2>
          <p className="mt-1 text-sm text-secondary">Stock summary, low-stock items, and snapshots.</p>
        </div>
        <div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary hover:bg-surface-highlight transition-colors"
          >
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-status-error-bg bg-status-error-bg px-4 py-2 text-sm text-status-error-text">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((item) => (
          <article key={item.label} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-tertiary">{item.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-primary">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-tertiary">Inventory</p>
              <h3 className="text-lg font-semibold text-primary">Low Stock</h3>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-secondary">Name</th>
                  <th className="px-3 py-2 font-medium text-secondary">SKU</th>
                  <th className="px-3 py-2 font-medium text-secondary">Stock</th>
                  <th className="px-3 py-2 font-medium text-secondary">Reorder</th>
                  <th className="px-3 py-2 font-medium text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lowStock.map((r) => (
                  <tr key={`${r.sku ?? r.name ?? ''}`} className="hover:bg-surface-highlight transition-colors">
                    <td className="px-3 py-2 font-medium text-primary">{r.name || '-'}</td>
                    <td className="px-3 py-2 text-secondary">{r.sku || '-'}</td>
                    <td className="px-3 py-2 tabular-nums text-primary">{r.currentStock ?? 0}</td>
                    <td className="px-3 py-2 tabular-nums text-primary">{r.reorderLevel ?? 0}</td>
                    <td className="px-3 py-2 text-secondary">{r.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!lowStock.length && (
              <p className="px-3 py-6 text-center text-sm text-secondary">No low-stock items. All good!</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-tertiary">Inventory</p>
              <h3 className="text-lg font-semibold text-primary">All Stock</h3>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-secondary">Name</th>
                  <th className="px-3 py-2 font-medium text-secondary">SKU</th>
                  <th className="px-3 py-2 font-medium text-secondary">Stock</th>
                  <th className="px-3 py-2 font-medium text-secondary">Reorder</th>
                  <th className="px-3 py-2 font-medium text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map((row) => (
                  <tr key={`${row.sku ?? row.name ?? ''}`} className="hover:bg-surface-highlight transition-colors">
                    <td className="px-3 py-2 font-medium text-primary">{row.name || '-'}</td>
                    <td className="px-3 py-2 text-secondary">{row.sku || '-'}</td>
                    <td className="px-3 py-2 tabular-nums text-primary">{row.currentStock ?? 0}</td>
                    <td className="px-3 py-2 tabular-nums text-primary">{row.reorderLevel ?? 0}</td>
                    <td className="px-3 py-2 text-secondary">{row.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!inventory.length && (
              <p className="px-3 py-6 text-center text-sm text-secondary">No stock data available.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

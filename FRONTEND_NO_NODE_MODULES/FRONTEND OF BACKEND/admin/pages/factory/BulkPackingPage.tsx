import { useEffect, useState } from 'react';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { RefreshCw, Package } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import {
  listBulkBatches,
  packFinishedGoods,
  listFinishedGoods,
  type BulkBatchDto,
  type PackRequest,
  type PackLineRequest,
  type FinishedGoodDto,
} from '../../lib/factoryApi';
import { listCatalogProducts, type CatalogProduct } from '../../lib/accountingApi';

interface PackLine extends PackLineRequest {
  key: string;
}

const createLine = (): PackLine => ({
  key: Math.random().toString(36).slice(2),
  childSkuId: 0,
  quantity: 0,
  sizeLabel: '',
});

export default function BulkPackingPage() {
  const { session } = useAuth();
  const [finishedGoods, setFinishedGoods] = useState<FinishedGoodDto[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [bulkBatches, setBulkBatches] = useState<BulkBatchDto[]>([]);
  const [selectedFinishedGoodId, setSelectedFinishedGoodId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BulkBatchDto | null>(null);
  const [form, setForm] = useState<{ packDate: string; lines: PackLine[] }>({
    packDate: new Date().toISOString().split('T')[0],
    lines: [createLine()],
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [fgData, catalogData] = await Promise.all([
        listFinishedGoods(session),
        listCatalogProducts(session),
      ]);
      setFinishedGoods(fgData);
      setCatalogProducts(catalogData);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const loadBulkBatches = async (finishedGoodId: number) => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const batches = await listBulkBatches(finishedGoodId, session);
      setBulkBatches(batches);
      setSelectedFinishedGoodId(finishedGoodId);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load bulk batches');
    } finally {
      setLoading(false);
    }
  };

  const getChildSkus = (finishedGoodId: number): CatalogProduct[] => {
    const fg = finishedGoods.find((fg) => fg.id === finishedGoodId);
    const parentSku = fg?.productCode?.trim();
    if (!parentSku) return [];
    
    // Find child SKUs that have this finished good as parentSku in metadata
    return catalogProducts.filter((product) => {
      const meta = product.metadata as Record<string, unknown> | undefined;
      return meta && typeof meta.parentSku === 'string' && meta.parentSku === parentSku;
    });
  };

  const openPackModal = (batch: BulkBatchDto) => {
    setSelectedBatch(batch);
    const finishedGoodId = batch.finishedGoodId;
    const childSkus = typeof finishedGoodId === 'number' ? getChildSkus(finishedGoodId) : [];
    setForm({
      packDate: new Date().toISOString().split('T')[0],
      lines: childSkus.length > 0 ? [createLine()] : [],
    });
    setModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBatch(null);
    setForm({
      packDate: new Date().toISOString().split('T')[0],
      lines: [createLine()],
    });
    setError(null);
  };

  const addLine = () => {
    setForm({
      ...form,
      lines: [...form.lines, createLine()],
    });
  };

  const removeLine = (key: string) => {
    if (form.lines.length > 1) {
      setForm({
        ...form,
        lines: form.lines.filter((line) => line.key !== key),
      });
    }
  };

  const updateLine = (key: string, field: keyof PackLine, value: string | number) => {
    setForm({
      ...form,
      lines: form.lines.map((line) => {
        if (line.key !== key) return line;
        return { ...line, [field]: value };
      }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedBatch) return;
    if (typeof selectedBatch.id !== 'number') {
      setError('Invalid batch selection');
      return;
    }

    const validLines = form.lines.filter(
      (line) => line.childSkuId > 0 && line.quantity > 0 && !!line.sizeLabel?.trim()
    );

    if (validLines.length === 0) {
      setError('Please add at least one pack line with child SKU, quantity, and size label');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: PackRequest = {
        bulkBatchId: selectedBatch.id,
        packDate: form.packDate || undefined,
        packs: validLines.map((line) => ({
          childSkuId: line.childSkuId,
          quantity: Number(line.quantity),
          sizeLabel: line.sizeLabel?.trim() || undefined,
        })),
      };

      await packFinishedGoods(payload, session);
      setMessage('Bulk batch packed successfully');
      closeModal();
      if (selectedFinishedGoodId) {
        loadBulkBatches(selectedFinishedGoodId);
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to pack batch');
    } finally {
      setSaving(false);
    }
  };

  const childSkus =
    selectedBatch && typeof selectedBatch.finishedGoodId === 'number'
      ? getChildSkus(selectedBatch.finishedGoodId)
      : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Bulk Packing</h1>
          <p className="mt-1 text-sm text-secondary">
            Pack bulk batches into size variants (child SKUs)
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight disabled:opacity-50"
        >
          <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </header>

      {message && (
        <div className="rounded-xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Finished Goods Selection */}
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-primary">Select Finished Good</h2>
            <p className="text-xs text-tertiary">Choose a product to view bulk batches</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-tertiary" />
                <p className="mt-2 text-sm text-secondary">Loading...</p>
              </div>
            ) : finishedGoods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-tertiary" />
                <p className="mt-2 text-sm font-medium text-secondary">No finished goods found</p>
              </div>
            ) : (
	              <div className="space-y-2">
	                {finishedGoods
	                  .filter((fg): fg is FinishedGoodDto & { id: number } => typeof fg.id === 'number')
	                  .map((fg) => (
	                  <button
	                    key={fg.id}
	                    type="button"
	                    onClick={() => loadBulkBatches(fg.id)}
                    className={clsx(
                      'w-full rounded-lg border p-3 text-left transition-colors',
                      selectedFinishedGoodId === fg.id
                        ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/30'
                        : 'border-border bg-surface hover:bg-surface-highlight'
                    )}
                  >
                    <div className="font-medium text-primary">{fg.name || fg.productCode}</div>
	                    {fg.productCode && (
	                      <div className="text-xs text-tertiary">SKU: {fg.productCode}</div>
	                    )}
	                  </button>
	                ))}
	              </div>
	            )}
          </div>
        </div>

        {/* Bulk Batches */}
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-primary">Bulk Batches</h2>
            <p className="text-xs text-tertiary">
              {bulkBatches.length} {bulkBatches.length === 1 ? 'batch' : 'batches'} available
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-tertiary" />
                <p className="mt-2 text-sm text-secondary">Loading batches...</p>
              </div>
            ) : !selectedFinishedGoodId ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-secondary">Select a finished good to view batches</p>
              </div>
            ) : bulkBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-tertiary" />
                <p className="mt-2 text-sm font-medium text-secondary">No bulk batches found</p>
                <p className="mt-1 text-xs text-tertiary">
                  Bulk batches will appear here after production logging
                </p>
              </div>
            ) : (
              <div className="space-y-3">
	                {bulkBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface-highlight"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
	                        <div className="font-semibold text-primary">{batch.batchCode}</div>
	                        <div className="mt-1 text-sm text-secondary">
	                          {batch.finishedGoodName} • {batch.finishedGoodCode ?? '—'}
	                        </div>
	                        <div className="mt-1 text-sm font-medium text-primary">
	                          Quantity: {batch.quantity}
	                        </div>
	                      </div>
                      <button
                        type="button"
                        onClick={() => openPackModal(batch)}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                      >
                        Pack
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pack Modal */}
      <ResponsiveModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={`Pack Bulk Batch: ${selectedBatch?.batchCode || ''}`}
        size="full"
        mobileFullscreen={true}
      >
        <div className="px-6 py-4 border-b border-border">
          {selectedBatch && (
            <p className="mt-1 text-sm text-secondary">
              Available: {selectedBatch.quantity}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary">Pack Date</label>
              <input
                type="date"
                value={form.packDate}
                onChange={(e) => setForm({ ...form, packDate: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-secondary">Pack Lines</label>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  + Add Line
                </button>
              </div>
              {childSkus.length === 0 && (
                <div className="mb-4 rounded-lg border border-transparent bg-status-warning-bg px-4 py-3 text-sm text-status-warning-text">
                  No child SKUs found for this finished good. Ensure child SKUs are configured with parentSku metadata.
                </div>
              )}
              <div className="space-y-3">
                {form.lines.map((line, idx) => (
                  <div key={line.key} className="grid grid-cols-12 gap-2 rounded-lg border border-border p-3">
                    <div className="col-span-12 sm:col-span-4">
                      <select
                        value={line.childSkuId}
                        onChange={(e) => updateLine(line.key, 'childSkuId', Number(e.target.value))}
                        className="block w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value={0}>Child SKU...</option>
                        {childSkus.map((sku) => (
                          <option key={sku.id} value={sku.id}>
                            {sku.productName} ({sku.skuCode}) - {sku.sizeLabel || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <input
                        type="number"
                        step="1"
                        value={line.quantity || ''}
                        onChange={(e) => updateLine(line.key, 'quantity', Number(e.target.value))}
                        placeholder="Quantity"
                        className="block w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-3">
                      <input
                        type="text"
                        value={line.sizeLabel}
                        onChange={(e) => updateLine(line.key, 'sizeLabel', e.target.value)}
                        placeholder="Size Label (e.g., 1L)"
                        className="block w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        disabled={form.lines.length === 1}
                        className="w-full rounded-lg border border-transparent bg-status-error-bg px-2 py-1.5 text-xs font-medium text-status-error-text hover:bg-status-error-bg/80 disabled:opacity-50 touch-manipulation min-h-[36px]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {saving ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  listRawMaterialBatches,
  addRawMaterialBatch,
  intakeRawMaterial,
  type RawMaterialDto,
  type RawMaterialRequest,
  type RawMaterialBatchRequest
} from '../../lib/factoryApi';
import { listSuppliers, type SupplierResponse } from '../../lib/accountingApi';
import {
  Plus,
  Search,
  Trash2,
  PencilLine,
  ArrowDownToLine,
  FlaskConical,
} from 'lucide-react';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { formatDate } from '../../lib/formatUtils';

// Extended type to include fields potentially missing in generated client but used in UI
interface ExtendedRawMaterialRequest extends RawMaterialRequest {
  currentStock?: number;
  materialType?: 'PRODUCTION' | 'PACKAGING';
}

const initialForm: ExtendedRawMaterialRequest = {
  name: '',
  sku: '',
  unitType: 'L',
  currentStock: 0,
  reorderLevel: 100,
  minStock: 50,
  maxStock: 1000,
  stockStatus: 'OK',
  inventoryAccountId: 0,
  materialType: 'PRODUCTION',
} as ExtendedRawMaterialRequest;

// Batch items from API can have flexible shapes
interface RawMaterialBatchItem {
  id?: number;
  batchCode?: string;
  quantity?: number;
  unit?: string;
  costPerUnit?: number;
  createdAt?: string;
}

export default function RawMaterialsPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<RawMaterialDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RawMaterialDto | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [batches, setBatches] = useState<{
    loading: boolean;
    error: string | null;
    items: RawMaterialBatchItem[];
  }>({ loading: false, error: null, items: [] });
  const [q, setQ] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortByQty, setSortByQty] = useState<'asc' | 'desc' | ''>('');
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);

  const [form, setForm] = useState<ExtendedRawMaterialRequest>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [batchForm, setBatchForm] = useState<RawMaterialBatchRequest>({
    batchCode: '',
    quantity: 0,
    unit: 'L',
    costPerUnit: 0,
    supplierId: 0,
    notes: '',
  });

  const [intakeForm, setIntakeForm] = useState({
    batchCode: '',
    quantity: 0,
    unit: 'L',
    costPerUnit: 0,
    supplierId: 0,
    notes: '',
  });

  // Delete confirm state
  const [deletingItem, setDeletingItem] = useState<RawMaterialDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const [materialsData, suppliersData] = await Promise.all([
        listRawMaterials(session),
        listSuppliers(session),
      ]);
      setItems(materialsData);
      setSuppliers(suppliersData);
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Failed to load raw materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const filtered = () => {
    let data = items.filter(
      (r) =>
        (!q ||
          (r.name ?? '').toLowerCase().includes(q.toLowerCase()) ||
          (r.sku ?? '').toLowerCase().includes(q.toLowerCase())) &&
        (!stockFilter || r.stockStatus === stockFilter)
    );

    if (sortByQty) {
      data = data
        .slice()
        .sort((a, b) =>
          sortByQty === 'asc'
            ? (a.currentStock ?? 0) - (b.currentStock ?? 0)
            : (b.currentStock ?? 0) - (a.currentStock ?? 0)
        );
    }
    return data;
  };

  const loadBatches = (id?: number) => {
    if (!id) return;
    setBatches({ loading: true, error: null, items: [] });
    listRawMaterialBatches(id, session)
      .then((rows) =>
        setBatches({ loading: false, error: null, items: rows as RawMaterialBatchItem[] })
      )
      .catch((err: unknown) =>
        setBatches({
          loading: false,
          error: err instanceof Error ? err.message : 'Unable to load batches.',
          items: [],
        })
      );
  };

  useEffect(() => {
    if (selected?.id) loadBatches(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setFormError(null);
    try {
      const apiPayload = { ...form };
      if (isEdit && selected?.id) {
        await updateRawMaterial(selected.id, apiPayload, session);
      } else {
        await createRawMaterial(apiPayload, session);
      }
      setShowModal(false);
      setForm(initialForm);
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save material');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id || !session) return;
    setDeleteLoading(true);
    try {
      await deleteRawMaterial(deletingItem.id, session);
      setDeletingItem(null);
      loadData();
      if (selected?.id === deletingItem.id) setSelected(null);
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Failed to delete material');
      setDeletingItem(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selected?.id) return;
    setFormError(null);
    try {
      await intakeRawMaterial({ rawMaterialId: selected.id, ...intakeForm }, session);
      setShowIntakeModal(false);
      loadData();
      loadBatches(selected.id);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to record intake');
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selected?.id) return;
    setFormError(null);
    try {
      await addRawMaterialBatch(selected.id, batchForm, session);
      setShowBatchModal(false);
      loadBatches(selected.id);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add batch');
    }
  };

  const openEdit = (r: RawMaterialDto) => {
    const extended = r as RawMaterialDto & { materialType?: string };
    setSelected(r);
    setForm({
      name: r.name ?? '',
      sku: r.sku ?? '',
      unitType: r.unitType ?? 'L',
      currentStock: r.currentStock ?? 0,
      reorderLevel: r.reorderLevel ?? 0,
      minStock: r.minStock ?? 0,
      maxStock: r.maxStock ?? 0,
      inventoryAccountId: r.inventoryAccountId ?? 0,
      materialType:
        extended.materialType === 'PACKAGING' ? 'PACKAGING' : 'PRODUCTION',
    } as ExtendedRawMaterialRequest);
    setFormError(null);
    setIsEdit(true);
    setShowModal(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'error' as const;
      case 'LOW':
        return 'warning' as const;
      default:
        return 'success' as const;
    }
  };

  const sortOptions: Array<{ value: '' | 'asc' | 'desc'; label: string }> = [
    { value: '', label: 'Sort by Qty' },
    { value: 'asc', label: 'Low to High' },
    { value: 'desc', label: 'High to Low' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Raw Materials</h1>
          <p className="text-sm text-secondary">Manage inventory and batches</p>
        </div>
        <Button
          onClick={() => {
            setIsEdit(false);
            setForm(initialForm);
            setFormError(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-5 w-5 mr-2" /> New Material
        </Button>
      </div>

      {pageError && (
        <div className="rounded-lg bg-status-error-bg px-4 py-3 text-sm text-status-error-text flex items-center justify-between">
          <span>{pageError}</span>
          <button onClick={() => setPageError(null)} className="ml-4 font-bold hover:opacity-70">
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary" />
          <Input
            type="text"
            className="pl-10"
            placeholder="Search materials..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="LOW">Low Stock</option>
            <option value="CRITICAL">Critical</option>
            <option value="OK">OK</option>
          </select>
          <select
            value={sortByQty}
            onChange={(e) =>
              setSortByQty(e.target.value as '' | 'asc' | 'desc')
            }
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface/50 hover:bg-surface/50">
                    <TableHead>Material</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-secondary">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filtered().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-secondary">
                        No materials found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered().map((r) => {
                      const extended = r as RawMaterialDto & { materialType?: string };
                      return (
                        <TableRow
                          key={r.id}
                          onClick={() => {
                            setSelected(r);
                            if (r.id) loadBatches(r.id);
                          }}
                          className="cursor-pointer"
                        >
                          <TableCell label="Material">
                            <div>
                              <div className="font-medium text-primary">
                                {r.name ?? 'Unnamed'}
                              </div>
                              <div className="text-xs text-secondary">{r.sku ?? 'No SKU'}</div>
                            </div>
                          </TableCell>
                          <TableCell label="Stock">
                            <div className="flex flex-col">
                              <span className="font-medium text-primary">
                                {(r.currentStock ?? 0).toLocaleString()} {r.unitType}
                              </span>
                              <span className="text-xs text-secondary">Min: {r.minStock}</span>
                            </div>
                          </TableCell>
                          <TableCell label="Type">
                            <Badge
                              variant={
                                extended.materialType === 'PACKAGING' ? 'info' : 'secondary'
                              }
                            >
                              {extended.materialType === 'PACKAGING'
                                ? 'Packaging'
                                : 'Production'}
                            </Badge>
                          </TableCell>
                          <TableCell label="Status">
                            <Badge variant={getStatusVariant(r.stockStatus ?? 'OK')}>
                              {r.stockStatus ?? 'OK'}
                            </Badge>
                          </TableCell>
                          <TableCell label="Actions" className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(r);
                                }}
                              >
                                <PencilLine className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingItem(r);
                                }}
                                className="text-status-error-text hover:text-status-error-text hover:bg-status-error-bg/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div>
          {selected ? (
            <Card className="sticky top-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-primary">{selected.name}</h3>
                    <p className="text-sm text-secondary">{selected.sku}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFormError(null);
                        setShowIntakeModal(true);
                      }}
                      title="Quick Intake"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFormError(null);
                        setShowBatchModal(true);
                      }}
                      title="Add Manual Batch"
                    >
                      <FlaskConical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-surface-highlight rounded-lg">
                    <div className="text-xs text-secondary">Current Stock</div>
                    <div className="font-medium text-lg text-primary">
                      {(selected.currentStock ?? 0).toLocaleString()}{' '}
                      <span className="text-sm text-tertiary">{selected.unitType}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-highlight rounded-lg">
                    <div className="text-xs text-secondary">Reorder Level</div>
                    <div className="font-medium text-lg text-primary">{selected.reorderLevel}</div>
                  </div>
                </div>

                <h4 className="font-medium text-sm text-primary mb-3">Recent Batches</h4>
                {batches.loading ? (
                  <div className="text-center py-4 text-sm text-secondary">
                    Loading batches...
                  </div>
                ) : batches.error ? (
                  <div className="text-center py-4 text-sm text-status-error-text">
                    {batches.error}
                  </div>
                ) : batches.items.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg">
                    <p className="text-sm text-secondary">No batches found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {batches.items.map((b, idx) => (
                      <div
                        key={b.id ?? idx}
                        className="p-3 border border-border rounded-lg hover:bg-surface-highlight transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs text-secondary">{b.batchCode}</span>
                          <Badge variant="success">
                            ₹{b.costPerUnit}/{b.unit}
                          </Badge>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-primary">
                            {b.quantity} {b.unit}
                          </span>
                          <span className="text-xs text-tertiary">{formatDate(b.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl">
              <p className="text-sm text-secondary">
                Select a material to view details and batches
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEdit ? 'Edit Material' : 'New Material'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
              {formError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="SKU (auto if blank)"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Unit</label>
              <select
                value={form.unitType}
                onChange={(e) => setForm({ ...form, unitType: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-primary"
              >
                <option value="L">Liters</option>
                <option value="KG">Kilograms</option>
                <option value="PCS">Pieces</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Type</label>
              <select
                value={form.materialType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    materialType: e.target.value as 'PRODUCTION' | 'PACKAGING',
                  })
                }
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-primary"
              >
                <option value="PRODUCTION">Production</option>
                <option value="PACKAGING">Packaging</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Reorder Level"
              type="number"
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
            />
            <Input
              label="Min Stock"
              type="number"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
            />
            <Input
              label="Max Stock"
              type="number"
              value={form.maxStock}
              onChange={(e) => setForm({ ...form, maxStock: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Intake Modal */}
      <ResponsiveModal
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        title="Quick Intake"
        size="md"
      >
        <form onSubmit={handleIntake} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
              {formError}
            </div>
          )}
          <Input
            label="Batch Code (Optional)"
            value={intakeForm.batchCode}
            onChange={(e) => setIntakeForm({ ...intakeForm, batchCode: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Quantity"
              type="number"
              value={intakeForm.quantity}
              onChange={(e) =>
                setIntakeForm({ ...intakeForm, quantity: Number(e.target.value) })
              }
              required
            />
            <Input
              label="Cost/Unit"
              type="number"
              value={intakeForm.costPerUnit}
              onChange={(e) =>
                setIntakeForm({ ...intakeForm, costPerUnit: Number(e.target.value) })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Supplier</label>
            <select
              value={intakeForm.supplierId}
              onChange={(e) =>
                setIntakeForm({ ...intakeForm, supplierId: Number(e.target.value) })
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-primary"
            >
              <option value={0}>Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowIntakeModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Record Intake</Button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Batch Modal */}
      <ResponsiveModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="Add Manual Batch"
        size="md"
      >
        <form onSubmit={handleBatchSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
              {formError}
            </div>
          )}
          <Input
            label="Batch Code"
            value={batchForm.batchCode}
            onChange={(e) => setBatchForm({ ...batchForm, batchCode: e.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Quantity"
              type="number"
              value={batchForm.quantity}
              onChange={(e) =>
                setBatchForm({ ...batchForm, quantity: Number(e.target.value) })
              }
              required
            />
            <Input
              label="Cost/Unit"
              type="number"
              value={batchForm.costPerUnit}
              onChange={(e) =>
                setBatchForm({ ...batchForm, costPerUnit: Number(e.target.value) })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Supplier</label>
            <select
              value={batchForm.supplierId}
              onChange={(e) =>
                setBatchForm({ ...batchForm, supplierId: Number(e.target.value) })
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-primary"
            >
              <option value={0}>Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowBatchModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Batch</Button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        description={`Delete "${deletingItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

import { Fragment, useEffect, useState } from 'react';
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
import { Dialog, Transition } from '@headlessui/react';
import { 
    PlusIcon, 
    MagnifyingGlassIcon, 
    TrashIcon, 
    PencilSquareIcon, 
    InboxArrowDownIcon, 
    BeakerIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import clsx from 'clsx';
import { formatDate, formatNumber } from '../../lib/formatUtils';

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
    materialType: 'PRODUCTION'
} as any;

export default function RawMaterialsPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<RawMaterialDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RawMaterialDto | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [batches, setBatches] = useState<{ loading: boolean; error: string | null; items: any[] }>({ loading: false, error: null, items: [] });
  const [q, setQ] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortByQty, setSortByQty] = useState<'asc' | 'desc' | ''>('');
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);

  const [form, setForm] = useState<ExtendedRawMaterialRequest>(initialForm);

  const [batchForm, setBatchForm] = useState<RawMaterialBatchRequest>({
    batchCode: '',
    quantity: 0,
    unit: 'L',
    costPerUnit: 0,
    supplierId: 0,
    notes: ''
  });

  const [intakeForm, setIntakeForm] = useState({
    batchCode: '',
    quantity: 0,
    unit: 'L',
    costPerUnit: 0,
    supplierId: 0,
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
        const [materialsData, suppliersData] = await Promise.all([
            listRawMaterials(session),
            listSuppliers(session)
        ]);
        setItems(materialsData);
        setSuppliers(suppliersData);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [session]);

  const filtered = () => {
    let data = items.filter((r) => (!q || (r.name || '').toLowerCase().includes(q.toLowerCase()) || (r.sku || '').toLowerCase().includes(q.toLowerCase())) && (!stockFilter || r.stockStatus === stockFilter));

    if (sortByQty) {
      data = data.slice().sort((a, b) => (sortByQty === 'asc' ? (a.currentStock || 0) - (b.currentStock || 0) : (b.currentStock || 0) - (a.currentStock || 0)));
    }
    return data;
  };

  const loadBatches = (id?: number) => {
    if (!id) return;
    setBatches({ loading: true, error: null, items: [] });
    listRawMaterialBatches(id, session)
      .then((rows) => setBatches({ loading: false, error: null, items: rows }))
      .catch((err) => setBatches({ loading: false, error: err instanceof Error ? err.message : 'Unable to load batches.', items: [] }));
  };

  useEffect(() => { if (selected?.id) loadBatches(selected.id); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selected?.id, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const apiPayload = { ...form };
      
      if (isEdit && selected && selected.id) {
        await updateRawMaterial(selected.id, apiPayload, session);
      } else {
        await createRawMaterial(apiPayload, session);
      }
      setShowModal(false);
      setForm(initialForm);
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (r: RawMaterialDto) => {
    if (!r.id || !confirm(`Delete ${r.name}?`) || !session) return;
    try {
      await deleteRawMaterial(r.id, session);
      loadData();
      if (selected?.id === r.id) setSelected(null);
    } catch (e) { console.error(e); }
  };

  const handleIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selected || !selected.id) return;
    try {
      await intakeRawMaterial({ rawMaterialId: selected.id, ...intakeForm }, session);
      setShowIntakeModal(false);
      loadData();
      loadBatches(selected.id);
    } catch (e) { console.error(e); }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selected || !selected.id) return;
    try {
      // Cast batchForm to any to bypass strict checks on supplier vs supplierId for now
      await addRawMaterialBatch(selected.id, batchForm as any, session);
      setShowBatchModal(false);
      loadBatches(selected.id);
    } catch (e) { console.error(e); }
  };

  const openEdit = (r: RawMaterialDto) => {
    const raw = r as any;
    setSelected(r);
    setForm({
      name: r.name || '',
      sku: r.sku || '',
      unitType: r.unitType || 'L',
      currentStock: r.currentStock || 0,
      reorderLevel: r.reorderLevel || 0,
      minStock: r.minStock || 0,
      maxStock: r.maxStock || 0,
      inventoryAccountId: r.inventoryAccountId || 0,
      materialType: raw.materialType || 'PRODUCTION'
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const getStatusVariant = (status: string) => {
      switch (status) {
          case 'CRITICAL': return 'error';
          case 'LOW': return 'warning';
          default: return 'success';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Raw Materials</h1>
          <p className="text-sm text-secondary">Manage inventory and batches</p>
        </div>
        <Button onClick={() => { setIsEdit(false); setForm(initialForm); setShowModal(true); }}>
          <PlusIcon className="h-5 w-5 mr-2" /> New Material
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary" />
          <Input
            type="text"
            className="pl-10"
            placeholder="Search materials..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">All Status</option>
            <option value="LOW">Low Stock</option>
            <option value="CRITICAL">Critical</option>
            <option value="OK">OK</option>
          </select>
          <select value={sortByQty} onChange={(e) => setSortByQty(e.target.value as any)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Sort by Qty</option>
            <option value="asc">Low to High</option>
            <option value="desc">High to Low</option>
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
                    {filtered().map((r) => {
                        const raw = r as any;
                        return (
                        <TableRow key={r.id} onClick={() => { setSelected(r); if (r.id) loadBatches(r.id); }} className="cursor-pointer">
                            <TableCell label="Material">
                                <div>
                                    <div className="font-medium text-primary">{r.name || 'Unnamed'}</div>
                                    <div className="text-xs text-secondary">{r.sku || 'No SKU'}</div>
                                </div>
                            </TableCell>
                            <TableCell label="Stock">
                                <div className="flex flex-col">
                                    <span className="font-medium text-primary">{(r.currentStock || 0).toLocaleString()} {r.unitType}</span>
                                    <span className="text-xs text-secondary">Min: {r.minStock}</span>
                                </div>
                            </TableCell>
                            <TableCell label="Type">
                                <Badge variant={raw.materialType === 'PACKAGING' ? 'info' : 'secondary'}>
                                    {raw.materialType === 'PACKAGING' ? 'Packaging' : 'Production'}
                                </Badge>
                            </TableCell>
                            <TableCell label="Status">
                                <Badge variant={getStatusVariant(r.stockStatus || 'OK')}>
                                    {r.stockStatus || 'OK'}
                                </Badge>
                            </TableCell>
                            <TableCell label="Actions" className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
                                        <PencilSquareIcon className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(r); }} className="text-status-error-text hover:text-status-error-text hover:bg-status-error-bg/20">
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                        );
                    })}
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
                    <Button size="sm" variant="outline" onClick={() => setShowIntakeModal(true)}>
                      <InboxArrowDownIcon className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowBatchModal(true)}>
                      <BeakerIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-surface-highlight rounded-lg">
                    <div className="text-xs text-secondary">Current Stock</div>
                    <div className="font-medium text-lg text-primary">{(selected.currentStock || 0).toLocaleString()} <span className="text-sm text-tertiary">{selected.unitType}</span></div>
                  </div>
                  <div className="p-3 bg-surface-highlight rounded-lg">
                    <div className="text-xs text-secondary">Reorder Level</div>
                    <div className="font-medium text-lg text-primary">{selected.reorderLevel}</div>
                  </div>
                </div>

                <h4 className="font-medium text-sm text-primary mb-3">Recent Batches</h4>
                {batches.loading ? (
                  <div className="text-center py-4 text-sm text-secondary">Loading batches...</div>
                ) : batches.items.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg">
                    <p className="text-sm text-secondary">No batches found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {batches.items.map((b) => (
                      <div key={b.id} className="p-3 border border-border rounded-lg hover:bg-surface-highlight transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs text-secondary">{b.batchCode}</span>
                          <Badge variant="success">₹{b.costPerUnit}/{b.unit}</Badge>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-primary">{b.quantity} {b.unit}</span>
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
              <p className="text-sm text-secondary">Select a material to view details and batches</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Transition show={showModal} as={Fragment}>
        <Dialog onClose={() => setShowModal(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-background border border-border p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-lg font-semibold text-primary">{isEdit ? 'Edit Material' : 'New Material'}</Dialog.Title>
                        <button onClick={() => setShowModal(false)}><XMarkIcon className="h-5 w-5 text-secondary" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            <Input label="SKU (auto if blank)" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Unit</label>
                                <select value={form.unitType} onChange={e => setForm({ ...form, unitType: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-primary">
                                    <option value="L">Liters</option>
                                    <option value="KG">Kilograms</option>
                                    <option value="PCS">Pieces</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Type</label>
                                <select value={(form as any).materialType} onChange={e => setForm({ ...form, materialType: e.target.value } as any)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-primary">
                                    <option value="PRODUCTION">Production</option>
                                    <option value="PACKAGING">Packaging</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Input label="Reorder Level" type="number" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: Number(e.target.value) })} />
                            <Input label="Min Stock" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} />
                            <Input label="Max Stock" type="number" value={form.maxStock} onChange={e => setForm({ ...form, maxStock: Number(e.target.value) })} />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit">{isEdit ? 'Update' : 'Create'}</Button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
      </Transition>

      {/* Intake Modal */}
      <Transition show={showIntakeModal} as={Fragment}>
        <Dialog onClose={() => setShowIntakeModal(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-background border border-border p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-semibold text-primary mb-4">Quick Intake</Dialog.Title>
                    <form onSubmit={handleIntake} className="space-y-4">
                        <Input label="Batch Code (Optional)" value={intakeForm.batchCode} onChange={e => setIntakeForm({ ...intakeForm, batchCode: e.target.value })} />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Quantity" type="number" value={intakeForm.quantity} onChange={e => setIntakeForm({ ...intakeForm, quantity: Number(e.target.value) })} required />
                            <Input label="Cost/Unit" type="number" value={intakeForm.costPerUnit} onChange={e => setIntakeForm({ ...intakeForm, costPerUnit: Number(e.target.value) })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Supplier</label>
                            <select value={intakeForm.supplierId} onChange={e => setIntakeForm({ ...intakeForm, supplierId: Number(e.target.value) })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-primary">
                                <option value={0}>Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="secondary" onClick={() => setShowIntakeModal(false)}>Cancel</Button>
                            <Button type="submit">Record Intake</Button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
      </Transition>

      {/* Batch Modal */}
      <Transition show={showBatchModal} as={Fragment}>
        <Dialog onClose={() => setShowBatchModal(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-background border border-border p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-semibold text-primary mb-4">Add Manual Batch</Dialog.Title>
                    <form onSubmit={handleBatchSubmit} className="space-y-4">
                        <Input label="Batch Code" value={batchForm.batchCode} onChange={e => setBatchForm({ ...batchForm, batchCode: e.target.value })} required />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Quantity" type="number" value={batchForm.quantity} onChange={e => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })} required />
                            <Input label="Cost/Unit" type="number" value={batchForm.costPerUnit} onChange={e => setBatchForm({ ...batchForm, costPerUnit: Number(e.target.value) })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Supplier</label>
                            <select value={batchForm.supplierId} onChange={e => setBatchForm({ ...batchForm, supplierId: Number(e.target.value) })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-primary">
                                <option value={0}>Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="secondary" onClick={() => setShowBatchModal(false)}>Cancel</Button>
                            <Button type="submit">Add Batch</Button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
      </Transition>
    </div>
  );
}

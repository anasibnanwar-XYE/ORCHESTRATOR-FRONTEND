import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon, FunnelIcon, CalendarIcon, ChevronRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import {
  createProductionLog,
  getProductionLog,
  listProductionBrands,
  listProductionLogs,
  listRawMaterials,
  listBrandProducts,
  type ProductionBrandDto,
  type ProductionLogDetailDto,
  type ProductionLogDto,
  type ProductionLogRequest,
  type RawMaterialDto,
  type ProductionProductCatalogDto
} from '../../lib/factoryApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormSelect } from '../../design-system/ResponsiveForm';
import SearchableCombobox, { type ComboboxOption } from '../../components/SearchableCombobox';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { formatDate } from '../../lib/formatUtils';

export default function ProductionBatchesPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ProductionLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ProductionLogDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [brands, setBrands] = useState<ProductionBrandDto[]>([]);
  const [products, setProducts] = useState<ProductionProductCatalogDto[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialDto[]>([]);
  const [rawMap, setRawMap] = useState<Map<number, RawMaterialDto>>(new Map());

  // Form State
  const [form, setForm] = useState<ProductionLogRequest>({
    producedAt: new Date().toISOString().split('T')[0],
    brandId: 0,
    productId: 0,
    batchColour: '',
    batchSize: 0,
    unitOfMeasure: 'L',
    mixedQuantity: 0,
    materials: [],
    addToFinishedGoods: true,
  });

  // Helper for materials in form
  interface MaterialUsageLine {
    rawMaterialId: number;
    quantity: number;
    unitOfMeasure: string;
    name?: string; // for display UI
  }

  const [materials, setMaterials] = useState<MaterialUsageLine[]>([]);

  useEffect(() => {
    if (session) {
      loadLogs();
      // Load reference data
      listProductionBrands(session).then(d => setBrands(d || [])).catch(() => console.error('Unable to load brands.'));
      listRawMaterials(session, 'PRODUCTION')
        .then((data: any) => {
          setRawMaterials(data);
          const map = new Map<number, RawMaterialDto>();
          data.forEach((item: RawMaterialDto) => {
            if (typeof item.id === 'number') {
              map.set(item.id, item);
            }
          });
          setRawMap(map);
        })
        .catch(() => console.error('Unable to load raw materials.'));
    }
  }, [session]);

  useEffect(() => {
    // Whenever materials state changes, sync to form
    setForm(prev => ({
      ...prev,
      materials: materials.map(m => ({
        rawMaterialId: m.rawMaterialId,
        quantity: m.quantity,
        unitOfMeasure: m.unitOfMeasure,
      }))
    }));
  }, [materials]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await listProductionLogs(session);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLog = async (log: ProductionLogDto) => {
    // Cast log.id to number just in case
    const logId = Number((log as any).id);
    if (!logId) return;

    setDetailLoading(true);
    try {
      const detail = await getProductionLog(logId, session);
      setSelectedLog(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handlers for Form
  const handleBrandChange = async (brandIdStr: string) => {
    const brandId = parseInt(brandIdStr);
    setForm(prev => ({ ...prev, brandId, productId: 0, unitOfMeasure: 'L' }));
    setProducts([]);

    if (brandId) {
      try {
        const prods = await listBrandProducts(brandId, session);
        setProducts(prods || []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleProductChange = (prodIdStr: string) => {
    const prodId = parseInt(prodIdStr);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setForm(prev => ({
        ...prev,
        productId: prodId,
        // Default UOM from product if available or fallback L
        unitOfMeasure: prod.unitOfMeasure || 'L'
      }));
    }
  }

  const addMaterialLine = () => {
    setMaterials([...materials, { rawMaterialId: 0, quantity: 0, unitOfMeasure: 'kg' }]);
  }

  const updateMaterialLine = (idx: number, field: keyof MaterialUsageLine, val: any) => {
    const copy = [...materials];
    const item = copy[idx];
    (item as any)[field] = val;

    if (field === 'rawMaterialId') {
      const rm = rawMap.get(Number(val));
      if (rm) {
        item.name = rm.name;
        item.unitOfMeasure = rm.unitType || 'kg';
      }
    }
    setMaterials(copy);
  }

  const removeMaterialLine = (idx: number) => {
    const copy = [...materials];
    copy.splice(idx, 1);
    setMaterials(copy);
  }

  const handleSubmit = async () => {
    const payload: ProductionLogRequest = {
      ...form,
      mixedQuantity: form.mixedQuantity || form.batchSize,
      materials: materials.map((m) => ({
        rawMaterialId: m.rawMaterialId,
        quantity: m.quantity,
        unitOfMeasure: m.unitOfMeasure,
      })),
    };

    if (!payload.brandId || !payload.productId || !payload.batchSize || !payload.mixedQuantity) {
      alert('Please fill required fields (Brand, Product, Output Quantity)');
      return;
    }
    if (!payload.materials?.length) {
      alert('Please add at least 1 raw material usage line.');
      return;
    }
    const invalidMaterial = payload.materials.find((m) => !m.rawMaterialId || m.rawMaterialId <= 0 || !m.quantity || m.quantity <= 0);
    if (invalidMaterial) {
      alert('Please select a raw material and enter a positive quantity for every line.');
      return;
    }

    try {
      await createProductionLog(payload, session);
      setShowModal(false);
      loadLogs();
      // Reset
      setForm({
        producedAt: new Date().toISOString().split('T')[0],
        brandId: 0,
        productId: 0,
        batchColour: '',
        batchSize: 0,
        unitOfMeasure: 'L',
        mixedQuantity: 0,
        materials: [],
        addToFinishedGoods: true
      });
      setMaterials([]);
    } catch (e: any) {
      alert('Failed to log batch: ' + e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Production Batches</h1>
          <p className="mt-1 text-sm text-secondary">Track production logs and material usage</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Log Batch
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface/50 hover:bg-surface/50">
                    <TableHead>Batch Code</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-secondary">Loading...</TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-secondary">No production logs found</TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => {
                      const l = log as any; // Cast for missing props
                      return (
                        <TableRow key={l.id} onClick={() => handleSelectLog(l)} className="cursor-pointer hover:bg-surface/50 transition-colors">
                          <TableCell label="Batch Code" className="font-mono font-medium text-primary">{l.productionCode}</TableCell>
                          <TableCell label="Product">
                            <div>
                              <div className="font-medium text-primary">{l.productName}</div>
                              <div className="text-xs text-secondary">{l.brandName}</div>
                            </div>
                          </TableCell>
                          <TableCell label="Size">
                            <span className="text-primary">{l.mixedQuantity || l.batchSize} {l.unitOfMeasure}</span>
                          </TableCell>
                          <TableCell label="Date" className="text-secondary">{formatDate(l.producedAt)}</TableCell>
                          <TableCell label="Action" className="text-right">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleSelectLog(l); }}>
                              <ChevronRightIcon className="h-4 w-4" />
                            </Button>
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
          {selectedLog ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>{selectedLog.productName}</CardTitle>
                <p className="text-sm text-secondary font-mono">{selectedLog.productionCode}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-surface-highlight rounded-lg border border-border">
                      <p className="text-xs text-secondary uppercase mb-1">Output</p>
                      <div className="text-xl font-semibold text-primary">{selectedLog.mixedQuantity} <span className="text-sm font-normal text-secondary">{selectedLog.unitOfMeasure}</span></div>
                    </div>
                    <div className="p-3 bg-surface-highlight rounded-lg border border-border">
                      <p className="text-xs text-secondary uppercase mb-1">Date</p>
                      <div className="text-lg font-bold text-primary">{formatDate(selectedLog.producedAt)}</div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectedLog.id && navigate(`/factory/packing-queue?logId=${selectedLog.id}`)}
                  >
                    Go to Packing Queue
                  </Button>

                  {(selectedLog as any).finishedGoodBatchCode && (
                    <div className="p-3 border border-border rounded-lg bg-surface/30">
                      <p className="text-xs text-secondary uppercase mb-1">Linked Batch</p>
                      <p className="text-sm font-mono text-primary flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {(selectedLog as any).finishedGoodBatchCode}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <span>Material Usage</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">{selectedLog.materials?.length || 0}</Badge>
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {selectedLog.materials?.map((mat, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2.5 bg-surface rounded-md border border-border/50">
                          <span className="text-primary font-medium">{(mat as any).materialName || (mat as any).name}</span>
                          <span className="font-mono text-secondary">{(mat as any).quantity} {(mat as any).unitOfMeasure || (mat as any).unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-surface/20 min-h-[400px]">
              <CalendarIcon className="w-12 h-12 text-tertiary mb-2 opacity-50" />
              <p className="text-sm text-secondary">Select a log from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      <ResponsiveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Log Production Batch"
        size="xl"
      >
        <ResponsiveForm onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Production Date"
              type="date"
              value={form.producedAt}
              onChange={(e) => setForm({ ...form, producedAt: e.target.value })}
              required
            />
            <FormInput
              label={`Output Quantity (${form.unitOfMeasure || 'UNIT'})`}
              type="number"
              value={form.batchSize}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setForm({ ...form, batchSize: value, mixedQuantity: value });
              }}
              placeholder="e.g. 1000"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-secondary">Brand</label>
              <select
                className="w-full p-2 rounded-md border border-border bg-surface text-primary"
                value={form.brandId}
                onChange={(e) => handleBrandChange(e.target.value)}
              >
                <option value={0}>Select Brand...</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-secondary">Product</label>
              <select
                className="w-full p-2 rounded-md border border-border bg-surface text-primary"
                value={form.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                disabled={!form.brandId}
              >
                <option value={0}>Select Product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.productName} ({p.skuCode})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-primary">Material Usage</h3>
              <Button type="button" size="sm" variant="secondary" onClick={addMaterialLine}>
                <PlusIcon className="w-4 h-4 mr-1" /> Add Material
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {materials.map((line, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-surface p-2 rounded border border-border/50">
                  <div className="flex-1">
                    <SearchableCombobox
                      value={line.rawMaterialId ? { id: line.rawMaterialId, label: rawMap.get(line.rawMaterialId)?.name || '', subLabel: '' } : null}
                      onChange={(opt) => updateMaterialLine(idx, 'rawMaterialId', opt?.id || 0)}
                      options={rawMaterials.map(rm => ({ id: rm.id || 0, label: rm.name || 'Unknown', subLabel: rm.sku || '' }))}
                      placeholder="Select Material"
                      className="w-full"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateMaterialLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="h-[42px]" // Match combobox height roughly
                    />
                  </div>
                  <div className="w-16 flex items-center justify-center h-[42px] text-sm text-secondary">
                    {line.unitOfMeasure}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-[42px] w-[42px] p-0"
                    onClick={() => removeMaterialLine(idx)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {materials.length === 0 && (
                <p className="text-center text-secondary text-sm italic py-4">No materials added yet.</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.addToFinishedGoods}
                onChange={(e) => setForm({ ...form, addToFinishedGoods: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-primary">Automatically add to Finished Goods inventory</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Log Production</Button>
          </div>
        </ResponsiveForm>
      </ResponsiveModal>
    </div>
  );
}

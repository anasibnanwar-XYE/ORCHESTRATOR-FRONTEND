import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listUnpackedBatches,
  createPackingRecord,
  completePackingForLog,
  getPackingHistory,
  type UnpackedBatchDto,
  type PackingRecordDto,
  type PackingRequest,
} from '../../lib/factoryApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormSelect } from '../../design-system/ResponsiveForm';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { CheckCircleIcon, CubeIcon, ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { formatDate } from '../../lib/formatUtils';

// Extended type for potentially missing properties
interface ExtendedUnpackedBatchDto extends UnpackedBatchDto {
    productionCode?: string;
    productionLogId?: number; // Might be missing/renamed
    brandName?: string;
    unitOfMeasure?: string;
}

export default function PackingQueuePage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedLogId = searchParams.get('logId');
  const requestedLogIdNum = requestedLogId ? Number(requestedLogId) : undefined;
  const [batches, setBatches] = useState<ExtendedUnpackedBatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<ExtendedUnpackedBatchDto | null>(null);
  const [showPackModal, setShowPackModal] = useState(false);
  const [history, setHistory] = useState<PackingRecordDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [packForm, setPackForm] = useState({
    productionLogId: 0,
    packagingSize: '1L',
    quantityLiters: 0,
    piecesCount: 0,
    boxesCount: 0,
    piecesPerBox: 6,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await listUnpackedBatches(session);
      setBatches(data as ExtendedUnpackedBatchDto[]);
    } catch (err) {
      console.error('Failed to load packing queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [session]);

  useEffect(() => {
    if (!requestedLogIdNum || batches.length === 0) return;
    const match = batches.find((batch) => {
      const id = (batch as any).id ?? batch.productionLogId;
      return id === requestedLogIdNum;
    });
    if (match) {
      handleSelectBatch(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedLogIdNum, batches]);

  const handleSelectBatch = async (batch: ExtendedUnpackedBatchDto) => {
    setSelectedBatch(batch);
    // Use productionLogId or derive from something if missing. 
    // Assuming backend DTO has ID even if named differently, casting to any might reveal 'id' or similar
    const logId = (batch as any).id || batch.productionLogId; 
    
    if (logId) {
        setHistoryLoading(true);
        try {
            const historyData = await getPackingHistory(logId, session);
            setHistory(historyData);
        } catch (err) {
            console.error('Failed to load history', err);
        } finally {
            setHistoryLoading(false);
        }
    }
  };

  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    
    const logId = (selectedBatch as any).id || selectedBatch.productionLogId;
    if (!logId) {
        setError("Invalid batch selection");
        return;
    }

	    setSubmitting(true);
	    setError(null);
	    try {
	      const payload: PackingRequest = {
	        productionLogId: logId,
	        packedDate: new Date().toISOString().split('T')[0],
	        lines: [
	          {
	            packagingSize: packForm.packagingSize,
	            quantityLiters: packForm.quantityLiters,
	            piecesCount: packForm.piecesCount,
	            boxesCount: packForm.boxesCount,
	            piecesPerBox: packForm.piecesPerBox,
	          },
	        ],
	      };
	      await createPackingRecord(payload, session);
	      setShowPackModal(false);
	      // Refresh history and batches
	      handleSelectBatch(selectedBatch);
	      loadBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record packing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedBatch || !confirm('Mark this batch as fully packed? This will remove it from the queue.')) return;
    
    const logId = (selectedBatch as any).id || selectedBatch.productionLogId;
    if (!logId) return;

    try {
      await completePackingForLog(logId, session);
      setSelectedBatch(null);
      loadBatches();
    } catch (err) {
      console.error(err);
      setError('Failed to complete batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Packing Queue</h1>
          <p className="mt-1 text-sm text-secondary">Process unpacked production batches</p>
        </div>
        <Button variant="outline" onClick={loadBatches}>
          Refresh Queue
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
                    <TableHead>Produced</TableHead>
                    <TableHead>Packed</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-secondary">Loading queue...</TableCell>
                    </TableRow>
                  ) : batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-secondary">No pending batches</TableCell>
                    </TableRow>
                  ) : (
                    batches.map((batch) => (
                      <TableRow 
                        key={(batch as any).id || batch.productionCode} 
                        onClick={() => handleSelectBatch(batch)}
                        className={clsx("cursor-pointer", selectedBatch === batch && "bg-surface-highlight")}
                      >
                        <TableCell label="Batch Code">
                            <span className="font-mono font-medium text-primary">{batch.productionCode}</span>
                        </TableCell>
                        <TableCell label="Product">
                            <div>
                                <div className="font-medium text-primary">{batch.productName}</div>
                                <div className="text-xs text-secondary">{batch.brandName}</div>
                            </div>
                        </TableCell>
                        <TableCell label="Produced">
                            <span className="text-primary">
                              {batch.mixedQuantity ?? 0} {batch.unitOfMeasure || 'UNIT'}
                            </span>
                        </TableCell>
                        <TableCell label="Packed">
                            <span className="text-secondary">
                              {batch.packedQuantity ?? 0} {batch.unitOfMeasure || 'UNIT'}
                            </span>
                        </TableCell>
                        <TableCell label="Action" className="text-right">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleSelectBatch(batch); }}>
                                Select
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div>
          {selectedBatch ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>{selectedBatch.productName}</CardTitle>
                <p className="text-sm text-secondary font-mono">{selectedBatch.productionCode}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                    <div className="p-4 bg-surface-highlight rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-xs text-secondary uppercase tracking-wider">Produced Qty</p>
                            <p className="text-xl font-bold text-primary">
                              {selectedBatch.mixedQuantity ?? 0} {selectedBatch.unitOfMeasure || 'UNIT'}
                            </p>
                        </div>
                        <CubeIcon className="h-8 w-8 text-tertiary" />
                    </div>

                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => setShowPackModal(true)}>
                            Record Packing
                        </Button>
                        <Button variant="outline" onClick={handleComplete}>
                            <CheckCircleIcon className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-semibold text-primary mb-3">Packing History</h4>
                        {historyLoading ? (
                            <p className="text-sm text-secondary text-center">Loading history...</p>
                        ) : history.length === 0 ? (
                            <p className="text-sm text-secondary text-center italic">No packing records yet</p>
                        ) : (
                            <div className="space-y-3">
                                {history.map((rec) => {
                                    const r = rec as any; // Cast for safety
                                    return (
                                        <div key={rec.id} className="p-3 rounded-lg border border-border bg-surface text-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-primary">{formatDate(rec.packedDate)}</span>
                                                <span className="text-xs text-tertiary">{rec.packedBy}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-secondary">
                                                {r.totalQuantityLiters && <div>{r.totalQuantityLiters} L</div>}
                                                {r.totalPieces && <div>{r.totalPieces} Pcs</div>}
                                                {r.totalBoxes && <div>{r.totalBoxes} Boxes</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl">
              <CubeIcon className="w-12 h-12 text-tertiary mb-2" />
              <p className="text-sm text-secondary">Select a batch to start packing</p>
            </div>
          )}
        </div>
      </div>

      <ResponsiveModal
        isOpen={showPackModal}
        onClose={() => setShowPackModal(false)}
        title="Record Packing"
      >
        <ResponsiveForm onSubmit={handlePackSubmit}>
            <FormSelect 
                label="Packaging Size"
                value={packForm.packagingSize}
                onChange={e => setPackForm({...packForm, packagingSize: e.target.value})}
                options={[
                    { value: '1L', label: '1 Liter' },
                    { value: '4L', label: '4 Liters' },
                    { value: '10L', label: '10 Liters' },
                    { value: '20L', label: '20 Liters' },
                    { value: '200L', label: '200 Liters (Drum)' }
                ]}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormInput 
                    label="Pieces Count"
                    type="number"
                    value={packForm.piecesCount}
                    onChange={e => setPackForm({...packForm, piecesCount: Number(e.target.value)})}
                />
                <FormInput 
                    label="Boxes Count"
                    type="number"
                    value={packForm.boxesCount}
                    onChange={e => setPackForm({...packForm, boxesCount: Number(e.target.value)})}
                />
            </div>
            <FormInput 
                label="Total Volume (Liters)"
                type="number"
                value={packForm.quantityLiters}
                onChange={e => setPackForm({...packForm, quantityLiters: Number(e.target.value)})}
                required
            />
            
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowPackModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Record'}
                </Button>
            </div>
        </ResponsiveForm>
      </ResponsiveModal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { TruckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { listGoodsReceipts, type GoodsReceiptResponse } from '../../lib/purchasingApi';

export default function GoodsReceiptPage() {
    const { session } = useAuth();
    const [receipts, setReceipts] = useState<GoodsReceiptResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [session]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await listGoodsReceipts(session);
            setReceipts(data || []);
        } catch (err) {
            console.error('Failed to load goods receipts', err);
            setError('Failed to load goods receipts');
            setReceipts([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Goods Receipts (GRN)</h1>
                    <p className="text-sm text-secondary">View incoming inventory and shipments</p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-status-error-text/20 bg-status-error-bg p-4 text-sm text-status-error-text">
                    {error}
                </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full p-6 text-center text-secondary">Loading receipts...</div>
                ) : receipts.length === 0 ? (
                    <div className="col-span-full p-6 text-center text-secondary">No goods receipts found. GRNs are created when you record a purchase order.</div>
                ) : (
                    receipts.map((grn) => (
                        <div key={grn.id} className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-start justify-between">
                                <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                    <TruckIcon className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-secondary">{grn.receiptDate}</span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold text-primary">{grn.receiptNumber}</h3>
                                <p className="text-sm text-secondary">{grn.supplierName || `Supplier #${grn.supplierId}`}</p>
                                {grn.purchaseOrderNumber && (
                                    <p className="text-xs text-tertiary mt-1">PO: {grn.purchaseOrderNumber}</p>
                                )}
                            </div>
                            <div className="mt-4 border-t border-border pt-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-secondary">Items Received</span>
                                    <span className="font-medium text-primary">{grn.lines.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Total Amount</span>
                                    <span className="font-medium text-primary tabular-nums">₹ {(grn.totalAmount || 0).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                                <span className="text-xs text-status-success-text font-medium">
                                    {grn.status || 'Received'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

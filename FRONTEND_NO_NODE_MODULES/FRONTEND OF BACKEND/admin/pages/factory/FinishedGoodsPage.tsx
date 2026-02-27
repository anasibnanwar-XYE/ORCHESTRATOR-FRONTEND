import { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import {
  listFinishedGoods,
  createFinishedGood,
  updateFinishedGood,
  getFinishedGoodsLowStock,
  listFinishedGoodBatches,
  type FinishedGoodDto,
  type FinishedGoodRequest,
  type FinishedGoodBatchDto,
} from '../../lib/factoryApi';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';
import { ResponsiveForm, FormInput, FormSelect } from '../../design-system/ResponsiveForm';
import { ResponsiveTable } from '../../design-system/ResponsiveTable';
import { ResponsiveButton } from '../../design-system/ResponsiveButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { formatDate, formatNumber } from '../../lib/formatUtils';

// Extended DTO to handle missing fields
interface ExtendedFinishedGoodDto extends FinishedGoodDto {
    code?: string;
    description?: string;
    standardCost?: number;
    productCode?: string;
    reorderLevel?: number;
    minStock?: number;
    maxStock?: number;
}

const initialForm: Partial<ExtendedFinishedGoodDto> = {
    name: '',
    code: '',
    productCode: '',
    unit: 'PCS',
    reorderLevel: 0,
    minStock: 0,
    maxStock: 0,
    description: '',
    standardCost: 0
};

export default function FinishedGoodsPage() {
    const { session } = useAuth();
    const [products, setProducts] = useState<ExtendedFinishedGoodDto[]>([]);
    const [batches, setBatches] = useState<FinishedGoodBatchDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [batchesLoading, setBatchesLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ExtendedFinishedGoodDto | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState<Partial<ExtendedFinishedGoodDto>>(initialForm);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
    }, [session]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await listFinishedGoods(session);
            setProducts(data as ExtendedFinishedGoodDto[]);
        } catch (err) {
            console.error('Failed to load products', err);
            setError('Failed to load finished goods');
        } finally {
            setLoading(false);
        }
    };

    const loadBatches = async (product: ExtendedFinishedGoodDto) => {
        if (!product.id) return;
        setSelectedProduct(product);
        try {
            setBatchesLoading(true);
            const batchesData = await listFinishedGoodBatches(product.id, session);
            setBatches(batchesData);
        } catch (err) {
            console.error('Failed to load batches', err);
        } finally {
            setBatchesLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: FinishedGoodRequest = {
                productCode: formData.productCode || formData.code || '',
                name: formData.name || '',
                unit: formData.unit || 'PCS',
                standardCost: formData.standardCost,
                // Add other required fields if necessary
            } as any;

            if (selectedProduct && selectedProduct.id) {
                await updateFinishedGood(selectedProduct.id, payload as any, session);
            } else {
                await createFinishedGood(payload, session);
            }
            setShowModal(false);
            setFormData(initialForm);
            loadProducts();
        } catch (err) {
            console.error('Failed to save product', err);
            setError('Failed to save product');
        }
    };

    const filteredProducts = products.filter(p =>
        (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productCode?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Finished Goods</h1>
                    <p className="text-sm text-secondary">Manage products and inventory</p>
                </div>
                <Button onClick={() => { setIsEdit(false); setFormData(initialForm); setShowModal(true); }}>
                    <PlusIcon className="h-5 w-5 mr-2" /> New Product
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
                    {error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary" />
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <div className="overflow-hidden rounded-lg border border-border bg-background">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead>Product</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-secondary">Loading...</TableCell>
                                        </TableRow>
                                    ) : filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-secondary">No products found</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <TableRow 
                                                key={product.id} 
                                                onClick={() => loadBatches(product)}
                                                className={clsx("cursor-pointer", selectedProduct?.id === product.id && "bg-surface-highlight")}
                                            >
                                                <TableCell label="Product" className="font-medium text-primary">{product.name}</TableCell>
                                                <TableCell label="Code" className="text-secondary">{product.productCode}</TableCell>
                                                <TableCell label="Unit" className="text-secondary">{product.unit}</TableCell>
                                                <TableCell label="Actions" className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setSelectedProduct(product);
                                                                setFormData(product);
                                                                setIsEdit(true);
                                                                setShowModal(true);
                                                            }}
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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
                    {selectedProduct ? (
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle>{selectedProduct.name}</CardTitle>
                                <p className="text-sm text-secondary">{selectedProduct.productCode || selectedProduct.code}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-surface-highlight rounded-lg">
                                            <div className="text-xs text-secondary">Current Stock</div>
                                            <div className="font-medium text-lg text-primary">
                                                {(selectedProduct.currentStock || 0).toLocaleString()} {selectedProduct.unit}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-surface-highlight rounded-lg">
                                            <div className="text-xs text-secondary">Reserved</div>
                                            <div className="font-medium text-lg text-primary">
                                                {(selectedProduct.reservedStock || 0).toLocaleString()} {selectedProduct.unit}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-sm text-primary mb-2">Recent Batches</h4>
                                        {batchesLoading ? (
                                            <p className="text-sm text-secondary text-center py-4">Loading batches...</p>
                                        ) : batches.length === 0 ? (
                                            <p className="text-sm text-secondary text-center py-4 border border-dashed border-border rounded-lg">No batches found</p>
                                        ) : (
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                {batches.map(batch => (
                                                    <div key={batch.id} className="p-3 border border-border rounded-lg hover:bg-surface-highlight transition-colors">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-mono text-xs text-secondary">{batch.batchCode}</span>
                                                            <Badge variant="success">{(batch.quantityAvailable ?? batch.quantityTotal ?? 0).toLocaleString()} {selectedProduct.unit}</Badge>
                                                        </div>
                                                        <div className="flex justify-between mt-1 text-xs text-tertiary">
                                                            <span>Produced: {formatDate(batch.manufacturedAt)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl">
                            <p className="text-sm text-secondary">Select a product to view details and batches</p>
                        </div>
                    )}
                </div>
            </div>

            <ResponsiveModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={isEdit ? 'Edit Product' : 'New Product'}
            >
                <ResponsiveForm onSubmit={handleSubmit}>
                    <FormInput
                        label="Product Name"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Product Code"
                            required
                            value={formData.productCode || ''}
                            onChange={e => setFormData({ ...formData, productCode: e.target.value })}
                        />
                        <FormSelect
                            label="Unit"
                            value={formData.unit || 'PCS'}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            options={[
                                { value: 'PCS', label: 'Pieces' },
                                { value: 'L', label: 'Liters' },
                                { value: 'KG', label: 'Kilograms' },
                                { value: 'BOX', label: 'Boxes' }
                            ]}
                        />
                    </div>
                    <FormInput
                        label="Description"
                        value={formData.description || ''}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Standard Cost"
                            type="number"
                            value={formData.standardCost || ''}
                            onChange={e => setFormData({ ...formData, standardCost: parseFloat(e.target.value) })}
                        />
                    </div>
                    <ResponsiveButton type="submit" className="w-full">
                        {isEdit ? 'Update Product' : 'Create Product'}
                    </ResponsiveButton>
                </ResponsiveForm>
            </ResponsiveModal>
        </div>
    );
}

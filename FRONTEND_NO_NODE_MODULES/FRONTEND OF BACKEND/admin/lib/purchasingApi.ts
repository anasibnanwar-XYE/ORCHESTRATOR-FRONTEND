import { apiData, apiRequest } from './api';
import type { AuthSession } from '../types/auth';

const withCompanyHeader = (headers: HeadersInit | undefined, companyCode?: string): HeadersInit => {
    const h = new Headers(headers);
    if (companyCode) {
        h.set('X-Company-Id', companyCode);
    }
    return h;
};

const jsonHeaders = (companyCode?: string): HeadersInit =>
    withCompanyHeader({ 'Content-Type': 'application/json' }, companyCode);

const asNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

// ─── Purchase Order types (matches backend PurchaseOrderRequest / PurchaseOrderResponse) ───

export interface POLineRequest {
    rawMaterialId: number;
    quantity: number;
    unit?: string;
    costPerUnit: number;
    notes?: string;
}

export interface CreatePORequest {
    supplierId: number;
    orderNumber: string;
    orderDate: string;          // ISO date
    memo?: string;
    lines: POLineRequest[];
}

export interface POLineResponse {
    rawMaterialId: number;
    rawMaterialName?: string;
    quantity: number;
    unit?: string;
    costPerUnit: number;
    lineTotal?: number;
    notes?: string;
}

export interface PurchaseOrderResponse {
    id: number;
    publicId?: string;
    orderNumber: string;
    orderDate: string;
    totalAmount?: number;
    status?: string;
    memo?: string;
    supplierId: number;
    supplierCode?: string;
    supplierName?: string;
    createdAt?: string;
    lines: POLineResponse[];
}

// ─── Goods Receipt types (matches backend GoodsReceiptRequest / GoodsReceiptResponse) ───

export interface GRNLineRequest {
    rawMaterialId: number;
    batchCode?: string;
    quantity: number;
    unit?: string;
    costPerUnit: number;
    notes?: string;
}

export interface CreateGRNRequest {
    purchaseOrderId: number;
    receiptNumber: string;
    receiptDate: string;        // ISO date
    memo?: string;
    lines: GRNLineRequest[];
}

export interface GRNLineResponse {
    rawMaterialId: number;
    rawMaterialName?: string;
    batchCode?: string;
    quantity: number;
    unit?: string;
    costPerUnit: number;
    lineTotal?: number;
    notes?: string;
}

export interface GoodsReceiptResponse {
    id: number;
    publicId?: string;
    receiptNumber: string;
    receiptDate: string;
    totalAmount?: number;
    status?: string;
    memo?: string;
    supplierId?: number;
    supplierCode?: string;
    supplierName?: string;
    purchaseOrderId?: number;
    purchaseOrderNumber?: string;
    createdAt?: string;
    lines: GRNLineResponse[];
}

// ─── Raw Material Purchase (Invoice) types (matches backend RawMaterialPurchaseRequest / Response) ───

export interface RawMaterialPurchaseLine {
    rawMaterialId: number;
    batchCode?: string;
    quantity: number;
    unit?: string;
    costPerUnit: number;
    taxRate?: number;
    taxInclusive?: boolean;
    notes?: string;
}

export interface CreateRawMaterialPurchaseRequest {
    supplierId: number;
    invoiceNumber: string;      // required by backend
    invoiceDate: string;
    memo?: string;
    purchaseOrderId?: number;
    goodsReceiptId: number;     // required by backend
    taxAmount?: number;
    lines: RawMaterialPurchaseLine[];
}

export interface RawMaterialPurchaseDto {
    id: number;
    publicId?: string;
    supplierId: number;
    supplierCode?: string;
    supplierName?: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxAmount?: number;
    totalAmount?: number;
    outstandingAmount?: number;
    status?: string;
    memo?: string;
    purchaseOrderId?: number;
    purchaseOrderNumber?: string;
    goodsReceiptId?: number;
    goodsReceiptNumber?: string;
    journalEntryId?: number;
    createdAt?: string;
    lines: Array<{
        rawMaterialId: number;
        rawMaterialName?: string;
        batchCode: string;
        quantity: number;
        unit?: string;
        costPerUnit: number;
        lineTotal?: number;
        notes?: string;
    }>;
}

// ─── API: Purchase Orders ───

export async function listPurchaseOrders(session?: AuthSession | null, companyCode?: string): Promise<PurchaseOrderResponse[]> {
    const payload = await apiData<any[]>(
        '/api/v1/purchasing/purchase-orders',
        { headers: withCompanyHeader(undefined, companyCode) },
        session ?? undefined
    );
    return (payload || []).map(po => ({
        ...po,
        totalAmount: asNumber(po.totalAmount),
        lines: (po.lines || []).map((l: any) => ({
            ...l,
            quantity: asNumber(l.quantity),
            costPerUnit: asNumber(l.costPerUnit),
            lineTotal: asNumber(l.lineTotal),
        }))
    }));
}

export async function createPurchaseOrder(payload: CreatePORequest, session?: AuthSession | null, companyCode?: string): Promise<PurchaseOrderResponse> {
    return apiData<PurchaseOrderResponse>(
        '/api/v1/purchasing/purchase-orders',
        {
            method: 'POST',
            headers: jsonHeaders(companyCode),
            body: JSON.stringify(payload),
        },
        session ?? undefined
    );
}

export async function getPurchaseOrder(id: number, session?: AuthSession | null, companyCode?: string): Promise<PurchaseOrderResponse> {
    return apiData<PurchaseOrderResponse>(
        `/api/v1/purchasing/purchase-orders/${id}`,
        { headers: withCompanyHeader(undefined, companyCode) },
        session ?? undefined
    );
}

// ─── API: Goods Receipts ───

export async function listGoodsReceipts(session?: AuthSession | null, companyCode?: string): Promise<GoodsReceiptResponse[]> {
    const payload = await apiData<any[]>(
        '/api/v1/purchasing/goods-receipts',
        { headers: withCompanyHeader(undefined, companyCode) },
        session ?? undefined
    );
    return (payload || []).map(grn => ({
        ...grn,
        totalAmount: asNumber(grn.totalAmount),
        lines: (grn.lines || []).map((l: any) => ({
            ...l,
            quantity: asNumber(l.quantity),
            costPerUnit: asNumber(l.costPerUnit),
            lineTotal: asNumber(l.lineTotal),
        }))
    }));
}

export async function createGoodsReceipt(payload: CreateGRNRequest, session?: AuthSession | null, companyCode?: string): Promise<GoodsReceiptResponse> {
    return apiData<GoodsReceiptResponse>(
        '/api/v1/purchasing/goods-receipts',
        {
            method: 'POST',
            headers: jsonHeaders(companyCode),
            body: JSON.stringify(payload),
        },
        session ?? undefined
    );
}

export async function getGoodsReceipt(id: number, session?: AuthSession | null, companyCode?: string): Promise<GoodsReceiptResponse> {
    return apiData<GoodsReceiptResponse>(
        `/api/v1/purchasing/goods-receipts/${id}`,
        { headers: withCompanyHeader(undefined, companyCode) },
        session ?? undefined
    );
}

// ─── API: Raw Material Purchases (Invoices) ───

export async function listRawMaterialPurchases(session?: AuthSession | null, companyCode?: string): Promise<RawMaterialPurchaseDto[]> {
    const payload = await apiData<any[]>(
        '/api/v1/purchasing/raw-material-purchases',
        { headers: withCompanyHeader(undefined, companyCode) },
        session ?? undefined
    );
    return (payload || []).map(po => ({
        id: po.id,
        publicId: po.publicId,
        supplierId: po.supplierId,
        supplierCode: po.supplierCode,
        supplierName: po.supplierName,
        invoiceNumber: po.invoiceNumber,
        invoiceDate: po.invoiceDate,
        taxAmount: asNumber(po.taxAmount),
        totalAmount: asNumber(po.totalAmount),
        outstandingAmount: asNumber(po.outstandingAmount),
        status: po.status,
        memo: po.memo,
        purchaseOrderId: po.purchaseOrderId,
        purchaseOrderNumber: po.purchaseOrderNumber,
        goodsReceiptId: po.goodsReceiptId,
        goodsReceiptNumber: po.goodsReceiptNumber,
        journalEntryId: po.journalEntryId,
        createdAt: po.createdAt,
        lines: (po.lines || []).map((l: any) => ({
            rawMaterialId: l.rawMaterialId,
            rawMaterialName: l.rawMaterialName,
            batchCode: l.batchCode,
            quantity: asNumber(l.quantity),
            unit: l.unit,
            costPerUnit: asNumber(l.costPerUnit),
            lineTotal: asNumber(l.lineTotal),
            notes: l.notes,
        }))
    }));
}

export async function createRawMaterialPurchase(payload: CreateRawMaterialPurchaseRequest, session?: AuthSession | null, companyCode?: string): Promise<RawMaterialPurchaseDto> {
    return apiData<RawMaterialPurchaseDto>(
        '/api/v1/purchasing/raw-material-purchases',
        {
            method: 'POST',
            headers: jsonHeaders(companyCode),
            body: JSON.stringify(payload),
        },
        session ?? undefined
    );
}

export async function getRawMaterialPurchase(id: number, session?: AuthSession | null, companyCode?: string): Promise<RawMaterialPurchaseDto> {
    return apiData<RawMaterialPurchaseDto>(
        `/api/v1/purchasing/raw-material-purchases/${id}`,
        { headers: withCompanyHeader(undefined, companyCode) },
        session ?? undefined
    );
}

/**
 * Full procurement flow: PO → GRN → Invoice in one call.
 * Creates a Purchase Order, then a Goods Receipt against it,
 * then records the Raw Material Purchase (invoice) against the GRN.
 */
export async function createFullPurchase(
    args: {
        supplierId: number;
        orderDate: string;
        invoiceNumber: string;
        memo?: string;
        taxAmount?: number;
        lines: RawMaterialPurchaseLine[];
    },
    session?: AuthSession | null,
    companyCode?: string
): Promise<RawMaterialPurchaseDto> {
    const ts = Date.now();

    // Step 1: Create Purchase Order
    const po = await createPurchaseOrder({
        supplierId: args.supplierId,
        orderNumber: args.invoiceNumber || `PO-${ts}`,
        orderDate: args.orderDate,
        memo: args.memo,
        lines: args.lines.map(l => ({
            rawMaterialId: l.rawMaterialId,
            quantity: l.quantity,
            unit: l.unit,
            costPerUnit: l.costPerUnit,
            notes: l.notes,
        })),
    }, session, companyCode);

    // Step 2: Create Goods Receipt against the PO
    const grn = await createGoodsReceipt({
        purchaseOrderId: po.id,
        receiptNumber: `GRN-${ts}`,
        receiptDate: args.orderDate,
        memo: args.memo,
        lines: args.lines.map(l => ({
            rawMaterialId: l.rawMaterialId,
            batchCode: l.batchCode,
            quantity: l.quantity,
            unit: l.unit,
            costPerUnit: l.costPerUnit,
            notes: l.notes,
        })),
    }, session, companyCode);

    // Step 3: Create Raw Material Purchase (Invoice) against the GRN
    const invoice = await createRawMaterialPurchase({
        supplierId: args.supplierId,
        invoiceNumber: args.invoiceNumber || `INV-${ts}`,
        invoiceDate: args.orderDate,
        memo: args.memo,
        purchaseOrderId: po.id,
        goodsReceiptId: grn.id,
        taxAmount: args.taxAmount,
        lines: args.lines,
    }, session, companyCode);

    return invoice;
}

// ─── API: Purchase Returns ───

export async function createPurchaseReturn(payload: any, session?: AuthSession | null, companyCode?: string): Promise<void> {
    await apiRequest(
        '/api/v1/purchasing/raw-material-purchases/returns',
        {
            method: 'POST',
            headers: jsonHeaders(companyCode),
            body: JSON.stringify(payload),
        },
        session ?? undefined
    );
}

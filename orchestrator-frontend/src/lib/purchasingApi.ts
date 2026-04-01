 /**
  * Purchasing & Suppliers API wrapper
  *
  * Covers:
  *  - Suppliers (CRUD, lifecycle: approve, activate, suspend)
  *  - Purchase Orders (list, create, approve, void, close, timeline)
  *  - Goods Receipt Notes (list, create with idempotency)
  *  - Raw Material Purchases (list, create purchase invoice)
  *  - Purchase Returns (post return, debit note)
  *  - Accounting: supplier statements, supplier aging PDFs
  *  - Accounting: dealer statements, dealer aging PDFs
  */
 
 import { apiRequest } from './api';
 import type { ApiResponse } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Supplier Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export type SupplierStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED';
 export type PaymentTerms = 'NET_30' | 'NET_60' | 'NET_90';
 export type GstRegistrationType = 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED';
 
 export interface SupplierRequest {
   name: string;
   code?: string;
   contactEmail?: string;
   contactPhone?: string;
   address?: string;
   creditLimit?: number;
   gstNumber?: string;
   stateCode?: string;
   gstRegistrationType?: GstRegistrationType;
   paymentTerms?: PaymentTerms;
   bankAccountName?: string;
   bankAccountNumber?: string;
   bankIfsc?: string;
   bankBranch?: string;
 }
 
 export interface SupplierFullResponse {
   id: number;
   publicId: string;
   code: string;
   name: string;
   status: SupplierStatus;
   email?: string;
   phone?: string;
   address?: string;
  balance?: number;
   creditLimit: number;
   outstandingBalance: number;
   payableAccountId?: number;
   payableAccountCode?: string;
   gstNumber?: string;
   stateCode?: string;
   gstRegistrationType: GstRegistrationType;
   paymentTerms: PaymentTerms;
   bankAccountName?: string;
   bankAccountNumber?: string;
   bankIfsc?: string;
   bankBranch?: string;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Purchase Order Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export type PurchaseOrderStatus =
   | 'DRAFT'
   | 'APPROVED'
   | 'PARTIALLY_RECEIVED'
   | 'FULLY_RECEIVED'
   | 'INVOICED'
   | 'CLOSED'
   | 'VOID';
 
 export interface PurchaseOrderLineRequest {
   rawMaterialId: number;
   quantity: number;
   unit?: string;
   costPerUnit: number;
   notes?: string;
 }
 
 export interface PurchaseOrderRequest {
   supplierId: number;
   orderNumber: string;
   orderDate: string;
   memo?: string;
   lines: PurchaseOrderLineRequest[];
 }
 
 export interface PurchaseOrderVoidRequest {
   reasonCode: string;
   reason?: string;
 }
 
 export interface PurchaseOrderLineResponse {
   rawMaterialId: number;
   rawMaterialName: string;
   quantity: number;
   unit?: string;
   costPerUnit: number;
   lineTotal: number;
   notes?: string;
 }
 
 export interface PurchaseOrderResponse {
   id: number;
   publicId: string;
   orderNumber: string;
   orderDate: string;
   totalAmount: number;
   status: PurchaseOrderStatus;
   memo?: string;
   supplierId: number;
   supplierCode?: string;
   supplierName: string;
   createdAt: string;
   lines: PurchaseOrderLineResponse[];
 }
 
 export interface PurchaseOrderStatusHistoryResponse {
   id: number;
   fromStatus?: string;
   toStatus: string;
   reasonCode?: string;
   reason?: string;
   changedBy: string;
   changedAt: string;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Goods Receipt Note Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export type GoodsReceiptStatus = 'PARTIAL' | 'RECEIVED' | 'INVOICED';
 
 export interface GoodsReceiptLineRequest {
   rawMaterialId: number;
   batchCode?: string;
   quantity: number;
   unit?: string;
   costPerUnit: number;
   manufacturingDate?: string;
   expiryDate?: string;
   notes?: string;
 }
 
 export interface GoodsReceiptRequest {
   purchaseOrderId: number;
   receiptNumber: string;
   receiptDate: string;
   memo?: string;
   idempotencyKey?: string;
   lines: GoodsReceiptLineRequest[];
 }
 
 export interface GoodsReceiptLineResponse {
   rawMaterialId: number;
   rawMaterialName: string;
   batchCode?: string;
   quantity: number;
   unit?: string;
   costPerUnit: number;
   lineTotal: number;
   notes?: string;
 }
 
 export interface GoodsReceiptResponse {
   id: number;
   publicId: string;
   receiptNumber: string;
   receiptDate: string;
   totalAmount: number;
   status: GoodsReceiptStatus;
   memo?: string;
   supplierId: number;
   supplierCode?: string;
   supplierName: string;
   purchaseOrderId: number;
   purchaseOrderNumber: string;
   createdAt: string;
   lines: GoodsReceiptLineResponse[];
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Raw Material Purchase Types (Purchase Invoice)
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface RawMaterialPurchaseLineRequest {
   rawMaterialId: number;
   batchCode?: string;
   quantity: number;
   unit?: string;
   costPerUnit: number;
   taxRate?: number;
   taxInclusive?: boolean;
   notes?: string;
 }
 
 export interface RawMaterialPurchaseRequest {
   supplierId: number;
   invoiceNumber: string;
   invoiceDate: string;
   memo?: string;
   purchaseOrderId?: number;
   goodsReceiptId: number;
   taxAmount?: number;
   lines: RawMaterialPurchaseLineRequest[];
 }
 
 export interface RawMaterialPurchaseLineResponse {
   rawMaterialId: number;
   rawMaterialName: string;
   rawMaterialBatchId?: number;
   batchCode?: string;
   quantity: number;
   unit?: string;
   costPerUnit: number;
   lineTotal: number;
   taxRate?: number;
   taxAmount?: number;
   cgstAmount?: number;
   sgstAmount?: number;
   igstAmount?: number;
   notes?: string;
 }
 
 export interface RawMaterialPurchaseResponse {
   id: number;
   publicId: string;
   invoiceNumber: string;
   invoiceDate: string;
   totalAmount: number;
   taxAmount: number;
   outstandingAmount: number;
   status: string;
   memo?: string;
   supplierId: number;
   supplierCode?: string;
   supplierName: string;
   purchaseOrderId?: number;
   purchaseOrderNumber?: string;
   goodsReceiptId: number;
   goodsReceiptNumber: string;
   journalEntryId?: number;
   createdAt: string;
   lines: RawMaterialPurchaseLineResponse[];
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Purchase Return Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface PurchaseReturnRequest {
   supplierId: number;
   purchaseId: number;
   rawMaterialId: number;
   quantity: number;
   unitCost: number;
   referenceNumber?: string;
   returnDate?: string;
   reason?: string;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Statement & Aging Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface PartnerStatementResponse {
   partnerId: number;
   partnerName: string;
   partnerCode: string;
   openingBalance: number;
   closingBalance: number;
   transactions: Array<{
     date: string;
     referenceNumber: string;
     description: string;
     debit: number;
     credit: number;
     balance: number;
   }>;
 }
 
 export interface AgingSummaryResponse {
   partnerId: number;
   partnerName: string;
   totalOutstanding: number;
   current: number;
   days1to30: number;
   days31to60: number;
   days61to90: number;
   daysOver90: number;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Raw Materials (for PO line items)
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface RawMaterialDto {
   id: number;
   name: string;
   code: string;
   unit: string;
   onHandQty: number;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // API calls
 // ─────────────────────────────────────────────────────────────────────────────
 
 export const purchasingApi = {
   // ── Suppliers ────────────────────────────────────────────────────────────
 
   /** GET /api/v1/suppliers */
   async getSuppliers(): Promise<SupplierFullResponse[]> {
     const response = await apiRequest.get<ApiResponse<SupplierFullResponse[]>>('/suppliers');
     return response.data.data;
   },
 
   /** GET /api/v1/suppliers/{id} */
   async getSupplier(id: number): Promise<SupplierFullResponse> {
     const response = await apiRequest.get<ApiResponse<SupplierFullResponse>>(`/suppliers/${id}`);
     return response.data.data;
   },
 
   /** POST /api/v1/suppliers */
   async createSupplier(data: SupplierRequest): Promise<SupplierFullResponse> {
     const response = await apiRequest.post<ApiResponse<SupplierFullResponse>>('/suppliers', data);
     return response.data.data;
   },
 
   /** PUT /api/v1/suppliers/{id} */
   async updateSupplier(id: number, data: SupplierRequest): Promise<SupplierFullResponse> {
     const response = await apiRequest.put<ApiResponse<SupplierFullResponse>>(`/suppliers/${id}`, data);
     return response.data.data;
   },
 
   /** POST /api/v1/suppliers/{id}/approve */
   async approveSupplier(id: number): Promise<SupplierFullResponse> {
     const response = await apiRequest.post<ApiResponse<SupplierFullResponse>>(`/suppliers/${id}/approve`, {});
     return response.data.data;
   },
 
   /** POST /api/v1/suppliers/{id}/activate */
   async activateSupplier(id: number): Promise<SupplierFullResponse> {
     const response = await apiRequest.post<ApiResponse<SupplierFullResponse>>(`/suppliers/${id}/activate`, {});
     return response.data.data;
   },
 
   /** POST /api/v1/suppliers/{id}/suspend */
   async suspendSupplier(id: number): Promise<SupplierFullResponse> {
     const response = await apiRequest.post<ApiResponse<SupplierFullResponse>>(`/suppliers/${id}/suspend`, {});
     return response.data.data;
   },
 
   // ── Supplier Statements & Aging ───────────────────────────────────────────
 
   /** GET /api/v1/accounting/statements/suppliers/{supplierId} */
   async getSupplierStatement(supplierId: number): Promise<PartnerStatementResponse> {
     const response = await apiRequest.get<ApiResponse<PartnerStatementResponse>>(
       `/accounting/statements/suppliers/${supplierId}`
     );
     return response.data.data;
   },
 
   /** GET /api/v1/accounting/statements/suppliers/{supplierId}/pdf → blob */
   async getSupplierStatementPdf(supplierId: number): Promise<Blob> {
     const response = await apiRequest.get<Blob>(
       `/accounting/statements/suppliers/${supplierId}/pdf`,
       { responseType: 'blob' }
     );
     return response.data;
   },
 
   /** GET /api/v1/accounting/aging/suppliers/{supplierId} */
   async getSupplierAging(supplierId: number): Promise<AgingSummaryResponse> {
     const response = await apiRequest.get<ApiResponse<AgingSummaryResponse>>(
       `/accounting/aging/suppliers/${supplierId}`
     );
     return response.data.data;
   },
 
   /** GET /api/v1/accounting/aging/suppliers/{supplierId}/pdf → blob */
   async getSupplierAgingPdf(supplierId: number): Promise<Blob> {
     const response = await apiRequest.get<Blob>(
       `/accounting/aging/suppliers/${supplierId}/pdf`,
       { responseType: 'blob' }
     );
     return response.data;
   },
 
   // ── Dealer Statements & Aging ─────────────────────────────────────────────
 
   /** GET /api/v1/accounting/statements/dealers/{dealerId} */
   async getDealerStatement(dealerId: number): Promise<PartnerStatementResponse> {
     const response = await apiRequest.get<ApiResponse<PartnerStatementResponse>>(
       `/accounting/statements/dealers/${dealerId}`
     );
     return response.data.data;
   },
 
   /** GET /api/v1/accounting/statements/dealers/{dealerId}/pdf → blob */
   async getDealerStatementPdf(dealerId: number): Promise<Blob> {
     const response = await apiRequest.get<Blob>(
       `/accounting/statements/dealers/${dealerId}/pdf`,
       { responseType: 'blob' }
     );
     return response.data;
   },
 
   /** GET /api/v1/accounting/aging/dealers/{dealerId} */
   async getDealerAging(dealerId: number): Promise<AgingSummaryResponse> {
     const response = await apiRequest.get<ApiResponse<AgingSummaryResponse>>(
       `/accounting/aging/dealers/${dealerId}`
     );
     return response.data.data;
   },
 
   /** GET /api/v1/accounting/aging/dealers/{dealerId}/pdf → blob */
   async getDealerAgingPdf(dealerId: number): Promise<Blob> {
     const response = await apiRequest.get<Blob>(
       `/accounting/aging/dealers/${dealerId}/pdf`,
       { responseType: 'blob' }
     );
     return response.data;
   },
 
   // ── Purchase Orders ───────────────────────────────────────────────────────
 
   /** GET /api/v1/purchasing/purchase-orders?supplierId={id?} */
   async getPurchaseOrders(supplierId?: number): Promise<PurchaseOrderResponse[]> {
     const query = supplierId ? `?supplierId=${supplierId}` : '';
     const response = await apiRequest.get<ApiResponse<PurchaseOrderResponse[]>>(
       `/purchasing/purchase-orders${query}`
     );
     return response.data.data;
   },
 
   /** GET /api/v1/purchasing/purchase-orders/{id} */
   async getPurchaseOrder(id: number): Promise<PurchaseOrderResponse> {
     const response = await apiRequest.get<ApiResponse<PurchaseOrderResponse>>(
       `/purchasing/purchase-orders/${id}`
     );
     return response.data.data;
   },
 
   /** POST /api/v1/purchasing/purchase-orders */
   async createPurchaseOrder(data: PurchaseOrderRequest): Promise<PurchaseOrderResponse> {
     const response = await apiRequest.post<ApiResponse<PurchaseOrderResponse>>(
       '/purchasing/purchase-orders',
       data
     );
     return response.data.data;
   },
 
   /** POST /api/v1/purchasing/purchase-orders/{id}/approve */
   async approvePurchaseOrder(id: number): Promise<PurchaseOrderResponse> {
     const response = await apiRequest.post<ApiResponse<PurchaseOrderResponse>>(
       `/purchasing/purchase-orders/${id}/approve`,
       {}
     );
     return response.data.data;
   },
 
   /** POST /api/v1/purchasing/purchase-orders/{id}/void */
   async voidPurchaseOrder(id: number, data: PurchaseOrderVoidRequest): Promise<PurchaseOrderResponse> {
     const response = await apiRequest.post<ApiResponse<PurchaseOrderResponse>>(
       `/purchasing/purchase-orders/${id}/void`,
       data
     );
     return response.data.data;
   },
 
   /** POST /api/v1/purchasing/purchase-orders/{id}/close */
   async closePurchaseOrder(id: number): Promise<PurchaseOrderResponse> {
     const response = await apiRequest.post<ApiResponse<PurchaseOrderResponse>>(
       `/purchasing/purchase-orders/${id}/close`,
       {}
     );
     return response.data.data;
   },
 
   /** GET /api/v1/purchasing/purchase-orders/{id}/timeline */
   async getPurchaseOrderTimeline(id: number): Promise<PurchaseOrderStatusHistoryResponse[]> {
     const response = await apiRequest.get<ApiResponse<PurchaseOrderStatusHistoryResponse[]>>(
       `/purchasing/purchase-orders/${id}/timeline`
     );
     return response.data.data;
   },
 
   // ── Goods Receipt Notes ───────────────────────────────────────────────────
 
   /** GET /api/v1/purchasing/goods-receipts?supplierId={id?} */
   async getGoodsReceipts(supplierId?: number): Promise<GoodsReceiptResponse[]> {
     const query = supplierId ? `?supplierId=${supplierId}` : '';
     const response = await apiRequest.get<ApiResponse<GoodsReceiptResponse[]>>(
       `/purchasing/goods-receipts${query}`
     );
     return response.data.data;
   },
 
   /** GET /api/v1/purchasing/goods-receipts/{id} */
   async getGoodsReceipt(id: number): Promise<GoodsReceiptResponse> {
     const response = await apiRequest.get<ApiResponse<GoodsReceiptResponse>>(
       `/purchasing/goods-receipts/${id}`
     );
     return response.data.data;
   },
 
   /**
    * POST /api/v1/purchasing/goods-receipts
    * Requires Idempotency-Key header (canonical, not X-Idempotency-Key)
    */
   async createGoodsReceipt(data: GoodsReceiptRequest, idempotencyKey: string): Promise<GoodsReceiptResponse> {
     const response = await apiRequest.post<ApiResponse<GoodsReceiptResponse>>(
       '/purchasing/goods-receipts',
       data,
       { headers: { 'Idempotency-Key': idempotencyKey } }
     );
     return response.data.data;
   },
 
   // ── Raw Material Purchases (Purchase Invoices) ────────────────────────────
 
   /** GET /api/v1/purchasing/raw-material-purchases?supplierId={id?} */
   async getRawMaterialPurchases(supplierId?: number): Promise<RawMaterialPurchaseResponse[]> {
     const query = supplierId ? `?supplierId=${supplierId}` : '';
     const response = await apiRequest.get<ApiResponse<RawMaterialPurchaseResponse[]>>(
       `/purchasing/raw-material-purchases${query}`
     );
     return response.data.data;
   },
 
   /** GET /api/v1/purchasing/raw-material-purchases/{id} */
   async getRawMaterialPurchase(id: number): Promise<RawMaterialPurchaseResponse> {
     const response = await apiRequest.get<ApiResponse<RawMaterialPurchaseResponse>>(
       `/purchasing/raw-material-purchases/${id}`
     );
     return response.data.data;
   },
 
   /** POST /api/v1/purchasing/raw-material-purchases */
   async createRawMaterialPurchase(data: RawMaterialPurchaseRequest): Promise<RawMaterialPurchaseResponse> {
     const response = await apiRequest.post<ApiResponse<RawMaterialPurchaseResponse>>(
       '/purchasing/raw-material-purchases',
       data
     );
     return response.data.data;
   },
 
   /** POST /api/v1/purchasing/raw-material-purchases/returns */
   async createPurchaseReturn(data: PurchaseReturnRequest): Promise<import('./accountingApi').JournalEntryDto> {
     const response = await apiRequest.post<ApiResponse<import('./accountingApi').JournalEntryDto>>(
       '/purchasing/raw-material-purchases/returns',
       data
     );
     return response.data.data;
   },
 
   // ── Raw Materials (for PO/GRN line item selection) ───────────────────────
 
   /** GET /api/v1/inventory/raw-materials */
   async getRawMaterials(): Promise<RawMaterialDto[]> {
     const response = await apiRequest.get<ApiResponse<RawMaterialDto[]>>('/inventory/raw-materials');
     return response.data.data;
   },
 };

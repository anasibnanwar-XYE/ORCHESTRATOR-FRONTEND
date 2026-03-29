 /**
  * Inventory & Catalog API wrapper
  *
  * Covers:
  *  - Product Catalog (CRUD, bulk variants)
  *  - Raw Materials (CRUD, batches, intake, stock)
  *  - Inventory Adjustments (finished goods)
  *  - Opening Stock import + history
  *  - Finished Goods (list, detail, batches, stock summary)
  */
 
 import { apiRequest } from './api';
 import type { ApiResponse, PageResponse } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Catalog Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface CatalogProductRequest {
   brandId: number;
   name: string;
   colors?: string[];
   sizes?: string[];
   cartonSizes?: CatalogProductCartonSizeRequest[];
   unitOfMeasure: string;
   hsnCode: string;
   gstRate: number;
   active?: boolean;
 }
 
 export interface CatalogProductCartonSizeRequest {
   size: string;
   piecesPerCarton: number;
 }
 
 export interface CatalogProductCartonSizeDto {
   size: string;
   piecesPerCarton: number;
 }
 
 export interface CatalogProductDto {
   id: number;
   publicId: string;
   brandId: number;
   brandName: string;
   brandCode: string;
   name: string;
   sku: string;
   colors: string[];
   sizes: string[];
   cartonSizes: CatalogProductCartonSizeDto[];
   unitOfMeasure: string;
   hsnCode: string;
   gstRate: number;
   active: boolean;
 }
 
 export interface CatalogBrandRequest {
   name: string;
   logoUrl?: string;
   description?: string;
   active?: boolean;
 }
 
 export interface CatalogBrandDto {
   id: number;
   publicId: string;
   name: string;
   code: string;
   logoUrl?: string;
   description?: string;
   active: boolean;
 }
 
 export interface BulkVariantRequest {
   brandId: number;
   brandName: string;
   brandCode: string;
   baseProductName: string;
   category: string;
   sizes: string[];
   colors: string[];
   unitOfMeasure?: string;
   hsnCode?: string;
   gstRate?: number;
   basePrice?: number;
 }
 
 export interface VariantItem {
   sku: string;
   name: string;
   size: string;
   color: string;
   price?: number;
 }
 
 export interface BulkVariantResponse {
   generated: VariantItem[];
   conflicts: VariantItem[];
   wouldCreate: VariantItem[];
   created: VariantItem[];
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Raw Material Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface RawMaterialRequest {
   name: string;
   sku?: string;
   unitType: string;
   reorderLevel: number;
   minStock: number;
   maxStock: number;
   inventoryAccountId?: number;
   costingMethod?: string;
 }
 
 export interface RawMaterialDto {
   id: number;
   publicId?: string;
   name: string;
   sku?: string;
   code?: string;
   unit?: string;
   unitType?: string;
   onHandQty?: number;
   reorderLevel?: number;
   minStock?: number;
   maxStock?: number;
   costingMethod?: string;
   status?: string;
 }
 
 export interface RawMaterialBatchRequest {
   batchCode?: string;
   quantity: number;
   unit: string;
   costPerUnit: number;
   supplierId: number;
   notes?: string;
 }
 
 export interface RawMaterialBatchDto {
   id: number;
   publicId?: string;
   batchCode?: string;
   quantity: number;
   unit: string;
   costPerUnit: number;
   supplierId?: number;
   supplierName?: string;
   notes?: string;
   expiryDate?: string;
   manufacturingDate?: string;
   createdAt?: string;
 }
 
 export interface RawMaterialIntakeRequest {
   rawMaterialId: number;
   batchCode?: string;
   quantity: number;
   unit: string;
   costPerUnit: number;
   supplierId: number;
   notes?: string;
 }
 
 export interface InventoryStockSnapshot {
   name: string;
   sku?: string;
   currentStock: number;
   reorderLevel?: number;
   status?: string;
 }
 
 export interface StockSummaryOverview {
   currentStock?: number;
   reservedStock?: number;
   availableStock?: number;
   weightedAverageCost?: number;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Inventory Adjustment Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export type AdjustmentType = 'DAMAGED' | 'SHRINKAGE' | 'OBSOLETE' | 'RECOUNT_UP';
 
 export interface InventoryAdjustmentLineRequest {
   finishedGoodId: number;
   quantity: number;
   unitCost: number;
   note?: string;
 }
 
 export interface InventoryAdjustmentRequest {
   adjustmentDate: string;
   type: AdjustmentType;
   adjustmentAccountId: number;
   reason?: string;
   adminOverride?: boolean;
   idempotencyKey: string;
   lines: InventoryAdjustmentLineRequest[];
 }
 
 export interface InventoryAdjustmentLineDto {
   finishedGoodId: number;
   finishedGoodName: string;
   quantity: number;
   unitCost: number;
   amount: number;
   note?: string;
 }
 
 export interface InventoryAdjustmentDto {
   id: number;
   publicId?: string;
   referenceNumber?: string;
   adjustmentDate: string;
   type: AdjustmentType;
   status?: string;
   reason?: string;
   totalAmount: number;
   journalEntryId?: number;
   lines: InventoryAdjustmentLineDto[];
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Opening Stock Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface OpeningStockImportResponse {
   rowsProcessed?: number;
   productsCreated?: number;
   rawMaterialsSeeded?: number;
   errors?: Array<{ rowNumber: number; message: string }>;
 }
 
 export interface OpeningStockImportHistoryItem {
   id: number;
   idempotencyKey?: string;
   referenceNumber?: string;
   fileName?: string;
   journalEntryId?: number;
   errorCount?: number;
   createdAt: string;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Finished Goods Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface FinishedGoodDto {
   id: number;
   publicId?: string;
   name: string;
   sku?: string;
   brandId?: number;
   brandName?: string;
   unitOfMeasure?: string;
   onHandQty?: number;
   reservedQty?: number;
   availableQty?: number;
   reorderLevel?: number;
   active?: boolean;
 }
 
 export interface FinishedGoodBatchDto {
   id: number;
   publicId?: string;
   batchCode?: string;
   quantity: number;
   costPerUnit?: number;
   manufacturedAt?: string;
   expiryDate?: string;
   status?: string;
 }
 
 export interface StockSummaryDto {
   finishedGoodId?: number;
   name?: string;
   sku?: string;
   currentStock?: number;
   reservedStock?: number;
   availableStock?: number;
   weightedAverageCost?: number;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // API helper
 // ─────────────────────────────────────────────────────────────────────────────
 
 function generateIdempotencyKey(): string {
   return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // API calls
 // ─────────────────────────────────────────────────────────────────────────────
 
 export const inventoryApi = {
   // ── Catalog Brands ────────────────────────────────────────────────────────
 
   /** GET /api/v1/catalog/brands?active=true */
   async getBrands(activeOnly?: boolean): Promise<CatalogBrandDto[]> {
     const query = activeOnly !== undefined ? `?active=${activeOnly}` : '';
     const response = await apiRequest.get<ApiResponse<CatalogBrandDto[]>>(`/catalog/brands${query}`);
     return response.data.data;
   },
 
   /** POST /api/v1/catalog/brands */
   async createBrand(data: CatalogBrandRequest): Promise<CatalogBrandDto> {
     const response = await apiRequest.post<ApiResponse<CatalogBrandDto>>('/catalog/brands', data);
     return response.data.data;
   },
 
   /** PUT /api/v1/catalog/brands/{id} */
   async updateBrand(id: number, data: CatalogBrandRequest): Promise<CatalogBrandDto> {
     const response = await apiRequest.put<ApiResponse<CatalogBrandDto>>(`/catalog/brands/${id}`, data);
     return response.data.data;
   },
 
   /** DELETE /api/v1/catalog/brands/{id} */
   async deleteBrand(id: number): Promise<CatalogBrandDto> {
     const response = await apiRequest.delete<ApiResponse<CatalogBrandDto>>(`/catalog/brands/${id}`);
     return response.data.data;
   },
 
   // ── Catalog Products ──────────────────────────────────────────────────────
 
   /** GET /api/v1/catalog/products?brandId=&page=&pageSize= */
   async getProducts(params?: { brandId?: number; color?: string; size?: string; active?: boolean; page?: number; pageSize?: number }): Promise<PageResponse<CatalogProductDto>> {
     const q = new URLSearchParams();
     if (params?.brandId) q.set('brandId', String(params.brandId));
     if (params?.color) q.set('color', params.color);
     if (params?.size) q.set('size', params.size);
     if (params?.active !== undefined) q.set('active', String(params.active));
     if (params?.page !== undefined) q.set('page', String(params.page));
     if (params?.pageSize !== undefined) q.set('pageSize', String(params.pageSize));
     const qs = q.toString() ? `?${q.toString()}` : '';
     const response = await apiRequest.get<ApiResponse<PageResponse<CatalogProductDto>>>(`/catalog/products${qs}`);
     return response.data.data;
   },
 
   /** POST /api/v1/catalog/products */
   async createProduct(data: CatalogProductRequest): Promise<CatalogProductDto> {
     const response = await apiRequest.post<ApiResponse<CatalogProductDto>>('/catalog/products', data);
     return response.data.data;
   },
 
   /** PUT /api/v1/catalog/products/{id} */
   async updateProduct(id: number, data: CatalogProductRequest): Promise<CatalogProductDto> {
     const response = await apiRequest.put<ApiResponse<CatalogProductDto>>(`/catalog/products/${id}`, data);
     return response.data.data;
   },
 
   /** DELETE /api/v1/catalog/products/{id} (soft-delete / deactivate) */
   async archiveProduct(id: number): Promise<CatalogProductDto> {
     const response = await apiRequest.delete<ApiResponse<CatalogProductDto>>(`/catalog/products/${id}`);
     return response.data.data;
   },
 
   /** POST /api/v1/catalog/products/bulk-variants */
   async createBulkVariants(data: BulkVariantRequest): Promise<BulkVariantResponse> {
    const res2 = await apiRequest.post<ApiResponse<BulkVariantResponse>>(
       '/accounting/catalog/products/bulk-variants',
       data
     );
     return res2.data.data;
   },
 
   // ── Accounting Catalog Products (read model) ──────────────────────────────
 
   /** GET /api/v1/accounting/catalog/products */
   async getAccountingProducts(): Promise<import('./purchasingApi').RawMaterialDto[]> {
     const response = await apiRequest.get<ApiResponse<import('./purchasingApi').RawMaterialDto[]>>(
       '/accounting/catalog/products'
     );
     return response.data.data;
   },
 
   // ── Raw Materials ─────────────────────────────────────────────────────────
 
   /** GET /api/v1/accounting/raw-materials */
   async getRawMaterials(): Promise<RawMaterialDto[]> {
     const response = await apiRequest.get<ApiResponse<RawMaterialDto[]>>('/accounting/raw-materials');
     return response.data.data;
   },
 
   /** POST /api/v1/accounting/raw-materials */
   async createRawMaterial(data: RawMaterialRequest): Promise<RawMaterialDto> {
     const response = await apiRequest.post<ApiResponse<RawMaterialDto>>('/accounting/raw-materials', data);
     return response.data.data;
   },
 
   /** PUT /api/v1/accounting/raw-materials/{id} */
   async updateRawMaterial(id: number, data: RawMaterialRequest): Promise<RawMaterialDto> {
     const response = await apiRequest.put<ApiResponse<RawMaterialDto>>(`/accounting/raw-materials/${id}`, data);
     return response.data.data;
   },
 
   /** DELETE /api/v1/accounting/raw-materials/{id} → 204 */
   async deleteRawMaterial(id: number): Promise<void> {
     await apiRequest.delete(`/accounting/raw-materials/${id}`);
   },
 
   // ── Raw Material Batches ──────────────────────────────────────────────────
 
   /** GET /api/v1/raw-material-batches/{rawMaterialId} */
   async getRawMaterialBatches(rawMaterialId: number): Promise<RawMaterialBatchDto[]> {
     const response = await apiRequest.get<ApiResponse<RawMaterialBatchDto[]>>(
       `/raw-material-batches/${rawMaterialId}`
     );
     return response.data.data;
   },
 
   /** POST /api/v1/raw-material-batches/{rawMaterialId} */
   async createRawMaterialBatch(
     rawMaterialId: number,
     data: RawMaterialBatchRequest
   ): Promise<RawMaterialBatchDto> {
     const idempotencyKey = generateIdempotencyKey();
     const response = await apiRequest.post<ApiResponse<RawMaterialBatchDto>>(
       `/raw-material-batches/${rawMaterialId}`,
       data,
       { headers: { 'Idempotency-Key': idempotencyKey } }
     );
     return response.data.data;
   },
 
   // ── Raw Material Intake ───────────────────────────────────────────────────
 
   /** POST /api/v1/raw-materials/intake */
   async recordIntake(data: RawMaterialIntakeRequest): Promise<RawMaterialBatchDto> {
     const idempotencyKey = generateIdempotencyKey();
     const response = await apiRequest.post<ApiResponse<RawMaterialBatchDto>>(
       '/raw-materials/intake',
       data,
       { headers: { 'Idempotency-Key': idempotencyKey } }
     );
     return response.data.data;
   },
 
   // ── Raw Material Stock ────────────────────────────────────────────────────
 
   /** GET /api/v1/raw-materials/stock */
   async getRawMaterialStockSummary(): Promise<StockSummaryOverview> {
     const response = await apiRequest.get<ApiResponse<StockSummaryOverview>>('/raw-materials/stock');
     return response.data.data;
   },
 
   /** GET /api/v1/raw-materials/stock/inventory */
   async getRawMaterialStockInventory(): Promise<InventoryStockSnapshot[]> {
     const response = await apiRequest.get<ApiResponse<InventoryStockSnapshot[]>>(
       '/raw-materials/stock/inventory'
     );
     return response.data.data;
   },
 
   // ── Inventory Adjustments ─────────────────────────────────────────────────
 
   /** GET /api/v1/inventory/adjustments */
   async getAdjustments(): Promise<InventoryAdjustmentDto[]> {
     const response = await apiRequest.get<ApiResponse<InventoryAdjustmentDto[]>>(
       '/inventory/adjustments'
     );
     return response.data.data;
   },
 
   /** POST /api/v1/inventory/adjustments */
   async createAdjustment(data: InventoryAdjustmentRequest): Promise<InventoryAdjustmentDto> {
     const response = await apiRequest.post<ApiResponse<InventoryAdjustmentDto>>(
       '/inventory/adjustments',
       data,
       { headers: { 'Idempotency-Key': data.idempotencyKey } }
     );
     return response.data.data;
   },
 
   // ── Opening Stock ─────────────────────────────────────────────────────────
 
   /** POST /api/v1/inventory/opening-stock (multipart/form-data) */
   async importOpeningStock(file: File, idempotencyKey?: string): Promise<OpeningStockImportResponse> {
     const formData = new FormData();
     formData.append('file', file);
     const key = idempotencyKey ?? generateIdempotencyKey();
     const response = await apiRequest.post<ApiResponse<OpeningStockImportResponse>>(
       '/inventory/opening-stock',
       formData,
       {
         headers: {
           'Content-Type': 'multipart/form-data',
           'Idempotency-Key': key,
         },
       }
     );
     return response.data.data;
   },
 
   /** GET /api/v1/inventory/opening-stock?page=&size= */
   async getOpeningStockHistory(page = 0, size = 20): Promise<PageResponse<OpeningStockImportHistoryItem>> {
     const response = await apiRequest.get<ApiResponse<PageResponse<OpeningStockImportHistoryItem>>>(
       `/inventory/opening-stock?page=${page}&size=${size}`
     );
     return response.data.data;
   },
 
   // ── Finished Goods ────────────────────────────────────────────────────────
 
   /** GET /api/v1/finished-goods */
   async getFinishedGoods(): Promise<FinishedGoodDto[]> {
     const response = await apiRequest.get<ApiResponse<FinishedGoodDto[]>>('/finished-goods');
     return response.data.data;
   },
 
   /** GET /api/v1/finished-goods/stock-summary */
   async getFinishedGoodsStockSummary(): Promise<StockSummaryDto[]> {
     const response = await apiRequest.get<ApiResponse<StockSummaryDto[]>>(
       '/finished-goods/stock-summary'
     );
     return response.data.data;
   },
 
   /** GET /api/v1/finished-goods/{id}/batches */
   async getFinishedGoodBatches(id: number): Promise<FinishedGoodBatchDto[]> {
     const response = await apiRequest.get<ApiResponse<FinishedGoodBatchDto[]>>(
       `/finished-goods/${id}/batches`
     );
     return response.data.data;
   },
 };

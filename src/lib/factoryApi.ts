/**
 * Factory API wrapper
 *
 * Factory portal operations: dashboard, production plans, production logs,
 * production batches, brands/products catalog, packing, packaging mappings,
 * factory tasks, cost allocation, dispatch (factory), finished goods, raw materials.
 */

import { apiRequest, apiData } from './api';
import type {
  ApiResponse,
  FactoryDashboardDto,
  ProductionPlanDto,
  ProductionPlanRequest,
  ProductionPlanStatus,
  ProductionBatchDto,
  ProductionBatchRequest,
  ProductionBrandDto,
  ProductionProductDto,
  ProductionLogDto,
  ProductionLogRequest,
  ProductionLogDetailDto,
  RawMaterialDto,
  UnpackedBatchDto,
  PackingRequest,
  PackingRecordDto,
  BulkPackRequest,
  BulkPackResponse,
  PackagingSizeMappingDto,
  PackagingSizeMappingRequest,
  FactoryTaskDto,
  FactoryTaskRequest,
  CostAllocationRequest,
  CostAllocationResponse,
  CostBreakdownDto,
  PackagingSlipDto,
  DispatchPreviewDto,
  FactoryDispatchConfirmRequest,
  FactoryDispatchConfirmationResponse,
  FactoryFinishedGoodDto,
  FactoryFinishedGoodRequest,
  FactoryFinishedGoodBatchDto,
  FactoryFinishedGoodBatchRequest,
  FactoryStockSummaryDto,
  FinishedGoodLowStockThresholdDto,
  ChildBatchDto,
  InventoryStockSnapshot,
  RawMaterialIntakeRequest,
  FactoryRawMaterialBatchDto,
} from '@/types';

export const factoryApi = {
  // ─────────────────────────────────────────────────────────────────────────
  // Dashboard
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/factory/dashboard */
  async getDashboard(): Promise<FactoryDashboardDto> {
    return apiData<FactoryDashboardDto>('/factory/dashboard');
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Production Plans
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/factory/production-plans */
  async getProductionPlans(): Promise<ProductionPlanDto[]> {
    return apiData<ProductionPlanDto[]>('/factory/production-plans');
  },

  /** POST /api/v1/factory/production-plans */
  async createProductionPlan(request: ProductionPlanRequest): Promise<ProductionPlanDto> {
    const response = await apiRequest.post<ApiResponse<ProductionPlanDto>>(
      '/factory/production-plans',
      request,
    );
    return response.data.data;
  },

  /** PUT /api/v1/factory/production-plans/:id */
  async updateProductionPlan(id: number, request: ProductionPlanRequest): Promise<ProductionPlanDto> {
    const response = await apiRequest.put<ApiResponse<ProductionPlanDto>>(
      `/factory/production-plans/${id}`,
      request,
    );
    return response.data.data;
  },

  /** PATCH /api/v1/factory/production-plans/:id/status */
  async updateProductionPlanStatus(id: number, status: ProductionPlanStatus): Promise<ProductionPlanDto> {
    const response = await apiRequest.patch<ApiResponse<ProductionPlanDto>>(
      `/factory/production-plans/${id}/status`,
      { status },
    );
    return response.data.data;
  },

  /** DELETE /api/v1/factory/production-plans/:id  (204 No Content) */
  async deleteProductionPlan(id: number): Promise<void> {
    await apiRequest.delete(`/factory/production-plans/${id}`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Production Batches
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/factory/production-batches */
  async getProductionBatches(): Promise<ProductionBatchDto[]> {
    return apiData<ProductionBatchDto[]>('/factory/production-batches');
  },

  /** POST /api/v1/factory/production-batches?planId= */
  async createProductionBatch(request: ProductionBatchRequest, planId?: number): Promise<ProductionBatchDto> {
    const url = planId
      ? `/factory/production-batches?planId=${planId}`
      : '/factory/production-batches';
    const response = await apiRequest.post<ApiResponse<ProductionBatchDto>>(url, request);
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Production Logs
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/factory/production/logs */
  async getProductionLogs(): Promise<ProductionLogDto[]> {
    return apiData<ProductionLogDto[]>('/factory/production/logs');
  },

  /** POST /api/v1/factory/production/logs */
  async createProductionLog(request: ProductionLogRequest): Promise<ProductionLogDetailDto> {
    const response = await apiRequest.post<ApiResponse<ProductionLogDetailDto>>(
      '/factory/production/logs',
      request,
    );
    return response.data.data;
  },

  /** GET /api/v1/factory/production/logs/:id */
  async getProductionLogDetail(id: number): Promise<ProductionLogDetailDto> {
    return apiData<ProductionLogDetailDto>(`/factory/production/logs/${id}`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog (brands / products)
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/production/brands */
  async getProductionBrands(): Promise<ProductionBrandDto[]> {
    return apiData<ProductionBrandDto[]>('/production/brands');
  },

  /** GET /api/v1/production/brands/:brandId/products */
  async getBrandProducts(brandId: number): Promise<ProductionProductDto[]> {
    return apiData<ProductionProductDto[]>(`/production/brands/${brandId}/products`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Raw Materials (for production log form)
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/accounting/raw-materials */
  async getRawMaterials(): Promise<RawMaterialDto[]> {
    return apiData<RawMaterialDto[]>('/accounting/raw-materials');
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Packing
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/factory/unpacked-batches */
  async getUnpackedBatches(): Promise<UnpackedBatchDto[]> {
    return apiData<UnpackedBatchDto[]>('/factory/unpacked-batches');
  },

  /** POST /api/v1/factory/packing-records */
  async recordPacking(request: PackingRequest): Promise<ProductionLogDetailDto> {
    const response = await apiRequest.post<ApiResponse<ProductionLogDetailDto>>(
      '/factory/packing-records',
      request,
      { headers: { 'Idempotency-Key': request.idempotencyKey ?? crypto.randomUUID() } },
    );
    return response.data.data;
  },

  /** POST /api/v1/factory/packing-records/{productionLogId}/complete */
  async completePacking(productionLogId: number): Promise<ProductionLogDetailDto> {
    const response = await apiRequest.post<ApiResponse<ProductionLogDetailDto>>(
      `/factory/packing-records/${productionLogId}/complete`,
    );
    return response.data.data;
  },

  /** GET /api/v1/factory/production-logs/{productionLogId}/packing-history */
  async getPackingHistory(productionLogId: number): Promise<PackingRecordDto[]> {
    return apiData<PackingRecordDto[]>(
      `/factory/production-logs/${productionLogId}/packing-history`,
    );
  },

  /** POST /api/v1/factory/pack (bulk-to-sizes) */
  async bulkPack(request: BulkPackRequest): Promise<BulkPackResponse> {
    const response = await apiRequest.post<ApiResponse<BulkPackResponse>>(
      '/factory/pack',
      request,
      { headers: { 'Idempotency-Key': request.idempotencyKey ?? crypto.randomUUID() } },
    );
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Packaging Size Mappings
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/factory/packaging-mappings */
  async getPackagingMappings(): Promise<PackagingSizeMappingDto[]> {
    return apiData<PackagingSizeMappingDto[]>('/factory/packaging-mappings');
  },

  /** POST /api/v1/factory/packaging-mappings */
  async createPackagingMapping(request: PackagingSizeMappingRequest): Promise<PackagingSizeMappingDto> {
    const response = await apiRequest.post<ApiResponse<PackagingSizeMappingDto>>(
      '/factory/packaging-mappings',
      request,
    );
    return response.data.data;
  },

  /** PUT /api/v1/factory/packaging-mappings/:id */
  async updatePackagingMapping(id: number, request: PackagingSizeMappingRequest): Promise<PackagingSizeMappingDto> {
    const response = await apiRequest.put<ApiResponse<PackagingSizeMappingDto>>(
      `/factory/packaging-mappings/${id}`,
      request,
    );
    return response.data.data;
  },

  /** DELETE /api/v1/factory/packaging-mappings/:id */
  async deletePackagingMapping(id: number): Promise<void> {
    await apiRequest.delete(`/factory/packaging-mappings/${id}`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Factory Tasks
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/factory/tasks */
  async getFactoryTasks(): Promise<FactoryTaskDto[]> {
    return apiData<FactoryTaskDto[]>('/factory/tasks');
  },

  /** POST /api/v1/factory/tasks */
  async createFactoryTask(request: FactoryTaskRequest): Promise<FactoryTaskDto> {
    const response = await apiRequest.post<ApiResponse<FactoryTaskDto>>(
      '/factory/tasks',
      request,
    );
    return response.data.data;
  },

  /** PUT /api/v1/factory/tasks/:id */
  async updateFactoryTask(id: number, request: FactoryTaskRequest): Promise<FactoryTaskDto> {
    const response = await apiRequest.put<ApiResponse<FactoryTaskDto>>(
      `/factory/tasks/${id}`,
      request,
    );
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Cost Allocation
  // ─────────────────────────────────────────────────────────────────────────

  /** POST /api/v1/factory/cost-allocation */
  async allocateCosts(request: CostAllocationRequest): Promise<CostAllocationResponse> {
    const response = await apiRequest.post<ApiResponse<CostAllocationResponse>>(
      '/factory/cost-allocation',
      request,
    );
    return response.data.data;
  },

  /** GET /api/v1/reports/production-logs/{id}/cost-breakdown */
  async getCostBreakdown(productionLogId: number): Promise<CostBreakdownDto> {
    return apiData<CostBreakdownDto>(`/reports/production-logs/${productionLogId}/cost-breakdown`);
  },

  /** GET /api/v1/reports/monthly-production-costs?year=&month= */
  async getMonthlyCosts(year: number, month: number): Promise<unknown> {
    return apiData(`/reports/monthly-production-costs?year=${year}&month=${month}`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Dispatch (Factory portal)
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/dispatch/pending */
  async getPendingSlips(): Promise<PackagingSlipDto[]> {
    return apiData<PackagingSlipDto[]>('/dispatch/pending');
  },

  /** GET /api/v1/dispatch/slip/:slipId */
  async getSlip(slipId: number): Promise<PackagingSlipDto> {
    return apiData<PackagingSlipDto>(`/dispatch/slip/${slipId}`);
  },

  /** GET /api/v1/dispatch/preview/:slipId */
  async getDispatchPreview(slipId: number): Promise<DispatchPreviewDto> {
    return apiData<DispatchPreviewDto>(`/dispatch/preview/${slipId}`);
  },

  /** POST /api/v1/dispatch/confirm */
  async confirmDispatch(request: FactoryDispatchConfirmRequest): Promise<FactoryDispatchConfirmationResponse> {
    const response = await apiRequest.post<ApiResponse<FactoryDispatchConfirmationResponse>>(
      '/dispatch/confirm',
      request,
    );
    return response.data.data;
  },

  /** POST /api/v1/dispatch/backorder/:slipId/cancel */
  async cancelBackorder(slipId: number, reason?: string): Promise<PackagingSlipDto> {
    const response = await apiRequest.post<ApiResponse<PackagingSlipDto>>(
      `/dispatch/backorder/${slipId}/cancel`,
      reason ? { reason } : {},
    );
    return response.data.data;
  },

  /** PATCH /api/v1/dispatch/slip/:slipId/status */
  async updateSlipStatus(slipId: number, status: string): Promise<PackagingSlipDto> {
    const response = await apiRequest.patch<ApiResponse<PackagingSlipDto>>(
      `/dispatch/slip/${slipId}/status`,
      { status },
    );
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Finished Goods (Factory portal)
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/finished-goods */
  async getFinishedGoods(): Promise<FactoryFinishedGoodDto[]> {
    return apiData<FactoryFinishedGoodDto[]>('/finished-goods');
  },

  /** POST /api/v1/finished-goods */
  async createFinishedGood(request: FactoryFinishedGoodRequest): Promise<FactoryFinishedGoodDto> {
    const response = await apiRequest.post<ApiResponse<FactoryFinishedGoodDto>>(
      '/finished-goods',
      request,
    );
    return response.data.data;
  },

  /** PUT /api/v1/finished-goods/:id */
  async updateFinishedGood(id: number, request: FactoryFinishedGoodRequest): Promise<FactoryFinishedGoodDto> {
    const response = await apiRequest.put<ApiResponse<FactoryFinishedGoodDto>>(
      `/finished-goods/${id}`,
      request,
    );
    return response.data.data;
  },

  /** GET /api/v1/finished-goods/stock-summary */
  async getFinishedGoodStockSummary(): Promise<FactoryStockSummaryDto[]> {
    return apiData<FactoryStockSummaryDto[]>('/finished-goods/stock-summary');
  },

  /** GET /api/v1/finished-goods/low-stock */
  async getLowStockItems(): Promise<FactoryFinishedGoodDto[]> {
    return apiData<FactoryFinishedGoodDto[]>('/finished-goods/low-stock');
  },

  /** GET /api/v1/finished-goods/:id/batches */
  async getFinishedGoodBatches(id: number): Promise<FactoryFinishedGoodBatchDto[]> {
    return apiData<FactoryFinishedGoodBatchDto[]>(`/finished-goods/${id}/batches`);
  },

  /** POST /api/v1/finished-goods/:id/batches */
  async registerFinishedGoodBatch(id: number, request: FactoryFinishedGoodBatchRequest): Promise<FactoryFinishedGoodBatchDto> {
    const response = await apiRequest.post<ApiResponse<FactoryFinishedGoodBatchDto>>(
      `/finished-goods/${id}/batches`,
      request,
    );
    return response.data.data;
  },

  /** GET /api/v1/finished-goods/:id/low-stock-threshold */
  async getLowStockThreshold(id: number): Promise<FinishedGoodLowStockThresholdDto> {
    return apiData<FinishedGoodLowStockThresholdDto>(`/finished-goods/${id}/low-stock-threshold`);
  },

  /** PUT /api/v1/finished-goods/:id/low-stock-threshold */
  async setLowStockThreshold(id: number, threshold: number): Promise<FinishedGoodLowStockThresholdDto> {
    const response = await apiRequest.put<ApiResponse<FinishedGoodLowStockThresholdDto>>(
      `/finished-goods/${id}/low-stock-threshold`,
      { threshold },
    );
    return response.data.data;
  },

  /** GET /api/v1/factory/bulk-batches/:finishedGoodId */
  async getBulkBatches(finishedGoodId: number): Promise<ChildBatchDto[]> {
    return apiData<ChildBatchDto[]>(`/factory/bulk-batches/${finishedGoodId}`);
  },

  /** GET /api/v1/factory/bulk-batches/:parentBatchId/children */
  async getBulkBatchChildren(parentBatchId: number): Promise<ChildBatchDto[]> {
    return apiData<ChildBatchDto[]>(`/factory/bulk-batches/${parentBatchId}/children`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Raw Materials (Factory view)
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/raw-materials/stock/inventory */
  async getRawMaterialStockInventory(): Promise<InventoryStockSnapshot[]> {
    return apiData<InventoryStockSnapshot[]>('/raw-materials/stock/inventory');
  },

  /** GET /api/v1/raw-material-batches/:rawMaterialId */
  async getRawMaterialBatches(rawMaterialId: number): Promise<FactoryRawMaterialBatchDto[]> {
    return apiData<FactoryRawMaterialBatchDto[]>(`/raw-material-batches/${rawMaterialId}`);
  },

  /** POST /api/v1/raw-materials/intake */
  async recordRawMaterialIntake(request: RawMaterialIntakeRequest): Promise<FactoryRawMaterialBatchDto> {
    const response = await apiRequest.post<ApiResponse<FactoryRawMaterialBatchDto>>(
      '/raw-materials/intake',
      request,
    );
    return response.data.data;
  },
};

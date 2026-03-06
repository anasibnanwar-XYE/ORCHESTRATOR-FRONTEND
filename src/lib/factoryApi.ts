 /**
  * Factory API wrapper
  *
  * Factory portal operations: dashboard, production plans, production logs,
  * production batches, brands/products catalog.
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
 };

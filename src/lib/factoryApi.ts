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
import type {
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
 };

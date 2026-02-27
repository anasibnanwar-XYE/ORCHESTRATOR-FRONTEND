import { apiData, apiRequest, setApiSession } from './api';
import type { AuthSession } from '../types/auth';

// --- Services ---
import { FactoryControllerService } from './client/services/FactoryControllerService';
import { RawMaterialControllerService } from './client/services/RawMaterialControllerService';
import { FinishedGoodControllerService } from './client/services/FinishedGoodControllerService';
import { InventoryAdjustmentControllerService } from './client/services/InventoryAdjustmentControllerService';
import { PackagingMappingControllerService } from './client/services/PackagingMappingControllerService';
import { ProductionLogControllerService } from './client/services/ProductionLogControllerService';
import { PackingControllerService } from './client/services/PackingControllerService';
import { ProductionCatalogControllerService } from './client/services/ProductionCatalogControllerService';
import { RawMaterialPurchaseControllerService } from './client/services/RawMaterialPurchaseControllerService';

// --- Models (Import locally for usage, and Re-export) ---

import type { FactoryDashboardDto } from './client/models/FactoryDashboardDto';
export type { FactoryDashboardDto };

import type { FactoryTaskDto } from './client/models/FactoryTaskDto';
export type { FactoryTaskDto };

import type { FactoryTaskRequest } from './client/models/FactoryTaskRequest';
export type { FactoryTaskRequest };

import type { ProductionPlanDto } from './client/models/ProductionPlanDto';
export type { ProductionPlanDto };

import type { ProductionPlanRequest } from './client/models/ProductionPlanRequest';
export type { ProductionPlanRequest };

import type { RawMaterialDto } from './client/models/RawMaterialDto';
export type { RawMaterialDto };

import type { RawMaterialRequest } from './client/models/RawMaterialRequest';
export type { RawMaterialRequest };

import type { FinishedGoodDto } from './client/models/FinishedGoodDto';
export type { FinishedGoodDto };

import type { FinishedGoodRequest } from './client/models/FinishedGoodRequest';
export type { FinishedGoodRequest };

import type { InventoryAdjustmentDto } from './client/models/InventoryAdjustmentDto';
export type { InventoryAdjustmentDto };

import { InventoryAdjustmentRequest } from './client/models/InventoryAdjustmentRequest';
export { InventoryAdjustmentRequest };

import type { PackagingSizeMappingDto } from './client/models/PackagingSizeMappingDto';
export type { PackagingSizeMappingDto };

import type { PackagingSizeMappingRequest } from './client/models/PackagingSizeMappingRequest';
export type { PackagingSizeMappingRequest };

import type { ProductionLogDto } from './client/models/ProductionLogDto';
export type { ProductionLogDto };

import type { ProductionLogRequest } from './client/models/ProductionLogRequest';
export type { ProductionLogRequest };

import type { ProductionBatchDto } from './client/models/ProductionBatchDto';
export type { ProductionBatchDto };

import type { ProductionBatchRequest } from './client/models/ProductionBatchRequest';
export type { ProductionBatchRequest };

import type { PackingRecordDto } from './client/models/PackingRecordDto';
export type { PackingRecordDto };

import type { PackingRequest } from './client/models/PackingRequest';
export type { PackingRequest };

import type { RawMaterialBatchDto } from './client/models/RawMaterialBatchDto';
export type { RawMaterialBatchDto };

import type { RawMaterialBatchRequest } from './client/models/RawMaterialBatchRequest';
export type { RawMaterialBatchRequest };

import type { RawMaterialIntakeRequest } from './client/models/RawMaterialIntakeRequest';
export type { RawMaterialIntakeRequest };

import type { RawMaterialPurchaseRequest } from './client/models/RawMaterialPurchaseRequest';
export type { RawMaterialPurchaseRequest };

import type { RawMaterialPurchaseResponse } from './client/models/RawMaterialPurchaseResponse';
export type { RawMaterialPurchaseResponse };

import type { PurchaseReturnRequest } from './client/models/PurchaseReturnRequest';
export type { PurchaseReturnRequest };

import type { StockSummaryDto } from './client/models/StockSummaryDto';
export type { StockSummaryDto };

import type { InventoryStockSnapshot } from './client/models/InventoryStockSnapshot';
export type { InventoryStockSnapshot };
export type InventoryStockSnapshotDto = InventoryStockSnapshot;

import type { ProductionBrandDto } from './client/models/ProductionBrandDto';
export type { ProductionBrandDto };

import type { ProductionProductDto } from './client/models/ProductionProductDto';
export type { ProductionProductDto };
export type ProductionProductCatalogDto = ProductionProductDto;

import type { ProductionLogDetailDto } from './client/models/ProductionLogDetailDto';
export type { ProductionLogDetailDto };

import type { UnpackedBatchDto } from './client/models/UnpackedBatchDto';
export type { UnpackedBatchDto };

import type { BulkPackRequest } from './client/models/BulkPackRequest';
import type { BulkPackResponse } from './client/models/BulkPackResponse';
import type { PackLine } from './client/models/PackLine';
import type { ChildBatchDto } from './client/models/ChildBatchDto';
export type { BulkPackRequest, BulkPackResponse, PackLine, ChildBatchDto };
export type PackRequest = BulkPackRequest;
export type PackResponse = BulkPackResponse;
export type PackLineRequest = PackLine;
export type BulkBatchDto = ChildBatchDto;

export interface OpeningStockImportResponse {
  rowsProcessed: number;
  rawMaterialsCreated: number;
  rawMaterialBatchesCreated: number;
  finishedGoodsCreated: number;
  finishedGoodBatchesCreated: number;
  errors?: Array<{ rowNumber?: number; message?: string }>;
}

import type { CostAllocationRequest } from './client/models/CostAllocationRequest';
export type { CostAllocationRequest };

import type { CostAllocationResponse } from './client/models/CostAllocationResponse';
export type { CostAllocationResponse };

import type { FinishedGoodBatchDto } from './client/models/FinishedGoodBatchDto';
export type { FinishedGoodBatchDto };

// Helper to unwrap "envelope"
const unwrap = <T>(response: any): T => {
  if (response && typeof response === 'object') {
    if ('success' in response && 'data' in response) {
      if (!response.success && response.message) {
        throw new Error(response.message);
      }
      return response.data as T;
    }
  }
  return response as T;
};

// Helper for session
const withSession = (session?: AuthSession | null) => {
  if (session) setApiSession(session);
};

// --- API Functions ---

// Dashboard
export const getFactoryDashboard = async (session?: AuthSession | null): Promise<FactoryDashboardDto> => {
  withSession(session);
  return unwrap<FactoryDashboardDto>(await FactoryControllerService.dashboard1());
};

// Tasks
// Define listTasks once, merging logic
export const listTasks = async (params: any = {}, session?: AuthSession | null): Promise<FactoryTaskDto[]> => {
    withSession(session);
    // Manual call to support filters if generated client is limited
    const usp = new URLSearchParams();
    if (params?.status) usp.append('status', params.status);
    if (params?.assignee) usp.append('assignee', params.assignee);
    return apiData<FactoryTaskDto[]>(`/api/v1/factory/tasks?${usp.toString()}`, {}, session);
}

export const createTask = async (payload: FactoryTaskRequest, session?: AuthSession | null): Promise<FactoryTaskDto> => {
    withSession(session);
    // return unwrap<FactoryTaskDto>(await FactoryControllerService.createTask(payload)); 
    // If createTask missing in service:
    return apiData<FactoryTaskDto>('/api/v1/factory/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
    }, session);
}

export const updateTask = async (id: number, payload: FactoryTaskRequest, session?: AuthSession | null): Promise<FactoryTaskDto> => {
  withSession(session);
  // FactoryControllerService.updateTask might be updateTask1 or similar?
  // Checking service definition would be good, but assuming standard name or falling back to manual
  // return unwrap<FactoryTaskDto>(await FactoryControllerService.updateTask(id, payload));
  return apiData<FactoryTaskDto>(`/api/v1/factory/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
  }, session);
};

// Production Plans
export const listProductionPlans = async (session?: AuthSession | null): Promise<ProductionPlanDto[]> => {
  withSession(session);
  return unwrap<ProductionPlanDto[]>(await FactoryControllerService.plans());
};

export const createProductionPlan = async (payload: ProductionPlanRequest, session?: AuthSession | null): Promise<ProductionPlanDto> => {
  withSession(session);
  return unwrap<ProductionPlanDto>(await FactoryControllerService.createPlan(payload));
};

export const updateProductionPlan = async (id: number, payload: ProductionPlanRequest, session?: AuthSession | null): Promise<ProductionPlanDto> => {
  withSession(session);
  return unwrap<ProductionPlanDto>(await FactoryControllerService.updatePlan(id, payload));
};

export const deleteProductionPlan = async (id: number, session?: AuthSession | null): Promise<void> => {
  withSession(session);
  return unwrap<void>(await FactoryControllerService.deletePlan(id));
};

export const updateProductionPlanStatus = async (id: number, status: string, session?: AuthSession | null): Promise<ProductionPlanDto> => {
  withSession(session);
  return apiData<ProductionPlanDto>(`/api/v1/factory/production-plans/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, session);
};

// Raw Materials
export const listRawMaterials = async (session?: AuthSession | null, materialType?: string): Promise<RawMaterialDto[]> => {
  withSession(session);
  if (materialType) {
      const usp = new URLSearchParams();
      usp.set('materialType', materialType);
      return apiData<RawMaterialDto[]>(`/api/v1/accounting/raw-materials?${usp.toString()}`, {}, session);
  }
  return unwrap<RawMaterialDto[]>(await RawMaterialControllerService.listRawMaterials());
};

export const createRawMaterial = async (payload: RawMaterialRequest, session?: AuthSession | null): Promise<RawMaterialDto> => {
  withSession(session);
  return unwrap<RawMaterialDto>(await RawMaterialControllerService.createRawMaterial(payload));
};

export const updateRawMaterial = async (id: number, payload: RawMaterialRequest, session?: AuthSession | null): Promise<RawMaterialDto> => {
  withSession(session);
  return unwrap<RawMaterialDto>(await RawMaterialControllerService.updateRawMaterial(id, payload));
};

export const deleteRawMaterial = async (id: number, session?: AuthSession | null): Promise<void> => {
  withSession(session);
  return unwrap<void>(await RawMaterialControllerService.deleteRawMaterial(id));
};

export const intakeRawMaterial = async (payload: RawMaterialIntakeRequest, session?: AuthSession | null): Promise<void> => {
  withSession(session);
  return unwrap<void>(await RawMaterialControllerService.intake(payload));
};

export const listRawMaterialBatches = async (rawMaterialId: number, session?: AuthSession | null): Promise<RawMaterialBatchDto[]> => {
  withSession(session);
  return unwrap<RawMaterialBatchDto[]>(await RawMaterialControllerService.batches(rawMaterialId));
};

export const importOpeningStock = async (file: File, session?: AuthSession | null): Promise<OpeningStockImportResponse> => {
  withSession(session);
  const formData = new FormData();
  formData.append('file', file);
  return apiData<OpeningStockImportResponse>('/api/v1/inventory/opening-stock', {
    method: 'POST',
    body: formData,
  }, session);
};

export const addRawMaterialBatch = async (rawMaterialId: number, payload: RawMaterialBatchRequest, session?: AuthSession | null): Promise<RawMaterialBatchDto> => {
  withSession(session);
  return unwrap<RawMaterialBatchDto>(await RawMaterialControllerService.createBatch(rawMaterialId, payload));
};

// Finished Goods
export const listFinishedGoods = async (session?: AuthSession | null): Promise<FinishedGoodDto[]> => {
  withSession(session);
  return unwrap<FinishedGoodDto[]>(await FinishedGoodControllerService.listFinishedGoods());
};

export const createFinishedGood = async (payload: FinishedGoodRequest, session?: AuthSession | null): Promise<FinishedGoodDto> => {
    withSession(session);
    // Manual mapping if needed, but trying direct service call
    // Note: service expects FinishedGoodRequest, ensure payload matches
    // return unwrap<FinishedGoodDto>(await FinishedGoodControllerService.createFinishedGood(payload));
    // Using manual apiData to be safe with DTO shapes
    return apiData<FinishedGoodDto>('/api/v1/finished-goods', {
        method: 'POST',
        body: JSON.stringify(payload)
    }, session);
}

export const updateFinishedGood = async (id: number, payload: FinishedGoodRequest, session?: AuthSession | null): Promise<FinishedGoodDto> => {
    withSession(session);
    return apiData<FinishedGoodDto>(`/api/v1/finished-goods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    }, session);
}

export const getFinishedGoodsLowStock = async (session?: AuthSession | null): Promise<FinishedGoodDto[]> => {
    withSession(session);
    return unwrap<FinishedGoodDto[]>(await FinishedGoodControllerService.getLowStockItems());
}

export const listFinishedGoodBatches = async (id: number, session?: AuthSession | null): Promise<FinishedGoodBatchDto[]> => {
    withSession(session);
    return unwrap<FinishedGoodBatchDto[]>(await FinishedGoodControllerService.listBatches(id));
}

// Inventory Adjustments
export const listInventoryAdjustments = async (session?: AuthSession | null): Promise<InventoryAdjustmentDto[]> => {
  withSession(session);
  return unwrap<InventoryAdjustmentDto[]>(await InventoryAdjustmentControllerService.listAdjustments());
};

export const createInventoryAdjustment = async (payload: InventoryAdjustmentRequest, session?: AuthSession | null): Promise<InventoryAdjustmentDto> => {
  withSession(session);
  return unwrap<InventoryAdjustmentDto>(await InventoryAdjustmentControllerService.createAdjustment(payload));
};

// Packaging Mappings
export const listPackagingMappings = async (session?: AuthSession | null): Promise<PackagingSizeMappingDto[]> => {
  withSession(session);
  return unwrap<PackagingSizeMappingDto[]>(await PackagingMappingControllerService.listMappings());
};

export const createPackagingMapping = async (payload: PackagingSizeMappingRequest, session?: AuthSession | null): Promise<PackagingSizeMappingDto> => {
  withSession(session);
  return unwrap<PackagingSizeMappingDto>(await PackagingMappingControllerService.createMapping(payload));
};

export const updatePackagingMapping = async (id: number, payload: PackagingSizeMappingRequest, session?: AuthSession | null): Promise<PackagingSizeMappingDto> => {
  withSession(session);
  return unwrap<PackagingSizeMappingDto>(await PackagingMappingControllerService.updateMapping(id, payload));
};

export const deactivatePackagingMapping = async (id: number, session?: AuthSession | null): Promise<void> => {
  withSession(session);
  return unwrap<void>(await PackagingMappingControllerService.deactivateMapping(id));
};

// Production Logs
export const listProductionLogs = async (session?: AuthSession | null): Promise<ProductionLogDto[]> => {
  withSession(session);
  return unwrap<ProductionLogDto[]>(await ProductionLogControllerService.list());
};

export const createProductionLog = async (payload: ProductionLogRequest, session?: AuthSession | null): Promise<ProductionLogDetailDto> => {
    withSession(session);
    // ProductionLogControllerService.create?
    // return unwrap<ProductionLogDto>(await ProductionLogControllerService.create(payload));
    return apiData<ProductionLogDetailDto>('/api/v1/factory/production/logs', {
        method: 'POST',
        body: JSON.stringify(payload)
    }, session);
}

export const getProductionLog = async (id: number, session?: AuthSession | null): Promise<ProductionLogDetailDto> => {
    withSession(session);
    // return unwrap<ProductionLogDetailDto>(await ProductionLogControllerService.detail(id));
    return apiData<ProductionLogDetailDto>(`/api/v1/factory/production/logs/${id}`, {}, session);
}

// Production Batches
export const listProductionBatches = async (session?: AuthSession | null): Promise<ProductionBatchDto[]> => {
    withSession(session);
    return unwrap<ProductionBatchDto[]>(await FactoryControllerService.batches1());
};

export const createProductionBatch = async (payload: ProductionBatchRequest, planId?: number, session?: AuthSession | null): Promise<ProductionBatchDto> => {
    withSession(session);
    const url = planId ? `/api/v1/factory/production-batches?planId=${planId}` : '/api/v1/factory/production-batches';
    return apiData<ProductionBatchDto>(url, {
        method: 'POST',
        body: JSON.stringify(payload)
    }, session);
}

// Production Brands & Catalog
export const listProductionBrands = async (session?: AuthSession | null): Promise<ProductionBrandDto[]> => {
    withSession(session);
    return unwrap<ProductionBrandDto[]>(await ProductionCatalogControllerService.listBrands());
}

export const listBrandProducts = async (brandId: number, session?: AuthSession | null): Promise<ProductionProductCatalogDto[]> => {
    withSession(session);
    // return unwrap<ProductionProductCatalogDto[]>(await ProductionCatalogControllerService.listBrandProducts(brandId));
    // Service might return generic list
    return apiData<ProductionProductCatalogDto[]>(`/api/v1/production/brands/${brandId}/products`, {}, session);
}

// Packing
export const listUnpackedBatches = async (session?: AuthSession | null): Promise<UnpackedBatchDto[]> => {
    withSession(session);
    return unwrap<UnpackedBatchDto[]>(await PackingControllerService.listUnpackedBatches());
}

export const createPackingRecord = async (payload: PackingRequest, session?: AuthSession | null): Promise<PackingRecordDto> => {
    withSession(session);
    return unwrap<PackingRecordDto>(await PackingControllerService.recordPacking(payload));
}

export const completePackingForLog = async (productionLogId: number, session?: AuthSession | null): Promise<void> => {
    withSession(session);
    await PackingControllerService.completePacking(productionLogId);
}

export const getPackingHistory = async (productionLogId: number, session?: AuthSession | null): Promise<PackingRecordDto[]> => {
    withSession(session);
    return unwrap<PackingRecordDto[]>(await PackingControllerService.packingHistory(productionLogId));
}

export const packFinishedGoods = async (payload: PackRequest, session?: AuthSession | null): Promise<PackResponse> => {
    withSession(session);
    return unwrap(await PackingControllerService.packBulkToSizes(payload));
}

export const listBulkBatches = async (finishedGoodId: number, session?: AuthSession | null): Promise<BulkBatchDto[]> => {
    withSession(session);
    return unwrap(await PackingControllerService.listBulkBatches(finishedGoodId));
}

export const getStockSummary = async (session?: AuthSession | null): Promise<StockSummaryDto> => {
    withSession(session);
    // RawMaterialControllerService.stockSummary?
    return apiData<StockSummaryDto>('/api/v1/raw-materials/stock', {}, session);
}

export const listLowStock = async (session?: AuthSession | null): Promise<InventoryStockSnapshotDto[]> => {
    withSession(session);
    return apiData<InventoryStockSnapshotDto[]>('/api/v1/raw-materials/stock/low-stock', {}, session);
}

export const listInventorySnapshots = async (session?: AuthSession | null): Promise<InventoryStockSnapshotDto[]> => {
    withSession(session);
    return apiData<InventoryStockSnapshotDto[]>('/api/v1/raw-materials/stock/inventory', {}, session);
}

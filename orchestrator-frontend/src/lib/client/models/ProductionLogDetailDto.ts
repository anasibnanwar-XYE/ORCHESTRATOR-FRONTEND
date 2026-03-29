/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductionLogMaterialDto } from './ProductionLogMaterialDto';
export type ProductionLogDetailDto = {
    id?: number;
    publicId?: string;
    productionCode?: string;
    producedAt?: string;
    brandName?: string;
    productName?: string;
    skuCode?: string;
    batchColour?: string;
    batchSize?: number;
    unitOfMeasure?: string;
    mixedQuantity?: number;
    totalPackedQuantity?: number;
    wastageQuantity?: number;
    status?: string;
    materialCostTotal?: number;
    laborCostTotal?: number;
    overheadCostTotal?: number;
    unitCost?: number;
    salesOrderId?: number;
    salesOrderNumber?: string;
    notes?: string;
    createdBy?: string;
    materials?: Array<ProductionLogMaterialDto>;
};


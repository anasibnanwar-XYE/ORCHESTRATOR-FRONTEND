/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MaterialUsageRequest } from './MaterialUsageRequest';
export type ProductionLogRequest = {
    brandId: number;
    productId: number;
    batchColour?: string;
    batchSize: number;
    unitOfMeasure?: string;
    mixedQuantity: number;
    producedAt?: string;
    notes?: string;
    addToFinishedGoods?: boolean;
    salesOrderId?: number;
    laborCost?: number;
    overheadCost?: number;
    materials: Array<MaterialUsageRequest>;
};


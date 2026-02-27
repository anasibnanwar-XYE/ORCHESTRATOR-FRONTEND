/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InventoryAdjustmentLineDto } from './InventoryAdjustmentLineDto';
export type InventoryAdjustmentDto = {
    id?: number;
    publicId?: string;
    referenceNumber?: string;
    adjustmentDate?: string;
    type?: string;
    status?: string;
    reason?: string;
    totalAmount?: number;
    journalEntryId?: number;
    lines?: Array<InventoryAdjustmentLineDto>;
};


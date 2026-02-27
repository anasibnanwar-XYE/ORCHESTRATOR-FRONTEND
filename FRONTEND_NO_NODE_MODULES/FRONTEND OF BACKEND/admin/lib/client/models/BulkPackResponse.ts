/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChildBatchDto } from './ChildBatchDto';
export type BulkPackResponse = {
    bulkBatchId?: number;
    bulkBatchCode?: string;
    volumeDeducted?: number;
    remainingBulkQuantity?: number;
    packagingCost?: number;
    childBatches?: Array<ChildBatchDto>;
    journalEntryId?: number;
    packedAt?: string;
};


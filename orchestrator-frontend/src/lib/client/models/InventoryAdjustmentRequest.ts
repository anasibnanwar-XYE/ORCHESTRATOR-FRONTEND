/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LineRequest } from './LineRequest';
export type InventoryAdjustmentRequest = {
    adjustmentDate?: string;
    type: InventoryAdjustmentRequest.type;
    adjustmentAccountId: number;
    reason?: string;
    adminOverride?: boolean;
    lines: Array<LineRequest>;
};
export namespace InventoryAdjustmentRequest {
    export enum type {
        DAMAGED = 'DAMAGED',
        SHRINKAGE = 'SHRINKAGE',
        OBSOLETE = 'OBSOLETE',
    }
}


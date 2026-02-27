/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WipAdjustmentRequest = {
    productionLogId: number;
    amount: number;
    wipAccountId: number;
    inventoryAccountId: number;
    direction: WipAdjustmentRequest.direction;
    memo?: string;
    entryDate?: string;
    referenceNumber?: string;
    idempotencyKey?: string;
    adminOverride?: boolean;
};
export namespace WipAdjustmentRequest {
    export enum direction {
        ISSUE = 'ISSUE',
        COMPLETION = 'COMPLETION',
    }
}


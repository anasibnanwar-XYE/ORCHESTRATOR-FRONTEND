/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type InventoryRevaluationRequest = {
    inventoryAccountId: number;
    revaluationAccountId: number;
    deltaAmount: number;
    memo?: string;
    entryDate?: string;
    referenceNumber?: string;
    idempotencyKey?: string;
    adminOverride?: boolean;
};


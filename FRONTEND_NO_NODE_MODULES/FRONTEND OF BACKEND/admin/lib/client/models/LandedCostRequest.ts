/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LandedCostRequest = {
    rawMaterialPurchaseId: number;
    amount: number;
    inventoryAccountId: number;
    offsetAccountId: number;
    entryDate?: string;
    memo?: string;
    referenceNumber?: string;
    idempotencyKey?: string;
    adminOverride?: boolean;
};


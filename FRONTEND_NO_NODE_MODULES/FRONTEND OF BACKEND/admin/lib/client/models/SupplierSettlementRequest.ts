/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SettlementAllocationRequest } from './SettlementAllocationRequest';
export type SupplierSettlementRequest = {
    supplierId: number;
    cashAccountId: number;
    discountAccountId?: number;
    writeOffAccountId?: number;
    fxGainAccountId?: number;
    fxLossAccountId?: number;
    settlementDate?: string;
    referenceNumber?: string;
    memo?: string;
    idempotencyKey?: string;
    adminOverride?: boolean;
    allocations: Array<SettlementAllocationRequest>;
};


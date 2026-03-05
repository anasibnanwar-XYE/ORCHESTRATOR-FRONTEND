/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AccrualRequest = {
    debitAccountId: number;
    creditAccountId: number;
    amount: number;
    entryDate?: string;
    referenceNumber?: string;
    memo?: string;
    idempotencyKey?: string;
    autoReverseDate?: string;
    adminOverride?: boolean;
};


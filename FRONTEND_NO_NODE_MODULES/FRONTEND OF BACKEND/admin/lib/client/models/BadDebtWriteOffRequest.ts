/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BadDebtWriteOffRequest = {
    invoiceId: number;
    expenseAccountId: number;
    amount: number;
    entryDate?: string;
    referenceNumber?: string;
    memo?: string;
    idempotencyKey?: string;
    adminOverride?: boolean;
};


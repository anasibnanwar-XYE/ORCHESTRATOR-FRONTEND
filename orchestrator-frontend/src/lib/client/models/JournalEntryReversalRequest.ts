/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type JournalEntryReversalRequest = {
    reversalDate?: string;
    voidOnly?: boolean;
    reason?: string;
    memo?: string;
    adminOverride?: boolean;
    reversalPercentage?: number;
    cascadeRelatedEntries?: boolean;
    relatedEntryIds?: Array<number>;
    reasonCode?: JournalEntryReversalRequest.reasonCode;
    approvedBy?: string;
    supportingDocumentRef?: string;
    partialReversal?: boolean;
    effectivePercentage?: number;
};
export namespace JournalEntryReversalRequest {
    export enum reasonCode {
        CUSTOMER_RETURN = 'CUSTOMER_RETURN',
        VENDOR_CREDIT = 'VENDOR_CREDIT',
        PRICING_ERROR = 'PRICING_ERROR',
        DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
        WRONG_ACCOUNT = 'WRONG_ACCOUNT',
        WRONG_PERIOD = 'WRONG_PERIOD',
        FRAUD_CORRECTION = 'FRAUD_CORRECTION',
        SYSTEM_ERROR = 'SYSTEM_ERROR',
        AUDIT_ADJUSTMENT = 'AUDIT_ADJUSTMENT',
        OTHER = 'OTHER',
    }
}


/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JournalLineRequest } from './JournalLineRequest';
export type JournalEntryRequest = {
    referenceNumber?: string;
    entryDate: string;
    memo?: string;
    dealerId?: number;
    supplierId?: number;
    adminOverride?: boolean;
    lines: Array<JournalLineRequest>;
    currency?: string;
    fxRate?: number;
};


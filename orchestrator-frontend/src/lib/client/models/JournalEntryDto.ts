/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JournalLineDto } from './JournalLineDto';
export type JournalEntryDto = {
    id?: number;
    publicId?: string;
    referenceNumber?: string;
    entryDate?: string;
    memo?: string;
    status?: string;
    dealerId?: number;
    dealerName?: string;
    supplierId?: number;
    supplierName?: string;
    accountingPeriodId?: number;
    accountingPeriodLabel?: string;
    accountingPeriodStatus?: string;
    reversalOfEntryId?: number;
    reversalEntryId?: number;
    correctionType?: string;
    correctionReason?: string;
    voidReason?: string;
    lines?: Array<JournalLineDto>;
    createdAt?: string;
    updatedAt?: string;
    postedAt?: string;
    createdBy?: string;
    postedBy?: string;
    lastModifiedBy?: string;
};


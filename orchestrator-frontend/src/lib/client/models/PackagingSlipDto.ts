/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PackagingSlipLineDto } from './PackagingSlipLineDto';
export type PackagingSlipDto = {
    id?: number;
    publicId?: string;
    salesOrderId?: number;
    orderNumber?: string;
    dealerName?: string;
    slipNumber?: string;
    status?: string;
    createdAt?: string;
    confirmedAt?: string;
    confirmedBy?: string;
    dispatchedAt?: string;
    dispatchNotes?: string;
    journalEntryId?: number;
    cogsJournalEntryId?: number;
    lines?: Array<PackagingSlipLineDto>;
};


/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LineResult } from './LineResult';
export type DispatchConfirmationResponse = {
    packagingSlipId?: number;
    slipNumber?: string;
    status?: string;
    confirmedAt?: string;
    confirmedBy?: string;
    totalOrderedAmount?: number;
    totalShippedAmount?: number;
    totalBackorderAmount?: number;
    journalEntryId?: number;
    cogsJournalEntryId?: number;
    lines?: Array<LineResult>;
    backorderSlipId?: number;
};


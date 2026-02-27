/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountPostingDto } from './AccountPostingDto';
import type { CogsPostingDto } from './CogsPostingDto';
export type DispatchConfirmResponse = {
    packingSlipId?: number;
    salesOrderId?: number;
    finalInvoiceId?: number;
    arJournalEntryId?: number;
    cogsPostings?: Array<CogsPostingDto>;
    dispatched?: boolean;
    arPostings?: Array<AccountPostingDto>;
};


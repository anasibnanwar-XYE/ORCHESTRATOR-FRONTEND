/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Allocation } from './Allocation';
import type { JournalEntryDto } from './JournalEntryDto';
export type PartnerSettlementResponse = {
    journalEntry?: JournalEntryDto;
    totalApplied?: number;
    cashAmount?: number;
    totalDiscount?: number;
    totalWriteOff?: number;
    totalFxGain?: number;
    totalFxLoss?: number;
    allocations?: Array<Allocation>;
};


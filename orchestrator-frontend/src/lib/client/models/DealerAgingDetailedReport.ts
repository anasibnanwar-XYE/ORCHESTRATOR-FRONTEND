/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgingBuckets } from './AgingBuckets';
import type { AgingLineItem } from './AgingLineItem';
export type DealerAgingDetailedReport = {
    dealerId?: number;
    dealerCode?: string;
    dealerName?: string;
    lineItems?: Array<AgingLineItem>;
    buckets?: AgingBuckets;
    totalOutstanding?: number;
    averageDSO?: number;
};


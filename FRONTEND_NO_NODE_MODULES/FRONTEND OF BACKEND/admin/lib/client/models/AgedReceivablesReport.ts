/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgingBuckets } from './AgingBuckets';
import type { DealerAgingDetail } from './DealerAgingDetail';
export type AgedReceivablesReport = {
    asOfDate?: string;
    dealers?: Array<DealerAgingDetail>;
    totalBuckets?: AgingBuckets;
    grandTotal?: number;
};


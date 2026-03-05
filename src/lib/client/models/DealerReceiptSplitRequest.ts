/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IncomingLine } from './IncomingLine';
export type DealerReceiptSplitRequest = {
    dealerId: number;
    incomingLines: Array<IncomingLine>;
    referenceNumber?: string;
    memo?: string;
};


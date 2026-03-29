/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LinePreview } from './LinePreview';
export type DispatchPreviewDto = {
    packagingSlipId?: number;
    slipNumber?: string;
    status?: string;
    salesOrderId?: number;
    salesOrderNumber?: string;
    dealerName?: string;
    dealerCode?: string;
    createdAt?: string;
    totalOrderedAmount?: number;
    totalAvailableAmount?: number;
    lines?: Array<LinePreview>;
};


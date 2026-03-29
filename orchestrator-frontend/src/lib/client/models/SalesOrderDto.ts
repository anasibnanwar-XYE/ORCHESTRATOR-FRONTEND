/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SalesOrderItemDto } from './SalesOrderItemDto';
export type SalesOrderDto = {
    id?: number;
    publicId?: string;
    orderNumber?: string;
    status?: string;
    totalAmount?: number;
    subtotalAmount?: number;
    gstTotal?: number;
    gstRate?: number;
    gstTreatment?: string;
    gstRoundingAdjustment?: number;
    currency?: string;
    dealerName?: string;
    traceId?: string;
    createdAt?: string;
    items?: Array<SalesOrderItemDto>;
};


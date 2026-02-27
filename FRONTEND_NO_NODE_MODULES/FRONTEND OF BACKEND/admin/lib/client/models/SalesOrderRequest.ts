/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SalesOrderItemRequest } from './SalesOrderItemRequest';
export type SalesOrderRequest = {
    dealerId?: number;
    totalAmount: number;
    currency?: string;
    notes?: string;
    items: Array<SalesOrderItemRequest>;
    gstTreatment?: string;
    gstRate?: number;
    gstInclusive?: boolean;
    idempotencyKey?: string;
};


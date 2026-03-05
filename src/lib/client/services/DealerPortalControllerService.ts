/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseMapStringObject } from '../models/ApiResponseMapStringObject';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DealerPortalControllerService {
    /**
     * @returns ApiResponseMapStringObject OK
     * @throws ApiError
     */
    public static getMyOrders(): CancelablePromise<ApiResponseMapStringObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealer-portal/orders',
        });
    }
    /**
     * @returns ApiResponseMapStringObject OK
     * @throws ApiError
     */
    public static getMyLedger(): CancelablePromise<ApiResponseMapStringObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealer-portal/ledger',
        });
    }
    /**
     * @returns ApiResponseMapStringObject OK
     * @throws ApiError
     */
    public static getMyInvoices(): CancelablePromise<ApiResponseMapStringObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealer-portal/invoices',
        });
    }
    /**
     * Download invoice PDF (dealer scoped)
     * @param invoiceId
     * @returns binary PDF document
     * @throws ApiError
     */
    public static getMyInvoicePdf(
        invoiceId: number,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealer-portal/invoices/{invoiceId}/pdf',
            path: {
                'invoiceId': invoiceId,
            },
        });
    }
    /**
     * @returns ApiResponseMapStringObject OK
     * @throws ApiError
     */
    public static getDashboard(): CancelablePromise<ApiResponseMapStringObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealer-portal/dashboard',
        });
    }
    /**
     * @returns ApiResponseMapStringObject OK
     * @throws ApiError
     */
    public static getMyAging(): CancelablePromise<ApiResponseMapStringObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealer-portal/aging',
        });
    }
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseInvoiceDto } from '../models/ApiResponseInvoiceDto';
import type { ApiResponseListInvoiceDto } from '../models/ApiResponseListInvoiceDto';
import type { ApiResponseString } from '../models/ApiResponseString';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvoiceControllerService {
    /**
     * @param id
     * @returns ApiResponseString OK
     * @throws ApiError
     */
    public static sendInvoiceEmail(
        id: number,
    ): CancelablePromise<ApiResponseString> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/invoices/{id}/email',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListInvoiceDto OK
     * @throws ApiError
     */
    public static listInvoices(): CancelablePromise<ApiResponseListInvoiceDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/invoices',
        });
    }
    /**
     * @param id
     * @returns ApiResponseInvoiceDto OK
     * @throws ApiError
     */
    public static getInvoice(
        id: number,
    ): CancelablePromise<ApiResponseInvoiceDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/invoices/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Download invoice PDF
     * @param id
     * @returns binary PDF document
     * @throws ApiError
     */
    public static downloadInvoicePdf(
        id: number,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/invoices/{id}/pdf',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param dealerId
     * @returns ApiResponseListInvoiceDto OK
     * @throws ApiError
     */
    public static dealerInvoices(
        dealerId: number,
    ): CancelablePromise<ApiResponseListInvoiceDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/invoices/dealers/{dealerId}',
            path: {
                'dealerId': dealerId,
            },
        });
    }
}

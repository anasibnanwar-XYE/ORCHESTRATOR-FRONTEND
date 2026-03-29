/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDealerResponse } from '../models/ApiResponseDealerResponse';
import type { ApiResponseListDealerLookupResponse } from '../models/ApiResponseListDealerLookupResponse';
import type { ApiResponseListDealerResponse } from '../models/ApiResponseListDealerResponse';
import type { ApiResponseMapStringObject } from '../models/ApiResponseMapStringObject';
import type { CreateDealerRequest } from '../models/CreateDealerRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DealerControllerService {
    /**
     * @param dealerId
     * @param requestBody
     * @returns ApiResponseDealerResponse OK
     * @throws ApiError
     */
    public static updateDealer(
        dealerId: number,
        requestBody: CreateDealerRequest,
    ): CancelablePromise<ApiResponseDealerResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/dealers/{dealerId}',
            path: {
                'dealerId': dealerId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListDealerResponse OK
     * @throws ApiError
     */
    public static listDealers1(): CancelablePromise<ApiResponseListDealerResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealers',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseDealerResponse OK
     * @throws ApiError
     */
    public static createDealer(
        requestBody: CreateDealerRequest,
    ): CancelablePromise<ApiResponseDealerResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/dealers',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param dealerId
     * @param overdueDays
     * @param minAmount
     * @returns ApiResponseMapStringObject OK
     * @throws ApiError
     */
    public static holdIfOverdue(
        dealerId: number,
        overdueDays: number = 45,
        minAmount?: number,
    ): CancelablePromise<ApiResponseMapStringObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/dealers/{dealerId}/dunning/hold',
            path: {
                'dealerId': dealerId,
            },
            query: {
                'overdueDays': overdueDays,
                'minAmount': minAmount,
            },
        });
    }
    /**
     * @param dealerId
     * @returns ApiResponseMapStringObject OK
     * @throws ApiError
     */
    public static dealerLedger(
        dealerId: number,
    ): CancelablePromise<ApiResponseMapStringObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealers/{dealerId}/ledger',
            path: {
                'dealerId': dealerId,
            },
        });
    }
    /**
     * @param dealerId
     * @returns ApiResponseMapStringObject OK
     * @throws ApiError
     */
    public static dealerInvoices1(
        dealerId: number,
    ): CancelablePromise<ApiResponseMapStringObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealers/{dealerId}/invoices',
            path: {
                'dealerId': dealerId,
            },
        });
    }
    /**
     * @param dealerId
     * @returns ApiResponseMapStringObject OK
     * @throws ApiError
     */
    public static dealerAging(
        dealerId: number,
    ): CancelablePromise<ApiResponseMapStringObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealers/{dealerId}/aging',
            path: {
                'dealerId': dealerId,
            },
        });
    }
    /**
     * @param query
     * @returns ApiResponseListDealerLookupResponse OK
     * @throws ApiError
     */
    public static searchDealers1(
        query: string = '',
    ): CancelablePromise<ApiResponseListDealerLookupResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dealers/search',
            query: {
                'query': query,
            },
        });
    }
}

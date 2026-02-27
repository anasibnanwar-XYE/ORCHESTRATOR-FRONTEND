/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseFinishedGoodBatchDto } from '../models/ApiResponseFinishedGoodBatchDto';
import type { ApiResponseFinishedGoodDto } from '../models/ApiResponseFinishedGoodDto';
import type { ApiResponseListFinishedGoodBatchDto } from '../models/ApiResponseListFinishedGoodBatchDto';
import type { ApiResponseListFinishedGoodDto } from '../models/ApiResponseListFinishedGoodDto';
import type { ApiResponseListStockSummaryDto } from '../models/ApiResponseListStockSummaryDto';
import type { FinishedGoodBatchRequest } from '../models/FinishedGoodBatchRequest';
import type { FinishedGoodRequest } from '../models/FinishedGoodRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FinishedGoodControllerService {
    /**
     * @param id
     * @returns ApiResponseFinishedGoodDto OK
     * @throws ApiError
     */
    public static getFinishedGood(
        id: number,
    ): CancelablePromise<ApiResponseFinishedGoodDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/finished-goods/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseFinishedGoodDto OK
     * @throws ApiError
     */
    public static updateFinishedGood(
        id: number,
        requestBody: FinishedGoodRequest,
    ): CancelablePromise<ApiResponseFinishedGoodDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/finished-goods/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListFinishedGoodDto OK
     * @throws ApiError
     */
    public static listFinishedGoods(): CancelablePromise<ApiResponseListFinishedGoodDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/finished-goods',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseFinishedGoodDto OK
     * @throws ApiError
     */
    public static createFinishedGood(
        requestBody: FinishedGoodRequest,
    ): CancelablePromise<ApiResponseFinishedGoodDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/finished-goods',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ApiResponseListFinishedGoodBatchDto OK
     * @throws ApiError
     */
    public static listBatches(
        id: number,
    ): CancelablePromise<ApiResponseListFinishedGoodBatchDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/finished-goods/{id}/batches',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseFinishedGoodBatchDto OK
     * @throws ApiError
     */
    public static registerBatch(
        id: number,
        requestBody: FinishedGoodBatchRequest,
    ): CancelablePromise<ApiResponseFinishedGoodBatchDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/finished-goods/{id}/batches',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListStockSummaryDto OK
     * @throws ApiError
     */
    public static getStockSummary(): CancelablePromise<ApiResponseListStockSummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/finished-goods/stock-summary',
        });
    }
    /**
     * @param threshold
     * @returns ApiResponseListFinishedGoodDto OK
     * @throws ApiError
     */
    public static getLowStockItems(
        threshold: number = 100,
    ): CancelablePromise<ApiResponseListFinishedGoodDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/finished-goods/low-stock',
            query: {
                'threshold': threshold,
            },
        });
    }
}

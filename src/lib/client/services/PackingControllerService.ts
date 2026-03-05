/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBulkPackResponse } from '../models/ApiResponseBulkPackResponse';
import type { ApiResponseListChildBatchDto } from '../models/ApiResponseListChildBatchDto';
import type { ApiResponseListPackingRecordDto } from '../models/ApiResponseListPackingRecordDto';
import type { ApiResponseListUnpackedBatchDto } from '../models/ApiResponseListUnpackedBatchDto';
import type { ApiResponseProductionLogDetailDto } from '../models/ApiResponseProductionLogDetailDto';
import type { BulkPackRequest } from '../models/BulkPackRequest';
import type { PackingRequest } from '../models/PackingRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PackingControllerService {
    /**
     * @param requestBody
     * @returns ApiResponseProductionLogDetailDto OK
     * @throws ApiError
     */
    public static recordPacking(
        requestBody: PackingRequest,
    ): CancelablePromise<ApiResponseProductionLogDetailDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/factory/packing-records',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param productionLogId
     * @returns ApiResponseProductionLogDetailDto OK
     * @throws ApiError
     */
    public static completePacking(
        productionLogId: number,
    ): CancelablePromise<ApiResponseProductionLogDetailDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/factory/packing-records/{productionLogId}/complete',
            path: {
                'productionLogId': productionLogId,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseBulkPackResponse OK
     * @throws ApiError
     */
    public static packBulkToSizes(
        requestBody: BulkPackRequest,
    ): CancelablePromise<ApiResponseBulkPackResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/factory/pack',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListUnpackedBatchDto OK
     * @throws ApiError
     */
    public static listUnpackedBatches(): CancelablePromise<ApiResponseListUnpackedBatchDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/unpacked-batches',
        });
    }
    /**
     * @param productionLogId
     * @returns ApiResponseListPackingRecordDto OK
     * @throws ApiError
     */
    public static packingHistory(
        productionLogId: number,
    ): CancelablePromise<ApiResponseListPackingRecordDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/production-logs/{productionLogId}/packing-history',
            path: {
                'productionLogId': productionLogId,
            },
        });
    }
    /**
     * @param parentBatchId
     * @returns ApiResponseListChildBatchDto OK
     * @throws ApiError
     */
    public static listChildBatches(
        parentBatchId: number,
    ): CancelablePromise<ApiResponseListChildBatchDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/bulk-batches/{parentBatchId}/children',
            path: {
                'parentBatchId': parentBatchId,
            },
        });
    }
    /**
     * @param finishedGoodId
     * @returns ApiResponseListChildBatchDto OK
     * @throws ApiError
     */
    public static listBulkBatches(
        finishedGoodId: number,
    ): CancelablePromise<ApiResponseListChildBatchDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/bulk-batches/{finishedGoodId}',
            path: {
                'finishedGoodId': finishedGoodId,
            },
        });
    }
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListInventoryStockSnapshot } from '../models/ApiResponseListInventoryStockSnapshot';
import type { ApiResponseListRawMaterialBatchDto } from '../models/ApiResponseListRawMaterialBatchDto';
import type { ApiResponseListRawMaterialDto } from '../models/ApiResponseListRawMaterialDto';
import type { ApiResponseRawMaterialBatchDto } from '../models/ApiResponseRawMaterialBatchDto';
import type { ApiResponseRawMaterialDto } from '../models/ApiResponseRawMaterialDto';
import type { ApiResponseStockSummaryDto } from '../models/ApiResponseStockSummaryDto';
import type { RawMaterialBatchRequest } from '../models/RawMaterialBatchRequest';
import type { RawMaterialIntakeRequest } from '../models/RawMaterialIntakeRequest';
import type { RawMaterialRequest } from '../models/RawMaterialRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RawMaterialControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseRawMaterialDto OK
     * @throws ApiError
     */
    public static updateRawMaterial(
        id: number,
        requestBody: RawMaterialRequest,
    ): CancelablePromise<ApiResponseRawMaterialDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/accounting/raw-materials/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteRawMaterial(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/accounting/raw-materials/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseRawMaterialBatchDto OK
     * @throws ApiError
     */
    public static intake(
        requestBody: RawMaterialIntakeRequest,
    ): CancelablePromise<ApiResponseRawMaterialBatchDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/raw-materials/intake',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param rawMaterialId
     * @returns ApiResponseListRawMaterialBatchDto OK
     * @throws ApiError
     */
    public static batches(
        rawMaterialId: number,
    ): CancelablePromise<ApiResponseListRawMaterialBatchDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/raw-material-batches/{rawMaterialId}',
            path: {
                'rawMaterialId': rawMaterialId,
            },
        });
    }
    /**
     * @param rawMaterialId
     * @param requestBody
     * @returns ApiResponseRawMaterialBatchDto OK
     * @throws ApiError
     */
    public static createBatch(
        rawMaterialId: number,
        requestBody: RawMaterialBatchRequest,
    ): CancelablePromise<ApiResponseRawMaterialBatchDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/raw-material-batches/{rawMaterialId}',
            path: {
                'rawMaterialId': rawMaterialId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListRawMaterialDto OK
     * @throws ApiError
     */
    public static listRawMaterials(): CancelablePromise<ApiResponseListRawMaterialDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/raw-materials',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseRawMaterialDto OK
     * @throws ApiError
     */
    public static createRawMaterial(
        requestBody: RawMaterialRequest,
    ): CancelablePromise<ApiResponseRawMaterialDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/raw-materials',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseStockSummaryDto OK
     * @throws ApiError
     */
    public static stockSummary(): CancelablePromise<ApiResponseStockSummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/raw-materials/stock',
        });
    }
    /**
     * @returns ApiResponseListInventoryStockSnapshot OK
     * @throws ApiError
     */
    public static lowStock(): CancelablePromise<ApiResponseListInventoryStockSnapshot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/raw-materials/stock/low-stock',
        });
    }
    /**
     * @returns ApiResponseListInventoryStockSnapshot OK
     * @throws ApiError
     */
    public static inventory(): CancelablePromise<ApiResponseListInventoryStockSnapshot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/raw-materials/stock/inventory',
        });
    }
}

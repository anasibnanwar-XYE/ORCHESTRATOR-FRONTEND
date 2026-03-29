/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseInventoryAdjustmentDto } from '../models/ApiResponseInventoryAdjustmentDto';
import type { ApiResponseListInventoryAdjustmentDto } from '../models/ApiResponseListInventoryAdjustmentDto';
import type { InventoryAdjustmentRequest } from '../models/InventoryAdjustmentRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InventoryAdjustmentControllerService {
    /**
     * @returns ApiResponseListInventoryAdjustmentDto OK
     * @throws ApiError
     */
    public static listAdjustments(): CancelablePromise<ApiResponseListInventoryAdjustmentDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/inventory/adjustments',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseInventoryAdjustmentDto OK
     * @throws ApiError
     */
    public static createAdjustment(
        requestBody: InventoryAdjustmentRequest,
    ): CancelablePromise<ApiResponseInventoryAdjustmentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/inventory/adjustments',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

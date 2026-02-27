/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDispatchConfirmationResponse } from '../models/ApiResponseDispatchConfirmationResponse';
import type { ApiResponseDispatchPreviewDto } from '../models/ApiResponseDispatchPreviewDto';
import type { ApiResponseListPackagingSlipDto } from '../models/ApiResponseListPackagingSlipDto';
import type { ApiResponsePackagingSlipDto } from '../models/ApiResponsePackagingSlipDto';
import type { DispatchConfirmationRequest } from '../models/DispatchConfirmationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DispatchControllerService {
    /**
     * @param requestBody
     * @returns ApiResponseDispatchConfirmationResponse OK
     * @throws ApiError
     */
    public static confirmDispatch1(
        requestBody: DispatchConfirmationRequest,
    ): CancelablePromise<ApiResponseDispatchConfirmationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/dispatch/confirm',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param slipId
     * @param reason
     * @returns ApiResponsePackagingSlipDto OK
     * @throws ApiError
     */
    public static cancelBackorder(
        slipId: number,
        reason?: string,
    ): CancelablePromise<ApiResponsePackagingSlipDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/dispatch/backorder/{slipId}/cancel',
            path: {
                'slipId': slipId,
            },
            query: {
                'reason': reason,
            },
        });
    }
    /**
     * @param slipId
     * @param status
     * @returns ApiResponsePackagingSlipDto OK
     * @throws ApiError
     */
    public static updateSlipStatus(
        slipId: number,
        status: string,
    ): CancelablePromise<ApiResponsePackagingSlipDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/dispatch/slip/{slipId}/status',
            path: {
                'slipId': slipId,
            },
            query: {
                'status': status,
            },
        });
    }
    /**
     * @param slipId
     * @returns ApiResponsePackagingSlipDto OK
     * @throws ApiError
     */
    public static getPackagingSlip(
        slipId: number,
    ): CancelablePromise<ApiResponsePackagingSlipDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dispatch/slip/{slipId}',
            path: {
                'slipId': slipId,
            },
        });
    }
    /**
     * @param slipId
     * @returns ApiResponseDispatchPreviewDto OK
     * @throws ApiError
     */
    public static getDispatchPreview(
        slipId: number,
    ): CancelablePromise<ApiResponseDispatchPreviewDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dispatch/preview/{slipId}',
            path: {
                'slipId': slipId,
            },
        });
    }
    /**
     * @returns ApiResponseListPackagingSlipDto OK
     * @throws ApiError
     */
    public static getPendingSlips(): CancelablePromise<ApiResponseListPackagingSlipDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dispatch/pending',
        });
    }
    /**
     * @param orderId
     * @returns ApiResponsePackagingSlipDto OK
     * @throws ApiError
     */
    public static getPackagingSlipByOrder(
        orderId: number,
    ): CancelablePromise<ApiResponsePackagingSlipDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dispatch/order/{orderId}',
            path: {
                'orderId': orderId,
            },
        });
    }
}

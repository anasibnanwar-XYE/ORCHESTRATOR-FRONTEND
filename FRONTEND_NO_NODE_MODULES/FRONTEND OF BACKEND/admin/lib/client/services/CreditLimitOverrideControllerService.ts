/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCreditLimitOverrideRequestDto } from '../models/ApiResponseCreditLimitOverrideRequestDto';
import type { ApiResponseListCreditLimitOverrideRequestDto } from '../models/ApiResponseListCreditLimitOverrideRequestDto';
import type { CreditLimitOverrideDecisionRequest } from '../models/CreditLimitOverrideDecisionRequest';
import type { CreditLimitOverrideRequestCreateRequest } from '../models/CreditLimitOverrideRequestCreateRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CreditLimitOverrideControllerService {
    /**
     * @param status
     * @returns ApiResponseListCreditLimitOverrideRequestDto OK
     * @throws ApiError
     */
    public static listRequests(
        status?: string,
    ): CancelablePromise<ApiResponseListCreditLimitOverrideRequestDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/credit/override-requests',
            query: {
                'status': status,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseCreditLimitOverrideRequestDto OK
     * @throws ApiError
     */
    public static createRequest(
        requestBody: CreditLimitOverrideRequestCreateRequest,
    ): CancelablePromise<ApiResponseCreditLimitOverrideRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/credit/override-requests',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseCreditLimitOverrideRequestDto OK
     * @throws ApiError
     */
    public static rejectRequest(
        id: number,
        requestBody?: CreditLimitOverrideDecisionRequest,
    ): CancelablePromise<ApiResponseCreditLimitOverrideRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/credit/override-requests/{id}/reject',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseCreditLimitOverrideRequestDto OK
     * @throws ApiError
     */
    public static approveRequest(
        id: number,
        requestBody?: CreditLimitOverrideDecisionRequest,
    ): CancelablePromise<ApiResponseCreditLimitOverrideRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/credit/override-requests/{id}/approve',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

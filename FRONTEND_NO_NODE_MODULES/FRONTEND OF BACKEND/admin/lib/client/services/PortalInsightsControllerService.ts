/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDashboardInsights } from '../models/ApiResponseDashboardInsights';
import type { ApiResponseOperationsInsights } from '../models/ApiResponseOperationsInsights';
import type { ApiResponseWorkforceInsights } from '../models/ApiResponseWorkforceInsights';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PortalInsightsControllerService {
    /**
     * @returns ApiResponseWorkforceInsights OK
     * @throws ApiError
     */
    public static workforce(): CancelablePromise<ApiResponseWorkforceInsights> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/portal/workforce',
        });
    }
    /**
     * @returns ApiResponseOperationsInsights OK
     * @throws ApiError
     */
    public static operations(): CancelablePromise<ApiResponseOperationsInsights> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/portal/operations',
        });
    }
    /**
     * @returns ApiResponseDashboardInsights OK
     * @throws ApiError
     */
    public static dashboard(): CancelablePromise<ApiResponseDashboardInsights> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/portal/dashboard',
        });
    }
}

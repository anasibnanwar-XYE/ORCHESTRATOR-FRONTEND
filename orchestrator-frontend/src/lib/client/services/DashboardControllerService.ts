/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardControllerService {
    /**
     * @param xCompanyId
     * @returns any OK
     * @throws ApiError
     */
    public static financeDashboard(
        xCompanyId: string,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orchestrator/dashboard/finance',
            headers: {
                'X-Company-Id': xCompanyId,
            },
        });
    }
    /**
     * @param xCompanyId
     * @returns any OK
     * @throws ApiError
     */
    public static factoryDashboard(
        xCompanyId: string,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orchestrator/dashboard/factory',
            headers: {
                'X-Company-Id': xCompanyId,
            },
        });
    }
    /**
     * @param xCompanyId
     * @returns any OK
     * @throws ApiError
     */
    public static adminDashboard(
        xCompanyId: string,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orchestrator/dashboard/admin',
            headers: {
                'X-Company-Id': xCompanyId,
            },
        });
    }
}

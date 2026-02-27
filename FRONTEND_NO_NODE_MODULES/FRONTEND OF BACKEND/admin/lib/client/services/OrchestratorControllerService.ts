/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApproveOrderRequest } from '../models/ApproveOrderRequest';
import type { DispatchRequest } from '../models/DispatchRequest';
import type { OrderFulfillmentRequest } from '../models/OrderFulfillmentRequest';
import type { PayrollRunRequest } from '../models/PayrollRunRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrchestratorControllerService {
    /**
     * @param xCompanyId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static runPayroll(
        xCompanyId: string,
        requestBody: PayrollRunRequest,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orchestrator/payroll/run',
            headers: {
                'X-Company-Id': xCompanyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param orderId
     * @param xCompanyId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static fulfillOrder(
        orderId: string,
        xCompanyId: string,
        requestBody: OrderFulfillmentRequest,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orchestrator/orders/{orderId}/fulfillment',
            path: {
                'orderId': orderId,
            },
            headers: {
                'X-Company-Id': xCompanyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param orderId
     * @param xCompanyId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static approveOrder(
        orderId: string,
        xCompanyId: string,
        requestBody: ApproveOrderRequest,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orchestrator/orders/{orderId}/approve',
            path: {
                'orderId': orderId,
            },
            headers: {
                'X-Company-Id': xCompanyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param batchId
     * @param xCompanyId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static dispatch(
        batchId: string,
        xCompanyId: string,
        requestBody: DispatchRequest,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orchestrator/factory/dispatch/{batchId}',
            path: {
                'batchId': batchId,
            },
            headers: {
                'X-Company-Id': xCompanyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param xCompanyId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static dispatchOrder(
        xCompanyId: string,
        requestBody: Record<string, Record<string, any>>,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orchestrator/dispatch',
            headers: {
                'X-Company-Id': xCompanyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param orderId
     * @param xCompanyId
     * @returns any OK
     * @throws ApiError
     */
    public static dispatchOrderAlias(
        orderId: string,
        xCompanyId: string,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orchestrator/dispatch/{orderId}',
            path: {
                'orderId': orderId,
            },
            headers: {
                'X-Company-Id': xCompanyId,
            },
        });
    }
    /**
     * @param traceId
     * @returns any OK
     * @throws ApiError
     */
    public static trace(
        traceId: string,
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orchestrator/traces/{traceId}',
            path: {
                'traceId': traceId,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static integrationsHealth(): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orchestrator/health/integrations',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static eventHealth(): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orchestrator/health/events',
        });
    }
}

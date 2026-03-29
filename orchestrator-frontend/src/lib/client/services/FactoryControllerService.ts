/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCostAllocationResponse } from '../models/ApiResponseCostAllocationResponse';
import type { ApiResponseFactoryDashboardDto } from '../models/ApiResponseFactoryDashboardDto';
import type { ApiResponseFactoryTaskDto } from '../models/ApiResponseFactoryTaskDto';
import type { ApiResponseListFactoryTaskDto } from '../models/ApiResponseListFactoryTaskDto';
import type { ApiResponseListProductionBatchDto } from '../models/ApiResponseListProductionBatchDto';
import type { ApiResponseListProductionPlanDto } from '../models/ApiResponseListProductionPlanDto';
import type { ApiResponseProductionBatchDto } from '../models/ApiResponseProductionBatchDto';
import type { ApiResponseProductionPlanDto } from '../models/ApiResponseProductionPlanDto';
import type { CostAllocationRequest } from '../models/CostAllocationRequest';
import type { FactoryTaskRequest } from '../models/FactoryTaskRequest';
import type { ProductionBatchRequest } from '../models/ProductionBatchRequest';
import type { ProductionPlanRequest } from '../models/ProductionPlanRequest';
import type { StatusRequest } from '../models/StatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FactoryControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseFactoryTaskDto OK
     * @throws ApiError
     */
    public static updateTask(
        id: number,
        requestBody: FactoryTaskRequest,
    ): CancelablePromise<ApiResponseFactoryTaskDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/factory/tasks/{id}',
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
     * @returns ApiResponseProductionPlanDto OK
     * @throws ApiError
     */
    public static updatePlan(
        id: number,
        requestBody: ProductionPlanRequest,
    ): CancelablePromise<ApiResponseProductionPlanDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/factory/production-plans/{id}',
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
    public static deletePlan(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/factory/production-plans/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListFactoryTaskDto OK
     * @throws ApiError
     */
    public static tasks(): CancelablePromise<ApiResponseListFactoryTaskDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/tasks',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseFactoryTaskDto OK
     * @throws ApiError
     */
    public static createTask(
        requestBody: FactoryTaskRequest,
    ): CancelablePromise<ApiResponseFactoryTaskDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/factory/tasks',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListProductionPlanDto OK
     * @throws ApiError
     */
    public static plans(): CancelablePromise<ApiResponseListProductionPlanDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/production-plans',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseProductionPlanDto OK
     * @throws ApiError
     */
    public static createPlan(
        requestBody: ProductionPlanRequest,
    ): CancelablePromise<ApiResponseProductionPlanDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/factory/production-plans',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListProductionBatchDto OK
     * @throws ApiError
     */
    public static batches1(): CancelablePromise<ApiResponseListProductionBatchDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/production-batches',
        });
    }
    /**
     * @param requestBody
     * @param planId
     * @returns ApiResponseProductionBatchDto OK
     * @throws ApiError
     */
    public static logBatch(
        requestBody: ProductionBatchRequest,
        planId?: number,
    ): CancelablePromise<ApiResponseProductionBatchDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/factory/production-batches',
            query: {
                'planId': planId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseCostAllocationResponse OK
     * @throws ApiError
     */
    public static allocateCosts(
        requestBody: CostAllocationRequest,
    ): CancelablePromise<ApiResponseCostAllocationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/factory/cost-allocation',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseProductionPlanDto OK
     * @throws ApiError
     */
    public static updatePlanStatus(
        id: number,
        requestBody: StatusRequest,
    ): CancelablePromise<ApiResponseProductionPlanDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/factory/production-plans/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseFactoryDashboardDto OK
     * @throws ApiError
     */
    public static dashboard1(): CancelablePromise<ApiResponseFactoryDashboardDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/dashboard',
        });
    }
}

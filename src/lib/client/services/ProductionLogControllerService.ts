/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListProductionLogDto } from '../models/ApiResponseListProductionLogDto';
import type { ApiResponseProductionLogDetailDto } from '../models/ApiResponseProductionLogDetailDto';
import type { ProductionLogRequest } from '../models/ProductionLogRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductionLogControllerService {
    /**
     * @returns ApiResponseListProductionLogDto OK
     * @throws ApiError
     */
    public static list(): CancelablePromise<ApiResponseListProductionLogDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/production/logs',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseProductionLogDetailDto OK
     * @throws ApiError
     */
    public static create(
        requestBody: ProductionLogRequest,
    ): CancelablePromise<ApiResponseProductionLogDetailDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/factory/production/logs',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ApiResponseProductionLogDetailDto OK
     * @throws ApiError
     */
    public static detail(
        id: number,
    ): CancelablePromise<ApiResponseProductionLogDetailDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/production/logs/{id}',
            path: {
                'id': id,
            },
        });
    }
}

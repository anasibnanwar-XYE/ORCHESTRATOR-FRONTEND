/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListSupplierResponse } from '../models/ApiResponseListSupplierResponse';
import type { ApiResponseSupplierResponse } from '../models/ApiResponseSupplierResponse';
import type { SupplierRequest } from '../models/SupplierRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SupplierControllerService {
    /**
     * @param id
     * @returns ApiResponseSupplierResponse OK
     * @throws ApiError
     */
    public static getSupplier(
        id: number,
    ): CancelablePromise<ApiResponseSupplierResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/suppliers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseSupplierResponse OK
     * @throws ApiError
     */
    public static updateSupplier(
        id: number,
        requestBody: SupplierRequest,
    ): CancelablePromise<ApiResponseSupplierResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/suppliers/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListSupplierResponse OK
     * @throws ApiError
     */
    public static listSuppliers(): CancelablePromise<ApiResponseListSupplierResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/suppliers',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseSupplierResponse OK
     * @throws ApiError
     */
    public static createSupplier(
        requestBody: SupplierRequest,
    ): CancelablePromise<ApiResponseSupplierResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/suppliers',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

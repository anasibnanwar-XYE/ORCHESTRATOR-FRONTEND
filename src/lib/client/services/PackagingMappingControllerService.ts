/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListPackagingSizeMappingDto } from '../models/ApiResponseListPackagingSizeMappingDto';
import type { ApiResponsePackagingSizeMappingDto } from '../models/ApiResponsePackagingSizeMappingDto';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { PackagingSizeMappingRequest } from '../models/PackagingSizeMappingRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PackagingMappingControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponsePackagingSizeMappingDto OK
     * @throws ApiError
     */
    public static updateMapping(
        id: number,
        requestBody: PackagingSizeMappingRequest,
    ): CancelablePromise<ApiResponsePackagingSizeMappingDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/factory/packaging-mappings/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static deactivateMapping(
        id: number,
    ): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/factory/packaging-mappings/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListPackagingSizeMappingDto OK
     * @throws ApiError
     */
    public static listMappings(): CancelablePromise<ApiResponseListPackagingSizeMappingDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/packaging-mappings',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponsePackagingSizeMappingDto OK
     * @throws ApiError
     */
    public static createMapping(
        requestBody: PackagingSizeMappingRequest,
    ): CancelablePromise<ApiResponsePackagingSizeMappingDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/factory/packaging-mappings',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListPackagingSizeMappingDto OK
     * @throws ApiError
     */
    public static listActiveMappings(): CancelablePromise<ApiResponseListPackagingSizeMappingDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/factory/packaging-mappings/active',
        });
    }
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListUserDto } from '../models/ApiResponseListUserDto';
import type { ApiResponseUserDto } from '../models/ApiResponseUserDto';
import type { CreateUserRequest } from '../models/CreateUserRequest';
import type { UpdateUserRequest } from '../models/UpdateUserRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminUserControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseUserDto OK
     * @throws ApiError
     */
    public static update2(
        id: number,
        requestBody: UpdateUserRequest,
    ): CancelablePromise<ApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/admin/users/{id}',
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
    public static delete1(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/users/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListUserDto OK
     * @throws ApiError
     */
    public static list2(): CancelablePromise<ApiResponseListUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseUserDto OK
     * @throws ApiError
     */
    public static create2(
        requestBody: CreateUserRequest,
    ): CancelablePromise<ApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static unsuspend(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/users/{id}/unsuspend',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static suspend(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/users/{id}/suspend',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static disableMfa(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/users/{id}/mfa/disable',
            path: {
                'id': id,
            },
        });
    }
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListRoleDto } from '../models/ApiResponseListRoleDto';
import type { ApiResponseRoleDto } from '../models/ApiResponseRoleDto';
import type { CreateRoleRequest } from '../models/CreateRoleRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RoleControllerService {
    /**
     * @returns ApiResponseListRoleDto OK
     * @throws ApiError
     */
    public static listRoles(): CancelablePromise<ApiResponseListRoleDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/roles',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseRoleDto OK
     * @throws ApiError
     */
    public static createRole(
        requestBody: CreateRoleRequest,
    ): CancelablePromise<ApiResponseRoleDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/roles',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param roleKey
     * @returns ApiResponseRoleDto OK
     * @throws ApiError
     */
    public static getRoleByKey(
        roleKey: string,
    ): CancelablePromise<ApiResponseRoleDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/roles/{roleKey}',
            path: {
                'roleKey': roleKey,
            },
        });
    }
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminNotifyRequest } from '../models/AdminNotifyRequest';
import type { ApiResponseAdminApprovalsResponse } from '../models/ApiResponseAdminApprovalsResponse';
import type { ApiResponseString } from '../models/ApiResponseString';
import type { ApiResponseSystemSettingsDto } from '../models/ApiResponseSystemSettingsDto';
import type { SystemSettingsUpdateRequest } from '../models/SystemSettingsUpdateRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminSettingsControllerService {
    /**
     * @returns ApiResponseSystemSettingsDto OK
     * @throws ApiError
     */
    public static getSettings(): CancelablePromise<ApiResponseSystemSettingsDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/settings',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseSystemSettingsDto OK
     * @throws ApiError
     */
    public static updateSettings(
        requestBody: SystemSettingsUpdateRequest,
    ): CancelablePromise<ApiResponseSystemSettingsDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/admin/settings',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseString OK
     * @throws ApiError
     */
    public static notifyUser(
        requestBody: AdminNotifyRequest,
    ): CancelablePromise<ApiResponseString> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/notify',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseAdminApprovalsResponse OK
     * @throws ApiError
     */
    public static approvals(): CancelablePromise<ApiResponseAdminApprovalsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/approvals',
        });
    }
}

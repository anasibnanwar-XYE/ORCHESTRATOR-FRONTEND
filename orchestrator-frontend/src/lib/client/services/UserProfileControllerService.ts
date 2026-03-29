/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseProfileResponse } from '../models/ApiResponseProfileResponse';
import type { UpdateProfileRequest } from '../models/UpdateProfileRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserProfileControllerService {
    /**
     * @returns ApiResponseProfileResponse OK
     * @throws ApiError
     */
    public static profile(): CancelablePromise<ApiResponseProfileResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/profile',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseProfileResponse OK
     * @throws ApiError
     */
    public static update1(
        requestBody: UpdateProfileRequest,
    ): CancelablePromise<ApiResponseProfileResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/auth/profile',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

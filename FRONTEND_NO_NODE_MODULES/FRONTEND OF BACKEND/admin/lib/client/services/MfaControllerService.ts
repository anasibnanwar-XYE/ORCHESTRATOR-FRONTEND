/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseMfaSetupResponse } from '../models/ApiResponseMfaSetupResponse';
import type { ApiResponseMfaStatusResponse } from '../models/ApiResponseMfaStatusResponse';
import type { MfaActivateRequest } from '../models/MfaActivateRequest';
import type { MfaDisableRequest } from '../models/MfaDisableRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MfaControllerService {
    /**
     * @returns ApiResponseMfaSetupResponse OK
     * @throws ApiError
     */
    public static setup(): CancelablePromise<ApiResponseMfaSetupResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/mfa/setup',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseMfaStatusResponse OK
     * @throws ApiError
     */
    public static disable(
        requestBody: MfaDisableRequest,
    ): CancelablePromise<ApiResponseMfaStatusResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/mfa/disable',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseMfaStatusResponse OK
     * @throws ApiError
     */
    public static activate(
        requestBody: MfaActivateRequest,
    ): CancelablePromise<ApiResponseMfaStatusResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/mfa/activate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

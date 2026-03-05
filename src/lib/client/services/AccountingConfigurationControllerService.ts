/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseConfigurationHealthReport } from '../models/ApiResponseConfigurationHealthReport';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AccountingConfigurationControllerService {
    /**
     * @returns ApiResponseConfigurationHealthReport OK
     * @throws ApiError
     */
    public static health(): CancelablePromise<ApiResponseConfigurationHealthReport> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/configuration/health',
        });
    }
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanyDto } from '../models/ApiResponseCompanyDto';
import type { SwitchCompanyRequest } from '../models/SwitchCompanyRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MultiCompanyControllerService {
    /**
     * @param requestBody
     * @returns ApiResponseCompanyDto OK
     * @throws ApiError
     */
    public static switchCompany(
        requestBody: SwitchCompanyRequest,
    ): CancelablePromise<ApiResponseCompanyDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/multi-company/companies/switch',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

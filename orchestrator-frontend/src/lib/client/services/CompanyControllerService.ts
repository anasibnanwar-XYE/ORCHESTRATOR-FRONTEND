/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCompanyDto } from '../models/ApiResponseCompanyDto';
import type { ApiResponseListCompanyDto } from '../models/ApiResponseListCompanyDto';
import type { CompanyRequest } from '../models/CompanyRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CompanyControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseCompanyDto OK
     * @throws ApiError
     */
    public static update(
        id: number,
        requestBody: CompanyRequest,
    ): CancelablePromise<ApiResponseCompanyDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/companies/{id}',
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
    public static delete(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/companies/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListCompanyDto OK
     * @throws ApiError
     */
    public static list1(): CancelablePromise<ApiResponseListCompanyDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/companies',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseCompanyDto OK
     * @throws ApiError
     */
    public static create1(
        requestBody: CompanyRequest,
    ): CancelablePromise<ApiResponseCompanyDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/companies',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

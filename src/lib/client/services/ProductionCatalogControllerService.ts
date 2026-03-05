/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListProductionBrandDto } from '../models/ApiResponseListProductionBrandDto';
import type { ApiResponseListProductionProductDto } from '../models/ApiResponseListProductionProductDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductionCatalogControllerService {
    /**
     * @returns ApiResponseListProductionBrandDto OK
     * @throws ApiError
     */
    public static listBrands(): CancelablePromise<ApiResponseListProductionBrandDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/production/brands',
        });
    }
    /**
     * @param brandId
     * @returns ApiResponseListProductionProductDto OK
     * @throws ApiError
     */
    public static listBrandProducts(
        brandId: number,
    ): CancelablePromise<ApiResponseListProductionProductDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/production/brands/{brandId}/products',
            path: {
                'brandId': brandId,
            },
        });
    }
}

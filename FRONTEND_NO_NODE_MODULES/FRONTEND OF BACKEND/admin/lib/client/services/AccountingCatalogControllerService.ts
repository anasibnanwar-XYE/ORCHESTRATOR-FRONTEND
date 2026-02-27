/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBulkVariantResponse } from '../models/ApiResponseBulkVariantResponse';
import type { ApiResponseCatalogImportResponse } from '../models/ApiResponseCatalogImportResponse';
import type { ApiResponseListProductionProductDto } from '../models/ApiResponseListProductionProductDto';
import type { ApiResponseProductionProductDto } from '../models/ApiResponseProductionProductDto';
import type { BulkVariantRequest } from '../models/BulkVariantRequest';
import type { ProductCreateRequest } from '../models/ProductCreateRequest';
import type { ProductUpdateRequest } from '../models/ProductUpdateRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AccountingCatalogControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseProductionProductDto OK
     * @throws ApiError
     */
    public static updateProduct(
        id: number,
        requestBody: ProductUpdateRequest,
    ): CancelablePromise<ApiResponseProductionProductDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/accounting/catalog/products/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListProductionProductDto OK
     * @throws ApiError
     */
    public static listProducts(): CancelablePromise<ApiResponseListProductionProductDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/catalog/products',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseProductionProductDto OK
     * @throws ApiError
     */
    public static createProduct(
        requestBody: ProductCreateRequest,
    ): CancelablePromise<ApiResponseProductionProductDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/catalog/products',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseBulkVariantResponse OK
     * @throws ApiError
     */
    public static createVariants(
        requestBody: BulkVariantRequest,
    ): CancelablePromise<ApiResponseBulkVariantResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/catalog/products/bulk-variants',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param formData
     * @returns ApiResponseCatalogImportResponse OK
     * @throws ApiError
     */
    public static importCatalog(
        formData?: {
            file: Blob;
        },
    ): CancelablePromise<ApiResponseCatalogImportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/catalog/import',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}

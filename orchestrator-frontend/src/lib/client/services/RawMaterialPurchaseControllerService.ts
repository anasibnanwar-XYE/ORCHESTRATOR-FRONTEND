/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseJournalEntryDto } from '../models/ApiResponseJournalEntryDto';
import type { ApiResponseListRawMaterialPurchaseResponse } from '../models/ApiResponseListRawMaterialPurchaseResponse';
import type { ApiResponseRawMaterialPurchaseResponse } from '../models/ApiResponseRawMaterialPurchaseResponse';
import type { PurchaseReturnRequest } from '../models/PurchaseReturnRequest';
import type { RawMaterialPurchaseRequest } from '../models/RawMaterialPurchaseRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RawMaterialPurchaseControllerService {
    /**
     * @returns ApiResponseListRawMaterialPurchaseResponse OK
     * @throws ApiError
     */
    public static listPurchases(): CancelablePromise<ApiResponseListRawMaterialPurchaseResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/purchasing/raw-material-purchases',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseRawMaterialPurchaseResponse OK
     * @throws ApiError
     */
    public static createPurchase(
        requestBody: RawMaterialPurchaseRequest,
    ): CancelablePromise<ApiResponseRawMaterialPurchaseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/purchasing/raw-material-purchases',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static recordPurchaseReturn(
        requestBody: PurchaseReturnRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/purchasing/raw-material-purchases/returns',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ApiResponseRawMaterialPurchaseResponse OK
     * @throws ApiError
     */
    public static getPurchase(
        id: number,
    ): CancelablePromise<ApiResponseRawMaterialPurchaseResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/purchasing/raw-material-purchases/{id}',
            path: {
                'id': id,
            },
        });
    }
}

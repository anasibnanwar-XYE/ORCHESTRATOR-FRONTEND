/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCreditRequestDto } from '../models/ApiResponseCreditRequestDto';
import type { ApiResponseDispatchConfirmResponse } from '../models/ApiResponseDispatchConfirmResponse';
import type { ApiResponseListCreditRequestDto } from '../models/ApiResponseListCreditRequestDto';
import type { ApiResponseListDealerLookupResponse } from '../models/ApiResponseListDealerLookupResponse';
import type { ApiResponseListDealerResponse } from '../models/ApiResponseListDealerResponse';
import type { ApiResponseListPromotionDto } from '../models/ApiResponseListPromotionDto';
import type { ApiResponseListSalesOrderDto } from '../models/ApiResponseListSalesOrderDto';
import type { ApiResponseListSalesTargetDto } from '../models/ApiResponseListSalesTargetDto';
import type { ApiResponsePromotionDto } from '../models/ApiResponsePromotionDto';
import type { ApiResponseSalesOrderDto } from '../models/ApiResponseSalesOrderDto';
import type { ApiResponseSalesTargetDto } from '../models/ApiResponseSalesTargetDto';
import type { CancelRequest } from '../models/CancelRequest';
import type { CreditRequestRequest } from '../models/CreditRequestRequest';
import type { DispatchConfirmRequest } from '../models/DispatchConfirmRequest';
import type { PromotionRequest } from '../models/PromotionRequest';
import type { SalesOrderRequest } from '../models/SalesOrderRequest';
import type { SalesTargetRequest } from '../models/SalesTargetRequest';
import type { StatusRequest } from '../models/StatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SalesControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseSalesTargetDto OK
     * @throws ApiError
     */
    public static updateTarget(
        id: number,
        requestBody: SalesTargetRequest,
    ): CancelablePromise<ApiResponseSalesTargetDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/sales/targets/{id}',
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
    public static deleteTarget(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/sales/targets/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponsePromotionDto OK
     * @throws ApiError
     */
    public static updatePromotion(
        id: number,
        requestBody: PromotionRequest,
    ): CancelablePromise<ApiResponsePromotionDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/sales/promotions/{id}',
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
    public static deletePromotion(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/sales/promotions/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseSalesOrderDto OK
     * @throws ApiError
     */
    public static updateOrder(
        id: number,
        requestBody: SalesOrderRequest,
    ): CancelablePromise<ApiResponseSalesOrderDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/sales/orders/{id}',
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
    public static deleteOrder(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/sales/orders/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseCreditRequestDto OK
     * @throws ApiError
     */
    public static updateCreditRequest(
        id: number,
        requestBody: CreditRequestRequest,
    ): CancelablePromise<ApiResponseCreditRequestDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/sales/credit-requests/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListSalesTargetDto OK
     * @throws ApiError
     */
    public static targets(): CancelablePromise<ApiResponseListSalesTargetDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales/targets',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseSalesTargetDto OK
     * @throws ApiError
     */
    public static createTarget(
        requestBody: SalesTargetRequest,
    ): CancelablePromise<ApiResponseSalesTargetDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales/targets',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListPromotionDto OK
     * @throws ApiError
     */
    public static promotions(): CancelablePromise<ApiResponseListPromotionDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales/promotions',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponsePromotionDto OK
     * @throws ApiError
     */
    public static createPromotion(
        requestBody: PromotionRequest,
    ): CancelablePromise<ApiResponsePromotionDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales/promotions',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param status
     * @returns ApiResponseListSalesOrderDto OK
     * @throws ApiError
     */
    public static orders(
        status?: string,
    ): CancelablePromise<ApiResponseListSalesOrderDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales/orders',
            query: {
                'status': status,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseSalesOrderDto OK
     * @throws ApiError
     */
    public static createOrder(
        requestBody: SalesOrderRequest,
    ): CancelablePromise<ApiResponseSalesOrderDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales/orders',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ApiResponseSalesOrderDto OK
     * @throws ApiError
     */
    public static confirmOrder(
        id: number,
    ): CancelablePromise<ApiResponseSalesOrderDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales/orders/{id}/confirm',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseSalesOrderDto OK
     * @throws ApiError
     */
    public static cancelOrder(
        id: number,
        requestBody?: CancelRequest,
    ): CancelablePromise<ApiResponseSalesOrderDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales/orders/{id}/cancel',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseDispatchConfirmResponse OK
     * @throws ApiError
     */
    public static confirmDispatch(
        requestBody: DispatchConfirmRequest,
    ): CancelablePromise<ApiResponseDispatchConfirmResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales/dispatch/confirm',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListCreditRequestDto OK
     * @throws ApiError
     */
    public static creditRequests(): CancelablePromise<ApiResponseListCreditRequestDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales/credit-requests',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseCreditRequestDto OK
     * @throws ApiError
     */
    public static createCreditRequest(
        requestBody: CreditRequestRequest,
    ): CancelablePromise<ApiResponseCreditRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales/credit-requests',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseSalesOrderDto OK
     * @throws ApiError
     */
    public static updateStatus(
        id: number,
        requestBody: StatusRequest,
    ): CancelablePromise<ApiResponseSalesOrderDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/sales/orders/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListDealerResponse OK
     * @throws ApiError
     */
    public static listDealers(): CancelablePromise<ApiResponseListDealerResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales/dealers',
        });
    }
    /**
     * @param query
     * @returns ApiResponseListDealerLookupResponse OK
     * @throws ApiError
     */
    public static searchDealers(
        query: string = '',
    ): CancelablePromise<ApiResponseListDealerLookupResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales/dealers/search',
            query: {
                'query': query,
            },
        });
    }
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePayrollBatchPaymentResponse } from '../models/ApiResponsePayrollBatchPaymentResponse';
import type { PayrollBatchPaymentRequest } from '../models/PayrollBatchPaymentRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PayrollControllerService {
    /**
     * @param requestBody
     * @returns ApiResponsePayrollBatchPaymentResponse OK
     * @throws ApiError
     */
    public static processBatchPayment(
        requestBody: PayrollBatchPaymentRequest,
    ): CancelablePromise<ApiResponsePayrollBatchPaymentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/payroll/payments/batch',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListPayrollRunDto } from '../models/ApiResponseListPayrollRunDto';
import type { ApiResponseListPayrollRunLineDto } from '../models/ApiResponseListPayrollRunLineDto';
import type { ApiResponseMonthlyPaySummaryDto } from '../models/ApiResponseMonthlyPaySummaryDto';
import type { ApiResponsePayrollRunDto } from '../models/ApiResponsePayrollRunDto';
import type { ApiResponseWeeklyPaySummaryDto } from '../models/ApiResponseWeeklyPaySummaryDto';
import type { CreatePayrollRunRequest } from '../models/CreatePayrollRunRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HrPayrollControllerService {
    /**
     * @returns ApiResponseListPayrollRunDto OK
     * @throws ApiError
     */
    public static listPayrollRuns(): CancelablePromise<ApiResponseListPayrollRunDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payroll/runs',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponsePayrollRunDto OK
     * @throws ApiError
     */
    public static createPayrollRun(
        requestBody: CreatePayrollRunRequest,
    ): CancelablePromise<ApiResponsePayrollRunDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payroll/runs',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ApiResponsePayrollRunDto OK
     * @throws ApiError
     */
    public static postPayroll(
        id: number,
    ): CancelablePromise<ApiResponsePayrollRunDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payroll/runs/{id}/post',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponsePayrollRunDto OK
     * @throws ApiError
     */
    public static markAsPaid(
        id: number,
        requestBody: Record<string, string>,
    ): CancelablePromise<ApiResponsePayrollRunDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payroll/runs/{id}/mark-paid',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ApiResponsePayrollRunDto OK
     * @throws ApiError
     */
    public static calculatePayroll(
        id: number,
    ): CancelablePromise<ApiResponsePayrollRunDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payroll/runs/{id}/calculate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns ApiResponsePayrollRunDto OK
     * @throws ApiError
     */
    public static approvePayroll(
        id: number,
    ): CancelablePromise<ApiResponsePayrollRunDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payroll/runs/{id}/approve',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListPayrollRunDto OK
     * @throws ApiError
     */
    public static listWeeklyPayrollRuns(): CancelablePromise<ApiResponseListPayrollRunDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payroll/runs/weekly',
        });
    }
    /**
     * @param weekEndingDate
     * @returns ApiResponsePayrollRunDto OK
     * @throws ApiError
     */
    public static createWeeklyPayrollRun(
        weekEndingDate: string,
    ): CancelablePromise<ApiResponsePayrollRunDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payroll/runs/weekly',
            query: {
                'weekEndingDate': weekEndingDate,
            },
        });
    }
    /**
     * @returns ApiResponseListPayrollRunDto OK
     * @throws ApiError
     */
    public static listMonthlyPayrollRuns(): CancelablePromise<ApiResponseListPayrollRunDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payroll/runs/monthly',
        });
    }
    /**
     * @param year
     * @param month
     * @returns ApiResponsePayrollRunDto OK
     * @throws ApiError
     */
    public static createMonthlyPayrollRun(
        year: number,
        month: number,
    ): CancelablePromise<ApiResponsePayrollRunDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payroll/runs/monthly',
            query: {
                'year': year,
                'month': month,
            },
        });
    }
    /**
     * @param weekEndingDate
     * @returns ApiResponseWeeklyPaySummaryDto OK
     * @throws ApiError
     */
    public static getWeeklyPaySummary(
        weekEndingDate: string,
    ): CancelablePromise<ApiResponseWeeklyPaySummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payroll/summary/weekly',
            query: {
                'weekEndingDate': weekEndingDate,
            },
        });
    }
    /**
     * @param year
     * @param month
     * @returns ApiResponseMonthlyPaySummaryDto OK
     * @throws ApiError
     */
    public static getMonthlyPaySummary(
        year: number,
        month: number,
    ): CancelablePromise<ApiResponseMonthlyPaySummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payroll/summary/monthly',
            query: {
                'year': year,
                'month': month,
            },
        });
    }
    /**
     * @returns ApiResponseWeeklyPaySummaryDto OK
     * @throws ApiError
     */
    public static getCurrentWeekPaySummary(): CancelablePromise<ApiResponseWeeklyPaySummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payroll/summary/current-week',
        });
    }
    /**
     * @returns ApiResponseMonthlyPaySummaryDto OK
     * @throws ApiError
     */
    public static getCurrentMonthPaySummary(): CancelablePromise<ApiResponseMonthlyPaySummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payroll/summary/current-month',
        });
    }
    /**
     * @param id
     * @returns ApiResponsePayrollRunDto OK
     * @throws ApiError
     */
    public static getPayrollRun(
        id: number,
    ): CancelablePromise<ApiResponsePayrollRunDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payroll/runs/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns ApiResponseListPayrollRunLineDto OK
     * @throws ApiError
     */
    public static getPayrollRunLines(
        id: number,
    ): CancelablePromise<ApiResponseListPayrollRunLineDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payroll/runs/{id}/lines',
            path: {
                'id': id,
            },
        });
    }
}

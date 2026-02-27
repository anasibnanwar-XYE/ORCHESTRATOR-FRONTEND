/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBalanceSheetDto } from '../models/ApiResponseBalanceSheetDto';
import type { ApiResponseCashFlowDto } from '../models/ApiResponseCashFlowDto';
import type { ApiResponseCostBreakdownDto } from '../models/ApiResponseCostBreakdownDto';
import type { ApiResponseInventoryValuationDto } from '../models/ApiResponseInventoryValuationDto';
import type { ApiResponseListAccountStatementEntryDto } from '../models/ApiResponseListAccountStatementEntryDto';
import type { ApiResponseListAgedDebtorDto } from '../models/ApiResponseListAgedDebtorDto';
import type { ApiResponseListBalanceWarningDto } from '../models/ApiResponseListBalanceWarningDto';
import type { ApiResponseListWastageReportDto } from '../models/ApiResponseListWastageReportDto';
import type { ApiResponseMonthlyProductionCostDto } from '../models/ApiResponseMonthlyProductionCostDto';
import type { ApiResponseProfitLossDto } from '../models/ApiResponseProfitLossDto';
import type { ApiResponseReconciliationDashboardDto } from '../models/ApiResponseReconciliationDashboardDto';
import type { ApiResponseReconciliationSummaryDto } from '../models/ApiResponseReconciliationSummaryDto';
import type { ApiResponseTrialBalanceDto } from '../models/ApiResponseTrialBalanceDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportControllerService {
    /**
     * @returns ApiResponseListWastageReportDto OK
     * @throws ApiError
     */
    public static wastageReport(): CancelablePromise<ApiResponseListWastageReportDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/wastage',
        });
    }
    /**
     * @returns ApiResponseTrialBalanceDto OK
     * @throws ApiError
     */
    public static trialBalance(): CancelablePromise<ApiResponseTrialBalanceDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/trial-balance',
        });
    }
    /**
     * @param bankAccountId
     * @param statementBalance
     * @returns ApiResponseReconciliationDashboardDto OK
     * @throws ApiError
     */
    public static reconciliationDashboard(
        bankAccountId: number,
        statementBalance?: number,
    ): CancelablePromise<ApiResponseReconciliationDashboardDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/reconciliation-dashboard',
            query: {
                'bankAccountId': bankAccountId,
                'statementBalance': statementBalance,
            },
        });
    }
    /**
     * @returns ApiResponseProfitLossDto OK
     * @throws ApiError
     */
    public static profitLoss(): CancelablePromise<ApiResponseProfitLossDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/profit-loss',
        });
    }
    /**
     * @param id
     * @returns ApiResponseCostBreakdownDto OK
     * @throws ApiError
     */
    public static costBreakdown(
        id: number,
    ): CancelablePromise<ApiResponseCostBreakdownDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/production-logs/{id}/cost-breakdown',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param year
     * @param month
     * @returns ApiResponseMonthlyProductionCostDto OK
     * @throws ApiError
     */
    public static monthlyProductionCosts(
        year: number,
        month: number,
    ): CancelablePromise<ApiResponseMonthlyProductionCostDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/monthly-production-costs',
            query: {
                'year': year,
                'month': month,
            },
        });
    }
    /**
     * @returns ApiResponseInventoryValuationDto OK
     * @throws ApiError
     */
    public static inventoryValuation(): CancelablePromise<ApiResponseInventoryValuationDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/inventory-valuation',
        });
    }
    /**
     * @returns ApiResponseReconciliationSummaryDto OK
     * @throws ApiError
     */
    public static inventoryReconciliation(): CancelablePromise<ApiResponseReconciliationSummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/inventory-reconciliation',
        });
    }
    /**
     * @returns ApiResponseCashFlowDto OK
     * @throws ApiError
     */
    public static cashFlow(): CancelablePromise<ApiResponseCashFlowDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/cash-flow',
        });
    }
    /**
     * @returns ApiResponseListBalanceWarningDto OK
     * @throws ApiError
     */
    public static balanceWarnings(): CancelablePromise<ApiResponseListBalanceWarningDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/balance-warnings',
        });
    }
    /**
     * @returns ApiResponseBalanceSheetDto OK
     * @throws ApiError
     */
    public static balanceSheet(): CancelablePromise<ApiResponseBalanceSheetDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/balance-sheet',
        });
    }
    /**
     * @returns ApiResponseListAccountStatementEntryDto OK
     * @throws ApiError
     */
    public static accountStatement(): CancelablePromise<ApiResponseListAccountStatementEntryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/account-statement',
        });
    }
    /**
     * @returns ApiResponseListAgedDebtorDto OK
     * @throws ApiError
     */
    public static agedDebtors(): CancelablePromise<ApiResponseListAgedDebtorDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/reports/aged-debtors',
        });
    }
}

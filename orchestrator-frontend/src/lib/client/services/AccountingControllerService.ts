/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountingPeriodCloseRequest } from '../models/AccountingPeriodCloseRequest';
import type { AccountingPeriodLockRequest } from '../models/AccountingPeriodLockRequest';
import type { AccountingPeriodReopenRequest } from '../models/AccountingPeriodReopenRequest';
import type { AccountRequest } from '../models/AccountRequest';
import type { AccrualRequest } from '../models/AccrualRequest';
import type { ApiResponseAccountActivityReport } from '../models/ApiResponseAccountActivityReport';
import type { ApiResponseAccountDto } from '../models/ApiResponseAccountDto';
import type { ApiResponseAccountingPeriodDto } from '../models/ApiResponseAccountingPeriodDto';
import type { ApiResponseAgedReceivablesReport } from '../models/ApiResponseAgedReceivablesReport';
import type { ApiResponseAgingSummaryResponse } from '../models/ApiResponseAgingSummaryResponse';
import type { ApiResponseAuditDigestResponse } from '../models/ApiResponseAuditDigestResponse';
import type { ApiResponseBalanceComparison } from '../models/ApiResponseBalanceComparison';
import type { ApiResponseBalanceSheetHierarchy } from '../models/ApiResponseBalanceSheetHierarchy';
import type { ApiResponseBigDecimal } from '../models/ApiResponseBigDecimal';
import type { ApiResponseCompanyDefaultAccountsResponse } from '../models/ApiResponseCompanyDefaultAccountsResponse';
import type { ApiResponseDealerAgingDetail } from '../models/ApiResponseDealerAgingDetail';
import type { ApiResponseDealerAgingDetailedReport } from '../models/ApiResponseDealerAgingDetailedReport';
import type { ApiResponseDSOReport } from '../models/ApiResponseDSOReport';
import type { ApiResponseGstReturnDto } from '../models/ApiResponseGstReturnDto';
import type { ApiResponseIncomeStatementHierarchy } from '../models/ApiResponseIncomeStatementHierarchy';
import type { ApiResponseJournalEntryDto } from '../models/ApiResponseJournalEntryDto';
import type { ApiResponseListAccountDto } from '../models/ApiResponseListAccountDto';
import type { ApiResponseListAccountingPeriodDto } from '../models/ApiResponseListAccountingPeriodDto';
import type { ApiResponseListAccountNode } from '../models/ApiResponseListAccountNode';
import type { ApiResponseListJournalEntryDto } from '../models/ApiResponseListJournalEntryDto';
import type { ApiResponseMonthEndChecklistDto } from '../models/ApiResponseMonthEndChecklistDto';
import type { ApiResponsePartnerSettlementResponse } from '../models/ApiResponsePartnerSettlementResponse';
import type { ApiResponsePartnerStatementResponse } from '../models/ApiResponsePartnerStatementResponse';
import type { ApiResponseTrialBalanceSnapshot } from '../models/ApiResponseTrialBalanceSnapshot';
import type { BadDebtWriteOffRequest } from '../models/BadDebtWriteOffRequest';
import type { CompanyDefaultAccountsRequest } from '../models/CompanyDefaultAccountsRequest';
import type { CreditNoteRequest } from '../models/CreditNoteRequest';
import type { DealerReceiptRequest } from '../models/DealerReceiptRequest';
import type { DealerReceiptSplitRequest } from '../models/DealerReceiptSplitRequest';
import type { DealerSettlementRequest } from '../models/DealerSettlementRequest';
import type { DebitNoteRequest } from '../models/DebitNoteRequest';
import type { InventoryRevaluationRequest } from '../models/InventoryRevaluationRequest';
import type { JournalEntryRequest } from '../models/JournalEntryRequest';
import type { JournalEntryReversalRequest } from '../models/JournalEntryReversalRequest';
import type { LandedCostRequest } from '../models/LandedCostRequest';
import type { MonthEndChecklistUpdateRequest } from '../models/MonthEndChecklistUpdateRequest';
import type { PayrollPaymentRequest } from '../models/PayrollPaymentRequest';
import type { SalesReturnRequest } from '../models/SalesReturnRequest';
import type { SupplierPaymentRequest } from '../models/SupplierPaymentRequest';
import type { SupplierSettlementRequest } from '../models/SupplierSettlementRequest';
import type { WipAdjustmentRequest } from '../models/WipAdjustmentRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AccountingControllerService {
    /**
     * @returns ApiResponseCompanyDefaultAccountsResponse OK
     * @throws ApiError
     */
    public static defaultAccounts(): CancelablePromise<ApiResponseCompanyDefaultAccountsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/default-accounts',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseCompanyDefaultAccountsResponse OK
     * @throws ApiError
     */
    public static updateDefaultAccounts(
        requestBody: CompanyDefaultAccountsRequest,
    ): CancelablePromise<ApiResponseCompanyDefaultAccountsResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/accounting/default-accounts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static recordSupplierPayment(
        requestBody: SupplierPaymentRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/suppliers/payments',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponsePartnerSettlementResponse OK
     * @throws ApiError
     */
    public static settleSupplier(
        requestBody: SupplierSettlementRequest,
    ): CancelablePromise<ApiResponsePartnerSettlementResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/settlements/suppliers',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponsePartnerSettlementResponse OK
     * @throws ApiError
     */
    public static settleDealer(
        requestBody: DealerSettlementRequest,
    ): CancelablePromise<ApiResponsePartnerSettlementResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/settlements/dealers',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @returns ApiResponseListJournalEntryDto OK
     * @throws ApiError
     */
    public static listSalesReturns(): CancelablePromise<ApiResponseListJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/sales/returns',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static recordSalesReturn(
        requestBody: SalesReturnRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/sales/returns',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static recordDealerReceipt(
        requestBody: DealerReceiptRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/receipts/dealer',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static recordDealerHybridReceipt(
        requestBody: DealerReceiptSplitRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/receipts/dealer/hybrid',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param periodId
     * @param requestBody
     * @returns ApiResponseAccountingPeriodDto OK
     * @throws ApiError
     */
    public static reopenPeriod(
        periodId: number,
        requestBody?: AccountingPeriodReopenRequest,
    ): CancelablePromise<ApiResponseAccountingPeriodDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/periods/{periodId}/reopen',
            path: {
                'periodId': periodId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param periodId
     * @param requestBody
     * @returns ApiResponseAccountingPeriodDto OK
     * @throws ApiError
     */
    public static lockPeriod(
        periodId: number,
        requestBody?: AccountingPeriodLockRequest,
    ): CancelablePromise<ApiResponseAccountingPeriodDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/periods/{periodId}/lock',
            path: {
                'periodId': periodId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param periodId
     * @param requestBody
     * @returns ApiResponseAccountingPeriodDto OK
     * @throws ApiError
     */
    public static closePeriod(
        periodId: number,
        requestBody?: AccountingPeriodCloseRequest,
    ): CancelablePromise<ApiResponseAccountingPeriodDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/periods/{periodId}/close',
            path: {
                'periodId': periodId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static recordPayrollPayment(
        requestBody: PayrollPaymentRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/payroll/payments',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param periodId
     * @param requestBody
     * @returns ApiResponseMonthEndChecklistDto OK
     * @throws ApiError
     */
    public static updateChecklist(
        periodId: number,
        requestBody: MonthEndChecklistUpdateRequest,
    ): CancelablePromise<ApiResponseMonthEndChecklistDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/month-end/checklist/{periodId}',
            path: {
                'periodId': periodId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param dealerId
     * @param page
     * @param size
     * @returns ApiResponseListJournalEntryDto OK
     * @throws ApiError
     */
    public static journalEntries(
        dealerId?: number,
        page?: number,
        size: number = 100,
    ): CancelablePromise<ApiResponseListJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/journal-entries',
            query: {
                'dealerId': dealerId,
                'page': page,
                'size': size,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static createJournalEntry(
        requestBody: JournalEntryRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/journal-entries',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param entryId
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static reverseJournalEntry(
        entryId: number,
        requestBody?: JournalEntryReversalRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/journal-entries/{entryId}/reverse',
            path: {
                'entryId': entryId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param entryId
     * @param requestBody
     * @returns ApiResponseListJournalEntryDto OK
     * @throws ApiError
     */
    public static cascadeReverseJournalEntry(
        entryId: number,
        requestBody: JournalEntryReversalRequest,
    ): CancelablePromise<ApiResponseListJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/journal-entries/{entryId}/cascade-reverse',
            path: {
                'entryId': entryId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static adjustWip(
        requestBody: WipAdjustmentRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/inventory/wip-adjustment',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static revalueInventory(
        requestBody: InventoryRevaluationRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/inventory/revaluation',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static recordLandedCost(
        requestBody: LandedCostRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/inventory/landed-cost',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static postDebitNote(
        requestBody: DebitNoteRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/debit-notes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static postCreditNote(
        requestBody: CreditNoteRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/credit-notes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static writeOffBadDebt(
        requestBody: BadDebtWriteOffRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/bad-debts/write-off',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseJournalEntryDto OK
     * @throws ApiError
     */
    public static postAccrual(
        requestBody: AccrualRequest,
    ): CancelablePromise<ApiResponseJournalEntryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/accruals',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @returns ApiResponseListAccountDto OK
     * @throws ApiError
     */
    public static accounts(): CancelablePromise<ApiResponseListAccountDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/accounts',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseAccountDto OK
     * @throws ApiError
     */
    public static createAccount(
        requestBody: AccountRequest,
    ): CancelablePromise<ApiResponseAccountDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/accounting/accounts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param date
     * @returns ApiResponseTrialBalanceSnapshot OK
     * @throws ApiError
     */
    public static getTrialBalanceAsOf(
        date: string,
    ): CancelablePromise<ApiResponseTrialBalanceSnapshot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/trial-balance/as-of',
            query: {
                'date': date,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param supplierId
     * @param from
     * @param to
     * @returns ApiResponsePartnerStatementResponse OK
     * @throws ApiError
     */
    public static supplierStatement(
        supplierId: number,
        from?: string,
        to?: string,
    ): CancelablePromise<ApiResponsePartnerStatementResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/statements/suppliers/{supplierId}',
            path: {
                'supplierId': supplierId,
            },
            query: {
                'from': from,
                'to': to,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Download supplier statement PDF
     * @param supplierId
     * @param from
     * @param to
     * @returns binary PDF document
     * @throws ApiError
     */
    public static supplierStatementPdf(
        supplierId: number,
        from?: string,
        to?: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/statements/suppliers/{supplierId}/pdf',
            path: {
                'supplierId': supplierId,
            },
            query: {
                'from': from,
                'to': to,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param dealerId
     * @param from
     * @param to
     * @returns ApiResponsePartnerStatementResponse OK
     * @throws ApiError
     */
    public static dealerStatement(
        dealerId: number,
        from?: string,
        to?: string,
    ): CancelablePromise<ApiResponsePartnerStatementResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/statements/dealers/{dealerId}',
            path: {
                'dealerId': dealerId,
            },
            query: {
                'from': from,
                'to': to,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Download dealer statement PDF
     * @param dealerId
     * @param from
     * @param to
     * @returns binary PDF document
     * @throws ApiError
     */
    public static dealerStatementPdf(
        dealerId: number,
        from?: string,
        to?: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/statements/dealers/{dealerId}/pdf',
            path: {
                'dealerId': dealerId,
            },
            query: {
                'from': from,
                'to': to,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @returns ApiResponseIncomeStatementHierarchy OK
     * @throws ApiError
     */
    public static getIncomeStatementHierarchy(): CancelablePromise<ApiResponseIncomeStatementHierarchy> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/reports/income-statement/hierarchy',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param dealerId
     * @returns ApiResponseDSOReport OK
     * @throws ApiError
     */
    public static getDealerDso(
        dealerId: number,
    ): CancelablePromise<ApiResponseDSOReport> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/reports/dso/dealer/{dealerId}',
            path: {
                'dealerId': dealerId,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @returns ApiResponseBalanceSheetHierarchy OK
     * @throws ApiError
     */
    public static getBalanceSheetHierarchy(): CancelablePromise<ApiResponseBalanceSheetHierarchy> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/reports/balance-sheet/hierarchy',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param asOfDate
     * @returns ApiResponseAgedReceivablesReport OK
     * @throws ApiError
     */
    public static getAgedReceivables(
        asOfDate?: string,
    ): CancelablePromise<ApiResponseAgedReceivablesReport> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/reports/aging/receivables',
            query: {
                'asOfDate': asOfDate,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param dealerId
     * @returns ApiResponseDealerAgingDetail OK
     * @throws ApiError
     */
    public static getDealerAging(
        dealerId: number,
    ): CancelablePromise<ApiResponseDealerAgingDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/reports/aging/dealer/{dealerId}',
            path: {
                'dealerId': dealerId,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param dealerId
     * @returns ApiResponseDealerAgingDetailedReport OK
     * @throws ApiError
     */
    public static getDealerAgingDetailed(
        dealerId: number,
    ): CancelablePromise<ApiResponseDealerAgingDetailedReport> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/reports/aging/dealer/{dealerId}/detailed',
            path: {
                'dealerId': dealerId,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @returns ApiResponseListAccountingPeriodDto OK
     * @throws ApiError
     */
    public static listPeriods(): CancelablePromise<ApiResponseListAccountingPeriodDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/periods',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param periodId
     * @returns ApiResponseMonthEndChecklistDto OK
     * @throws ApiError
     */
    public static checklist(
        periodId?: number,
    ): CancelablePromise<ApiResponseMonthEndChecklistDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/month-end/checklist',
            query: {
                'periodId': periodId,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param period
     * @returns ApiResponseGstReturnDto OK
     * @throws ApiError
     */
    public static generateGstReturn(
        period?: string,
    ): CancelablePromise<ApiResponseGstReturnDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/gst/return',
            query: {
                'period': period,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param from
     * @param to
     * @returns ApiResponseAuditDigestResponse OK
     * @throws ApiError
     */
    public static auditDigest(
        from?: string,
        to?: string,
    ): CancelablePromise<ApiResponseAuditDigestResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/audit/digest',
            query: {
                'from': from,
                'to': to,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param from
     * @param to
     * @returns string OK
     * @throws ApiError
     */
    public static auditDigestCsv(
        from?: string,
        to?: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/audit/digest.csv',
            query: {
                'from': from,
                'to': to,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param supplierId
     * @param asOf
     * @param buckets
     * @returns ApiResponseAgingSummaryResponse OK
     * @throws ApiError
     */
    public static supplierAging(
        supplierId: number,
        asOf?: string,
        buckets?: string,
    ): CancelablePromise<ApiResponseAgingSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/aging/suppliers/{supplierId}',
            path: {
                'supplierId': supplierId,
            },
            query: {
                'asOf': asOf,
                'buckets': buckets,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Download supplier aging PDF
     * @param supplierId
     * @param asOf
     * @param buckets
     * @returns binary PDF document
     * @throws ApiError
     */
    public static supplierAgingPdf(
        supplierId: number,
        asOf?: string,
        buckets?: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/aging/suppliers/{supplierId}/pdf',
            path: {
                'supplierId': supplierId,
            },
            query: {
                'asOf': asOf,
                'buckets': buckets,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param dealerId
     * @param asOf
     * @param buckets
     * @returns ApiResponseAgingSummaryResponse OK
     * @throws ApiError
     */
    public static dealerAging1(
        dealerId: number,
        asOf?: string,
        buckets?: string,
    ): CancelablePromise<ApiResponseAgingSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/aging/dealers/{dealerId}',
            path: {
                'dealerId': dealerId,
            },
            query: {
                'asOf': asOf,
                'buckets': buckets,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Download dealer aging PDF
     * @param dealerId
     * @param asOf
     * @param buckets
     * @returns binary PDF document
     * @throws ApiError
     */
    public static dealerAgingPdf(
        dealerId: number,
        asOf?: string,
        buckets?: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/aging/dealers/{dealerId}/pdf',
            path: {
                'dealerId': dealerId,
            },
            query: {
                'asOf': asOf,
                'buckets': buckets,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param accountId
     * @param date1
     * @param date2
     * @returns ApiResponseBalanceComparison OK
     * @throws ApiError
     */
    public static compareBalances(
        accountId: number,
        date1: string,
        date2: string,
    ): CancelablePromise<ApiResponseBalanceComparison> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/accounts/{accountId}/balance/compare',
            path: {
                'accountId': accountId,
            },
            query: {
                'date1': date1,
                'date2': date2,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param accountId
     * @param date
     * @returns ApiResponseBigDecimal OK
     * @throws ApiError
     */
    public static getBalanceAsOf(
        accountId: number,
        date: string,
    ): CancelablePromise<ApiResponseBigDecimal> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/accounts/{accountId}/balance/as-of',
            path: {
                'accountId': accountId,
            },
            query: {
                'date': date,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param accountId
     * @param startDate
     * @param endDate
     * @returns ApiResponseAccountActivityReport OK
     * @throws ApiError
     */
    public static getAccountActivity(
        accountId: number,
        startDate: string,
        endDate: string,
    ): CancelablePromise<ApiResponseAccountActivityReport> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/accounts/{accountId}/activity',
            path: {
                'accountId': accountId,
            },
            query: {
                'startDate': startDate,
                'endDate': endDate,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @returns ApiResponseListAccountNode OK
     * @throws ApiError
     */
    public static getChartOfAccountsTree(): CancelablePromise<ApiResponseListAccountNode> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/accounts/tree',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param type
     * @returns ApiResponseListAccountNode OK
     * @throws ApiError
     */
    public static getAccountTreeByType(
        type: string,
    ): CancelablePromise<ApiResponseListAccountNode> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/accounting/accounts/tree/{type}',
            path: {
                'type': type,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
}

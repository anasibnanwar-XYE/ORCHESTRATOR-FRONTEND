/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PayrollLine } from './PayrollLine';
export type PayrollBatchPaymentRequest = {
    runDate: string;
    cashAccountId: number;
    expenseAccountId: number;
    taxPayableAccountId?: number;
    pfPayableAccountId?: number;
    employerTaxExpenseAccountId?: number;
    employerPfExpenseAccountId?: number;
    defaultTaxRate?: number;
    defaultPfRate?: number;
    employerTaxRate?: number;
    employerPfRate?: number;
    referenceNumber?: string;
    memo?: string;
    lines: Array<PayrollLine>;
};


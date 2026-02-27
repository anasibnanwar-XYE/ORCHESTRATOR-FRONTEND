/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LineTotal } from './LineTotal';
export type PayrollBatchPaymentResponse = {
    payrollRunId?: number;
    runDate?: string;
    grossAmount?: number;
    totalTaxWithholding?: number;
    totalPfWithholding?: number;
    totalAdvances?: number;
    netPayAmount?: number;
    employerTaxAmount?: number;
    employerPfAmount?: number;
    totalEmployerCost?: number;
    payrollJournalId?: number;
    employerContribJournalId?: number;
    lines?: Array<LineTotal>;
};


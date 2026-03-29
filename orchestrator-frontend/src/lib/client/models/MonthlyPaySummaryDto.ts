/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmployeeMonthlyPayDto } from './EmployeeMonthlyPayDto';
export type MonthlyPaySummaryDto = {
    year?: number;
    month?: number;
    totalStaff?: number;
    totalGrossPay?: number;
    totalDeductions?: number;
    totalNetPay?: number;
    employees?: Array<EmployeeMonthlyPayDto>;
};


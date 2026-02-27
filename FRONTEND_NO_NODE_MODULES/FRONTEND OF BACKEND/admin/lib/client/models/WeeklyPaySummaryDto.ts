/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmployeeWeeklyPayDto } from './EmployeeWeeklyPayDto';
export type WeeklyPaySummaryDto = {
    weekStart?: string;
    weekEnd?: string;
    totalLabourers?: number;
    totalBasePay?: number;
    totalOvertimePay?: number;
    totalNetPay?: number;
    employees?: Array<EmployeeWeeklyPayDto>;
};


/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountMovement } from './AccountMovement';
export type AccountActivityReport = {
    accountCode?: string;
    accountName?: string;
    startDate?: string;
    endDate?: string;
    openingBalance?: number;
    closingBalance?: number;
    totalDebits?: number;
    totalCredits?: number;
    movements?: Array<AccountMovement>;
};


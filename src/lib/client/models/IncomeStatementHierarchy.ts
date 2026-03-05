/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountNode } from './AccountNode';
export type IncomeStatementHierarchy = {
    revenue?: Array<AccountNode>;
    totalRevenue?: number;
    cogs?: Array<AccountNode>;
    totalCogs?: number;
    grossProfit?: number;
    expenses?: Array<AccountNode>;
    totalExpenses?: number;
    netIncome?: number;
};


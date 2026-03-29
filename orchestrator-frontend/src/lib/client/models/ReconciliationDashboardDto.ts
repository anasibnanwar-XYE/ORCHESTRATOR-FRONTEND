/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BalanceWarningDto } from './BalanceWarningDto';
export type ReconciliationDashboardDto = {
    ledgerInventoryBalance?: number;
    physicalInventoryValue?: number;
    inventoryVariance?: number;
    bankLedgerBalance?: number;
    bankStatementBalance?: number;
    bankVariance?: number;
    inventoryBalanced?: boolean;
    bankBalanced?: boolean;
    balanceWarnings?: Array<BalanceWarningDto>;
};


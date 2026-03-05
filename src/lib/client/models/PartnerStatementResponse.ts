/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatementTransactionDto } from './StatementTransactionDto';
export type PartnerStatementResponse = {
    partnerId?: number;
    partnerName?: string;
    fromDate?: string;
    toDate?: string;
    openingBalance?: number;
    closingBalance?: number;
    transactions?: Array<StatementTransactionDto>;
};


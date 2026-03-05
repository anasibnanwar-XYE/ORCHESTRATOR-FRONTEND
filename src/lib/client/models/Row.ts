/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Row = {
    accountId?: number;
    code?: string;
    name?: string;
    type?: Row.type;
    debit?: number;
    credit?: number;
};
export namespace Row {
    export enum type {
        ASSET = 'ASSET',
        LIABILITY = 'LIABILITY',
        EQUITY = 'EQUITY',
        REVENUE = 'REVENUE',
        EXPENSE = 'EXPENSE',
        COGS = 'COGS',
        OTHER_INCOME = 'OTHER_INCOME',
        OTHER_EXPENSE = 'OTHER_EXPENSE',
    }
}


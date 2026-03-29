/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AccountRequest = {
    code: string;
    name: string;
    type: AccountRequest.type;
    parentId?: number;
};
export namespace AccountRequest {
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


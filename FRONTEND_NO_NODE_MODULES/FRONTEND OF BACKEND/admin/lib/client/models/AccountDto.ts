/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AccountDto = {
    id?: number;
    publicId?: string;
    code?: string;
    name?: string;
    type?: AccountDto.type;
    balance?: number;
};
export namespace AccountDto {
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


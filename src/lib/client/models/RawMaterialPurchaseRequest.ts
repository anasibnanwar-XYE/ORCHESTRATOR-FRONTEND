/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RawMaterialPurchaseLineRequest } from './RawMaterialPurchaseLineRequest';
export type RawMaterialPurchaseRequest = {
    supplierId: number;
    invoiceNumber: string;
    invoiceDate: string;
    memo?: string;
    lines: Array<RawMaterialPurchaseLineRequest>;
};


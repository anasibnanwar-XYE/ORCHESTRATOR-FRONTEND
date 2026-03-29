/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RawMaterialPurchaseLineResponse } from './RawMaterialPurchaseLineResponse';
export type RawMaterialPurchaseResponse = {
    id?: number;
    publicId?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    totalAmount?: number;
    outstandingAmount?: number;
    status?: string;
    memo?: string;
    supplierId?: number;
    supplierCode?: string;
    supplierName?: string;
    journalEntryId?: number;
    createdAt?: string;
    lines?: Array<RawMaterialPurchaseLineResponse>;
};


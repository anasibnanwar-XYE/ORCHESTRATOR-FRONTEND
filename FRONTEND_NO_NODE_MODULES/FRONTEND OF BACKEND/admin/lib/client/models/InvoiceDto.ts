/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InvoiceLineDto } from './InvoiceLineDto';
export type InvoiceDto = {
    id?: number;
    publicId?: string;
    invoiceNumber?: string;
    status?: string;
    subtotal?: number;
    taxTotal?: number;
    totalAmount?: number;
    outstandingAmount?: number;
    currency?: string;
    issueDate?: string;
    dueDate?: string;
    dealerId?: number;
    dealerName?: string;
    salesOrderId?: number;
    journalEntryId?: number;
    createdAt?: string;
    lines?: Array<InvoiceLineDto>;
};


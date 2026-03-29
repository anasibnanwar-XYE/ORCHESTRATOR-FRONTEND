/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImportError } from './ImportError';
export type CatalogImportResponse = {
    rowsProcessed?: number;
    brandsCreated?: number;
    productsCreated?: number;
    productsUpdated?: number;
    rawMaterialsSeeded?: number;
    errors?: Array<ImportError>;
};


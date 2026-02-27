/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BulkVariantRequest = {
    brandId?: number;
    brandName?: string;
    brandCode?: string;
    baseProductName: string;
    category: string;
    colors: Array<string>;
    sizes: Array<string>;
    unitOfMeasure?: string;
    skuPrefix?: string;
    basePrice?: number;
    gstRate?: number;
    minDiscountPercent?: number;
    minSellingPrice?: number;
    metadata?: Record<string, Record<string, any>>;
};


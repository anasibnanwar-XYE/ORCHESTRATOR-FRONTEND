/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProductCreateRequest = {
    brandId?: number;
    brandName?: string;
    brandCode?: string;
    productName: string;
    category: string;
    defaultColour?: string;
    sizeLabel?: string;
    unitOfMeasure?: string;
    customSkuCode?: string;
    basePrice?: number;
    gstRate?: number;
    minDiscountPercent?: number;
    minSellingPrice?: number;
    metadata?: Record<string, Record<string, any>>;
};


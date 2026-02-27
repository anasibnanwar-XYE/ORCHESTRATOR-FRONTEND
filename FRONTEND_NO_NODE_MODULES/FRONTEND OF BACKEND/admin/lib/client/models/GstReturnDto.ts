/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GstReturnDto = {
    period?: {
        year?: number;
        month?: GstReturnDto.month;
        monthValue?: number;
        leapYear?: boolean;
    };
    periodStart?: string;
    periodEnd?: string;
    outputTax?: number;
    inputTax?: number;
    netPayable?: number;
};
export namespace GstReturnDto {
    export enum month {
        JANUARY = 'JANUARY',
        FEBRUARY = 'FEBRUARY',
        MARCH = 'MARCH',
        APRIL = 'APRIL',
        MAY = 'MAY',
        JUNE = 'JUNE',
        JULY = 'JULY',
        AUGUST = 'AUGUST',
        SEPTEMBER = 'SEPTEMBER',
        OCTOBER = 'OCTOBER',
        NOVEMBER = 'NOVEMBER',
        DECEMBER = 'DECEMBER',
    }
}


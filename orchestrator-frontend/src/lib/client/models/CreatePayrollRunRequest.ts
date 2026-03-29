/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreatePayrollRunRequest = {
    runType?: CreatePayrollRunRequest.runType;
    periodStart?: string;
    periodEnd?: string;
    remarks?: string;
};
export namespace CreatePayrollRunRequest {
    export enum runType {
        WEEKLY = 'WEEKLY',
        MONTHLY = 'MONTHLY',
    }
}


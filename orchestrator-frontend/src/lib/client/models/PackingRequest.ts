/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PackingLineRequest } from './PackingLineRequest';
export type PackingRequest = {
    productionLogId: number;
    packedDate?: string;
    packedBy?: string;
    lines: Array<PackingLineRequest>;
};


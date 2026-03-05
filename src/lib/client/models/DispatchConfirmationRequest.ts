/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LineConfirmation } from './LineConfirmation';
export type DispatchConfirmationRequest = {
    packagingSlipId: number;
    lines: Array<LineConfirmation>;
    notes?: string;
    confirmedBy?: string;
    overrideRequestId?: number;
};


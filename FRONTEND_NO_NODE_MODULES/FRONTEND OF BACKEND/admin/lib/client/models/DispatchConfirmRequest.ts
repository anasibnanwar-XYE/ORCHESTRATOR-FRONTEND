/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DispatchLine } from './DispatchLine';
export type DispatchConfirmRequest = {
    packingSlipId?: number;
    orderId?: number;
    lines?: Array<DispatchLine>;
    dispatchNotes?: string;
    confirmedBy?: string;
    adminOverrideCreditLimit?: boolean;
    overrideRequestId?: number;
};


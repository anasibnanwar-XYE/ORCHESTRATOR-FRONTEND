/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminApprovalItemDto = {
    type?: string;
    id?: number;
    publicId?: string;
    reference?: string;
    status?: string;
    summary?: string;
    createdAt?: string;
    /** The action type identifier (e.g. "APPROVE_CREDIT", "APPROVE_PAYROLL") */
    actionType?: string;
    /** Human-readable label for the primary action button */
    actionLabel?: string;
    /** Source portal that originated this approval request */
    sourcePortal?: string;
    /** POST endpoint URL to approve this item */
    approveEndpoint?: string;
    /** POST endpoint URL to reject this item (null means no reject option) */
    rejectEndpoint?: string | null;
};


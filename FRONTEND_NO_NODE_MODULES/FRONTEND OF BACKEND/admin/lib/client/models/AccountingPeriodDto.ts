/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AccountingPeriodDto = {
    id?: number;
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
    label?: string;
    status?: string;
    bankReconciled?: boolean;
    bankReconciledAt?: string;
    bankReconciledBy?: string;
    inventoryCounted?: boolean;
    inventoryCountedAt?: string;
    inventoryCountedBy?: string;
    closedAt?: string;
    closedBy?: string;
    closedReason?: string;
    lockedAt?: string;
    lockedBy?: string;
    lockReason?: string;
    reopenedAt?: string;
    reopenedBy?: string;
    reopenReason?: string;
    closingJournalEntryId?: number;
    checklistNotes?: string;
};


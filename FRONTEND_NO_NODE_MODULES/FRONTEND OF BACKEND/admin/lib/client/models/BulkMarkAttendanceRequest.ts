/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocalTime } from './LocalTime';
export type BulkMarkAttendanceRequest = {
    employeeIds: Array<number>;
    date: string;
    status: string;
    checkInTime?: LocalTime;
    checkOutTime?: LocalTime;
    regularHours?: number;
    overtimeHours?: number;
    remarks?: string;
};


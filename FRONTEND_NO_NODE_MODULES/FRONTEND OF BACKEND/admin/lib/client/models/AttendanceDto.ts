/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocalTime } from './LocalTime';
export type AttendanceDto = {
    id?: number;
    employeeId?: number;
    employeeName?: string;
    employeeType?: string;
    date?: string;
    status?: string;
    checkInTime?: LocalTime;
    checkOutTime?: LocalTime;
    regularHours?: number;
    overtimeHours?: number;
    doubleOvertimeHours?: number;
    holiday?: boolean;
    weekend?: boolean;
    remarks?: string;
    markedBy?: string;
    markedAt?: string;
};


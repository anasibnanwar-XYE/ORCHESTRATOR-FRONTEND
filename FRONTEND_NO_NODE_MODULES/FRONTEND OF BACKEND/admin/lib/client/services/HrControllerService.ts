/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseAttendanceDto } from '../models/ApiResponseAttendanceDto';
import type { ApiResponseAttendanceSummaryDto } from '../models/ApiResponseAttendanceSummaryDto';
import type { ApiResponseEmployeeDto } from '../models/ApiResponseEmployeeDto';
import type { ApiResponseLeaveRequestDto } from '../models/ApiResponseLeaveRequestDto';
import type { ApiResponseListAttendanceDto } from '../models/ApiResponseListAttendanceDto';
import type { ApiResponseListEmployeeDto } from '../models/ApiResponseListEmployeeDto';
import type { ApiResponseListLeaveRequestDto } from '../models/ApiResponseListLeaveRequestDto';
import type { ApiResponseListPayrollRunDto } from '../models/ApiResponseListPayrollRunDto';
import type { ApiResponsePayrollRunDto } from '../models/ApiResponsePayrollRunDto';
import type { BulkMarkAttendanceRequest } from '../models/BulkMarkAttendanceRequest';
import type { EmployeeRequest } from '../models/EmployeeRequest';
import type { LeaveRequestRequest } from '../models/LeaveRequestRequest';
import type { MarkAttendanceRequest } from '../models/MarkAttendanceRequest';
import type { PayrollRunRequest } from '../models/PayrollRunRequest';
import type { StatusRequest } from '../models/StatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HrControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns ApiResponseEmployeeDto OK
     * @throws ApiError
     */
    public static updateEmployee(
        id: number,
        requestBody: EmployeeRequest,
    ): CancelablePromise<ApiResponseEmployeeDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/hr/employees/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteEmployee(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/hr/employees/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListPayrollRunDto OK
     * @throws ApiError
     */
    public static payrollRuns(): CancelablePromise<ApiResponseListPayrollRunDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/hr/payroll-runs',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponsePayrollRunDto OK
     * @throws ApiError
     */
    public static createPayrollRun1(
        requestBody: PayrollRunRequest,
    ): CancelablePromise<ApiResponsePayrollRunDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/hr/payroll-runs',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @deprecated
     * @returns ApiResponseListLeaveRequestDto OK
     * @throws ApiError
     */
    public static leaveRequests(): CancelablePromise<ApiResponseListLeaveRequestDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/hr/leave-requests',
        });
    }
    /**
     * @deprecated
     * @param requestBody
     * @returns ApiResponseLeaveRequestDto OK
     * @throws ApiError
     */
    public static createLeaveRequest(
        requestBody: LeaveRequestRequest,
    ): CancelablePromise<ApiResponseLeaveRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/hr/leave-requests',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListEmployeeDto OK
     * @throws ApiError
     */
    public static employees(): CancelablePromise<ApiResponseListEmployeeDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/hr/employees',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseEmployeeDto OK
     * @throws ApiError
     */
    public static createEmployee(
        requestBody: EmployeeRequest,
    ): CancelablePromise<ApiResponseEmployeeDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/hr/employees',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param employeeId
     * @param requestBody
     * @returns ApiResponseAttendanceDto OK
     * @throws ApiError
     */
    public static markAttendance(
        employeeId: number,
        requestBody: MarkAttendanceRequest,
    ): CancelablePromise<ApiResponseAttendanceDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/hr/attendance/mark/{employeeId}',
            path: {
                'employeeId': employeeId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns ApiResponseListAttendanceDto OK
     * @throws ApiError
     */
    public static bulkMarkAttendance(
        requestBody: BulkMarkAttendanceRequest,
    ): CancelablePromise<ApiResponseListAttendanceDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/hr/attendance/bulk-mark',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @deprecated
     * @param id
     * @param requestBody
     * @returns ApiResponseLeaveRequestDto OK
     * @throws ApiError
     */
    public static updateLeaveStatus(
        id: number,
        requestBody: StatusRequest,
    ): CancelablePromise<ApiResponseLeaveRequestDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/hr/leave-requests/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListAttendanceDto OK
     * @throws ApiError
     */
    public static attendanceToday(): CancelablePromise<ApiResponseListAttendanceDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/hr/attendance/today',
        });
    }
    /**
     * @returns ApiResponseAttendanceSummaryDto OK
     * @throws ApiError
     */
    public static attendanceSummary(): CancelablePromise<ApiResponseAttendanceSummaryDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/hr/attendance/summary',
        });
    }
    /**
     * @param employeeId
     * @param startDate
     * @param endDate
     * @returns ApiResponseListAttendanceDto OK
     * @throws ApiError
     */
    public static employeeAttendance(
        employeeId: number,
        startDate: string,
        endDate: string,
    ): CancelablePromise<ApiResponseListAttendanceDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/hr/attendance/employee/{employeeId}',
            path: {
                'employeeId': employeeId,
            },
            query: {
                'startDate': startDate,
                'endDate': endDate,
            },
        });
    }
    /**
     * @param date
     * @returns ApiResponseListAttendanceDto OK
     * @throws ApiError
     */
    public static attendanceByDate(
        date: string,
    ): CancelablePromise<ApiResponseListAttendanceDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/hr/attendance/date/{date}',
            path: {
                'date': date,
            },
        });
    }
}

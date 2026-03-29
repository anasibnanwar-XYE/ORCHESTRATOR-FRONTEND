 /**
  * HR & Payroll API wrapper
  *
  * Covers:
  *  - Employee management (CRUD, search)
  *  - Salary structures (templates)
  *  - Attendance (single mark, bulk mark, calendar, summary)
  *  - Leave requests (create, approve/reject, types, balances)
  *  - Payroll runs (lifecycle: create → calculate → approve → post → mark-paid)
  *  - Payroll summaries (weekly, monthly)
  *  - Payroll payments (single, batch)
  */
 
 import { apiRequest } from './api';
 import type { ApiResponse } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Enums & shared types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export type EmployeeType = 'STAFF' | 'LABOUR';
 export type PaymentSchedule = 'MONTHLY' | 'WEEKLY';
 export type TaxRegime = 'OLD' | 'NEW';
 export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
 
 export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'WEEKEND';
 
 export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
 
 export type PayrollRunStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'POSTED' | 'PAID';
 export type PayrollRunType = 'MONTHLY' | 'WEEKLY';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Employee Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface EmployeeRequest {
   firstName: string;
   lastName: string;
   email: string;
   phone?: string;
   department?: string;
   designation?: string;
   employeeCode?: string;
   employeeType?: EmployeeType;
   paymentSchedule?: PaymentSchedule;
   dateOfJoining?: string;
   dateOfBirth?: string;
   monthlySalary?: number;
   dailyWage?: number;
   workingDaysPerMonth?: number;
   standardHoursPerDay?: number;
   salaryStructureTemplateId?: number;
   pfNumber?: string;
   esiNumber?: string;
   panNumber?: string;
   taxRegime?: TaxRegime;
   bankAccountName?: string;
   bankAccountNumber?: string;
   bankIfsc?: string;
   bankBranch?: string;
   status?: EmployeeStatus;
 }
 
 export interface EmployeeDto {
   id: number;
   publicId: string;
   employeeCode: string;
   firstName: string;
   lastName: string;
   email: string;
   phone?: string;
   department?: string;
   designation?: string;
   employeeType: EmployeeType;
   paymentSchedule: PaymentSchedule;
   dateOfJoining?: string;
   dateOfBirth?: string;
   monthlySalary?: number;
   dailyWage?: number;
   workingDaysPerMonth?: number;
   standardHoursPerDay?: number;
   salaryStructureTemplateId?: number;
   salaryStructureTemplateCode?: string;
   basicPay?: number;
   hra?: number;
   da?: number;
   specialAllowance?: number;
   pfNumber?: string;
   esiNumber?: string;
   panNumber?: string;
   taxRegime?: TaxRegime;
   bankAccountName?: string;
   bankIfsc?: string;
   bankBranch?: string;
   status: EmployeeStatus;
   createdAt: string;
   updatedAt: string;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Salary Structure Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface SalaryStructureTemplateRequest {
   code: string;
   name: string;
   basicPay: number;
   hra: number;
   da: number;
   specialAllowance: number;
   employeePfRate?: number;
   employeeEsiRate?: number;
   esiEligibilityThreshold?: number;
   professionalTax?: number;
   active?: boolean;
 }
 
 export interface SalaryStructureTemplateDto {
   id: number;
   code: string;
   name: string;
   basicPay: number;
   hra: number;
   da: number;
   specialAllowance: number;
   totalEarnings: number;
   employeePfRate: number;
   employeeEsiRate: number;
   esiEligibilityThreshold: number;
   professionalTax: number;
   active: boolean;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Attendance Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface MarkAttendanceRequest {
   status: AttendanceStatus;
   date?: string;
   checkIn?: string;
   checkOut?: string;
   regularHours?: number;
   overtimeHours?: number;
   doubleOvertimeHours?: number;
   holiday?: boolean;
   weekend?: boolean;
   remarks?: string;
 }
 
 export interface BulkMarkAttendanceRequest {
   employeeIds: number[];
   date: string;
   status: AttendanceStatus;
   remarks?: string;
 }
 
 export interface AttendanceDto {
   id: number;
   employeeId: number;
   employeeCode: string;
   employeeName: string;
   date: string;
   status: AttendanceStatus;
   checkIn?: string;
   checkOut?: string;
   regularHours?: number;
   overtimeHours?: number;
   doubleOvertimeHours?: number;
   holiday?: boolean;
   weekend?: boolean;
   remarks?: string;
   markedBy?: string;
   markedAt?: string;
 }
 
 export interface AttendanceSummaryDto {
   date: string;
   present: number;
   absent: number;
   halfDay: number;
   onLeave: number;
   total: number;
 }
 
 export interface MonthlyAttendanceSummaryDto {
   employeeId: number;
   employeeCode: string;
   employeeName: string;
   year: number;
   month: number;
   presentDays: number;
   absentDays: number;
   halfDays: number;
   leaveDays: number;
   holidayDays: number;
   weekendDays: number;
   totalWorkingDays: number;
   regularHours: number;
   overtimeHours: number;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Leave Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface LeaveTypePolicyDto {
   id: number;
   leaveType: string;
   annualEntitlement: number;
   carryForwardLimit: number;
   active: boolean;
 }
 
 export interface LeaveBalanceDto {
   leaveType: string;
   year: number;
   openingBalance: number;
   accrued: number;
   used: number;
   remaining: number;
   carryForwardApplied: number;
 }
 
 export interface LeaveRequestRequest {
   employeeId: number;
   leaveType: string;
   startDate: string;
   endDate: string;
   reason?: string;
 }
 
 export interface LeaveStatusUpdateRequest {
   status: LeaveRequestStatus;
   decisionReason?: string;
 }
 
 export interface LeaveRequestDto {
   id: number;
   employeeId: number;
   employeeName: string;
   employeeCode: string;
   leaveType: string;
   startDate: string;
   endDate: string;
   totalDays: number;
   reason?: string;
   status: LeaveRequestStatus;
   decisionReason?: string;
   approvedBy?: string;
   approvedAt?: string;
   rejectedBy?: string;
   rejectedAt?: string;
   createdAt: string;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Payroll Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export interface CreatePayrollRunRequest {
   runType: PayrollRunType;
   periodStart: string;
   periodEnd: string;
 }
 
 export interface PayrollRunDto {
   id: number;
   runNumber: string;
   runType: PayrollRunType;
   periodStart: string;
   periodEnd: string;
   status: PayrollRunStatus;
   totalBasePay: number;
   totalOvertimePay: number;
   totalDeductions: number;
   totalNetPay: number;
   journalEntryId?: number;
   paymentReference?: string;
   paymentDate?: string;
   createdBy?: string;
   approvedBy?: string;
   postedBy?: string;
   createdAt: string;
   updatedAt: string;
 }
 
 export interface PayrollRunLineDto {
   id: number;
   employeeId: number;
   employeeCode: string;
   employeeName: string;
   department?: string;
   designation?: string;
   // Earnings
   basePay: number;
   overtimePay: number;
   holidayPay: number;
   grossPay: number;
   basicSalaryComponent: number;
   hraComponent: number;
   daComponent: number;
   specialAllowanceComponent: number;
   // Deductions
   loanDeduction: number;
   pfDeduction: number;
   esiDeduction: number;
   taxDeduction: number;
   professionalTaxDeduction: number;
   leaveWithoutPayDeduction: number;
   otherDeductions: number;
   totalDeductions: number;
   netPay: number;
   // Attendance
   presentDays: number;
   halfDays: number;
   absentDays: number;
   leaveDays: number;
   holidayDays: number;
   regularHours: number;
   overtimeHours: number;
   doubleOtHours: number;
   dailyRate: number;
   hourlyRate: number;
   // Payment
   paymentStatus?: string;
   paymentReference?: string;
 }
 
 export interface WeeklyPaySummaryDto {
   weekStart: string;
   weekEnd: string;
   totalGrossPay: number;
   totalDeductions: number;
   totalNetPay: number;
   employeeCount: number;
   employees?: EmployeeWeeklyPayDto[];
 }
 
 export interface EmployeeWeeklyPayDto {
   employeeId: number;
   employeeName: string;
   daysWorked: number;
   dailyRate: number;
   grossPay: number;
   deductions: number;
   netPay: number;
 }
 
 export interface MonthlyPaySummaryDto {
   year: number;
   month: number;
   totalGrossPay: number;
   totalDeductions: number;
   totalNetPay: number;
   employeeCount: number;
   employees?: EmployeeMonthlyPayDto[];
 }
 
 export interface EmployeeMonthlyPayDto {
   employeeId: number;
   employeeName: string;
   grossPay: number;
   pfDeduction: number;
   netPay: number;
 }
 
 export interface PayrollPaymentRequest {
   payrollRunId: number;
   cashAccountId: number;
   expenseAccountId: number;
   amount: number;
   paymentDate?: string;
   paymentReference?: string;
 }
 
 export interface PayrollBatchPaymentRequest {
   runDate: string;
   cashAccountId: number;
   expenseAccountId: number;
   lines: PayrollBatchLine[];
 }
 
 export interface PayrollBatchLine {
   name: string;
   days: number;
   dailyWage: number;
   advance?: number;
   otherDeductions?: number;
   notes?: string;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // API functions
 // ─────────────────────────────────────────────────────────────────────────────
 
 export const hrApi = {
   // ── Employees ──────────────────────────────────────────────────────────────
 
   /** List all employees */
   getEmployees: () =>
     apiRequest<ApiResponse<EmployeeDto[]>>({
       method: 'GET',
       url: '/hr/employees',
     }).then((r) => r.data.data),
 
   /** Create employee */
   createEmployee: (data: EmployeeRequest) =>
     apiRequest<ApiResponse<EmployeeDto>>({
       method: 'POST',
       url: '/hr/employees',
       data,
     }).then((r) => r.data.data),
 
   /** Update employee */
   updateEmployee: (id: number, data: EmployeeRequest) =>
     apiRequest<ApiResponse<EmployeeDto>>({
       method: 'PUT',
       url: `/hr/employees/${id}`,
       data,
     }).then((r) => r.data.data),
 
   /** Delete / deactivate employee (backend hard-delete) */
   deleteEmployee: (id: number) =>
     apiRequest<void>({
       method: 'DELETE',
       url: `/hr/employees/${id}`,
     }),
 
   // ── Salary Structures ───────────────────────────────────────────────────────
 
   /** List salary structure templates */
   getSalaryStructures: () =>
     apiRequest<ApiResponse<SalaryStructureTemplateDto[]>>({
       method: 'GET',
       url: '/hr/salary-structures',
     }).then((r) => r.data.data),
 
   /** Create salary structure template */
   createSalaryStructure: (data: SalaryStructureTemplateRequest) =>
     apiRequest<ApiResponse<SalaryStructureTemplateDto>>({
       method: 'POST',
       url: '/hr/salary-structures',
       data,
     }).then((r) => r.data.data),
 
   /** Update salary structure template */
   updateSalaryStructure: (id: number, data: SalaryStructureTemplateRequest) =>
     apiRequest<ApiResponse<SalaryStructureTemplateDto>>({
       method: 'PUT',
       url: `/hr/salary-structures/${id}`,
       data,
     }).then((r) => r.data.data),
 
   // ── Attendance ─────────────────────────────────────────────────────────────
 
   /** Get today's attendance */
   getAttendanceToday: () =>
     apiRequest<ApiResponse<AttendanceDto[]>>({
       method: 'GET',
       url: '/hr/attendance/today',
     }).then((r) => r.data.data),
 
   /** Get attendance for a specific date */
   getAttendanceByDate: (date: string) =>
     apiRequest<ApiResponse<AttendanceDto[]>>({
       method: 'GET',
       url: `/hr/attendance/date/${date}`,
     }).then((r) => r.data.data),
 
   /** Get attendance summary (today) */
   getAttendanceSummary: () =>
     apiRequest<ApiResponse<AttendanceSummaryDto>>({
       method: 'GET',
       url: '/hr/attendance/summary',
     }).then((r) => r.data.data),
 
   /** Get monthly attendance summary */
   getMonthlyAttendanceSummary: (year: number, month: number) =>
     apiRequest<ApiResponse<MonthlyAttendanceSummaryDto[]>>({
       method: 'GET',
       url: '/hr/attendance/summary/monthly',
       params: { year, month },
     }).then((r) => r.data.data),
 
   /** Get attendance for an employee over a date range */
   getEmployeeAttendance: (employeeId: number, startDate: string, endDate: string) =>
     apiRequest<ApiResponse<AttendanceDto[]>>({
       method: 'GET',
       url: `/hr/attendance/employee/${employeeId}`,
       params: { startDate, endDate },
     }).then((r) => r.data.data),
 
   /** Mark attendance for a single employee */
   markAttendance: (employeeId: number, data: MarkAttendanceRequest) =>
     apiRequest<ApiResponse<AttendanceDto>>({
       method: 'POST',
       url: `/hr/attendance/mark/${employeeId}`,
       data,
     }).then((r) => r.data.data),
 
   /** Bulk mark attendance for multiple employees */
   bulkMarkAttendance: (data: BulkMarkAttendanceRequest) =>
     apiRequest<ApiResponse<AttendanceDto[]>>({
       method: 'POST',
       url: '/hr/attendance/bulk-mark',
       data,
     }).then((r) => r.data.data),
 
   // ── Leave ──────────────────────────────────────────────────────────────────
 
   /** List leave type policies */
   getLeaveTypes: () =>
     apiRequest<ApiResponse<LeaveTypePolicyDto[]>>({
       method: 'GET',
       url: '/hr/leave-types',
     }).then((r) => r.data.data),
 
   /** Get leave balances for an employee */
   getLeaveBalances: (employeeId: number, year?: number) =>
     apiRequest<ApiResponse<LeaveBalanceDto[]>>({
       method: 'GET',
       url: `/hr/employees/${employeeId}/leave-balances`,
       params: year ? { year } : undefined,
     }).then((r) => r.data.data),
 
   /** List all leave requests */
   getLeaveRequests: () =>
     apiRequest<ApiResponse<LeaveRequestDto[]>>({
       method: 'GET',
       url: '/hr/leave-requests',
     }).then((r) => r.data.data),
 
   /** Create a leave request */
   createLeaveRequest: (data: LeaveRequestRequest) =>
     apiRequest<ApiResponse<LeaveRequestDto>>({
       method: 'POST',
       url: '/hr/leave-requests',
       data,
     }).then((r) => r.data.data),
 
   /** Update leave request status (approve/reject/cancel) */
   updateLeaveStatus: (id: number, data: LeaveStatusUpdateRequest) =>
     apiRequest<ApiResponse<LeaveRequestDto>>({
       method: 'PATCH',
       url: `/hr/leave-requests/${id}/status`,
       data,
     }).then((r) => r.data.data),
 
   // ── Payroll Runs ───────────────────────────────────────────────────────────
 
   /** List all payroll runs */
   getPayrollRuns: () =>
     apiRequest<ApiResponse<PayrollRunDto[]>>({
       method: 'GET',
       url: '/payroll/runs',
     }).then((r) => r.data.data),
 
   /** List monthly payroll runs */
   getMonthlyPayrollRuns: () =>
     apiRequest<ApiResponse<PayrollRunDto[]>>({
       method: 'GET',
       url: '/payroll/runs/monthly',
     }).then((r) => r.data.data),
 
   /** List weekly payroll runs */
   getWeeklyPayrollRuns: () =>
     apiRequest<ApiResponse<PayrollRunDto[]>>({
       method: 'GET',
       url: '/payroll/runs/weekly',
     }).then((r) => r.data.data),
 
   /** Get a single payroll run by ID */
   getPayrollRun: (id: number) =>
     apiRequest<ApiResponse<PayrollRunDto>>({
       method: 'GET',
       url: `/payroll/runs/${id}`,
     }).then((r) => r.data.data),
 
   /** Get payroll run lines */
   getPayrollRunLines: (id: number) =>
     apiRequest<ApiResponse<PayrollRunLineDto[]>>({
       method: 'GET',
       url: `/payroll/runs/${id}/lines`,
     }).then((r) => r.data.data),
 
   /** Create a generic payroll run */
   createPayrollRun: (data: CreatePayrollRunRequest) =>
     apiRequest<ApiResponse<PayrollRunDto>>({
       method: 'POST',
       url: '/payroll/runs',
       data,
     }).then((r) => r.data.data),
 
   /** Create monthly payroll run via convenience endpoint */
   createMonthlyPayrollRun: (year: number, month: number) =>
     apiRequest<ApiResponse<PayrollRunDto>>({
       method: 'POST',
       url: '/payroll/runs/monthly',
       params: { year, month },
     }).then((r) => r.data.data),
 
   /** Create weekly payroll run via convenience endpoint */
   createWeeklyPayrollRun: (weekEndingDate: string) =>
     apiRequest<ApiResponse<PayrollRunDto>>({
       method: 'POST',
       url: '/payroll/runs/weekly',
       params: { weekEndingDate },
     }).then((r) => r.data.data),
 
   /** Calculate payroll run (DRAFT → CALCULATED) */
   calculatePayrollRun: (id: number) =>
     apiRequest<ApiResponse<PayrollRunDto>>({
       method: 'POST',
       url: `/payroll/runs/${id}/calculate`,
     }).then((r) => r.data.data),
 
   /** Approve payroll run (CALCULATED → APPROVED) */
   approvePayrollRun: (id: number) =>
     apiRequest<ApiResponse<PayrollRunDto>>({
       method: 'POST',
       url: `/payroll/runs/${id}/approve`,
     }).then((r) => r.data.data),
 
   /** Post payroll run (APPROVED → POSTED) */
   postPayrollRun: (id: number) =>
     apiRequest<ApiResponse<PayrollRunDto>>({
       method: 'POST',
       url: `/payroll/runs/${id}/post`,
     }).then((r) => r.data.data),
 
   /** Mark payroll run as paid (POSTED → PAID) */
   markPayrollRunPaid: (id: number, paymentReference?: string) =>
     apiRequest<ApiResponse<PayrollRunDto>>({
       method: 'POST',
       url: `/payroll/runs/${id}/mark-paid`,
       data: paymentReference ? { paymentReference } : {},
     }).then((r) => r.data.data),
 
   // ── Payroll Summaries ──────────────────────────────────────────────────────
 
   /** Current week pay summary */
   getCurrentWeekSummary: () =>
     apiRequest<ApiResponse<WeeklyPaySummaryDto>>({
       method: 'GET',
       url: '/payroll/summary/current-week',
     }).then((r) => r.data.data),
 
   /** Current month pay summary */
   getCurrentMonthSummary: () =>
     apiRequest<ApiResponse<MonthlyPaySummaryDto>>({
       method: 'GET',
       url: '/payroll/summary/current-month',
     }).then((r) => r.data.data),
 
   /** Weekly pay summary by date */
   getWeeklySummary: (weekEndingDate: string) =>
     apiRequest<ApiResponse<WeeklyPaySummaryDto>>({
       method: 'GET',
       url: '/payroll/summary/weekly',
       params: { weekEndingDate },
     }).then((r) => r.data.data),
 
   /** Monthly pay summary by year/month */
   getMonthlySummary: (year: number, month: number) =>
     apiRequest<ApiResponse<MonthlyPaySummaryDto>>({
       method: 'GET',
       url: '/payroll/summary/monthly',
       params: { year, month },
     }).then((r) => r.data.data),
 
   // ── Payroll Payments ───────────────────────────────────────────────────────
 
   /** Record single payroll payment */
   recordPayrollPayment: (data: PayrollPaymentRequest) =>
     apiRequest<ApiResponse<unknown>>({
       method: 'POST',
       url: '/accounting/payroll/payments',
       data,
     }).then((r) => r.data.data),
 
   /** Process batch payroll payment */
   processBatchPayment: (data: PayrollBatchPaymentRequest) =>
     apiRequest<ApiResponse<unknown>>({
       method: 'POST',
       url: '/accounting/payroll/payments/batch',
       data,
     }).then((r) => r.data.data),
 };

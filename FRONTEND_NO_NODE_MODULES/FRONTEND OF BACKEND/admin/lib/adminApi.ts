import { apiData, apiRequest, setApiSession, unwrap } from './api';
import type { AuthSession } from '../types/auth';
import type { PayrollRunDto } from './client/models/PayrollRunDto';

// --- Re-export Types from Generated Client ---
export type { UserDto } from './client/models/UserDto';
export type { CreateUserRequest } from './client/models/CreateUserRequest';
export type { UpdateUserRequest } from './client/models/UpdateUserRequest';
export type { RoleDto } from './client/models/RoleDto';
export type { PermissionDto } from './client/models/PermissionDto';
export type { CreateRoleRequest } from './client/models/CreateRoleRequest';
export type { CompanyDto } from './client/models/CompanyDto';
export type { CompanyRequest } from './client/models/CompanyRequest';
export type { SwitchCompanyRequest } from './client/models/SwitchCompanyRequest';
export type { EmployeeDto } from './client/models/EmployeeDto';
export type { EmployeeRequest } from './client/models/EmployeeRequest';
export type { LeaveRequestDto } from './client/models/LeaveRequestDto';
export type { LeaveRequestRequest } from './client/models/LeaveRequestRequest';
export type { PayrollRunDto } from './client/models/PayrollRunDto';
export type PayrollRun = PayrollRunDto;
export type PayrollRunLine = any; // TODO: replace when model is generated
export type PayrollSummary = any; // TODO: replace when model is generated
export type { AttendanceDto } from './client/models/AttendanceDto';
export type { AttendanceSummaryDto } from './client/models/AttendanceSummaryDto';
export type { MarkAttendanceRequest } from './client/models/MarkAttendanceRequest';
export type { BulkMarkAttendanceRequest } from './client/models/BulkMarkAttendanceRequest';
export type { SystemSettingsDto as AdminSettings } from './client/models/SystemSettingsDto';
export type { AdminNotifyRequest } from './client/models/AdminNotifyRequest';
export type { AdminApprovalItemDto } from './client/models/AdminApprovalItemDto';
export type { AdminApprovalsResponse } from './client/models/AdminApprovalsResponse';

// Import Services
import { AdminUserControllerService } from './client/services/AdminUserControllerService';
import { RoleControllerService } from './client/services/RoleControllerService';
import { CompanyControllerService } from './client/services/CompanyControllerService';
import { MultiCompanyControllerService } from './client/services/MultiCompanyControllerService';
import { HrControllerService } from './client/services/HrControllerService';
import { HrPayrollControllerService } from './client/services/HrPayrollControllerService';
import { AdminSettingsControllerService } from './client/services/AdminSettingsControllerService';
// Import Models for use in wrappers
import type { CreateUserRequest } from './client/models/CreateUserRequest';
import type { UpdateUserRequest } from './client/models/UpdateUserRequest';
import type { CreateRoleRequest } from './client/models/CreateRoleRequest';
import type { CompanyRequest } from './client/models/CompanyRequest';
import type { EmployeeRequest } from './client/models/EmployeeRequest';
import type { LeaveRequestRequest } from './client/models/LeaveRequestRequest';
import type { PayrollRunRequest } from './client/models/PayrollRunRequest';
import type { MarkAttendanceRequest } from './client/models/MarkAttendanceRequest';
import type { BulkMarkAttendanceRequest } from './client/models/BulkMarkAttendanceRequest';
import type { AdminNotifyRequest } from './client/models/AdminNotifyRequest';
import type { StatusRequest } from './client/models/StatusRequest';


// Helper for session
const withSession = (session?: AuthSession | null) => {
    if (session) setApiSession(session);
};

// --- API Functions ---

// 1.1 User Management
export const listUsers = async (session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await AdminUserControllerService.list2());
};

export const createUser = async (payload: CreateUserRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await AdminUserControllerService.create2(payload));
};

// getUser removed - endpoint GET /api/v1/admin/users/{id} does not exist in backend
// Use listUsers and filter client-side if needed

export const updateUser = async (id: number, payload: UpdateUserRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await AdminUserControllerService.update2(id, payload));
};

export const deleteUser = async (id: number, session?: AuthSession | null) => {
    withSession(session);
    return await AdminUserControllerService.delete1(id);
};

// resetUserPassword removed - endpoint POST /api/v1/auth/users/{id}/reset-password does not exist

export const suspendUser = async (id: number, session?: AuthSession | null) => {
    withSession(session);
    return await AdminUserControllerService.suspend(id);
};

export const unsuspendUser = async (id: number, session?: AuthSession | null) => {
    withSession(session);
    return await AdminUserControllerService.unsuspend(id);
};

export const disableUserMfa = async (id: number, session?: AuthSession | null) => {
    withSession(session);
    return await AdminUserControllerService.disableMfa(id);
};


// 1.2 Role Management
export const listRoles = async (session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await RoleControllerService.listRoles());
};

export const createRole = async (payload: CreateRoleRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await RoleControllerService.createRole(payload));
};

export const getRoleByKey = async (roleKey: string, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await RoleControllerService.getRoleByKey(roleKey));
};

// updateRole removed - endpoint PUT /api/v1/admin/roles/{id} does not exist
// listPermissions removed - endpoint GET /api/v1/rbac/permissions does not exist


// 1.3 Company Management
export const listCompanies = async (session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await CompanyControllerService.list1());
};

export const createCompany = async (payload: CompanyRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await CompanyControllerService.create1(payload));
};

export const updateCompany = async (id: number, payload: CompanyRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await CompanyControllerService.update(id, payload));
};

export const deleteCompany = async (id: number, session?: AuthSession | null) => {
    withSession(session);
    return await CompanyControllerService.delete(id);
};

// 1.3b Multi-Company
export const switchCompany = async (companyCode: string, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await MultiCompanyControllerService.switchCompany({ companyCode }));
};


// 1.4 HR Module
export const listEmployees = async (session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.employees());
};

export const createEmployee = async (payload: EmployeeRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.createEmployee(payload));
};

export const getEmployee = async (id: number, session?: AuthSession | null) => {
    // No getEmployee(id) method in generated client — using legacy apiData
    return apiData<any>(`/api/v1/hr/employees/${id}`, {}, session);
};

export const updateEmployee = async (id: number, payload: EmployeeRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.updateEmployee(id, payload));
};

// Leave Requests
export const listLeaveRequests = async (session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    // HrControllerService.leaveRequests()
    return unwrap(await HrControllerService.leaveRequests());
};

export const createLeaveRequest = async (payload: LeaveRequestRequest, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrControllerService.createLeaveRequest(payload));
};

export const updateLeaveRequestStatus = async (
    id: number,
    status: 'APPROVED' | 'REJECTED' | 'PENDING',
    session?: AuthSession | null,
    companyCode?: string
) => {
    withSession(session);
    const payload: StatusRequest = { status };
    return unwrap(await HrControllerService.updateLeaveStatus(id, payload));
};

// Payroll
export const processPayroll = async (payload: PayrollRunRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.createPayrollRun1(payload));
};

// getPayrollSlips removed - endpoint GET /api/v1/hr/payroll/slips/{empId} does not exist

export const getPayrollSummary = async (session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.payrollRuns());
};

// Attendance
export const getTodayAttendance = async (session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.attendanceToday());
};

export const getAttendanceByDate = async (date: string, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.attendanceByDate(date));
};

export const getTodayAttendanceSummary = async (session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.attendanceSummary());
};

export const getEmployeeAttendanceHistory = async (
    employeeId: number,
    startDate?: string,
    endDate?: string,
    session?: AuthSession | null
) => {
    withSession(session);
    if (!startDate || !endDate) {
        // Required args?
        // Method signature: employeeAttendance(id, start, end)
        // If not provided, fallback to manual or provide defaults?
        const now = new Date();
        const end = endDate || now.toISOString().split('T')[0];
        const start = startDate || new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
        return unwrap(await HrControllerService.employeeAttendance(employeeId, start, end));
    }
    return unwrap(await HrControllerService.employeeAttendance(employeeId, startDate, endDate));
};

export const markEmployeeAttendance = async (employeeId: number, payload: MarkAttendanceRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.markAttendance(employeeId, payload));
};

export const bulkMarkAttendance = async (payload: BulkMarkAttendanceRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await HrControllerService.bulkMarkAttendance(payload));
};

// markSelfAttendance removed - endpoint POST /api/v1/hr/attendance/mark-self does not exist
// searchLabourers removed - endpoint GET /api/v1/hr/attendance/search-labourers does not exist

// Payroll Preview & Execution (using HrPayrollControllerService or similar)
export interface PayrollPreviewDto {
    period: { from: string; to: string };
    calculatedAt: string;
    employees: any[];
    grandTotal: number;
}
// Helper to call weekly summary which replaced preview
export const previewWeeklyPayroll = async (weekStartDate?: string, session?: AuthSession | null) => {
    withSession(session);
    let weekEndingDate = weekStartDate;
    if (weekStartDate) {
        const start = new Date(weekStartDate);
        start.setDate(start.getDate() + 6);
        weekEndingDate = start.toISOString().split('T')[0];
    }
    // HrPayrollControllerService.getWeeklyPaySummary(weekEndingDate)
    if (!weekEndingDate) return null; // or throw
    return unwrap(await HrPayrollControllerService.getWeeklyPaySummary(weekEndingDate));
};

export const previewMonthlyPayroll = async (month?: string, session?: AuthSession | null) => {
    withSession(session);
    if (!month) return null;
    const [year, monthNum] = month.split('-');
    return unwrap(await HrPayrollControllerService.getMonthlyPaySummary(parseInt(year), parseInt(monthNum)));
};

export interface RunPayrollRequest {
    weekStartDate?: string;
    month?: string;
    confirm?: boolean;
}
export const runWeeklyPayroll = async (payload: RunPayrollRequest, session?: AuthSession | null) => {
    // HrPayrollControllerService.createWeeklyPayrollRun(weekEndingDate)
    withSession(session);
    let weekEndingDate = payload.weekStartDate;
    if (payload.weekStartDate) {
        const start = new Date(payload.weekStartDate);
        start.setDate(start.getDate() + 6);
        weekEndingDate = start.toISOString().split('T')[0];
    }
    if (!weekEndingDate) throw new Error("Week date required");
    return unwrap(await HrPayrollControllerService.createWeeklyPayrollRun(weekEndingDate));
};

export const runMonthlyPayroll = async (payload: RunPayrollRequest, session?: AuthSession | null) => {
    withSession(session);
    if (!payload.month) throw new Error("Month required");
    const [year, monthNum] = payload.month.split('-');
    return unwrap(await HrPayrollControllerService.createMonthlyPayrollRun(parseInt(year), parseInt(monthNum)));
};

// --- Missing Payroll Functions for PayrollPage.tsx ---

export const listPayrollRuns = async (filters?: any, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    // Filters ignored for now as generated client listPayrollRuns has no args?
    // Check service definition: listPayrollRuns() takes no args.
    // If backend supports query params, we might need to bypass or update client.
    // For now, simple list.
    return unwrap(await HrPayrollControllerService.listPayrollRuns());
};

export const getPayrollRun = async (id: number, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.getPayrollRun(id));
};

export const getPayrollRunLines = async (id: number, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.getPayrollRunLines(id));
};

export const createWeeklyPayrollRun = async (weekEndingDate: string, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.createWeeklyPayrollRun(weekEndingDate));
};

export const createMonthlyPayrollRun = async (year: number, month: number, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.createMonthlyPayrollRun(year, month));
};

export const calculatePayroll = async (id: number, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.calculatePayroll(id));
};

export const approvePayroll = async (id: number, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.approvePayroll(id));
};

export const postPayrollToAccounting = async (id: number, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.postPayroll(id));
};

export const markPayrollAsPaid = async (id: number, payload: any, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    // Payload might be { paymentReference: string }
    return unwrap(await HrPayrollControllerService.markAsPaid(id, payload));
};

export const getCurrentWeekPaySummary = async (session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.getCurrentWeekPaySummary());
};

export const getCurrentMonthPaySummary = async (session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.getCurrentMonthPaySummary());
};

export const getWeeklyPaySummary = async (weekEndingDate: string, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.getWeeklyPaySummary(weekEndingDate));
};

export const getMonthlyPaySummary = async (year: number, month: number, session?: AuthSession | null, companyCode?: string) => {
    withSession(session);
    return unwrap(await HrPayrollControllerService.getMonthlyPaySummary(year, month));
};

// recordAdvancePayment removed - endpoint POST /api/v1/hr/employees/{id}/advance does not exist

// System Settings (AdminSettingsControllerService)
// Replaces getSettings / updateSettings
// System Settings (AdminSettingsControllerService)
// Replaces getSettings / updateSettings
export const getSettings = async (session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await AdminSettingsControllerService.getSettings());
};

export const updateSettings = async (payload: any, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await AdminSettingsControllerService.updateSettings(payload));
};

// Admin Settings (duplicates above but specific typing)
export const getAdminSettings = async (session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await AdminSettingsControllerService.getSettings());
};

export const updateAdminSettings = async (payload: any, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await AdminSettingsControllerService.updateSettings(payload));
};

export const sendAdminNotification = async (payload: AdminNotifyRequest, session?: AuthSession | null) => {
    withSession(session);
    return unwrap(await AdminSettingsControllerService.notifyUser(payload));
};

// Approvals (AdminSettingsControllerService)
export const getAdminApprovals = async (session?: AuthSession | null) => {
    withSession(session);
    const response = await AdminSettingsControllerService.approvals();
    return unwrap<import('./client/models/AdminApprovalsResponse').AdminApprovalsResponse>(response);
};

// getAccountingSettings removed - endpoint GET /api/v1/settings/accounting does not exist
// Use getSettings or getAdminSettings instead

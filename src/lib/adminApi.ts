/**
 * Admin API wrapper
 *
 * Admin portal operations: users, roles, companies, settings, approvals, notifications.
 */

import { apiRequest } from './api';
import type {
  ApiResponse,
  ApprovalsResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Role,
  CreateRoleRequest,
  Company,
  AdminSettings,
  CreditRequestDecisionRequest,
} from '@/types';
 import type { ExportRequestDto, ExportRequestDecisionRequest } from '@/types';

export const adminApi = {
  // ─────────────────────────────────────────────────────────────────────────
  // Approvals
  // ─────────────────────────────────────────────────────────────────────────

  async getApprovals(): Promise<ApprovalsResponse> {
    const response = await apiRequest.get<ApiResponse<ApprovalsResponse>>('/admin/approvals');
    return response.data.data;
  },

  async approveCreditRequest(id: number, data: CreditRequestDecisionRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/sales/credit-requests/${id}/approve`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async rejectCreditRequest(id: number, data: CreditRequestDecisionRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/sales/credit-requests/${id}/reject`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async approvePayroll(id: number): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(`/payroll/runs/${id}/approve`);
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async approveCreditOverride(id: number): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/credit/override-requests/${id}/approve`
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async rejectCreditOverride(id: number): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/credit/override-requests/${id}/reject`
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Export Approvals
  // ─────────────────────────────────────────────────────────────────────────

  async getPendingExports(): Promise<ExportRequestDto[]> {
    const response = await apiRequest.get<ApiResponse<ExportRequestDto[]>>(
      '/admin/exports/pending'
    );
    return response.data.data;
  },

  async approveExport(requestId: string): Promise<ExportRequestDto> {
    const response = await apiRequest.put<ApiResponse<ExportRequestDto>>(
      `/admin/exports/${requestId}/approve`
    );
    return response.data.data;
  },

  async rejectExport(requestId: string, data?: ExportRequestDecisionRequest): Promise<ExportRequestDto> {
    const response = await apiRequest.put<ApiResponse<ExportRequestDto>>(
      `/admin/exports/${requestId}/reject`,
      data
    );
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────────────────────────────────

  async getUsers(): Promise<User[]> {
    const response = await apiRequest.get<ApiResponse<User[]>>('/admin/users');
    return response.data.data;
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiRequest.post<ApiResponse<User>>('/admin/users', data);
    return response.data.data;
  },

  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await apiRequest.put<ApiResponse<User>>(`/admin/users/${id}`, data);
    return response.data.data;
  },

  async deleteUser(id: number): Promise<void> {
    const response = await apiRequest.delete<ApiResponse<void>>(`/admin/users/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async suspendUser(id: number): Promise<void> {
    const response = await apiRequest.patch<ApiResponse<void>>(`/admin/users/${id}/suspend`);
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async unsuspendUser(id: number): Promise<void> {
    const response = await apiRequest.patch<ApiResponse<void>>(`/admin/users/${id}/unsuspend`);
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async disableUserMfa(id: number): Promise<void> {
    const response = await apiRequest.patch<ApiResponse<void>>(`/admin/users/${id}/mfa/disable`);
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Roles
  // ─────────────────────────────────────────────────────────────────────────

  async getRoles(): Promise<Role[]> {
    const response = await apiRequest.get<ApiResponse<Role[]>>('/admin/roles');
    return response.data.data;
  },

  async getRoleByKey(key: string): Promise<Role> {
    const response = await apiRequest.get<ApiResponse<Role>>(`/admin/roles/${key}`);
    return response.data.data;
  },

  async createRole(data: CreateRoleRequest): Promise<Role> {
    const response = await apiRequest.post<ApiResponse<Role>>('/admin/roles', data);
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Companies
  // ─────────────────────────────────────────────────────────────────────────

  async getCompanies(): Promise<Company[]> {
    const response = await apiRequest.get<ApiResponse<Company[]>>('/companies');
    return response.data.data;
  },

  async createCompany(data: Partial<Company>): Promise<Company> {
    const response = await apiRequest.post<ApiResponse<Company>>('/companies', data);
    return response.data.data;
  },

  async updateCompany(id: number, data: Partial<Company>): Promise<Company> {
    const response = await apiRequest.put<ApiResponse<Company>>(`/companies/${id}`, data);
    return response.data.data;
  },

  async deleteCompany(id: number): Promise<void> {
    const response = await apiRequest.delete<ApiResponse<void>>(`/companies/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────────────────────────────────

  async getSettings(): Promise<AdminSettings> {
    const response = await apiRequest.get<ApiResponse<AdminSettings>>('/admin/settings');
    return response.data.data;
  },

  async updateSettings(data: Partial<AdminSettings>): Promise<AdminSettings> {
    const response = await apiRequest.put<ApiResponse<AdminSettings>>('/admin/settings', data);
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────────────────────────────────

  async notifyUser(userId: number, message: string): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>('/admin/notify', {
      userId,
      message,
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },
};

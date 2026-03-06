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

 import type {
   OrchestratorAdminDashboard,
   OrchestratorFactoryDashboard,
   OrchestratorFinanceDashboard,
   OrchestratorDispatchRequest,
   OrchestratorFulfillmentRequest,
   PortalDashboard,
   PortalOperations,
   PortalWorkforce,
   BusinessEvent,
   MlEvent,
   AuditEventFilters,
   TenantRuntimeMetrics,
   TenantPolicy,
   OperationsStatus,
   PageResponse,
 } from '@/types';
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

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator APIs
// ─────────────────────────────────────────────────────────────────────────────

export const orchestratorApi = {
  // Dashboards
  async getAdminDashboard(): Promise<OrchestratorAdminDashboard> {
    const response = await apiRequest.get<ApiResponse<OrchestratorAdminDashboard>>(
      '/orchestrator/dashboard/admin'
    );
    return response.data.data;
  },

  async getFactoryDashboard(): Promise<OrchestratorFactoryDashboard> {
    const response = await apiRequest.get<ApiResponse<OrchestratorFactoryDashboard>>(
      '/orchestrator/dashboard/factory'
    );
    return response.data.data;
  },

  async getFinanceDashboard(): Promise<OrchestratorFinanceDashboard> {
    const response = await apiRequest.get<ApiResponse<OrchestratorFinanceDashboard>>(
      '/orchestrator/dashboard/finance'
    );
    return response.data.data;
  },

  // Order actions
  async approveOrder(orderId: number): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/orchestrator/orders/${orderId}/approve`
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async fulfillOrder(orderId: number, data: OrchestratorFulfillmentRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/orchestrator/orders/${orderId}/fulfillment`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  // Dispatch
  async createDispatch(data: OrchestratorDispatchRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>('/orchestrator/dispatch', data);
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  // Health
  async getEventHealth(): Promise<Record<string, unknown>> {
    const response = await apiRequest.get<ApiResponse<Record<string, unknown>>>(
      '/orchestrator/health/events'
    );
    return response.data.data;
  },

  async getIntegrationsHealth(): Promise<Record<string, unknown>> {
    const response = await apiRequest.get<ApiResponse<Record<string, unknown>>>(
      '/orchestrator/health/integrations'
    );
    return response.data.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Portal Insights APIs
// ─────────────────────────────────────────────────────────────────────────────

export const portalInsightsApi = {
  async getDashboard(): Promise<PortalDashboard> {
    const response = await apiRequest.get<ApiResponse<PortalDashboard>>('/portal/dashboard');
    return response.data.data;
  },

  async getOperations(): Promise<PortalOperations> {
    const response = await apiRequest.get<ApiResponse<PortalOperations>>('/portal/operations');
    return response.data.data;
  },

  async getWorkforce(): Promise<PortalWorkforce> {
    const response = await apiRequest.get<ApiResponse<PortalWorkforce>>('/portal/workforce');
    return response.data.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Audit Trail APIs
// ─────────────────────────────────────────────────────────────────────────────

export const auditApi = {
  async getBusinessEvents(
    filters: AuditEventFilters = {}
  ): Promise<PageResponse<BusinessEvent>> {
    const params = new URLSearchParams();
    if (filters.actor) params.set('actor', filters.actor);
    if (filters.action) params.set('action', filters.action);
    if (filters.resource) params.set('resource', filters.resource);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.size !== undefined) params.set('size', String(filters.size));
    const qs = params.toString();
    const response = await apiRequest.get<ApiResponse<PageResponse<BusinessEvent>>>(
      `/audit/business-events${qs ? `?${qs}` : ''}`
    );
    return response.data.data;
  },

  async getMlEvents(filters: { page?: number; size?: number } = {}): Promise<PageResponse<MlEvent>> {
    const params = new URLSearchParams();
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.size !== undefined) params.set('size', String(filters.size));
    const qs = params.toString();
    const response = await apiRequest.get<ApiResponse<PageResponse<MlEvent>>>(
      `/audit/ml-events${qs ? `?${qs}` : ''}`
    );
    return response.data.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Runtime APIs
// ─────────────────────────────────────────────────────────────────────────────

export const tenantApi = {
  async getRuntimeMetrics(): Promise<TenantRuntimeMetrics> {
    // Uses admin settings endpoint for runtime data
    const response = await apiRequest.get<ApiResponse<TenantRuntimeMetrics>>(
      '/admin/settings/runtime'
    );
    return response.data.data;
  },

  async getPolicy(): Promise<TenantPolicy> {
    const response = await apiRequest.get<ApiResponse<TenantPolicy>>('/admin/settings/policy');
    return response.data.data;
  },

  async updatePolicy(data: Partial<TenantPolicy>): Promise<TenantPolicy> {
    const response = await apiRequest.put<ApiResponse<TenantPolicy>>(
      '/admin/settings/policy',
      data
    );
    return response.data.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Operations Control APIs
// ─────────────────────────────────────────────────────────────────────────────

export const operationsControlApi = {
  async getStatus(): Promise<OperationsStatus> {
    const response = await apiRequest.get<ApiResponse<OperationsStatus>>(
      '/admin/operations/status'
    );
    return response.data.data;
  },

  async setMaintenanceMode(enabled: boolean): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      '/admin/operations/maintenance',
      { enabled }
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async toggleFeatureFlag(key: string, enabled: boolean): Promise<void> {
    const response = await apiRequest.patch<ApiResponse<void>>(
      `/admin/operations/flags/${key}`,
      { enabled }
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async purgeCache(): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>('/admin/operations/cache/purge');
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },
};

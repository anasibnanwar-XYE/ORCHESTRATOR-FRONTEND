 /**
  * Superadmin API wrapper
  *
  * Platform governance operations: tenant CRUD, lifecycle management,
  * admin password reset, support warnings, platform roles, audit trail, support tickets.
  *
  * Key endpoints:
  *  GET    /api/v1/admin/users                              → list all platform users
  *  GET    /api/v1/companies                               → list all tenants
  *  POST   /api/v1/companies                               → create tenant
  *  PUT    /api/v1/companies/{id}                          → update tenant
  *  DELETE /api/v1/companies/{id}                          → delete tenant
  *  PATCH  /api/v1/companies/{id}/suspend                  → suspend tenant
  *  PATCH  /api/v1/companies/{id}/unsuspend                → unsuspend / activate tenant
  *  POST   /api/v1/companies/{id}/admin-password-reset     → reset admin password
  *  POST   /api/v1/companies/{id}/support-warnings         → send support warning
  *  GET    /api/v1/admin/tenant-runtime/metrics             → tenant runtime metrics (canonical)
  *  PUT    /api/v1/companies/{id}/tenant-runtime/policy    → update company runtime policy (canonical)
  *  GET    /api/v1/admin/roles                             → list platform roles
  *  POST   /api/v1/admin/roles                             → create platform role
  *  GET    /api/v1/audit/business-events                   → audit trail
  */
 
 import { apiRequest } from './api';
 import { showToast } from '@/components/ui/toast-bridge';
 import type {
   ApiResponse,
   PageResponse,
   Tenant,
   TenantOnboardRequest,
   TenantUpdateRequest,
   SupportWarningRequest,
   AdminPasswordResetRequest,
   PlatformDashboardMetrics,
   SupportTicket,
   Role,
   CreateRoleRequest,
   BusinessEvent,
   AuditEventFilters,
   TenantRuntimeMetrics,
   TenantRuntimePolicyUpdateRequest,
   TenantPolicy,
 } from '@/types';
 import type {
   SupportTicketDetail,
   TicketResponseRequest,
   TicketPriorityRequest,
   TicketAssignRequest,
 } from '@/types';
import type {
  SuperAdminDashboardDto,
  SuperAdminTenantDto,
  TenantOnboardingRequest,
  TenantOnboardingResponse,
  CoATemplateDto,
  SupportTicketResponse,
  SupportTicketListResponse,
} from '@/types';

const DEFAULT_TENANT_POLICY: TenantPolicy = {
  sessionTimeoutMinutes: 60,
  passwordMinLength: 10,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: true,
  maxLoginAttempts: 5,
  mfaRequired: false,
};

function cloneTenantPolicy(): TenantPolicy {
  return { ...DEFAULT_TENANT_POLICY };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Management — /api/v1/superadmin/tenants/*
// ─────────────────────────────────────────────────────────────────────────────

export const superadminTenantsApi = {
  /** List all tenants with optional status filter */
  async listTenants(params?: {
    search?: string;
    status?: string;
  }): Promise<SuperAdminTenantDto[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    const response = await apiRequest.get<ApiResponse<SuperAdminTenantDto[]>>(
      `/superadmin/tenants${query ? `?${query}` : ''}`
    );
    return response.data.data;
  },

  /** Get CoA templates available for onboarding */
  async getCoATemplates(): Promise<CoATemplateDto[]> {
    const response = await apiRequest.get<ApiResponse<CoATemplateDto[]>>(
      '/superadmin/tenants/coa-templates'
    );
    return response.data.data;
  },

  /**
   * Onboard a new tenant via POST /api/v1/superadmin/tenants/onboard.
   * Atomically creates company, admin user, default period, and CoA accounts.
   * Returns TenantOnboardingResponse with one-time adminTemporaryPassword.
   */
  async onboardTenant(data: TenantOnboardingRequest): Promise<TenantOnboardingResponse> {
    const response = await apiRequest.post<ApiResponse<TenantOnboardingResponse>>(
      '/superadmin/tenants/onboard',
      data
    );
    return response.data.data;
  },

  /** Update tenant details via PUT /api/v1/companies/{id} (admin endpoint shared with superadmin) */
  async updateTenant(id: number, data: TenantUpdateRequest): Promise<Tenant> {
    const response = await apiRequest.put<ApiResponse<Tenant>>(`/companies/${id}`, data);
    return response.data.data;
  },

  /** Activate a tenant via POST /api/v1/superadmin/tenants/{id}/activate */
  async activateTenant(id: number): Promise<SuperAdminTenantDto> {
    const response = await apiRequest.post<ApiResponse<SuperAdminTenantDto>>(
      `/superadmin/tenants/${id}/activate`
    );
    return response.data.data;
  },

  /** Suspend an active tenant via POST /api/v1/superadmin/tenants/{id}/suspend */
  async suspendTenant(id: number): Promise<SuperAdminTenantDto> {
    const response = await apiRequest.post<ApiResponse<SuperAdminTenantDto>>(
      `/superadmin/tenants/${id}/suspend`
    );
    return response.data.data;
  },

  /** Deactivate a suspended tenant (terminal) via POST /api/v1/superadmin/tenants/{id}/deactivate */
  async deactivateTenant(id: number): Promise<SuperAdminTenantDto> {
    const response = await apiRequest.post<ApiResponse<SuperAdminTenantDto>>(
      `/superadmin/tenants/${id}/deactivate`
    );
    return response.data.data;
  },

  /** Reset the admin user password for a tenant */
  async resetAdminPassword(id: number, data: AdminPasswordResetRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/superadmin/tenants/${id}/reset-admin-password`,
      data
    );
    if (!response.data.success) throw new Error(response.data.message);
  },

  /** Send a support warning to a tenant via POST /api/v1/superadmin/tenants/{id}/warnings */
  async sendSupportWarning(id: number, data: SupportWarningRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/superadmin/tenants/${id}/warnings`,
      data
    );
    if (!response.data.success) throw new Error(response.data.message);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Platform Dashboard Metrics — /api/v1/superadmin/dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const superadminDashboardApi = {
  /** Get platform-level dashboard metrics from GET /api/v1/superadmin/dashboard */
  async getMetrics(): Promise<SuperAdminDashboardDto> {
    const response = await apiRequest.get<ApiResponse<SuperAdminDashboardDto>>(
      '/superadmin/dashboard'
    );
    return response.data.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Platform Roles — /api/v1/admin/roles
// ─────────────────────────────────────────────────────────────────────────────

export const superadminRolesApi = {
  async listRoles(): Promise<Role[]> {
    const response = await apiRequest.get<ApiResponse<Role[]>>('/admin/roles');
    return response.data.data;
  },

  async createRole(data: CreateRoleRequest): Promise<Role> {
    const response = await apiRequest.post<ApiResponse<Role>>('/admin/roles', data);
    return response.data.data;
  },

  async getRoleByKey(key: string): Promise<Role> {
    const response = await apiRequest.get<ApiResponse<Role>>(`/admin/roles/${key}`);
    return response.data.data;
  },

  /**
   * List superadmin platform users for role assignment.
   * Uses GET /api/v1/admin/users to get all users with ROLE_SUPER_ADMIN.
   */
  async listPlatformUsers(): Promise<Array<{ id: number; email: string; displayName: string; roles: string[] }>> {
    const response = await apiRequest.get<ApiResponse<Array<{ id: number; email: string; displayName: string; roles: string[] }>>>(
      '/admin/users'
    );
    return response.data.data;
  },

  /**
   * Assign a role to a superadmin user via PUT /api/v1/admin/users/{id}.
   * Merges the new role into the user's existing roles array.
   */
  async assignRoleToUser(userId: number, roleKey: string, currentRoles: string[]): Promise<void> {
    const roles = currentRoles.includes(roleKey)
      ? currentRoles
      : [...currentRoles, roleKey];
    const response = await apiRequest.put<ApiResponse<void>>(
      `/admin/users/${userId}`,
      { roles }
    );
    if (!response.data.success) throw new Error(response.data.message);
  },

  /**
   * Revoke a role from a superadmin user via PUT /api/v1/admin/users/{id}.
   */
  async revokeRoleFromUser(userId: number, roleKey: string, currentRoles: string[]): Promise<void> {
    const roles = currentRoles.filter((r) => r !== roleKey);
    const response = await apiRequest.put<ApiResponse<void>>(
      `/admin/users/${userId}`,
      { roles }
    );
    if (!response.data.success) throw new Error(response.data.message);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Superadmin Audit Trail — /api/v1/audit/business-events
// ─────────────────────────────────────────────────────────────────────────────

export const superadminAuditApi = {
  async getBusinessEvents(
    filters: AuditEventFilters & { tenant?: string } = {}
  ): Promise<PageResponse<BusinessEvent>> {
    const params = new URLSearchParams();
    if (filters.actor) params.set('actor', filters.actor);
    if (filters.action) params.set('action', filters.action);
    if (filters.resource) params.set('resource', filters.resource);
    if (filters.tenant) params.set('tenant', filters.tenant);
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
};

// ─────────────────────────────────────────────────────────────────────────────
// Support Tickets — /api/v1/support/tickets
// Returns SupportTicketListResponse { tickets: SupportTicketResponse[] }
// ─────────────────────────────────────────────────────────────────────────────

export const superadminTicketsApi = {
  /**
   * List all support tickets.
   * Backend returns SupportTicketListResponse { tickets: SupportTicketResponse[] }.
   * Status/search filtering is done client-side since backend doesn't expose query params.
   */
  async listTickets(params?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<SupportTicketResponse[]> {
    const response = await apiRequest.get<ApiResponse<SupportTicketListResponse>>(
      '/support/tickets'
    );
    let tickets = response.data.data.tickets ?? [];
    // Client-side filtering
    if (params?.status) {
      tickets = tickets.filter((t) => t.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.companyCode.toLowerCase().includes(q) ||
          t.publicId.toLowerCase().includes(q) ||
          (t.requesterEmail ?? '').toLowerCase().includes(q)
      );
    }
    return tickets;
  },

  async getTicket(id: string | number): Promise<SupportTicketResponse> {
    const response = await apiRequest.get<ApiResponse<SupportTicketResponse>>(
      `/support/tickets/${id}`
    );
    return response.data.data;
  },
};

export const superadminTicketsDetailApi = {
  /** Get full ticket detail including responses, attachments, and status history */
  async getTicket(id: string | number): Promise<SupportTicketResponse> {
    const response = await apiRequest.get<ApiResponse<SupportTicketResponse>>(
      `/support/tickets/${id}`
    );
    return response.data.data;
  },

  /** Add a response to a ticket (can be internal note or public reply) */
  async addResponse(id: string | number, req: TicketResponseRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/support/tickets/${id}/responses`,
      req
    );
    if (!response.data.success) throw new Error(response.data.message);
  },

  /** Update ticket status (IN_PROGRESS, RESOLVED, CLOSED) */
  async updateStatus(id: string | number, status: string): Promise<void> {
    const response = await apiRequest.patch<ApiResponse<void>>(
      `/support/tickets/${id}/status`,
      { status }
    );
    if (!response.data.success) throw new Error(response.data.message);
  },

  /** Update ticket priority */
  async updatePriority(id: string | number, req: TicketPriorityRequest): Promise<void> {
    const response = await apiRequest.patch<ApiResponse<void>>(
      `/support/tickets/${id}/priority`,
      req
    );
    if (!response.data.success) throw new Error(response.data.message);
  },

  /** Assign a support agent to this ticket */
  async assignAgent(id: string | number, req: TicketAssignRequest): Promise<void> {
    const response = await apiRequest.patch<ApiResponse<void>>(
      `/support/tickets/${id}/assign`,
      req
    );
    if (!response.data.success) throw new Error(response.data.message);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Runtime and Policy (shared admin endpoints)
// ─────────────────────────────────────────────────────────────────────────────

export const superadminRuntimeApi = {
  /**
   * Read tenant runtime metrics.
   * Uses the canonical admin path GET /api/v1/admin/tenant-runtime/metrics.
   * Accessible to both ROLE_ADMIN and ROLE_SUPER_ADMIN.
   */
  async getRuntimeMetrics(): Promise<TenantRuntimeMetrics> {
    const response = await apiRequest.get<ApiResponse<TenantRuntimeMetrics>>(
      '/admin/tenant-runtime/metrics'
    );
    return response.data.data;
  },

  /**
   * Update runtime rate-limit / concurrency policy for a specific company.
   * Uses the canonical company-scoped path PUT /api/v1/companies/{id}/tenant-runtime/policy.
   * Requires ROLE_SUPER_ADMIN.
   */
  async updateRuntimePolicy(
    companyId: number,
    data: TenantRuntimePolicyUpdateRequest
  ): Promise<TenantRuntimeMetrics> {
    const response = await apiRequest.put<ApiResponse<TenantRuntimeMetrics>>(
      `/companies/${companyId}/tenant-runtime/policy`,
      data
    );
    return response.data.data;
  },

  /** @deprecated Stub kept for backward compatibility — policy reads return defaults */
  async getPolicy(): Promise<TenantPolicy> {
    return cloneTenantPolicy();
  },

  /** @deprecated Stub kept for backward compatibility — no longer wired to a real endpoint */
  async updatePolicy(data: Partial<TenantPolicy>): Promise<TenantPolicy> {
    void data;
    showToast({
      title: 'Policy updates require backend configuration',
      type: 'info',
    });
    return cloneTenantPolicy();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy re-exports for backward compatibility with older import references
// ─────────────────────────────────────────────────────────────────────────────
export type {
  Tenant,
  TenantOnboardRequest,
  TenantUpdateRequest,
  SupportWarningRequest,
  AdminPasswordResetRequest,
  PlatformDashboardMetrics,
  SupportTicket,
  SupportTicketDetail,
};

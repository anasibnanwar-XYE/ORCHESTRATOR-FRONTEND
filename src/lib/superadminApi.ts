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
  *  GET    /api/v1/admin/settings/runtime                  → tenant runtime metrics
  *  GET    /api/v1/admin/settings/policy                   → tenant policy
  *  PUT    /api/v1/admin/settings/policy                   → update policy
  *  GET    /api/v1/admin/roles                             → list platform roles
  *  POST   /api/v1/admin/roles                             → create platform role
  *  GET    /api/v1/audit/business-events                   → audit trail
  */
 
 import { apiRequest } from './api';
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
   TenantPolicy,
 } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Tenant Management
 // ─────────────────────────────────────────────────────────────────────────────
 
 export const superadminTenantsApi = {
   /** List all tenants with optional search/filter params */
   async listTenants(params?: {
     search?: string;
     status?: string;
     page?: number;
     size?: number;
   }): Promise<Tenant[]> {
     const qs = new URLSearchParams();
     if (params?.search) qs.set('search', params.search);
     if (params?.status) qs.set('status', params.status);
     if (params?.page !== undefined) qs.set('page', String(params.page));
     if (params?.size !== undefined) qs.set('size', String(params.size));
     const query = qs.toString();
     const response = await apiRequest.get<ApiResponse<Tenant[]>>(
       `/companies${query ? `?${query}` : ''}`
     );
     return response.data.data;
   },
 
   /** Get a single tenant by ID */
   async getTenant(id: number): Promise<Tenant> {
     const response = await apiRequest.get<ApiResponse<Tenant>>(`/companies/${id}`);
     return response.data.data;
   },
 
   /** Onboard a new tenant (atomically creates company + initial admin user) */
   async onboardTenant(data: TenantOnboardRequest): Promise<Tenant> {
     const response = await apiRequest.post<ApiResponse<Tenant>>('/companies', data);
     return response.data.data;
   },
 
   /** Update tenant details */
   async updateTenant(id: number, data: TenantUpdateRequest): Promise<Tenant> {
     const response = await apiRequest.put<ApiResponse<Tenant>>(`/companies/${id}`, data);
     return response.data.data;
   },
 
   /** Activate a deactivated/new tenant */
   async activateTenant(id: number): Promise<void> {
     const response = await apiRequest.patch<ApiResponse<void>>(
       `/companies/${id}/unsuspend`
     );
     if (!response.data.success) throw new Error(response.data.message);
   },
 
   /** Suspend an active tenant (warns about user access loss) */
   async suspendTenant(id: number): Promise<void> {
     const response = await apiRequest.patch<ApiResponse<void>>(
       `/companies/${id}/suspend`
     );
     if (!response.data.success) throw new Error(response.data.message);
   },
 
   /** Deactivate a suspended tenant (destructive, retains data but revokes all access) */
   async deactivateTenant(id: number): Promise<void> {
     const response = await apiRequest.delete<ApiResponse<void>>(`/companies/${id}`);
     if (!response.data.success) throw new Error(response.data.message);
   },
 
   /** Reset the admin user password for a tenant */
   async resetAdminPassword(id: number, data: AdminPasswordResetRequest): Promise<void> {
     const response = await apiRequest.post<ApiResponse<void>>(
       `/companies/${id}/admin-password-reset`,
       data
     );
     if (!response.data.success) throw new Error(response.data.message);
   },
 
   /** Send a support warning to a tenant */
   async sendSupportWarning(id: number, data: SupportWarningRequest): Promise<void> {
     const response = await apiRequest.post<ApiResponse<void>>(
       `/companies/${id}/support-warnings`,
       data
     );
     if (!response.data.success) throw new Error(response.data.message);
   },
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Platform Dashboard Metrics
 // ─────────────────────────────────────────────────────────────────────────────
 
 export const superadminDashboardApi = {
   /** Get platform-level dashboard metrics (aggregated from tenant + user data) */
   async getMetrics(): Promise<PlatformDashboardMetrics> {
     // Fetches tenant list and user list to derive metrics
     const [tenantsRes, usersRes] = await Promise.allSettled([
       apiRequest.get<ApiResponse<Tenant[]>>('/companies'),
       apiRequest.get<ApiResponse<unknown[]>>('/admin/users'),
     ]);
 
     const tenants: Tenant[] =
       tenantsRes.status === 'fulfilled' ? (tenantsRes.value.data.data ?? []) : [];
     const users: unknown[] =
       usersRes.status === 'fulfilled' ? (usersRes.value.data.data ?? []) : [];
 
     const totalTenants = tenants.length;
     const activeTenants = tenants.filter((t) => t.isActive && t.status !== 'SUSPENDED').length;
     const suspendedTenants = tenants.filter((t) => t.status === 'SUSPENDED').length;
     const totalPlatformUsers = users.length;
     const storageConsumption = tenants.reduce(
       (sum, t) => sum + (t.storageUsedMb ?? 0),
       0
     );
 
     return {
       totalTenants,
       activeTenants,
       suspendedTenants,
       totalPlatformUsers,
       storageConsumption,
     };
   },
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Platform Roles
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
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Superadmin Audit Trail
 // ─────────────────────────────────────────────────────────────────────────────
 
 export const superadminAuditApi = {
   async getBusinessEvents(
     filters: AuditEventFilters & { tenant?: string } = {}
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
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Support Tickets
 // ─────────────────────────────────────────────────────────────────────────────
 
 export const superadminTicketsApi = {
   async listTickets(params?: {
     status?: string;
     priority?: string;
     search?: string;
     page?: number;
     size?: number;
   }): Promise<PageResponse<SupportTicket>> {
     const qs = new URLSearchParams();
     if (params?.status) qs.set('status', params.status);
     if (params?.priority) qs.set('priority', params.priority);
     if (params?.search) qs.set('search', params.search);
     if (params?.page !== undefined) qs.set('page', String(params.page));
     if (params?.size !== undefined) qs.set('size', String(params.size));
     const query = qs.toString();
     const response = await apiRequest.get<ApiResponse<PageResponse<SupportTicket>>>(
       `/support/tickets${query ? `?${query}` : ''}`
     );
     return response.data.data;
   },
 
   async getTicket(id: string): Promise<SupportTicket> {
     const response = await apiRequest.get<ApiResponse<SupportTicket>>(`/support/tickets/${id}`);
     return response.data.data;
   },
   
   async addResponse(id: string, message: string): Promise<void> {
     const response = await apiRequest.post<ApiResponse<void>>(
       `/support/tickets/${id}/responses`,
       { message }
     );
     if (!response.data.success) throw new Error(response.data.message);
   },
 
   async updateStatus(id: string, status: string): Promise<void> {
     const response = await apiRequest.patch<ApiResponse<void>>(
       `/support/tickets/${id}/status`,
       { status }
     );
     if (!response.data.success) throw new Error(response.data.message);
   },
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Re-export tenant runtime and policy (same endpoints as admin)
 // ─────────────────────────────────────────────────────────────────────────────
 
 export const superadminRuntimeApi = {
   async getRuntimeMetrics(): Promise<TenantRuntimeMetrics> {
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

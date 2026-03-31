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
  SystemSettings,
  CreditRequestDecisionRequest,
  PeriodCloseActionRequest,
  AdminNotifyRequest,
  ChangelogEntryRequest,
  ChangelogEntryResponse,
  TenantRuntimePolicyUpdateRequest,
  ExportRequestDto,
  ExportRequestDecisionRequest,
  OrchestratorAdminDashboard,
  OrchestratorFactoryDashboard,
  OrchestratorFinanceDashboard,
  OrchestratorFulfillmentRequest,
  PortalDashboard,
  PortalOperations,
  PortalWorkforce,
  BusinessEvent,
  MlEvent,
  AccountingAuditTrailEntry,
  AuditEventFilters,
  TenantRuntimeMetrics,
  PageResponse,
  LedgerEntry,
  FinanceInvoice,
  AgingBucket,
  FinanceAging,
  SupportTicketResponse,
  CreateTicketRequest,
} from '@/types';

export const adminApi = {
  // ─────────────────────────────────────────────────────────────────────────
  // Approvals — returns grouped AdminApprovalsResponse
  // ─────────────────────────────────────────────────────────────────────────

  async getApprovals(): Promise<ApprovalsResponse> {
    const response = await apiRequest.get<ApiResponse<ApprovalsResponse>>('/admin/approvals');
    return response.data.data;
  },

  async approveCreditRequest(id: number, data: CreditRequestDecisionRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/credit/limit-requests/${id}/approve`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async rejectCreditRequest(id: number, data: CreditRequestDecisionRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/credit/limit-requests/${id}/reject`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async approvePeriodClose(id: number, data?: PeriodCloseActionRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/accounting/periods/${id}/approve-close`,
      data ?? {}
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async rejectPeriodClose(id: number, data?: PeriodCloseActionRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      `/accounting/periods/${id}/reject-close`,
      data ?? {}
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
  // NOTE: Export approvals are loaded via getApprovals().exportRequests —
  //       there is no /admin/exports/pending endpoint.
  // ─────────────────────────────────────────────────────────────────────────

  async approveExport(id: number, data?: { reason?: string }): Promise<ExportRequestDto> {
    const response = await apiRequest.put<ApiResponse<ExportRequestDto>>(
      `/admin/exports/${id}/approve`,
      data
    );
    return response.data.data;
  },

  async rejectExport(id: number, data?: ExportRequestDecisionRequest): Promise<ExportRequestDto> {
    const response = await apiRequest.put<ApiResponse<ExportRequestDto>>(
      `/admin/exports/${id}/reject`,
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
    // DELETE /admin/users/{id} returns 204 No Content — no response body.
    // Axios will throw on non-2xx status automatically.
    await apiRequest.delete(`/admin/users/${id}`);
  },

  async updateUserStatus(userId: number, enabled: boolean): Promise<void> {
    const response = await apiRequest.put<ApiResponse<void>>(
      `/admin/users/${userId}/status`,
      { enabled }
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async suspendUser(id: number): Promise<void> {
    // PATCH /admin/users/{id}/suspend returns 204 No Content — no response body.
    // Axios will throw on non-2xx status automatically.
    await apiRequest.patch(`/admin/users/${id}/suspend`);
  },

  async unsuspendUser(id: number): Promise<void> {
    // PATCH /admin/users/{id}/unsuspend returns 204 No Content — no response body.
    // Axios will throw on non-2xx status automatically.
    await apiRequest.patch(`/admin/users/${id}/unsuspend`);
  },

  async disableUserMfa(id: number): Promise<void> {
    // PATCH /admin/users/{id}/mfa/disable returns 204 No Content — no response body.
    // Axios will throw on non-2xx status automatically.
    await apiRequest.patch(`/admin/users/${id}/mfa/disable`);
  },

  /**
   * Force-reset the password for a target user.
   * POST /api/v1/admin/users/{id}/force-reset-password
   * Returns ApiResponse<String> ("OK") on success.
   * Foreign-target and missing-target both return masked 400 "User not found".
   */
  async forceResetPassword(id: number): Promise<void> {
    const response = await apiRequest.post<ApiResponse<string>>(
      `/admin/users/${id}/force-reset-password`
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Roles
  // ─────────────────────────────────────────────────────────────────────────

  async getRoles(): Promise<Role[]> {
    // Backend returns: { name: "ROLE_ADMIN", description: "Administrator", permissions: [{id,code,description}] }
    // Frontend Role type expects: { key, name, description, permissions: string[], isSystem }
    // Map backend shape to frontend Role type
    const response = await apiRequest.get<ApiResponse<Record<string, unknown>[]>>('/admin/roles');
    const raw = response.data.data ?? [];
    return raw.map((r) => {
      const backendName = (r.name as string) ?? '';
      const perms = Array.isArray(r.permissions) ? r.permissions : [];
      return {
        key: backendName,
        name: (r.description as string) || backendName,
        description: (r.description as string) || undefined,
        permissions: perms.map((p: unknown) => {
          if (typeof p === 'string') return p;
          if (p && typeof p === 'object' && 'code' in p) return (p as { code: string }).code;
          return String(p);
        }),
        isSystem: backendName.startsWith('ROLE_SUPER_ADMIN') || backendName.startsWith('ROLE_ADMIN'),
        createdAt: r.createdAt as string | undefined,
        updatedAt: r.updatedAt as string | undefined,
      } satisfies Role;
    });
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

  // ─────────────────────────────────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────────────────────────────────

  async getSettings(): Promise<SystemSettings> {
    const response = await apiRequest.get<ApiResponse<SystemSettings>>('/admin/settings');
    return response.data.data;
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await apiRequest.put<ApiResponse<SystemSettings>>('/admin/settings', data);
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications — POST /admin/notify with AdminNotifyRequest { to, subject, body }
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send an admin notification to a user via email.
   * Backend expects AdminNotifyRequest: { to, subject, body }
   */
  async sendNotification(payload: AdminNotifyRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>('/admin/notify', payload);
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Changelog APIs
// ─────────────────────────────────────────────────────────────────────────────

export const changelogApi = {
  /** List all changelog entries — GET /changelog */
  async list(page = 0, size = 20): Promise<{ content: ChangelogEntryResponse[]; totalElements: number }> {
    const response = await apiRequest.get<ApiResponse<{ content: ChangelogEntryResponse[]; totalElements: number }>>(
      `/changelog?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  /** Get latest highlighted entry — GET /changelog/latest-highlighted */
  async getLatestHighlighted(): Promise<ChangelogEntryResponse | null> {
    try {
      const response = await apiRequest.get<ApiResponse<ChangelogEntryResponse>>(
        '/changelog/latest-highlighted'
      );
      return response.data.data;
    } catch {
      return null;
    }
  },

  /** Create a new changelog entry (SUPER_ADMIN only) — POST /superadmin/changelog */
  async create(data: ChangelogEntryRequest): Promise<ChangelogEntryResponse> {
    const response = await apiRequest.post<ApiResponse<ChangelogEntryResponse>>(
      '/superadmin/changelog',
      data
    );
    return response.data.data;
  },

  /** Update an existing entry (SUPER_ADMIN only) — PUT /superadmin/changelog/{id} */
  async update(id: number, data: ChangelogEntryRequest): Promise<ChangelogEntryResponse> {
    const response = await apiRequest.put<ApiResponse<ChangelogEntryResponse>>(
      `/superadmin/changelog/${id}`,
      data
    );
    return response.data.data;
  },

  /** Delete a changelog entry (SUPER_ADMIN only) — DELETE /superadmin/changelog/{id} */
  async remove(id: number): Promise<void> {
    await apiRequest.delete<ApiResponse<void>>(`/superadmin/changelog/${id}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator APIs
// ─────────────────────────────────────────────────────────────────────────────

export const orchestratorApi = {
  /**
   * Orchestrator dashboard endpoints return raw JSON (NOT wrapped in ApiResponse).
   * Use response.data directly — do NOT access response.data.data.
   */

  // Dashboards
  async getAdminDashboard(): Promise<OrchestratorAdminDashboard> {
    const response = await apiRequest.get<OrchestratorAdminDashboard>(
      '/orchestrator/dashboard/admin'
    );
    return response.data;
  },

  async getFactoryDashboard(): Promise<OrchestratorFactoryDashboard> {
    const response = await apiRequest.get<OrchestratorFactoryDashboard>(
      '/orchestrator/dashboard/factory'
    );
    return response.data;
  },

  async getFinanceDashboard(): Promise<OrchestratorFinanceDashboard> {
    const response = await apiRequest.get<OrchestratorFinanceDashboard>(
      '/orchestrator/dashboard/finance'
    );
    return response.data;
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

  // Health — also raw JSON (no ApiResponse wrapper)
  async getEventHealth(): Promise<Record<string, unknown>> {
    const response = await apiRequest.get<Record<string, unknown>>(
      '/orchestrator/health/events'
    );
    return response.data;
  },

  async getIntegrationsHealth(): Promise<Record<string, unknown>> {
    const response = await apiRequest.get<Record<string, unknown>>(
      '/orchestrator/health/integrations'
    );
    return response.data;
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
    try {
      const response = await apiRequest.get<ApiResponse<PortalWorkforce>>('/portal/workforce');
      if (!response.data.success) {
        // Module may be disabled (HR_PAYROLL) — propagate the backend message
        throw new Error(response.data.message || 'Workforce module unavailable');
      }
      return response.data.data;
    } catch (err: unknown) {
      // If it's a 403 AxiosError, read the backend message and re-throw
      const axErr = err as { response?: { status?: number; data?: ApiResponse<unknown> } };
      if (axErr?.response?.status === 403) {
        const msg = axErr.response.data?.message ?? 'Workforce module unavailable';
        throw new Error(msg);
      }
      throw err;
    }
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
    if (filters.module) params.set('module', filters.module);
    if (filters.status) params.set('status', filters.status);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.size !== undefined) params.set('size', String(filters.size));
    const qs = params.toString();
    const response = await apiRequest.get<ApiResponse<PageResponse<BusinessEvent>>>(
      `/admin/audit/events${qs ? `?${qs}` : ''}`
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

  async getAccountingAuditTrail(filters: {
    page?: number;
    size?: number;
    from?: string;
    to?: string;
    actor?: string;
    actionType?: string;
    entityType?: string;
  } = {}): Promise<PageResponse<AccountingAuditTrailEntry>> {
    const params = new URLSearchParams();
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.size !== undefined) params.set('size', String(filters.size));
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.actor) params.set('actor', filters.actor);
    if (filters.actionType) params.set('actionType', filters.actionType);
    if (filters.entityType) params.set('entityType', filters.entityType);
    const qs = params.toString();
    const response = await apiRequest.get<ApiResponse<PageResponse<AccountingAuditTrailEntry>>>(
      `/accounting/audit/events${qs ? `?${qs}` : ''}`
    );
    return response.data.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Runtime APIs
// ─────────────────────────────────────────────────────────────────────────────

export const tenantApi = {
  /** GET /admin/tenant-runtime/metrics — current rate-limit and concurrency metrics */
  async getRuntimeMetrics(): Promise<TenantRuntimeMetrics> {
    const response = await apiRequest.get<ApiResponse<TenantRuntimeMetrics>>(
      '/admin/tenant-runtime/metrics'
    );
    return response.data.data;
  },

  /**
   * Update tenant rate-limit / concurrency policy — PUT /admin/tenant-runtime/policy
   */
  async updateRuntimePolicy(data: TenantRuntimePolicyUpdateRequest): Promise<TenantRuntimeMetrics> {
    const response = await apiRequest.put<ApiResponse<TenantRuntimeMetrics>>(
      '/admin/tenant-runtime/policy',
      data
    );
    return response.data.data;
  },
};



// ─────────────────────────────────────────────────────────────────────────────
// Finance Support APIs
// Types (LedgerEntry, FinanceInvoice, AgingBucket, FinanceAging) are in @/types
// ─────────────────────────────────────────────────────────────────────────────

// ── Backend response shapes (internal – not exported) ──

interface LedgerApiEntry {
  date: number[] | string;
  reference?: string;
  memo?: string;
  description?: string;
  debit: number;
  credit: number;
  runningBalance?: number;
  balance?: number;
}

interface LedgerApiResponse {
  dealerId?: number;
  dealerName?: string;
  currentBalance?: number;
  entries?: LedgerApiEntry[];
}

interface InvoicesApiResponse {
  dealerId?: number;
  dealerName?: string;
  totalOutstanding?: number;
  invoiceCount?: number;
  invoices?: FinanceInvoice[];
}

interface AgingApiResponse {
  dealerId: number;
  dealerName: string;
  creditLimit?: number;
  totalOutstanding: number;
  agingBuckets?: Record<string, number>;
  buckets?: AgingBucket[];
  overdueInvoices?: unknown[];
}

/** Convert a date that may be [year,month,day] array to ISO string */
function normaliseDateField(d: number[] | string | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d.length >= 3) {
    const [y, m, day] = d;
    return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return String(d);
}

/** Map aging bucket keys to fromDays/toDays ranges */
function parseAgingBuckets(buckets: Record<string, number>): AgingBucket[] {
  const mapping: { key: string; label: string; fromDays: number; toDays: number }[] = [
    { key: 'current', label: 'Current', fromDays: 0, toDays: 0 },
    { key: '1-30 days', label: '1-30 days', fromDays: 1, toDays: 30 },
    { key: '31-60 days', label: '31-60 days', fromDays: 31, toDays: 60 },
    { key: '61-90 days', label: '61-90 days', fromDays: 61, toDays: 90 },
    { key: '90+ days', label: '90+ days', fromDays: 91, toDays: 999 },
  ];

  return mapping
    .filter((m) => m.key in buckets)
    .map((m) => ({ label: m.label, fromDays: m.fromDays, toDays: m.toDays, amount: buckets[m.key] ?? 0 }));
}

export const financeSupportApi = {
  /** Get dealer ledger entries — normalises backend shape to LedgerEntry[] */
  async getLedger(dealerId: number): Promise<LedgerEntry[]> {
    const response = await apiRequest.get<ApiResponse<LedgerApiResponse | LedgerEntry[]>>(
      `/portal/finance/ledger?dealerId=${dealerId}`
    );
    const raw = response.data.data;

    // Backend may return { entries: [...] } or a flat array
    const entries: LedgerApiEntry[] = Array.isArray(raw) ? raw : (raw as LedgerApiResponse).entries ?? [];

    return entries.map((e) => ({
      date: normaliseDateField(e.date),
      reference: e.reference ?? '',
      description: e.memo ?? e.description ?? '',
      debit: e.debit ?? 0,
      credit: e.credit ?? 0,
      balance: e.runningBalance ?? e.balance ?? 0,
    }));
  },

  /** Get dealer invoices — normalises backend shape to FinanceInvoice[] */
  async getInvoices(dealerId: number): Promise<FinanceInvoice[]> {
    const response = await apiRequest.get<ApiResponse<InvoicesApiResponse | FinanceInvoice[]>>(
      `/portal/finance/invoices?dealerId=${dealerId}`
    );
    const raw = response.data.data;

    // Backend may return { invoices: [...] } or a flat array
    return Array.isArray(raw) ? raw : (raw as InvoicesApiResponse).invoices ?? [];
  },

  /** Get dealer aging report — normalises backend shape to FinanceAging */
  async getAging(dealerId: number): Promise<FinanceAging> {
    const response = await apiRequest.get<ApiResponse<AgingApiResponse>>(
      `/portal/finance/aging?dealerId=${dealerId}`
    );
    const raw = response.data.data;

    // Backend may return agingBuckets as a key/value object or already-structured buckets array
    const buckets: AgingBucket[] = raw.buckets
      ? raw.buckets
      : raw.agingBuckets
        ? parseAgingBuckets(raw.agingBuckets)
        : [];

    return {
      dealerId: raw.dealerId,
      dealerName: raw.dealerName,
      totalOutstanding: raw.totalOutstanding ?? 0,
      buckets,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Support Ticket APIs (Admin Portal)
// Types (SupportTicketResponse, CreateTicketRequest) are in @/types
// ─────────────────────────────────────────────────────────────────────────────

export const adminSupportApi = {
  /** List all support tickets */
  async listTickets(): Promise<SupportTicketResponse[]> {
    const response = await apiRequest.get<ApiResponse<{ tickets: SupportTicketResponse[] }>>(
      '/portal/support/tickets'
    );
    return response.data.data.tickets;
  },

  /** Get ticket detail by ID */
  async getTicket(ticketId: number): Promise<SupportTicketResponse> {
    const response = await apiRequest.get<ApiResponse<SupportTicketResponse>>(
      `/portal/support/tickets/${ticketId}`
    );
    return response.data.data;
  },

  /** Create a new support ticket */
  async createTicket(request: CreateTicketRequest): Promise<SupportTicketResponse> {
    const response = await apiRequest.post<ApiResponse<SupportTicketResponse>>(
      '/portal/support/tickets',
      request
    );
    return response.data.data;
  },
};

// Re-export types from @/types for backward compatibility
export type { LedgerEntry, FinanceInvoice, AgingBucket, FinanceAging, CreateTicketRequest, SupportTicket } from '@/types';

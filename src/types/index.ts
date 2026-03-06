
// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator Dashboard Types
// ─────────────────────────────────────────────────────────────────────────────

export interface OrchestratorAdminDashboard {
  totalOrders: number;
  totalDispatches: number;
  totalFulfilments: number;
  pendingApprovals: number;
  revenueThisMonth?: number;
  activeUsers?: number;
}

export interface OrchestratorFactoryDashboard {
  activeJobs: number;
  throughput: number;
  packingQueue: number;
  completedToday: number;
  efficiencyRate?: number;
}

export interface OrchestratorFinanceDashboard {
  revenue: number;
  cogs: number;
  grossProfit: number;
  receivables: number;
  payables: number;
  netCashFlow?: number;
}

export interface OrchestratorDispatchRequest {
  orderId: number;
  notes?: string;
  lineItems?: { productId: number; quantity: number }[];
}

export interface OrchestratorFulfillmentRequest {
  lineItems: { productId: number; quantity: number; status: 'SHIPPED' | 'DELIVERED' }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Portal Insights Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PortalDashboard {
  sessions: number;
  pageViews: number;
  errors: number;
  activeUsers?: number;
  avgSessionDuration?: number;
  bounceRate?: number;
}

export interface PortalOperations {
  apiLatencyP50: number;
  apiLatencyP95: number;
  apiLatencyP99: number;
  queueDepths: { queue: string; depth: number }[];
  errorRate?: number;
  uptime?: number;
}

export interface PortalWorkforce {
  attendanceRate: number;
  overtime: number;
  departmentHeadcount: { department: string; count: number }[];
  leaveUtilisation: number;
  totalHeadcount?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Trail Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessEvent {
  id: string | number;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown> | string;
  companyCode?: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR';
}

export interface MlEvent {
  id: string | number;
  timestamp: string;
  model: string;
  action: string;
  input?: string;
  output?: string;
  confidence?: number;
  latencyMs?: number;
  status?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
}

export interface AuditEventFilters {
  actor?: string;
  action?: string;
  resource?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Runtime Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantRuntimeMetrics {
  apiCalls: number;
  storageUsedMb: number;
  activeSessions: number;
  apiCallsLimit?: number;
  storageLimit?: number;
  period?: string;
}

export interface TenantPolicy {
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  maxLoginAttempts: number;
  mfaRequired?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Operations Control Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureFlag {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface OperationsStatus {
  maintenanceMode: boolean;
  featureFlags: FeatureFlag[];
  cacheLastPurged?: string;
}
// ─────────────────────────────────────────────────────────────────────────────
// Core API Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  companyCode?: string;
}

/**
 * Flat DTO returned by POST /auth/login, POST /auth/mfa/verify,
 * POST /auth/switch-company. There is NO nested `user` object in this response.
 * After receiving this DTO, the app calls GET /auth/me to hydrate the full User.
 */
export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  /** Company code scoped to this token */
  companyCode: string;
  /** Formatted display name (e.g. "Jane Smith") */
  displayName: string;
  mustChangePassword?: boolean;
  requiresMfa?: boolean;
  tempToken?: string;
}

/**
 * Normalized auth result returned by authApi.login(), verifyMfa(), switchCompany().
 * Combines the flat backend DTO with the hydrated User object from GET /auth/me.
 */
export type AuthResult = LoginResponse & { user: User };

export interface MfaVerifyRequest {
  code: string;
  tempToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SwitchCompanyRequest {
  companyCode: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * User shape matching backend MeResponse (GET /auth/me).
 * Note: no id, firstName, lastName, role (singular), isActive, companyCode, createdAt, updatedAt.
 */
export interface User {
  email: string;
  displayName: string;
  companyId?: string;
  mfaEnabled: boolean;
  mustChangePassword?: boolean;
  /** Array of role strings, e.g. ["ROLE_ADMIN"] */
  roles: string[];
  permissions: string[];
  /**
   * List of enabled module keys for the user's company.
   * An empty array (or missing) means all modules are enabled.
   * When non-empty, only the listed modules are enabled.
   */
  enabledModules?: string[];
}

/**
 * Profile shape matching backend ProfileResponse (GET /auth/profile).
 */
export interface Profile {
  email: string;
  displayName: string;
  preferredName?: string;
  jobTitle?: string;
  profilePictureUrl?: string;
  phoneSecondary?: string;
  secondaryEmail?: string;
  mfaEnabled: boolean;
  companies: string[];
  createdAt: string;
  publicId: string;
}

/**
 * Request body for PUT /auth/profile.
 */
export interface UpdateProfileRequest {
  displayName?: string;
  preferredName?: string;
  jobTitle?: string;
  profilePictureUrl?: string;
  phoneSecondary?: string;
  secondaryEmail?: string;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  roles: string[];
  password?: string;
  companyCode?: string;
}

export interface UpdateUserRequest {
  email?: string;
  displayName?: string;
  roles?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Role {
  key: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  key: string;
  name: string;
  description?: string;
  permissions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Approval Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApprovalItem {
  type: 'CREDIT_REQUEST' | 'PAYROLL_RUN' | 'CREDIT_OVERRIDE' | 'ORDER_APPROVAL' | string;
  id: number;
  publicId: string;
  reference: string;
  status: string;
  summary: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface ApprovalsResponse {
  items: ApprovalItem[];
  total: number;
  pending: number;
}

export interface CreditRequestDecisionRequest {
  reason: string;
}
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Export Approval Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export type ExportApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
 
 export interface ExportRequestDto {
   requestId: string;
   requester: string;
   reportType: string;
   requestedAt: string;
   status: ExportApprovalStatus;
   parameters?: string;
   message?: string;
 }
 
 export interface ExportRequestDecisionRequest {
   reason?: string;
 }

// ─────────────────────────────────────────────────────────────────────────────
// Company Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Company {
  id: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminSettings {
  companyName: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  emailNotifications: boolean;
  autoApproveThreshold?: number;
}
 
 /**
  * Extended AdminSettings — mirrors the backend AdminSettingsResponse.
  * The backend GET /admin/settings may return any combination of these fields.
  */
 export interface ExtendedAdminSettings extends AdminSettings {
   periodLockEnabled?: boolean;
   exportApprovalRequired?: boolean;
   corsAllowedOrigins?: string;
   smtpHost?: string;
   smtpPort?: number;
   smtpUsername?: string;
   smtpFromEmail?: string;
   smtpFromName?: string;
 }

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  totalCompanies: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Session (persisted to localStorage)
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  companyCode: string;
  companyId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string> | string[];
  timestamp?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core API Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  companyCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  mustChangePassword?: boolean;
  requiresMfa?: boolean;
  tempToken?: string;
}

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

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: number;
  companyCode?: string;
  isActive: boolean;
  mfaEnabled: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
  companyCode?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
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

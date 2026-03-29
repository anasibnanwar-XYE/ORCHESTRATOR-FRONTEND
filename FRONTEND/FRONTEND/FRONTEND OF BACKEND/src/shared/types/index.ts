// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
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

// User Types
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

// Role Types
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

// Approval Types
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

// Company Types
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

// Settings Types
export interface AdminSettings {
  companyName: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  emailNotifications: boolean;
  autoApproveThreshold?: number;
}

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  totalCompanies: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'list';
  data: unknown;
}

// Toast Types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Modal Types
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

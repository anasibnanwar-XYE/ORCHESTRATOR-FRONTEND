/**
 * Auth API wrapper
 *
 * All authentication-related API calls. Handles token storage on login/logout.
 */

import { apiRequest, STORAGE_KEYS } from './api';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  User,
  SwitchCompanyRequest,
} from '@/types';

export const authApi = {
  // ─────────────────────────────────────────────────────────────────────────
  // Login / Logout
  // ─────────────────────────────────────────────────────────────────────────

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiRequest.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );

    const result = response.data.data;

    // Persist full session to localStorage
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));

    if (result.user.companyCode) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_CODE, result.user.companyCode);
    }
    if (result.user.companyId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_ID, String(result.user.companyId));
    }

    return result;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest.post<ApiResponse<void>>('/auth/logout');
    } finally {
      // Always clear session even if the server call fails
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MFA
  // ─────────────────────────────────────────────────────────────────────────

  async verifyMfa(code: string, tempToken: string): Promise<LoginResponse> {
    const response = await apiRequest.post<ApiResponse<LoginResponse>>(
      '/auth/mfa/verify',
      { code, tempToken }
    );

    const result = response.data.data;

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));

    if (result.user.companyCode) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_CODE, result.user.companyCode);
    }
    if (result.user.companyId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_ID, String(result.user.companyId));
    }

    return result;
  },

  async getMfaStatus(): Promise<{ mfaEnabled: boolean }> {
    const response = await apiRequest.get<ApiResponse<{ mfaEnabled: boolean }>>(
      '/auth/mfa/status'
    );
    return response.data.data;
  },

  async setupMfa(): Promise<{ qrCode: string; secret: string }> {
    const response = await apiRequest.post<ApiResponse<{ qrCode: string; secret: string }>>(
      '/auth/mfa/setup'
    );
    return response.data.data;
  },

  async activateMfa(code: string): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      '/auth/mfa/activate',
      { code }
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async disableMfa(code: string): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      '/auth/mfa/disable',
      { code }
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Password management
  // ─────────────────────────────────────────────────────────────────────────

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiRequest.post<ApiResponse<void>>('/auth/password/forgot', data);
  },

  async forgotPasswordSuperadmin(data: ForgotPasswordRequest): Promise<void> {
    await apiRequest.post<ApiResponse<void>>('/auth/password/forgot/superadmin', data);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      '/auth/password/reset',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      '/auth/password/change',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────────────────────────────────

  async me(): Promise<User> {
    const response = await apiRequest.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiRequest.get<ApiResponse<User>>('/auth/profile');
    return response.data.data;
  },

  async updateProfile(data: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>): Promise<User> {
    const response = await apiRequest.put<ApiResponse<User>>('/auth/profile', data);
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Company switching
  // ─────────────────────────────────────────────────────────────────────────

  async switchCompany(data: SwitchCompanyRequest): Promise<LoginResponse> {
    const response = await apiRequest.post<ApiResponse<LoginResponse>>(
      '/auth/switch-company',
      data
    );

    const result = response.data.data;

    // Update stored tokens and company context
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));

    if (result.user.companyCode) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_CODE, result.user.companyCode);
    }
    if (result.user.companyId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_ID, String(result.user.companyId));
    }

    return result;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Session helpers (local, no network)
  // ─────────────────────────────────────────────────────────────────────────

  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
};

/**
 * Auth API wrapper
 *
 * All authentication-related API calls. Handles token storage on login/logout.
 */

import { apiRequest, STORAGE_KEYS } from './api';
import type {
  ApiResponse,
  AuthResult,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  User,
  SwitchCompanyRequest,
} from '@/types';
import type { Profile, UpdateProfileRequest } from '@/types';

// Auth endpoints (/auth/login, /auth/mfa/verify, /auth/refresh-token) return
// raw AuthResponse DTOs — NOT wrapped in the standard { success, data } envelope.

export const authApi = {
  // ─────────────────────────────────────────────────────────────────────────
  // Login / Logout
  // ─────────────────────────────────────────────────────────────────────────

  async login(credentials: LoginRequest): Promise<AuthResult> {
    // /auth/login returns a flat AuthResponse DTO (no envelope wrapper, no nested user)
    const response = await apiRequest.post<LoginResponse>(
      '/auth/login',
      credentials
    );

    const dto = response.data;

    // Store tokens and company context so /auth/me request will be authorised
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, dto.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, dto.refreshToken);
    if (dto.companyCode) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_CODE, dto.companyCode);
    }

    // If MFA is required we cannot hydrate the user yet — return early with
    // the partial DTO. The caller (AuthContext / LoginPage) handles the redirect.
    if (dto.requiresMfa) {
      return { ...dto, user: {} as User };
    }

    // Hydrate the full User object via GET /auth/me (returns ApiResponse<User>)
    const userResponse = await apiRequest.get<ApiResponse<User>>('/auth/me');
    const user = userResponse.data.data;

    // Persist user and company ID
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (user.companyId) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_ID, user.companyId);
    }

    return { ...dto, user };
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

  async verifyMfa(code: string, tempToken: string): Promise<AuthResult> {
    // /auth/mfa/verify returns a flat AuthResponse DTO (no envelope wrapper, no nested user)
    const response = await apiRequest.post<LoginResponse>(
      '/auth/mfa/verify',
      { code, tempToken }
    );

    const dto = response.data;

    // Store tokens and company context
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, dto.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, dto.refreshToken);
    if (dto.companyCode) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_CODE, dto.companyCode);
    }

    // Hydrate the full User object via GET /auth/me
    const userResponse = await apiRequest.get<ApiResponse<User>>('/auth/me');
    const user = userResponse.data.data;

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (user.companyId) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_ID, user.companyId);
    }

    return { ...dto, user };
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

  async getProfile(): Promise<Profile> {
    const response = await apiRequest.get<ApiResponse<Profile>>('/auth/profile');
    return response.data.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<Profile> {
    const response = await apiRequest.put<ApiResponse<Profile>>('/auth/profile', data);
    return response.data.data;
  },


  // ─────────────────────────────────────────────────────────────────────────
  // Company switching
  // ─────────────────────────────────────────────────────────────────────────

  async switchCompany(data: SwitchCompanyRequest): Promise<AuthResult> {
    // /auth/switch-company returns a flat AuthResponse DTO (no envelope wrapper, no nested user)
    const response = await apiRequest.post<LoginResponse>(
      '/auth/switch-company',
      data
    );

    const dto = response.data;

    // Update stored tokens and company context
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, dto.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, dto.refreshToken);
    if (dto.companyCode) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_CODE, dto.companyCode);
    }

    // Hydrate the full User object via GET /auth/me
    const userResponse = await apiRequest.get<ApiResponse<User>>('/auth/me');
    const user = userResponse.data.data;

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (user.companyId) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_ID, user.companyId);
    }

    return { ...dto, user };
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

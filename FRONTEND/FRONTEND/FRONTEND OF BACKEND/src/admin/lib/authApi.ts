import { apiRequest } from './api';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  User,
} from '@/shared/types';

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiRequest.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );
    
    if (response.data.success) {
      const { accessToken, refreshToken, user } = response.data.data;
      localStorage.setItem('bbp-orchestrator-access-token', accessToken);
      localStorage.setItem('bbp-orchestrator-refresh-token', refreshToken);
      localStorage.setItem('bbp-orchestrator-user', JSON.stringify(user));
      
      if (user.companyCode) {
        localStorage.setItem('bbp-orchestrator-company-code', user.companyCode);
      }
      if (user.companyId) {
        localStorage.setItem('bbp-orchestrator-company-id', String(user.companyId));
      }
    }
    
    return response.data.data;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest.post<ApiResponse<void>>('/auth/logout');
    } finally {
      localStorage.removeItem('bbp-orchestrator-access-token');
      localStorage.removeItem('bbp-orchestrator-refresh-token');
      localStorage.removeItem('bbp-orchestrator-user');
      localStorage.removeItem('bbp-orchestrator-company-code');
      localStorage.removeItem('bbp-orchestrator-company-id');
    }
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      '/auth/password/forgot',
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },

  async forgotPasswordSuperadmin(data: ForgotPasswordRequest): Promise<void> {
    const response = await apiRequest.post<ApiResponse<void>>(
      '/auth/password/forgot/superadmin',
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
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

  async getProfile(): Promise<User> {
    const response = await apiRequest.get<ApiResponse<User>>('/auth/profile');
    return response.data.data;
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiRequest.put<ApiResponse<User>>(
      '/auth/profile',
      userData
    );
    return response.data.data;
  },

  async me(): Promise<User> {
    const response = await apiRequest.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('bbp-orchestrator-access-token');
  },

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('bbp-orchestrator-user');
    return userJson ? JSON.parse(userJson) : null;
  },
};

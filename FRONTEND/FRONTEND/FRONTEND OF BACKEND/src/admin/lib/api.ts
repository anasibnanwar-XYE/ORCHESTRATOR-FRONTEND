import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { ApiResponse, LoginResponse } from '@/shared/types';

// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/logout',
  '/auth/password/forgot',
  '/auth/password/forgot/superadmin',
  '/auth/password/reset',
  '/auth/refresh-token',
];

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Skip auth headers for public routes
        const isPublicRoute = PUBLIC_ROUTES.some((route) =>
          config.url?.includes(route)
        );

        if (!isPublicRoute) {
          const token = localStorage.getItem('bbp-orchestrator-access-token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          // Add company context headers
          const companyCode = localStorage.getItem('bbp-orchestrator-company-code');
          const companyId = localStorage.getItem('bbp-orchestrator-company-id');
          
          if (companyCode) {
            config.headers['X-Company-Code'] = companyCode;
          }
          if (companyId) {
            config.headers['X-Company-Id'] = companyId;
          }
        }

        // Add idempotency key for mutating requests
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
          config.headers['Idempotency-Key'] = uuidv4();
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse<unknown>>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('bbp-orchestrator-refresh-token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<ApiResponse<LoginResponse>>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('bbp-orchestrator-access-token', accessToken);
          localStorage.setItem('bbp-orchestrator-refresh-token', newRefreshToken);
        } else {
          throw new Error(response.data.message);
        }
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private logout(): void {
    localStorage.removeItem('bbp-orchestrator-access-token');
    localStorage.removeItem('bbp-orchestrator-refresh-token');
    localStorage.removeItem('bbp-orchestrator-user');
    localStorage.removeItem('bbp-orchestrator-company-code');
    localStorage.removeItem('bbp-orchestrator-company-id');
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

const apiClient = new ApiClient();
export const apiRequest = apiClient.getClient();

export function isApiError(error: unknown): error is AxiosError<ApiResponse<unknown>> {
  return axios.isAxiosError(error);
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

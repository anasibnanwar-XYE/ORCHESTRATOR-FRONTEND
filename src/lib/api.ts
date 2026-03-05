/**
 * Base API Client
 *
 * Provides an Axios instance with:
 *  - Auto token refresh on 401 (deduplicated via singleton promise)
 *  - X-Company-Code and X-Company-Id header injection from stored session
 *  - Idempotency-Key header support for mutation endpoints (POST/PUT/PATCH/DELETE)
 *  - Response envelope unwrapping helpers
 *
 * Storage keys:
 *  bbp-orchestrator-access-token
 *  bbp-orchestrator-refresh-token
 *  bbp-orchestrator-user
 *  bbp-orchestrator-company-code
 *  bbp-orchestrator-company-id
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { ApiResponse } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = '/api/v1';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'bbp-orchestrator-access-token',
  REFRESH_TOKEN: 'bbp-orchestrator-refresh-token',
  USER: 'bbp-orchestrator-user',
  COMPANY_CODE: 'bbp-orchestrator-company-code',
  COMPANY_ID: 'bbp-orchestrator-company-id',
} as const;

/** Routes that must NOT have auth/company headers attached. */
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/logout',
  '/auth/password/forgot',
  '/auth/password/forgot/superadmin',
  '/auth/password/reset',
  '/auth/refresh-token',
  '/auth/mfa/verify',
];

/** HTTP methods that receive an Idempotency-Key header. */
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper: extend Axios config with _retry flag
// ─────────────────────────────────────────────────────────────────────────────

interface RetryableAxiosConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ApiClient class
// ─────────────────────────────────────────────────────────────────────────────

class ApiClient {
  private readonly axiosInstance: AxiosInstance;

  /**
   * Singleton promise for the in-flight token refresh.
   * If multiple 401s arrive concurrently, they all await the same promise
   * so only one refresh call is made.
   */
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30_000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this._setupRequestInterceptor();
    this._setupResponseInterceptor();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Interceptor setup
  // ───────────────────────────────────────────────────────────────────────────

  private _setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const isPublic = PUBLIC_ROUTES.some((route) =>
          config.url?.endsWith(route) || config.url?.includes(route + '?')
        );

        if (!isPublic) {
          // Authorization
          const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          // Company context
          const companyCode = localStorage.getItem(STORAGE_KEYS.COMPANY_CODE);
          const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
          if (companyCode) {
            config.headers['X-Company-Code'] = companyCode;
          }
          if (companyId) {
            config.headers['X-Company-Id'] = companyId;
          }
        }

        // Idempotency key for mutation requests
        const method = (config.method ?? 'GET').toUpperCase();
        if (MUTATION_METHODS.has(method) && !config.headers['Idempotency-Key']) {
          config.headers['Idempotency-Key'] = uuidv4();
        }

        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private _setupResponseInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse<unknown>>) => {
        const originalRequest = error.config as RetryableAxiosConfig | undefined;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            await this._refreshToken();

            // Update Authorization header on the retried request with the new token
            const newToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            return this.axiosInstance(originalRequest);
          } catch {
            this._clearSession();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Token refresh (deduplicated)
  // ───────────────────────────────────────────────────────────────────────────

  private _refreshToken(): Promise<void> {
    // Return existing promise if refresh is already in-flight
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // /auth/refresh-token returns a raw DTO (no envelope wrapper)
        const response = await axios.post<{ accessToken: string; refreshToken: string }>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Session management
  // ───────────────────────────────────────────────────────────────────────────

  private _clearSession(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public accessor
  // ───────────────────────────────────────────────────────────────────────────

  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton instance
// ─────────────────────────────────────────────────────────────────────────────

const apiClient = new ApiClient();

/**
 * Pre-configured Axios instance. Use for raw API calls where you want
 * the full AxiosResponse back.
 */
export const apiRequest = apiClient.getInstance();

// ─────────────────────────────────────────────────────────────────────────────
// Envelope unwrapping helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the `.data` payload from a standard API response envelope.
 * Throws if `success` is false.
 *
 * @example
 * const users = await apiData<User[]>('/admin/users');
 */
export async function apiData<T>(
  url: string,
  config?: Parameters<AxiosInstance['get']>[1]
): Promise<T>;
export async function apiData<T>(
  url: string,
  data?: unknown,
  config?: Parameters<AxiosInstance['post']>[2],
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete'
): Promise<T>;
export async function apiData<T>(
  url: string,
  dataOrConfig?: unknown,
  config?: object,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get'
): Promise<T> {
  let response: AxiosResponse<ApiResponse<T>>;

  if (method === 'get') {
    response = await apiRequest.get<ApiResponse<T>>(url, dataOrConfig as object);
  } else {
    response = await (apiRequest[method] as typeof apiRequest.post)<ApiResponse<T>>(
      url,
      dataOrConfig,
      config
    );
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Operation failed');
  }

  return response.data.data;
}

/**
 * Unwrap an API envelope returned by the generated OpenAPI client.
 * Generated services return `{ success, message, data }` — this extracts `data`.
 *
 * @example
 * const user = unwrap<User>(await AuthControllerService.getProfile());
 */
export function unwrap<T>(response: ApiResponse<T> | T): T {
  if (
    response !== null &&
    typeof response === 'object' &&
    'success' in (response as object) &&
    'data' in (response as object)
  ) {
    const envelope = response as ApiResponse<T>;
    if (!envelope.success) {
      throw new Error(envelope.message || 'Operation failed');
    }
    return envelope.data;
  }
  return response as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type guards and helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if an unknown error is an Axios error with an API response body.
 */
export function isApiError(error: unknown): error is AxiosError<ApiResponse<unknown>> {
  return axios.isAxiosError(error);
}

/**
 * Extract the backend error code from an Axios error response.
 * Returns `undefined` if no code is present.
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    const body = error.response?.data;
    if (body && typeof body === 'object') {
      const b = body as unknown as Record<string, unknown>;
      return typeof b.code === 'string' ? b.code : undefined;
    }
  }
  return undefined;
}

/**
 * Extract the backend error message from an Axios error or generic error.
 */
export function getRawErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const body = error.response?.data;
    if (body && typeof body === 'object') {
      const b = body as unknown as Record<string, unknown>;
      return (typeof b.message === 'string' ? b.message : undefined) ||
        (typeof b.reason === 'string' ? b.reason : undefined) ||
        error.message ||
        'An error occurred';
    }
    return error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Auth API wrapper — single source of truth for all authentication endpoints.
 *
 * Wraps AuthControllerService (generated from OpenAPI spec) and re-exports
 * typed helpers consumed by App.tsx, LoginPage, ForgotPasswordPage, etc.
 *
 * 7 endpoints covered:
 *   POST /api/v1/auth/login           → login()
 *   POST /api/v1/auth/logout          → logout()
 *   GET  /api/v1/auth/me              → getMe()
 *   POST /api/v1/auth/refresh-token   → refreshToken()  (stubbed — pending backend confirmation)
 *   POST /api/v1/auth/password/forgot → forgotPassword()
 *   POST /api/v1/auth/password/reset  → resetPassword()
 *   POST /api/v1/auth/password/change → changePassword()
 */

import { AuthControllerService } from './client/services/AuthControllerService';
import { ApiError } from './client/core/ApiError';
import { unwrap, apiRequest } from './api';
import type { LoginRequest } from './client/models/LoginRequest';
import type { AuthResponse } from './client/models/AuthResponse';
import type { ForgotPasswordRequest } from './client/models/ForgotPasswordRequest';
import type { ResetPasswordRequest } from './client/models/ResetPasswordRequest';
import type { ChangePasswordRequest } from './client/models/ChangePasswordRequest';
import type { RefreshTokenRequest } from './client/models/RefreshTokenRequest';
import type { MeResponse } from '../types/auth';

// Re-export for convenience
export type { LoginRequest, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest, RefreshTokenRequest };
export { ApiError };

// ---------------------------------------------------------------------------
// MFA detection
// ---------------------------------------------------------------------------

/** Result returned when login hits a 428 / MFA-required response. */
export interface MfaRequiredResult {
  mfaRequired: true;
}

/**
 * Inspect an HTTP status + response body and determine whether the backend
 * is asking for a second-factor code.
 */
export const isMfaHint = (status: number, body: unknown): boolean => {
  if (!body || typeof body !== 'object') return status === 428;
  const val = body as Record<string, unknown>;
  const codeMsg = String(val.code ?? val.message ?? '').toLowerCase();
  return (
    status === 428 ||
    val.requiresMfa === true ||
    val.mfaRequired === true ||
    val.next === 'mfa' ||
    val.status === 'MFA_REQUIRED' ||
    val.status === 'PENDING_MFA' ||
    codeMsg.includes('mfa')
  );
};

// ---------------------------------------------------------------------------
// Error message extraction
// ---------------------------------------------------------------------------

/**
 * Pull a human-readable error string from a catch-all API error.
 * Prioritises backend-provided messages, then falls back to status-specific defaults.
 */
export const extractAuthError = (error: unknown, fallback = 'Authentication failed.'): string => {
  if (error instanceof ApiError) {
    const body = error.body;
    const status = error.status;

    // Try several common backend envelope shapes
    const msg =
      (typeof body === 'string' ? body : null) ??
      body?.message ??
      body?.error ??
      body?.errorMessage ??
      body?.data?.message ??
      body?.data?.error ??
      body?.errors?.[0]?.message ??
      null;

    if (msg && typeof msg === 'string' && msg !== fallback) return msg;

    // Status-specific defaults
    if (status === 401) return 'Invalid email or password. Please check your credentials and try again.';
    if (status === 403) return 'Access denied. You do not have permission to login.';
    if (status === 404) return 'Account not found. Please check your email and company code.';
    if (status === 429) return 'Too many login attempts. Please wait a moment and try again.';
    if (status >= 500) return 'Server error. Please try again later or contact support.';

    return msg ?? fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
};

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * Authenticate a user. Returns either a successful AuthResponse or throws.
 *
 * When the backend indicates MFA is required (status 428 or body hints),
 * the function throws an error whose `.message` is 'MFA_REQUIRED' and
 * exposes the status + body via the standard ApiError shape, so the caller
 * can switch to the MFA step.
 *
 * **mustChangePassword:** if the backend's AuthResponse sets this flag, the
 * returned object will carry `mustChangePassword: true`. The caller (App.tsx)
 * is responsible for redirecting to the password-change screen.
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    const raw = await AuthControllerService.login(credentials);

    // Generated client returns the response parsed via the OpenAPI schema.
    // The backend may wrap it in an envelope { success, data, ... }.
    // `raw` might be the AuthResponse directly or an envelope — handle both.
    let authData: AuthResponse = raw;
    if (raw && typeof raw === 'object' && 'data' in raw && (raw as any).data) {
      authData = (raw as any).data as AuthResponse;
    }

    // Carry companyCode forward if the backend didn't echo it
    if (!authData.companyCode && credentials.companyCode) {
      authData.companyCode = credentials.companyCode;
    }

    return authData;
  } catch (error) {
    if (error instanceof ApiError && isMfaHint(error.status, error.body)) {
      // Rethrow with a well-known message so the caller can detect MFA
      const mfaError = new Error('Multi-factor authentication required.');
      (mfaError as any).mfaRequired = true;
      throw mfaError;
    }
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

/**
 * Sign the user out. Fire-and-forget — errors are suppressed so the local
 * session can always be cleared regardless of network state.
 */
export const logout = async (refreshToken?: string): Promise<void> => {
  try {
    await AuthControllerService.logout(refreshToken);
  } catch {
    // Intentionally swallowed — logout should never block UI teardown
  }
};

// ---------------------------------------------------------------------------
// Me (profile / keepalive)
// ---------------------------------------------------------------------------

/**
 * Fetch the currently authenticated user's profile.
 * Also used as a keepalive ping.
 */
export const getMe = async (): Promise<MeResponse> => {
  const raw = await AuthControllerService.me();
  // ApiResponseMeResponse → { success, message, data: MeResponse }
  return unwrap<MeResponse>(raw);
};

/**
 * Fire-and-forget keepalive ping. Uses fetch with `keepalive: true`
 * so the browser can send it even during page unload / visibility-change.
 *
 * This intentionally bypasses the generated client because `keepalive`
 * and `cache: 'no-store'` aren't configurable through the OpenAPI codegen layer.
 */
export const keepAlive = (accessToken: string, tokenType = 'Bearer'): void => {
  // Build URL relative — Vite proxy handles it in dev; in prod OpenAPI.BASE is empty for same-origin
  const url = import.meta.env.DEV ? '/api/v1/auth/me' : `${(globalThis as any).__OPENAPI_BASE ?? ''}/api/v1/auth/me`;
  fetch(url, {
    method: 'GET',
    keepalive: true,
    credentials: 'include',
    headers: { Authorization: `${tokenType} ${accessToken}` },
    cache: 'no-store',
  }).catch(() => undefined);
};

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------

/**
 * Refresh an expired access token.
 *
 * TODO: Token refresh strategy is BLOCKED on backend engineer confirming:
 *   - Refresh endpoint URL (confirmed as /api/v1/auth/refresh-token)
 *   - Token rotation policy (does the backend rotate both tokens?)
 *   - Access token TTL (how long before refresh is needed?)
 *   - Should we install a global interceptor that auto-refreshes on 401?
 *
 * The generated method exists and the wrapper is ready. Do NOT wire into
 * a global interceptor until the above questions are answered.
 */
export const refreshToken = async (payload: RefreshTokenRequest): Promise<AuthResponse> => {
  const raw = await AuthControllerService.refresh(payload);

  let authData: AuthResponse = raw;
  if (raw && typeof raw === 'object' && 'data' in raw && (raw as any).data) {
    authData = (raw as any).data as AuthResponse;
  }
  return authData;
};

// ---------------------------------------------------------------------------
// Password: Forgot / Reset / Change
// ---------------------------------------------------------------------------

/**
 * Request a password-reset email.
 * Returns the success message string from the backend.
 */
export const forgotPassword = async (email: string): Promise<string> => {
  const raw = await AuthControllerService.forgotPassword({ email });
  // ApiResponseString → { success, message, data: string }
  const data = unwrap<string>(raw);
  return data ?? raw.message ?? 'Reset link sent.';
};

/**
 * Request a password-reset email for a superadmin account.
 *
 * Uses raw `apiRequest()` because the generated OpenAPI client does NOT
 * include the `/api/v1/auth/password/forgot/superadmin` endpoint.
 * The backend filters for ROLE_SUPER_ADMIN users only.
 *
 * Same request/response shape as `forgotPassword()`.
 */
export const forgotPasswordSuperadmin = async (email: string): Promise<string> => {
  const raw = await apiRequest<{ success: boolean; message: string; data?: string }>(
    '/api/v1/auth/password/forgot/superadmin',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
  );
  if (raw.success === false) {
    throw new Error(raw.message || 'Failed to send reset email.');
  }
  return raw.data ?? raw.message ?? 'Reset link sent.';
};

/**
 * Reset password using a token from the email link.
 * Returns the success message string from the backend.
 */
export const resetPassword = async (payload: ResetPasswordRequest): Promise<string> => {
  const raw = await AuthControllerService.resetPassword(payload);
  const data = unwrap<string>(raw);
  return data ?? raw.message ?? 'Password reset successfully.';
};

/**
 * Change the authenticated user's password.
 * Used for both voluntary password change and forced first-login change.
 * Returns the success message string from the backend.
 */
export const changePassword = async (payload: ChangePasswordRequest): Promise<string> => {
  const raw = await AuthControllerService.changePassword(payload);
  const data = unwrap<string>(raw);
  return data ?? raw.message ?? 'Password changed successfully.';
};

import type { AuthSession } from '../types/auth'; // Keep types
export { ApiError } from './client/core/ApiError'; // Export generated ApiError
export { OpenAPI } from './client/core/OpenAPI';
import { OpenAPI } from './client/core/OpenAPI';

const SESSION_KEY = 'bbp-orchestrator-session';
const AUTH_EXPIRED_EVENT = 'bbp-auth-expired';

/**
 * Clear stored session and dispatch auth-expired event so App.tsx can redirect to login.
 */
export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
};

// Token refresh state — prevents duplicate in-flight refresh calls
let _refreshing: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token on success, or null on failure.
 */
const attemptTokenRefresh = async (): Promise<string | null> => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { session?: { refreshToken?: string } };
    const refreshToken = stored?.session?.refreshToken;
    if (!refreshToken) return null;

    const res = await fetch(`${OpenAPI.BASE}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });

    if (!res.ok) return null;

    const body = await res.json().catch(() => null);
    const newAccessToken: string | undefined =
      body?.data?.accessToken ?? body?.accessToken ?? body?.data?.token ?? body?.token;
    const newRefreshToken: string | undefined =
      body?.data?.refreshToken ?? body?.refreshToken;

    if (!newAccessToken) return null;

    // Persist updated tokens back to localStorage
    const updated = { ...stored, session: { ...stored.session, accessToken: newAccessToken } };
    if (newRefreshToken) {
      updated.session = { ...updated.session, refreshToken: newRefreshToken };
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));

    // Update the generated client's global token
    OpenAPI.TOKEN = newAccessToken;
    return newAccessToken;
  } catch {
    return null;
  }
};

// Re-export generated client
export * from './client';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const normalizePath = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const ensureProtocol = (value: string) => (value.endsWith(':') ? value : `${value}:`);
const sanitizePort = (value?: string | number) => {
  if (!value && value !== 0) {
    return '';
  }
  return String(value).replace(/^:/, '');
};

const resolveApiBaseUrl = (): string => {
  // In development, default to relative URLs so Vite can proxy `/api/*`.
  // If you need to bypass the proxy (e.g. testing CORS), set:
  // `VITE_USE_PROXY=false` and ensure `VITE_API_BASE_URL` is set.
  if (import.meta.env.DEV) {
    const useProxy = String(import.meta.env.VITE_USE_PROXY ?? 'true').toLowerCase() !== 'false';
    if (useProxy) {
      console.log('Development mode: Using Vite proxy (relative URLs)');
      return '';
    }
  }

  // Option C: Runtime config (window.ENV) - highest priority for production deployments
  if (typeof window !== 'undefined' && (window as any).ENV?.API_URL) {
    const runtimeUrl = (window as any).ENV.API_URL?.trim();
    if (runtimeUrl && runtimeUrl !== '%%API_URL%%' && runtimeUrl !== '') {
      return stripTrailingSlash(runtimeUrl);
    }
  }

  // Option A: Vite environment variable (VITE_API_BASE_URL)
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBase) {
    return stripTrailingSlash(configuredBase);
  }

  // Option B: Relative URLs (for same-domain reverse proxy deployments)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const overrideHost = import.meta.env.VITE_API_HOST?.trim();
    const overridePort = sanitizePort(import.meta.env.VITE_API_PORT);
    const overrideProtocol = import.meta.env.VITE_API_PROTOCOL?.trim();

    if (!overrideHost && !overridePort && !overrideProtocol && import.meta.env.PROD) {
      return '';
    }

    if (!overrideHost && !overridePort && !overrideProtocol) {
      return stripTrailingSlash(window.location.origin);
    }

    const protocol = ensureProtocol(overrideProtocol ?? window.location.protocol ?? 'http:');
    const host = overrideHost ?? window.location.hostname ?? 'localhost';
    const portSegment = overridePort ? `:${overridePort}` : '';
    return stripTrailingSlash(`${protocol}//${host}${portSegment}`);
  }

  // Fallback: Development default
  const fallbackPort = sanitizePort(import.meta.env.VITE_API_PORT ?? '8081');
  const finalUrl = `http://localhost${fallbackPort ? `:${fallbackPort}` : ''}`;
  return finalUrl;
};

export const API_BASE_URL = resolveApiBaseUrl();

// Always return a same-origin URL in dev so Vite can proxy `/api/*`.
// In production, include the resolved API base.
export const getApiUrl = (path: string) => {
  const normalized = normalizePath(path);
  return import.meta.env.DEV ? normalized : `${API_BASE_URL}${normalized}`;
};

// Configure the generated client
OpenAPI.BASE = API_BASE_URL;
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';

/**
 * Configure global API session (tokens, company context)
 * Call this whenever auth state changes
 */
export const setApiSession = (session: AuthSession | null) => {
  if (session?.accessToken) {
    OpenAPI.TOKEN = session.accessToken;
  } else {
    OpenAPI.TOKEN = undefined;
  }

  if (session?.companyCode) {
    OpenAPI.HEADERS = {
      'X-Company-Id': session.companyCode,
      'X-Company-Code': session.companyCode,
    };
  } else {
    OpenAPI.HEADERS = undefined;
  }
};

/**
 * Legacy wrappers for backward compatibility during refactor.
 * These will be phased out in favor of direct Client.Service calls.
 */
import { ApiError as ClientApiError } from './client/core/ApiError';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  timestamp?: string;
}

const parseBody = async (response: Response) => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

/**
 * Extract a human-readable error message from an API response body.
 * Mirrors the deep-probe logic in the generated client's `catchErrorCodes`.
 */
const extractApiErrorMessage = (body: unknown, fallback: string): string => {
  if (typeof body === 'string' && body.trim()) return body.trim();
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const candidate =
      b.reason ??
      b.message ??
      b.error ??
      b.errorMessage ??
      (b.data as Record<string, unknown> | undefined)?.reason ??
      (b.data as Record<string, unknown> | undefined)?.message ??
      (b.data as Record<string, unknown> | undefined)?.error ??
      (b.details as Record<string, unknown> | undefined)?.reason ??
      (b.details as Record<string, unknown> | undefined)?.message ??
      (Array.isArray(b.errors) ? (b.errors[0] as Record<string, unknown>)?.message : undefined);
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return fallback;
};

/**
 * Public auth routes that must NOT receive Authorization or X-Company-Id headers.
 * These endpoints are unauthenticated by design — attaching stale/invalid tokens
 * or tenant context would cause spurious 401s or misleading audit trails.
 */
const PUBLIC_AUTH_PATHS = [
  '/api/v1/auth/password/forgot',
  '/api/v1/auth/password/forgot/superadmin',
  '/api/v1/auth/password/reset',
];

const isPublicAuthPath = (path: string): boolean =>
  PUBLIC_AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}?`));

type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH';

const toHttpMethod = (m: string): HttpMethod => {
  const upper = m.toUpperCase();
  if (['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'].includes(upper)) {
    return upper as HttpMethod;
  }
  return 'GET';
};

export async function apiRequest<T>(path: string, options: RequestInit = {}, session?: AuthSession | null): Promise<T> {
  if (session) setApiSession(session);

  const method: HttpMethod = toHttpMethod(options.method ?? 'GET');
  const isMutating = ['POST', 'PUT', 'PATCH'].includes(method);
  const isPublic = isPublicAuthPath(path);

  const buildHeaders = (overrideToken?: string): Headers => {
    const headers = new Headers(options.headers ?? {});
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');

    if (method !== 'GET' && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (!isPublic) {
      const resolvedToken = overrideToken ?? session?.accessToken ?? (OpenAPI.TOKEN as string | undefined);
      if (resolvedToken) {
        headers.set('Authorization', `Bearer ${resolvedToken}`);
      }

      const companyCode = session?.companyCode || (OpenAPI.HEADERS as Record<string, string>)?.['X-Company-Id'];
      if (companyCode) {
        if (!headers.has('X-Company-Id')) headers.set('X-Company-Id', companyCode);
        if (!headers.has('X-Company-Code')) headers.set('X-Company-Code', companyCode);
      }
    }

    return headers;
  };

  const throwApiError = (status: number, statusText: string, body: unknown, msg?: string) => {
    throw new ClientApiError(
      { method, url: path },
      { url: path, ok: false, status, statusText, body },
      msg ?? extractApiErrorMessage(body, `Request failed (${status})`)
    );
  };

  const headers = buildHeaders();

  // Idempotency key for mutating requests — prevents accidental duplicate side-effects
  if (isMutating && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', crypto.randomUUID());
  }

  try {
    const response = await fetch(`${OpenAPI.BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // ── 401 Token Refresh Interceptor ────────────────────────────────────
    if (response.status === 401 && !isPublic) {
      // Deduplicate: if a refresh is already in-flight, await the same promise
      if (!_refreshing) {
        _refreshing = attemptTokenRefresh().finally(() => {
          _refreshing = null;
        });
      }
      const newToken = await _refreshing;

      if (newToken) {
        // Replay the original request with the fresh token
        const retryHeaders = buildHeaders(newToken);
        if (isMutating) {
          retryHeaders.set('Idempotency-Key', crypto.randomUUID());
        }
        const retryResponse = await fetch(`${OpenAPI.BASE}${path}`, {
          ...options,
          headers: retryHeaders,
          credentials: 'include',
        });
        const retryBody = await parseBody(retryResponse);
        if (!retryResponse.ok) {
          throwApiError(retryResponse.status, retryResponse.statusText, retryBody);
        }
        return retryBody as T;
      } else {
        // Refresh failed — session is invalid; clear and notify the app
        clearSession();
        throwApiError(401, 'Unauthorized', null, 'Session expired. Please sign in again.');
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    const body = await parseBody(response);

    if (!response.ok) {
      throwApiError(response.status, response.statusText, body);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ClientApiError) throw error;
    throw error;
  }
}

export async function apiData<T>(path: string, options: RequestInit = {}, session?: AuthSession | null): Promise<T> {
  const envelope = await apiRequest<ApiEnvelope<T>>(path, options, session);
  if (!envelope.success) {
    throw new ClientApiError({
      method: 'GET',
      url: path,
    }, {
      url: path,
      ok: true,
      status: 200,
      statusText: 'OK',
      body: envelope
    }, envelope.message || 'Operation failed');
  }
  return envelope.data as T;
}

/**
 * Unwrap API envelope from generated client responses.
 * Generated services return { success, message, data } — this extracts `data`.
 */
export const unwrap = <T>(response: any): T => {
  if (response && typeof response === 'object') {
    if ('success' in response && 'data' in response) {
      if (!response.success) {
        throw new Error(response.message || 'Operation failed');
      }
      return response.data as T;
    }
  }
  return response as T;
};

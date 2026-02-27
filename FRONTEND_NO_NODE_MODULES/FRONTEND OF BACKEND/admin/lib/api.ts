import type { AuthSession } from '../types/auth'; // Keep types
export { ApiError } from './client/core/ApiError'; // Export generated ApiError
export { OpenAPI } from './client/core/OpenAPI';
import { OpenAPI } from './client/core/OpenAPI';

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

export async function apiRequest<T>(path: string, options: RequestInit = {}, session?: AuthSession | null): Promise<T> {
  if (session) setApiSession(session);

  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  const method = (options.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Auth Headers — skip for public auth routes (forgot/reset password)
  const isPublic = isPublicAuthPath(path);

  if (!isPublic) {
    const token = session?.accessToken || (OpenAPI.TOKEN as string);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const companyCode = session?.companyCode || (OpenAPI.HEADERS as Record<string, string>)?.['X-Company-Id'];
    if (companyCode) {
      if (!headers.has('X-Company-Id')) headers.set('X-Company-Id', companyCode);
      if (!headers.has('X-Company-Code')) headers.set('X-Company-Code', companyCode);
    }
  }

  // Idempotency key for mutating requests — prevents accidental duplicate side-effects
  if (['POST', 'PUT', 'PATCH'].includes(method) && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', crypto.randomUUID());
  }

  try {
    const response = await fetch(`${OpenAPI.BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const body = await parseBody(response);

    if (!response.ok) {
      throw new ClientApiError({
        method: method as any,
        url: path,
      }, {
        url: path,
        ok: false,
        status: response.status,
        statusText: response.statusText,
        body: body,
      }, extractApiErrorMessage(body, `Request failed (${response.status})`));
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

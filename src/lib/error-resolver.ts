/**
 * Centralized error resolver
 *
 * Maps backend error codes to user-friendly messages.
 *
 * Error code categories:
 *  AUTH_*  — Authentication / authorisation errors
 *  VAL_*   — Validation errors (field-level)
 *  BUS_*   — Business logic errors
 *  CONC_*  — Concurrency / optimistic-lock errors
 *  SYS_*   — System / infrastructure errors
 *  DATA_*  — Data integrity errors
 */

import { isApiError, getErrorCode, getRawErrorMessage } from './api';

// ─────────────────────────────────────────────────────────────────────────────
// MFA redirect trigger marker
// ─────────────────────────────────────────────────────────────────────────────

/** Sentinel value returned from resolveError when an MFA redirect is required. */
export const MFA_REDIRECT = '__MFA_REDIRECT__' as const;
export type MfaRedirectSentinel = typeof MFA_REDIRECT;

// ─────────────────────────────────────────────────────────────────────────────
// Error code → message map
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_CODE_MAP: Record<string, string | MfaRedirectSentinel> = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  /** Invalid credentials (wrong email or password) */
  AUTH_001: 'Invalid email or password',
  /** Refresh token expired or invalid — session must be re-established */
  AUTH_003: 'Session expired, please sign in again',
  /** Insufficient permissions for the requested resource */
  AUTH_004: 'You do not have access to this resource',
  /** Account locked due to too many failed attempts */
  AUTH_005: 'Account locked, please contact your administrator',
  /** Account deactivated by an administrator */
  AUTH_006: 'Account has been deactivated',
  /** MFA challenge required — trigger redirect to /mfa */
  AUTH_007: MFA_REDIRECT,
  /** Incorrect TOTP/OTP code submitted */
  AUTH_008: 'Invalid verification code',

  // ── Validation ──────────────────────────────────────────────────────────────
  /** Required field is missing */
  VAL_001: 'This field is required',
  /** Field value does not meet format requirements */
  VAL_002: 'Invalid format — please check the value you entered',
  /** Value is below the allowed minimum */
  VAL_003: 'Value is below the minimum allowed',
  /** Value exceeds the allowed maximum */
  VAL_004: 'Value exceeds the maximum allowed',
  /** Field length is out of allowed range */
  VAL_005: 'Input length is invalid',
  /** Enum value is not in the allowed set */
  VAL_006: 'Selected option is not valid',
  /** Date or time value is invalid */
  VAL_007: 'Invalid date or time value',

  // ── Business Logic ───────────────────────────────────────────────────────────
  /** Action not allowed in the entity's current state */
  BUS_001: 'Cannot perform this action in the current state',
  /** Duplicate entry — record already exists */
  BUS_002: 'This entry already exists',
  /** Referenced record not found */
  BUS_003: 'Record not found',
  /** Insufficient stock to fulfil the request */
  BUS_004: 'Insufficient stock',
  /** Approval required before this action can be taken */
  BUS_005: 'This action requires approval',
  /** Credit limit would be exceeded by this transaction */
  BUS_006: 'Credit limit exceeded',
  /** Period is closed and cannot be modified */
  BUS_007: 'This accounting period is closed',
  /** Journal entry is already reversed */
  BUS_008: 'This entry has already been reversed',
  /** Invalid account type for this operation */
  BUS_009: 'Invalid account type for this operation',
  /** Module not available on the current subscription plan */
  BUS_010: 'This module is not available for your plan',

  // ── Concurrency ─────────────────────────────────────────────────────────────
  /** Optimistic-lock failure — another user has modified the record */
  CONC_001: 'This record was modified by someone else — please refresh and try again',

  // ── System / Infrastructure ─────────────────────────────────────────────────
  /** Generic server error */
  SYS_001: 'Something went wrong, please try again',
  /** Database error */
  SYS_002: 'Something went wrong, please try again',
  /** External service unavailable */
  SYS_003: 'Something went wrong, please try again',
  /** Timeout */
  SYS_004: 'Something went wrong, please try again',
  /** Unexpected internal error */
  SYS_005: 'Something went wrong, please try again',

  // ── Data Integrity ───────────────────────────────────────────────────────────
  /** Referenced entity does not exist */
  DATA_001: 'Referenced record no longer exists',
  /** Foreign key constraint violation */
  DATA_002: 'This record is referenced by other data and cannot be removed',
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export type ResolvedError =
  | { type: 'message'; message: string }
  | { type: 'mfa_redirect' };

/**
 * Resolve an unknown error to a structured result.
 *
 * - If the error carries a known backend error code, returns the mapped message.
 * - If the code is AUTH_007, returns `{ type: 'mfa_redirect' }` so the caller
 *   can navigate to /mfa.
 * - Falls back to the raw API message or a generic "Something went wrong".
 *
 * @example
 * try {
 *   await login(credentials);
 * } catch (err) {
 *   const resolved = resolveError(err);
 *   if (resolved.type === 'mfa_redirect') {
 *     navigate('/mfa');
 *   } else {
 *     toast.error(resolved.message);
 *   }
 * }
 */
export function resolveError(error: unknown): ResolvedError {
  const code = getErrorCode(error);

  if (code) {
    const mapped = ERROR_CODE_MAP[code];
    if (mapped === MFA_REDIRECT) {
      return { type: 'mfa_redirect' };
    }
    if (mapped) {
      return { type: 'message', message: mapped };
    }
  }

  // Fall back to raw API message (still user-facing, better than nothing)
  if (isApiError(error)) {
    const raw = getRawErrorMessage(error);
    if (raw && raw !== 'An error occurred') {
      return { type: 'message', message: raw };
    }
  }

  if (error instanceof Error && error.message) {
    return { type: 'message', message: error.message };
  }

  return { type: 'message', message: 'Something went wrong, please try again' };
}

/**
 * Convenience helper — returns the resolved message string directly.
 * Returns `null` when AUTH_007 (MFA redirect) is detected so callers
 * can handle that case separately if needed.
 *
 * @example
 * const msg = getErrorMessage(err);
 * if (msg) toast.error(msg);
 */
export function getErrorMessage(error: unknown): string | null {
  const resolved = resolveError(error);
  if (resolved.type === 'mfa_redirect') return null;
  return resolved.message;
}

/**
 * Directly look up a backend error code.
 * Returns `undefined` when the code is not in the map.
 */
export function resolveErrorCode(code: string): string | MfaRedirectSentinel | undefined {
  return ERROR_CODE_MAP[code];
}

/**
 * Check if a given error code triggers an MFA redirect.
 */
export function isMfaRedirectCode(code: string): boolean {
  return ERROR_CODE_MAP[code] === MFA_REDIRECT;
}

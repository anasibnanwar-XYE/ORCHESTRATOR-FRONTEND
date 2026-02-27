/**
 * MFA API wrapper — single source of truth for multi-factor authentication endpoints.
 *
 * Wraps MfaControllerService (generated from OpenAPI spec) and re-exports
 * typed helpers consumed by ProfilePage.tsx.
 *
 * 3 endpoints covered:
 *   POST /api/v1/auth/mfa/setup      → setup()
 *   POST /api/v1/auth/mfa/activate   → activate()
 *   POST /api/v1/auth/mfa/disable    → disable()
 */

import { MfaControllerService } from './client/services/MfaControllerService';
import { unwrap } from './api';
import type { MfaSetupResponse } from './client/models/MfaSetupResponse';
import type { MfaStatusResponse } from './client/models/MfaStatusResponse';
import type { MfaActivateRequest } from './client/models/MfaActivateRequest';
import type { MfaDisableRequest } from './client/models/MfaDisableRequest';

// Re-export for convenience
export type { MfaSetupResponse, MfaStatusResponse, MfaActivateRequest, MfaDisableRequest };

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

/**
 * Begin MFA enrolment. Returns a QR URI and manual secret key.
 * Recovery codes may also be returned at this stage (backend-dependent).
 *
 * The caller should present the QR code and wait for the user to enter
 * a TOTP code before calling `activate()`.
 */
export const setup = async (): Promise<MfaSetupResponse> => {
  const raw = await MfaControllerService.setup();
  return unwrap<MfaSetupResponse>(raw);
};

// ---------------------------------------------------------------------------
// Activate
// ---------------------------------------------------------------------------

/**
 * Confirm MFA enrolment by verifying a TOTP code from the user's authenticator.
 * Only after this call succeeds should recovery codes be considered valid.
 */
export const activate = async (code: string): Promise<MfaStatusResponse> => {
  const raw = await MfaControllerService.activate({ code });
  return unwrap<MfaStatusResponse>(raw);
};

// ---------------------------------------------------------------------------
// Disable
// ---------------------------------------------------------------------------

/**
 * Turn off MFA for the current user. Requires either a valid TOTP code
 * or a recovery code for verification.
 */
export const disable = async (payload: MfaDisableRequest): Promise<MfaStatusResponse> => {
  const raw = await MfaControllerService.disable(payload);
  return unwrap<MfaStatusResponse>(raw);
};

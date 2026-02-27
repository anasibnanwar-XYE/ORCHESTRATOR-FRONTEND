import { apiData, apiRequest, setApiSession, unwrap } from './api';
import type { AuthSession } from '../types/auth'; // Keep this import

// Import Services
import { UserProfileControllerService } from './client/services/UserProfileControllerService';
import { AuthControllerService } from './client/services/AuthControllerService';

// Import Models
import type { UpdateProfileRequest as ApiUpdateProfileRequest } from './client/models/UpdateProfileRequest';
import type { ChangePasswordRequest as ApiChangePasswordRequest } from './client/models/ChangePasswordRequest';


// Helper for session
const withSession = (session?: AuthSession | null) => {
  if (session) setApiSession(session);
};


/**
 * ProfileResponse from /api/v1/auth/profile
 */
export interface ProfileResponse {
  email: string;
  displayName: string;
  preferredName?: string;
  jobTitle?: string;
  profilePictureUrl?: string;
  phoneSecondary?: string;
  secondaryEmail?: string;
  mfaEnabled: boolean;
  companies: string[];
  createdAt?: string;
  publicId?: string;
}

/**
 * UpdateProfileRequest for PUT /api/v1/auth/profile
 * Only non-sensitive fields can be updated (no primary email/password)
 */
export interface LocalUpdateProfileRequest {
  displayName?: string;
  preferredName?: string;
  jobTitle?: string;
  profilePictureUrl?: string;
  phoneSecondary?: string;
  secondaryEmail?: string;
}

/**
 * MeResponse from GET /api/v1/auth/me
 */
export interface MeResponse {
  email: string;
  displayName: string;
  companyId?: string;
  mfaEnabled: boolean;
  roles: string[];
  permissions: string[];
  mustChangePassword?: boolean;
}

/**
 * ChangePasswordRequest for POST /api/v1/auth/password/change
 */
export interface LocalChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type UpdateProfileRequest = LocalUpdateProfileRequest;
export type ChangePasswordRequest = LocalChangePasswordRequest;


/**
 * Get current user profile (read-only)
 * GET /api/v1/auth/me
 */
export const getCurrentUserProfile = async (session?: AuthSession | null): Promise<MeResponse> => {
  withSession(session);
  return unwrap<MeResponse>(await AuthControllerService.me());
}

/**
 * Get detailed profile information
 * GET /api/v1/auth/profile
 */
export const getProfile = async (session?: AuthSession | null): Promise<ProfileResponse> => {
  withSession(session);
  return unwrap<ProfileResponse>(await UserProfileControllerService.profile());
}

/**
 * Update user profile (non-sensitive fields only)
 * PUT /api/v1/auth/profile
 */
export const updateProfile = async (
  payload: LocalUpdateProfileRequest,
  session?: AuthSession | null
): Promise<ProfileResponse> => {
  withSession(session);
  return unwrap<ProfileResponse>(await UserProfileControllerService.update1(payload as ApiUpdateProfileRequest));
}

/**
 * Change user password
 * POST /api/v1/auth/password/change
 */
export const changePassword = async (
  payload: LocalChangePasswordRequest,
  session?: AuthSession | null
): Promise<{ message?: string }> => {
  withSession(session);
  // Generated service returns ApiResponseString (string message?)
  // We unwrap it.
  const res = unwrap<any>(await AuthControllerService.changePassword(payload as ApiChangePasswordRequest));
  return typeof res === 'string' ? { message: res } : res;
}

// logoutAllSessions removed - endpoint does not exist in backend

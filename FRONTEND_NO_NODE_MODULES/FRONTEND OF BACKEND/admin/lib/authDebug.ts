/**
 * Authentication Debug Utilities
 * 
 * Use these functions to debug admin API call failures.
 * They help verify token context, roles, and company assignments.
 */

import { apiData, apiRequest } from './api';
import type { AuthSession } from '../types/auth';
import type { MeResponse } from '../types/auth';

/**
 * Get current user profile from /api/v1/auth/me
 * This shows what the token actually contains
 */
export async function getCurrentUserProfile(session?: AuthSession | null): Promise<MeResponse> {
  return apiData<MeResponse>('/api/v1/auth/me', {}, session ?? undefined);
}

/**
 * Verify admin authentication context
 * Checks if user has ROLE_ADMIN and is assigned to the company
 */
export async function verifyAdminContext(
  session?: AuthSession | null,
  expectedCompanyCode: string = 'BBP'
): Promise<{
  isValid: boolean;
  hasAdminRole: boolean;
  hasCompanyAccess: boolean;
  companyId: string | null;
  roles: string[];
  companies?: string[];
  errors: string[];
}> {
  const errors: string[] = [];
  
  if (!session?.accessToken) {
    return {
      isValid: false,
      hasAdminRole: false,
      hasCompanyAccess: false,
      companyId: null,
      roles: [],
      errors: ['No access token found in session'],
    };
  }

  try {
    const profile = await getCurrentUserProfile(session);
    
    const roles = profile.roles ?? [];
    const hasAdminRole = roles.includes('ROLE_ADMIN') || roles.some(r => r.toLowerCase().includes('admin'));
    const companyId = profile.companyId ?? null;
    const hasCompanyAccess = companyId === expectedCompanyCode || companyId === session.companyCode;
    
    if (!hasAdminRole) {
      errors.push(`User does not have ROLE_ADMIN. Current roles: ${roles.join(', ') || 'none'}`);
    }
    
    if (!hasCompanyAccess) {
      errors.push(
        `User companyId (${companyId}) does not match expected (${expectedCompanyCode}). ` +
        `Session companyCode: ${session.companyCode}`
      );
    }
    
    if (!session.companyCode) {
      errors.push('Session does not have companyCode set');
    }
    
    if (session.companyCode && session.companyCode !== companyId) {
      errors.push(
        `Session companyCode (${session.companyCode}) does not match token companyId (${companyId})`
      );
    }

    return {
      isValid: hasAdminRole && hasCompanyAccess && errors.length === 0,
      hasAdminRole,
      hasCompanyAccess,
      companyId,
      roles,
      errors,
    };
  } catch (error) {
    return {
      isValid: false,
      hasAdminRole: false,
      hasCompanyAccess: false,
      companyId: null,
      roles: [],
      errors: [
        `Failed to verify admin context: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Log authentication context for debugging
 */
export async function logAuthContext(session?: AuthSession | null): Promise<void> {
  console.group('🔐 Authentication Context Debug');
  
  if (!session) {
    console.error('❌ No session found');
    console.groupEnd();
    return;
  }

  console.log('📋 Session:', {
    companyCode: session.companyCode,
    displayName: session.displayName,
    tokenType: session.tokenType,
    hasAccessToken: !!session.accessToken,
    accessTokenPreview: session.accessToken ? `${session.accessToken.substring(0, 20)}...` : 'none',
  });

  try {
    const profile = await getCurrentUserProfile(session);
    console.log('👤 User Profile (/api/v1/auth/me):', {
      email: profile.email,
      displayName: profile.displayName,
      companyId: profile.companyId,
      roles: profile.roles ?? [],
      permissions: profile.permissions ?? [],
      mfaEnabled: profile.mfaEnabled,
    });

    const verification = await verifyAdminContext(session);
    console.log('✅ Admin Context Verification:', verification);
    
    if (!verification.isValid) {
      console.error('❌ Admin context is invalid:');
      verification.errors.forEach(err => console.error(`  - ${err}`));
    } else {
      console.log('✅ Admin context is valid');
    }
  } catch (error) {
    console.error('❌ Failed to fetch user profile:', error);
  }
  
  console.groupEnd();
}









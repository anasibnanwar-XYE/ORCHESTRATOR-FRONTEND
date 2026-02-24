export interface LoginCredentials {
  email: string;
  password: string;
  companyCode: string;
  mfaCode?: string;
  recoveryCode?: string;
}

export interface AuthSession {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  companyCode: string;
  displayName: string;
  mustChangePassword?: boolean; // Flag indicating user must change password
}

export type AuthSuccess = AuthSession;

export interface AuthenticatedUser {
  email: string;
  displayName: string;
  companyCode: string;
  mfaEnabled: boolean;
  roles: string[];
  permissions: string[];
  expiresIn?: number;
  mustChangePassword?: boolean; // Flag indicating user must change password
}

export interface MeResponse {
  email: string;
  displayName: string;
  companyId: string;
  mfaEnabled: boolean;
  roles?: string[];
  permissions?: string[];
  companies?: string[]; // List of company codes the user has access to
  mustChangePassword?: boolean;
}

export interface PortalAccessState {
  superadmin: boolean;
  admin: boolean;
  accounting: boolean;
  factory: boolean;
  sales: boolean;
  dealer: boolean;
}

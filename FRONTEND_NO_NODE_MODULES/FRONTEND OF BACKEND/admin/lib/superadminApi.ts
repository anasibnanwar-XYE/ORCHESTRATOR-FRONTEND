import { setApiSession, unwrap } from './api';
import type { AuthSession } from '../types/auth';

// Re-export types used by Superadmin pages
export type { CompanyDto } from './client/models/CompanyDto';
export type { CompanyRequest } from './client/models/CompanyRequest';
export type { RoleDto } from './client/models/RoleDto';
export type { CreateRoleRequest } from './client/models/CreateRoleRequest';
export type { UserDto } from './client/models/UserDto';

// Import generated client services
import { CompanyControllerService } from './client/services/CompanyControllerService';
import { RoleControllerService } from './client/services/RoleControllerService';
import { AdminUserControllerService } from './client/services/AdminUserControllerService';

import type { CompanyRequest } from './client/models/CompanyRequest';
import type { CreateRoleRequest } from './client/models/CreateRoleRequest';

// --- Session helper ---
const withSession = (session?: AuthSession | null) => {
  if (session) setApiSession(session);
};

// ─── Tenant (Company) Governance ─────────────────────────────────────────────

export const listTenants = async (session?: AuthSession | null) => {
  withSession(session);
  return unwrap(await CompanyControllerService.list1());
};

export const createTenant = async (payload: CompanyRequest, session?: AuthSession | null) => {
  withSession(session);
  return unwrap(await CompanyControllerService.create1(payload));
};

export const updateTenant = async (id: number, payload: CompanyRequest, session?: AuthSession | null) => {
  withSession(session);
  return unwrap(await CompanyControllerService.update(id, payload));
};

export const deleteTenant = async (id: number, session?: AuthSession | null) => {
  withSession(session);
  return await CompanyControllerService.delete(id);
};

// ─── Platform Role Governance ────────────────────────────────────────────────

export const listPlatformRoles = async (session?: AuthSession | null) => {
  withSession(session);
  return unwrap(await RoleControllerService.listRoles());
};

export const createPlatformRole = async (payload: CreateRoleRequest, session?: AuthSession | null) => {
  withSession(session);
  return unwrap(await RoleControllerService.createRole(payload));
};

export const getPlatformRoleByKey = async (roleKey: string, session?: AuthSession | null) => {
  withSession(session);
  return unwrap(await RoleControllerService.getRoleByKey(roleKey));
};

// ─── Platform User Overview (read-only governance) ───────────────────────────

export const listPlatformUsers = async (session?: AuthSession | null) => {
  withSession(session);
  return unwrap(await AdminUserControllerService.list2());
};

import type { AuthenticatedUser, PortalAccessState } from './auth';

export const PORTAL_ROLES = {
  SUPERADMIN: 'ROLE_SUPERADMIN',
  ADMIN: 'ROLE_ADMIN',
  ACCOUNTING: 'ROLE_ACCOUNTING',
  FACTORY: 'ROLE_FACTORY',
  SALES: 'ROLE_SALES',
  DEALER: 'ROLE_DEALER',
} as const;

export type PortalRole = typeof PORTAL_ROLES[keyof typeof PORTAL_ROLES];

export interface PortalRoleOption {
  name: PortalRole;
  label: string;
  description: string;
}

export const CORE_PORTAL_ROLE_OPTIONS: PortalRoleOption[] = [
  {
    name: PORTAL_ROLES.SUPERADMIN,
    label: 'Superadmin',
    description: 'Platform control-plane: tenant lifecycle, policy, and audit.',
  },
  {
    name: PORTAL_ROLES.ADMIN,
    label: 'Admin',
    description: 'Full console access with org-wide controls.',
  },
  {
    name: PORTAL_ROLES.ACCOUNTING,
    label: 'Accounting',
    description: 'Journals, ledgers, dealers, and AP/AR.',
  },
  {
    name: PORTAL_ROLES.FACTORY,
    label: 'Factory',
    description: 'Production plans, batches, QA, and inventory.',
  },
  {
    name: PORTAL_ROLES.SALES,
    label: 'Sales',
    description: 'Sales desk, dealer ops, promos, and orders.',
  },
  {
    name: PORTAL_ROLES.DEALER,
    label: 'Dealer',
    description: 'Dealer self-service portal (external).',
  },
];

const hasRole = (user: AuthenticatedUser | null, role: PortalRole): boolean =>
  Boolean(user?.roles?.includes(role));

export const resolvePortalAccess = (user: AuthenticatedUser | null): PortalAccessState => {
  // Superadmin is an isolated control-plane for the platform team.
  // It NEVER cascades into tenant portals and tenant admins cannot see it.
  const superadmin = hasRole(user, PORTAL_ROLES.SUPERADMIN);
  const admin = hasRole(user, PORTAL_ROLES.ADMIN);
  const accounting = admin || hasRole(user, PORTAL_ROLES.ACCOUNTING);
  const factory = admin || hasRole(user, PORTAL_ROLES.FACTORY);
  const sales = admin || hasRole(user, PORTAL_ROLES.SALES);
  const dealer = hasRole(user, PORTAL_ROLES.DEALER);
  return { superadmin, admin, accounting, factory, sales, dealer };
};

export const userHasPortalRole = (user: AuthenticatedUser | null, role: PortalRole): boolean =>
  hasRole(user, role);

/**
 * Check if user has multiple portal roles or is admin
 * Only users with multiple roles or admin should see portal selection
 */
export const shouldShowPortalSelection = (portalAccess: PortalAccessState): boolean => {
  // Superadmin is isolated — if the user ONLY has superadmin, go straight to /superadmin
  // If they also have tenant roles, show the hub so they can choose
  if (portalAccess.superadmin) {
    const tenantPortals = [
      portalAccess.admin,
      portalAccess.accounting,
      portalAccess.factory,
      portalAccess.sales,
      portalAccess.dealer,
    ].filter(Boolean).length;
    return tenantPortals > 0; // show hub only if they also have tenant access
  }

  // Admin always sees portal selection
  if (portalAccess.admin) return true;
  
  // Count enabled portals (excluding admin)
  const enabledPortals = [
    portalAccess.accounting,
    portalAccess.factory,
    portalAccess.sales,
    portalAccess.dealer,
  ].filter(Boolean).length;
  
  // Show portal selection only if user has 2+ portal roles
  return enabledPortals >= 2;
};

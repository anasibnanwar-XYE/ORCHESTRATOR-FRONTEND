/**
 * portal-routing.ts
 *
 * Determines which portals a user can access based on their role,
 * and whether they should see the portal hub (multi-portal picker)
 * or navigate directly to their single portal.
 *
 * Role access matrix:
 *  ROLE_SUPER_ADMIN  → superadmin portal only (fully isolated)
 *  ROLE_ADMIN        → admin + accounting + sales + factory (shows hub)
 *  ROLE_ACCOUNTING   → accounting only
 *  ROLE_FACTORY      → factory only
 *  ROLE_SALES        → sales only
 *  ROLE_DEALER       → dealer only
 *
 * Module gating:
 *  Each portal may have sub-modules that can be disabled per company.
 *  MODULE_KEYS defines the canonical module identifiers.
 *  isModuleEnabled() checks whether a module is active for the current session.
 *  An empty enabledModules list (or undefined) means ALL modules are enabled.
 */

import type { User } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Module key constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical module identifiers used in nav item definitions and route guards.
 * When a module key appears here, nav items tagged with that key can be
 * hidden from the sidebar and their routes can show ModuleNotAvailablePage.
 */
export const MODULE_KEYS = {
  /** HR — employee management within the Accounting portal */
  HR: 'hr',
  /** Payroll — payroll runs within the Accounting portal */
  PAYROLL: 'payroll',
  /** Production — plans, logs, and batches within the Factory portal */
  PRODUCTION: 'production',
  /** Packing — packing queue and history within the Factory portal */
  PACKING: 'packing',
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];

/**
 * Returns true when the given module is enabled for the session.
 *
 * Rules:
 *  - If enabledModules is empty (or undefined), ALL modules are enabled.
 *  - If enabledModules is non-empty, only listed modules are enabled.
 */
export function isModuleEnabled(
  enabledModules: string[] | undefined,
  moduleKey: string
): boolean {
  if (!enabledModules || enabledModules.length === 0) return true;
  return enabledModules.includes(moduleKey);
}

/**
 * Given the current pathname and a map of path prefixes → module keys,
 * returns the module key for the current path, or null if not gated.
 */
export function getModuleForPath(
  pathname: string,
  moduleRoutes: Record<string, string>
): string | null {
  for (const [prefix, moduleKey] of Object.entries(moduleRoutes)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return moduleKey;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Role constants
// ─────────────────────────────────────────────────────────────────────────────

export const PORTAL_ROLES = {
  SUPERADMIN: 'ROLE_SUPER_ADMIN',
  ADMIN: 'ROLE_ADMIN',
  ACCOUNTING: 'ROLE_ACCOUNTING',
  FACTORY: 'ROLE_FACTORY',
  SALES: 'ROLE_SALES',
  DEALER: 'ROLE_DEALER',
} as const;

export type PortalRoleKey = keyof typeof PORTAL_ROLES;
export type PortalRole = (typeof PORTAL_ROLES)[PortalRoleKey];

// ─────────────────────────────────────────────────────────────────────────────
// Portal access state
// ─────────────────────────────────────────────────────────────────────────────

export interface PortalAccessState {
  superadmin: boolean;
  admin: boolean;
  accounting: boolean;
  factory: boolean;
  sales: boolean;
  dealer: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Portal descriptors (for the hub page)
// ─────────────────────────────────────────────────────────────────────────────

export interface PortalDescriptor {
  key: keyof PortalAccessState;
  label: string;
  description: string;
  path: string;
  iconName: string;
}

export const PORTAL_DESCRIPTORS: PortalDescriptor[] = [
  {
    key: 'admin',
    label: 'Admin',
    description: 'Organisation controls, user management, and approvals.',
    path: '/admin',
    iconName: 'LayoutGrid',
  },
  {
    key: 'accounting',
    label: 'Accounting',
    description: 'Journals, ledgers, invoicing, and financial reporting.',
    path: '/accounting',
    iconName: 'BookOpen',
  },
  {
    key: 'sales',
    label: 'Sales',
    description: 'Orders, dealers, credit management, and dispatch.',
    path: '/sales',
    iconName: 'TrendingUp',
  },
  {
    key: 'factory',
    label: 'Factory',
    description: 'Production plans, packing, and inventory management.',
    path: '/factory',
    iconName: 'Factory',
  },
  {
    key: 'dealer',
    label: 'Dealer',
    description: 'Self-service: orders, invoices, ledger, and credit.',
    path: '/dealer',
    iconName: 'Store',
  },
  {
    key: 'superadmin',
    label: 'Platform',
    description: 'Tenant lifecycle, platform roles, and governance.',
    path: '/superadmin',
    iconName: 'Shield',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Core functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive which portals the user can access from their single role string.
 * ROLE_ADMIN inherits admin + accounting + sales + factory access.
 */
export function resolvePortalAccess(user: User | null): PortalAccessState {
  const role = user?.role ?? '';

  const isSuperadmin = role === PORTAL_ROLES.SUPERADMIN;
  const isAdmin = role === PORTAL_ROLES.ADMIN;

  return {
    superadmin: isSuperadmin,
    admin: isAdmin,
    // Admin inherits these three portals as well
    accounting: isAdmin || role === PORTAL_ROLES.ACCOUNTING,
    factory: isAdmin || role === PORTAL_ROLES.FACTORY,
    sales: isAdmin || role === PORTAL_ROLES.SALES,
    dealer: role === PORTAL_ROLES.DEALER,
  };
}

/**
 * Returns true when the user has access to more than one portal,
 * meaning they should land on the portal hub instead of a direct portal.
 *
 * Superadmin is always isolated — they never see the hub.
 * Admin has 4 portals (admin + accounting + sales + factory) and always sees the hub.
 * All other roles have exactly one portal and go directly.
 */
export function shouldShowHub(access: PortalAccessState): boolean {
  // Superadmin is isolated — no hub
  if (access.superadmin) return false;

  // Count the accessible tenant portals
  const count = [
    access.admin,
    access.accounting,
    access.factory,
    access.sales,
    access.dealer,
  ].filter(Boolean).length;

  return count > 1;
}

/**
 * Returns the default route for a user who has only one portal.
 * Used after login to redirect single-portal users directly.
 * Multi-portal users land on /hub; call shouldShowHub() first.
 */
export function getDefaultPortalPath(access: PortalAccessState): string {
  if (access.superadmin) return '/superadmin';
  if (access.admin) return '/hub'; // Admin sees hub (multi-portal)
  if (access.accounting) return '/accounting';
  if (access.factory) return '/factory';
  if (access.sales) return '/sales';
  if (access.dealer) return '/dealer';
  return '/hub';
}

/**
 * Returns the accessible portal descriptors for the hub page,
 * in the canonical display order.
 */
export function getAccessiblePortals(access: PortalAccessState): PortalDescriptor[] {
  return PORTAL_DESCRIPTORS.filter((d) => access[d.key]);
}

/**
 * Checks whether a user can access a given portal path prefix.
 * Used by route guards to block unauthorised navigation.
 */
export function canAccessPortal(access: PortalAccessState, pathPrefix: string): boolean {
  switch (pathPrefix) {
    case '/superadmin':
      return access.superadmin;
    case '/admin':
      return access.admin;
    case '/accounting':
      return access.accounting;
    case '/factory':
      return access.factory;
    case '/sales':
      return access.sales;
    case '/dealer':
      return access.dealer;
    default:
      return false;
  }
}

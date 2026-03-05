/**
 * Tests for portal-routing.ts
 *
 * Covers: resolvePortalAccess, shouldShowHub, getDefaultPortalPath,
 *         getAccessiblePortals, canAccessPortal
 */

import { describe, it, expect } from 'vitest';
import {
  resolvePortalAccess,
  shouldShowHub,
  getDefaultPortalPath,
  getAccessiblePortals,
  canAccessPortal,
  isModuleEnabled,
  getModuleForPath,
  MODULE_KEYS,
  PORTAL_ROLES,
} from '../portal-routing';
import type { User } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeUser(role: string): User {
  return {
    email: 'test@example.com',
    displayName: 'Test User',
    roles: [role],
    permissions: [],
    mfaEnabled: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// resolvePortalAccess
// ─────────────────────────────────────────────────────────────────────────────

describe('resolvePortalAccess', () => {
  it('returns all-false for null user', () => {
    const access = resolvePortalAccess(null);
    expect(access).toEqual({
      superadmin: false,
      admin: false,
      accounting: false,
      factory: false,
      sales: false,
      dealer: false,
    });
  });

  it('ROLE_SUPER_ADMIN → superadmin only', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.SUPERADMIN));
    expect(access.superadmin).toBe(true);
    expect(access.admin).toBe(false);
    expect(access.accounting).toBe(false);
    expect(access.factory).toBe(false);
    expect(access.sales).toBe(false);
    expect(access.dealer).toBe(false);
  });

  it('ROLE_ADMIN → admin + accounting + factory + sales', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.ADMIN));
    expect(access.superadmin).toBe(false);
    expect(access.admin).toBe(true);
    expect(access.accounting).toBe(true);
    expect(access.factory).toBe(true);
    expect(access.sales).toBe(true);
    expect(access.dealer).toBe(false);
  });

  it('ROLE_ACCOUNTING → accounting only', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.ACCOUNTING));
    expect(access.accounting).toBe(true);
    expect(access.admin).toBe(false);
    expect(access.factory).toBe(false);
    expect(access.sales).toBe(false);
  });

  it('ROLE_FACTORY → factory only', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.FACTORY));
    expect(access.factory).toBe(true);
    expect(access.admin).toBe(false);
    expect(access.accounting).toBe(false);
    expect(access.sales).toBe(false);
  });

  it('ROLE_SALES → sales only', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.SALES));
    expect(access.sales).toBe(true);
    expect(access.admin).toBe(false);
    expect(access.accounting).toBe(false);
    expect(access.factory).toBe(false);
  });

  it('ROLE_DEALER → dealer only', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.DEALER));
    expect(access.dealer).toBe(true);
    expect(access.admin).toBe(false);
    expect(access.accounting).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// shouldShowHub
// ─────────────────────────────────────────────────────────────────────────────

describe('shouldShowHub', () => {
  it('returns false for null user (no portals)', () => {
    expect(shouldShowHub(resolvePortalAccess(null))).toBe(false);
  });

  it('returns false for ROLE_SUPER_ADMIN (isolated)', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.SUPERADMIN));
    expect(shouldShowHub(access)).toBe(false);
  });

  it('returns true for ROLE_ADMIN (4 portals)', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.ADMIN));
    expect(shouldShowHub(access)).toBe(true);
  });

  it('returns false for ROLE_ACCOUNTING (1 portal)', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.ACCOUNTING));
    expect(shouldShowHub(access)).toBe(false);
  });

  it('returns false for ROLE_FACTORY (1 portal)', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.FACTORY));
    expect(shouldShowHub(access)).toBe(false);
  });

  it('returns false for ROLE_SALES (1 portal)', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.SALES));
    expect(shouldShowHub(access)).toBe(false);
  });

  it('returns false for ROLE_DEALER (1 portal)', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.DEALER));
    expect(shouldShowHub(access)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDefaultPortalPath
// ─────────────────────────────────────────────────────────────────────────────

describe('getDefaultPortalPath', () => {
  it('ROLE_SUPER_ADMIN → /superadmin', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.SUPERADMIN));
    expect(getDefaultPortalPath(access)).toBe('/superadmin');
  });

  it('ROLE_ADMIN → /hub (multi-portal)', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.ADMIN));
    expect(getDefaultPortalPath(access)).toBe('/hub');
  });

  it('ROLE_ACCOUNTING → /accounting', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.ACCOUNTING));
    expect(getDefaultPortalPath(access)).toBe('/accounting');
  });

  it('ROLE_FACTORY → /factory', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.FACTORY));
    expect(getDefaultPortalPath(access)).toBe('/factory');
  });

  it('ROLE_SALES → /sales', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.SALES));
    expect(getDefaultPortalPath(access)).toBe('/sales');
  });

  it('ROLE_DEALER → /dealer', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.DEALER));
    expect(getDefaultPortalPath(access)).toBe('/dealer');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAccessiblePortals
// ─────────────────────────────────────────────────────────────────────────────

describe('getAccessiblePortals', () => {
  it('returns empty array for null user', () => {
    const portals = getAccessiblePortals(resolvePortalAccess(null));
    expect(portals).toHaveLength(0);
  });

  it('returns only superadmin portal for ROLE_SUPER_ADMIN', () => {
    const portals = getAccessiblePortals(resolvePortalAccess(makeUser(PORTAL_ROLES.SUPERADMIN)));
    expect(portals).toHaveLength(1);
    expect(portals[0].key).toBe('superadmin');
  });

  it('returns 4 portals for ROLE_ADMIN (admin, accounting, sales, factory)', () => {
    const portals = getAccessiblePortals(resolvePortalAccess(makeUser(PORTAL_ROLES.ADMIN)));
    const keys = portals.map((p) => p.key);
    expect(keys).toContain('admin');
    expect(keys).toContain('accounting');
    expect(keys).toContain('sales');
    expect(keys).toContain('factory');
    expect(keys).not.toContain('dealer');
    expect(keys).not.toContain('superadmin');
  });

  it('returns 1 portal for ROLE_ACCOUNTING', () => {
    const portals = getAccessiblePortals(resolvePortalAccess(makeUser(PORTAL_ROLES.ACCOUNTING)));
    expect(portals).toHaveLength(1);
    expect(portals[0].key).toBe('accounting');
  });

  it('returns 1 portal for ROLE_DEALER', () => {
    const portals = getAccessiblePortals(resolvePortalAccess(makeUser(PORTAL_ROLES.DEALER)));
    expect(portals).toHaveLength(1);
    expect(portals[0].key).toBe('dealer');
  });

  it('each portal has label, description, and path', () => {
    const portals = getAccessiblePortals(resolvePortalAccess(makeUser(PORTAL_ROLES.ADMIN)));
    for (const portal of portals) {
      expect(portal.label).toBeTruthy();
      expect(portal.description).toBeTruthy();
      expect(portal.path).toMatch(/^\//);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// canAccessPortal
// ─────────────────────────────────────────────────────────────────────────────

describe('canAccessPortal', () => {
  describe('ROLE_SUPER_ADMIN', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.SUPERADMIN));

    it('can access /superadmin', () => {
      expect(canAccessPortal(access, '/superadmin')).toBe(true);
    });

    it('cannot access /admin', () => {
      expect(canAccessPortal(access, '/admin')).toBe(false);
    });

    it('cannot access /accounting', () => {
      expect(canAccessPortal(access, '/accounting')).toBe(false);
    });
  });

  describe('ROLE_ADMIN', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.ADMIN));

    it('can access /admin', () => {
      expect(canAccessPortal(access, '/admin')).toBe(true);
    });

    it('can access /accounting', () => {
      expect(canAccessPortal(access, '/accounting')).toBe(true);
    });

    it('can access /factory', () => {
      expect(canAccessPortal(access, '/factory')).toBe(true);
    });

    it('can access /sales', () => {
      expect(canAccessPortal(access, '/sales')).toBe(true);
    });

    it('cannot access /superadmin', () => {
      expect(canAccessPortal(access, '/superadmin')).toBe(false);
    });

    it('cannot access /dealer', () => {
      expect(canAccessPortal(access, '/dealer')).toBe(false);
    });
  });

  describe('ROLE_DEALER', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.DEALER));

    it('can access /dealer', () => {
      expect(canAccessPortal(access, '/dealer')).toBe(true);
    });

    it('cannot access /admin', () => {
      expect(canAccessPortal(access, '/admin')).toBe(false);
    });

    it('cannot access /superadmin', () => {
      expect(canAccessPortal(access, '/superadmin')).toBe(false);
    });
  });

  it('returns false for unknown path prefix', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.ADMIN));
    expect(canAccessPortal(access, '/unknown')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Superadmin isolation (VAL-SHELL-003)
// ─────────────────────────────────────────────────────────────────────────────

describe('Superadmin isolation (VAL-SHELL-003)', () => {
  it('superadmin cannot access any non-superadmin portal path', () => {
    const access = resolvePortalAccess(makeUser(PORTAL_ROLES.SUPERADMIN));
    const blockedPaths = ['/admin', '/accounting', '/factory', '/sales', '/dealer'];
    for (const path of blockedPaths) {
      expect(canAccessPortal(access, path)).toBe(false);
    }
  });

  it('non-superadmin cannot access /superadmin', () => {
    const roles = [
      PORTAL_ROLES.ADMIN,
      PORTAL_ROLES.ACCOUNTING,
      PORTAL_ROLES.FACTORY,
      PORTAL_ROLES.SALES,
      PORTAL_ROLES.DEALER,
    ];
    for (const role of roles) {
      const access = resolvePortalAccess(makeUser(role));
      expect(canAccessPortal(access, '/superadmin')).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isModuleEnabled (VAL-SHELL-007, VAL-SHELL-008)
// ─────────────────────────────────────────────────────────────────────────────

describe('isModuleEnabled', () => {
  it('returns true when enabledModules is undefined (all modules enabled)', () => {
    expect(isModuleEnabled(undefined, MODULE_KEYS.HR)).toBe(true);
    expect(isModuleEnabled(undefined, MODULE_KEYS.PAYROLL)).toBe(true);
    expect(isModuleEnabled(undefined, MODULE_KEYS.PRODUCTION)).toBe(true);
    expect(isModuleEnabled(undefined, MODULE_KEYS.PACKING)).toBe(true);
  });

  it('returns true when enabledModules is empty (all modules enabled by default)', () => {
    expect(isModuleEnabled([], MODULE_KEYS.HR)).toBe(true);
    expect(isModuleEnabled([], MODULE_KEYS.PAYROLL)).toBe(true);
    expect(isModuleEnabled([], MODULE_KEYS.PRODUCTION)).toBe(true);
    expect(isModuleEnabled([], MODULE_KEYS.PACKING)).toBe(true);
  });

  it('returns true when the module is in the enabled list', () => {
    const enabledModules = [MODULE_KEYS.HR, MODULE_KEYS.PAYROLL];
    expect(isModuleEnabled(enabledModules, MODULE_KEYS.HR)).toBe(true);
    expect(isModuleEnabled(enabledModules, MODULE_KEYS.PAYROLL)).toBe(true);
  });

  it('returns false when the module is NOT in a non-empty enabled list', () => {
    const enabledModules = [MODULE_KEYS.HR];
    expect(isModuleEnabled(enabledModules, MODULE_KEYS.PAYROLL)).toBe(false);
    expect(isModuleEnabled(enabledModules, MODULE_KEYS.PRODUCTION)).toBe(false);
    expect(isModuleEnabled(enabledModules, MODULE_KEYS.PACKING)).toBe(false);
  });

  it('returns false for unknown module key when list is non-empty', () => {
    const enabledModules = [MODULE_KEYS.HR];
    expect(isModuleEnabled(enabledModules, 'unknown_module')).toBe(false);
  });

  it('is case-sensitive in module key matching', () => {
    const enabledModules = [MODULE_KEYS.HR]; // 'hr'
    expect(isModuleEnabled(enabledModules, 'HR')).toBe(false);
    expect(isModuleEnabled(enabledModules, 'hr')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getModuleForPath (VAL-SHELL-008)
// ─────────────────────────────────────────────────────────────────────────────

describe('getModuleForPath', () => {
  const MODULE_ROUTES: Record<string, string> = {
    '/accounting/employees': MODULE_KEYS.HR,
    '/accounting/payroll': MODULE_KEYS.PAYROLL,
    '/factory/production': MODULE_KEYS.PRODUCTION,
    '/factory/packing': MODULE_KEYS.PACKING,
  };

  it('returns null for paths not in the module routes map', () => {
    expect(getModuleForPath('/accounting', MODULE_ROUTES)).toBeNull();
    expect(getModuleForPath('/accounting/journal', MODULE_ROUTES)).toBeNull();
    expect(getModuleForPath('/factory', MODULE_ROUTES)).toBeNull();
    expect(getModuleForPath('/factory/dispatch', MODULE_ROUTES)).toBeNull();
    expect(getModuleForPath('/unrelated', MODULE_ROUTES)).toBeNull();
  });

  it('returns the module key for an exact path match', () => {
    expect(getModuleForPath('/accounting/employees', MODULE_ROUTES)).toBe(MODULE_KEYS.HR);
    expect(getModuleForPath('/accounting/payroll', MODULE_ROUTES)).toBe(MODULE_KEYS.PAYROLL);
    expect(getModuleForPath('/factory/production', MODULE_ROUTES)).toBe(MODULE_KEYS.PRODUCTION);
    expect(getModuleForPath('/factory/packing', MODULE_ROUTES)).toBe(MODULE_KEYS.PACKING);
  });

  it('returns the module key for a sub-path starting with the prefix', () => {
    expect(getModuleForPath('/accounting/employees/123', MODULE_ROUTES)).toBe(MODULE_KEYS.HR);
    expect(getModuleForPath('/accounting/payroll/runs', MODULE_ROUTES)).toBe(MODULE_KEYS.PAYROLL);
    expect(getModuleForPath('/factory/production/plans', MODULE_ROUTES)).toBe(MODULE_KEYS.PRODUCTION);
    expect(getModuleForPath('/factory/production/plans/new', MODULE_ROUTES)).toBe(MODULE_KEYS.PRODUCTION);
    expect(getModuleForPath('/factory/packing/history', MODULE_ROUTES)).toBe(MODULE_KEYS.PACKING);
  });

  it('does NOT match a partial segment (prefix must be followed by / or be exact)', () => {
    // '/factory/packingextra' should NOT match '/factory/packing'
    expect(getModuleForPath('/factory/packingextra', MODULE_ROUTES)).toBeNull();
    expect(getModuleForPath('/accounting/employeesmore', MODULE_ROUTES)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE_KEYS constants
// ─────────────────────────────────────────────────────────────────────────────

describe('MODULE_KEYS', () => {
  it('exports the expected module key values', () => {
    expect(MODULE_KEYS.HR).toBe('hr');
    expect(MODULE_KEYS.PAYROLL).toBe('payroll');
    expect(MODULE_KEYS.PRODUCTION).toBe('production');
    expect(MODULE_KEYS.PACKING).toBe('packing');
  });
});

/**
 * App — root routing and auth shell.
 *
 * Routes:
 *  /login               → LoginPage (public)
 *  /mfa                 → MfaPage (public, requires tempToken state)
 *  /change-password     → FirstPasswordChangePage (requires session with mustChangePassword)
 *  /forgot-password     → ForgotPasswordPage (public)
 *  /reset-password      → ResetPasswordPage (public, requires ?token=)
 *  /profile             → ProfilePage (requires full authentication)
 *  /hub                 → PortalHubPage (multi-portal users)
 *  /admin/*             → AdminLayout (lazy)
 *  /accounting/*        → AccountingLayout (lazy)
 *  /sales/*             → SalesLayout (lazy)
 *  /factory/*           → FactoryLayout (lazy)
 *  /dealer/*            → DealerLayout (lazy)
 *  /superadmin/*        → SuperadminLayout (lazy, isolated)
 *  /                    → Redirect based on user role
 *
 * Gate logic:
 *  - If isLoading: show WelcomeLoader splash
 *  - If mustChangePassword: gate all routes to /change-password
 *  - If !isAuthenticated on protected route: redirect to /login
 *  - If superadmin: block access to non-superadmin portals
 *  - If not superadmin: block access to /superadmin/*
 */

import { type ReactNode, Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { WelcomeLoader, PageLoader } from '@/components/ui/Loader';
import { LoginPage } from '@/pages/auth/LoginPage';
import { MfaPage } from '@/pages/auth/MfaPage';
import { FirstPasswordChangePage } from '@/pages/auth/FirstPasswordChangePage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ProfilePage } from '@/pages/auth/ProfilePage';
import { PortalHubPage } from '@/pages/hub/PortalHubPage';
import { useTheme } from '@/hooks/useTheme';
import { CommandPaletteProvider } from '@/components/CommandPalette';
import {
  resolvePortalAccess,
  shouldShowHub,
  getDefaultPortalPath,
  canAccessPortal,
} from '@/lib/portal-routing';

// ─────────────────────────────────────────────────────────────────────────────
// Lazy-loaded portal layouts (code splitting per portal chunk)
// ─────────────────────────────────────────────────────────────────────────────

const AdminLayout = lazy(() =>
  import('@/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AccountingLayout = lazy(() =>
  import('@/layouts/AccountingLayout').then((m) => ({ default: m.AccountingLayout }))
);
const SalesLayout = lazy(() =>
  import('@/layouts/SalesLayout').then((m) => ({ default: m.SalesLayout }))
);
const FactoryLayout = lazy(() =>
  import('@/layouts/FactoryLayout').then((m) => ({ default: m.FactoryLayout }))
);
const DealerLayout = lazy(() =>
  import('@/layouts/DealerLayout').then((m) => ({ default: m.DealerLayout }))
);
const SuperadminLayout = lazy(() =>
  import('@/layouts/SuperadminLayout').then((m) => ({ default: m.SuperadminLayout }))
);

// ─────────────────────────────────────────────────────────────────────────────
// Lazy-loaded portal pages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal placeholder rendered inside each portal while the
 * actual pages are built in subsequent milestones.
 */
/** Accounting portal — Dashboard */
const AccountingDashboard = lazy(() =>
  import('@/pages/accounting/AccountingDashboardPage').then((m) => ({
    default: m.AccountingDashboardPage,
  }))
);
/** Accounting portal — Chart of Accounts */
const ChartOfAccountsPage = lazy(() =>
  import('@/pages/accounting/ChartOfAccountsPage').then((m) => ({
    default: m.ChartOfAccountsPage,
  }))
);
/** Accounting portal — Journal Entries */
const JournalsPage = lazy(() =>
  import('@/pages/accounting/JournalsPage').then((m) => ({
    default: m.JournalsPage,
  }))
);
/** Accounting portal — Journal Detail */
const JournalDetailPage = lazy(() =>
  import('@/pages/accounting/JournalDetailPage').then((m) => ({
    default: m.JournalDetailPage,
  }))
);
/** Accounting portal — Accounting Periods */
const AccountingPeriodsPage = lazy(() =>
  import('@/pages/accounting/AccountingPeriodsPage').then((m) => ({
    default: m.AccountingPeriodsPage,
  }))
);
/** Accounting portal — Default Accounts */
const DefaultAccountsPage = lazy(() =>
  import('@/pages/accounting/DefaultAccountsPage').then((m) => ({
    default: m.DefaultAccountsPage,
  }))
);
/** Accounting portal — Settlements */
const SettlementsPage = lazy(() =>
  import('@/pages/accounting/SettlementsPage').then((m) => ({
    default: m.SettlementsPage,
  }))
);

 /** Accounting portal — Invoices */
 const InvoicesPage = lazy(() =>
   import('@/pages/accounting/InvoicesPage').then((m) => ({
     default: m.InvoicesPage,
   }))
 );
 /** Accounting portal — Invoice Detail */
 const InvoiceDetailPage = lazy(() =>
   import('@/pages/accounting/InvoiceDetailPage').then((m) => ({
     default: m.InvoiceDetailPage,
   }))
 );
 /** Accounting portal — Trial Balance */
 const TrialBalancePage = lazy(() =>
   import('@/pages/accounting/reports/TrialBalancePage').then((m) => ({
     default: m.TrialBalancePage,
   }))
 );
 /** Accounting portal — P&L */
 const ProfitLossPage = lazy(() =>
   import('@/pages/accounting/reports/ProfitLossPage').then((m) => ({
     default: m.ProfitLossPage,
   }))
 );
 /** Accounting portal — Balance Sheet */
 const BalanceSheetPage = lazy(() =>
   import('@/pages/accounting/reports/BalanceSheetPage').then((m) => ({
     default: m.BalanceSheetPage,
   }))
 );
 /** Accounting portal — Cash Flow */
 const CashFlowPage = lazy(() =>
   import('@/pages/accounting/reports/CashFlowPage').then((m) => ({
     default: m.CashFlowPage,
   }))
 );
 /** Accounting portal — Aged Debtors */
 const AgedDebtorsPage = lazy(() =>
   import('@/pages/accounting/reports/AgedDebtorsPage').then((m) => ({
     default: m.AgedDebtorsPage,
   }))
 );
 /** Accounting portal — GST Return */
 const GSTReturnPage = lazy(() =>
   import('@/pages/accounting/reports/GSTReturnPage').then((m) => ({
     default: m.GSTReturnPage,
   }))
 );
 /** Accounting portal — GST Reconciliation */
 const GSTReconciliationPage = lazy(() =>
   import('@/pages/accounting/reports/GSTReconciliationPage').then((m) => ({
     default: m.GSTReconciliationPage,
   }))
 );
 /** Accounting portal — Reports Index */
 const ReportsIndexPage = lazy(() =>
   import('@/pages/accounting/reports/ReportsIndexPage').then((m) => ({
     default: m.ReportsIndexPage,
   }))
 );
 /** Accounting portal — Inventory Valuation */
 const InventoryValuationPage = lazy(() =>
   import('@/pages/accounting/reports/InventoryValuationPage').then((m) => ({
     default: m.InventoryValuationPage,
   }))
 );
 /** Accounting portal — Reconciliation Dashboard */
 const ReconciliationDashboardPage = lazy(() =>
   import('@/pages/accounting/reports/ReconciliationDashboardPage').then((m) => ({
     default: m.ReconciliationDashboardPage,
   }))
 );
 /** Accounting portal — Suppliers */
 const SuppliersPage = lazy(() =>
   import('@/pages/accounting/SuppliersPage').then((m) => ({
     default: m.SuppliersPage,
   }))
 );
 /** Accounting portal — Dealers (accounting view) */
 const DealersAccountingPage = lazy(() =>
   import('@/pages/accounting/DealersAccountingPage').then((m) => ({
     default: m.DealersAccountingPage,
   }))
 );
 /** Accounting portal — Purchase Orders */
 const PurchaseOrdersPage = lazy(() =>
   import('@/pages/accounting/PurchaseOrdersPage').then((m) => ({
     default: m.PurchaseOrdersPage,
   }))
 );
 /** Accounting portal — Goods Receipt Notes */
 const GoodsReceiptNotesPage = lazy(() =>
   import('@/pages/accounting/GoodsReceiptNotesPage').then((m) => ({
     default: m.GoodsReceiptNotesPage,
   }))
 );
 /** Accounting portal — Raw Material Purchases */
 const RawMaterialPurchasesPage = lazy(() =>
   import('@/pages/accounting/RawMaterialPurchasesPage').then((m) => ({
     default: m.RawMaterialPurchasesPage,
   }))
 );
 /** Accounting portal — Purchase Returns */
 const PurchaseReturnsPage = lazy(() =>
   import('@/pages/accounting/PurchaseReturnsPage').then((m) => ({
     default: m.PurchaseReturnsPage,
   }))
 );

/** Accounting portal — Product Catalog */
const ProductCatalogPage = lazy(() =>
  import('@/pages/accounting/ProductCatalogPage').then((m) => ({
    default: m.ProductCatalogPage,
  }))
);
/** Accounting portal — Raw Materials Inventory */
const RawMaterialsInventoryPage = lazy(() =>
  import('@/pages/accounting/RawMaterialsInventoryPage').then((m) => ({
    default: m.RawMaterialsInventoryPage,
  }))
);
/** Accounting portal — Inventory Adjustments */
const InventoryAdjustmentsPage = lazy(() =>
  import('@/pages/accounting/InventoryAdjustmentsPage').then((m) => ({
    default: m.InventoryAdjustmentsPage,
  }))
);
/** Accounting portal — Opening Stock */
const OpeningStockPage = lazy(() =>
  import('@/pages/accounting/OpeningStockPage').then((m) => ({
    default: m.OpeningStockPage,
  }))
);
/** Accounting portal — Finished Goods */
const FinishedGoodsPage = lazy(() =>
  import('@/pages/accounting/FinishedGoodsPage').then((m) => ({
    default: m.FinishedGoodsPage,
  }))
);



 /** Accounting portal — Month-End Checklist */
 const MonthEndChecklistPage = lazy(() =>
   import('@/pages/accounting/MonthEndChecklistPage').then((m) => ({
     default: m.MonthEndChecklistPage,
   }))
 );
 /** Accounting portal — Bank Reconciliation */
 const BankReconciliationPage = lazy(() =>
   import('@/pages/accounting/BankReconciliationPage').then((m) => ({
     default: m.BankReconciliationPage,
   }))
 );
 /** Accounting portal — Audit Digest */
 const AuditDigestPage = lazy(() =>
   import('@/pages/accounting/AuditDigestPage').then((m) => ({
     default: m.AuditDigestPage,
   }))
 );
 /** Accounting portal — Config Health */
 const ConfigHealthPage = lazy(() =>
   import('@/pages/accounting/ConfigHealthPage').then((m) => ({
     default: m.ConfigHealthPage,
   }))
 );
 /** Accounting portal — Transaction Audit */
 const TransactionAuditPage = lazy(() =>
   import('@/pages/accounting/TransactionAuditPage').then((m) => ({
     default: m.TransactionAuditPage,
   }))
 );

/** Admin portal — Dashboard */
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
/** Admin portal — Users */
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/UsersPage').then((m) => ({
    default: m.UsersPage,
  }))
);
 /** Admin portal — Roles */
 const AdminRolesPage = lazy(() =>
   import('@/pages/admin/RolesPage').then((m) => ({
     default: m.RolesPage,
   }))
 );
 /** Admin portal — Settings */
 const AdminSettingsPage = lazy(() =>
   import('@/pages/admin/SettingsPage').then((m) => ({
     default: m.SettingsPage,
   }))
 );
 /** Admin portal — Notifications */
 const AdminNotificationsPage = lazy(() =>
   import('@/pages/admin/NotificationsPage').then((m) => ({
     default: m.NotificationsPage,
   }))
 );
 /** Admin portal — Changelog */
 const AdminChangelogPage = lazy(() =>
   import('@/pages/admin/ChangelogPage').then((m) => ({
     default: m.ChangelogPage,
   }))
 );
 /** Admin portal — Approvals */
 const AdminApprovalsPage = lazy(() =>
   import('@/pages/admin/ApprovalsPage').then((m) => ({
     default: m.ApprovalsPage,
   }))
 );

 /** Admin portal — Audit Trail */
 const AdminAuditTrailPage = lazy(() =>
   import('@/pages/admin/AuditTrailPage').then((m) => ({
     default: m.AuditTrailPage,
   }))
 );

 /** Portal Insights — used by superadmin */
 const AdminPortalInsightsPage = lazy(() =>
   import('@/pages/admin/PortalInsightsPage').then((m) => ({
     default: m.PortalInsightsPage,
   }))
 );

 /** Operations Control — used by superadmin */
 const AdminOperationsControlPage = lazy(() =>
   import('@/pages/admin/OperationsControlPage').then((m) => ({
     default: m.OperationsControlPage,
   }))
 );

 // ─────────────────────────────────────────────────────────────────────────────
 // Lazy-loaded Superadmin portal pages
 // ─────────────────────────────────────────────────────────────────────────────
 
 /** Superadmin portal — Dashboard */
 const SuperadminDashboardPage = lazy(() =>
   import('@/pages/superadmin/SuperadminDashboardPage').then((m) => ({
     default: m.SuperadminDashboardPage,
   }))
 );
 /** Superadmin portal — Tenants */
 const SuperadminTenantsPage = lazy(() =>
   import('@/pages/superadmin/TenantsPage').then((m) => ({
     default: m.TenantsPage,
   }))
 );
 /** Superadmin portal — Platform Roles */
 const SuperadminRolesPage = lazy(() =>
   import('@/pages/superadmin/PlatformRolesPage').then((m) => ({
     default: m.PlatformRolesPage,
   }))
 );
 /** Superadmin portal — Audit Trail */
 const SuperadminAuditTrailPage = lazy(() =>
   import('@/pages/superadmin/SuperadminAuditTrailPage').then((m) => ({
     default: m.SuperadminAuditTrailPage,
   }))
 );
 /** Superadmin portal — Support Tickets */
 const SuperadminSupportTicketsPage = lazy(() =>
   import('@/pages/superadmin/SupportTicketsPage').then((m) => ({
     default: m.SupportTicketsPage,
   }))
 );
/** Superadmin portal — Ticket Detail */
const SuperadminTicketDetailPage = lazy(() =>
  import('@/pages/superadmin/TicketDetailPage').then((m) => ({
    default: m.TicketDetailPage,
  }))
);
/** Superadmin portal — Runtime Metrics and Policy */
const SuperadminRuntimePage = lazy(() =>
  import('@/pages/superadmin/SuperadminRuntimePage').then((m) => ({
    default: m.SuperadminRuntimePage,
  }))
);
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Lazy-loaded Sales portal pages
 // ─────────────────────────────────────────────────────────────────────────────
 
 /** Sales portal — Dashboard */
 const SalesDashboardPage = lazy(() =>
   import('@/pages/sales/SalesDashboardPage').then((m) => ({
     default: m.SalesDashboardPage,
   }))
 );
 /** Sales portal — Orders list */
 const SalesOrdersPage = lazy(() =>
   import('@/pages/sales/SalesOrdersPage').then((m) => ({
     default: m.SalesOrdersPage,
   }))
 );
 /** Sales portal — Order detail */
 const SalesOrderDetailPage = lazy(() =>
   import('@/pages/sales/OrderDetailPage').then((m) => ({
     default: m.OrderDetailPage,
   }))
 );

/** Sales portal — Dealers */
const SalesDealersPage = lazy(() =>
  import('@/pages/sales/DealersPage').then((m) => ({
    default: m.DealersPage,
  }))
);
/** Sales portal — Credit Requests */
const SalesCreditRequestsPage = lazy(() =>
  import('@/pages/sales/CreditRequestsPage').then((m) => ({
    default: m.CreditRequestsPage,
  }))
);
/** Sales portal — Credit Overrides */
const SalesCreditOverridesPage = lazy(() =>
  import('@/pages/sales/CreditOverridesPage').then((m) => ({
    default: m.CreditOverridesPage,
  }))
);
/** Sales portal — Promotions */
const SalesPromotionsPage = lazy(() =>
  import('@/pages/sales/PromotionsPage').then((m) => ({
    default: m.PromotionsPage,
  }))
);
/** Sales portal — Sales Targets */
const SalesTargetsPage = lazy(() =>
  import('@/pages/sales/SalesTargetsPage').then((m) => ({
    default: m.SalesTargetsPage,
  }))
);
/** Sales portal — Dispatch */
const SalesDispatchPage = lazy(() =>
  import('@/pages/sales/DispatchPage').then((m) => ({
    default: m.DispatchPage,
  }))
);
/** Sales portal — Invoices */
const SalesInvoicesPage = lazy(() =>
  import('@/pages/sales/SalesInvoicesPage').then((m) => ({
    default: m.SalesInvoicesPage,
  }))
);
/** Sales portal — Returns */
const SalesReturnsPage = lazy(() =>
  import('@/pages/sales/SalesReturnsPage').then((m) => ({
    default: m.SalesReturnsPage,
  }))
);
/** Factory portal — Dashboard */
const FactoryDashboardPage = lazy(() =>
  import('@/pages/factory/FactoryDashboardPage').then((m) => ({
    default: m.FactoryDashboardPage,
  }))
);
/** Factory portal — Production Plans */
const ProductionPlansPage = lazy(() =>
  import('@/pages/factory/ProductionPlansPage').then((m) => ({
    default: m.ProductionPlansPage,
  }))
);
/** Factory portal — Production Logs */
const ProductionLogsPage = lazy(() =>
  import('@/pages/factory/ProductionLogsPage').then((m) => ({
    default: m.ProductionLogsPage,
  }))
);
/** Factory portal — Production Batches */
const ProductionBatchesPage = lazy(() =>
  import('@/pages/factory/ProductionBatchesPage').then((m) => ({
    default: m.ProductionBatchesPage,
  }))
);
/** Factory portal — Packing */
const PackingPage = lazy(() =>
  import('@/pages/factory/PackingPage').then((m) => ({
    default: m.PackingPage,
  }))
);
/** Factory portal — Packaging Mappings */
const PackagingMappingsPage = lazy(() =>
  import('@/pages/factory/PackagingMappingsPage').then((m) => ({
    default: m.PackagingMappingsPage,
  }))
);
/** Factory portal — Factory Tasks */
const FactoryTasksPage = lazy(() =>
  import('@/pages/factory/FactoryTasksPage').then((m) => ({
    default: m.FactoryTasksPage,
  }))
);
/** Factory portal — Cost Allocation */
const CostAllocationPage = lazy(() =>
  import('@/pages/factory/CostAllocationPage').then((m) => ({
    default: m.CostAllocationPage,
  }))
);
 /** Factory portal — Dispatch */
 const FactoryDispatchPage = lazy(() =>
   import('@/pages/factory/FactoryDispatchPage').then((m) => ({
     default: m.FactoryDispatchPage,
   }))
 );
 /** Factory portal — Finished Goods */
 const FactoryFinishedGoodsPage = lazy(() =>
   import('@/pages/factory/FinishedGoodsPage').then((m) => ({
     default: m.FinishedGoodsPage,
   }))
 );
 /** Factory portal — Raw Materials */
 const FactoryRawMaterialsPage = lazy(() =>
   import('@/pages/factory/RawMaterialsPage').then((m) => ({
     default: m.RawMaterialsPage,
   }))
 );
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Lazy-loaded Dealer portal pages
 // ─────────────────────────────────────────────────────────────────────────────
 
 /** Dealer portal — Dashboard */
 const DealerDashboardPage = lazy(() =>
   import('@/pages/dealer/DealerDashboardPage').then((m) => ({
     default: m.DealerDashboardPage,
   }))
 );
 /** Dealer portal — My Orders */
 const DealerOrdersPage = lazy(() =>
   import('@/pages/dealer/DealerOrdersPage').then((m) => ({
     default: m.DealerOrdersPage,
   }))
 );
 /** Dealer portal — My Invoices */
 const DealerInvoicesPage = lazy(() =>
   import('@/pages/dealer/DealerInvoicesPage').then((m) => ({
     default: m.DealerInvoicesPage,
   }))
 );
 /** Dealer portal — My Ledger */
 const DealerLedgerPage = lazy(() =>
   import('@/pages/dealer/DealerLedgerPage').then((m) => ({
     default: m.DealerLedgerPage,
   }))
 );
 /** Dealer portal — My Aging */
 const DealerAgingPage = lazy(() =>
   import('@/pages/dealer/DealerAgingPage').then((m) => ({
     default: m.DealerAgingPage,
   }))
 );
 /** Dealer portal — Credit Requests */
 const DealerCreditRequestsPage = lazy(() =>
   import('@/pages/dealer/DealerCreditRequestsPage').then((m) => ({
     default: m.DealerCreditRequestsPage,
   }))
 );
 /** Dealer portal — Support Tickets */
 const DealerSupportTicketsPage = lazy(() =>
   import('@/pages/dealer/DealerSupportTicketsPage').then((m) => ({
     default: m.DealerSupportTicketsPage,
   }))
 );
 /** Dealer portal — Profile */
 const DealerProfilePage = lazy(() =>
   import('@/pages/dealer/DealerProfilePage').then((m) => ({
     default: m.DealerProfilePage,
   }))
 );
// ─────────────────────────────────────────────────────────────────────────────
// Theme initialiser — applies stored theme before first paint
// ─────────────────────────────────────────────────────────────────────────────

function ThemeInit() {
  useTheme(); // side-effect only: applies theme class to <html>
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suspense fallback
// ─────────────────────────────────────────────────────────────────────────────

function PortalFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-surface-secondary)]">
      <PageLoader />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthGate — top-level gate that handles loading and forced-change redirect
// ─────────────────────────────────────────────────────────────────────────────

function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // When mustChangePassword is set, block ALL routes except /change-password.
    // /mfa, /forgot-password, and /reset-password are not exempted — they are
    // unreachable when authenticated anyway, and a user with a pending forced
    // password change must not bypass the gate via those paths.
    if (mustChangePassword && location.pathname !== '/change-password') {
      navigate('/change-password', { replace: true });
    }
  }, [isAuthenticated, mustChangePassword, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return <WelcomeLoader tagline="Preparing your workspace" />;
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route guards
// ─────────────────────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login, preserving the attempted path as `from` state. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}

/**
 * Blocks superadmin users from accessing the portal hub and tenant portals.
 * Superadmin users are isolated to /superadmin only.
 */
function RequireNonSuperadmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const access = resolvePortalAccess(user);
  if (access.superadmin) {
    return <Navigate to="/superadmin" replace />;
  }

  return <>{children}</>;
}

/** Redirects authenticated users away from guest-only pages (login, etc.). */
function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;

  if (isAuthenticated) {
    const access = resolvePortalAccess(user);
    const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

/** Requires a session with mustChangePassword flag. */
function RequireMustChange({ children }: { children: ReactNode }) {
  const { session, mustChangePassword, isLoading } = useAuth();

  if (isLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!mustChangePassword) {
    const access = resolvePortalAccess(session.user);
    const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

/**
 * Guards a portal section.
 * - Redirects unauthenticated users to /login, preserving the attempted path as `from` state.
 * - Superadmins are blocked from non-superadmin portals (redirected to /superadmin).
 * - Non-superadmin roles are blocked from /superadmin/* (redirected to /hub or their portal).
 */
function RequirePortal({
  children,
  pathPrefix,
}: {
  children: ReactNode;
  pathPrefix: string;
}) {
  const { isAuthenticated, mustChangePassword, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  const access = resolvePortalAccess(user);

  // Superadmin isolation: superadmin can ONLY access /superadmin
  if (access.superadmin && pathPrefix !== '/superadmin') {
    return <Navigate to="/superadmin" replace />;
  }

  // Non-superadmin: block /superadmin access
  if (!access.superadmin && pathPrefix === '/superadmin') {
    const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
    return <Navigate to={destination} replace />;
  }

  // Check if user can access this portal
  if (!canAccessPortal(access, pathPrefix)) {
    const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default redirect — sends users to the right place after auth
// ─────────────────────────────────────────────────────────────────────────────

function DefaultRedirect() {
  const { isAuthenticated, mustChangePassword, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;

  const access = resolvePortalAccess(user);
  const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
  return <Navigate to={destination} replace />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

function AppRouter() {
  return (
    <AuthGate>
      <Suspense fallback={<PortalFallback />}>
        <Routes>
          {/* ── Public auth routes ─────────────────────────────────── */}
          <Route
            path="/login"
            element={
              <RequireGuest>
                <LoginPage />
              </RequireGuest>
            }
          />
          <Route path="/mfa" element={<MfaPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ── Forced password change gate ────────────────────────── */}
          <Route
            path="/change-password"
            element={
              <RequireMustChange>
                <FirstPasswordChangePage />
              </RequireMustChange>
            }
          />

          {/* ── Portal hub (multi-portal users, non-superadmin only) ─ */}
          <Route
            path="/hub"
            element={
              <RequireNonSuperadmin>
                <PortalHubPage />
              </RequireNonSuperadmin>
            }
          />

          {/* ── Profile (portal-agnostic) ──────────────────────────── */}
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />

          {/* ── Admin portal ───────────────────────────────────────── */}
          <Route
            path="/admin/*"
            element={
              <RequirePortal pathPrefix="/admin">
                <AdminLayout />
              </RequirePortal>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="changelog" element={<AdminChangelogPage />} />
            <Route path="approvals" element={<AdminApprovalsPage />} />
            <Route path="audit-trail" element={<AdminAuditTrailPage />} />
            <Route path="*" element={<AdminDashboardPage />} />
          </Route>

          {/* ── Accounting portal ──────────────────────────────────── */}
          <Route
            path="/accounting/*"
            element={
              <RequirePortal pathPrefix="/accounting">
                <AccountingLayout />
              </RequirePortal>
            }
          >
            <Route index element={<AccountingDashboard />} />
            <Route path="chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="journals" element={<JournalsPage />} />
            <Route path="journals/new" element={<JournalsPage />} />
            <Route path="journals/:id" element={<JournalDetailPage />} />
            <Route path="periods" element={<AccountingPeriodsPage />} />
            <Route path="default-accounts" element={<DefaultAccountsPage />} />
            <Route path="settlements" element={<SettlementsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="reports/trial-balance" element={<TrialBalancePage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="dealers" element={<DealersAccountingPage />} />
            <Route path="purchasing/purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="purchasing/goods-receipts" element={<GoodsReceiptNotesPage />} />
            <Route path="purchasing/raw-material-purchases" element={<RawMaterialPurchasesPage />} />
            <Route path="purchasing/returns" element={<PurchaseReturnsPage />} />
            <Route path="reports/pl" element={<ProfitLossPage />} />
            <Route path="catalog" element={<ProductCatalogPage />} />
            <Route path="raw-materials" element={<RawMaterialsInventoryPage />} />
            <Route path="adjustments" element={<InventoryAdjustmentsPage />} />
            <Route path="opening-stock" element={<OpeningStockPage />} />
            <Route path="finished-goods" element={<FinishedGoodsPage />} />
            <Route path="reports/balance-sheet" element={<BalanceSheetPage />} />
            <Route path="reports/cash-flow" element={<CashFlowPage />} />
            <Route path="reports/aged-debtors" element={<AgedDebtorsPage />} />
            <Route path="reports/gst" element={<GSTReturnPage />} />
            <Route path="reports/gst-reconciliation" element={<GSTReconciliationPage />} />
            <Route path="reports/inventory" element={<InventoryValuationPage />} />
            <Route path="reports/audit" element={<ReconciliationDashboardPage />} />
            <Route path="reports" element={<ReportsIndexPage />} />

            <Route path="month-end" element={<MonthEndChecklistPage />} />
            <Route path="bank-reconciliation" element={<BankReconciliationPage />} />
            <Route path="audit-digest" element={<AuditDigestPage />} />
            <Route path="config-health" element={<ConfigHealthPage />} />
            <Route path="transaction-audit" element={<TransactionAuditPage />} />
            <Route path="*" element={<AccountingDashboard />} />
          </Route>

          {/* ── Sales portal ────────────────────────────────────────── */}
          <Route
            path="/sales/*"
            element={
              <RequirePortal pathPrefix="/sales">
                <SalesLayout />
              </RequirePortal>
            }
          >
            <Route index element={<SalesDashboardPage />} />
            <Route path="orders" element={<SalesOrdersPage />} />
            <Route path="orders/:id" element={<SalesOrderDetailPage />} />
            <Route path="dealers" element={<SalesDealersPage />} />
            <Route path="credit-requests" element={<SalesCreditRequestsPage />} />
            <Route path="credit-overrides" element={<SalesCreditOverridesPage />} />
            <Route path="promotions" element={<SalesPromotionsPage />} />
            <Route path="targets" element={<SalesTargetsPage />} />
            <Route path="dispatch" element={<SalesDispatchPage />} />
            <Route path="invoices" element={<SalesInvoicesPage />} />
            <Route path="returns" element={<SalesReturnsPage />} />
            <Route path="*" element={<SalesDashboardPage />} />
          </Route>

          {/* ── Factory portal ──────────────────────────────────────── */}
          <Route
            path="/factory/*"
            element={
              <RequirePortal pathPrefix="/factory">
                <FactoryLayout />
              </RequirePortal>
            }
          >
            <Route index element={<FactoryDashboardPage />} />
            <Route path="production/plans" element={<ProductionPlansPage />} />
            <Route path="production/logs" element={<ProductionLogsPage />} />
            <Route path="production/batches" element={<ProductionBatchesPage />} />
            <Route path="packing" element={<PackingPage />} />
            <Route path="config/packaging" element={<PackagingMappingsPage />} />
            <Route path="config/tasks" element={<FactoryTasksPage />} />
            <Route path="cost-allocation" element={<CostAllocationPage />} />
            <Route path="dispatch" element={<FactoryDispatchPage />} />
            <Route path="inventory/finished-goods" element={<FactoryFinishedGoodsPage />} />
            <Route path="inventory/raw-materials" element={<FactoryRawMaterialsPage />} />
            <Route path="*" element={<FactoryDashboardPage />} />
          </Route>

          {/* ── Dealer portal ───────────────────────────────────────── */}
          <Route
            path="/dealer/*"
            element={
              <RequirePortal pathPrefix="/dealer">
                <DealerLayout />
              </RequirePortal>
            }
          >
            <Route index element={<DealerDashboardPage />} />
            <Route path="orders" element={<DealerOrdersPage />} />
            <Route path="invoices" element={<DealerInvoicesPage />} />
            <Route path="ledger" element={<DealerLedgerPage />} />
            <Route path="aging" element={<DealerAgingPage />} />
            <Route path="credit-requests" element={<DealerCreditRequestsPage />} />
            <Route path="support" element={<DealerSupportTicketsPage />} />
            <Route path="profile" element={<DealerProfilePage />} />
            <Route path="*" element={<DealerDashboardPage />} />
          </Route>

          {/* ── Superadmin portal (isolated) ───────────────────────── */}
          <Route
            path="/superadmin/*"
            element={
              <RequirePortal pathPrefix="/superadmin">
                <SuperadminLayout />
              </RequirePortal>
            }
          >
            <Route index element={<SuperadminDashboardPage />} />
            <Route path="tenants" element={<SuperadminTenantsPage />} />
            <Route path="roles" element={<SuperadminRolesPage />} />
            <Route path="portal-insights" element={<AdminPortalInsightsPage />} />
            <Route path="tenant-runtime" element={<SuperadminRuntimePage />} />
            <Route path="runtime" element={<Navigate to="/superadmin/tenant-runtime" replace />} />
            <Route path="operations-control" element={<AdminOperationsControlPage />} />
            <Route path="audit" element={<SuperadminAuditTrailPage />} />
            <Route path="tickets" element={<SuperadminSupportTicketsPage />} />
            <Route path="tickets/:id" element={<SuperadminTicketDetailPage />} />
            <Route path="*" element={<SuperadminDashboardPage />} />
          </Route>

          {/* ── Default ─────────────────────────────────────────────── */}
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Suspense>
    </AuthGate>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CommandPaletteProvider>
            <ThemeInit />
            <AppRouter />
          </CommandPaletteProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

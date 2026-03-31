# Architecture

## System Overview

Multi-portal ERP frontend serving 6 user roles through portal-isolated views. React SPA with Vite dev server proxying to Spring Boot backend.

```
Browser/Electron → Vite (3002) → Proxy → Spring Boot API (8081) → PostgreSQL
```

## Portal Architecture

| Portal | Route Prefix | Role | Layout |
|---|---|---|---|
| Admin | `/admin/*` | ROLE_ADMIN | AdminLayout |
| Accounting | `/accounting/*` | ROLE_ACCOUNTING | AccountingLayout |
| Sales | `/sales/*` | ROLE_SALES | SalesLayout |
| Factory | `/factory/*` | ROLE_FACTORY | FactoryLayout |
| Dealer | `/dealer/*` | ROLE_DEALER | DealerLayout |
| Superadmin | `/superadmin/*` | ROLE_SUPER_ADMIN | SuperadminLayout |

## Admin Portal Routes (Current)

| Route | Page | API Endpoints |
|---|---|---|
| `/admin` | AdminDashboardPage | GET /portal/dashboard |
| `/admin/users` | UsersPage | GET/POST/PUT/DELETE /admin/users, PATCH suspend/unsuspend/mfa |
| `/admin/roles` | RolesPage | GET /admin/roles, GET /admin/roles/{key} |
| `/admin/approvals` | ApprovalsPage | GET /admin/approvals, POST/PUT approve/reject endpoints |
| `/admin/notifications` | NotificationsPage | POST /admin/notify, GET /admin/users |
| `/admin/changelog` | ChangelogPage | GET /changelog, GET /changelog/latest-highlighted |
| `/admin/audit-trail` | AuditTrailPage | GET /admin/audit/events, GET /accounting/audit/events |
| `/admin/settings` | SettingsPage | GET /admin/settings (read-only for ROLE_ADMIN) |
| `/admin/finance` | FinanceSupportPage | GET /portal/finance/ledger,invoices,aging |
| `/admin/support` | SupportTicketsPage | GET/POST /portal/support/tickets |

## Auth Flow

1. POST /auth/login → JWT tokens (unwrapped response)
2. If mfaRequired → /mfa page
3. If mustChangePassword → /change-password
4. GET /auth/me → session bootstrap (roles, permissions, modules)
5. Auto refresh via POST /auth/refresh-token
6. 4-minute keepalive via GET /auth/me

## Code Organization

```
src/
├── App.tsx              # Main router (all routes)
├── components/ui/       # Shared component library (60+ components)
├── context/AuthContext   # Auth state, tokens, session
├── hooks/               # useTheme, useApiQuery, useBackgroundFetch
├── layouts/             # Portal layouts (use shared Sidebar component)
├── lib/                 # API layer (axios + typed functions)
├── pages/               # Portal pages organized by role
├── styles/              # CSS variables (design tokens)
└── types/               # TypeScript interfaces
```

## Design System

Shared components in `src/components/ui/`:
- Layout: Sidebar, PageHeader, Breadcrumb, TopBar, ResponsiveContainer
- Data: DataTable (with mobileCardRenderer), StatCard, Badge, EmptyState
- Forms: Input, Select, Combobox, Checkbox, Radio, Switch, RoleSelector
- Feedback: Toast, Skeleton, Loader, ProgressBar, Alert
- Overlay: Modal, Drawer, BottomSheet, ConfirmDialog, DropdownMenu
- Navigation: Tabs, Accordion, Stepper, CommandPalette

**Note:** No shared Textarea component exists. Pages that need multiline input (e.g., NotificationsPage body field) use native `<textarea>` styled to match the design system. If a shared Textarea is created in the future, update NotificationsPage and other consumers.

**Navigation components to update with route changes:** When adding/removing routes, update BOTH `Sidebar.tsx` (sidebar nav items) AND `CommandPalette.tsx` (ADMIN_NAV/ACCOUNTING_NAV/etc arrays). Missing one creates dead nav links.

CSS variables define colors, spacing, shadows, border-radius in `styles/variables.css`. Dark mode switches variables via `.dark` class on html.

## Data Flow

1. Pages call API functions from `src/lib/`
2. Axios instance adds auth headers via interceptors
3. 401 responses trigger automatic token refresh
4. Response data stored in component state (useState/useReducer)
5. No global cache — manual useEffect fetching per page

# Architecture

## System Overview

Multi-portal ERP frontend serving 6 user roles through portal-isolated views. React SPA with Vite dev server proxying to Spring Boot backend.

```
Browser/Electron → Vite (3002) → Proxy → Spring Boot API (8081) → PostgreSQL (5433)
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

## Auth Flow

1. User hits `/login` → enters email + password + companyCode
2. Backend returns JWT access + refresh tokens + session info
3. If `mfaRequired` → redirect to `/mfa` for TOTP verification
4. If `mustChangePassword` → redirect to `/change-password`
5. On success → redirect to portal hub or default portal
6. Company switch: uses `POST /auth/refresh-token` with new companyCode (NOT /multi-company/companies/switch)
7. 4-minute keepalive interval refreshes session

## Code Organization

```
src/
├── App.tsx              # Main router (43KB - all routes defined here)
├── main.tsx             # React entry point
├── components/
│   ├── ui/              # Shared UI components (design system)
│   ├── CommandPalette.tsx
│   ├── CompanySwitcher.tsx
│   └── ErrorBoundary.tsx
├── context/
│   └── AuthContext.tsx   # Auth state, session management
├── hooks/
│   └── useTheme.ts      # Dark/light mode toggle
├── layouts/
│   ├── AdminLayout.tsx
│   ├── AccountingLayout.tsx
│   ├── SalesLayout.tsx
│   ├── FactoryLayout.tsx
│   ├── DealerLayout.tsx
│   └── SuperadminLayout.tsx
├── lib/
│   ├── api.ts           # Axios instance, interceptors, auth headers
│   ├── authApi.ts       # Auth endpoints
│   ├── adminApi.ts      # Admin + orchestrator + changelog APIs
│   ├── accountingApi.ts # All accounting endpoints
│   └── error-resolver.ts
├── pages/
│   ├── auth/            # Login, MFA, password flows, portal hub
│   ├── admin/           # Admin portal pages
│   ├── accounting/      # Accounting portal pages
│   ├── sales/           # Sales portal pages
│   ├── factory/         # Factory portal pages
│   ├── dealer/          # Dealer portal pages
│   └── superadmin/      # Superadmin portal pages
├── styles/
│   └── variables.css    # CSS custom properties (colors, spacing, shadows)
└── types/
    └── index.ts         # All TypeScript interfaces
```

## Design System

68+ reusable components in reference at `FRONTEND/FRONTEND/FRONTEND OF BACKEND/src/shared/components/ui/`.
Production components in `src/components/ui/`. Key components:
- DataTable (with mobile card renderer)
- Modal (auto bottom-sheet on mobile)
- Drawer, BottomSheet
- Button, Input, Select, Checkbox, Radio, Switch
- Badge, Tabs, Tooltip, Toast
- Sidebar, TopBar, Breadcrumb, PageHeader
- StatCard, EmptyState, Skeleton, Loader
- ResponsiveContainer, ResponsiveGrid, Stack

## Data Flow

1. Pages call API functions from `src/lib/`
2. API functions use shared axios instance with auth interceptors
3. Response data stored in component state (useState)
4. No global state management beyond AuthContext
5. No caching layer (SWR/React Query) - currently manual useEffect fetching

## Key Invariants

- Company context enforced by JWT claims + X-Company-Code/X-Company-Id headers
- Portal isolation via route guards (RequireAuth, RequirePortal, RequireNonSuperadmin)
- Module gating via `enabledModules` from auth session
- Role hierarchy: SUPER_ADMIN > ADMIN (backend-enforced)

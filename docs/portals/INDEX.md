# Portals (Frontend) — Index

Last reviewed: 2026-02-27

This folder is the frontend planning system-of-record for portal boundaries, role gating, and API wiring.

## Canonical Portal Set (Frontend)

Exactly 5 client-facing portals are supported:

- `ADMIN`
- `ACCOUNTING`
- `SALES`
- `FACTORY`
- `DEALER`

One additional internal overlay portal exists for platform control:

- `SUPERADMIN` (you only; `ROLE_SUPER_ADMIN`)

If portal taxonomy changes, update:
- `docs/INDEX.md`
- `docs/endpoint-inventory.md`
- `portal-permissions-matrix.md`
- all portal plans in this folder

## Start Here

- Deep, portal-by-portal plan (routes, modules, flows, gaps): `docs/portals/PORTAL_FRONTEND_MASTER_PLAN.md`
- Exhaustive endpoint lists grouped by portal tag (OpenAPI) + known code-only deltas: `docs/portals/PORTAL_ENDPOINTS_BY_PORTAL.md`

## Existing Portal Docs (Already In Repo)

- Admin nav blueprint: `admin-portal-nav-plan.md`
- Accounting portal deep handoff (openapi-driven): `docs/accounting-portal-frontend-engineer-handoff.md`
- Manufacturing portal sitemap + data map: `manufacturing-portal-sitemap-datamap.md`
- RBAC-aligned page ↔ endpoint matrix: `portal-permissions-matrix.md`


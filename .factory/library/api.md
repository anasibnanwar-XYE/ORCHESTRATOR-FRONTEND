# API

Backend contract notes for frontend workers.

**What belongs here:** canonical doc sources, API-boundary rules, known contract ambiguities, and review-only surfaces.
**What does NOT belong here:** full endpoint inventories that already exist in backend handoff docs.

---

Source-of-truth docs:
- `/Users/anas/Documents/Factory/bigbrightpaints-erp/.factory/library/frontend-handoff.md`
- `/Users/anas/Documents/Factory/bigbrightpaints-erp/docs/frontend-update-v2/*`

Rules:
- Treat backend handoff docs as canonical unless a backend ambiguity is documented and escalated.
- Keep request/response wiring maintainable and easy to trace from page -> wrapper -> backend contract.
- Prefer fixing the canonical path rather than stacking fallbacks.
- If backend behavior is ambiguous or contradictory, stop and return clear evidence for the orchestrator to file in ERP Linear.

Known tracked backend ambiguities:
- `ERP-11` canonical tenant-runtime policy path — WRITE path resolved: `PUT /companies/{id}/tenant-runtime/policy`. READ path for company-scoped policy state still unclear; currently using aggregate metrics from `GET /admin/tenant-runtime/metrics`.
- `ERP-12` password/session security policy contract exposure
- `ERP-13` canonical company support reset/warning endpoint mapping

Pinned auth contract notes:
- MFA verification must reuse `POST /auth/login` with the original login payload plus `mfaCode` or `recoveryCode`; do not call `/auth/mfa/verify`.

Pinned admin/superadmin contract notes:
- Tenant runtime metrics: `GET /admin/tenant-runtime/metrics` (platform-wide aggregate)
- Tenant runtime policy update: `PUT /companies/{id}/tenant-runtime/policy` (company-scoped)
- Dual-vocabulary lifecycle states: Backend returns both HOLD/SUSPENDED and BLOCKED/DEACTIVATED vocabularies. Frontend normalizes using mapping in TenantsPage.tsx. When filtering by status, compare against both vocabularies.
- Admin vs superadmin endpoint pattern: Admin writes use `/admin/` prefix, public reads use root path (e.g., `POST /admin/changelog` vs `GET /changelog`).
- Module configuration: `PUT /admin/tenants/{id}/modules` with `{ enabledModules: string[] }`. No GET endpoint exists to fetch current module state; modal initializes empty and admin must re-select all desired modules.
- Force-reset password: `POST /admin/users/{id}/force-reset-password`. Foreign-target and missing-target errors return identical masked errors for security.

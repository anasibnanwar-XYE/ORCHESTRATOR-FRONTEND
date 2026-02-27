# Frontend Contract Pack

This folder is the canonical frontend handoff pack for staging/deployment readiness.

## Files

- `docs/frontend/PORTAL_API_CONTRACTS.md`
  - OpenAPI-driven endpoint coverage for all backend operations.
  - Includes portal ownership packs for `ADMIN`, `SUPERADMIN` (overlay), `ACCOUNTANT`, `SALES`, `FACTORY`, `DEALER`.
  - Includes a master endpoint ledger so every backend endpoint is covered once with ownership metadata.
- `docs/frontend/portals/`
  - Portal-by-portal contract files:
    - `ADMIN_PORTAL_API_CONTRACTS.md`
    - `SUPERADMIN_PORTAL_API_CONTRACTS.md`
    - `ACCOUNTANT_PORTAL_API_CONTRACTS.md`
    - `SALES_PORTAL_API_CONTRACTS.md`
    - `FACTORY_PORTAL_API_CONTRACTS.md`
    - `DEALER_PORTAL_API_CONTRACTS.md`
  - Includes `PORTAL_CONTRACTS_INDEX.md`.
- `docs/frontend/PORTAL_API_CONTRACTS.json`
  - Machine-readable ledger generated from `openapi.json`.
- `docs/frontend/AUTH_TOKEN_STRATEGY.md`
  - Frontend auth/session/token/company-context contract based on current backend behavior.
- `docs/frontend/DOC_CLEANUP_CANDIDATES.md`
  - Controlled cleanup plan so old docs can be removed without breaking guard scripts.

## Regeneration

Run from repository root:

```bash
python3 scripts/generate_frontend_portal_contracts.py \
  --input openapi.json \
  --md-out docs/frontend/PORTAL_API_CONTRACTS.md \
  --json-out docs/frontend/PORTAL_API_CONTRACTS.json \
  --per-portal-dir docs/frontend/portals
```

## Source of Truth

- API shape: `openapi.json`
- Security/runtime enforcement: `erp-domain/src/main/java/com/bigbrightpaints/erp/core/security/`
- Auth endpoints/services: `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/auth/`

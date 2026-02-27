# Frontend Docs Cleanup Candidates

Purpose: reduce documentation sprawl without breaking existing guard scripts or ticket evidence expectations.

## Keep (Current Canonical)

- `docs/frontend/PORTAL_API_CONTRACTS.md`
- `docs/frontend/PORTAL_API_CONTRACTS.json`
- `docs/frontend/AUTH_TOKEN_STRATEGY.md`
- `docs/frontend/README.md`

## Legacy Docs With Active Dependencies (Do Not Remove Yet)

- `docs/accounting-portal-endpoint-map.md`
- `docs/accounting-portal-frontend-engineer-handoff.md`
- `docs/endpoint-inventory.md`
- `docs/ACCOUNTING_PORTAL_SCOPE_GUARDRAIL.md`

Why blocked:
- Existing guard/evidence flow references these files directly:
  - `scripts/guard_accounting_portal_scope_contract.sh`
  - `docs/endpoint-inventory.md` remediation instructions
  - historical ticket parity baselines

## Safe Next Cleanup Slice

1. Update guard scripts to point at `docs/frontend/PORTAL_API_CONTRACTS.*` as canonical source.
2. Keep accounting-specific docs as compatibility shims with short pointers.
3. Once gates pass on new references, archive or remove duplicated legacy sections.
4. Re-run gate scripts and capture evidence before final doc removals.

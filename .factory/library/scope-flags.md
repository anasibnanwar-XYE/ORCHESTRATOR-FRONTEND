# Scope Flags

Review-only surfaces and scope boundaries for this mission.

**What belongs here:** pages or tabs that should not be silently expanded or removed without explicit scope confirmation.
**What does NOT belong here:** backend contract ambiguities already tracked elsewhere.

---

Review-only Frontend Linear issues:
- `FRO-1` Review exposed operator/governance pages with unclear backend support
- `FRO-2` Review superadmin Tenant Runtime page for contract drift
- `FRO-3` Review Sales Promotions and Sales Targets tabs against backend handoff scope

Worker rule:
- If a page or tab looks unsupported or out of scope, do not silently remove it and do not expand it into new product scope. Return evidence to the orchestrator or rely on the tracked review issue.

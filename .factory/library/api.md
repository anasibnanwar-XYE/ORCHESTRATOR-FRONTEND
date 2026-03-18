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
- `ERP-11` canonical tenant-runtime policy path + read contract
- `ERP-12` password/session security policy contract exposure
- `ERP-13` canonical company support reset/warning endpoint mapping

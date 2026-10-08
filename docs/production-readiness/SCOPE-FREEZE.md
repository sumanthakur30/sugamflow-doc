# Scope Freeze — Production Readiness Sprint

**Effective:** 2026-06-05  
**Until:** Phase 3 complete (CI + E2E hardening) or explicit PM sign-off  
**Branch:** `fix/production-readiness`

## Policy

During the production-readiness sprint, **no new features** are merged unless they are:

1. **P0/P1 bug fixes** for production blockers discovered during remediation, or
2. **Explicitly approved** security/infrastructure work tied to Phases 1–7

## In scope (allowed)

- Phase 1: Security (network isolation, JWT validation, secret rotation, dev endpoint removal)
- Phase 2: High-priority bugs (GST E2E, frontend build, demo seeds, IDOR fix)
- Phase 3: CI expansion, E2E isolation, Playwright smoke tests
- Phase 4: Database FK migrations and backfills
- Phase 5: Performance tuning, monitoring, backup runbooks
- Phase 6: Responsive fixes (after Phase 1)

## Out of scope (deferred)

- New business modules or UI screens
- Refactors unrelated to audit findings
- New integrations (payment gateways, SMS providers, etc.)
- Landing page redesign
- Field-force feature expansion

## Exception process

1. Open issue tagged `production-readiness-exception`
2. State business justification and which phase it blocks
3. Tech lead + PM approve in writing
4. Land on a short-lived branch; cherry-pick only if critical

## Success metrics before lifting freeze

| Metric | Baseline (audit) | Target |
|--------|------------------|--------|
| Production readiness | 58% | ≥85% |
| Critical security issues | 4 | 0 |
| CI services tested | 4 | 8+ |
| Frontend prod build | FAIL | PASS |

## Contacts

| Role | Responsibility |
|------|----------------|
| Dev | Implementation on `fix/production-readiness` |
| QA | Re-run `phase0-prep.ps1` after each phase |
| DevOps | Secret rotation, EC2/RDS network rules |
| PM | Exception approvals |

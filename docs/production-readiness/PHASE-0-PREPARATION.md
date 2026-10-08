# Phase 0 — Preparation (Day 1)

Production readiness remediation tracker. **Do not skip this phase** — baseline artifacts are required to verify Phase 1+ fixes.

## Status

| Step | Action | Status | Verified |
|------|--------|--------|----------|
| 0.1 | Git branch `fix/production-readiness` | ✅ Done | `git branch --show-current` |
| 0.2 | Secret inventory (local, gitignored) | ✅ Done | `.local/secrets-inventory-*.md` |
| 0.3 | PostgreSQL snapshots | ✅ Done | `.local/backups/YYYY-MM-DD/` |
| 0.4 | Baseline test logs | ✅ Done | `docs/production-readiness/baseline/YYYY-MM-DD/` |
| 0.5 | Scope freeze | ✅ Done | [SCOPE-FREEZE.md](./SCOPE-FREEZE.md) |

## Quick commands

```powershell
# Re-run full Phase 0 (backups + tests + secret inventory)
.\scripts\phase0-prep.ps1

# Smoke only (no E2E, faster)
.\scripts\phase0-prep.ps1 -SkipE2e

# Tests only (skip DB backup)
.\scripts\phase0-prep.ps1 -SkipDbBackup
```

## Branch strategy

All production-readiness fixes land on **`fix/production-readiness`**.

- Phase 1 (security): commit per step with clear messages
- Merge to `main` only after Phase 7 re-audit passes
- If using per-service git repos (`scripts/setup-separate-git-repos.ps1`), create matching branches in each affected service

## Baseline artifacts

| Artifact | Location | Committed? |
|----------|----------|------------|
| Service smoke log | `baseline/YYYY-MM-DD/01-service-smoke.log` | Yes |
| Procurement E2E log | `baseline/YYYY-MM-DD/02-procurement-e2e.log` | Yes |
| Healthcare HIS log | `baseline/YYYY-MM-DD/03-healthcare-his.log` | Yes |
| Automobile smoke log | `baseline/YYYY-MM-DD/04-automobile-smoke.log` | Yes |
| Security baseline | `baseline/YYYY-MM-DD/05-security-baseline.log` | Yes |
| DB dumps | `.local/backups/YYYY-MM-DD/*.sql` | **No** (gitignored) |
| Secret inventory | `.local/secrets-inventory-YYYY-MM-DD.md` | **No** (gitignored) |

## Secret inventory template

See [secrets-inventory.template.md](./secrets-inventory.template.md) for the list of variables to track. Actual values live only under `.local/`.

## Exit criteria (Phase 0 complete)

- [x] Branch `fix/production-readiness` exists
- [x] All 16 microservice DBs backed up locally
- [x] Baseline tests captured (smoke + procurement + healthcare + automobile)
- [x] Security baseline documented (pre-fix vulnerable state)
- [x] Scope freeze published

## Next phase

→ **[Phase 1 — Critical Security](./PHASE-1-SECURITY.md)** — **in progress** (core fixes implemented 2026-06-05)

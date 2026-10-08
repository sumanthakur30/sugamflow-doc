# Phase 1 — Critical Security (Days 2–5)

**Prerequisite:** [Phase 0 complete](./PHASE-0-PREPARATION.md)

## Steps (in order)

1. **1.1** Network isolation — expose only gateway `:9090` in prod compose / AWS SG
2. **1.2** Remove `/api/dev/encode` (local profile only)
3. **1.3** Rotate secrets; fail startup on defaults in `prod` profile
4. **1.4** JWT validation filter on all microservices
5. **1.5** Authorize `user-service` AdminController
6. **1.6** Protect internal field-force conversion API

## Verification

After each step, re-run security section of Phase 0:

```powershell
.\scripts\phase0-prep.ps1 -SkipDbBackup -SkipE2e
# Compare 05-security-baseline.log to Day 1 baseline
```

## Status (2026-06-05)

| Step | Status | Notes |
|------|--------|-------|
| 1.1 EC2 network isolation | Done | `patch-ec2-network-isolation.ps1`; only gateway host port |
| 1.2 Dev password encoder | Done | `DevController` gated by `auth.dev.encoder.enabled=true` (default off) |
| 1.3 Production secret validation | Done | `security-common` + `ProductionJwtSecretValidator` on gateway |
| 1.4 JWT on microservices | Done | `security-common` auto-config on all 15 servlet services |
| 1.5 user-service admin auth | Done | `AdminAuthorization.requireSuperAdmin()` |
| 1.6 Internal conversion API | Done | `X-Internal-Api-Key` on shop + fieldforce client |

## Rebuild required

```powershell
.\scripts\install-security-common.ps1
docker compose build   # context is repo root for servlet services
docker compose up -d
.\scripts\phase0-prep.ps1 -SkipDbBackup -SkipE2e   # compare 05-security-baseline.log
```

## Verify security fixes

| Check | Before | Expected after |
|-------|--------|----------------|
| `GET :8084/admin/tenants` (no JWT) | 200 | **401** |
| `GET :8085/api/dev/encode/x` | 200 hash | **404** |
| `GET :8083/orders` + spoofed SUPER_ADMIN headers | 200 | **401** |
| Gateway E2E (procurement, healthcare) | PASS | PASS |

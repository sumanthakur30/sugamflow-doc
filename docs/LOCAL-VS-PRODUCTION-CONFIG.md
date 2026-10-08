# Local development vs production configuration

This repo keeps **local** and **production** settings in separate Angular environment files so `ng serve` keeps working on your machine while production builds target **sugamflow.com** hosts.

## Shop Management UI (`shop-management-ui`)

| What you run | Environment file used | API / URLs |
|--------------|------------------------|------------|
| `ng serve` (default) | `src/environments/environment.ts` | `http://localhost:9090` gateway |
| `ng build --configuration=production` | `src/environments/environment.prod.ts` | `https://api.sugamflow.com` |

- **Local:** no change to your workflow — start gateway on `9090`, run `ng serve`.
- **Production deploy:** build with `ng build --configuration=production` and deploy the `dist/` output to `app.sugamflow.com`.

Optional — verify the production bundle locally (calls real `api.sugamflow.com`):

```bash
ng serve --configuration=production
```

## Landing (`sugamflow-landing`)

| Command | File | Links |
|---------|------|--------|
| `ng serve` | `environment.ts` | `http://localhost:4200/...` for app links |
| `ng build --configuration=production` | `environment.prod.ts` | `https://app.sugamflow.com/register` and `/login` |

## Backend (gateway) — production on AWS

CORS and public URLs are **not** hardcoded to production in `application.yml` (that file is for localhost). For production, set environment variables on the gateway service, for example:

- `GATEWAY_CORS_ALLOWED_ORIGIN_PATTERN=https://app.sugamflow.com`

See `gateway-service/src/main/resources/application-prod.yml` and `docs/AWS-DEPLOYMENT.md`.

## Changing production URLs later

1. Edit `shop-management-ui/src/environments/environment.prod.ts` and/or `sugamflow-landing/src/environments/environment.prod.ts`.
2. Rebuild with `--configuration=production` and redeploy static assets.
3. Update gateway CORS / integration env vars if hosts change.

Do **not** edit `environment.ts` for production-only values — that would break local development.

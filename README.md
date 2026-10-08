# sugamflow-doc

Documentation, deploy compare notes, and safe operational SQL for SugamFlow (not application source code).

## Layout

- `product/BUSINESS-FUNCTIONALITY.md` — shop UI businesses, screens, and routes (from `shop-management-ui` nav + capabilities)
- `docs/` — product and operations documentation copied from the SugamFlow workspace. Credential spreadsheets stay in the original workspace and are gitignored here.
- `scripts/sequences/` — local start sequences (`00` common platform through `04` CRM).
- `postgres/production/polyclinic/` — RDS predeploy checks and SAFE orderdb scripts for polyclinic.

Application source, Flyway migrations, live `.env` files, and service repos stay in their own repositories.

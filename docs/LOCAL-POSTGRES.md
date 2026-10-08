# Local PostgreSQL Bootstrap (Host PostgreSQL)

Local development uses PostgreSQL installed on your machine. Docker Compose starts the app, Redis, config service, and discovery service, but it does not start a PostgreSQL container.

## Prerequisites

- Docker Desktop running for the microservices
- PostgreSQL running on your machine at `localhost:5432`
- From repo root: `d:\sugamFlow`
- Optional: copy `.env.example` to `.env.local` and adjust passwords

## First-time database setup

Create all microservice databases and roles with:

- Script: `infra/postgres/create-microservice-databases.sql`
- Run as superuser, usually `postgres`, against the `postgres` database.

**CMD:**

```cmd
cd /d D:\sugamFlow\infra\postgres
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5432 -d postgres -v ON_ERROR_STOP=1 -f create-microservice-databases.sql
```

**DBeaver / pgAdmin:** open the file while connected as `postgres`, then execute it.

Default passwords in the script match the role name (`authdb` / `userdb`, etc.). Edit the `PASSWORD '...'` literals in the script if you use different credentials, and keep `.env.local` aligned.

## Start local services

From the repo root:

```powershell
cd D:\sugamFlow
.\start-local.ps1 -EnvFile .env.local
```

From Docker containers, services connect to host PostgreSQL with:

- Host: `host.docker.internal`
- Port: `5432`

From tools running on your machine, use:

- Host: `localhost` or `127.0.0.1`
- Port: `5432`

## Verify PostgreSQL

```powershell
psql -U postgres -h localhost -p 5432 -d postgres -c "\l"
```

## Common troubleshooting

- **Service fails with authentication error**: ensure `*_DB_USERNAME` and `*_DB_PASSWORD` in `.env.local` match the local PostgreSQL roles.
- **Connection slots exhausted**: lower `DB_POOL_MAX_SIZE` in `.env.local` or raise PostgreSQL `max_connections`.
- **Data not visible in UI**: check the correct service database. Login accounts are in `authdb`; staff/users are in `userdb`; stock rows are in `stockdb`.

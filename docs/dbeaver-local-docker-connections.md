# DBeaver — local PostgreSQL connections (SugamFlow)

Use this for PostgreSQL installed on your machine.  
**Do not** mix these with **AWS RDS** connections; they are different database instances.

## Host and port

- **Host:** `127.0.0.1` (prefer over `localhost` to avoid IPv6 quirks)
- **Port:** `5432`

## One connection per database (recommended names)

Create **11** PostgreSQL connections in DBeaver. Use **native** authentication (username/password).

| Connection name (suggested) | Database | Username | Password |
|----------------------------|----------|----------|----------|
| LOCAL Host - authdb      | authdb   | authdb   | authdb   |
| LOCAL Host - userdb      | userdb   | userdb   | userdb   |
| LOCAL Host - accountdb   | accountdb| accountdb| accountdb|
| LOCAL Host - shopdb      | shopdb   | shopdb   | shopdb   |
| LOCAL Host - productdb   | productdb| productdb| productdb|
| LOCAL Host - orderdb     | orderdb  | orderdb  | orderdb  |
| LOCAL Host - stockdb    | stockdb  | stockdb  | stockdb  |
| LOCAL Host - paymentdb  | paymentdb| paymentdb| paymentdb|
| LOCAL Host - notificationdb | notificationdb | notificationdb | notificationdb |
| LOCAL Host - reportingdb | reportingdb | reportingdb | reportingdb |
| LOCAL Host - postgres (admin) | postgres | postgres | postgres |

Roles and databases are created by `infra/postgres/create-microservice-databases.sql` (password defaults match usernames unless you changed them).

## Optional: bootstrap `postgres` database

The **`postgres`** database is the cluster default; microservice tables (e.g. `auth_account`) live in **`authdb`**, not in `postgres`.  
Keep a separate connection named clearly (e.g. `LOCAL Host - postgres (admin)`) so you do not run service queries there by mistake.

## Before you trust a SQL editor tab

Run on **that** connection:

```sql
SELECT current_database(), current_user,
       inet_server_addr(), inet_server_port();
```

You should see the expected database name (e.g. `authdb`) and user (e.g. `authdb`).

## Check the auth database

On **LOCAL Host - authdb**:

```sql
SELECT md5(string_agg(id::text || ':' || username || ':' || shop_id, ',' ORDER BY id))
FROM auth_account;
```

If expected rows are missing, confirm you are connected to local PostgreSQL, not RDS, and that you are using the right database (`authdb`, `userdb`, `stockdb`, etc.).

## AWS RDS / SSH connections

Rename RDS connections so they are obviously remote, e.g. `AWS RDS - postgres`.

## Import note

DBeaver stores connections in a workspace JSON (e.g. `%APPDATA%\DBeaverData\workspace6\General\.dbeaver\data-sources.json`).  
Merging JSON by hand can corrupt the workspace. Prefer **Database -> New Database Connection** and duplicate the first "LOCAL Host" connection for each database, changing only **Database**, **Username**, and **Password**.

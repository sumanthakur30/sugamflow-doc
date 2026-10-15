# SugamFlow runtime placement

**Status:** Plan only. No servers, images, or databases were changed to produce this document.  
**Date:** 15 October 2026  
**Checked against:** shop host `16.192.54.132` and school host `16.170.194.24` (private `172.31.18.88`)

Keep two servers. Put only identity, tenancy, and subscription in the common layer. Give Retail, School, Hospital, and CRM their own application processes and their own gateway.

## Decision

Do not run one shared copy of Gateway, Discovery, Config, and Redis for every product.

| Service | Shop host | School host | Decision |
|---|---|---|---|
| Gateway | `1.0.18`, 548 MiB / 896 MiB | `1.0.13`, 381 MiB / 896 MiB | Keep both. Different builds and different route targets |
| Subscription | `1.0.8`, 355 MiB / 384 MiB | `1.0.3`, 329 MiB / 384 MiB | One writer later. Both already use `school_subscription_db` on the same database host |
| Discovery | `1.0.2`, 392 MiB / 768 MiB | `1.0.2`, 280 MiB / 768 MiB | Keep both for now. School gateway still uses Eureka names |
| Config | `1.0.2`, 204 MiB / 384 MiB | `1.0.2`, 138 MiB / 384 MiB | Keep both. Config import is optional. Do not point one product at the other's files |
| Redis | `redis:7-alpine`, 6.5 MiB / 128 MiB | `redis:7-alpine`, 6.4 MiB / 128 MiB | One Redis per server. Neither has a password |

The shop gateway sends its own services to container DNS (`http://order-service:8083` and the same pattern for the other retail services). It does not register itself in Eureka. The school gateway is an older image and still uses `lb://` names, so it needs the school host's Discovery. Website and CMS traffic from the shop gateway already goes to `https://school.sugamflow.com`.

Each host has a Docker bridge named `sumanthakur30_default`. Those bridges do not span the two machines. `EUREKA_INSTANCE_PREFER_IP_ADDRESS=true` advertises container bridge addresses, which the other server cannot route.

Subscription caching is off unless `SUBSCRIPTION_CACHE_ENABLED=true`. Neither subscription container sets that.

These five use about 1.5 GiB on the shop host and 1.1 GiB on the school host. Stopping the school subscription container later frees about 330 MiB there. Stopping school Discovery after routes are switched to container DNS frees about 280 MiB more. Neither change removes an EC2 instance.

## Servers

| Runtime | Server | When |
|---|---|---|
| Common + Retail + CRM | Current shop host `16.192.54.132` (15 GiB) | Now |
| School ERP | Current school host `16.170.194.24` (7.6 GiB) | Now. Already split |
| Hospital / OPD / IPD | New `m7i-flex.large`, only after a live hospital tenant | Not now. Those containers stay stopped |
| Common on its own machine | Same class of server as School | Only when login itself is busy |
| CRM on its own machine | Same class of server as School | Only when CRM has real load |

One RDS, separate databases. One Redis on each server. No second auth service. No Kubernetes.

## Where every application goes

| Application | Group | Today | Future home | Plan |
|---|---|---|---|---|
| auth-service `1.0.7` | 1. Common | Shop, running | Shop host | One login for every product |
| user-service `1.0.7` | 1. Common | Shop, running | Shop host | One user directory. School and CRM invite users here |
| shop-service `1.0.26` | 1. Common | Shop, running | Shop host | Tenant, branch, and business type for every product |
| subscription-service `1.0.8` | 1. Common | Shop, running | Shop host | The only subscription writer |
| subscription-service `1.0.3` | 1. Common | School, running | Remove from School | Same database as `1.0.8`. Stop it after School calls the shop copy over the private network |
| notification-service `1.0.2` | 1. Common | Shop, running | Shop host | Email and in-app delivery for every product |
| gateway `1.0.18` | 2. Retail | Shop, running | Shop host | Retail, CRM, and calls into Common. Do not route School or Hospital through it |
| product-service `1.0.29` | 2. Retail | Shop, running | Shop host | Stays |
| stock-service `1.0.23` | 2. Retail | Shop, running | Shop host | Stays |
| order-service `1.0.124` | 2. Retail | Shop, running | Shop host | Stays |
| payment-service `1.0.2` | 2. Retail | Shop, running | Shop host | Stays |
| gst-service `1.0.3` | 2. Retail | Shop, running | Shop host | Stays |
| ledger-service `1.0.3` | 2. Retail | Shop, running | Shop host | Stays |
| account-service `1.0.3` | 2. Retail | Shop, running | Shop host | Stays |
| reporting-service `1.0.2` | 2. Retail | Shop, running | Shop host | Retail reports. School keeps report-builder |
| fieldforce-service `1.0.3` | 2. Retail | Shop, running | Shop host | Stays |
| marketplace-integration-service `1.0.1` | 2. Retail | Shop, running | Shop host | Stays |
| Shop UI (`sugamflow.com`) | 2. Retail | Shop, nginx | Shop host | Stays |
| Shop Redis | 2. Retail | Shop, running | Shop host | Retail and Common on this host only |
| doctor-service `1.0.2` | 3. Hospital | Shop, stopped | Future hospital server | Stay stopped |
| appointment-service `1.0.2` | 3. Hospital | Shop, stopped | Future hospital server | Stay stopped |
| queue-management-service `1.0.7` | 3. Hospital | Shop, stopped | Future hospital server | Stay stopped |
| ipd-service `1.0.4` | 3. Hospital | Shop, stopped | Future hospital server | Stay stopped |
| accommodation-service `1.0.2` | 3. Hospital | Shop, stopped | Future hospital server | Stay stopped |
| Hospital gateway | 3. Hospital | Not deployed | Future hospital server | New gateway on that server. Uses Common auth and subscription on the shop host |
| Hospital Redis | 3. Hospital | Not deployed | Future hospital server | Own Redis. No shared instance with Shop or School |
| gateway `1.0.13` | 4. School | School, running | School host | Stays. Older than the shop gateway on purpose |
| student-service `1.0.12` | 4. School | School, running | School host | Stays |
| admission-service `1.0.4` | 4. School | School, running | School host | Stays |
| fee-service `1.0.5` | 4. School | School, running | School host | Stays |
| staff-service `1.0.3` | 4. School | School, running | School host | Stays |
| academic-structure-service `1.0.3` | 4. School | School, running | School host | Stays |
| attendance-service `1.0.3` | 4. School | School, running | School host | Stays |
| exam-service `1.0.3` | 4. School | School, running | School host | Stays |
| payroll-service `1.0.3` | 4. School | School, running | School host | Stays |
| library-service `1.0.3` | 4. School | School, running | School host | Stays |
| hostel-service `1.0.3` | 4. School | School, running | School host | Stays |
| transport-service `1.0.3` | 4. School | School, running | School host | Stays |
| form-builder-service `1.0.4` | 4. School | School, running | School host | Stays |
| report-builder-service `1.0.5` | 4. School | School, running | School host | Stays |
| compliance-service `1.0.5` | 4. School | School, running | School host | Stays |
| support-service `1.0.5` | 4. School | School, running | School host | Stays |
| workflow-service `1.0.3` | 4. School | School, running | School host | Stays |
| school-settings-service `1.0.4` | 4. School | School, running | School host | Stays |
| school-notification-config-service `1.0.3` | 4. School | School, running | School host | School templates. Delivery stays in Common notification-service |
| website-service `1.0.3` | 4. School | School, running | School host | Platform website module. Stays here while only School publishes |
| cms-service `1.0.4` | 4. School | School, running | School host | Same as website |
| School UI | 4. School | School, nginx | School host | Stays |
| School Redis | 4. School | School, running | School host | School only |
| crm-service `1.0.10` | 5. CRM | Shop, running | Shop host | Stays until CRM load needs its own server |
| CRM UI (`crm.sugamflow.com`) | 5. CRM | Shop, nginx | Shop host | Stays with crm-service |

Discovery `1.0.2` and Config `1.0.2` run on both hosts. They are not a sixth product. Shop routing already uses container DNS. School still needs its local Discovery because its gateway uses Eureka names. After those school routes are switched to container DNS, stop School Discovery. Config is optional on both hosts. Stop a copy only after confirming production settings live in the environment file.

Also present on the shop host and left out of the five groups: `ai-service` (stopped), `ollama` (stopped), and the old `jyotish-service` container (stopped). Astrology runs as its own stack (`astro.sugamflow.com`), not as a copy of these five groups.

## What each group is allowed to call

| Group | Calls Common on the shop host | Calls another product |
|---|---|---|
| Retail | auth, user, shop, subscription, notification, on the same Docker network | No |
| School | auth, user, subscription, notification, over the private VPC | No |
| Hospital (when started) | auth, user, subscription, notification, over the private VPC | No |
| CRM | auth, user, subscription, notification, on the same Docker network | No |

School fee, student, and attendance data stay in School databases. Retail orders stay in Retail databases. Hospital clinical data stays on the hospital server. CRM leads stay in the CRM database.

## Order of work

1. Leave Hospital stopped. Leave both gateways, both Redis instances, and both Discovery copies as they are.
2. Make subscription a single writer: School gateway calls `subscription-service:1.0.8` on the shop private address, then stop the School `1.0.3` container. Compare the two versions' schema history before that cutover. Do not upgrade `1.0.3` to `1.0.8` while both processes are running.
3. Switch the School gateway from Eureka names to container DNS, then stop School Discovery. That frees about 280 MiB on the 7.6 GiB school host.
4. Move Hospital only when a hospital customer is live. Start doctor, appointment, queue, IPD, and accommodation on the new server, with a new gateway and a new Redis.
5. Move CRM off the shop host only when its traffic justifies another server. Move Common (auth, user, shop, subscription, notification) last, and only when login itself is busy.

This does not reduce the current EC2 bill. It removes the second subscription writer and keeps a hospital outage, a school release, and a shop release from taking the others down.

## Instance count after the plan

| Metric | 15 Oct 2026 | After steps 2 and 3 | EC2 bill |
|---|---|---|---|
| Gateway | 2 | 2 | No change |
| Subscription | 2 | 1 | No change |
| Discovery | 2 | 1 (shop host) | No change |
| Config | 2 | 2 until the environment-file check | No change |
| Redis | 2 | 2 | No change |
| Hospital containers | 5, all stopped | Still stopped | No new server until a live hospital tenant |
| Servers | 2 | 2 | No reduction |

# EC2 host — memory and disk (16.192.54.132)

Checked **2026-09-08**. Amazon Linux, 35 days uptime. Compose: `/opt/sugamflow` + `docker-compose.ec2-rds.yml`.

SSH: `ec2-user@16.192.54.132` (key `D:\software\AWS_key\mykey.pem`).

---

## Snapshot

| Resource | Status |
|----------|--------|
| RAM | **15 GiB** — 10 GiB used, **4.0 GiB available**, 1.9 / 4.0 GiB swap |
| Root disk | **20 GiB, 98%** — **427 MiB free** after safe prune (was 261 MiB / 99%) |
| Docker | 29 containers, all running; overlay2 **11 GiB**; volumes **1.9 GiB** |

Safe cleanup already done (no app stop): old zips, `dnf clean`, journal vacuum, `docker image prune -af` (**0 B** — every image is in use).

`docker system df` “2.575 GB reclaimable” is **shared layers of running images**. It will not free until those containers are removed.

---

## What is running vs not

**Up:** Redis, config, discovery, gateway, auth, shop, product, stock, order, user, payment, notification, reporting, account, fieldforce, GST, ledger, doctor, appointment, queue, IPD, accommodation, marketplace, AI, Ollama, jyotish, subscription, school CMS, school website.

**Not up:** CRM, full School ERP (admission/fee/student/…). Those cannot pull/start until disk has several GB free.

---

## Memory (smooth running)

Current set is OK (4 GiB headroom) but swap is already 1.9 GiB — the box is tight.

Approximate extra if you start more:

| Add | Extra RAM |
|-----|-----------|
| CRM | ~400–500 MiB |
| Full school domain (15+ jars) | ~4–6 GiB |
| Keep Ollama 3 GiB cap | already reserved (uses ~338 MiB now) |

Do **not** run **Retail + Hospital + IPD + Astro + CRM + full School + Ollama** on this 15 GiB host. Same rule as before: stop school (or Ollama) before CRM if pressure rises.

Check anytime:

```bash
free -h
docker stats --no-stream
```

---

## Disk — why it is full

| Path | Size | Notes |
|------|------|--------|
| `/var/lib/docker/overlay2` | 11 GiB | Running images |
| `ollama/ollama:latest` | **5.04 GiB** | Largest single image |
| volume `sumanthakur30_ollama_models` | **1.9 GiB** | `qwen2.5:3b` |
| `/opt/jhaastro/app/node_modules` | 619 MiB | Site source; do not delete if Next is running from here |

No dangling images. Tiny leftover zips/journals.

---

## How to free enough space

### A) Safe (already done) — ~0.2 GiB

```bash
rm -f /home/ec2-user/*.zip /tmp/*.zip
sudo dnf clean all
sudo journalctl --vacuum-size=20M
docker image prune -af
docker builder prune -af
```

Not enough to pull CRM or school images.

### B) Stop Ollama when AI capture is not needed — ~7 GiB  (recommended on 20 GiB disk)

```bash
cd /opt/sugamflow
docker compose --env-file .env.production -f docker-compose.ec2-rds.yml stop ollama
docker rm -f sumanthakur30-ollama-1
docker rmi ollama/ollama:latest
docker volume rm sumanthakur30_ollama_models
```

Then pull/start CRM or more school services. Product capture must use cloud LLM (or start Ollama again later).

### C) Grow the EBS volume 20 → 40+ GiB  (proper fix)

Keep Ollama + CRM + extra school images. After AWS resize, on the instance:

```bash
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs /   # or resize2fs if ext4
df -h /
```

### D) Optional small stops (hundreds of MiB each)

Only if that product is unused: `marketplace-integration-service`, IPD/accommodation. Do not `docker volume prune` — that can drop ollama models / capture data.

---

## After you have ~4+ GiB free

CRM:

```bash
cd /opt/sugamflow
bash scripts/ec2-start-crm.sh
```

School: use `/opt/sugamflow/scripts/ec2/02-school-start.sh` (or the school compose) — watch `free -h` first.

# Deployment

EC2 and image publish. Local commands are in [COMMANDS.md](COMMANDS.md).

Nothing in this file was run against EC2 while it was written. Hosts and paths come from `D:\sugamFlow\START-LOCAL-AND-EC2.txt` (dated 2026-09-28) and from `D:\sugamFlow\docker-compose.ec2-rds.yml` being the file those notes use. Re-check SSH and disk before a deploy.

Do not copy `.env.production`, `.env.school.production`, or any password into git or into a chat. Scratch files under `D:\documents_saas` and `D:\sugamFlow\AWS.txt` contain secrets. Those values are intentionally omitted here.

## 1. Servers

Two hosts. Do not put school containers on the shop host.

| Role | Name in the 28 Sep 2026 notes | SSH | Instance | Path |
|---|---|---|---|---|
| Shop, common, CRM, astro | sugamflows | `ec2-user@16.192.54.132` | `i-0c1d29c4665265b55` | `/opt/sugamflow` |
| School | sugamflow-school | `ec2-user@16.170.194.24` | `i-0350f713cd90d83bd` | `/opt/school` (fallback `/home/ec2-user/opt/school`) |

Shop UI files: `/var/www/sugamflow-ui` on `16.192.54.132`.
School UI files: `/var/www/school-ui` on `16.170.194.24`.

Key file used by the notes: `D:\software\AWS_key\mykey.pem`. Confirm the file is still on this PC before connecting. The private key is not stored in this repo.

RDS hostname recorded for the shop stack: `sugamflow-postgres.cnci2kmm0s4n.eu-north-1.rds.amazonaws.com` (PostgreSQL, port 5432). A second name, `sugamflow.cnci2kmm0s4n.eu-north-1.rds.amazonaws.com`, appears in older notes. Confirm which endpoint `.env.production` uses before connecting. Do not open port 5432 to the internet.

`D:\documents_saas\Deployment_Steps_AWS.txt` still shows an example endpoint in `ap-south-1` and the names `app.sugamflow.com` / `api.sugamflow.com`. The 28 Sep 2026 runbook is the one that matches the two hosts above. Treat the ap-south-1 text as an old template.

Historical shop address `16.170.141.216` is marked old in `winscp_cmd.txt`. Do not deploy there unless you confirm it is current.

As of 28 Sep 2026, SSH to `16.170.194.24` did not accept a connection from the deploy PC. That security-group check is still open.

## 2. Connect

On Windows:

```powershell
ssh -i "D:\software\AWS_key\mykey.pem" ec2-user@16.192.54.132
```

School host, after SSH is allowed:

```powershell
ssh -i "D:\software\AWS_key\mykey.pem" ec2-user@16.170.194.24
```

You are on the server when the prompt is `ec2-user`. Commands after that use `cd /opt/sugamflow` or `cd /opt/school`. Commands before SSH stay on Windows.

## 3. What must already exist on the server

Shop host, directory `/opt/sugamflow`:

- `docker-compose.ec2-rds.yml`
- `.env.production` (not in git)
- Docker

`IMAGE_TAG` in `.env.production` must be the tag you pushed. Do not set `IMAGE_TAG=latest` unless every image was pushed as `latest`.

School host:

- `docker-compose.school.ec2-rds.yml`
- `.env.school.production`

JWT material for shop and school must match. The values stay in the env files.

Do not run `D:\school\scripts\ec2\00-full-deploy-and-flyway-check.sh` on either host. That script starts shop and school on one machine.

## 4. Order of a shop deploy

### 4.1 Build and push from Windows

Directory: `D:\sugamFlow`.

```powershell
cd D:\sugamFlow
docker login -u sumanthakur30
$env:IMAGE_PREFIX = "sumanthakur30"
$env:IMAGE_TAG = "<tag-you-push>"
.\build-docker.ps1 -Parallel 1
docker compose push
```

The tag must exist on Docker Hub before the server pulls. `docker login` will prompt for a password. Do not write that password into a file in git.

Sequence form, from `D:\sugamflow-doc`:

```powershell
cd D:\sugamflow-doc
.\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02 -Tag <tag-you-push> -Push
```

Untested in this pass.

### 4.2 Pull and start on the shop EC2

SSH to `16.192.54.132`, then:

```bash
cd /opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production pull
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d
```

If a full pull is too heavy, pull in waves. Infra first, then discovery, then gateway and core, then the rest:

```bash
cd /opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production pull redis config-service discovery-service
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d redis config-service discovery-service
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d gateway-service
```

Wait until discovery is healthy before the gateway wave. Check with the health command in section 7.

One service only, after its image is pushed:

```bash
cd /opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production pull auth-service
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d --force-recreate --no-deps auth-service
```

### 4.3 Shop UI

On Windows, directory `D:\sugamFlow\shop-management-ui`:

```powershell
cd D:\sugamFlow\shop-management-ui
npx ng build --configuration=production
```

WinSCP:

1. Protocol SFTP, host `16.192.54.132`, user `ec2-user`, private key `D:\software\AWS_key\mykey.pem`.
2. Local folder: `D:\sugamFlow\shop-management-ui\dist\shop-management\`.
3. Remote folder: `/home/ec2-user/sugamflow-ui`.

On the server:

```bash
sudo mkdir -p /var/www/sugamflow-ui
sudo rm -rf /var/www/sugamflow-ui/*
sudo cp -r /home/ec2-user/sugamflow-ui/* /var/www/sugamflow-ui/
sudo chown -R nginx:nginx /var/www/sugamflow-ui
sudo chmod -R 755 /var/www/sugamflow-ui
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` must say syntax is ok before reload.

## 5. School deploy

Build school images on Windows with `D:\school\scripts\build-push-all-school-images.ps1` (named in `cmd_unix.txt`). Confirm that script is the one you intend; this pass did not execute it.

Pull on the school host only, after SSH works:

```bash
cd /opt/school
docker compose -f docker-compose.school.ec2-rds.yml --env-file .env.school.production pull
docker compose -f docker-compose.school.ec2-rds.yml --env-file .env.school.production up -d
```

School UI belongs on `16.170.194.24` in `/var/www/school-ui`. `cmd_unix.txt` also shows an `scp` of the school UI to `16.192.54.132`. That conflicts with the 28 Sep 2026 rule. Use the school host.

```powershell
$key = "D:\software\AWS_key\mykey.pem"
$ec2 = "ec2-user@16.170.194.24"
ssh -i $key $ec2 "mkdir -p ~/school-ui-dist"
scp -i $key -r "D:\school\apps\school-ui\dist\school-ui\browser\*" "${ec2}:~/school-ui-dist/"
```

On the school server:

```bash
sudo rsync -a --delete ~/school-ui-dist/ /var/www/school-ui/
sudo nginx -t && sudo systemctl reload nginx
```

School Nginx `/api/` is documented as proxying to `http://16.192.54.132:9090` until the common services move. Do not start a second gateway on the school host.

## 6. Optional products on the shop host

Hospital OPD (only when you mean to run it):

```bash
cd /opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d \
  doctor-service appointment-service queue-management-service
```

Stop OPD without stopping the shop:

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production stop \
  doctor-service appointment-service queue-management-service
```

IPD uses the overlay and stays stopped until a hospital tenant is live:

```bash
cd /opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml -f docker-compose.ec2-ipd.yml \
  --env-file .env.production up -d ipd-service accommodation-service
```

Stop IPD:

```bash
docker compose -f docker-compose.ec2-rds.yml -f docker-compose.ec2-ipd.yml \
  --env-file .env.production stop ipd-service accommodation-service
```

CRM on this host uses the Compose profile and `D:\sugamFlow\scripts\ec2-start-crm.sh` / `ec2-stop-crm.sh` copied to the server, or the same compose project. Confirm the script is present under `/opt/sugamflow/scripts` before relying on it.

## 7. Verify

On the shop server:

```bash
cd /opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production ps
curl -sS http://127.0.0.1:9090/actuator/health
free -h
df -h /
```

Success: `ps` shows the services you started as running, gateway health returns JSON with status UP, and the disk is not full. `curl` was not run from here.

Logs for one service:

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production logs --tail=120 gateway-service
```

From Windows, after the UI copy: open `https://sugamflow.com` and confirm the login page loads. That check was not done in this pass.

## 8. Stop and restart

Stop the shop stack (containers stop, env file stays):

```bash
cd /opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production stop
```

Start again without pulling:

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production start
```

Restart one service after a bad start:

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production logs --tail=120 <service>
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d --force-recreate --no-deps <service>
```

Do not use `down -v` on the server. That removes volumes.

## 9. Rollback

Supported method in the existing notes: put the previous `IMAGE_TAG` back in `.env.production`, then pull and recreate.

```bash
cd /opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production pull
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d --force-recreate
```

There is no separate rollback script in the notes. The previous tag must still exist on Docker Hub.

UI rollback is a WinSCP of the previous `dist` build, then the same `cp` and `nginx` reload.

## 10. Failures already described in the notes

| What you see | What the notes say to do |
|---|---|
| Pull hangs | Ctrl+C, then pull in smaller batches (section 4.2) |
| Discovery not healthy | Do not start the gateway wave. `curl` discovery on port 8761 and read `docker compose logs discovery-service` |
| Disk or memory pressure | `df -h /` and `free -h`. The shop host is a 15 GiB instance with swap. Do not add a full metrics stack on it |
| School SSH refused | Security group for `16.170.194.24` port 22. Re-check before WinSCP |
| Flyway error on boot | Empty databases must exist first. Do not hand-run `V*.sql` unless Flyway has already failed |
| OOM in `dmesg` | `dmesg -T \| grep -i oom \| tail -20` on the server |

`/home/ec2-user/opt/sugamflow` appears in older notes next to `/opt/sugamflow`. Use `/opt/sugamflow` unless `ls` shows the live compose file only under the home path.

## 11. Checklist

- [ ] `IMAGE_TAG` on the server matches the tag pushed from Windows
- [ ] `docker login` used the Hub account `sumanthakur30` and the password was not written down in git
- [ ] Shop pull and `up -d` ran on `16.192.54.132` in `/opt/sugamflow`
- [ ] `curl http://127.0.0.1:9090/actuator/health` on that host succeeds
- [ ] Shop UI files are in `/var/www/sugamflow-ui` and `nginx -t` succeeded
- [ ] School images, if any, were pulled on `16.170.194.24`, not on the shop host
- [ ] `.env.production` was not copied into `D:\sugamflow-doc`

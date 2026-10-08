# Docker clean (Windows / Docker Desktop)

Local machine runbook. Use this when disk is tight or Docker commands return HTTP 500 / missing `dockerDesktopLinuxEngine`.

This machine: Docker Desktop at `D:\Docker\Docker`, WSL disks at `D:\Docker\WSL` (`main\ext4.vhdx` = VM, `disk\docker_data.vhdx` = images/data).

## Commands are separate lines

PowerShell does **not** treat `→` as a pipe. This fails:

```powershell
docker system df → docker image prune -af
```

`docker system df` then sees `-af` and reports `unknown shorthand flag: 'a'`.

Run one command per line:

```powershell
docker system df
docker image prune -af
docker builder prune -af
docker system df
```

## 1. Confirm the engine is up

```powershell
docker info --format "Server: {{.ServerVersion}}"
wsl -l -v
```

Healthy:

- `docker info` prints a server version (no pipe error, no HTTP 500).
- `docker-desktop` is **Running**.

Unhealthy (do not prune yet):

| Symptom | Meaning |
|---|---|
| `failed to connect ... dockerDesktopLinuxEngine ... cannot find the file specified` | Desktop / engine not running |
| `request returned 500 ... /v1.54/system/df` | Named pipe exists, Linux VM is not ready |
| `docker-desktop` **Stopped** + log `Failed to attach disk ... ext4.vhdx ... HCS/E_ACCESSDENIED` | Hyper-V/WSL cannot mount the Docker VM disk |

## 2. Recover the engine (if needed)

1. Start Docker Desktop: `D:\Docker\Docker\Docker Desktop.exe`.
2. If `com.docker.service` is Stopped, start it (Admin / UAC):

```powershell
Start-Service com.docker.service
```

3. If `docker-desktop` stays Stopped or `docker info` stays on HTTP 500, restart Hyper-V compute + WSL (Admin), then start the distro:

```powershell
Get-Process "Docker Desktop","com.docker.backend","com.docker.build" -ErrorAction SilentlyContinue | Stop-Process -Force
wsl --shutdown
Restart-Service vmcompute -Force
Restart-Service WSLService -Force
wsl -d docker-desktop -e echo dd-ok
Start-Process "D:\Docker\Docker\Docker Desktop.exe"
```

Wait until `wsl -l -v` shows `docker-desktop` **Running**, then retry `docker info`.

If attach still fails after that, reboot Windows, then open Docker Desktop and wait until the whale is steady.

Do **not** `wsl --unregister docker-desktop` or delete `D:\Docker\WSL\disk\docker_data.vhdx` to free space. That wipes images and volumes.

## 3. See what can be reclaimed

```powershell
docker system df
```

Example (before clean):

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          86        26        54.32GB   10.81GB
Containers      26        3         418.8MB   196.4MB
Local Volumes   7         5         6.753MB   0B
Build Cache     454       0         44.97GB   18.3GB+
```

## 4. Clean unused images

Removes dangling images and tagged images **not used by any container** (running or stopped).

```powershell
docker image prune -af
```

- `-a` = unused tagged images as well as dangling
- `-f` = no prompt

Images still referenced by a container stay.

## 5. Clean build cache

```powershell
docker builder prune -af
```

Next `docker build` will be a full rebuild (no incremental cache).

On this setup (containerd snapshotter), image **reported** size can also drop because BuildKit and images share snapshot layers.

## 6. Confirm

```powershell
docker system df
```

After image + builder prune (this machine, 2026-09-08):

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          25        25        7.894GB   0B
Containers      26        3         420.1MB   196.4MB
Local Volumes   7         5         6.753MB   0B
Build Cache     0         0         0B        0B
```

## Optional deeper clean (not default)

Only if you also want unused **stopped** containers and unused networks:

```powershell
docker container prune -f
docker network prune -f
```

Volumes:

```powershell
docker volume prune -f
```

That deletes unused volumes (named volumes not attached to a container). Do not run this if you need leftover DB/data volumes.

Full sweep (images + containers + networks + cache; volumes only with `--volumes`):

```powershell
docker system prune -af
# docker system prune -af --volumes
```

Prefer the targeted commands in sections 4–5.

## Logs

- Backend: `%LOCALAPPDATA%\Docker\log\host\com.docker.backend.exe.log`
- Search for `ext4.vhdx`, `E_ACCESSDENIED`, `still waiting for the engine`

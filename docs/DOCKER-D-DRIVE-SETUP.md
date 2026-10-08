# Docker fresh install on D: drive (SugamFlow local dev)

Use this after `scripts\uninstall-docker-complete.ps1` or when Docker is unstable on C:.

## Current layout (recommended)

| Item | Location |
|------|----------|
| SugamFlow repo | `D:\sugamFlow` |
| Docker disk image | `D:\Docker` (set in Docker Desktop UI) |
| PostgreSQL | Host `localhost:5432` (not in Docker) |
| Gateway | `http://localhost:9090` |
| Angular UI | `http://localhost:4200` |

**Do not** use a Windows junction from `%LOCALAPPDATA%\Docker` to D: — that often causes `ACCESS_DENIED` / MountDisk errors. Use Docker Desktop’s built-in **Disk image location** setting instead.

---

## Step 1 — Uninstall old Docker

Open **PowerShell as Administrator**:

```powershell
cd D:\sugamFlow
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\uninstall-docker-complete.ps1 -RemoveDDriveData
```

Reboot when finished.

---

## Step 2 — Install Docker Desktop

**Already installed on D: via script?** Skip download — use paths below.

| Item | Path |
|------|------|
| Docker app | `D:\Docker\Docker\Docker Desktop.exe` |
| WSL / disk data | `D:\Docker\WSL` |
| Installer (saved) | `D:\DockerInstall\DockerDesktopInstaller.exe` |

Re-run install (Admin):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File D:\sugamFlow\scripts\install-docker-d-drive.ps1
```

### Manual install (alternative)

1. Download: https://www.docker.com/products/docker-desktop/
2. **Admin CMD:**

```cmd
"D:\DockerInstall\DockerDesktopInstaller.exe" install --accept-license --quiet --installation-dir=D:\Docker\Docker --wsl-default-data-root=D:\Docker\WSL --windows-containers-default-data-root=D:\Docker\WindowsContainers
```

3. **Reboot** (recommended) so `docker` is on PATH.
4. Start **Docker Desktop** from Start menu or `D:\Docker\Docker\Docker Desktop.exe`
5. Confirm **Settings → Resources → Advanced → Disk image location** shows `D:\Docker\WSL` (or similar on D:)

---

## Step 3 — First-time SugamFlow stack (once after install)

```powershell
cd D:\sugamFlow
.\start-local.ps1 -Pull -SkipMail
```

Pull may take **15–30 minutes**. Verify:

```powershell
docker compose --env-file .env.local ps
```

Open: http://localhost:9090/actuator/health → should show `"status":"UP"`.

---

## Step 4 — Daily use

See `scripts\daily-start-sugamflow.cmd` and related scripts below.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pwsh` not recognized | Scripts use Windows PowerShell automatically (`start-local.ps1` fixed). |
| Docker won’t start | Admin: `.\scripts\repair-docker.ps1` or reboot. |
| APIs 500 / shops empty | Backend not ready — wait 5 min after compose up; check `docker compose ps`. |
| Port 4200 in use | `netstat -ano \| findstr ":4200"` then `taskkill /PID <pid> /F` |
| C: filling again | Confirm disk image is `D:\Docker`, not default on C:. |

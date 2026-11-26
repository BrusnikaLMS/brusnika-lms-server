# Brusnika LMS — Installation FAQ

Common questions and solutions collected from real support cases.

============================================================

## 1. Docker cannot connect to Docker Hub (i/o timeout, DeadlineExceeded)

**Symptom:**
```
target php: failed to solve: DeadlineExceeded: failed to fetch anonymous token:
Get "https://auth.docker.io/...": dial tcp ...:443: i/o timeout
```

**Cause:** the server has no direct internet access or Docker Hub is blocked.

**Solution:**
- Configure an HTTP proxy for the Docker daemon:
  ```bash
  mkdir -p /etc/systemd/system/docker.service.d
  cat > /etc/systemd/system/docker.service.d/proxy.conf <<EOF
  [Service]
  Environment="HTTP_PROXY=http://your-proxy:3128"
  Environment="HTTPS_PROXY=http://your-proxy:3128"
  Environment="NO_PROXY=localhost,127.0.0.1"
  EOF
  systemctl daemon-reload && systemctl restart docker
  ```
- Or configure an internal Docker registry mirror (Nexus, Harbor, etc.) in
  `/etc/docker/daemon.json`:
  ```json
  { "registry-mirrors": ["https://your-internal-mirror"] }
  ```

> **Note:** the `systemd` proxy config above only covers the Docker
> **daemon's** own network calls (pulling the `brusnikalms/brusnika-lms`
> image, etc.). It is **not** inherited by the containers spawned during
> `docker-compose build` (h5p, cforj, cforj-api) — those need their own
> proxy configuration. See question 2 if a build step fails with a
> network error even after setting up the daemon proxy.

============================================================

## 2. corepack cannot download pnpm (cforj Dockerfile error)

**Symptom:**
```
target cforj: failed to solve: process
"/bin/sh -c corepack enable && corepack prepare pnpm@8.15.0 --activate"
did not complete successfully: exit code: 1
```
Also seen with an explicit network error (npm registry temporarily
unavailable):
```
Internal Error: Server answered with HTTP 522 when performing the request
to https://registry.npmjs.org/pnpm/8.15.0
```

**Cause:** the Docker container cannot download pnpm from the internet —
either no network/proxy, or a transient npm registry hiccup (Cloudflare 522
and similar codes are not a config problem, just a temporary outage on
npm's side).

**Solution A — if it's a transient network hiccup (HTTP 522, etc.) — just retry:**
```bash
docker-compose build --no-cache cforj
# or the whole
./install.sh
```
In practice a retry almost always succeeds.

**Solution B — install corepack on the host and rebuild:**
```bash
npm install -g corepack
corepack enable
```
Then re-run `install.sh`.

**Solution C — replace the contents of `cforj/Dockerfile`:**
```dockerfile
FROM node:20-alpine AS builder

RUN npm install -g corepack && \
    corepack enable && \
    corepack prepare pnpm@8.15.0 --activate

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY server.js package.json ./
RUN mkdir -p courses
EXPOSE 3050
ENV PORT=3050
CMD ["node", "server.js"]
```

**Solution D — behind a corporate proxy:**
The daemon-level proxy from question 1 is **not enough** here — it only
covers the daemon's own pulls, not the network calls made *inside* a
build stage (like `corepack` fetching pnpm). Configure a client-level
build proxy instead; Docker/BuildKit automatically injects it as
`HTTP_PROXY`/`HTTPS_PROXY` build-args into every build stage:

```bash
mkdir -p ~/.docker
cat > ~/.docker/config.json <<EOF
{
  "proxies": {
    "default": {
      "httpProxy": "http://your-proxy:3128",
      "httpsProxy": "http://your-proxy:3128",
      "noProxy": "localhost,127.0.0.1,<DOMAIN>,<H5P_DOMAIN>,<CFORJ_DOMAIN>"
    }
  }
}
EOF
```

Then re-run `docker-compose build --no-cache cforj` (or the whole
`./install.sh`) — no daemon restart needed, this file is read by the
`docker` CLI on every build.

============================================================

## 3. install.sh fails with ENOENT src/index.template.html

**Symptom:**
```
errno: -2, code: 'ENOENT', syscall: 'open',
path: '/build/lms/src/index.template.html'
target php: failed to solve: process "... quasar build -d" did not complete successfully
```

**Cause:** after a successful first build, `install.sh` **deletes the
`lms/src/` folder** from the host (step 6 — "Removing source files from
the host"). On a second run the sources are missing.

**Solution:**
Restore `lms/src/` from the distribution archive before re-running:
```bash
# Unpack the distribution archive next to the current folder
unzip lms-install.zip -d /tmp/lms-restore
cp -r /tmp/lms-restore/lms-install/lms/src ./lms/
./install.sh
```

============================================================

## 4. 400 Bad Request after installation

**Symptom:** browser gets `400 Bad Request` when opening `https://<DOMAIN>`.

**Cause:** the host nginx sends the request to the Docker container over
`http://`, but the Docker nginx (`lms` service) listens on port 8443
over **HTTPS only**.

**Solution:** in the host nginx configs (`/etc/nginx/conf.d/lms.conf`,
`h5p.conf`, `cforj.conf`) replace `http://` with `https://` in the
`location /` block and add SSL proxy parameters:

```nginx
location / {
    proxy_pass             https://127.0.0.1:8443;
    proxy_ssl_verify       off;
    proxy_ssl_server_name  on;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

After the change:
```bash
nginx -t && systemctl reload nginx
```

============================================================

## 5. "conflicting server name" warnings in `nginx -t`

**Symptom:**
```
[warn] conflicting server name "lms.example.com" on 0.0.0.0:80, ignored
[warn] conflicting server name "lms.example.com" on 0.0.0.0:443, ignored
```

**Cause:** configs for the same domain exist in two places simultaneously:
`/etc/nginx/conf.d/` **and** `/etc/nginx/sites-enabled/`.

**Solution:** keep configs in only one location. Check:
```bash
grep -r "lms.example.com" /etc/nginx/
```
Remove duplicates from `sites-available/` and `sites-enabled/` if you use
`conf.d/`:
```bash
rm /etc/nginx/sites-enabled/lms.example.com.conf
rm /etc/nginx/sites-available/lms.example.com.conf
nginx -t && systemctl reload nginx
```

============================================================

## 6. SSL certificates are not picked up / SSL errors

**Symptom:** nginx fails to start or returns SSL errors after placing
certificates.

**Cause:** certificate file names do not match the `DOMAIN` variable in
`.env`.

**Required file names in the `ssl/` folder:**
```
ssl/<DOMAIN>.crt          ssl/<DOMAIN>.key
ssl/<H5P_DOMAIN>.crt      ssl/<H5P_DOMAIN>.key
ssl/<CFORJ_DOMAIN>.crt    ssl/<CFORJ_DOMAIN>.key
```
Verify names inside the container:
```bash
docker exec <lms-container> ls /etc/nginx/ssl/
```
Files must be named **exactly** as the `DOMAIN` value in `.env` (no
`www.` prefix, no extra suffixes).

If you have a wildcard certificate (`*.example.com`), create symlinks or
rename:
```bash
cp wildcard.crt ssl/lms.example.com.crt
cp wildcard.key ssl/lms.example.com.key
```

============================================================

## 7. Where to get APP_ID and APP_SECRET_CODE for Bitrix24

**Path in Bitrix24:**
Developers → Other → Local Applications → create a new application.

In the creation form specify:
- **Install URL:** `https://<DOMAIN>/install.php`
- **Handler URL:** `https://<DOMAIN>/index.php`
- Select all required scopes (see README.md, "Bitrix24 configuration")

After saving, open the created application card:
- "Application code" → paste as `APP_ID`
- "Application key" → paste as `APP_SECRET_CODE`

in `lms/local/include/constants.php`.

> **Important:** `<DOMAIN>` is the DNS name of your LMS server with a
> working SSL certificate. Bitrix24 does not accept IP addresses or
> `localhost`.

============================================================

## 8. 401 Unauthorized in browser console (app stuck on loading screen)

**Symptom:**
```
POST https://lms.example.com/api/useroption  401 (Unauthorized)
POST https://lms.example.com/api/entityItemGet  401 (Unauthorized)
```
The app is stuck on the loading screen (Brusnika.LMS logo spinning).

**Cause:** the server rejects the Bitrix24 authorization token. Possible
reasons:
- Incorrect `APP_ID` / `APP_SECRET_CODE`
- Outdated `middleware.php`

**Solution 1 — reinstall the local application in Bitrix24:**
Developers → Integrations → LMS → ⋮ → Edit → Reinstall.

**Solution 2 — update middleware.php:**
Take the current file from the distribution and copy it into the
container:
```bash
docker cp lms/local/api/middleware.php $(docker compose ps -q php):/var/www/html/local/api/middleware.php
```
Container rebuild is **not required**.

============================================================

## 9. Only administrators can log in; regular users get an error

**Symptom:** a non-admin user sees an access restriction message or
cannot open the application.

**Cause:** usually a consequence of the 401 authorization error — see
question 8. Also: moderators have not been added in LMS settings yet.

**Solution:**
1. Fix the authorization issue (question 8).
2. Log into LMS as a Bitrix24 administrator.
3. Open **Application Settings** → "Administrators" section → add the
   required users.

============================================================

## 10. Settings menu disappears / changes are not saved

**Symptom:** after adding moderators or changing settings, everything
resets on re-login. The settings menu disappears intermittently.

**Cause:** the 401 authorization error prevents the server from saving
data.

**Solution:** resolve the 401 error (question 8) — after that settings
will persist correctly.

============================================================

## 11. Changing APP_ID / APP_SECRET_CODE without redeploying the server

**Situation:** the local application keys in Bitrix24 have changed and
you need to update `APP_ID` and `APP_SECRET_CODE` on the server without
rebuilding Docker containers.

**Step 1 — edit the file on the host:**
```bash
nano /path/to/lms-server/lms/local/include/constants.php
```
Find and update these lines:
```php
define('APP_ID',          'new_client_id');
define('APP_SECRET_CODE', 'new_client_secret');
```

**Step 2 — copy the file into the running container:**
```bash
cd /path/to/lms-server
docker cp lms/local/include/constants.php $(docker compose ps -q php):/var/www/html/local/include/constants.php
```

**Step 3 — reinstall the local application in Bitrix24:**
Developers → Integrations → LMS → ⋮ → Edit → Reinstall.

Container rebuild is **not required**.

============================================================

## 12. 413 Request Entity Too Large when uploading files

**Symptom:**
```
POST https://lms.example.com/api/sendmedia?name=file.pdf  413 (Request Entity Too Large)
```
Files up to ~1 MB upload fine; larger files fail.

**Cause A — host nginx** limits the request body size to 1 MB by
default. The Docker nginx inside the container is already configured
for 512 MB, but the request never reaches it.

> If you used `setup.sh` — the configs are generated automatically with
> `client_max_body_size 512M`. This error only affects those who created
> nginx configs manually.

**Solution A:** add `client_max_body_size` to the `server` block of each
host nginx config (`lms.conf`, `h5p.conf`, `cforj.conf`):

```nginx
server {
    listen 443 ssl http2;
    server_name lms.example.com;

    client_max_body_size 512M;    # ← add this line

    location / {
        proxy_pass             https://127.0.0.1:8443;
        proxy_ssl_verify       off;
        proxy_ssl_server_name  on;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

After making the change:
```bash
nginx -t && systemctl reload nginx
```

**Cause B — PHP limits** (if `client_max_body_size` is already set but
413 persists). PHP defaults: `upload_max_filesize=2M`, `post_max_size=8M`.

**Solution B:** apply PHP settings to the container. Temporary fix
(until rebuild):
```bash
docker compose exec php bash -c "echo 'upload_max_filesize=512M
post_max_size=512M
memory_limit=512M
max_execution_time=300' > /usr/local/etc/php/conf.d/uploads.ini"
docker compose restart php
```

Permanent fix — update the `Dockerfile` (already included in the current
version):
```dockerfile
RUN { \
    echo 'upload_max_filesize = 512M'; \
    echo 'post_max_size = 512M'; \
    echo 'memory_limit = 512M'; \
    echo 'max_execution_time = 300'; \
    echo 'max_input_time = 300'; \
} > /usr/local/etc/php/conf.d/uploads.ini
```
After changing the Dockerfile, run `install.sh` or `update.sh`.

============================================================

## 13. "No space left on device" during image build

**Symptom:**
```
initdb: error: could not create directory "/var/lib/postgresql/data/pg_wal": No space left on device
```
or a similar error at any `docker-compose build`/`up` step.

**Cause:** a full h5p/cforj-api/cforj rebuild (`--no-cache`, which is
exactly how `install.sh` builds them) needs significant disk space; on
repeated installs/reinstalls old unused images accumulate and quickly
fill up the disk.

**Solution:**
```bash
df -h /                          # check free space
docker system df                 # see what's taking up space
docker image prune -a -f         # remove unused images
docker volume prune -f           # remove unused volumes
```
> `docker image prune -a` and `docker volume prune` only remove what's
> NOT referenced by any container — the active install is unaffected.
> We recommend at least 25-30 GB free before running `install.sh`.

============================================================

## 💬 Support
**Brusnika Solutions** — info@brusnika-solutions.com — https://brusnika-lms.com

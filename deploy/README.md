# PlinyPDF — Production Deployment Runbook

Soft-launch topology (Phase 1 test):

```
                      Cloudflare DNS
        plinypdf.com ─────────────────► Vercel  (Next.js frontend, own TLS)
   api.plinypdf.com ──(A → Hetzner IP)─► Caddy ──► Bun/Elysia backend :8080
                                                     └► Gotenberg (Docker, 127.0.0.1:3001)
```

**Why this shape:** auth is cookie-based. The session cookie is set with `Domain=.plinypdf.com`
so it is sent on requests from the frontend (`plinypdf.com`) to the backend
(`api.plinypdf.com`) — sibling subdomains of one registrable domain. A throwaway `*.vercel.app`
URL would break every authenticated backend call (AI Summarize, Pro checkout), which is why we
go domain-first.

---

## Phase B — Hetzner backend (run these on the server)

SSH in: `ssh root@<SERVER_IP>`

### 1. System packages
```bash
apt update && apt upgrade -y
# Docker + Compose
curl -fsSL https://get.docker.com | sh
# Git
apt install -y git
# Bun (installs to /root/.bun)
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
bun --version   # confirm
# Python + PyMuPDF (the cloud tools — Compress/Grayscale/PDF→JPG/merge/count —
# shell out to server/services/pdf-tools.py via python3)
apt install -y python3
python3 -m pip install --break-system-packages pymupdf
```

> **Fonts (PDF→JPG rendering) — for reference.** Ubuntu 24.04 already ships
> DejaVu + Noto fonts and `fontconfig` (`fc-list | wc -l` ≈ 130). You do **not**
> need to install font packages for PDF→JPG: PyMuPDF/MuPDF renders text with its
> **own bundled fonts** and does not consult system fontconfig. PDFs that render
> as block glyphs (████) have non-embedded / CID-Identity fonts MuPDF can't
> resolve — a font install won't fix them (investigated in Phase 10 Wave 10C;
> see `docs/phase_10/bugs.md`).

### 2. Clone the repo
```bash
git clone https://github.com/kerim-agayev/pliny_pdf.git /opt/pliny_pdf
cd /opt/pliny_pdf
bun install
```

### 3. Production env file
Create `/opt/pliny_pdf/.env.local` (copy your local secrets; change only the wiring vars):
```bash
# --- wiring (PRODUCTION values) ---
NEXT_PUBLIC_API_URL=https://api.plinypdf.com
FRONTEND_ORIGIN=https://plinypdf.com
SERVER_PORT=8080
COOKIE_DOMAIN=.plinypdf.com
TRUSTED_ORIGINS=https://plinypdf.com,https://api.plinypdf.com

# --- Gotenberg ---
GOTENBERG_URL=http://localhost:3001
GOTENBERG_CONTAINER=pliny_pdf-gotenberg-1

# --- auth ---
BETTER_AUTH_SECRET=<same secret as local>
BETTER_AUTH_URL=https://plinypdf.com
GOOGLE_CLIENT_ID=<...>
GOOGLE_CLIENT_SECRET=<...>

# --- the rest: copy verbatim from local .env.local ---
DATABASE_URL=<...>
UPSTASH_REDIS_REST_URL=<...>   UPSTASH_REDIS_REST_TOKEN=<...>
R2_ACCOUNT_ID=<...>   R2_ACCESS_KEY_ID=<...>   R2_SECRET_ACCESS_KEY=<...>   R2_BUCKET=<...>   R2_ENDPOINT=<...>
SENTRY_DSN=<...>
```
> The backend is the only place the heavy secrets (Gotenberg/R2/Upstash) need to live.
> (Gemini AI Summarize and Lemonsqueezy billing were removed — see `docs/decisions.md`.)

### 4. Gotenberg container
```bash
docker compose -f docker-compose.prod.yml up -d
docker ps   # expect pliny_pdf-gotenberg-1, 127.0.0.1:3001->3000
```

### 5. systemd service for the backend
```bash
cp deploy/plinypdf-backend.service /etc/systemd/system/plinypdf-backend.service
systemctl daemon-reload
systemctl enable --now plinypdf-backend
systemctl status plinypdf-backend --no-pager     # active (running)
curl -s localhost:8080/api/health                # {"ok":true,"service":"plinypdf-backend"}
```
> If bun is not at `/root/.bun/bin/bun`, run `which bun` and edit `ExecStart` in the unit file.

### 6. Firewall (UFW)
```bash
ufw allow 22 && ufw allow 80 && ufw allow 443
ufw enable
ufw status
```
> Do **not** open 8080 or 3001 — Caddy proxies 8080 internally; Gotenberg is localhost-only.

### 7. DNS for the API subdomain (do before Caddy so cert issuance works)
In Cloudflare: add an **A record** `api` → `<SERVER_IP>`, **DNS only (grey cloud)** so Caddy can
complete the Let's Encrypt HTTP challenge. Wait until `dig api.plinypdf.com` returns the IP.

### 8. Caddy reverse proxy + SSL
```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

cp deploy/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
journalctl -u caddy --no-pager | tail -20    # watch for successful cert issuance
```

### ✅ GATE 1
From your own machine (outside the server):
```bash
curl https://api.plinypdf.com/api/health
# {"ok":true,"service":"plinypdf-backend"}
```

---

## Phase C — Vercel frontend + domain (run in the browser/dashboards)

### 1. Connect repo
Vercel → New Project → import `kerim-agayev/pliny_pdf`.
- Framework preset: **Next.js**
- Install Command: `bun install`
- Build Command: `bun run build`

### 2. Vercel environment variables
Set these (Production scope):
```
NEXT_PUBLIC_API_URL=https://api.plinypdf.com
BETTER_AUTH_URL=https://plinypdf.com
COOKIE_DOMAIN=.plinypdf.com
TRUSTED_ORIGINS=https://plinypdf.com,https://api.plinypdf.com
DATABASE_URL=<...>
BETTER_AUTH_SECRET=<same secret as the backend>
GOOGLE_CLIENT_ID=<...>
GOOGLE_CLIENT_SECRET=<...>
```
> The Next.js side runs the Better Auth handler (`/api/auth/*`) and the dashboard server
> component, so it needs DB + auth + the cookie/origin vars. It does **not** need
> GOTENBERG_*, R2_*, or UPSTASH_* — those are backend-only.

### 3. Deploy + custom domain
Deploy. Then Vercel → Settings → Domains → add `plinypdf.com` (and `www.plinypdf.com`).
Follow Vercel's DNS instructions in Cloudflare for the root domain (CNAME/A per Vercel).

### 4. Google OAuth redirect URI
Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs, add:
```
https://plinypdf.com/api/auth/callback/google
```

### ✅ GATE 2 — end-to-end on https://plinypdf.com (incognito)
- [ ] Signup (email or Google) works
- [ ] PDF→Word works (cloud, backend reachable, cookie sent)
- [ ] Watermark live preview works (local)
- [ ] Dashboard loads, shows usage

---

## Redeploys (no CI/CD — by design, Simplicity First)

- **Frontend:** `git push origin main` → Vercel auto-deploys.
- **Backend:** on the server:
  ```bash
  cd /opt/pliny_pdf && git pull && bun install && systemctl restart plinypdf-backend
  ```

## Troubleshooting
- **Caddy cert fails:** the `api` A record must be DNS-only (grey cloud) and resolving before
  reload. Check `journalctl -u caddy`.
- **Auth works on frontend but cloud tools 401:** confirm `COOKIE_DOMAIN=.plinypdf.com` is set on
  BOTH Vercel and the server, and that you are on `https://plinypdf.com` (not the vercel.app URL).
- **DNS not propagated:** wait ~10 min, re-check with `dig`.
- **Backend down:** `systemctl status plinypdf-backend`, `journalctl -u plinypdf-backend -n 50`.

---

## ✅ Domain launch — DONE (2026-06-04)

`plinypdf.com` is purchased (Cloudflare) and **production is live**. All steps below are
complete; GATE C (full e2e) passed. Kept here as the executed record.

1. ✅ **Phase B7 — DNS:** Cloudflare `A` record `api` → `49.13.119.27`, **DNS-only (grey cloud)**.
2. ✅ **Phase B8 — Caddy:** installed on Hetzner, `deploy/Caddyfile` → `/etc/caddy/Caddyfile`,
   reloaded; Let's Encrypt cert auto-issued.
   → **GATE 1 passed:** `https://api.plinypdf.com/api/health` returns the health JSON.
3. ✅ **Phase C — Vercel:** repo connected, Production env set (NEXT_PUBLIC_API_URL,
   BETTER_AUTH_URL, COOKIE_DOMAIN, TRUSTED_ORIGINS, NEXT_PUBLIC_SITE_URL, PostHog +
   Sentry keys), custom domains `plinypdf.com` + `www.plinypdf.com` added, root DNS → Vercel.
4. ✅ **Hetzner prod env:** `/opt/pliny_pdf/.env.local` updated (FRONTEND_ORIGIN + TRUSTED_ORIGINS
   apex+www, COOKIE_DOMAIN=.plinypdf.com, SENTRY_DSN), backend restarted.
5. ✅ **Google OAuth:** redirect URI `https://plinypdf.com/api/auth/callback/google` + JS origin.
6. ✅ **Lemonsqueezy:** webhook → `https://api.plinypdf.com/api/webhooks/lemonsqueezy`
   (**still test mode** — switch to live before accepting real payments).
7. ✅ **Analytics:** PostHog (EU region) + Sentry (frontend @sentry/nextjs + backend @sentry/bun).
   → **GATE C passed:** full incognito e2e — home, local + cloud tools, email + Google auth,
   AI Summarize, test-card Pro upgrade, /en /tr /ru, PostHog events, Sentry capture.

**Note (multi-origin):** serving apex + www makes `FRONTEND_ORIGIN` a comma-separated list;
the backend splits it (array → CORS, first origin → checkout redirect). A future 301 www→apex
would let it collapse back to a single origin. See `docs/decisions.md`.

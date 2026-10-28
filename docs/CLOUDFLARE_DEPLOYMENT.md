# Cloudflare deployment — Taytay Textile Co.

Worker: `taytaygarments`. GitHub repository: `kelbrictech/taytaygarments`, branch `main`. Entrypoint: `src/worker.ts`; static assets: `public/`.

## Recommended GitHub path

1. In Cloudflare, create an API token with permission to deploy the existing Workers script and retrieve your account ID. Do not put either value in repository files or chat.
2. In GitHub repository → Settings → Secrets and variables → Actions, add the repository **secrets** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
3. In Cloudflare → Workers & Pages → **taytaygarments** → Settings → Variables and Secrets, add:
   - `DATABASE_URL` secret: Neon pooled PostgreSQL URL for the existing `taytay_textile` database.
   - `ADMIN_API_TOKEN` secret: strong random token >=64 characters.
   - `IP_HASH_PEPPER` secret: independent strong random value >=64 characters.
4. In GitHub → Actions → **Deploy Taytaygarments to Cloudflare** → Run workflow. The workflow checks source, runs tests and deploys with `--keep-vars`.
5. GitHub → Actions → **Live backend readiness** → Run workflow. Verify successful health and catalog checks. If it reports database connection missing, inspect the Worker secret for this exact worker name and redeploy.

For the public submission feature, deploy a Cloudflare Turnstile widget by setting `TURNSTILE_SITE_KEY` as a Worker variable and `TURNSTILE_SECRET` as a Worker secret, set `SITE_STATUS="production"`, and only change `INQUIRIES_ENABLED="true"` after legal/privacy, staff access, and notification controls pass review. Submit a controlled test and verify its status from `/track.html`.

## Existing verification

- GitHub has a real Cloudflare Workers app, not a Pages-only site.
- Static site was HTTP 200 on the live smoke test.
- October 28, 2026 live check failed the backend gate: `databaseConfigured:false`, and `/api/v1/products` returned HTTP 503. This is not a successful full-stack deployment.
- Neon separately returned 12 products, and the repo contains valid server SQL and domain tests. A Cloudflare secret is required to connect the two.

## Security notes

- The business name remains provisional; public pages are `noindex`.
- Concepts are illustrative, not guaranteed stock.
- Protect `/admin.html` and admin API routes with Cloudflare Access; application bearer token remains required.
- Do not accept public RFQs without a privacy notice, Turnstile, approved contact channels, notification workflow, and operations monitoring.
- No customer artwork is currently uploaded. A tracking reference indicates inquiry receipt only.

# Cloudflare deployment — Taytay Textile Co.

Worker: `taytaygarments`. GitHub repository: `kelbrictech/taytaygarments`, branch `main`. Entrypoint: `src/worker.ts`; static assets: `public/`.

## Verified native GitHub deployment

Cloudflare Workers Builds is **already connected** to the GitHub repository. GitHub's Cloudflare Workers and Pages check-run on commit `a3091c0` was successful. It links to the Worker build record. The production site is https://taytaygarments.arjayb-fb.workers.dev/#/resources.

Commits pushed to the configured production branch (`main`) are automatically built/deployed by Cloudflare Workers Builds. Separate GitHub Actions deployment, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets are unnecessary and are **not** part of this project's deployment path.

1. In Cloudflare → Workers & Pages → **taytaygarments** → Settings → Builds, ensure Git repository is `kelbrictech/taytaygarments` and production branch is `main`.
2. In Cloudflare → Workers & Pages → **taytaygarments** → Settings → Variables and Secrets, add:
   - `DATABASE_URL` secret: Neon pooled PostgreSQL URL for the existing `taytay_textile` database.
   - `ADMIN_API_TOKEN` secret: strong random token >=64 characters.
   - `IP_HASH_PEPPER` secret: independent strong random value >=64 characters.
3. Deploy the secret changes in Cloudflare. Do not put values in GitHub, repository files, screenshots or chat.
4. Verify `GET /api/health` reports `databaseConfigured:true` and `GET /api/v1/products` returns HTTP 200 with 12 product records.
5. Run GitHub → Actions → **Live backend readiness** → Run workflow to verify both endpoints independently. If the database is still missing, inspect secret configuration on this exact Worker. Monitor future Cloudflare checks alongside GitHub CI.

For the public submission feature, deploy a Cloudflare Turnstile widget by setting `TURNSTILE_SITE_KEY` as a Worker variable and `TURNSTILE_SECRET` as a Worker secret, set `SITE_STATUS="production"`, and only change `INQUIRIES_ENABLED="true"` after legal/privacy, staff access, and notification controls pass review. Submit a controlled test and verify its status from `/track.html`.

## Existing verification

- GitHub confirmed a successful native Cloudflare Workers Builds check on commit `a3091c0`, separate from the GitHub CI test status.
- Static site was HTTP 200 on the live smoke test.
- October 28, 2026 live check failed the backend gate: `databaseConfigured:false`, and `/api/v1/products` returned HTTP 503. This is not a successful full-stack deployment.
- Neon separately returned 12 products, and the repo contains valid server SQL and domain tests. A Cloudflare secret is required to connect the two.

## Security notes

- The business name remains provisional; public pages are `noindex`.
- Concepts are illustrative, not guaranteed stock.
- Protect `/admin.html` and admin API routes with Cloudflare Access; application bearer token remains required.
- Do not accept public RFQs without a privacy notice, Turnstile, approved contact channels, notification workflow, and operations monitoring.
- No customer artwork is currently uploaded. A tracking reference indicates inquiry receipt only.

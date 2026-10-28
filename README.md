# Taytay Textile Co. — full-stack development site

**Brand status: provisional.** Clear DTI/SEC/IPOPHL/domain name availability before representing this as a legal company. Concepts must not be represented as existing inventory.

## Architecture

Cloudflare Workers + static Assets frontend, TypeScript API, Neon PostgreSQL (existing project `fancy-water-27345430`, `taytay_textile` in Singapore), committed product concepts and optional Cloudinary URLs.

- `/` — mobile-responsive website and virtual showroom.
- `/api/health` — backend health and public inquiry availability (no secrets).
- `/api/v1/products` — live published catalog with product colors and media.
- `POST /api/v1/inquiries` — consent-based inquiry storage; disabled until launch controls are enabled.
- `/track.html` and `GET /api/v1/inquiries/{reference}/status?email=` — customer tracking; no personal details returned.
- `/admin.html` and `/api/v1/admin/*` — protected catalog and inquiry operations; access policy still required.

## Local validation

```sh
npm install
npm run typecheck
npm test
npm run dev
```

Backend unit tests use mocked database results. Live database and deployment status are checked separately in GitHub Actions.

## Required deployment configuration

Follow [Full-stack runbook](docs/FULL_STACK_RUNBOOK.md) and [Cloudflare deployment](docs/CLOUDFLARE_DEPLOYMENT.md).

- Cloudflare Worker name is `taytaygarments` in `wrangler.toml`.
- Set encrypted `DATABASE_URL`, `ADMIN_API_TOKEN`, `IP_HASH_PEPPER` in the correct Worker.
- `INQUIRIES_ENABLED` defaults to `false` and must stay false until all launch gates pass.
- `TURNSTILE_SITE_KEY` (public variable) and `TURNSTILE_SECRET` (secret) are required when `SITE_STATUS=production` and inquiries are enabled.
- The existing **Cloudflare Workers Builds → GitHub** connection deploys commits from `main`; verified successful Cloudflare check on commit `a3091c0` (2026-10-28). Do not add another GitHub Actions deployment or repository Cloudflare API credentials. Production URL: https://taytaygarments.arjayb-fb.workers.dev/#/resources.
- Database migrations: `db/001_initial.sql`, `db/002_seed_concepts.sql`, `db/003_sync_campus_polo_media.sql`; existing Neon project retains all data.

## Verified / not yet verified

- GitHub CI: 13 tests passed on full-stack build `a2b87e7`.
- Live Playwright mobile and garment regression: passed for that commit.
- Neon: exact catalog SQL executed, 12 product records returned; Campus Polo 4 variants and 12 media records after applying migration 003.
- Cloudflare Workers Builds completed successfully for commit `a3091c0`, independently confirmed using the Cloudflare GitHub check run. This verifies the build, not database readiness. Last executed live readiness check (2026-10-28) reported `databaseConfigured:false` and product HTTP 503; recheck after configuring the Worker secret.
- Real public inquiry submission: NOT TESTED. Admin access policy, legal/privacy notice, Turnstile production keys, and staff notification remain launch blockers.

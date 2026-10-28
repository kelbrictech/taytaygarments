# Taytay Textile Co. — full-stack development site

**Brand status: provisional.** Clear DTI/SEC/IPOPHL/domain name availability before representing this as a legal company. Concepts must not be represented as existing inventory.

## Architecture

Cloudflare Workers + static Assets frontend, TypeScript API, Neon PostgreSQL (existing project `fancy-water-27345430`, `taytay_textile` in Singapore), committed product concepts and optional Cloudinary URLs.

- `/` — mobile-responsive website and virtual showroom.
- `/api/health` — backend health and public inquiry availability (no secrets).
- `/api/v1/products` — live published catalog with product colors and media.
- `POST /api/v1/inquiries` — consent-based inquiry storage; disabled until launch controls are enabled.
- `/track.html` and `GET /api/v1/inquiries/{reference}/status?email=` — customer tracking; no personal details returned.
- `/portal.html` — customer, staff, administrator and webmaster sign-in with a role-specific dashboard.
- `/admin.html` — redirects to the new portal; the legacy token-only `/api/v1/admin/*` routes return HTTP 410.
- `/#/careers` — careers preview with *sample positions only*.
- `/#/taytay-hub` — sourced Taytay garment industry feature, recognizing the officially used “Garments Capital of the Philippines” designation.
- `/api/v2/auth/*` — hashed-password demo accounts, secure HttpOnly sessions, admin-approved staff access and password change.
- `/api/v2/orders`, `/api/v2/orders/:number/events` — customer-owned order history and milestone tracking; staff orders pipeline.
- `/api/v2/stock`, `/api/v2/stock/movements`, `/api/v2/suppliers`, `/api/v2/purchase-orders` — IMS stock, reorder alerts, supplier management, POs, administrator issuance and goods receipts.
- `/api/v2/cms` — webmaster text publishing under allowlisted content slugs. Other roles are denied.
- `/api/v2/users` — administrator-only staff approval. Customers and staff cannot elevate their role.

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
- Set encrypted `DATABASE_URL` and `IP_HASH_PEPPER` in the correct Worker. The former `ADMIN_API_TOKEN` is retired; no bearer-token-only admin access remains.
- Passwords for the seeded accounts are **not** in the repository. The five accounts are documented by role in `docs/CLIENT_DEMO_GUIDE.md`; passwords were shared only with the project owner.
- `INQUIRIES_ENABLED` defaults to `false` and must stay false until all launch gates pass.
- `TURNSTILE_SITE_KEY` (public variable) and `TURNSTILE_SECRET` (secret) are required when `SITE_STATUS=production` and inquiries are enabled.
- The existing **Cloudflare Workers Builds → GitHub** connection deploys commits from `main`; verified successful Cloudflare check on commit `a3091c0` (2026-10-28). Do not add another GitHub Actions deployment or repository Cloudflare API credentials. Production URL: https://taytaygarments.arjayb-fb.workers.dev/#/resources.
- Database migrations: `db/001_initial.sql` through `db/007_demo_suppliers_po.sql`; the live Neon project has received additive schema and demo fixture migrations while preserving existing product data.

## Verified / not yet verified

- GitHub CI: original RFQ tests plus additional role/CSRF tests verified in GitHub Actions. Check the latest commit's CI run for current status.
- Mobile and garment regression suite passed before the multifaceted site extension; rerun it against the latest commit for fresh layout coverage.
- Neon: exact catalog SQL executed, 12 product records returned; Campus Polo 4 variants and 12 media records after applying migration 003.
- Cloudflare Workers Builds completed successfully for commit `a3091c0`, independently confirmed using the Cloudflare GitHub check run. This verifies the build, not database readiness. Last executed live readiness check (2026-10-28) reported `databaseConfigured:false` and product HTTP 503; recheck after configuring the Worker secret.
- Real public inquiry submission: NOT TESTED. Admin access policy, legal/privacy notice, Turnstile production keys, and staff notification remain launch blockers.

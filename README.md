# Taytay Textile Co. — development full-stack website

**Provisional brand**: Public search surfaced a possible existing “Taytay Textile Company”. Clear SEC, DTI, IPOPHL and domain availability before business use.

## Stack
- Approved Loomfield prototype rebranded and preserved with 20 routes and virtual showroom.
- Cloudflare Workers API with static assets (Wrangler v4).
- Neon PostgreSQL, dedicated project `fancy-water-27345430` and database `taytay_textile`, Singapore.
- Cloudinary product concept photographs; URLs in Neon media records.

## Setup
1. `npm install` and `npm run typecheck`.
2. `npx wrangler login` in the **intended Cloudflare account**.
3. `npx wrangler secret put DATABASE_URL` (pooled Neon connection URI), `npx wrangler secret put ADMIN_API_TOKEN` (32+ random characters), `npx wrangler secret put IP_HASH_PEPPER` (64 random characters).
4. `npm run dev` to test. `npm run deploy` to deploy to Cloudflare Workers with Assets.
5. Test `/api/health`, `/api/v1/products` and controlled inquiry submission before sharing publicly.

## APIs
- `GET /api/health`: configuration health.
- `GET /api/v1/products`: live published product catalog, variant and angle media.
- `POST /api/v1/inquiries`: persists RFQs and returns tracking reference, requires consent.
- `GET /api/v1/admin/inquiries`: protected with Bearer ADMIN_API_TOKEN.
- `PATCH /api/v1/admin/inquiries/{reference}/status`: protected workflow status update.

## Deployment gates
The page remains noindex until legal name clearance and verified company information. Product imagery is **concept-only**, not real inventory. Files are **not uploaded** via the quote form. Add Cloudflare Turnstile widget + secret, notification delivery, privacy policy, and production monitoring before accepting real public traffic. This branch must not be considered deployed until a public URL and live API responses are independently verified.

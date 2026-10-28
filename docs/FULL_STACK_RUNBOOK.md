# Full-stack deployment — Taytay Textile Co.

## Actual architecture

- Frontend: public/ served by Cloudflare Workers Assets, mobile responsive.
- Backend: src/worker.ts, Cloudflare Worker API on the same origin.
- Database: existing Neon project fancy-water-27345430, database taytay_textile, Singapore.
- Product media: committed WebP assets, with optional Cloudinary media URLs in Neon.
- Admin: /admin.html with Bearer token; place it behind Cloudflare Access before staff use.
- Customer: /track.html for reference + matching email; only inquiry state and date returned.

## Deploy readiness (do in the Cloudflare account that owns taytaygarments)

1. Worker is named **taytaygarments** in wrangler.toml. Do not set a different name in the dashboard.
2. In Cloudflare Workers & Pages → taytaygarments → Settings → Variables and Secrets set:
   - DATABASE_URL (Secret): existing Neon pooled connection string for taytay_textile.
   - IP_HASH_PEPPER (Secret): fresh cryptographically secure random value, >=64 characters.
   - ADMIN_API_TOKEN (Secret): distinct fresh cryptographically secure random value, >=64 characters.
3. Run the build on main or deploy with `npm install && npm run typecheck && npm test && npx wrangler deploy`.
4. Verify `GET /api/health` returns `databaseConfigured:true`, and `GET /api/v1/products` HTTP 200 with a JSON products array, not the static fallback.
5. Add Cloudflare Access to /admin.html (and ideally /api/v1/admin/*) with approved users only. The bearer token is still required.
6. For public inquiry intake, implement Cloudflare Turnstile configuration with a site key (public variable TURNSTILE_SITE_KEY) and secret (secret TURNSTILE_SECRET). Set SITE_STATUS="production" only when these are configured.
7. Publish an accurate privacy notice; confirm business identity, contact channels, consent handling, staff notification workflow, data retention, and customer support.
8. Only after gates 1–7, change INQUIRIES_ENABLED="true" in wrangler.toml and deploy.
9. Submit one controlled test inquiry. Confirm HTTP 201, reference lookup from /track.html, and staff status update via /admin.html. Delete any test personal data by an approved retention procedure.

## Validation

- `npm run typecheck` — Worker TypeScript.
- `npm test` — domain and API handler tests using a fake database (does not certify production Neon connectivity).
- Live frontend tests cover mobile layout and concepts.
- A dedicated backend-readiness workflow fails until the live API returns an actual catalog from Neon.

## Safety facts

- Current products and photographs are *concepts*, not actual factory inventory.
- No customer artwork is uploaded.
- The quote receipt confirms an inquiry, not an accepted order or guaranteed price.
- The application does not manage payments or fulfillment.
- Never commit DATABASE_URL or bearer credentials.
- The current SQL seed script is intended for fresh setup; existing 12 seeded products in Neon are preserved.

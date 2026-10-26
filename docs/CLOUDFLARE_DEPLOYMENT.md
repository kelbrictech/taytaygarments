# Cloudflare deployment — Taytay Textile Co. development environment

## Verified repository
- GitHub owner: `kelbrictech`
- Repository: `KELBRIC-UI-LAB`
- Git branch: `taytay-textile-fullstack-v1` (NOT `main`)
- Root directory: `taytay-textile-co`
- Worker name: `taytay-textile-co` (must match `wrangler.toml` exactly)
- Build command: `npm install && npm run typecheck && npm test`
- Deploy command: `npx wrangler deploy`
- Static assets are served by Workers Assets from `public/`.

## Cloudflare setup (user account required)
1. Open Cloudflare dashboard → **Workers & Pages** → **Create application**.
2. Select **GitHub**, authorize access to the repo, select `kelbrictech/KELBRIC-UI-LAB`.
3. Name worker `taytay-textile-co`, target branch `taytay-textile-fullstack-v1`.
4. Set root directory `taytay-textile-co`.
5. Set build/deploy commands above, create the Worker.
6. Under Worker → Settings → Variables and Secrets, set:
   - `DATABASE_URL`: pooled Neon PostgreSQL connection URL for project `fancy-water-27345430`, database `taytay_textile`; secret, never in Git.
   - `ADMIN_API_TOKEN`: strong random 64-character value, secret.
   - `IP_HASH_PEPPER`: strong random 64-character value, secret.
   - `TURNSTILE_SECRET`: **do not set** until the corresponding frontend Turnstile widget is wired and tested; otherwise all forms are rejected.
7. Redeploy once secret variables are in place and verify `https://<assigned-subdomain>/api/health` returns `databaseConfigured:true`.
8. Verify `/api/v1/products` returns 12 concept products and each image URL loads.
9. Submit a test inquiry using a designated test contact and verify the reference and database row. Clean up test PII before public launch.
10. Verify `/admin.html` through Cloudflare Access before allowing real staff to use it.

## Safety and production gates
- Current business name is provisional; retain `noindex` until legal clearance.
- All 12 product images are concept images; no actual client production guarantees.
- No side/back garment images are approved yet; the UI should not imply they're present.
- No actual client reviews, logos, or compliance certificates may be invented.
- Do not take public RFQs until legal privacy notice, Turnstile widget, staff account access, notification routing, and monitoring are implemented.
- Never publish Neon connection strings, admin bearer token, or Cloudflare API tokens in GitHub issues, chats, or screenshots.
- Cloudflare Pages alone is not configured; this is a Cloudflare **Workers + Static Assets** app.

## Verification status as of 2026-10-26
- GitHub branch/files: verified
- Neon database/schema/12 seeded products: verified
- Cloudinary 12 concept assets: verified
- Cloudflare Worker live deployment: **NOT VERIFIED / NO ACCOUNT CONNECTION**
- End-to-end public RFQ submission: **NOT TESTED**
- Production security audit: **NOT COMPLETE**

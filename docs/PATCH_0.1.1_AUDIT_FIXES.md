# Patch 0.1.1 — audit fixes (5 Nov 2026)

Scope: low-risk corrections from the November 2026 audit. No visual redesign and no brand-colour change is included; those await design approval.

## Changed

| Area | Change | Audit ref |
|---|---|---|
| Headers | New `public/_headers`: nosniff, frame denial, referrer policy, permissions policy, HSTS (1 year, no subdomains/preload) and a **report-only** CSP. Needed because `run_worker_first = ["/api/*"]` means pages bypass the Worker's header wrapper. | H1, H2 |
| Dead code | Removed the unreachable `/api/v1/admin/*` handlers, `authorize()`, and `ADMIN_API_TOKEN` (type, `.env.example`, deployment docs). The 410 response for that path prefix remains. | M6 |
| Orders | `delivered` and `cancelled` are now terminal, and an order at `dispatch` can only move to `delivered` or `cancelled`. Enforced inside the existing atomic UPDATE. | M2 |
| Login | Lockout is now per email+IP pair (8 failures / 15 min), with ceilings of 30 per IP and 60 per email. A stranger can no longer lock out a known email from another address. | M1 |
| Turnstile | Verification call now times out after 5 s and fails closed. | M5 |
| Quote form | `autocomplete` on organisation, name and email (WCAG 1.3.5). | A11y |
| Layout | `scroll-padding-top` so anchored and focused content is not hidden under the sticky header. | A11y |
| No-JS | `<noscript>` message inside `#app`. | H4 |
| Tests | Three stale copy-assertion tests reconciled with the current site; new tests added for each change above. | H5 |

## Deliberately not changed (needs a decision or a live environment)

- **Password hashing (H3):** PBKDF2 at 600,000 iterations may exceed the Workers limit. Test login on a deployed preview Worker before changing anything.
- **Colours, focus ring, typography:** visual changes wait for design approval.
- **History-API routing, sitemap, robots, canonical, Open Graph:** need the final production domain and a routing decision.
- **CSP enforcement:** requires moving inline CSS/JS to external files first.
- **QMS separation of duties, DB-level immutability, atomic audit rows (M3, M4):** need policy decisions.
- **Hero image dimensions/`fetchpriority`, `srcset`:** need the real source images and measured baselines.
- **Turnstile hostname/action check:** skipped to avoid a production form failure that cannot be tested here.

## Verify after deploy

1. `curl -sI <site>/portal.html` shows the new headers.
2. Browser console on the home page shows CSP report-only messages (expected) and no functional breakage.
3. Login works on the deployed Worker (H3).
4. An order at `dispatch` cannot be moved back to `production`.

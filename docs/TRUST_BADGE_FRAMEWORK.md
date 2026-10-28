# Buyer Trust Badge Framework — implementation and evidence standard
Last researched: 2026-10-28. Canonical reference: `taytay_garments_global_trust_framework.md` supplied by project owner.

## Purpose
Present the Taytay factory's Filipino design identity and a buyer-facing verification workflow with no fabricated government seals, claimed registrations, paid memberships, certification marks, factory audit outcomes, or product safety claims.

## Deployed design
- Landing: original typographic **PROUD PHILIPPINE MADE** identity mark in existing pine/copper/cream color system. The wording celebrates the brand's Philippine and Taytay heritage; it does not independently establish a product's country of origin. Never use it as a certification, customs origin ruling, verified manufacturer registration or government seal.
- Landing: three linked trust/heritage navigation badges, not certification endorsements.
- `/#/trust`: filterable 22-entry due diligence research directory backed by `ttc_trust_badges` in existing Neon, all initially `research`.
- `GET /api/v2/trust`: public disclosure of the issuer's informational context. A fully documented entry may display its reference, link and validity period; expired/withdrawn/submitted entries are publicly marked unverified.
- `GET /api/v2/trust/manage`: admin/webmaster only.
- `PATCH /api/v2/trust/:slug/proof`: admin/webmaster evidence proposal; resets status to submitted.
- `PATCH /api/v2/trust/:slug/review`: admin-only review. Requires submitted proof for `documented`; audit event retained.
- No official organization logos or certification badges reproduced. All site marks are original, first-party typography.
- A documented entry means **company-reviewed evidence**, never independent certification by this software.

## Important corrections to the uploaded proposed framework
- **Sedex SMETA** is an audit methodology, not certification, and does not issue a pass/fail. Source: https://www.sedex.com/what-we-do-at-sedex/
- **ISO** does not certify companies, and generally prohibits use of its own logo to signal certification. Use the issued certification body's permitted mark with a verifiable certificate. Source: https://www.iso.org/certification.html
- **WRAP** Certified Facility mark requires valid facility certification; WRAP trademarks have a strict usage policy. Source: https://wrapcompliance.org/en/certification/
- **OEKO-TEX STANDARD 100** product/component scope and validity must match the exact certificate and label-check number. Source: https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100
- **GOTS and GRS** claims require the relevant authorized scope and transaction certification; do not imply factory-wide certification based on certified supplier fabric. Sources: https://global-standard.org/ ; https://textileexchange.org/
- **DTI Philippine Trustmark** is an issued, verifiable government e-commerce badge, with security number and QR code. Never claim it prior to issuance. Source: https://trustmark.dti.gov.ph/
- **DOLE** does not issue generic 100% compliance certificates under the more recent inspection approach; independent documentation review is more accurate than a self-awarded “100% Compliant & Anti-Sweatshop” seal. Source: https://car.dole.gov.ph/news/dole-ensures-safe-and-healthy-workplace-dole-do-183/
- **Taytay heritage**: the official municipal site calls Taytay the Garments Capital of the Philippines. This is a place identity and cannot certify a particular company. Source: https://www.taytayrizal.gov.ph/

## Required evidence before public documentation
Capture the legal entity name, scope or site/product covered, issuer, certificate/report/membership reference, third-party validation URL, validity and brand/trademark license where required. The current demo review system stores a URL and reference and requires human review; it does not authenticate an external registry automatically.

## Test and launch gates
Execute `npm run typecheck` and `npm test`; CI checks `public/trust-center.js`. Test the live `/api/v2/trust`, the `/#/trust` route, and narrow-screen wrapping after a successful Cloudflare build.
The demo site's brand registration, manufactured product origin and all 22 memberships/certifications remain **unverified** unless independent client evidence is provided.
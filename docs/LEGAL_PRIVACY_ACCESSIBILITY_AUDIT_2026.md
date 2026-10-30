# Taytay Textile Co. — legal, privacy, claims & accessibility audit
**Date:** 2026-10-30 · **Environment:** Cloudflare Worker prototype connected to GitHub/Neon · **Position:** pre-commercial readiness, no legal sign-off

## Basis

This audit follows the client-provided image checklist and reviews the repository's actual deployed architecture (homepage, quotation form, customer login, staff/admin portal, inquiry tracker, product assets, Neon data, and trust directory). It is a technical and content preparation record. It is **not** an attorney's opinion, a certification, evidence of a registered business, or assurance of complete statutory compliance.

Primary legal/accessibility references consulted:
- Philippine National Privacy Commission, right to be informed: https://privacy.gov.ph/the-right-to-be-informed/
- NPC, data subject rights: https://privacy.gov.ph/data-subject-rights/
- NPC, Data Privacy Act and implementing rules: https://privacy.gov.ph/data-privacy-act/ ; https://privacy.gov.ph/implementing-rules%20regulations-data-privacy-act-2012/
- RA 11967 Internet Transactions Act (B2B and B2C as applicable): https://lawphil.net/statutes/repacts/ra2023/ra_11967_2023.html
- DTI online seller credibility and complaints: https://ecommerce.dti.gov.ph/faqs/
- DTI no blanket “No Return, No Exchange” prohibition: https://fairtrade.dti.gov.ph/faq/what-is-dtis-jurisdiction-based-on-the-consumer-act-of-the-philippines/
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- RA 8293 Intellectual Property Code (rights clearance): https://lawphil.net/statutes/repacts/ra1997/ra_8293_1997.html

## Checklist — what the source actually does

| Client checklist item | Engineering result | Unfinished verification / launch issue |
|---|---|---|
| Privacy Policy | **Built** `/privacy`: data categories, purposes, providers, lawful-basis discussion, rights, consent/storage, retention and transfer disclosures | Confirm legal controller identity, verified business street address, DPO/contact, actual retention periods, processor contracts |
| Terms & Conditions | **Built** `/terms`: demo scope, quote vs binding order, payments, customer accounts, IP and remedies | Approve genuine purchase contract, seller/processor responsibilities and contract policy |
| Returns, defects, refund policy | **Built** `/returns`: custom garment review process and statutory rights; no blanket refusal | Physical returns location, authorized service channel, actual remedy/service timelines, approved cancellation stages |
| Cookie Policy | **Built** `/cookies`: necessary sessions, optionally saved local project briefs, hosting/security metadata | Confirm full Cloudflare cookie/Turnstile inventory and any vendor changes before launch |
| Cookie banner that asks | **Built** `privacy-controls.js`: Necessary only, opt-in device save, persistent choice and reopen control | Browser-level manual tests, screen reader and assistive technology assessment |
| Consent box on forms | **Built** quotation notice link + explicit checkbox; staff request checkbox + privacy link; rights form acknowledgment | Separate any future direct-marketing opt-in; no marketing consent assumed |
| Only necessary data | **Implemented for privacy requests**: email/type/short optional notes, no ID uploads; quote form only needs organization, contact and requirements | Complete and approve organization-wide data inventory, retention schedule and records of processing |
| Delete on request | **Request workflow built**: `POST /api/v1/privacy/requests`, Neon register, anonymous rate limit, admin-only review with verification gate and immutable history | **Actual erasure is manual and not yet implemented as an automated operation**; identity verification, backups, lawful retention and response delivery still need owner procedures |
| Check your tracking | **Improved:** inquiry lookup email moved to POST JSON body, legacy GET query deprecated; no site ad/analytics scripts identified in current inspected source | Cloudflare/Cloudinary/Turnstile metadata handling, session cookie inventory and any future pixels require continuing inspection |
| Color contrast | Dedicated legal CSS updated after automated axe identified a failure; accessibility workflow must pass after correction | Full WCAG2.2 AA site-wide audit and manual screen reader/keyboard/zoom checking |
| Alt text on images | Garment thumbnails/sector visuals have descriptive alt text; decorative elements are identified | A complete DOM-by-DOM accessibility review and genuine image meaning check is still pending |
| Keyboard-friendly forms | Existing labels, tab focus, modal escape and legal page form controls are coded; automated browser checks added | Manual keyboard-only, switch, VoiceOver/NVDA, focus order, 200%-400% zoom and error announced checks pending |
| Clear button labels | Public policies, privacy form, login, order controls reviewed; legal controls use descriptive visible labels | A site-wide assistive tech audit of all admin controls remains |
| Accessibility pass | **Not asserted.** Automated axe and Playwright scans are in GitHub CI; failures must be treated as defects | Independent/manual verification and fixing of any remaining serious/critical rule violations |
| Remove fake reviews | No invented customer testimonial/review card was found in the inspected main HTML | Re-audit CMS-published content and other channels before launch |
| Remove unsupported claims | Removed unsupported “10+ years” and founder/business-tenure claim; ISO/trust certification remains unverified | Actual company/facility capacity, client affiliations, registrations, performance and Made-in-Philippines origin still require proof |
| Real business address | **NOT provided.** Public policies and footer explicitly identify pending verified seller name and address | Mandatory operator input: real registered entity, accurate office/returns address and verifiable contact channels |
| Copyright on images | **Asset credits built** at `/image-credits`: generated mannequin concepts, garment prototypes, external stock images; license gaps disclosed | Inspect actual license receipts, commercial stock/photo terms, any third-party marks/model releases |
| Font & photo permissions | Native system font stacks, no bundled commercial font file; recorded source attributions | Validate stock photo licenses, source records, branded school/government marks, and final art release |
| Check local laws | Data Privacy Act, Internet Transactions Act, DTI consumer remedies, copyright and WCAG reference sources reviewed | Licensed PH counsel and responsible business owner must reconcile actual activities and applicable rules |

## Original evidence / code

- `public/privacy.html`, `terms.html`, `returns.html`, `cookies.html`, `accessibility.html`, `image-credits.html`, `privacy-request.html`
- `public/privacy-controls.js`, `privacy-request.js`, `public/index.html`, `track.html`
- `src/worker.ts`, `src/portal.ts`, `db/010_privacy_requests.sql`, `public/operations.js`
- `tests/legal-readiness.test.mjs`, `tests/full-stack.test.mjs`, `tests/legal-live.mjs`; `.github/workflows/legal-readiness-live.yml`
- `docs/HEADLESS_ASSET_POLICY.md`, `docs/SHOWROOM_ASSET_STATUS.md`; all remain concept-use records, never proof of real goods.
- Demo administrator accounts **cannot read real privacy requests**; verified, non-demo administrators must handle them.

## Launch blockers requiring genuine business input

1. **Identity and seller details:** exact legal company/operator name, legal/physical address, registered contact email, telephone, tax/business registrations and appropriate DTI/e-commerce obligations. Do not fabricate them for demo.
2. **Privacy governance:** identify controller and DPO/contact, approve a retention and deletion schedule (including logs/backups), processor contracts, access controls, incident response, and who authenticates data-subject rights requests.
3. **Commercial terms:** approve the exact quotation → acceptance → deposit → production → QC → shipment → complaint sequence with actual liability and legally valid returns procedure. No checkout or payment collection should go live before that.
4. **Assets and content:** verify every stock image license, product/brand permission, factual origin/capacity and any customer testimonial. Retain evidence in a provenance registry.
5. **Accessibility:** complete automated scans on deployed pages, manual keyboard and screen reader audit, color/zoom testing and fixes. Do not publish an “accessibility pass” badge until actual verification.
6. **Security:** limit public access to demo credentials; migrate to non-demo accounts for real personal records, verify session security, configure abuse controls, and audit vendors.
7. **Policy approval:** business owner and Philippine counsel review and approve all texts, set effective dates and keep records of policy updates; prototype content is not a substitute for legal adoption.

## Evidence discipline

Tests passing indicate that code paths, rendering and selected security conditions were observed; they do not prove actual privacy compliance, legal registration, independent accessibility conformance, consumer refund fulfillment, or manufacturer authenticity. No request receipt means an erasure action has happened.

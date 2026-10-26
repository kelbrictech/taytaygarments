# TAYTAY TEXTILE CO. — VIRTUAL SHOWROOM VISUAL ASSET PRODUCTION BRIEF
Version: 1.0 | Issued: 2026-10-26 | Status: OPEN / NOT COMPLETE
Project: Taytay Textile Co. (provisional name) | GitHub: kelbrictech/taytaygarments
Project branch: main | Project folder: repository root /
Authoritative companion: docs/ASSET_PIPELINE.md

## 0. Purpose / drift prevention
This document records **only the user's requested virtual-showroom asset work**. It is the execution anchor, not permission to add website features. Any future work must compare proposed changes against this brief and the existing working implementation.

**User mandate, in substance:**
- The previous CSS/mask recoloring and synthetic alternate-angle views were visually unacceptable.
- Every **SKU × approved color × view** must have its **own separately rendered, real visual asset**.
- Colors visibly change the garment by switching to the correct image; view controls switch to actual images of the same garment.
- Quality of garment identification, consistency, rendering, and display must be professional, not "AI slop."
- The inventory will expand, so production, naming, storage, catalog mapping, and maintenance must scale.
- **Do not break or replace functioning parts of the already-approved website.**
- Do not invent scope, products, colorways, claims, features, tasks, production capacity, credentials, or customer examples.

## 1. Scope — strictly limited
IN SCOPE:
1. Render distinct garment image assets for each selected SKU, each **confirmed** catalog color, and each required viewing angle.
2. Produce front, side, and back images; provide **relevant, requested or genuinely necessary** detail images for fabric or construction (no default quota).
3. Inspect and correct the assets until image quality and consistency pass this brief.
4. Register approved images in Cloudinary and map their exact URLs to Neon catalog records.
5. Make the existing virtual showroom display the correct image when a buyer changes color or view.
6. Make asset management scale to future products and variants using the already-built product/variant/media structure.
7. Preserve existing showroom search, category filters, saved products, quotation linking, navigation, and responsive behavior during integration.

NOT AUTHORIZED BY THIS BRIEF:
- Redesigning the website or replacing the approved layout.
- Adding new website pages, marketing sections, animations, e-commerce checkout, payments, or other product features.
- Inventing fabric certifications, clients, manufacturing capability, reviews, logos, or order guarantees.
- Declaring a color available because it looks attractive, or adding unrequested SKUs.
- Auto-generating all hypothetical combinations with no specification or quality review.
- Treating CSS recolors, 2D skew/warp, mirroring, or synthetic geometric rear views as a finished image.
- Modifying unrelated repositories or production databases.

## 2. Grounded baseline — do not inflate
The current full-stack project uses three Neon tables: `ttc_products`, `ttc_product_variants`, and `ttc_product_media`. The committed seed describes **12 fictional concept products, 12 default color variants, and 12 front-view Cloudinary concept images**. The earlier build verified their upload and database registration. This brief does **not** assert that image quality is acceptable for production or that any alternate view exists.

**Current seed inventory (one concept front view each):**

| SKU | Slug | Catalog product | Category | Seeded color | HEX |
|---|---|---|---|---|---|
| TTC-SCH-001 | campus-polo | Campus Signature Polo | School | white | #F1EFE9 |
| TTC-SCH-002 | scholar-blazer | Scholar Tailored Blazer | School | navy | #253650 |
| TTC-SCH-003 | pe-set | Active Campus Tee | School | deepGreen | #28564B |
| TTC-COR-001 | office-shirt | Executive Work Shirt | Corporate | sky | #9DBBD1 |
| TTC-COR-002 | brand-polo | Corporate Brand Polo | Corporate | deepGreen | #28564B |
| TTC-COR-003 | executive-blazer | Modern Executive Blazer | Corporate | navy | #253650 |
| TTC-GOV-001 | public-service | Public Service Barong Shirt | Government | cream | #E9DDC5 |
| TTC-GOV-002 | field-uniform | Operations Work Jacket | Government | olive | #626B56 |
| TTC-SPC-001 | clinical-scrub | Clinical Scrub Top | Specialized | navy | #253650 |
| TTC-SPC-002 | chef-jacket | Hospitality Chef Jacket | Specialized | white | #F1EFE9 |
| TTC-CUS-001 | retail-hoodie | Private-Label Hoodie | Custom | terracotta | #AE664F |
| TTC-CUS-002 | event-tee | Campaign & Event Tee | Custom | burgundy | #6A3945 |

These names, HEX values and color slugs are **seed records**, not approved real-world inventory or evidence of manufacturer stock. Extra swatches previously seen in prototype designs are **not** automatically approved production colors. Do not infer a fixed number of colors per SKU.

**Open work at brief creation:** independently rendered side/back images for existing seeded colorways; separately rendered images for any **later-confirmed** additional colors; pertinent close-ups as warranted; asset acceptance and controlled integration. No work is marked complete on the strength of a file count alone.

## 3. Production specification — one actual image per combination
The unit of work is one **unique catalog render**:

`PRODUCT SKU + COLOR ID + VIEW ID = ONE REVIEWABLE ASSET`

**Required views for a fully multiview-ready product-color variant:**
- `front`: straight-on garment front, complete and undistorted.
- `side`: consistent side orientation across the catalog (use right-facing side as the default standard unless a reference requires otherwise).
- `back`: true separately generated or photographed rear construction of the same specified garment.

**Optional views, only when relevant to the garment and requested details:** `detail-collar`, `detail-button`, `detail-fabric`, `detail-logo`. No close-up should claim an unverified construction feature. Three-quarter images may be used only if explicitly included as an added angle in the product specification and schema; they must be independently rendered as well. Existing system currently recognizes `front`, `side`, `back`, and the four detail angle codes.

**Real render requirements:**
- The displayed color must be rendered on the garment itself, not applied through CSS filters, overlays, hue rotations or threshold masks.
- The side/back must depict the same garment, not a generic substitute and not a perspective transformation of the front.
- A consistent **garment-specific master reference** governs all views and colors (silhouette, length, collar shape, cuffs, button count and placement, pockets, vents, panel seams, piping, embroidery location).
- A change of color must not change construction, proportions, pocket placement, seams, buttons, or branding unless the variant's written specification explicitly calls for it.
- Each image is independently reviewable at normal product-detail scale. Images with merged garments, asymmetry, anatomy/proportion defects, or hallucinated features fail.
- Do not introduce unauthorized text, decorative watermark, fictional crests, client logos, metadata-looking stickers, or generated website UI inside the imagery.

## 4. Visual consistency standard
**For catalog product imagery**, use a single product-photography language:
- Uncluttered neutral studio background; consistent tone between all SKU/color/angle images.
- Isolated, centered garment, fully framed; no clipped collar, sleeves, hem or lower edge.
- Consistent scale relative to the frame within each SKU; colors should be directly comparable.
- Soft, even studio lighting showing garment shape, texture and construction; do not obscure details with hard dramatic shadow.
- Consistent camera level/perspective and side orientation; no arbitrary crop, zoom, or rotation when switching views.
- Realistic fabric drape, stitch detail and garment structure, avoiding plastic-like textures and blurry magnification.
- Colors should be visually faithful to the approved palette. HEX is an interface reference, **not** a promise of exact physical fabric color under all displays or lights.
- Maintain a recognizable identical garment across the front, side and back. If consistency cannot be achieved, label the asset REJECTED and regenerate that view; do not fabricate a quick substitute.

Editorial and manufacturing-story imagery is **different from catalog imagery**. Never use an editorial lifestyle image or cropped website mockup as a missing SKU-angle replacement. Do not turn the asset task into an overhaul of editorial photography.

## 5. Repeatable rendering method
For each SKU:
1. Read its existing exact product name, SKU, catalog category and seeded reference photo.
2. Establish the **garment reference specification** from the accepted front image and whatever approved supporting references actually exist. Record ambiguities; do not invent details.
3. Identify which colors are **actually selected/confirmed** for that product, using existing seeded color and separately approved additions only.
4. Render the **front** for the selected color as a true garment image, then **side**, then **back**, each as an independent deliverable using the same garment specification.
5. For additional approved colors, repeat the entire view set from the same structural reference; do not recolor the already-rendered front.
6. Produce close-ups only for details established by the reference and pertinent to the product.
7. Review at both full-product and enlarged detail scale. Compare different colors side by side and views together.
8. Only register an image as an accepted catalog asset after matching, quality, and technical checks pass.

This is an iterative **per-SKU acceptance process**, not permission to generate all combinations speculatively. A limited early subset can prove the process before wider inventory work; this does not add a new product or change the requested total scope.

## 6. Asset identity, files and storage
Use the existing convention recorded in `docs/ASSET_PIPELINE.md`:

Cloudinary public_id: `taytay-textile-co/{SKU}/{COLOR}/{ANGLE}`

Examples:
- `taytay-textile-co/TTC-SCH-002/navy/front`
- `taytay-textile-co/TTC-SCH-002/navy/side`
- `taytay-textile-co/TTC-SCH-002/navy/back`
- `taytay-textile-co/TTC-COR-001/sky/detail-collar`

The exact resulting Cloudinary `secure_url` is stored under the matching Neon `ttc_product_media` record, attached to the correct `ttc_product_variants` row. The code must not guess asset locations from names or invent URLs. Use canonical SKU and color slug; preserve an accepted original during replacement until the new URL is verified. Do not relabel a concept as actual photographed inventory.

**Data cardinality:**
- One `ttc_products` record per catalog SKU.
- One `ttc_product_variants` record for each explicit SKU/color pairing.
- One `ttc_product_media` record per approved SKU/color/angle.
- No duplicate media entry for the same variant and angle. The database already constrains `UNIQUE (variant_id, angle)`.

**Count formula (planning only):** `required core images = Σ (confirmed color variants per SKU × required available views for each variant)`; optional detail shots add to that count. Do not claim a fixed 180/300-image goal without approved color inventory.

## 7. Image QA — accept/reject gate
**Visual-match checks**
- [ ] Correct SKU and garment type; no category mismatch.
- [ ] Correct confirmed color and swatch association.
- [ ] Same structural garment across front/side/back/color variants.
- [ ] Collar, cuffs, seams, hem, closures, pocket and panel geometry coherent.
- [ ] Rear view actually displays plausible matching rear construction.
- [ ] No changed button count, invented embroidery, phantom pockets or extra garments.
- [ ] Background, lighting, camera height, framing and scale consistent.
- [ ] Garment entirely visible, crisp, correctly proportioned; no blurry crops.
- [ ] No baked-in AI typography, UI labels, product names, logos or watermarks.
- [ ] Any applicable fabric/detail close-up matches the garment.

**Integration checks**
- [ ] Cloudinary file is accessible and returns a valid image, with correct SKU/color/angle identity.
- [ ] Neon record points to the **verified exact** Cloudinary URL and retains concept/approved status accurately.
- [ ] Front/side/back buttons show distinct corresponding images, not warped or recolored copies.
- [ ] Switching color updates the visible garment to that color's exact render; angle remains correct or safely returns to an existing angle.
- [ ] Product detail uses the same variant as its grid/selection state.
- [ ] Missing colors/views are hidden or clearly unavailable, **never silently substituted** by an unrelated image.
- [ ] Working search, filters, navigation, saved selection, quotation link and mobile responsiveness remain intact.

**Evidence standard:** Record the SKU, color, angle, image reference/URL, pass/fail, defect and correction status. Passing database insertion is not proof of visual quality. Claim VERIFIED only after actual image inspection and interaction testing.

## 8. Safe integration / preserve what works
The current working prototype and its interactions are the **baseline**, not a disposable starting point:
1. Keep the current GitHub application branch and source history as a rollback source; use a separate working branch or isolated changes until QA passes.
2. Prepare and validate new image variants independently of the public-facing card grid.
3. Add new media records to the existing Cloudinary–Neon catalog without overwriting an accepted photo prematurely.
4. Integrate by SKU or individually accepted SKU/color variant; do **not** mass-swap assets after generation without human-visible QA.
5. Preserve functionality of navigation, filters, search, responsive cards, detail modal, saved garment list and RFQ.
6. Where missing, hide a color or angle control rather than present a knowingly incorrect visual.
7. Validate each integrated SKU on desktop and mobile, including image loading and the inquiry selection mapping.
8. If regressions appear, revert the affected asset mapping or isolated change; do not dismantle the working UI to mask a faulty render.

## 9. Acceptance definition
A variant is **COMPLETE** only if the separately produced required front, side and back assets exist, each passes visual QA, exact Cloudinary media URLs are stored against the correct Neon SKU/color/angle, and showroom switching has been browser-tested without introducing regressions.

A SKU is **COMPLETE** when **all confirmed colors** for that SKU meet the variant acceptance definition (plus any specifically required closeups). No assumptions about unapproved colors.

The virtual showroom asset task as a whole is **COMPLETE** only when all products and confirmed variants **actually in the agreed showroom inventory** satisfy these conditions. Passing a website deploy, CI test, or uploading 12 default front views does not close it.

## 10. Explicit status at brief issue
| Item | State | Evidence / qualification |
|---|---|---|
| Working showroom UI and code | Existing baseline | Prior reviewed HTML and project code; preserve functionality |
| Database schema for SKU/variant/view | PRESENT | Committed Neon migration and asset pipeline |
| 12 seed SKUs / 12 default variants | PRESENT | Committed seed file |
| 12 Cloudinary concept front images | UPLOADED / CONCEPT | Source registration documented in the project; **not visually approved production output** |
| Individually generated additional colors | OPEN | No approved variant matrix supplied beyond seeded colors |
| Individually generated side views | OPEN | No side-view asset registered in seeded inventory |
| Individually generated back views | OPEN | No back-view asset registered in seeded inventory |
| Relevant close-up images | OPEN AS APPLICABLE | Only when grounded in actual garment details |
| Per-asset visual consistency QA | OPEN | Must review each SKU × color × view |
| Full rollout of accepted media | OPEN | Do not claim live full inventory |

## 11. Continuity instruction to the next builder
**Before any more generation or integration:**
- Read **this file** and `docs/ASSET_PIPELINE.md`.
- Inspect the actual current SKU/variant/media records instead of relying on old screenshots or inferred colors.
- Use the accepted garment image and actual approved specifications as references.
- Complete the *image*, inspect it, record its identity, then connect it. Never substitute conversation, architecture commentary, a generated website mockup, a CSS recolor, or a simulated alternate view for the requested actual asset.
- Report exactly which SKU/color/view combinations were produced, passed, failed, registered, and tested, and which remain pending.
- **Do not create any unrelated tasks or change the approved user experience without a user request.**

End of visual asset production brief.

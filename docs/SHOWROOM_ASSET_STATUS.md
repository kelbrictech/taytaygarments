# Virtual showroom — asset production status
Updated: 2026-10-27

Authoritative specification: [VIRTUAL_SHOWROOM_VISUAL_ASSET_PRODUCTION_BRIEF.md](VIRTUAL_SHOWROOM_VISUAL_ASSET_PRODUCTION_BRIEF.md).

## User-approved first garment
- **TTC-SCH-002 / Scholar Tailored Blazer**
- Approved showroom palette: navy, charcoal, burgundy, deepGreen.
- **12 image files**: 4 colors × front, side, back.
- Exact WebP files: `public/assets/showroom/TTC-SCH-002/{color}/{angle}.webp`.
- Exact public presentation files registered in Cloudinary under `taytay-textile-co/TTC-SCH-002/{color}/{angle}`.
- Neon table `ttc_product_variants`: 4 colors registered; `ttc_product_media`: 12 media records.
- Live page: `https://taytaygarments.arjayb-fb.workers.dev/#/showroom`.
- Reactivity tested by GitHub Action: 24/24 combinations across 1440px and 390px; all images loaded, color/angle selection and saved project-brief color tested.
- **Provenance exception**: these accepted visuals were extracted from AI-generated composite plates, following the user's explicit visual approval of the blazers. This exception **does not waive** the independent-render requirement for remaining products. All are digital concepts, not photographs of actual supplier inventory.

## Campus Signature Polo and Active Campus Tee

- **TTC-SCH-001 / Campus Signature Polo** — 4 approved showroom colors (white, navy, deepGreen, burgundy), 12 digital concept image files at `public/assets/showroom/TTC-SCH-001/{color}/{angle}.webp`. Live color/view selection tested previously. This set includes extracted concept panels; not actual supplier photography.
- **TTC-SCH-003 / Active Campus Tee** — 4 exact showroom colors (deepGreen, navy, sky, terracotta), **12** front/side/back digital concept images committed to `main` under `public/assets/showroom/TTC-SCH-003/{color}/{angle}.webp`.
  - GitHub asset/integration commit: `920573ebdf21f5b6fe0ea95ec2ca657b0c8f1d18`.
  - Live color/view verification: 24/24 exact image URL/load checks at mobile width 390px and desktop 1440px. GitHub Actions: `40525154714`, success.
  - Cloudinary: all 12 assets uploaded and retrieved under `taytay-textile-co/TTC-SCH-003/{color}/{angle}`.
  - Neon: four variants and 12 concept media records; verified 3 per color.
  - Provenance: deepGreen and navy from independently generated per-view candidates. Sky and terracotta were **cropped from a single rendered product view sheet**, and must **not** be described as independently generated.
  - Quality scope: layout and browser loading verified; generated imagery is for a prospective-client prototype, not verified factory merchandise.

## Remaining showroom inventory
**9 other garment SKUs** still await equivalent color-and-angle image production, review and integration. Completed 3 of the 12 seeded SKUs have four-color front/side/back presentations. Do not treat prototype concept pictures as verified manufacturing inventory.

Do not redesign or modify functioning showroom navigation, filters, cart, or quotation workflow during further asset updates. The Cloudflare Worker secret DATABASE_URL has not been separately verified; the front-end includes static concept images as a fallback, while Neon media records are staged to support the API.

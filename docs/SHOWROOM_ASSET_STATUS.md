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

## Remaining showroom inventory
**11 other garment SKUs still await equivalent color-and-angle image production, review, and integration.** Do not mark those complete based on default front concept images alone.

Do not redesign or modify functioning showroom navigation, filters, cart, or quotation workflow during further asset updates. The app's Worker may still lack DATABASE_URL: static catalog views allow the already-approved blazer to work without the live Neon API; Neon records are ready when connected.

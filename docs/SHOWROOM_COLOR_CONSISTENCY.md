# Showroom color selector consistency — 2026-10-28

## Scope
The showroom has 12 concept products. Three school garments have completed four-color front/side/back visual sets: Campus Signature Polo, Scholar Tailored Blazer and Active Campus Tee. These approved media paths, rendered angles and color selections are preserved unchanged.

The other nine products have a base photograph and a previously declared palette in `public/index.html`. The catalog sync formerly filtered their color options to only variants with `views.front.url`, hiding most of the palette after Neon loaded.

## Behavior
- Preserve the embedded product palette when merging a product from Neon; append any additional named colors returned by the API, with duplicates removed.
- Render a color selector in each product modal using the full defined palette, including products with no color-specific photographs.
- The first three products retain the real 4-color/3-angle controls.
- For the nine incomplete concepts, the chosen swatch and text change and are saved as a **preferred color for quotation**. The garment photograph remains the original reference unless an actual matching image exists.
- Explicitly show that missing shade previews are pending; never silently tint, substitute or imply the garment matches the chosen color.
- No stock availability, physical color matching or manufacturing feasibility is promised by the selector.
- Server product schema, pricing, original garment photos, three approved color/angle sets and database records are not altered.

## Verification
GitHub CI and the existing polo, blazer and tee live regression checks must remain green. The new `tests/showroom-color-consistency-live.mjs` examines all 12 selectors and verifies unrendered swatches work on desktop and mobile, with unchanged reference photos and explicit text. Cloudflare's GitHub-connected build deploys the source.

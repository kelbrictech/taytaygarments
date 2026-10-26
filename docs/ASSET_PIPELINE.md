# Catalog asset and variant standard — Taytay Textile Co.
This is a production workflow rule, not a mockup guideline.

## Source of truth
`ttc_products` → `ttc_product_variants` → `ttc_product_media`.
Every visible photo belongs to exactly one SKU, color, and angle. The frontend must use the exact registered image URL. Do not use CSS hue rotation, geometric back-view simulation or cloned garments as substitutes.

## Controlled asset naming
Cloudinary public_id: `taytay-textile-co/{SKU}/{COLOR}/{ANGLE}`.
Angles: `front`, `side`, `back`, `detail-collar`, `detail-button`, `detail-fabric`, `detail-logo`.
An image is accepted only when its garment type, seams, buttons, fabric, branding, and proportion match the same product in all angles.

## Upload/QA process
1. Create a product in Operations Desk (unpublished by default).
2. Add available color variants with actual HEX labels and supplier-confirmed materials.
3. Independently create each SKU/color/angle image using the identical garment specification. Prefer actual photography once samples exist.
4. Check each angle for correct garment construction, consistent lighting, fabric, and scale.
5. Upload approved photos to Cloudinary. Place the exact returned secure URL against its SKU/color/angle.
6. Review every rendered combination on desktop and mobile.
7. Publish the product only when required product information and approved assets exist.

## Graceful fallback
- A color with no corresponding front image must not appear as a visually selectable preview.
- A missing side/back image hides that view's control.
- A separate concept thumbnail may be used for preliminary pitches, but must be marked concept.
- Do not invent badges, endorsements, certifications, capacity figures or client testimonials.

## Current baseline
12 concept garment products, 12 default variants, 12 verified Cloudinary uploads, **front view only**. Additional photos and approved colorways are intentionally not represented as complete until made individually and checked.

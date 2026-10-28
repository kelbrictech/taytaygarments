# Headless garment-first image standard · 2026

## Visual policy
Taytay Textile Co. marketing imagery must intentionally prioritize **apparel, fabric, sewing tools, construction and finished details**. For illustrative lifestyle imagery, frame any real workers strictly from the shoulders down with no heads, faces or facial reflections. Prefer clothing on hangers, flat-lay presentation, neckless dress forms, fabric bolts and hands at work. Avoid artificial portrait lookalikes, synthetic team photos, generated company logos, and implied government or customer endorsement.

Product photography in the showroom remains separate and must use only its documented approved color/angle assets.

The eight marketing images in the current source are **licensed Unsplash editorial references**, not Taytay Textile Co. facilities, employees, clients or proof of manufacturing origin. No external stock image may be used to assert a real company contract or certification.

## Active marketing image registry

| Placement | Photo content | Credit | Source | Cloudinary output |
|---|---|---|---|---|
| `school` | White uniform-style shirts on hangers | Ryoji Hayasaka | [Unsplash](https://unsplash.com/photos/gkbAYJIMVDA) | `900 × 1100` |
| `corporate` | Tailored business suits on a rack | Nate Johnston | [Unsplash](https://unsplash.com/photos/NQt7oV6bP9M) | `900 × 1100` |
| `government` | Blue collared work shirt displayed without a model | Zakaria Issaad | [Unsplash](https://unsplash.com/photos/JNvSe60fTok) | `900 × 1100` |
| `specialized` | White professional coat on a hanger | Lasse Jensen | [Unsplash](https://unsplash.com/photos/bUg7Fdq6nXo) | `900 × 1100` |
| `hero` | Textile rolls on shelves | Bernd Dittrich | [Unsplash](https://unsplash.com/photos/ZBUYjLVY0tc) | `1400 × 1100` |
| `hero_wide` | Tailored clothing on racks | rawkkim | [Unsplash](https://unsplash.com/photos/skvWY1tBk-g) | `1800 × 1100` |
| `factory` | Hands and garment stitching, no head visible | Erwin Bosman | [Unsplash](https://unsplash.com/photos/5RQARpcmWmo) | `1400 × 1100` |
| `machine` | A sewing machine and spool of thread | Kevin Menya | [Unsplash](https://unsplash.com/photos/XWrEpATTmq8) | `1400 × 1100` |

All eight assets: `taytay-textile-co/homepage/${asset}` on the project's existing Cloudinary account, stored as versioned URL assets using `c_fill,g_auto` with `f_auto,q_auto:good`.

## Delivery and disclosure
- Homepage uses a headless clothing-rack hero, four garment-only sector images and a hands-only sewing photo.
- Manufacturing and editorial sections use garment displays, rolls of fabric and sewing machines.
- Failsafe for broken media is a dark card background that preserves legible text.
- All claims of Philippine origin, material authenticity, manufacturing capacity and customer affiliation need separate evidence.
- For a real client launch, substitute approved factory documentation photography, preserving the no-visible-head policy unless owner explicitly revises it.

## Quality gate
`node --test tests/headless-assets.test.mjs` verifies the eight source URLs in committed HTML. Live browser checks additionally verify 900×1100 sector-card sources at 390/800/1024/1440px and that the corresponding images load without overflow. A face-free visual policy is ultimately a photographic/content-review requirement; this test verifies provenance and source selection, not computer-vision face detection.

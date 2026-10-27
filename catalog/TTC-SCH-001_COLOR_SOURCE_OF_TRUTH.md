# TTC-SCH-001 — Campus Signature Polo asset colors

**Verified against:** `public/index.html` on `main` at source blob SHA `d386aed83f7829d1bc12c9f9173a5ade763ac862`.

## Approved existing SHOWROOM palette
- `navy`
- `white`
- `deepGreen`
- `burgundy`

Exact product field: `colors:['navy','white','deepGreen','burgundy']`.

**Charcoal is not a Campus Signature Polo option.** It belongs to the Scholar Tailored Blazer palette, and was mistakenly carried into a previous polo image bundle. Do not add it to the polo.

## Corrected image batch
12 image candidates: `4 colors × (front + side + back)`.

- Previously generated white, navy, burgundy images are retained.
- The charcoal front/side/back candidate files are excluded.
- Deep-green front/side/back concept candidates are extracted from the matching deep-green panels of the existing studio sheet; explicitly marked as cropped composite provenance, *not independently rendered originals*.

**Publication gate:** Do not claim the 12 physical image files are committed, uploaded to Cloudinary or wired live until the exact files are transferred and checked. The existing `public/index.html` site palette already requires deepGreen; do not modify its color list.

**Asset QA:** Verify identities and source manifest before any production change. This source-of-truth note supersedes the wrong charcoal color claim in previous batch documentation.

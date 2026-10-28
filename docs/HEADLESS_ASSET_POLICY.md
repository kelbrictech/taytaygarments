# Photorealistic Mannequin Asset Production — 2026-10-28

## Scope
The Taytay Textile Co. homepage hero and four industry cards display **photorealistic headless mannequins wearing garment samples**, including school attire, formalwear, institutional uniforms and chef/workwear. This replaces the intentionally rejected geometric SVG mannequin illustrations.

## Authentic source and production pipeline
The visuals are prepared from the client's accepted **AI-generated mannequin website visual reference** as photographed-looking source art. The source was converted to an image in the connected Canva workspace and uploaded into the project's Cloudinary account, with a four-times AI super-resolution pass and five separate garment-focused crops. Each crop was prepared and stored as a derived Cloudinary asset; the production website references those exact asset URLs. Do not describe these as photographic evidence of real manufacturing work, real client contracts, genuine customer uniforms or real company premises.

Cloudinary resource: `taytay-textile-co/dev/reference-s3-probe` (a cropped asset source derived from the approved concept screenshot). Prepared delivery URLs use `e_upscale/c_crop/c_fill`, dimensions `900 × 1100` for sectors and `1600 × 700` for the hero.

- School: photorealistic white blouse, navy ribbon and skirt displayed on a headless dress form.
- Corporate: photorealistic tailored gray formal suit.
- Government: blue institutional shirt and tailored uniform trousers; absence of real issuer logos or governmental affiliation is intentional.
- Specialized: professional white chef coat with dark apron.
- Hero: coordinated headless mannequin group with formal and specialist attire, from the same visual reference.

Supporting hands-on sewing and sewing-machine photography remains on the manufacturing subpages. The separate approved 12-view showroom product media registry remains unchanged.

## Trust, honesty and release rules
- All mannequin images are **AI-generated illustrative concept studies**. Actual garments, origin of production, certification, client affiliation and capacity require independent confirmation.
- Never copy claim badges from the mockup: the Trust & Verification registry still displays evidence requirements rather than unearned registrations.
- Do not invent a company emblem, agency insignia, or institutional seal on garment photos.
- Any future hero or card redesign must update production asset URLs and run responsive browser checks. Avoid separate aspirational screenshots that aren't the real site.

## Tests
The GitHub CI validates specific photographic Cloudinary transforms and excludes SVG mannequin paths. The GitHub live-sector browser workflow checks successful image decoding, output resolution and responsive layouts at 390/800/1024/1440px. Screenshot artifacts are created from the live Cloudflare Worker itself.

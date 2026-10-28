# Mannequin Visual Production Standard — Taytay Textile Co.

## Client direction
The site's primary product-sector imagery uses **headless upper-torso and lower-body mannequin modelling**; no realistic human face or AI-generated lookalike portraits. Keep the actual website imagery aligned with the approved frontend visual direction.

## What is actually deployed
Five original, infinitely scalable vector mannequin studies are committed in GitHub and served directly by Cloudflare. These are **custom SVG illustrations** with material shading, stitching details, garment construction, realistic uniform silhouettes and consistent studio backgrounds. They are not photorealistic renders or literal photography. The image preview generated in the ChatGPT conversation is a visual proposal and is not used as a site screenshot.

- `public/assets/mannequins/hero.svg` — four headless full-body mannequins across school, corporate, institutional and specialist uniforms. Served directly by Cloudflare static assets.
- `public/assets/mannequins/schools.svg` — white blouse with navy skirt beside white shirt and navy trousers.
- `public/assets/mannequins/corporate.svg` — tailored formal jackets and trousers on dress forms.
- `public/assets/mannequins/government.svg` — blue utility uniform alongside white barong-style uniform and tailored trousers.
- `public/assets/mannequins/specialized.svg` — chef uniform/apron and green scrubs with lower-body modelling.

Two supporting secondary images (`VISUALS.factory`, `VISUALS.machine`) continue to use licensed headless stock photographs (hands sewing, machinery only). The showroom's independently approved product photography remains unchanged.

## Business and legal integrity
- Never imply mannequin concept models represent sold garments, approved client designs, registered manufacturers or actual inventory.
- The Philippine-made identity mark is original site typography, not a regulatory origin certificate.
- Credential/trust directory retains separate proof statuses and no fabricated government approvals or official seals.
- Do not invent company uniform badges, school logos, institutional insignia or medical marks.
- Render source SVGs as static browser assets: no remote fonts, scripts, active SVG events, or data URIs.

## Technical evidence
- Source: `public/assets/mannequins/*.svg`; each card uses its own distinct asset.
- Source tests check every link, SVG existence and source properties.
- GitHub Actions live-sector audit checks actual image loading at widths 390, 800, 1024 and 1440px, legible captions and zero horizontal overflow.
- Any further visual revisions must update the source files in this repository and redeploy to Cloudflare, rather than displaying separate aspirational page images.

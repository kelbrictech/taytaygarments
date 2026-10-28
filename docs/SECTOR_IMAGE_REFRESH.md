# 2026 Sector Photography Replacement — Taytay Textile Co.

## Root cause corrected
The original embedded sector images were very small, highly compressed WebP data URIs: schools 480×309 (17KB), corporate 453×324 (10KB), government 462×309 (10KB), specialized 453×315 (11KB). They were stretched and cropped into tall cards at desktop, producing soft, muddy portraits. Legacy CSS also forced four columns at widths where the compact hamburger navigation was already in use.

## Replacement images
All replacements are licensed illustrative stock photographs — **not photos of actual Taytay Textile Co. workers, customers, contracts or manufactured products**.

| Sector | Photographer / source | Original source resolution | Cloudinary optimized delivery |
|---|---|---:|---|
| Schools & Education | Asep S.Pd — [Unsplash photo](https://unsplash.com/photos/a-group-of-teenage-girls-in-school-uniforms-posing-together-G1HhUbPRJEk) | 5472×3661 | 900×1100 |
| Corporate & Private | Thirdman — [Pexels photo](https://www.pexels.com/photo/a-group-of-people-having-a-meeting-in-the-office-7652178/) | 6720×4480 | 900×1100 |
| Government & Public | ArrN Capture — [Unsplash photo](https://unsplash.com/photos/man-in-blue-and-white-dress-shirt-and-black-pants-jctvi30MWRM) | 4000×5328 | 900×1100 |
| Specialized Industries | Unsplash professional chef — [photo](https://unsplash.com/photos/a-person-in-a-white-shirt-2QRk56RJJN8) | 8181×5450 | 900×1100 |

Cloudinary project asset names: `taytay-textile-co/homepage/industries-{schools,corporate,government,specialized}-v2`.
Optimized images use Cloudinary's `c_fill,g_auto,h_1100,w_900/f_auto,q_auto:good` transformation. No enlarged thumbnails are used.

Images are **not** documentary evidence of real customer affiliations, certifications, government endorsement, order fulfillment, production facilities, or individual product origin.

## Responsive design
- 1280px+: four equal cards, large photographic sources.
- 851–1279px: two equal cards per row and readable description text.
- 641–850px: two cards per row with accessible copy size.
- <=640px: one full-width card per row with comfortable reading size and lighter photo overlays.
- Performance: deferred image loading and decoding, optimized CDN media, no longer shipping the four base64 image strings within the main HTML.

## Verification
Check the latest Cloudflare Worker native build, GitHub CI, and the live sector photo browser audit. The audit checks image loading/native resolution, column count and overflow on mobile/tablet/desktop.
# Photorealistic Mannequin Assets — Site Production Record (2026-10-28)

## Visual production contract
The hero and four sector cards use photorealistic, headless mannequin imagery showing structured uniforms, fabric texture, professional tailoring and garments worn over the upper torso and lower body. These replace the rejected geometric SVG dress forms.

## Final actual image source
The five production images originate from the **full-resolution, AI-generated mannequin visual reference** supplied in this development conversation, cropped directly from the source image (1032 × 422 pixels). The source photo panel was saved as an optimized 97KB WebP at `taytay-textile-co/homepage/mannequin-photo-master-v6` on the connected Cloudinary account. Baked-in webpage text at the crop edge and a speculative wall sign were softened/removed during asset preparation.

Each of the four sector images is cropped independently from the approved source using Cloudinary and then AI-upscaled to 900 × 1100. The hero is delivered at 1600 × 700. This source is **higher fidelity than the older version that enlarged a 548px-wide Canva screenshot thumbnail**.

| Site placement | Crop or transform |
|---|---|
| School uniforms | `c_crop,w_260,h_422,x_5,y_0/e_upscale/c_fill,w_900,h_1100` |
| Corporate | `c_crop,w_265,h_422,x_260,y_0/e_upscale/c_fill,w_900,h_1100` |
| Government | `c_crop,w_275,h_422,x_500,y_0/e_upscale/c_fill,w_900,h_1100` |
| Specialized | `c_crop,w_257,h_422,x_775,y_0/e_upscale/c_fill,w_900,h_1100` |
| Homepage hero | `e_upscale/c_fill,w_1600,h_700` |

Cloudinary delivery uses `f_auto,q_auto:good` and immutable versioned source `v1793177747`. Images are served as external hosted assets; the site HTML contains no embedded low-resolution screenshots or fake official badge imagery.

## Accuracy
These are **AI-generated illustrative uniforms on mannequins**, not photographs of the company's actual completed products, employees, premises, clients, registration status, government affiliation, or stock. The existing site continues to label sample garment work as illustrative. Any real client material must be reviewed and separately approved before production launch.

The authorized site brand header and the separately gated evidence-driven Trust & Verification directory remain unchanged. Do not copy generated claims such as DTI registration, ISO certification, export readiness, client logos or agency insignia from any visual concept.

## Verification
The image-specific source tests require 5 matching Cloudinary production assets at the correct dimensions and exclude SVG mannequin images. The live Playwright workflow verifies image decoding, card layout and horizontal overflow at widths of 390, 800, 1024 and 1440px, captures actual Cloudflare screenshots, and checks that the new source image is deployed before evaluating.

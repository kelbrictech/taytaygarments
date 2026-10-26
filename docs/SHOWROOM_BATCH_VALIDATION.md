# Virtual Showroom — batch validation workflow

Production baseline: `catalog/production_inventory.json` contains exactly the 12 seeded concept SKU / default-color pairs and expected front/side/back views. It creates **no additional variants**.

## Separate rendering requirement
Create an independent render or genuine photograph for each SKU/color/view. A combined triptych cropped into multiple files is a candidate study, **not a compliant independently rendered source**. Do not apply CSS recoloring or synthetic angle transformations.

## Staging
Give each file a canonical name:

`TTC-SCH-002__navy__front.webp`
`TTC-SCH-002__navy__side.webp`
`TTC-SCH-002__navy__back.webp`

Save in a batch directory alongside `ASSET_MANIFEST.json`. For each file record its SHA256, SKU, color_slug, view, source type (`independent_render` or `original_photograph`), and a visual approval field. **Only a reviewer who inspected the actual image may set** `review_status=visual_qa_approved`.

## Validation
```
python -m pip install pillow
python tools/validate_showroom_assets.py /path/to/asset-batch --inventory catalog/production_inventory.json
```

Returns a nonzero exit code if any file fails identity, provenance, visual approval, decode, size, or hash tests. The validator **cannot prove** side/back construction matches the front; human visual inspection remains mandatory.

## Integration
After the validator passes AND images are visually checked, upload each exact file to Cloudinary and register the exact returned secure URL under its matching Neon product variant and angle. Do not publish unapproved images or change existing accepted asset URLs prematurely.

The customer-facing site stays on `main`. This work is isolated in `assets/showroom-asset-pipeline-v1` until reviewed. It does not change the current site, its styles, existing products, or API behavior.

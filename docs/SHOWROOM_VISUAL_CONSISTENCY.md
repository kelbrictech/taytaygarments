# Showroom visual consistency — release gate

The user-provided screenshots of the Active Campus Tee (`TTC-SCH-003`) exposed
changes in the apparent garment size, shirt length, background, and positioning
when switching colors. Those defects came from inconsistent **source images**;
a fixed CSS rectangle alone cannot solve them.

## Locked requirements for every garment SKU

1. The SKU, approved palette, construction, and angle are read from the current catalog **before** generating images.
2. Generate or photograph one garment per source image; retain provenance. No unrelated lookbook or fabricated label becomes a product image.
3. Within a product and angle, match actual garment proportions, neck/shoulder/seam details, garment length, lighting, background, and zoom. Use the approved **front** as the common silhouette reference.
4. Front, side, and back must be **genuinely different views** of a consistent garment.
5. For each SKU/color/angle: identical 900×1100 output artboard; consistent optical garment bounding box and center; neutral background; color-specific garment (not a CSS recolor).
6. Never stretch a short garment, conceal cut-off fabric, reuse a view under a different angle, or invent a new SKU/color to make a QA metric pass.
7. Compare the **entire color × view matrix simultaneously** before integration. Don't inspect single assets in isolation.
8. Only publish after both technical validation and visual review; test the actual live URL and switching controls. Regress previously accepted garments.

## Deterministic automated checks

```bash
python -m pip install pillow numpy scipy
python tools/showroom_consistency.py --enforce
python -m unittest discover -s tests -p 'test_showroom_consistency.py'
```

Checks actual committed garment image pixels: image dimensions, segmentation,
horizontal centering, relative silhouette height/width across all colors,
and relative garment height on canvas. Strict mode exits nonzero on mismatch.

The automated check is **not sufficient** to certify collar stitching, color
accuracy, perspective correctness, or genuine independently rendered views.
Those need visual inspection.

## Existing source warning

The current sky-blue and terracotta Active Campus Tee sources have shorter
silhouettes than the deep-green and navy variants. These images should be
replaced by full-length same-construction images, NOT enlarged by stretching.
Run the gate after replacement. Preserve the existing live site until clean
assets are available; do not claim the current collection passes.

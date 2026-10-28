-- Synchronize the approved Campus Signature Polo concept matrix with committed /public assets.
-- Source of truth: catalog/TTC-SCH-001_COLOR_SOURCE_OF_TRUTH.md.
-- Idempotent: preserves any approved media records; replaces only concept media.
WITH colors(color_slug,color_label,color_hex,is_default) AS (
 VALUES ('navy','Navy','#263d59',false),
        ('white','White','#F1EFE9',true),
        ('deepGreen','Deep green','#28584f',false),
        ('burgundy','Burgundy','#743e4c',false)
)
INSERT INTO ttc_product_variants(product_id,color_slug,color_label,color_hex,default_color)
SELECT p.id,c.color_slug,c.color_label,c.color_hex,c.is_default
FROM ttc_products p CROSS JOIN colors c WHERE p.sku='TTC-SCH-001'
ON CONFLICT(product_id,color_slug) DO NOTHING;

WITH colors(color_slug) AS (VALUES ('navy'),('white'),('deepGreen'),('burgundy')),
angles(angle) AS (VALUES ('front'),('side'),('back'))
INSERT INTO ttc_product_media(variant_id,angle,url,public_id,asset_status,alt_text)
SELECT v.id,a.angle,
  '/assets/showroom/TTC-SCH-001/'||c.color_slug||'/'||a.angle||'.webp',
  NULL,'concept',
  'Campus Signature Polo — '||c.color_slug||' '||a.angle||' digital concept view'
FROM ttc_products p
JOIN ttc_product_variants v ON v.product_id=p.id
JOIN colors c ON c.color_slug=v.color_slug
CROSS JOIN angles a
WHERE p.sku='TTC-SCH-001'
ON CONFLICT(variant_id,angle) DO UPDATE
SET url=EXCLUDED.url,public_id=NULL,alt_text=EXCLUDED.alt_text
WHERE ttc_product_media.asset_status='concept';

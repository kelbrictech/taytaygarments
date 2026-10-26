-- Initial additive SQL migration for Taytay Textile Co.
CREATE TABLE IF NOT EXISTS ttc_products (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, sku text NOT NULL UNIQUE,
name text NOT NULL, category text NOT NULL, subtitle text NOT NULL DEFAULT '',
fabric text NOT NULL DEFAULT '', finish text NOT NULL DEFAULT '', applications text NOT NULL DEFAULT '',
concept boolean NOT NULL DEFAULT true, published boolean NOT NULL DEFAULT true,
display_rank integer NOT NULL DEFAULT 100, created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT ttc_product_slug_format CHECK(slug ~ '^[a-z0-9-]+$')
);
CREATE TABLE IF NOT EXISTS ttc_product_variants (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES ttc_products(id) ON DELETE CASCADE,
color_slug text NOT NULL, color_label text NOT NULL,color_hex char(7) NOT NULL,
default_color boolean NOT NULL DEFAULT false, available boolean NOT NULL DEFAULT true,
UNIQUE(product_id,color_slug), CONSTRAINT color_hex_valid CHECK(color_hex ~ '^#[[:xdigit:]]{6}$')
);
CREATE TABLE IF NOT EXISTS ttc_product_media (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), variant_id uuid NOT NULL REFERENCES ttc_product_variants(id) ON DELETE CASCADE,
angle text NOT NULL CHECK(angle IN('front','side','back','detail-collar','detail-button','detail-fabric','detail-logo')),
url text NOT NULL, public_id text, asset_status text NOT NULL DEFAULT 'concept'
CHECK(asset_status IN('concept','approved','retired')), alt_text text NOT NULL,
created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(variant_id,angle)
);
CREATE TABLE IF NOT EXISTS ttc_inquiries (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference text UNIQUE NOT NULL, organization text NOT NULL, sector text NOT NULL,
contact_name text NOT NULL, email text NOT NULL, garment_type text NOT NULL DEFAULT '',
quantity_band text NOT NULL DEFAULT '', service_type text NOT NULL DEFAULT '',target_timeline text NOT NULL DEFAULT '',
destination text NOT NULL DEFAULT '',details text NOT NULL DEFAULT '',status text NOT NULL DEFAULT 'new'
CHECK(status IN('new','reviewing','quoted','closed','archived')),consent_at timestamptz NOT NULL,
ip_fingerprint text,idempotency_key text UNIQUE,created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ttc_inquiry_items (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inquiry_id uuid NOT NULL REFERENCES ttc_inquiries(id) ON DELETE CASCADE,
product_sku text NOT NULL, requested_color text NOT NULL,quantity integer
CHECK(quantity IS NULL OR quantity BETWEEN 1 AND 1000000),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ttc_inquiries_created_idx ON ttc_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS ttc_inquiries_fingerprint_created_idx ON ttc_inquiries(ip_fingerprint,created_at DESC);
CREATE INDEX IF NOT EXISTS ttc_inquiries_status_idx ON ttc_inquiries(status,created_at DESC);
CREATE INDEX IF NOT EXISTS ttc_media_variant_idx ON ttc_product_media(variant_id);
